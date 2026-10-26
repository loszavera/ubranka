import { parseImageResponse } from './openai-images.ts';
import type { ProviderResult } from './openai-images.ts';
import { WardrobeError } from './protocol.ts';

export const PRIVATE_IMAGE_PARAMS=Object.freeze({model:'gpt-image-2.5-flare-2026-09-08',n:1,
 quality:'medium',size:'1024x1536',output_format:'png',background:'opaque',moderation:'auto'});
// No account names, wardrobe labels, measurements or client-authored instructions.
export const PRIVATE_IMAGE_PROMPT='Create one realistic full-body outfit visualization. The first image shows the consenting adult participant. Preserve this person and their body proportions. The following images show the selected clothing items. Dress the participant in those items, preserving their colors, cut, patterns and visible details. Use a calm neutral background. Do not add people, text, logos or unrequested accessories. This is a visual illustration, not evidence of garment size or physical fit.';
export function validPrivateParameters(params:Record<string,unknown>):boolean {
 return !!params&&Object.keys(params).length===Object.keys(PRIVATE_IMAGE_PARAMS).length
  &&Object.entries(PRIVATE_IMAGE_PARAMS).every(([key,value])=>params[key]===value);
}
export type PrivateProviderResult=ProviderResult&{requestId:string|null};
export async function editPrivateImageOnce(key:string,inputs:Uint8Array[],safetyIdentifier:string,
 signal:AbortSignal,transport:typeof fetch=fetch):Promise<PrivateProviderResult>{
 if(!key||inputs.length<2||inputs.length>4||!/^[a-f0-9]{64}$/.test(safetyIdentifier))throw new WardrobeError('INVALID_MANIFEST');
 const started=performance.now(),form=new FormData();
 for(const [name,value] of Object.entries(PRIVATE_IMAGE_PARAMS))form.append(name,String(value));
 form.append('prompt',PRIVATE_IMAGE_PROMPT);form.append('safety_identifier',safetyIdentifier);
 for(let n=0;n<inputs.length;n++)form.append('image[]',new Blob([new Uint8Array(inputs[n]).buffer],{type:'image/jpeg'}),`input-${n+1}.jpg`);
 let requestId:string|null=null;
 try{
  const response=await transport('https://api.openai.com/v1/images/edits',{method:'POST',redirect:'error',
   headers:{Authorization:`Bearer ${key}`},body:form,signal:AbortSignal.any([signal,AbortSignal.timeout(90_000)])});
  const id=response.headers.get('x-request-id');if(id&&/^[A-Za-z0-9_-]{1,128}$/.test(id))requestId=id;
  return {...await parseImageResponse(response),requestId,elapsedMs:performance.now()-started};
 }catch{return{usage:null,png:null,errorCode:'OUTCOME_UNKNOWN',requestId,elapsedMs:performance.now()-started};}
}
