import assert from 'node:assert/strict';
import test from 'node:test';
import { TRIAL_PARAMS,sha256,verifiedInputs,type TrialPlan } from '../functions/_shared/trial.ts';
import { imageUsage,editImageOnce } from '../functions/_shared/openai-images.ts';
import { SupabaseRest } from '../functions/_shared/rest.ts';
import { createWorkerHandler } from '../functions/visualization-worker/handler.ts';
import { runVisualizationWorker } from '../functions/visualization-worker/worker.ts';
import { privatePhotoResponse } from '../functions/_shared/photo-read.ts';
import { createWardrobeHandler } from '../functions/wardrobe/handler.ts';

const account='00000000-0000-4000-8000-000000000001',job='00000000-0000-4000-8000-000000000900',file='00000000-0000-4000-8000-000000000901';
const jpeg=Uint8Array.from([255,216,255,192,0,11,8,0,1,0,1,1,1,17,0,255,218,0,8,1,1,0,0,63,0,0,255,217]);
const prompt='Dress this fictional adult in the separate synthetic garments.';
const plan:TrialPlan={caseId:'B01',prompt,promptSha256:await sha256(new TextEncoder().encode(prompt)),params:{...TRIAL_PARAMS},
  inputHashes:Array(4).fill(await sha256(jpeg)),inputs:Array.from({length:4},()=>({path:`${account}/${account}/${file}/main.jpg`,bytes:jpeg.length}))};
const rawUsage={input_tokens:3302,input_tokens_details:{text_tokens:230,image_tokens:3072},output_tokens:343,total_tokens:3645};
const normalized={textInputTokens:230,imageInputTokens:3072,imageOutputTokens:343};
const fakePng=Uint8Array.from([137,80,78,71,13,10,26,10]);
const env=(key:string)=>({SUPABASE_URL:'https://synthetic.invalid',SUPABASE_ANON_KEY:'public-test',SUPABASE_SERVICE_ROLE_KEY:'service-test',UBRANKA_P33B_OPENAI_KEY:'synthetic-not-a-key'}[key]);
const decode=()=>({main:fakePng,thumbnail:fakePng,width:1024,height:1536,metrics:{elapsedMs:1}});

