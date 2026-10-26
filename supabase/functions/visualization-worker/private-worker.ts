import { fingerprint, jpeg, uuid, WardrobeError } from '../_shared/protocol.ts';
import { base64, sha256 } from '../_shared/trial.ts';
import type { SupabaseRest } from '../_shared/rest.ts';
import type { ImageUsage } from '../_shared/visualization.ts';
import type { ImageDecoder } from './worker.ts';

export type PrivateInput={photoId:string;path:string;thumbPath:string;bytes:number;thumbBytes:number;fingerprint:string;kind:'body'|'item'};
export type PrivatePlan={jobId:string;accountId:string;inputs:PrivateInput[]};
export type PrivateManifest={main_path:string;thumb_path:string;bucket:'wardrobe-results';thumb_mime_type:'image/jpeg'|'image/png'};
export type PrivatePorts={
  loadInputs():Promise<Uint8Array[]>;
  markSent():Promise<boolean>;
  // Supplied only by the local test adapter in C1. The hosted handler never
  // constructs these ports and has no C provider/key/environment switch.
  generateOnce(inputs:Uint8Array[]):Promise<{png:Uint8Array|null;usage:ImageUsage|null}>;
  manifest(value:{bytes:number;thumbBytes:number;sha256:string;thumbSha256:string;thumbMimeType:'image/jpeg'|'image/png';thumbWidth:number;thumbHeight:number}):Promise<PrivateManifest|null>;
  upload(path:string,bytes:Uint8Array,mime:string):Promise<void>;
  complete(usage:ImageUsage|null,publish:boolean):Promise<unknown>;
};
function validUsage(u:ImageUsage|null):u is ImageUsage {
 return !!u&&[u.textInputTokens,u.imageInputTokens,u.imageOutputTokens].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=100_000_000);
}

export async function verifyPrivateInputs(admin:SupabaseRest,plan:PrivatePlan):Promise<Uint8Array[]> {
 uuid(plan.accountId);uuid(plan.jobId);
 if(plan.inputs.length<2||plan.inputs.length>4||plan.inputs[0].kind!=='body'||plan.inputs.slice(1).some(p=>p.kind!=='item'))throw new WardrobeError('INVALID_MANIFEST');
 if(new Set(plan.inputs.map(p=>p.photoId)).size!==plan.inputs.length)throw new WardrobeError('INVALID_MANIFEST');
 const output:Uint8Array[]=[];
 for(const p of plan.inputs){
  uuid(p.photoId);
  const parts=p.path.split('/');
  if(parts.length!==4||parts[0]!==plan.accountId||parts[2]!==p.photoId||parts[3]!=='main.jpg'
   ||p.thumbPath!==p.path.replace(/main\.jpg$/,'thumb.jpg')||!/^[a-f0-9]{64}$/.test(p.fingerprint)
   ||!Number.isSafeInteger(p.bytes)||p.bytes<1||p.bytes>1_000_000
   ||!Number.isSafeInteger(p.thumbBytes)||p.thumbBytes<1||p.thumbBytes>100_000)throw new WardrobeError('INVALID_MANIFEST');
  uuid(parts[1]);
  const main=await admin.binary(`/storage/v1/object/wardrobe-private/${p.path}`,p.bytes,'image/jpeg');
  const thumb=await admin.binary(`/storage/v1/object/wardrobe-private/${p.thumbPath}`,p.thumbBytes,'image/jpeg');
  if(await fingerprint(main,thumb)!==p.fingerprint)throw new WardrobeError('MANIFEST_MISMATCH');
  jpeg(base64(main),1_000_000);jpeg(base64(thumb),100_000);
  output.push(main);
 }
 return output;
}

// Full C orchestration with one claim and at most one provider invocation.
// Reconciliation is an operator/database action; neither this coordinator nor
// its production RPC adapter loops, retries, schedules or selects another model.
export async function runPrivateVisualization(ports:PrivatePorts,decode:ImageDecoder):Promise<'not-sent'|'settled'|'unresolved'> {
 let inputs:Uint8Array[];
 try {inputs=await ports.loadInputs();if(!await ports.markSent())return 'not-sent';}
 catch{return 'not-sent';} // no call after an uncertain claim acknowledgement
 let usage:ImageUsage|null=null,publish=false;
 try {
  const generated=await ports.generateOnce(inputs);
  usage=validUsage(generated.usage)?generated.usage:null;
  if(!usage||!generated.png)throw new Error('INVALID_OUTPUT');
  const image=await decode(generated.png),mime=image.thumbnailMimeType??'image/png',width=image.thumbnailWidth??120,height=image.thumbnailHeight??180;
  if(image.width!==1024||image.height!==1536||image.main.length<1||image.main.length>8_000_000
   ||image.thumbnail.length<1||image.thumbnail.length>100_000||!['image/jpeg','image/png'].includes(mime)
   ||!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||width>600||height<1||height>900||width*3!==height*2)throw new Error('INVALID_OUTPUT');
  const file=await ports.manifest({bytes:image.main.length,thumbBytes:image.thumbnail.length,sha256:await sha256(image.main),
   thumbSha256:await sha256(image.thumbnail),thumbMimeType:mime,thumbWidth:width,thumbHeight:height});
  if(!file)throw new Error('CANCELLED');
  await ports.upload(file.main_path,image.main,'image/png');
  await ports.upload(file.thumb_path,image.thumbnail,mime);
  publish=true;
 }catch{/* A durable manifest, if any, remains for bounded cleanup. Never retry. */}
 try {await ports.complete(usage,publish);return usage?'settled':'unresolved';}
 catch{return 'unresolved';} // watchdog retains hold; no second POST to provider
}

// Reusable real persistence adapter, with injection confined to the provider
// boundary. C1 does not wire a provider or call this from its HTTP handler.
export function privatePersistencePorts(admin:SupabaseRest,plan:PrivatePlan,generateOnce:PrivatePorts['generateOnce']):PrivatePorts {
 return {
  loadInputs:()=>verifyPrivateInputs(admin,plan),
  markSent:async()=>await admin.rpc('wardrobe_c_mark_sent',{p_id:plan.jobId}) as boolean,
  generateOnce,
  manifest:async v=>await admin.rpc('wardrobe_c_manifest',{p_job:plan.jobId,p_id:crypto.randomUUID(),p_bytes:v.bytes,p_thumb_bytes:v.thumbBytes,
   p_sha:v.sha256,p_thumb_sha:v.thumbSha256,p_thumb_mime:v.thumbMimeType,p_width:v.thumbWidth,p_height:v.thumbHeight}) as PrivateManifest|null,
  upload:async(path,bytes,mime)=>{await admin.request(`/storage/v1/object/wardrobe-results/${path}`,{method:'POST',body:new Uint8Array(bytes).buffer,
   headers:{'Content-Type':mime,'Cache-Control':'no-store','x-upsert':'false'}});},
  complete:(usage,publish)=>admin.rpc('wardrobe_c_complete',{p_id:plan.jobId,p_usage:usage,p_publish:publish}),
 };
}
