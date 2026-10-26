import assert from 'node:assert/strict';
import test from 'node:test';
import {createWorkerHandler} from '../functions/visualization-worker/handler.ts';
import {createCanonicalInputHandler} from '../functions/canonical-input/handler.ts';
import {editPrivateImageOnce,PRIVATE_IMAGE_PARAMS,PRIVATE_IMAGE_PROMPT} from '../functions/_shared/private-images.ts';
import {base64,sha256} from '../functions/_shared/trial.ts';
import {fingerprint} from '../functions/_shared/protocol.ts';
import type {PrivateWorkerPlan} from '../functions/visualization-worker/private-worker.ts';
const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const jpg=Uint8Array.from([255,216,255,192,0,11,8,0,1,0,1,1,1,17,0,255,218,0,8,1,1,0,0,63,0,0,255,217]);
const usage={input_tokens:12,input_tokens_details:{text_tokens:2,image_tokens:10},output_tokens:3,total_tokens:15};
const decode=()=>({main:new Uint8Array([1,2,3]),thumbnail:jpg,width:1024,height:1536,thumbnailMimeType:'image/jpeg' as const,thumbnailWidth:600,thumbnailHeight:900,metrics:{}});
const env=(key:string)=>({SUPABASE_URL:'https://fixture.invalid',SUPABASE_SERVICE_ROLE_KEY:'fixture-service',SUPABASE_ANON_KEY:'fixture-public',UBRANKA_P33C_OPENAI_KEY:'fixture-c-key'} as Record<string,string>)[key];
async function plan():Promise<PrivateWorkerPlan>{
 const hash=await fingerprint(jpg,jpg),canonical={version:'p33c-jpeg-v1' as const,sha256:await sha256(jpg),bytes:jpg.length,width:1,height:1};
 return{jobId:id(9),accountId:id(1),trialId:'p33c-v1',prompt:PRIVATE_IMAGE_PROMPT,params:PRIVATE_IMAGE_PARAMS,safetyIdentifier:'a'.repeat(64),
  keyDeadline:new Date(Date.now()+86400_000).toISOString(),inputs:[0,1].map(n=>({photoId:id(10+n),path:`${id(1)}/${id(20+n)}/${id(10+n)}/main.jpg`,
  thumbPath:`${id(1)}/${id(20+n)}/${id(10+n)}/thumb.jpg`,bytes:jpg.length,thumbBytes:jpg.length,fingerprint:hash,kind:n?'item':'body',canonical}))};
}
test('C provider sends pinned single multipart request with only approved bytes, fixed prompt and pseudonym',async()=>{
 let calls=0;
 const transport:typeof fetch=async(url,init)=>{
  calls++;assert.equal(String(url),'https://api.openai.com/v1/images/edits');assert.equal(init?.redirect,'error');assert.equal(init?.method,'POST');
  const form=init!.body as FormData;for(const [name,value] of Object.entries(PRIVATE_IMAGE_PARAMS))assert.equal(form.get(name),String(value));
  assert.equal(form.get('prompt'),PRIVATE_IMAGE_PROMPT);assert.equal(form.get('safety_identifier'),'c'.repeat(64));
  assert.deepEqual([...form.keys()].sort(),[...Object.keys(PRIVATE_IMAGE_PARAMS),'prompt','safety_identifier','image[]','image[]'].sort());
  for(const image of form.getAll('image[]') as File[])assert.deepEqual(new Uint8Array(await image.arrayBuffer()),jpg);
  return Response.json({usage,data:[{b64_json:'AQ=='}]},{headers:{'x-request-id':'req_fixture'}});
 };
 const result=await editPrivateImageOnce('fixture-key',[jpg,jpg],'c'.repeat(64),AbortSignal.timeout(1000),transport);
 assert.equal(calls,1);assert.equal(result.requestId,'req_fixture');assert.deepEqual(result.usage,{textInputTokens:2,imageInputTokens:10,imageOutputTokens:3});
 await assert.rejects(editPrivateImageOnce('fixture-key',[jpg,jpg],'email@example.com',AbortSignal.timeout(1000),transport));assert.equal(calls,1);
 const failed=await editPrivateImageOnce('fixture-key',[jpg,jpg],'c'.repeat(64),AbortSignal.timeout(1000),async()=>{calls++;throw Error('lost');});
 assert.equal(calls,2);assert.equal(failed.errorCode,'OUTCOME_UNKNOWN');assert.equal(failed.usage,null);
});
test('HTTP C handler verifies regenerated copies before a single durable claim and send, then settles safe measurements',async()=>{
 const original=globalThis.fetch,p=await plan(),events:string[]=[],tasks:Promise<unknown>[]=[];let claimed=false;
 globalThis.fetch=async(url,init)=>{
  const path=new URL(String(url)).pathname;events.push(path);
  if(path.endsWith('/wardrobe_worker_authorized'))return Response.json(true);
  if(path.endsWith('/wardrobe_c_worker_plan'))return Response.json(p);
  if(path==='/functions/v1/canonical-input')return Response.json({jpeg:base64(jpg),canonical:p.inputs[0].canonical});
  if(path.endsWith('/wardrobe_c_mark_sent')){const allow=!claimed;claimed=true;return Response.json(allow);}
  if(path.endsWith('/images/edits'))return Response.json({usage,data:[{b64_json:'AQ=='}]},{headers:{'x-request-id':'req_c_fixture'}});
  if(path.endsWith('/wardrobe_c_manifest'))return Response.json({main_path:'main.png',thumb_path:'thumb.jpg',bucket:'wardrobe-results',thumb_mime_type:'image/jpeg'});
  if(path.startsWith('/storage/v1/object/wardrobe-results/'))return Response.json({});
  if(path.endsWith('/wardrobe_c_abort_unsent'))return Response.json(false);
  if(path.endsWith('/wardrobe_c_complete')){
   const b=JSON.parse(init?.body as string);assert.equal(b.p_publish,true);assert.equal(b.p_measurements.providerResponseId,'req_c_fixture');
   assert.deepEqual(b.p_usage,{textInputTokens:2,imageInputTokens:10,imageOutputTokens:3});
   assert.ok(Object.keys(b.p_measurements).every(k=>['inputMs','providerMs','decodeMs','uploadMs','totalMs','providerResponseId'].includes(k)));
   return Response.json({});
  }throw Error(`Unexpected fixture request ${path}`);
 };
 try{
  const handler=createWorkerHandler(env,t=>tasks.push(t),decode);
  const request=()=>new Request('https://worker.invalid',{method:'POST',headers:{Authorization:'Bearer fixture'},body:JSON.stringify({jobId:p.jobId,accountId:p.accountId})});
  assert.equal((await handler(request())).status,202);await Promise.all(tasks);
  assert.equal((await handler(request())).status,202);await Promise.all(tasks);
  assert.equal(events.filter(x=>x==='/v1/images/edits').length,1);
  assert.ok(events.indexOf('/rest/v1/rpc/wardrobe_c_mark_sent')<events.indexOf('/v1/images/edits'));
  const wrong=await handler(new Request('https://worker.invalid',{method:'POST',headers:{Authorization:'Bearer fixture'},body:JSON.stringify({jobId:p.jobId,accountId:p.accountId,caseId:'B01'})}));
  assert.equal(wrong.status,400);assert.equal(events.filter(x=>x==='/v1/images/edits').length,1);
 }finally{globalThis.fetch=original;}
});
test('changed canonical bytes abort before mark_sent; no fallback or provider request',async()=>{
 const original=globalThis.fetch,p=await plan(),tasks:Promise<unknown>[]=[];let aborted=0;
 p.inputs[0].canonical={...p.inputs[0].canonical,sha256:'b'.repeat(64)};
 globalThis.fetch=async(url)=>{
  const path=new URL(String(url)).pathname;
  if(path.endsWith('/wardrobe_worker_authorized'))return Response.json(true);
  if(path.endsWith('/wardrobe_c_worker_plan'))return Response.json(p);
  if(path==='/functions/v1/canonical-input')return Response.json({jpeg:base64(jpg),canonical:p.inputs[1].canonical});
  if(path.endsWith('/wardrobe_c_abort_unsent')){aborted++;return Response.json(true);}
  assert.fail(`Unexpected request ${path}`);
 };
 try{const handler=createWorkerHandler(env,t=>tasks.push(t),decode);assert.equal((await handler(new Request('https://worker.invalid',{
  method:'POST',headers:{Authorization:'Bearer fixture'},body:JSON.stringify({jobId:p.jobId,accountId:p.accountId})}))).status,202);
  await Promise.all(tasks);assert.equal(aborted,1);
 }finally{globalThis.fetch=original;}
});
test('canonical service validates source fingerprints and produces no provider or persisted copy',async()=>{
 const original=globalThis.fetch,p=await plan();let canonicalized=0;
 globalThis.fetch=async(url)=>{
  const path=new URL(String(url)).pathname;
  if(path.endsWith('/wardrobe_worker_authorized'))return Response.json(true);
  assert.ok(path.startsWith('/storage/v1/object/wardrobe-private/'));return new Response(jpg,{headers:{'Content-Type':'image/jpeg'}});
 };
 const handler=createCanonicalInputHandler(env,async(source)=>{canonicalized++;assert.deepEqual(source,jpg);return{bytes:jpg,sha256:await sha256(jpg),width:1,height:1,version:'p33c-jpeg-v1'};});
 try{
  const request=(input:unknown)=>new Request('https://canonical.invalid',{method:'POST',headers:{Authorization:'Bearer fixture'},body:JSON.stringify({accountId:p.accountId,input})});
  const response=await handler(request(p.inputs[0]));assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal((await response.json()).canonical.sha256,await sha256(jpg));
  assert.equal((await handler(request({...p.inputs[0],fingerprint:'f'.repeat(64)}))).status,400);assert.equal(canonicalized,1);
 }finally{globalThis.fetch=original;}
});
