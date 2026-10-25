import { TRIAL_PARAMS, type TrialPlan } from './trial.ts';
import type { ImageUsage } from './visualization.ts';

export type ProviderResult = {usage: ImageUsage | null; png: Uint8Array | null; elapsedMs: number; errorCode: string | null};
function object(v:unknown): Record<string,unknown> {return v!==null && typeof v==='object'?v as Record<string,unknown>:{};}
function count(v:unknown): v is number {return typeof v==='number' && Number.isSafeInteger(v) && v>=0 && v<=100_000_000;}
export function imageUsage(value:unknown): ImageUsage | null {
  const u=object(value),input=object(u.input_tokens_details),output=object(u.output_tokens_details);
  if(![u.input_tokens,u.output_tokens,u.total_tokens,input.text_tokens,input.image_tokens].every(count))return null;
  const text=input.text_tokens as number,image=input.image_tokens as number,out=u.output_tokens as number;
  if(u.input_tokens!==text+image || u.total_tokens!==text+image+out)return null;
  if(u.output_tokens_details!==undefined && (output.text_tokens!==0 || output.image_tokens!==out))return null;
  return {textInputTokens:text,imageInputTokens:image,imageOutputTokens:out};
}
async function boundedJson(response:Response):Promise<Record<string,unknown>> {
  const maximum=11_000_000;
  if(Number(response.headers.get('content-length'))>maximum || !response.body)throw new Error('PROVIDER_RESPONSE_LIMIT');
  const reader=response.body.getReader(),chunks:Uint8Array[]=[];let length=0;
  while(true){const part=await reader.read();if(part.done)break;length+=part.value.length;
    if(length>maximum){await reader.cancel();throw new Error('PROVIDER_RESPONSE_LIMIT');}chunks.push(part.value);}
  const bytes=new Uint8Array(length);let at=0;for(const c of chunks){bytes.set(c,at);at+=c.length;}
  return object(JSON.parse(new TextDecoder().decode(bytes)));
}
export async function parseImageResponse(response:Response):Promise<Omit<ProviderResult,'elapsedMs'>> {
  const json=await boundedJson(response),usage=imageUsage(json.usage);
  if(!response.ok)return {usage,png:null,errorCode:'PROVIDER_ERROR'};
  const data=json.data;
  if(!Array.isArray(data)||data.length!==1)return {usage,png:null,errorCode:'INVALID_PROVIDER_IMAGE'};
  const encoded=object(data[0]).b64_json;
  if(typeof encoded!=='string'||encoded.length>10_666_668||!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded))return {usage,png:null,errorCode:'INVALID_PROVIDER_IMAGE'};
  let png:Uint8Array;
  try{const binary=atob(encoded);png=new Uint8Array(binary.length);for(let n=0;n<binary.length;n++)png[n]=binary.charCodeAt(n);}
  catch{return {usage,png:null,errorCode:'INVALID_PROVIDER_IMAGE'};}
  if(png.length>8_000_000)return {usage,png:null,errorCode:'INVALID_PROVIDER_IMAGE'};
  return {usage,png,errorCode:null};
}
// Exactly one raw fetch. No SDK retry defaults, redirects, fallback endpoint,
// public URLs, Files API, streaming or secondary text model.
export async function editImageOnce(key:string,plan:TrialPlan,inputs:Uint8Array[],signal:AbortSignal,transport:typeof fetch=fetch):Promise<ProviderResult> {
  const started=performance.now();const form=new FormData();
  for(const [name,value] of Object.entries(TRIAL_PARAMS))form.append(name,String(value));
  form.append('prompt',plan.prompt);
  for(let n=0;n<inputs.length;n++)form.append('image[]',new Blob([new Uint8Array(inputs[n]).buffer],{type:'image/jpeg'}),`input-${n+1}.jpg`);
  try{
    const response=await transport('https://api.openai.com/v1/images/edits',{method:'POST',redirect:'error',
      headers:{Authorization:`Bearer ${key}`},body:form,signal:AbortSignal.any([signal,AbortSignal.timeout(90_000)])});
    return {...await parseImageResponse(response),elapsedMs:performance.now()-started};
  }catch{return {usage:null,png:null,elapsedMs:performance.now()-started,errorCode:'OUTCOME_UNKNOWN'};}
}
