import assert from 'node:assert/strict';
import test from 'node:test';
import { createWardrobeHandler } from '../functions/wardrobe/handler.ts';
import { runReservedVisualization, validateGeneratedPng } from '../functions/_shared/visualization.ts';
import { syntheticVisualization } from './support/synthetic-visualization.ts';

const account='00000000-0000-4000-8000-000000000001';
const operation='00000000-0000-4000-8000-000000000050';
const jpeg=Uint8Array.from([255,216,255,192,0,11,8,0,1,0,1,1,1,17,0,255,218,0,8,1,1,0,0,63,0,0,255,217]);
const environment=(key:string)=>({SUPABASE_URL:'https://synthetic.invalid',SUPABASE_ANON_KEY:'public-fixture',SUPABASE_SERVICE_ROLE_KEY:'private-fixture',WARDROBE_ALLOWED_ORIGINS:'https://app.invalid'}[key]);

test('hosted handler hard OFF makes no provider request even with forged mode/env/consent',async()=>{
  const original=globalThis.fetch;const requests:string[]=[];
  globalThis.fetch=async(input)=>{requests.push(String(input));if(String(input).endsWith('/wardrobe_execute'))return Response.json({visualization:{mode:'off'}});assert.equal(String(input),'https://synthetic.invalid/auth/v1/user');return Response.json({id:account,email_confirmed_at:'2026-10-25'});};
  try {
    const handler=createWardrobeHandler((key)=>key==='OPENAI_API_KEY'?'must-never-be-read':environment(key));
    for(const action of['requestVisualization','setAiConsent']) {
      const response=await handler(new Request('https://synthetic.invalid/functions/v1/wardrobe',{method:'POST',headers:{Authorization:'Bearer synthetic-session','Content-Type':'application/json'},body:JSON.stringify({action,operationId:operation,mode:'test',enabled:true,accepted:true})}));
      assert.equal(response.status,403);assert.equal((await response.json()).error.code,'AI_DISABLED');
    }
    assert.equal(requests.length,2,'two fresh auth checks; no storage/provider invocation');
  }finally{globalThis.fetch=original;}
});

test('body HTTP upload validates bytes then uses shared private Storage and body RPCs',async()=>{
  const original=globalThis.fetch;const events:string[]=[];
  const photo={id:operation,account_id:account,item_id:null,status:'staged',main_path:`${account}/${account}/${operation}/main.jpg`,thumb_path:`${account}/${account}/${operation}/thumb.jpg`};
  globalThis.fetch=async(input,init)=>{
    const path=new URL(String(input)).pathname;events.push(path);
    if(path==='/auth/v1/user')return Response.json({id:account,email_confirmed_at:'2026-10-25'});
    if(path.endsWith('/wardrobe_execute'))return Response.json({accountId:account});
    if(path.endsWith('/wardrobe_reserve_body_photo')) {const body=JSON.parse(String(init?.body));assert.equal(body.p_bytes,jpeg.length);assert.equal(body.p_consent,'p33a-body-v1');return Response.json(photo);}
    if(path.startsWith('/storage/v1/object/wardrobe-private/')) {assert.equal(init?.method,'POST');return Response.json({});}
    if(path.endsWith('/wardrobe_commit_body_photo'))return Response.json({revision:1,photo:{id:operation}});
    if(path.endsWith('/wardrobe_expire_uploads') || path.endsWith('/wardrobe_finish_item_deletes'))return Response.json(null);
    if(path.startsWith('/rest/v1/wardrobe_photos')||path.startsWith('/rest/v1/wardrobe_accounts'))return Response.json([]);
    throw new Error(`Unexpected fixture route ${path}`);
  };
  try {
    const request=()=>new Request('https://synthetic.invalid/functions/v1/wardrobe',{method:'POST',headers:{Authorization:'Bearer synthetic-session'},body:JSON.stringify({action:'uploadBodyPhoto',expectedRevision:0,operationId:operation,mimeType:'image/jpeg',mainBase64:Buffer.from(jpeg).toString('base64'),thumbBase64:Buffer.from(jpeg).toString('base64'),storageConsentVersion:'p33a-body-v1'})});
    const response=await createWardrobeHandler(environment)(request());assert.equal(response.status,200);assert.equal((await response.json()).data.revision,1);
    assert.equal(events.filter(x=>x.startsWith('/storage/v1/object/')).length,2);
    assert.ok(events.indexOf('/rest/v1/rpc/wardrobe_reserve_body_photo')<events.findIndex(x=>x.startsWith('/storage/v1/object/')));
    assert.ok(!events.includes('/rest/v1/rpc/wardrobe_reserve_photo'));
  }finally{globalThis.fetch=original;}
});