test('actual input bytes, prompt, fixed parameters, canonical owned JPEG paths and size are checked before admission',async()=>{
  const admin={binary:async()=>jpeg} as unknown as SupabaseRest;
  assert.equal((await verifiedInputs(admin,plan,account)).length,4);
  for(const forged of [{...plan,prompt:prompt+'changed'},{...plan,params:{...TRIAL_PARAMS,n:2}},
    {...plan,inputHashes:['0'.repeat(64),...plan.inputHashes.slice(1)]},
    {...plan,inputs:[{...plan.inputs[0],path:`foreign/${account}/${file}/main.jpg`},...plan.inputs.slice(1)]}])
    await assert.rejects(verifiedInputs(admin,forged,account),/MANIFEST_MISMATCH/);
  const changed={binary:async()=>Uint8Array.from([...jpeg,1])} as unknown as SupabaseRest;
  await assert.rejects(verifiedInputs(changed,plan,account),/MANIFEST_MISMATCH/);
});
test('provider uses one multipart request, exact model/params and private bytes; errors/timeouts never retry',async()=>{
  let calls=0;
  const transport:typeof fetch=async(input,init)=>{
    calls++;assert.equal(input,'https://api.openai.com/v1/images/edits');assert.equal(init?.redirect,'error');
    const form=init?.body as FormData;assert.equal(form.get('model'),TRIAL_PARAMS.model);assert.equal(form.get('n'),'1');assert.equal(form.getAll('image[]').length,4);
    assert.equal(form.has('input_fidelity'),false);assert.equal(form.has('image_url'),false);
    return Response.json({usage:rawUsage,data:[{b64_json:Buffer.from(fakePng).toString('base64')}]});
  };
  const result=await editImageOnce('synthetic-test',plan,[jpeg,jpeg,jpeg,jpeg],new AbortController().signal,transport);
  assert.equal(calls,1);assert.deepEqual(result.usage,normalized);assert.deepEqual(result.png,fakePng);
  for(const fail of [async()=>{calls++;throw new Error('timeout');},async()=>{calls++;return Response.json({error:{private:'do not log'}},{status:500});}]) {
    calls=0;const out=await editImageOnce('synthetic-test',plan,[jpeg],new AbortController().signal,fail);
    assert.equal(calls,1);assert.equal(out.usage,null);assert.equal(out.png,null);
  }
});
test('all usage components must agree; oversized/malformed output keeps known usage without fake free success',async()=>{
  assert.deepEqual(imageUsage(rawUsage),normalized);
  for(const value of [{...rawUsage,total_tokens:0},{...rawUsage,input_tokens_details:{text_tokens:230}},
    {...rawUsage,output_tokens_details:{image_tokens:342,text_tokens:1}},null])assert.equal(imageUsage(value),null);
  const result=await editImageOnce('synthetic-test',plan,[jpeg],new AbortController().signal,async()=>Response.json({usage:rawUsage,data:[{b64_json:'?'}]}));
  assert.deepEqual(result.usage,normalized);assert.equal(result.png,null);
  const huge=await editImageOnce('synthetic-test',plan,[jpeg],new AbortController().signal,async()=>new Response('{}',{headers:{'content-length':'11000001'}}));
  assert.equal(huge.usage,null);assert.equal(huge.errorCode,'OUTCOME_UNKNOWN');
});
test('service-only raw PNG probe calls decoder without key lookup, jobs, persistence or network',async()=>{
  const keys:string[]=[];let decodes=0,background=0;
  const handler=createWorkerHandler(key=>{keys.push(key);assert.notEqual(key,'UBRANKA_P33B_OPENAI_KEY');return env(key);},()=>{background++;},bytes=>{decodes++;assert.deepEqual(bytes,fakePng);return decode();});
  const request=(authorization:string,bytes=fakePng)=>new Request('https://worker.invalid',{method:'POST',headers:{Authorization:authorization,'X-Ubranka-Probe':'png','Content-Type':'image/png'},body:bytes});
  assert.equal((await handler(request('Bearer ordinary-jwt'))).status,401);assert.equal(decodes,0);
  const result=await handler(request('Bearer service-test'));assert.equal(result.status,200);const data=await result.json();assert.equal(data.width,1024);assert.equal(data.thumbBytes,8);assert.equal(background,0);
  assert.ok(!JSON.stringify(data).includes('main'));assert.deepEqual(keys,['SUPABASE_SERVICE_ROLE_KEY','SUPABASE_SERVICE_ROLE_KEY']);
  assert.equal((await handler(request('Bearer service-test',new Uint8Array(8_000_001)))).status,400);
});
test('JSON/base64 probe exercises the actual bounded response parser without reading a key or dispatching',async()=>{
  const handler=createWorkerHandler(key=>{assert.equal(key,'SUPABASE_SERVICE_ROLE_KEY');return env(key);},()=>assert.fail('background forbidden'),decode);
  const result=await handler(new Request('https://worker.invalid',{method:'POST',headers:{Authorization:'Bearer service-test','X-Ubranka-Probe':'json','Content-Type':'application/json'},
    body:JSON.stringify({usage:rawUsage,data:[{b64_json:Buffer.from(fakePng).toString('base64')}]})}));
  assert.equal(result.status,200);const data=await result.json();assert.ok(data.parseMs>=0);assert.ok(data.totalMs>=data.parseMs);assert.equal(data.bytes,fakePng.length);
});

