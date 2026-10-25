import { SupabaseRest } from '../_shared/rest.ts';
import { sha256, verifiedInputs, type TrialPlan } from '../_shared/trial.ts';
import { editImageOnce } from '../_shared/openai-images.ts';
import type { ImageUsage } from '../_shared/visualization.ts';

export type ImageDecoder=(bytes:Uint8Array)=>{main:Uint8Array;thumbnail:Uint8Array;width:number;height:number;metrics:unknown}|Promise<{main:Uint8Array;thumbnail:Uint8Array;width:number;height:number;metrics:unknown}>;
// All durable state lives in PostgreSQL. This function is never scheduled for
// retry and a duplicate invocation cannot pass mark_sent twice.
export async function runVisualizationWorker(environment:(key:string)=>string|undefined,account:string,jobId:string,decode:ImageDecoder) {
  const url=environment('SUPABASE_URL'),serviceKey=environment('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!serviceKey)return;
  const deadline=AbortSignal.timeout(110_000);
  const admin=new SupabaseRest(url,serviceKey,undefined,10_000,deadline);
  const finish=new SupabaseRest(url,serviceKey,undefined,8_000);
  let sent=false,usage:ImageUsage|null=null,publish=false;
  let stage:'input'|'dispatch'|'provider'|'decode'|'manifest'|'upload'='input';
  const started=performance.now(),metrics:Record<string,number|string>={};
  try {
    const rows=await admin.request(`/rest/v1/wardrobe_visualizations?id=eq.${jobId}&account_id=eq.${account}&select=b_case_id,status&limit=1`) as {b_case_id:string|null;status:string}[];
    if(rows.length!==1||!rows[0].b_case_id||rows[0].status!=='reserved')return;
    const plan=await admin.rpc('wardrobe_b_plan',{p_account:account,p_case:rows[0].b_case_id}) as TrialPlan;
    const key=environment('UBRANKA_P33B_OPENAI_KEY');
    if(!key)throw new Error('AI_UNAVAILABLE');
    const inputs=await verifiedInputs(admin,plan,account);metrics.inputMs=performance.now()-started;
    stage='dispatch';sent=await admin.rpc('wardrobe_b_mark_sent',{p_account:account,p_id:jobId,p_hashes:plan.inputHashes,p_prompt_hash:plan.promptSha256}) as boolean;
    if(!sent)return;
    stage='provider';const generated=await editImageOnce(key,plan,inputs,deadline);
    usage=generated.usage;metrics.providerMs=generated.elapsedMs;
    if(!usage)throw new Error('OUTCOME_UNKNOWN');
    if(!generated.png)throw new Error(generated.errorCode??'INVALID_PROVIDER_IMAGE');
    stage='decode';const decodeStart=performance.now(),image=await decode(generated.png);
    metrics.decodeMs=performance.now()-decodeStart;
    if(image.width!==1024||image.height!==1536||image.main.length<1||image.main.length>8_000_000||image.thumbnail.length<1||image.thumbnail.length>100_000)throw new Error('INVALID_PROVIDER_IMAGE');
    const mainHash=await sha256(image.main),thumbHash=await sha256(image.thumbnail);
    metrics.outputSha256=mainHash;metrics.bytes=image.main.length;metrics.thumbBytes=image.thumbnail.length;
    stage='manifest';const manifest=await admin.rpc('wardrobe_b_manifest',{p_account:account,p_job:jobId,p_id:crypto.randomUUID(),p_bytes:image.main.length,
      p_thumb_bytes:image.thumbnail.length,p_sha256:mainHash,p_thumb_sha256:thumbHash}) as {main_path:string;thumb_path:string}|null;
    if(!manifest)throw new Error('CANCELLED');
    stage='upload';const uploadStart=performance.now();
    for(const [path,bytes] of [[manifest.main_path,image.main],[manifest.thumb_path,image.thumbnail]] as const) {
      await admin.request(`/storage/v1/object/wardrobe-results/${path}`,{method:'POST',body:new Uint8Array(bytes).buffer,
        headers:{'Content-Type':'image/png','Cache-Control':'no-store','x-upsert':'false'}});
    }
    metrics.uploadMs=performance.now()-uploadStart;publish=true;
  }catch {
    metrics.failureStage=stage;
    // No exception text, bytes, account, prompt or credentials are logged.
    // Known usage still settles failed output; unknown usage retains the hold.
  }finally {
    metrics.totalMs=performance.now()-started;
    try {
      if(sent)await finish.rpc('wardrobe_b_complete',{p_account:account,p_job:jobId,p_usage:usage,p_publish:publish,p_measurements:metrics});
      else await finish.rpc('wardrobe_b_abort_unsent',{p_account:account,p_job:jobId});
    }catch { /* durable sent watchdog makes unresolved work unknown; never retry */ }
  }
}
