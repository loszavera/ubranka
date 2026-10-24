import assert from 'node:assert/strict';
import test from 'node:test';
import { makeDatabase } from './support/database.mjs';

const db=await makeDatabase();
const query=db.query.bind(db);
// Each case rolls back its fixture. Expected statement errors must not poison
// that enclosing transaction; savepoints preserve real PostgreSQL behavior.
db.query=async(...args)=>{
  await db.exec('savepoint fixture_statement');
  try{const result=await query(...args);await db.exec('release savepoint fixture_statement');return result;}
  catch(error){await db.exec('rollback to savepoint fixture_statement');await db.exec('release savepoint fixture_statement');throw error;}
};
const id=(n)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const A=id(1),B=id(2);
const bodyData={heightCm:175,chestCm:null,waistCm:80.5,hipsCm:null,sizeSystem:'EU',topSize:'M',bottomSize:'40',shoeSize:'42'};
const fields={name:'Synthetic item',color:'blue',occasions:['casual'],size:'M',photoKind:'garment'};
const usage={textInputTokens:230,imageInputTokens:3072,imageOutputTokens:343};
async function user(account,action,payload={}) {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[account]);
  await db.exec('set role authenticated');
  try{return (await db.query('select public.wardrobe_execute($1,$2) value',[action,JSON.stringify(payload)])).rows[0].value;}
  finally{await db.exec('reset role');}
}
async function asUser(account,sql,args=[]) {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[account]);await db.exec('set role authenticated');
  try{return await db.query(sql,args);}finally{await db.exec('reset role');}
}
async function admin(name,args=[]) {
  await db.exec('set role service_role');
  try{return (await db.query(`select public.${name}(${args.map((_,n)=>`$${n+1}`).join(',')}) value`,args)).rows[0].value;}
  finally{await db.exec('reset role');}
}
async function storage(photo) {
  await db.query('insert into storage.objects(bucket_id,name) values($1,$2),($1,$3)',['wardrobe-private',photo.main_path,photo.thumb_path]);
}
async function bodyPhoto(account,photoId,revision=0) {
  const p=await admin('wardrobe_reserve_body_photo',[account,photoId,revision,100,50,'b'.repeat(64),'p33a-body-v1']);
  await storage(p);return await admin('wardrobe_commit_body_photo',[account,photoId]);
}
async function outfitFixture(account=A,base=100) {
  const itemIds=[id(base+1),id(base+2),id(base+3)],itemRevisions={},photos=[];
  for(let n=0;n<3;n++) {
    await user(account,'createItem',{itemId:itemIds[n],...fields,category:['top','bottom','shoes'][n]});
    const photo=await admin('wardrobe_reserve_photo',[account,itemIds[n],id(base+11+n),1,100,50,'a'.repeat(64)]);
    await storage(photo);await admin('wardrobe_commit_photo',[account,photo.id]);itemRevisions[itemIds[n]]=2;photos.push(photo.id);
  }
  const body=await bodyPhoto(account,id(base+20));photos.push(body.photo.id);
  const outfit={id:id(base+30),profileId:'daily',occasion:'casual',itemIds,itemRevisions,createdAt:'2026-10-25T00:00:00.000Z'};
  await user(account,'saveStyling',{expectedRevision:0,data:{outfits:[outfit],feedback:[]}});
  return {account,outfit,photos,bodyRevision:1,stylingRevision:1};
}
async function enableLocalFixture() {
  // This override exists ONLY here, in disposable PGlite; no migration/env/HTTP
  // switch enables it in a hosted project and no provider is contacted.
  await db.exec("create or replace function wardrobe_private.ai_enabled() returns boolean language sql immutable set search_path='' as $$select true$$");
  await db.exec("update wardrobe_private.ai_control set blocked=false,starts_at=now()-interval '1 day',ends_at=now()+interval '30 days',trial_id='synthetic'; insert into wardrobe_private.ai_budgets(scope,limit_cents) values('trial:synthetic',2500); update public.wardrobe_body_fit set ai_consent_version='p33-ai-v1',ai_consent_at=now()");
}
const reserve=(f,job=id(900))=>admin('wardrobe_ai_reserve',[f.account,job,f.outfit.id,f.bodyRevision,f.stylingRevision]);
test.beforeEach(async()=>{
  await db.exec('begin');
  await db.query('insert into auth.users values($1,$2,now()),($3,$4,now())',[A,'synthetic-a@example.invalid',B,'synthetic-b@example.invalid']);
  await db.exec("insert into wardrobe_private.invites(email) values('synthetic-a@example.invalid'),('synthetic-b@example.invalid')");
  for(const account of[A,B]) {
    await user(account,'bootstrap');
    await user(account,'saveState',{expectedRevision:0,data:{locale:'pl',profiles:[{id:'daily',name:'Daily',audience:'women',occasion:'casual',budget:500,priority:'comfort',defaultMode:'best'}],activeProfileId:'daily',feedback:[],askReason:true}});
  }
});
test.afterEach(async()=>{await db.exec('rollback');});
test.after(async()=>{await db.close();});

