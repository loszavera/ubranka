import { uuid, WardrobeError } from '../_shared/protocol.ts';
import { sha256 } from '../_shared/trial.ts';
import { SupabaseRest } from '../_shared/rest.ts';
import type { ImageUsage } from '../_shared/visualization.ts';
import type { ImageDecoder } from './worker.ts';
import { canonicalMatches, prepareCanonicalInputs, verifySourceInput, type CanonicalInput, type SourceInput } from '../_shared/canonical-input.ts';
import { editPrivateImageOnce, PRIVATE_IMAGE_PROMPT, validPrivateParameters } from '../_shared/private-images.ts';
import { serverKey } from '../_shared/service-auth.ts';

export type PrivateInput=SourceInput;
export type PrivatePlan={jobId:string;accountId:string;inputs:PrivateInput[]};
export type PrivateWorkerPlan=Omit<PrivatePlan,'inputs'>&{inputs:CanonicalInput[];trialId:string;prompt:string;params:Record<string,unknown>;safetyIdentifier:string;keyDeadline:string};
export type PrivateMeasurements=Record<string,string|number>;
export type PrivateManifest={main_path:string;thumb_path:string;bucket:'wardrobe-results';thumb_mime_type:'image/jpeg'|'image/png'};
export type PrivatePorts={
  loadInputs():Promise<Uint8Array[]>;
  markSent():Promise<boolean>;
  generateOnce(inputs:Uint8Array[]):Promise<{png:Uint8Array|null;usage:ImageUsage|null;requestId?:string|null;elapsedMs?:number;errorCode?:string|null}>;
  manifest(value:{bytes:number;thumbBytes:number;sha256:string;thumbSha256:string;thumbMimeType:'image/jpeg'|'image/png';thumbWidth:number;thumbHeight:number}):Promise<PrivateManifest|null>;
  upload(path:string,bytes:Uint8Array,mime:string):Promise<void>;
  complete(usage:ImageUsage|null,publish:boolean,measurements?:PrivateMeasurements):Promise<unknown>;
  abortUnsent?():Promise<unknown>;
};
function validUsage(u:ImageUsage|null):u is ImageUsage {
 return !!u&&[u.textInputTokens,u.imageInputTokens,u.imageOutputTokens].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=100_000_000);
}

export async function verifyPrivateInputs(admin:SupabaseRest,plan:PrivatePlan):Promise<Uint8Array[]> {
 uuid(plan.accountId);uuid(plan.jobId);
 if(plan.inputs.length<2||plan.inputs.length>4||plan.inputs[0].kind!=='body'||plan.inputs.slice(1).some(p=>p.kind!=='item'))throw new WardrobeError('INVALID_MANIFEST');
 if(new Set(plan.inputs.map(p=>p.photoId)).size!==plan.inputs.length)throw new WardrobeError('INVALID_MANIFEST');
 const output:Uint8Array[]=[];
 for(const p of plan.inputs)output.push(await verifySourceInput(admin,p,plan.accountId));
 return output;
}

// Full C orchestration with one claim and at most one provider invocation.
// Reconciliation is an operator/database action; neither this coordinator nor
// its production RPC adapter loops, retries, schedules or selects another model.
export async function runPrivateVisualization(ports:PrivatePorts,decode:ImageDecoder):Promise<'not-sent'|'settled'|'unresolved'> {
 const start=performance.now(),measurements:PrivateMeasurements={};let stage='input';
 let inputs:Uint8Array[];
 try {inputs=await ports.loadInputs();measurements.inputMs=performance.now()-start;stage='dispatch';
  if(!await ports.markSent()){await ports.abortUnsent?.();return 'not-sent';}}
 catch{try{await ports.abortUnsent?.();}catch{/* Only reserved rows can be aborted; uncertain sent claims retain their hold. */}return 'not-sent';}
 let usage:ImageUsage|null=null,publish=false;
 try {
  stage='provider';const providerStart=performance.now();
  const generated=await ports.generateOnce(inputs);
  measurements.providerMs=performance.now()-providerStart;
  if(generated.requestId&&/^[A-Za-z0-9_-]{1,128}$/.test(generated.requestId))measurements.providerResponseId=generated.requestId;
  usage=validUsage(generated.usage)?generated.usage:null;
  if(!usage||!generated.png)throw new Error('INVALID_OUTPUT');
  stage='decode';const decodeStart=performance.now();
  const image=await decode(generated.png),mime=image.thumbnailMimeType??'image/png',width=image.thumbnailWidth??120,height=image.thumbnailHeight??180;
  measurements.decodeMs=performance.now()-decodeStart;
  if(image.width!==1024||image.height!==1536||image.main.length<1||image.main.length>8_000_000
   ||image.thumbnail.length<1||image.thumbnail.length>100_000||!['image/jpeg','image/png'].includes(mime)
   ||!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||width>600||height<1||height>900||width*3!==height*2)throw new Error('INVALID_OUTPUT');
  stage='manifest';const file=await ports.manifest({bytes:image.main.length,thumbBytes:image.thumbnail.length,sha256:await sha256(image.main),
   thumbSha256:await sha256(image.thumbnail),thumbMimeType:mime,thumbWidth:width,thumbHeight:height});
  if(!file)throw new Error('CANCELLED');
  stage='upload';const uploadStart=performance.now();await ports.upload(file.main_path,image.main,'image/png');
  await ports.upload(file.thumb_path,image.thumbnail,mime);
  measurements.uploadMs=performance.now()-uploadStart;
  publish=true;
 }catch{measurements.failureStage=stage;measurements.stopReason=usage?'OUTPUT_UNAVAILABLE':'OUTCOME_UNKNOWN';}
 measurements.totalMs=performance.now()-start;
 try {await ports.complete(usage,publish,measurements);return usage?'settled':'unresolved';}
 catch{return 'unresolved';} // watchdog retains hold; no second POST to provider
}