async function workerFixture(options:{unknown?:boolean;deleteDuringUpload?:boolean;storageFail?:boolean;claim?:boolean}={}) {
  const original=globalThis.fetch,events:string[]=[],completions:Record<string,unknown>[]=[];let providerCalls=0,claim=options.claim??true;
  globalThis.fetch=async(input,init)=>{
    const url=new URL(String(input)),path=url.pathname;events.push(path);
    if(url.hostname==='api.openai.com'){providerCalls++;if(options.unknown)throw new Error('lost provider response');return Response.json({usage:rawUsage,data:[{b64_json:Buffer.from(fakePng).toString('base64')}]});}
    if(path==='/rest/v1/wardrobe_visualizations')return Response.json([{b_case_id:'B01',status:'reserved'}]);
    if(path.endsWith('/wardrobe_b_plan'))return Response.json(plan);
    if(path.startsWith('/storage/v1/object/wardrobe-private/'))return new Response(jpeg,{headers:{'Content-Type':'image/jpeg'}});
    if(path.endsWith('/wardrobe_b_mark_sent')){const won=claim;claim=false;return Response.json(won);}
    if(path.endsWith('/wardrobe_b_manifest'))return Response.json({main_path:`${account}/${job}/${file}/main.png`,thumb_path:`${account}/${job}/${file}/thumb.png`});
    if(path.startsWith('/storage/v1/object/wardrobe-results/')){if(options.storageFail)throw new Error('storage down');return Response.json({});}
    if(path.endsWith('/wardrobe_b_complete')){const body=JSON.parse(String(init?.body));completions.push(body);return Response.json({status:options.deleteDuringUpload?'failed':body.p_publish?'succeeded':'failed'});}
    if(path.endsWith('/wardrobe_b_abort_unsent'))return Response.json(null);
    throw new Error(`Unexpected fixture path ${path}`);
  };
  try{await runVisualizationWorker(env,account,job,decode);return {events,completions,providerCalls};}finally{globalThis.fetch=original;}
}
test('actual worker stages durable manifest before uploads and submits measured cost/publication once',async()=>{
  const f=await workerFixture();assert.equal(f.providerCalls,1);assert.equal(f.completions.length,1);assert.deepEqual(f.completions[0].p_usage,normalized);assert.equal(f.completions[0].p_publish,true);
  assert.ok(f.events.indexOf('/rest/v1/rpc/wardrobe_b_mark_sent')<f.events.indexOf('/v1/images/edits'));
  assert.ok(f.events.indexOf('/rest/v1/rpc/wardrobe_b_manifest')<f.events.findIndex(x=>x.startsWith('/storage/v1/object/wardrobe-results/')));
  assert.equal((await workerFixture({claim:false})).providerCalls,0);
});
test('unknown provider response blocks with null usage; partial upload settles known cost and preserves manifest',async()=>{
  const unknown=await workerFixture({unknown:true});assert.equal(unknown.providerCalls,1);assert.equal(unknown.completions[0].p_usage,null);assert.equal(unknown.completions[0].p_publish,false);
  const partial=await workerFixture({storageFail:true});assert.equal(partial.providerCalls,1);assert.deepEqual(partial.completions[0].p_usage,normalized);assert.equal(partial.completions[0].p_publish,false);
  assert.ok(partial.events.includes('/rest/v1/rpc/wardrobe_b_manifest'));
});
test('PNG proxy checks caller RLS again after Storage, so deletion while fetching returns no bytes',async()=>{
  const path=`${account}/${job}/${file}/main.png`,photo={main_path:path,thumb_path:path.replace('main.png','thumb.png'),bytes:fakePng.length,thumb_bytes:fakePng.length,mime_type:'image/png'};
  let active=true,checks=0;
  const caller={request:async(url:string)=>{checks++;assert.ok(url.includes('wardrobe_visualization_files'));return active?[photo]:[];}} as unknown as SupabaseRest;
  const admin={binary:async(_p:string,_b:number,mime:string)=>{assert.equal(mime,'image/png');return fakePng;}} as unknown as SupabaseRest;
  const response=await privatePhotoResponse(caller,admin,path,{});assert.equal(response.headers.get('content-type'),'image/png');assert.equal(checks,2);
  admin.binary=async()=>{active=false;return fakePng;};await assert.rejects(privatePhotoResponse(caller,admin,path,{}),/NOT_FOUND/);
});
test('request creates durable case operation before waking worker and accepts no arbitrary prompt/model',async()=>{
  const original=globalThis.fetch,events:string[]=[];
  globalThis.fetch=async(input,init)=>{
    const path=new URL(String(input)).pathname;events.push(path);
    if(path==='/auth/v1/user')return Response.json({id:account,email_confirmed_at:'2026-10-25'});
    if(path.endsWith('/wardrobe_execute'))return Response.json({visualization:{mode:'synthetic_trial'}});
    if(path.endsWith('/wardrobe_b_plan'))return Response.json(plan);
    if(path.startsWith('/storage/v1/object/wardrobe-private/'))return new Response(jpeg,{headers:{'Content-Type':'image/jpeg'}});
    if(path.endsWith('/wardrobe_b_reserve')){assert.equal(JSON.parse(String(init?.body)).p_id,job);return Response.json({id:job,status:'reserved'});}
    if(path.endsWith('/visualization-worker'))throw new Error('lost 202 acknowledgement');
    throw new Error('unexpected fixture endpoint');
  };
  try {
    const body={action:'requestVisualization',operationId:job,caseId:'B01',consentVersion:'p33b-synthetic-v1',accepted:true};
    const request=(extra={})=>new Request('https://wardrobe.invalid',{method:'POST',headers:{Authorization:'Bearer fixture'},body:JSON.stringify({...body,...extra})});
    const handler=createWardrobeHandler(env);const result=await handler(request());assert.equal(result.status,202);assert.equal((await result.json()).data.id,job);
    assert.ok(events.indexOf('/rest/v1/rpc/wardrobe_b_reserve')<events.indexOf('/functions/v1/visualization-worker'));
    assert.equal((await handler(request({prompt:'replace'}))).status,400);assert.equal(events.filter(x=>x.endsWith('/wardrobe_b_reserve')).length,1);
  }finally{globalThis.fetch=original;}
});
