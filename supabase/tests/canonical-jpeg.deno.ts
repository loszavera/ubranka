import {strict as assert} from 'node:assert';
import jpeg from 'npm:jpeg-js@0.4.4';
import {canonicalizeJpeg,CANONICAL_VERSION} from '../functions/_shared/canonical-jpeg.ts';
import {sha256} from '../functions/_shared/trial.ts';
import encodeBounded from '../functions/_shared/vendor/bounded-jpeg-encoder.js';

function source(width:number,height:number,noise=false){
 const pixels=new Uint8Array(width*height*4);let seed=29;
 for(let i=0;i<pixels.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  pixels[i]=i%4===3?255:noise?seed>>>24:127;}
 return new Uint8Array(jpeg.encode({data:pixels,width,height},noise?20:85).data);
}
Deno.test('canonical copies preserve aspect, bound dimensions and deterministically reproduce approved bytes',async()=>{
 for(const [w,h] of [[1600,1600],[900,1600],[1600,900],[320,480]]){
  const input=source(w,h),before=await sha256(input),a=await canonicalizeJpeg(input),b=await canonicalizeJpeg(input);
  assert.equal(a.version,CANONICAL_VERSION);assert.equal(a.sha256,b.sha256);assert.deepEqual(a.bytes,b.bytes);
  assert.equal(await sha256(input),before);assert.ok(a.width<=1024&&a.height<=1536&&a.bytes.length<=1_000_000);
  assert.ok(Math.abs(a.width/a.height-w/h)<0.002);const decoded=jpeg.decode(a.bytes,{useTArray:true});
  assert.equal(decoded.width,a.width);assert.equal(decoded.height,a.height);
  const header=new TextDecoder('latin1').decode(a.bytes);
  for(const marker of ['Exif','ICC_PROFILE','http://ns.adobe.com/xap'])assert.ok(!header.includes(marker));
 }
});
Deno.test('invalid or metadata-bearing sources fail before any provider interaction',async()=>{
 await assert.rejects(canonicalizeJpeg(new Uint8Array([1,2,3])),/INPUT_PREPARATION_FAILED/);
 const jpg=source(2,2),withExif=new Uint8Array(jpg.length+10);withExif.set(jpg.subarray(0,2));
 withExif.set([255,225,0,8,69,120,105,102,0,0],2);withExif.set(jpg.subarray(2),12);
 await assert.rejects(canonicalizeJpeg(withExif),/INPUT_PREPARATION_FAILED/);
});
Deno.test('maximum-dimension noisy source still fits canonical bounds',async()=>{
 const input=source(1600,1600,true);assert.ok(input.length<=1_000_000);
 const copy=await canonicalizeJpeg(input);assert.ok(copy.bytes.length<=1_000_000);assert.equal(copy.width,1024);assert.equal(copy.height,1024);
});
Deno.test('bounded encoder preserves upstream bytes and stops at its fixed output capacity',()=>{
 const data=new Uint8Array(256*256*4);let seed=71;
 for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=i%4===3?255:seed>>>24;}
 for(const quality of [82,65,82]){
  const source={data,width:256,height:256};assert.deepEqual(encodeBounded(source,quality).data,new Uint8Array(jpeg.encode(source,quality).data));
 }
 const large=new Uint8Array(1024*1536*4);for(let i=0;i<large.length;i++)large[i]=data[i%data.length];
 assert.throws(()=>encodeBounded({data:large,width:1024,height:1536},100),/JPEG_OUTPUT_LIMIT/);
});