test('local coordinator claims once across duplicate workers, stages before writing, and charges once',async()=>{
  const fixture=syntheticVisualization();
  const result=await Promise.all([runReservedVisualization(fixture.ports),runReservedVisualization(fixture.ports)]);
  assert.deepEqual(result.sort(),['not-claimed','succeeded']);assert.equal(fixture.providerCalls(),1);
  assert.ok(fixture.events.indexOf('manifest')<fixture.events.indexOf('put-main'));
  assert.equal(fixture.events.filter(x=>x==='settle-succeeded').length,1);
});
test('unknown provider outcome has no automatic retry and no false zero-cost settlement',async()=>{
  const fixture=syntheticVisualization();fixture.ports.generateOnce=async()=>{throw new Error('connection lost after dispatch');};
  assert.equal(await runReservedVisualization(fixture.ports),'unknown');assert.ok(fixture.events.includes('unknown'));
  assert.ok(!fixture.events.some(x=>x.startsWith('settle')));assert.ok(!fixture.events.includes('manifest'));
});
test('deletion between manifest and publication cannot revive late files',async()=>{
  const fixture=syntheticVisualization();fixture.ports.publish=async()=>false;
  assert.equal(await runReservedVisualization(fixture.ports),'cancelled');
  assert.deepEqual(fixture.events.slice(-2),['delete-later','settle-failed']);
});
test('partial upload leaves durable manifest even when immediate deletion fails',async()=>{
  const fixture=syntheticVisualization();fixture.ports.putFile=async(_m,variant)=>{fixture.events.push(`put-${variant}`);if(variant==='thumb')throw new Error('offline');};
  fixture.ports.deleteLater=async()=>{throw new Error('storage down');};
  assert.equal(await runReservedVisualization(fixture.ports),'failed');assert.ok(fixture.events.includes('manifest'));
  assert.ok(fixture.events.includes('settle-failed'));assert.ok(!fixture.events.includes('publish'));
});
test('oversized/incorrect output is charged and rejected before storing; missing usage remains unknown',async()=>{
  assert.throws(()=>validateGeneratedPng(new Uint8Array(8_000_001)),/INVALID_OUTPUT/);
  const bad=syntheticVisualization();const output=await bad.ports.generateOnce();
  bad.ports.generateOnce=async()=>({...output,bytes:new Uint8Array(8_000_001)});
  assert.equal(await runReservedVisualization(bad.ports),'failed');assert.ok(bad.events.includes('settle-failed'));assert.ok(!bad.events.includes('manifest'));
  const unknown=syntheticVisualization();unknown.ports.generateOnce=async()=>({...output,usage:null as unknown as typeof output.usage});
  assert.equal(await runReservedVisualization(unknown.ports),'unknown');assert.ok(!unknown.events.some(x=>x.startsWith('settle')));
});
test('cancellation before persistence discards bytes but records the paid attempt',async()=>{
  const fixture=syntheticVisualization();fixture.ports.inputsCurrent=async()=>false;
  assert.equal(await runReservedVisualization(fixture.ports),'cancelled');assert.ok(!fixture.events.includes('manifest'));assert.ok(fixture.events.includes('settle-failed'));
});
