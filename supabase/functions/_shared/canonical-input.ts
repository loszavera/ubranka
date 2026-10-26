import { fingerprint, jpeg, uuid, WardrobeError } from './protocol.ts';
import { base64, sha256 } from './trial.ts';
import type { SupabaseRest } from './rest.ts';

export const CANONICAL_VERSION='p33c-jpeg-v1' as const;
export type CanonicalDescriptor={version:typeof CANONICAL_VERSION;sha256:string;bytes:number;width:number;height:number};
export type SourceInput={photoId:string;path:string;thumbPath:string;bytes:number;thumbBytes:number;fingerprint:string;kind:'body'|'item'};
export type CanonicalInput=SourceInput&{canonical:CanonicalDescriptor};
export function isCanonicalDescriptor(value:unknown):value is CanonicalDescriptor {
 const c=value as CanonicalDescriptor|undefined;
 return !!c&&c.version===CANONICAL_VERSION&&typeof c.sha256==='string'&&/^[a-f0-9]{64}$/.test(c.sha256)
  &&Number.isSafeInteger(c.bytes)&&c.bytes>0&&c.bytes<=1_000_000
  &&Number.isSafeInteger(c.width)&&c.width>0&&c.width<=1024&&Number.isSafeInteger(c.height)&&c.height>0&&c.height<=1536;
}
export function canonicalMatches(a:CanonicalDescriptor,b:CanonicalDescriptor):boolean {
 return isCanonicalDescriptor(a)&&isCanonicalDescriptor(b)&&a.version===b.version&&a.sha256===b.sha256
  &&a.bytes===b.bytes&&a.width===b.width&&a.height===b.height;
}
export async function verifySourceInput(admin:SupabaseRest,p:SourceInput,accountId:string):Promise<Uint8Array>{
 uuid(accountId);uuid(p.photoId);
 const parts=p.path.split('/');
 if(parts.length!==4||parts[0]!==accountId||parts[2]!==p.photoId||parts[3]!=='main.jpg'
  ||p.thumbPath!==p.path.replace(/main\.jpg$/,'thumb.jpg')||!/^[a-f0-9]{64}$/.test(p.fingerprint)
  ||!['body','item'].includes(p.kind)||!Number.isSafeInteger(p.bytes)||p.bytes<1||p.bytes>1_000_000
  ||!Number.isSafeInteger(p.thumbBytes)||p.thumbBytes<1||p.thumbBytes>100_000)throw new WardrobeError('INVALID_MANIFEST');
 uuid(parts[1]);
 const main=await admin.binary(`/storage/v1/object/wardrobe-private/${p.path}`,p.bytes,'image/jpeg');
 const thumb=await admin.binary(`/storage/v1/object/wardrobe-private/${p.thumbPath}`,p.thumbBytes,'image/jpeg');
 if(await fingerprint(main,thumb)!==p.fingerprint)throw new WardrobeError('MANIFEST_MISMATCH');
 jpeg(base64(main),1_000_000);jpeg(base64(thumb),100_000);
 return main;
}
/** Each CPU-heavy transformation has its own bounded Edge invocation. No retry,
 * persistence or external AI: only the same project's authenticated function. */
export async function prepareCanonicalInputs(admin:SupabaseRest,inputs:SourceInput[],accountId:string):Promise<{descriptors:(CanonicalDescriptor&{photoId:string})[];images:Uint8Array[]}>{
 uuid(accountId);
 if(!Array.isArray(inputs)||inputs.length<1||inputs.length>4||new Set(inputs.map(p=>p.photoId)).size!==inputs.length)throw new WardrobeError('INVALID_MANIFEST');
 const output:(CanonicalDescriptor&{photoId:string})[]=[],bytes:Uint8Array[]=[];
 for(const input of inputs){
  let result:{canonical:unknown;jpeg:unknown};
  try{result=await admin.request('/functions/v1/canonical-input',{method:'POST',body:JSON.stringify({accountId,input})}) as typeof result;}
  catch{throw new WardrobeError('INPUT_PREPARATION_FAILED');}
  if(!isCanonicalDescriptor(result?.canonical))throw new WardrobeError('INPUT_PREPARATION_FAILED');
  const image=jpeg(result.jpeg,1_000_000);
  if(image.length!==result.canonical.bytes||await sha256(image)!==result.canonical.sha256)throw new WardrobeError('MANIFEST_MISMATCH');
  output.push({photoId:input.photoId,...result.canonical});bytes.push(image);
 }
 return {descriptors:output,images:bytes};
}
