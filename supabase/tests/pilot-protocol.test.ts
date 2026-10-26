import assert from 'node:assert/strict';
import test from 'node:test';
import {fingerprint} from '../functions/_shared/protocol.ts';
import {privatePhotoResponse} from '../functions/_shared/photo-read.ts';
import {SupabaseRest} from '../functions/_shared/rest.ts';
import {createWorkerHandler} from '../functions/visualization-worker/handler.ts';
import {runPrivateVisualization,verifyPrivateInputs,type PrivatePlan,type PrivatePorts} from '../functions/visualization-worker/private-worker.ts';
const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const jpg=Uint8Array.from([255,216,255,192,0,11,8,0,1,0,1,1,1,17,0,255,218,0,8,1,1,0,0,63,0,0,255,217]);
const usage={textInputTokens:230,imageInputTokens:3072,imageOutputTokens:343};
const decode=()=>({main:new Uint8Array([1,2,3]),thumbnail:jpg,width:1024,height:1536,thumbnailMimeType:'image/jpeg' as const,thumbnailWidth:600,thumbnailHeight:900,metrics:{}});
function fixture(){
 const events:string[]=[];let claimed=false;
 const ports:PrivatePorts={loadInputs:async()=>[jpg,jpg],markSent:async()=>{events.push('claim');if(claimed)return false;claimed=true;return true;},
  generateOnce:async()=>{events.push('provider');return{png:new Uint8Array([1]),usage};},
  manifest:async(v)=>{events.push('manifest');assert.equal(v.thumbMimeType,'image/jpeg');assert.equal(v.thumbWidth,600);return{main_path:'main',thumb_path:'thumb',bucket:'wardrobe-results',thumb_mime_type:'image/jpeg'};},
  upload:async(p,_b,mime)=>{events.push(p);assert.equal(mime,p==='main'?'image/png':'image/jpeg');},
  complete:async(u,publish)=>{events.push(`complete:${publish}`);assert.deepEqual(u,usage);return{};}};
 return{ports,events};
}
test('C prepared coordinator binds exact bytes, one claim and durable manifest before MIME-aware uploads',async()=>{
 const f=fixture();assert.equal(await runPrivateVisualization(f.ports,decode),'settled');assert.equal(await runPrivateVisualization(f.ports,decode),'not-sent');
 assert.deepEqual(f.events,['claim','provider','manifest','main','thumb','complete:true','claim']);
});
test('unknown provider and lost settlement never retry, while partial uploads still settle known usage',async()=>{
 const unknown=fixture();unknown.ports.generateOnce=async()=>{unknown.events.push('provider');throw Error('lost response');};
 unknown.ports.complete=async(u,p)=>{assert.equal(u,null);assert.equal(p,false);return{};};
 assert.equal(await runPrivateVisualization(unknown.ports,decode),'unresolved');assert.equal(unknown.events.filter(x=>x==='provider').length,1);
 const partial=fixture();partial.ports.upload=async()=>{throw Error('Storage unavailable');};
 assert.equal(await runPrivateVisualization(partial.ports,decode),'settled');assert.deepEqual(partial.events,['claim','provider','manifest','complete:false']);
 const lost=fixture();lost.ports.complete=async()=>{throw Error('lost receipt');};assert.equal(await runPrivateVisualization(lost.ports,decode),'unresolved');
 assert.equal(lost.events.filter(x=>x==='provider').length,1);
});
test('late invalidation returns no manifest and cannot write any bytes; malformed thumbnail costs no extra generation',async()=>{
 const deleted=fixture();deleted.ports.manifest=async()=>null;assert.equal(await runPrivateVisualization(deleted.ports,decode),'settled');assert.deepEqual(deleted.events,['claim','provider','complete:false']);
 const invalid=fixture();await runPrivateVisualization(invalid.ports,()=>({...decode(),thumbnail:new Uint8Array(100001)}));assert.deepEqual(invalid.events,['claim','provider','complete:false']);
});
test('private inputs verify both stored variants against immutable upload hash and reject changed/cross-account bytes',async()=>{
 const hash=await fingerprint(jpg,jpg),account=id(1);
 const plan:PrivatePlan={jobId:id(9),accountId:account,inputs:[0,1].map(n=>({photoId:id(10+n),path:`${account}/${id(20+n)}/${id(10+n)}/main.jpg`,
  thumbPath:`${account}/${id(20+n)}/${id(10+n)}/thumb.jpg`,bytes:jpg.length,thumbBytes:jpg.length,fingerprint:hash,kind:n?'item':'body'}))};
 const admin={binary:async()=>jpg} as unknown as SupabaseRest;
 assert.equal((await verifyPrivateInputs(admin,plan)).length,2);
 await assert.rejects(verifyPrivateInputs(admin,{...plan,accountId:id(2)}),/INVALID_MANIFEST/);
 const changed=structuredClone(plan);changed.inputs[0].fingerprint='f'.repeat(64);await assert.rejects(verifyPrivateInputs(admin,changed),/MANIFEST_MISMATCH/);
});
test('JPEG extension cannot select input bucket: authorized result metadata selects result bucket, checked again after fetch',async()=>{
 const path=`${id(1)}/${id(9)}/${id(10)}/thumb.jpg`;let active=true;
 const caller={rpc:async()=>active?{path,bucket:'wardrobe-results',mimeType:'image/jpeg',bytes:jpg.length,main:false}:null} as unknown as SupabaseRest;
 const admin={binary:async(p:string)=>{assert.equal(p,`/storage/v1/object/wardrobe-results/${path}`);return jpg;}} as unknown as SupabaseRest;
 assert.equal((await privatePhotoResponse(caller,admin,path,{})).headers.get('content-type'),'image/jpeg');
 admin.binary=async()=>{active=false;return jpg;};await assert.rejects(privatePhotoResponse(caller,admin,path,{}),/NOT_FOUND/);
});
test('hosted service-authenticated worker refuses normal jobs without reading any AI credential or dispatching',async()=>{
 const original=globalThis.fetch,events:string[]=[];
 globalThis.fetch=async(input)=>{events.push(String(input));assert.ok(String(input).endsWith('/wardrobe_worker_authorized'));return Response.json(true);};
 try{
  const handler=createWorkerHandler(key=>{assert.ok(!key.includes('OPENAI'));return({SUPABASE_URL:'https://fixture.invalid',SUPABASE_SERVICE_ROLE_KEY:'fixture-service',SUPABASE_ANON_KEY:'fixture-public'} as Record<string,string>)[key];},()=>assert.fail('no dispatch'),decode);
  const r=await handler(new Request('https://worker.invalid',{method:'POST',headers:{Authorization:'Bearer fixture'},body:JSON.stringify({jobId:id(9),accountId:id(1),enabled:true})}));
  assert.equal(r.status,403);assert.equal((await r.json()).error.code,'AI_DISABLED');assert.equal(events.length,1);
 }finally{globalThis.fetch=original;}
});
