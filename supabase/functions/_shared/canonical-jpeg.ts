import decodeJpeg, { init as initDecoder } from 'npm:@jsquash/jpeg@1.6.0/decode.js';
import encodeJpeg from './vendor/bounded-jpeg-encoder.js';
import { gunzipSync } from 'node:zlib';
import { DECODER } from './vendor/canonical-wasm.ts';
import { jpeg, WardrobeError } from './protocol.ts';
import { base64, sha256 } from './trial.ts';
import { CANONICAL_VERSION } from './canonical-input.ts';

export { CANONICAL_VERSION } from './canonical-input.ts';
export type CanonicalJpeg = {bytes:Uint8Array;sha256:string;width:number;height:number;version:typeof CANONICAL_VERSION};
export type Canonicalizer = (source:Uint8Array)=>Promise<CanonicalJpeg>;

let ready:Promise<void>|undefined;
function initialize(){
  return ready??=(async()=>{
    const binary=(value:string)=>gunzipSync(Uint8Array.from(atob(value),c=>c.charCodeAt(0)),{maxOutputLength:300_000});
    await initDecoder({wasmBinary:binary(DECODER)});
  })();
}

// The pinned baseline encoder only places optional APP/COM segments before SOS.
// Strip even non-personal JFIF so the preview's metadata check is unambiguous.
function stripMetadata(source:Uint8Array){
 const parts:Uint8Array[]=[source.subarray(0,2)];let offset=2;
 while(offset<source.length){
  const start=offset;if(source[offset++]!==255)throw new Error();
  while(source[offset]===255)offset++;const marker=source[offset++];
  if(marker===218){parts.push(source.subarray(start));break;}
  const length=(source[offset]<<8)|source[offset+1];if(length<2||offset+length>source.length)throw new Error();
  offset+=length;if(!(marker>=224&&marker<=239)&&marker!==254)parts.push(source.subarray(start,offset));
 }
 const output=new Uint8Array(parts.reduce((sum,p)=>sum+p.length,0));let at=0;
 for(const part of parts){output.set(part,at);at+=part.length;}return output;
}

/** Decode only bounded, metadata-free wardrobe inputs, then encode pixels only.
 * The fixed version, resampling and quality make regeneration byte-identical.
 * No original is overwritten and no prepared copy is persisted. */
export const canonicalizeJpeg:Canonicalizer = async(source)=>{
  try {
    jpeg(base64(source),1_000_000);
    await initialize();
    const image=await decodeJpeg(new Uint8Array(source).buffer);
    const sourceWidth=image.width,sourceHeight=image.height,sourcePixels=image.data;
    if(sourceWidth<1||sourceWidth>1600||sourceHeight<1||sourceHeight>1600)throw new Error();
    const scale=Math.min(1,1024/sourceWidth,1536/sourceHeight);
    const width=Math.max(1,Math.floor(sourceWidth*scale)),height=Math.max(1,Math.floor(sourceHeight*scale));
    const pixels=new Uint8Array(width*height*4);
    const sx=sourceWidth/width,sy=sourceHeight/height,area=sx*sy;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const x0=x*sx,x1=(x+1)*sx,y0=y*sy,y1=(y+1)*sy;let r=0,g=0,b=0;
      for(let iy=Math.floor(y0);iy<Math.min(sourceHeight,Math.ceil(y1));iy++){
        const wy=Math.min(y1,iy+1)-Math.max(y0,iy);
        for(let ix=Math.floor(x0);ix<Math.min(sourceWidth,Math.ceil(x1));ix++){
          const weight=wy*(Math.min(x1,ix+1)-Math.max(x0,ix)),at=(iy*sourceWidth+ix)*4;
          r+=sourcePixels[at]*weight;g+=sourcePixels[at+1]*weight;b+=sourcePixels[at+2]*weight;
        }
      }
      const at=(y*width+x)*4;pixels[at]=Math.round(r/area);pixels[at+1]=Math.round(g/area);
      pixels[at+2]=Math.round(b/area);pixels[at+3]=255;
    }
    // A finite lower-quality fallback is local preparation, never another AI call.
    for(const quality of [82,65]){
      let encoded:Uint8Array;
      try{encoded=encodeJpeg({data:pixels,width,height},quality).data;}
      catch(error){if(error instanceof RangeError&&error.message==='JPEG_OUTPUT_LIMIT')continue;throw error;}
      const bytes=stripMetadata(encoded);
      if(bytes.length<=1_000_000){
        jpeg(base64(bytes),1_000_000);
        return {bytes,sha256:await sha256(bytes),width,height,version:CANONICAL_VERSION};
      }
    }
  }catch { /* Source bytes and decoder errors are deliberately not logged. */ }
  throw new WardrobeError('INPUT_PREPARATION_FAILED');
};