export function privatePersistencePorts(admin:SupabaseRest,plan:PrivateWorkerPlan,generateOnce:PrivatePorts['generateOnce'],finish:SupabaseRest=admin):PrivatePorts {
 return {
  loadInputs:async()=>{
   const prepared=await prepareCanonicalInputs(admin,plan.inputs,plan.accountId);
   if(prepared.descriptors.some((p,n)=>p.photoId!==plan.inputs[n].photoId||!canonicalMatches(p,plan.inputs[n].canonical)))throw new WardrobeError('MANIFEST_MISMATCH');
   return prepared.images;
  },
  markSent:async()=>await admin.rpc('wardrobe_c_mark_sent',{p_id:plan.jobId}) as boolean,
  generateOnce,
  manifest:async v=>await admin.rpc('wardrobe_c_manifest',{p_job:plan.jobId,p_id:crypto.randomUUID(),p_bytes:v.bytes,p_thumb_bytes:v.thumbBytes,
   p_sha:v.sha256,p_thumb_sha:v.thumbSha256,p_thumb_mime:v.thumbMimeType,p_width:v.thumbWidth,p_height:v.thumbHeight}) as PrivateManifest|null,
  upload:async(path,bytes,mime)=>{await admin.request(`/storage/v1/object/wardrobe-results/${path}`,{method:'POST',body:new Uint8Array(bytes).buffer,
   headers:{'Content-Type':mime,'Cache-Control':'no-store','x-upsert':'false'}});},
  complete:(usage,publish,measurements)=>finish.rpc('wardrobe_c_complete',{p_id:plan.jobId,p_usage:usage,p_publish:publish,p_measurements:measurements??{}}),
  abortUnsent:()=>finish.rpc('wardrobe_c_abort_unsent',{p_id:plan.jobId}),
 };
}

/** Resolve the SQL-authorized C job before reading its dedicated credential.
 * B is deliberately unreachable from this production dispatch path. */
export async function createPrivateWorkerTask(environment:(key:string)=>string|undefined,account:string,jobId:string,decode:ImageDecoder):Promise<(()=>Promise<void>)|null>{
 uuid(account);uuid(jobId);const url=environment('SUPABASE_URL'),service=serverKey(environment);
 if(!url||!service)throw new WardrobeError('SERVICE_UNAVAILABLE',503);
 const finish=new SupabaseRest(url,service,undefined,8_000);
 const plan=await finish.rpc('wardrobe_c_worker_plan',{p_account:account,p_id:jobId}) as PrivateWorkerPlan|null;
 if(!plan)return null;
 if(plan.jobId!==jobId||plan.accountId!==account||plan.trialId!=='p33c-v1'||plan.prompt!==PRIVATE_IMAGE_PROMPT
  ||!validPrivateParameters(plan.params)||!/^[a-f0-9]{64}$/.test(plan.safetyIdentifier)
  ||!Number.isFinite(Date.parse(plan.keyDeadline))||Date.parse(plan.keyDeadline)<=Date.now()
  ||!Array.isArray(plan.inputs)||plan.inputs.length<2||plan.inputs.length>4||plan.inputs[0].kind!=='body'
  ||plan.inputs.slice(1).some(p=>p.kind!=='item')||new Set(plan.inputs.map(p=>p.photoId)).size!==plan.inputs.length){
  await finish.rpc('wardrobe_c_abort_unsent',{p_id:jobId});throw new WardrobeError('INVALID_MANIFEST');
 }
 const key=environment('UBRANKA_P33C_OPENAI_KEY');
 if(!key){await finish.rpc('wardrobe_c_abort_unsent',{p_id:jobId});throw new WardrobeError('AI_UNAVAILABLE',503);}
 return async()=>{
  const deadline=AbortSignal.timeout(110_000),admin=new SupabaseRest(url,service,undefined,15_000,deadline);
  const ports=privatePersistencePorts(admin,plan,images=>editPrivateImageOnce(key,images,plan.safetyIdentifier,deadline),finish);
  await runPrivateVisualization(ports,decode);
 };
}
