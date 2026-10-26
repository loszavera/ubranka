import assert from 'node:assert/strict';
import test from 'node:test';
import {createWardrobeHandler} from '../functions/wardrobe/handler.ts';
import {sha256} from '../functions/_shared/trial.ts';

const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const jpg=Uint8Array.from([255,216,255,192,0,11,8,0,1,0,1,1,1,17,0,255,218,0,8,1,1,0,0,63,0,0,255,217]);
const hash=await sha256(jpg),manifest='a'.repeat(64),account=id(1),photo=id(2),intentId=id(3),jobId=id(4);
const descriptor={version:'p33c-jpeg-v1',sha256:hash,bytes:jpg.length,width:1,height:1};
const intent={id:intentId,trialId:'p33c-v1',manifestHash:manifest,inputs:[{photoId:photo,path:`${account}/${account}/${photo}/main.jpg`,thumbPath:`${account}/${account}/${photo}/thumb.jpg`,bytes:jpg.length,thumbBytes:jpg.length,fingerprint:manifest,kind:'body',canonical:descriptor}]};
const env=(key:string)=>{assert.ok(!key.includes('OPENAI'));return({SUPABASE_URL:'https://fixture.invalid',SUPABASE_ANON_KEY:'public-fixture',SUPABASE_SERVICE_ROLE_KEY:'service-fixture'} as Record<string,string>)[key];};
const handler=createWardrobeHandler(env);
const request=(body:object,auth=true)=>new Request('https://fixture.invalid/wardrobe',{method:'POST',headers:auth?{Authorization:'Bearer owner-fixture'}:{},body:JSON.stringify(body)});
const payload={action:'requestVisualization',operationId:jobId,trialId:'p33c-v1',intentId,accepted:true,consentVersion:'p33c-ai-v1.2',expectedConsentRevision:0,expectedManifestHash:manifest};
let original:typeof fetch,events:{path:string;body:Record<string,unknown>}[];
let reply:(path:string,body:Record<string,unknown>,init?:RequestInit)=>Response|Promise<Response>;
test.beforeEach(()=>{original=globalThis.fetch;events=[];reply=()=>assert.fail('unexpected network');globalThis.fetch=async(input,init)=>{
 const path=new URL(String(input)).pathname,body=JSON.parse(String(init?.body??'{}'));events.push({path,body});
 if(path==='/auth/v1/user')return Response.json({id:account,email_confirmed_at:'2026-01-01'});
 return reply(path,body,init);
};});
test.afterEach(()=>{globalThis.fetch=original;});

test('OFF and absent Auth reject before admin admission, key lookup or worker wake',async()=>{
 assert.equal((await handler(request(payload,false))).status,401);assert.equal(events.length,0);
 reply=(path,body)=>{assert.equal(path,'/rest/v1/rpc/wardrobe_execute');assert.equal(body.p_action,'bootstrap');return Response.json({visualization:{mode:'off'}});};
 assert.equal((await handler(request(payload))).status,403);assert.equal(events.length,2);
 assert.equal((await handler(request({...payload,accountId:id(99)}))).status,400);
 assert.ok(!events.some(x=>x.path.includes('reserve')||x.path.includes('worker')));
});

test('one admission uses fresh Auth identity and exact hash, one lost worker ACK never retries nor aborts receipt',async()=>{
 reply=(path,body)=>{
  if(path.endsWith('/wardrobe_execute'))return Response.json({visualization:{mode:'private_pilot'}});
  if(path.endsWith('/wardrobe_c_reserve_v2')){assert.equal(body.p_account,account);assert.equal(body.p_manifest_hash,manifest);assert.equal(body.p_consent_version,'p33c-ai-v1.2');return Response.json({job:{id:jobId,status:'reserved'},dispatch:true});}
  assert.equal(path,'/functions/v1/visualization-worker');assert.deepEqual(body,{accountId:account,jobId});throw Error('lost ACK');
 };
 const r=await handler(request(payload));assert.equal(r.status,202);assert.equal((await r.json()).data.id,jobId);
 assert.equal(events.filter(x=>x.path.endsWith('/visualization-worker')).length,1);assert.ok(!events.some(x=>x.path.includes('abort')));
});