test('additive snapshot preserves demo/profile data and starts with no invented AI spend',async()=>{
  const s=await user(A,'bootstrap');
  assert.equal(s.state.revision,1);assert.equal(s.state.data.profiles[0].id,'daily');
  assert.equal(s.bodyFit.revision,0);assert.equal(s.bodyFit.photo,null);assert.equal(s.bodyFit.photoDeletion,null);
  assert.deepEqual(s.styling,{revision:0,data:{outfits:[],feedback:[]}});
  assert.equal(s.visualization.mode,'off');assert.equal(s.visualization.limits.attempts,40);
  assert.equal(s.visualization.limits.budgetPln,0);assert.deepEqual(s.visualization.jobs,[]);
});
test('body CAS/validation, owner RLS and denied direct writes',async()=>{
  const b=await user(A,'saveBodyFit',{expectedRevision:0,data:bodyData});assert.equal(b.revision,1);
  await assert.rejects(user(A,'saveBodyFit',{expectedRevision:0,data:bodyData}),/CONFLICT/);
  for(const data of[{...bodyData,heightCm:0},{...bodyData,waistCm:300.001},{...bodyData,extra:'forged'},{...bodyData,sizeSystem:'invalid'}])
    await assert.rejects(user(A,'saveBodyFit',{expectedRevision:1,data}),/INVALID_BODY/);
  assert.deepEqual((await asUser(B,'select account_id from public.wardrobe_body_fit')).rows,[]);
  await assert.rejects(asUser(A,"update public.wardrobe_body_fit set data='{}'"),/permission denied/);
  assert.equal((await user(A,'export')).bodyFit.data.heightCm,175);
});
test('body upload requires consent, isolates paths, retries CAS and preserves pending cleanup across reload',async()=>{
  await assert.rejects(admin('wardrobe_reserve_body_photo',[A,id(50),0,100,50,'a'.repeat(64),'wrong']),/STORAGE_CONSENT_REQUIRED/);
  const first=await bodyPhoto(A,id(50));assert.equal(first.revision,1);assert.equal(first.photo.mainPath,`${A}/${A}/${id(50)}/main.jpg`);
  assert.equal((await asUser(A,'select id from public.wardrobe_photos')).rows.length,1);
  assert.equal((await asUser(B,'select id from public.wardrobe_photos')).rows.length,0);
  assert.equal((await asUser(A,'select id from storage.objects')).rows.length,0);
  await admin('wardrobe_reserve_body_photo',[A,id(51),1,100,50,'b'.repeat(64),'p33a-body-v1']);
  await user(A,'saveBodyFit',{expectedRevision:1,data:bodyData});
  await assert.rejects(admin('wardrobe_reserve_body_photo',[A,id(51),1,100,50,'b'.repeat(64),'p33a-body-v1']),/CONFLICT/);
  const newer=await admin('wardrobe_reserve_body_photo',[A,id(52),2,100,50,'c'.repeat(64),'p33a-body-v1']);
  await assert.rejects(admin('wardrobe_commit_body_photo',[A,id(51)]),/NOT_FOUND/);
  await storage(newer);const committed=await admin('wardrobe_commit_body_photo',[A,id(52)]);assert.equal(committed.revision,3);
  assert.equal((await user(A,'deleteBodyPhoto',{expectedRevision:3})).status,'pending');
  const reload=(await user(A,'bootstrap')).bodyFit;assert.equal(reload.photo,null);assert.equal(reload.photoDeletion,'pending');
  assert.equal((await asUser(A,'select id from public.wardrobe_photos')).rows.length,0);
  await assert.rejects(admin('wardrobe_finish_photo_delete',[id(52)]),/CONFLICT/);
  // Only this DB fixture simulates Storage API completion; production uses API.
  await db.exec("delete from storage.objects; update public.wardrobe_photos set cleanup_after=now()-interval '1 minute'");
  for(const p of[id(50),id(51),id(52)])await admin('wardrobe_finish_photo_delete',[p]);
  assert.equal((await user(A,'bootstrap')).bodyFit.photoDeletion,null);
});
test('body reservation shares old variants and 250MB quota with wardrobe',async()=>{
  const f=await outfitFixture();
  // Existing realistic backlog uses 249.7 MB, below the combined quota.
  await db.query(`insert into public.wardrobe_photos(id,account_id,item_id,expected_revision,main_path,thumb_path,bytes,thumb_bytes,mime_type,fingerprint,status)
    select gen_random_uuid(),$1,$2,1,'backlog/'||n||'/main.jpg','backlog/'||n||'/thumb.jpg',1000000,100000,'image/jpeg',repeat('c',64),'deleting' from generate_series(1,227) n`,[A,f.outfit.itemIds[0]]);
  await assert.rejects(admin('wardrobe_reserve_body_photo',[A,id(59),1,1000000,100000,'c'.repeat(64),'p33a-body-v1']),/STORAGE_LIMIT/);
  await assert.rejects(admin('wardrobe_reserve_photo',[A,f.outfit.itemIds[0],f.photos[3],2,100,50,'b'.repeat(64)]),/CONFLICT/,'body operation cannot be replayed as item upload');
});
test('styling checks complete current own outfits; independent votes do not save outfits',async()=>{
  const f=await outfitFixture();
  const feedback={profileId:'daily',outfitId:id(660),itemIds:f.outfit.itemIds,vote:'like'};
  const data={outfits:[],feedback:[feedback]};
  const saved=await user(A,'saveStyling',{expectedRevision:1,data});assert.deepEqual(saved.data,data);
  await assert.rejects(user(A,'saveStyling',{expectedRevision:1,data}),/CONFLICT/);
  await assert.rejects(user(B,'saveStyling',{expectedRevision:0,data}),/NOT_FOUND/);
  for(const outfit of[{...f.outfit,itemIds:[]},{...f.outfit,itemIds:[f.outfit.itemIds[0]]},{...f.outfit,itemIds:[f.outfit.itemIds[0],f.outfit.itemIds[0]]}])
    await assert.rejects(user(A,'saveStyling',{expectedRevision:2,data:{outfits:[outfit],feedback:[]}}),/INVALID_STYLING/);
  const bad={...f.outfit,occasion:'wedding'};
  await assert.rejects(user(A,'saveStyling',{expectedRevision:2,data:{outfits:[bad],feedback:[]}}),/CONFLICT/);
  assert.equal((await asUser(B,'select account_id from public.wardrobe_styling')).rows.length,0);
});
test('unchanged saved history can retain removed IDs without authorizing new forged references',async()=>{
  const f=await outfitFixture();
  await user(A,'deleteItem',{itemId:f.outfit.itemIds[0],expectedRevision:2});
  const old=(await user(A,'bootstrap')).styling;
  await user(A,'saveStyling',{expectedRevision:old.revision,data:old.data});
  const changed=structuredClone(old.data);changed.outfits[0].id=id(999);
  await assert.rejects(user(A,'saveStyling',{expectedRevision:2,data:changed}),/NOT_FOUND/);
});
test('OFF cannot be bypassed by direct RPC, forged payloads or service-role admission',async()=>{
  const f=await outfitFixture();
  for(const action of['requestVisualization','setAiConsent'])await assert.rejects(user(A,action,{mode:'test',enabled:true,operationId:id(900),accepted:true}),/AI_DISABLED/);
  await assert.rejects(reserve(f),/AI_DISABLED/);
  await assert.rejects(asUser(A,'select public.wardrobe_ai_reserve($1,$2,$3,1,1)',[A,id(900),f.outfit.id]),/permission denied/);
  await assert.rejects(asUser(A,"select public.wardrobe_execute_p31('bootstrap','{}')"),/permission denied/);
  assert.equal((await db.query('select count(*) n from public.wardrobe_visualizations')).rows[0].n,0);
});
test('local SQL admission reserves both budgets and space, deduplicates lost acknowledgements and claims once',async()=>{
  const f=await outfitFixture();await enableLocalFixture();
  const first=await reserve(f);assert.equal(first.status,'reserved');assert.equal(first.reservedPln,1);
  assert.deepEqual(await reserve(f),first);
  await assert.rejects(admin('wardrobe_ai_reserve',[A,id(900),f.outfit.id,9,1]),/CONFLICT/);
  await assert.rejects(reserve(f,id(901)),/AI_BUSY/);
  assert.equal(await admin('wardrobe_ai_mark_sent',[A,id(900)]),true);
  assert.equal(await admin('wardrobe_ai_mark_sent',[A,id(900)]),false);
  const settled=await admin('wardrobe_ai_settle',[A,id(900),'succeeded',usage]);assert.equal(settled.status,'succeeded');assert.equal(settled.spentPln,0.25);
  assert.deepEqual(await reserve(f),settled,'lost 202 after completion returns original result');
  assert.deepEqual(await admin('wardrobe_ai_settle',[A,id(900),'succeeded',usage]),settled);
  const budgets=(await db.query('select spent_cents,reserved_cents from wardrobe_private.ai_budgets')).rows;
  assert.ok(budgets.every(x=>x.spent_cents===25 && x.reserved_cents===0));
});
test('global admission serializes competing accounts and trial cap persists across month scopes',async()=>{
  const a=await outfitFixture(A,100),b=await outfitFixture(B,200);await enableLocalFixture();
  await reserve(a);
  await assert.rejects(reserve(b,id(901)),/AI_BUSY/);
  await admin('wardrobe_ai_mark_sent',[A,id(900)]);await admin('wardrobe_ai_settle',[A,id(900),'succeeded',usage]);
  await db.exec("update wardrobe_private.ai_budgets set spent_cents=2450 where scope='trial:synthetic'");
  await assert.rejects(reserve(b,id(901)),/AI_BUDGET_LIMIT/);
  assert.equal((await db.query('select reserved_cents from wardrobe_private.ai_budgets where scope=$1',['trial:synthetic'])).rows[0].reserved_cents,0,'failed transaction does not strand a partial reservation');
});
test('dispatch rechecks metadata/body revisions and refunds a provably unsent operation',async()=>{
  const f=await outfitFixture();await enableLocalFixture();await reserve(f);
  await user(A,'updateItem',{itemId:f.outfit.itemIds[0],expectedRevision:2,...fields,category:'top',occasions:['wedding']});
  assert.equal(await admin('wardrobe_ai_mark_sent',[A,id(900)]),false);
  assert.equal((await user(A,'getVisualization',{jobId:id(900)})).status,'cancelled');
  assert.ok((await db.query('select reserved_cents from wardrobe_private.ai_budgets')).rows.every(x=>x.reserved_cents===0));
});
test('late known completion after body deletion charges once without publishing a result',async()=>{
  const f=await outfitFixture();await enableLocalFixture();await reserve(f);await admin('wardrobe_ai_mark_sent',[A,id(900)]);
  await user(A,'deleteBodyPhoto',{expectedRevision:1});
  const result=await admin('wardrobe_ai_settle',[A,id(900),'succeeded',usage]);
  assert.equal(result.status,'failed');assert.equal(result.errorCode,'CANCELLED');assert.equal(result.spentPln,0.25);assert.equal(result.result,null);
  assert.equal((await user(A,'bootstrap')).visualization.jobs.length,0);
});
test('unknown outcome retains holds through expiry, deletion and future admission',async()=>{
  const f=await outfitFixture();await enableLocalFixture();await reserve(f);await admin('wardrobe_ai_mark_sent',[A,id(900)]);
  await admin('wardrobe_ai_settle',[A,id(900),'outcome_unknown',null]);
  await db.exec("update public.wardrobe_visualizations set expires_at=now()-interval '1 day'");await admin('wardrobe_expire_uploads');
  await assert.rejects(reserve(f,id(901)),/AI_UNAVAILABLE/);
  await user(A,'deleteAccount');
  assert.equal((await asUser(A,'select id from public.wardrobe_visualizations')).rows.length,0);
  assert.equal(await admin('wardrobe_prepare_auth_delete',[A]),false,'body/item paths must remain until physical cleanup');
  await db.exec("delete from storage.objects; update public.wardrobe_photos set cleanup_after=now()-interval '1 minute'");
  for(const p of f.photos)await admin('wardrobe_finish_photo_delete',[p]);
  await admin('wardrobe_finish_item_deletes');assert.equal(await admin('wardrobe_prepare_auth_delete',[A]),true);
  assert.equal((await db.query('select count(*) n from public.wardrobe_visualizations')).rows[0].n,0);
  assert.ok((await db.query('select reserved_cents from wardrobe_private.ai_budgets')).rows.every(x=>x.reserved_cents===100),'unattributed project holds survive account deletion');
});
test('cost above reserve is fully recorded and stops further admission; revocation blocks data',async()=>{
  const f=await outfitFixture();await enableLocalFixture();await reserve(f);await admin('wardrobe_ai_mark_sent',[A,id(900)]);
  const expensive={textInputTokens:0,imageInputTokens:100000,imageOutputTokens:0};
  const r=await admin('wardrobe_ai_settle',[A,id(900),'succeeded',expensive]);assert.equal(r.spentPln,5.42);
  await assert.rejects(reserve(f,id(901)),/AI_UNAVAILABLE/);
  await db.exec("update wardrobe_private.invites set enabled=false where email='synthetic-a@example.invalid'");
  assert.equal((await asUser(A,'select account_id from public.wardrobe_body_fit')).rows.length,0);
  assert.equal((await asUser(A,'select id from public.wardrobe_photos')).rows.length,0);
  await assert.rejects(user(A,'export'),/ACCOUNT_UNAVAILABLE/);
});