test('durable same-operation receipt never wakes worker a second time; stale policy/manifest cannot reserve',async()=>{
 reply=(path)=>path.endsWith('/wardrobe_execute')?Response.json({visualization:{mode:'private_pilot'}}):Response.json({job:{id:jobId,status:'sent'},dispatch:false});
 assert.equal((await handler(request(payload))).status,202);assert.ok(!events.some(x=>x.path.includes('/functions/')));
 const before=events.filter(x=>x.path.endsWith('/wardrobe_c_reserve_v2')).length;
 assert.equal((await handler(request({...payload,consentVersion:'p33c-ai-v1.1'}))).status,400);
 assert.equal((await handler(request({...payload,expectedManifestHash:null}))).status,400);
 assert.equal(events.filter(x=>x.path.endsWith('/wardrobe_c_reserve_v2')).length,before);
});

test('prepare seals server canonical descriptors and SHA only after caller metadata authorization, while OFF',async()=>{
 reply=async(path,body)=>{
  if(path.endsWith('/wardrobe_execute')){assert.equal(body.p_action,'prepareVisualization');return Response.json(intent);}
  if(path.endsWith('/canonical-input')){assert.equal(body.accountId,account);return Response.json({canonical:descriptor,jpeg:Buffer.from(jpg).toString('base64')});}
  assert.equal(path,'/rest/v1/rpc/wardrobe_c_seal_intent');assert.equal(body.p_account,account);assert.equal(body.p_intent,intentId);
  assert.deepEqual(body.p_canonical,[{photoId:photo,...descriptor}]);assert.equal(body.p_manifest_hash,await sha256(new TextEncoder().encode(JSON.stringify(body.p_canonical))));
  return Response.json({...intent,manifestHash:body.p_manifest_hash});
 };
 const r=await handler(request({action:'prepareVisualization',trialId:'p33c-v1',outfitId:id(7),expectedBodyRevision:1,expectedStylingRevision:1}));assert.equal(r.status,200);
 assert.deepEqual(events.map(x=>x.path),['/auth/v1/user','/rest/v1/rpc/wardrobe_execute','/functions/v1/canonical-input','/rest/v1/rpc/wardrobe_c_seal_intent']);
});

test('canonical preview returns verified JPEG bytes no-store and authorizes again after preparation',async()=>{
 let reads=0;reply=(path)=>{if(path.endsWith('/wardrobe_execute')){reads++;return Response.json(intent);}return Response.json({canonical:descriptor,jpeg:Buffer.from(jpg).toString('base64')});};
 const r=await handler(request({action:'downloadCanonicalInput',intentId,photoId:photo}));assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'image/jpeg');
 assert.match(r.headers.get('cache-control')??'',/no-store/);assert.equal(await sha256(new Uint8Array(await r.arrayBuffer())),hash);assert.equal(reads,2);
});

test('revoked/stale preview or mismatched regeneration never exposes original fallback bytes',async()=>{
 let reads=0;reply=(path)=>{if(path.endsWith('/wardrobe_execute')){reads++;return reads===1?Response.json(intent):Response.json({message:'CONFLICT'},{status:400});}return Response.json({canonical:descriptor,jpeg:Buffer.from(jpg).toString('base64')});};
 let r=await handler(request({action:'downloadCanonicalInput',intentId,photoId:photo}));assert.equal(r.status,409);assert.equal((await r.json()).error.code,'CONFLICT');
 reply=(path)=>path.endsWith('/wardrobe_execute')?Response.json(intent):Response.json({canonical:{...descriptor,sha256:'b'.repeat(64)},jpeg:Buffer.from(jpg).toString('base64')});
 r=await handler(request({action:'downloadCanonicalInput',intentId,photoId:photo}));assert.equal(r.status,400);assert.equal((await r.json()).error.code,'MANIFEST_MISMATCH');
 assert.ok(!events.some(x=>x.path.startsWith('/storage/')));
});