test('daily attempts and saved-result deletion cannot reset spending counters',async()=>{
  const f=await outfitFixture();await enableLocalFixture();
  for(let n=0;n<5;n++) {
    const job=id(900+n);await reserve(f,job);await admin('wardrobe_ai_mark_sent',[A,job]);
    const result=await admin('wardrobe_ai_settle',[A,job,'succeeded',usage]);
    await user(A,'deleteVisualization',{jobId:job,expectedRevision:result.revision});
  }
  await assert.rejects(reserve(f,id(910)),/AI_ATTEMPT_LIMIT/);
  const snapshot=(await user(A,'bootstrap')).visualization;
  assert.equal(snapshot.jobs.length,0);assert.equal(snapshot.limits.usedAttempts,5);assert.equal(snapshot.limits.usedResults,5);
  assert.equal(snapshot.limits.usedDailyAttempts,5);assert.equal(snapshot.limits.spentPln,1.25);
});
test('unsent expiry/month rollover refunds; sent expiry remains unknown and retains money',async()=>{
  const f=await outfitFixture();await enableLocalFixture();await reserve(f);
  await db.exec("update public.wardrobe_visualizations set expires_at=now()-interval '1 second'");
  await admin('wardrobe_expire_uploads');
  assert.equal((await user(A,'getVisualization',{jobId:id(900)})).status,'expired');
  assert.ok((await db.query('select reserved_cents from wardrobe_private.ai_budgets')).rows.every(x=>x.reserved_cents===0));
  await reserve(f,id(901));
  await db.exec("update wardrobe_private.ai_budgets set scope='month:synthetic-past' where scope like 'month:%'; update public.wardrobe_visualizations set month_scope='month:synthetic-past' where id='00000000-0000-4000-8000-000000000901'");
  assert.equal(await admin('wardrobe_ai_mark_sent',[A,id(901)]),false,'cannot dispatch reservation into a different monthly budget');
  await reserve(f,id(902));await admin('wardrobe_ai_mark_sent',[A,id(902)]);
  await db.query("update public.wardrobe_visualizations set sent_at=now()-interval '6 minutes' where id=$1",[id(902)]);
  await admin('wardrobe_expire_uploads');
  assert.equal((await user(A,'getVisualization',{jobId:id(902)})).status,'outcome_unknown');
  assert.equal((await db.query("select reserved_cents from wardrobe_private.ai_budgets where scope='trial:synthetic'")).rows[0].reserved_cents,100);
});
test('metadata/body changes and invitation withdrawal invalidate publication independently of photo bytes',async()=>{
  const f=await outfitFixture();await enableLocalFixture();await reserve(f);await admin('wardrobe_ai_mark_sent',[A,id(900)]);
  await user(A,'saveBodyFit',{expectedRevision:1,data:bodyData});
  const r=await admin('wardrobe_ai_settle',[A,id(900),'succeeded',usage]);assert.equal(r.status,'failed');assert.equal(r.errorCode,'CANCELLED');
  f.bodyRevision=2;await reserve(f,id(901));await admin('wardrobe_ai_mark_sent',[A,id(901)]);
  await db.exec("update wardrobe_private.invites set enabled=false where email='synthetic-a@example.invalid'");
  const revoked=await admin('wardrobe_ai_settle',[A,id(901),'succeeded',usage]);assert.equal(revoked.status,'failed');assert.equal(revoked.errorCode,'CANCELLED');
});
test('closed personal job metadata expires after 90 days without rewriting aggregate spend',async()=>{
  const f=await outfitFixture();await enableLocalFixture();await reserve(f);await admin('wardrobe_ai_mark_sent',[A,id(900)]);
  await admin('wardrobe_ai_settle',[A,id(900),'succeeded',usage]);
  await db.query("update public.wardrobe_visualizations set completed_at=now()-interval '91 days' where id=$1",[id(900)]);
  await admin('wardrobe_expire_uploads');assert.equal((await db.query('select count(*) n from public.wardrobe_visualizations')).rows[0].n,0);
  assert.ok((await db.query('select spent_cents from wardrobe_private.ai_budgets')).rows.every(x=>x.spent_cents===25));
});

test('pilot end between admission and dispatch releases only a provably unsent hold',async()=>{
  const f=await outfitFixture();await enableLocalFixture();await reserve(f);
  await db.exec("update wardrobe_private.ai_control set ends_at=now()-interval '1 second'");
  assert.equal(await admin('wardrobe_ai_mark_sent',[A,id(900)]),false);
  assert.equal((await user(A,'getVisualization',{jobId:id(900)})).status,'cancelled');
  assert.ok((await db.query('select reserved_cents from wardrobe_private.ai_budgets')).rows.every(x=>x.reserved_cents===0));
  await assert.rejects(reserve(f,id(901)),/AI_UNAVAILABLE/);
});
test('withdrawn consent after dispatch prevents a successful late result, not its measured cost',async()=>{
  const f=await outfitFixture();await enableLocalFixture();await reserve(f);await admin('wardrobe_ai_mark_sent',[A,id(900)]);
  await db.query('update public.wardrobe_body_fit set ai_consent_at=null,ai_consent_version=null where account_id=$1',[A]);
  const result=await admin('wardrobe_ai_settle',[A,id(900),'succeeded',usage]);
  assert.equal(result.status,'failed');assert.equal(result.errorCode,'CANCELLED');assert.equal(result.spentPln,0.25);
});
