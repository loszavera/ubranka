import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import { makeDatabase } from './support/database.mjs';
const db=await makeDatabase(),query=db.query.bind(db);
db.query=async(...args)=>{await db.exec('savepoint fixture_statement');try{const result=await query(...args);await db.exec('release savepoint fixture_statement');return result;}catch(e){await db.exec('rollback to savepoint fixture_statement');await db.exec('release savepoint fixture_statement');throw e;}};
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`,A=id(1),B=id(2),C=id(3),HASH='a'.repeat(64);
const params={model:'gpt-image-2.5-flare-2026-09-08',n:1,quality:'medium',size:'1024x1536',output_format:'png',background:'opaque',moderation:'auto'};
const usage={textInputTokens:230,imageInputTokens:3072,imageOutputTokens:343};
let manifest;
// B's historical arithmetic remains exercised against current schema by the
// disposable DB owner. C1 revokes remote B admission; pilot-database verifies it.
async function admin(name,args=[]){const historical=['wardrobe_b_provision','wardrobe_b_activate','wardrobe_b_plan','wardrobe_b_reserve','wardrobe_b_mark_sent','wardrobe_b_manifest'].includes(name);if(!historical)await db.exec('set role service_role');try{return(await db.query(`select public.${name}(${args.map((_,n)=>`$${n+1}`).join(',')}) value`,args)).rows[0].value;}finally{await db.exec('reset role');}}
async function user(account,action,payload={}){await db.query("select set_config('request.jwt.claim.sub',$1,false)",[account]);await db.exec('set role authenticated');try{return(await db.query('select public.wardrobe_execute($1,$2) value',[action,JSON.stringify(payload)])).rows[0].value;}finally{await db.exec('reset role');}}
async function asUser(account,sql,args=[]){await db.query("select set_config('request.jwt.claim.sub',$1,false)",[account]);await db.exec('set role authenticated');try{return await db.query(sql,args);}finally{await db.exec('reset role');}}
async function storage(photo,bucket='wardrobe-private'){await db.query('insert into storage.objects(bucket_id,name) values($1,$2),($1,$3)',[bucket,photo.main_path,photo.thumb_path]);}
async function fixture(account,base){
  const items=[],photos=[],outfits=[];
  for(let n=0;n<4;n++){
    const item=id(base+n),photoId=id(base+10+n);items.push(item);photos.push(photoId);
    await user(account,'createItem',{itemId:item,name:'Synthetic',category:['top','bottom','shoes','dress'][n],color:'blue',occasions:['casual','elegant','wedding'],size:'M',photoKind:'garment'});
    const photo=await admin('wardrobe_reserve_photo',[account,item,photoId,1,100,50,HASH]);await storage(photo);await admin('wardrobe_commit_photo',[account,photoId]);
  }
  const bp=await admin('wardrobe_reserve_body_photo',[account,id(base+20),0,100,50,HASH,'p33a-body-v1']);await storage(bp);await admin('wardrobe_commit_body_photo',[account,bp.id]);
  for(let n=0;n<3;n++){
    const ids=account===A&&n===2?[items[3],items[2]]:items.slice(0,3);
    outfits.push({id:id(base+30+n),profileId:'daily',occasion:['casual','elegant','wedding'][n],itemIds:ids,itemRevisions:Object.fromEntries(ids.map(x=>[x,2])),createdAt:'2026-10-25T00:00:00.000Z'});
  }
  await user(account,'saveStyling',{expectedRevision:0,data:{outfits,feedback:[]}});
  return outfits.map((o,n)=>({id:`B0${n*2+(account===A?1:2)}`,accountId:account,label:'Synthetic case',outfitId:o.id,bodyRevision:1,stylingRevision:1,
    inputPhotoIds:[bp.id,...o.itemIds.map(x=>photos[items.indexOf(x)])],inputHashes:Array(o.itemIds.length+1).fill(HASH),prompt:'Synthetic adults only.',promptSha256:HASH,params}));
}
const provision=()=>admin('wardrobe_b_provision',[manifest]);
const activate=()=>admin('wardrobe_b_activate',[HASH]);
const cs=caseId=>manifest.cases.find(c=>c.id===caseId);
const reserve=(caseId='B01',jid=id(900))=>{const c=cs(caseId);return admin('wardrobe_b_reserve',[c.accountId,jid,caseId,c.inputHashes,c.promptSha256]);};
const sent=(caseId='B01',jid=id(900))=>{const c=cs(caseId);return admin('wardrobe_b_mark_sent',[c.accountId,jid,c.inputHashes,c.promptSha256]);};
const complete=(account=A,jid=id(900),publish=false,u=usage)=>admin('wardrobe_b_complete',[account,jid,u,publish,{}]);
const file=(account=A,jid=id(900),fid=id(901))=>admin('wardrobe_b_manifest',[account,jid,fid,1000,100,HASH,HASH]);
test.beforeEach(async()=>{
  await db.exec('begin');
  for(const [account,email] of [[A,'p33b-a@example.com'],[B,'p33b-b@example.com'],[C,'ordinary@example.invalid']]){
    await db.query('insert into auth.users values($1,$2,now())',[account,email]);await db.query('insert into wardrobe_private.invites(email) values($1)',[email]);await user(account,'bootstrap');
    await user(account,'saveState',{expectedRevision:0,data:{locale:'pl',profiles:[{id:'daily',name:'Daily',audience:'women',occasion:'casual',budget:500,priority:'comfort',defaultMode:'best'}],activeProfileId:'daily',feedback:[],askReason:true}});
  }
  manifest={id:'p33b-v1',manifestSha256:HASH,cases:[...await fixture(A,100),...await fixture(B,200)].sort((a,b)=>a.id.localeCompare(b.id))};
});
test.afterEach(async()=>db.exec('rollback'));test.after(async()=>db.close());

test('provision is service-only, immutable, six exact cases / two synthetic accounts; ordinary API stays OFF',async()=>{
  assert.equal(await admin('wardrobe_worker_authorized'),true);
  await assert.rejects(asUser(A,'select public.wardrobe_worker_authorized()'),/permission denied/);
  await db.exec('set role anon');await assert.rejects(db.query('select public.wardrobe_worker_authorized()'),/permission denied/);await db.exec('reset role');
  await assert.rejects(asUser(A,'select public.wardrobe_b_provision($1)',[manifest]),/permission denied/);
  await assert.rejects(admin('wardrobe_b_provision',[{...manifest,cases:manifest.cases.slice(0,5)}]),/INVALID_MANIFEST/);
  const wrong=structuredClone(manifest);wrong.cases[0].params.n=2;
  await assert.rejects(admin('wardrobe_b_provision',[wrong]),/INVALID_MANIFEST/);
  await provision();await assert.rejects(provision(),/CONFLICT/);
  assert.equal((await user(A,'bootstrap')).visualization.mode,'off');await activate();
  assert.equal((await user(A,'bootstrap')).visualization.mode,'off');
  assert.equal((await user(C,'bootstrap')).visualization.mode,'off');assert.equal((await user(C,'bootstrap')).visualization.trial,null);
  await assert.rejects(user(A,'requestVisualization',{caseId:'B01',accepted:true}),/AI_DISABLED/);
  await assert.rejects(admin('wardrobe_ai_reserve',[A,id(999),cs('B01').outfitId,1,1]),/AI_DISABLED/);
  await assert.rejects(admin('wardrobe_b_plan',[B,'B01']),/AI_DISABLED/);
  await assert.rejects(admin('wardrobe_b_activate',[HASH]),/CONFLICT/);
});
test('hash/metadata and calibration guards precede reservations; first hold is full 10 PLN',async()=>{
  await provision();await activate();await assert.rejects(reserve('B02'),/CALIBRATION_REQUIRED/);
  await assert.rejects(admin('wardrobe_b_reserve',[A,id(900),'B01',['b'.repeat(64)],HASH]),/MANIFEST_MISMATCH/);
  const job=await reserve();assert.equal(job.reservedPln,10);
  assert.equal((await db.query("select reserved_cents from wardrobe_private.ai_budgets where scope='trial:p33b-v1'")).rows[0].reserved_cents,1000);
  assert.deepEqual(await reserve(),job);await assert.rejects(reserve('B01',id(999)),/CASE_USED/);
  assert.equal(await sent(),true);assert.equal(await sent(),false);
  await complete();const next=await reserve('B02',id(902));assert.equal(next.reservedPln,1);
  assert.equal((await user(A,'bootstrap')).visualization.trial.sentCount,1);
});
test('six sends maximum and permanent case slots survive result deletion and a new UUID',async()=>{
  await provision();await activate();
  for(let n=1;n<=6;n++) {const caseId=`B0${n}`,jid=id(900+n);await reserve(caseId,jid);assert.equal(await sent(caseId,jid),true);const done=await complete(cs(caseId).accountId,jid);
    await user(cs(caseId).accountId,'deleteVisualization',{jobId:jid,expectedRevision:done.revision});}
  const snap=(await user(A,'bootstrap')).visualization;assert.equal(snap.trial.sentCount,6);assert.equal(snap.jobs.length,0);
  for(const c of manifest.cases)await assert.rejects(reserve(c.id,id(999)),/CASE_USED/);
  await assert.rejects(admin('wardrobe_b_reserve',[A,id(999),'B07',[],HASH]),/AI_DISABLED/);
});
test('single global slot and revised cost rule; actual over-reserve blocks without clipping spend',async()=>{
  await provision();await activate();await reserve();await assert.rejects(reserve('B02',id(902)),/AI_BUSY/);await sent();
  await complete(A,id(900),false,{textInputTokens:0,imageInputTokens:0,imageOutputTokens:4000});
  const next=await reserve('B02',id(902));assert.equal(next.reservedPln,1.84);
  await sent('B02',id(902));const over=await complete(B,id(902),false,{textInputTokens:60000,imageInputTokens:0,imageOutputTokens:0});
  assert.equal(over.spentPln,2.03);await assert.rejects(reserve('B03',id(903)),/AI_UNAVAILABLE/);
});
test('known completion publishes only with both real manifest paths, RLS and export; review independent of styling',async()=>{
  await provision();await activate();await reserve();await sent();const f=await file();
  assert.equal((await asUser(A,'select * from public.wardrobe_visualization_files')).rows.length,0);
  await storage(f,'wardrobe-results');const done=await complete(A,id(900),true);assert.equal(done.status,'succeeded');assert.equal(done.result.mimeType,'image/png');
  assert.equal(done.expiresAt,done.result.expiresAt);assert.ok(Date.parse(done.expiresAt)-Date.now()>29*86400000);
  assert.equal((await asUser(A,'select * from public.wardrobe_visualization_files')).rows.length,1);
  assert.equal((await asUser(B,'select * from public.wardrobe_visualization_files')).rows.length,0);
  assert.equal((await asUser(A,'select * from storage.objects')).rows.length,0);
  assert.equal((await user(A,'export')).visualization.jobs[0].result.mainPath,f.main_path);
  const review=await user(A,'reviewVisualization',{jobId:done.id,expectedRevision:done.revision,scores:{person:2,garments:1,completeness:2,artifacts:2,usefulness:1},criticalError:false,note:'Synthetic assessment'});
  assert.equal(review.review.scores.garments,1);assert.deepEqual((await user(A,'bootstrap')).styling.data.feedback,[]);
  await assert.rejects(user(B,'reviewVisualization',{jobId:done.id,expectedRevision:done.revision}),/NOT_FOUND/);
});
test('manifest-before-write, deletion during upload, lease and Storage-confirmed physical cleanup',async()=>{
  await provision();await activate();await reserve();await sent();const f=await file();
  await user(A,'deleteBodyPhoto',{expectedRevision:1});await storage(f,'wardrobe-results');
  const done=await complete(A,id(900),true);assert.equal(done.status,'failed');assert.equal(done.spentPln,0.25);
  assert.equal((await asUser(A,'select * from public.wardrobe_visualization_files')).rows.length,0);
  await assert.rejects(admin('wardrobe_finish_result_delete',[f.id]),/DELETE_INCOMPLETE/);
  await db.query("update public.wardrobe_visualization_files set cleanup_after=now()-interval '1 second' where id=$1",[f.id]);
  await assert.rejects(admin('wardrobe_finish_result_delete',[f.id]),/DELETE_INCOMPLETE/);
  await db.query("delete from storage.objects where bucket_id='wardrobe-results' and name in($1,$2)",[f.main_path,f.thumb_path]);
  await admin('wardrobe_finish_result_delete',[f.id]);assert.equal((await db.query('select * from public.wardrobe_visualization_files')).rows.length,0);
});
test('pre-send versions/expiry prevent dispatch; unknown holds stop globally with no retry',async()=>{
  await provision();await activate();await reserve();
  await db.query('update public.wardrobe_body_fit set revision=revision+1 where account_id=$1',[A]);assert.equal(await sent(),false);
  assert.equal((await user(A,'getVisualization',{jobId:id(900)})).status,'cancelled');
  await db.query('update public.wardrobe_body_fit set revision=revision-1 where account_id=$1',[A]);
  await assert.rejects(reserve('B01',id(999)),/CASE_USED/);
});
test('unknown usage and watchdog preserve full holds; closing never resets the 24-hour window',async()=>{
  await provision();await activate();await reserve();await sent();const unknown=await complete(A,id(900),false,null);
  assert.equal(unknown.status,'outcome_unknown');assert.equal(unknown.reservedPln,10);
  await assert.rejects(reserve('B02',id(902)),/AI_UNAVAILABLE/);
  assert.equal((await user(A,'bootstrap')).visualization.trial.blocked,true);
  await admin('wardrobe_b_close');await assert.rejects(activate(),/CONFLICT/);
});
test('full result quota counts active and pending outputs alongside new wardrobe/body uploads',async()=>{
  await provision();await activate();await reserve();await sent();const f=await file();await storage(f,'wardrobe-results');await complete(A,id(900),true);
  await db.query('update public.wardrobe_visualizations set reserved_bytes=8100000 where account_id=$1',[A]);
  // Each synthetic file is retained in the quota while deleting. Fill using ordinary
  // historic photos; the shared trigger, not a string assertion, must reject upload.
  await db.query('update public.wardrobe_visualization_files set bytes=8000000,thumb_bytes=100000,status=\'deleting\' where id=$1',[f.id]);
  await db.query(`insert into public.wardrobe_photos(id,account_id,item_id,expected_revision,main_path,thumb_path,bytes,thumb_bytes,mime_type,fingerprint,status)
    select gen_random_uuid(),$1,$2,1,'main-'||n,'thumb-'||n,1000000,100000,'image/jpeg',$3,'deleting' from generate_series(1,212) n`,[A,id(100),HASH]);
  await assert.rejects(db.query(`insert into public.wardrobe_photos(id,account_id,item_id,kind,expected_revision,main_path,thumb_path,bytes,thumb_bytes,mime_type,fingerprint)
    values($1,$2,null,'body',1,'new-main','new-thumb',1000000,100000,'image/jpeg',$3)`,[id(999),A,HASH]),/STORAGE_LIMIT/);
});
test('expiration hides reads immediately and late cleanup cannot lose unresolved file paths',async()=>{
  await provision();await activate();await reserve();await sent();const f=await file();await storage(f,'wardrobe-results');await complete(A,id(900),true);
  await db.query("update public.wardrobe_visualization_files set expires_at=now()-interval '1 second' where id=$1",[f.id]);
  assert.equal((await asUser(A,'select * from public.wardrobe_visualization_files')).rows.length,0);
  await db.query("update public.wardrobe_visualizations set completed_at=now()-interval '91 days' where id=$1",[id(900)]);
  await admin('wardrobe_expire_uploads');assert.equal((await db.query('select status from public.wardrobe_visualization_files')).rows[0].status,'deleting');
  assert.equal((await db.query('select id from public.wardrobe_visualizations')).rows.length,1);
});
test('trial budget rejects a large measured follow-up reservation and the monthly ledger is not reset',async()=>{
  await provision();await activate();await reserve();await sent();await complete(A,id(900),false,{textInputTokens:200000,imageInputTokens:0,imageOutputTokens:0});
  await assert.rejects(reserve('B02',id(902)),/AI_BUDGET_LIMIT/);
  assert.equal((await db.query("select spent_cents from wardrobe_private.ai_budgets where scope='trial:p33b-v1'")).rows[0].spent_cents,677);
});
test('expired 24h window or UTC month rollover between reserve and send cannot dispatch or reopen',async()=>{
  await provision();await activate();await reserve();
  await db.exec("update wardrobe_private.b_trial set activated_at=now()-interval '25 hours',ends_at=now()-interval '1 hour'");
  assert.equal(await sent(),false);assert.equal((await user(A,'bootstrap')).visualization.mode,'off');
  assert.ok((await user(A,'bootstrap')).visualization.trial);await assert.rejects(activate(),/CONFLICT/);
});
test('late completion after trial close still settles cost but never publishes',async()=>{
  await provision();await activate();await reserve();await sent();const f=await file();await storage(f,'wardrobe-results');
  await admin('wardrobe_b_close');const done=await complete(A,id(900),true);
  assert.equal(done.status,'failed');assert.equal(done.result,null);assert.equal(done.spentPln,0.25);
  assert.equal((await db.query('select status from public.wardrobe_visualization_files')).rows[0].status,'deleting');
});
test('watchdog retains unknown hold, and account deletion cannot drop upload paths or dispatch evidence',async()=>{
  await provision();await activate();await reserve();await sent();const f=await file();
  await user(A,'deleteAccount');assert.equal(await admin('wardrobe_prepare_auth_delete',[A]),false);
  await db.query("update public.wardrobe_visualizations set sent_at=now()-interval '6 minutes' where id=$1",[id(900)]);
  await admin('wardrobe_expire_uploads');assert.equal((await db.query('select status from public.wardrobe_visualizations')).rows[0].status,'outcome_unknown');
  await db.query("update public.wardrobe_visualization_files set cleanup_after=now()-interval '1 second' where id=$1",[f.id]);
  await admin('wardrobe_finish_result_delete',[f.id]);
  // Simulate only the fixture's successful Storage API deletion, then finish metadata.
  await db.query("delete from storage.objects where bucket_id='wardrobe-private' and name like $1",[`${A}/%`]);
  await db.query("update public.wardrobe_photos set cleanup_after=now()-interval '1 second' where account_id=$1",[A]);
  for(const p of(await db.query('select id from public.wardrobe_photos where account_id=$1',[A])).rows)await admin('wardrobe_finish_photo_delete',[p.id]);
  await admin('wardrobe_finish_item_deletes');assert.equal(await admin('wardrobe_prepare_auth_delete',[A]),true);
  assert.equal((await db.query('select count(*) n from public.wardrobe_visualizations where account_id=$1',[A])).rows[0].n,0);
  const c=(await db.query("select account_id,input_hashes,job_id,sent_at from wardrobe_private.b_cases where id='B01'")).rows[0];
  assert.equal(c.account_id,null);assert.equal(c.input_hashes,null);assert.equal(c.job_id,id(900));assert.ok(c.sent_at);
  assert.equal((await db.query("select reserved_cents from wardrobe_private.ai_budgets where scope='trial:p33b-v1'")).rows[0].reserved_cents,1000);
});
test('immediate invite revocation denies stored PNG and a late measured result while preserving cost',async()=>{
  await provision();await activate();await reserve();await sent();const f=await file();await storage(f,'wardrobe-results');
  await db.exec("update wardrobe_private.invites set enabled=false where email='p33b-a@example.com'");
  assert.equal((await asUser(A,'select * from public.wardrobe_visualization_files')).rows.length,0);
  const done=await complete(A,id(900),true);assert.equal(done.status,'failed');assert.equal(done.spentPln,0.25);
});
test('operator hosted rollback smoke SQL executes all six transitions inside an isolated outer fixture',async()=>{
  const sql=(await readFile(new URL('./hosted-trial-smoke.sql',import.meta.url),'utf8'))
    .replaceAll('__MANIFEST_BASE64__',Buffer.from(JSON.stringify(manifest)).toString('base64')).replace(/^begin;$/m,'').replace(/^rollback;$/m,'');
  await db.exec(sql);assert.equal((await db.query('select count(*) n from wardrobe_private.b_cases where sent_at is not null')).rows[0].n,6);
});
test('scoped hosted result setup/activate/teardown SQL affects only explicit synthetic fixture',async()=>{
  const v={accountId:A,jobId:id(990),fileId:id(991),outfitId:cs('B01').outfitId,bytes:1000,thumbBytes:100,sha256:HASH,thumbSha256:HASH};
  const run=async name=>{const sql=(await readFile(new URL(name,import.meta.url),'utf8')).replaceAll('__RESULT_BASE64__',Buffer.from(JSON.stringify(v)).toString('base64')).replace(/^begin;$/m,'').replace(/^commit;$/m,'');await db.exec(sql);};
  await run('./hosted-result-fixture.sql');const f=(await db.query('select * from public.wardrobe_visualization_files')).rows[0];
  const originalJob=v.jobId;v.jobId=id(992);
  await db.exec('savepoint wrong_operator_fixture');
  await assert.rejects(run('./hosted-result-teardown.sql'),/WRONG_FIXTURE/);
  await db.exec('rollback to savepoint wrong_operator_fixture; release savepoint wrong_operator_fixture');v.jobId=originalJob;
  assert.equal((await db.query('select ai_consent_version from public.wardrobe_body_fit where account_id=$1',[A])).rows[0].ai_consent_version,'p33b-storage-fixture-v1');
  assert.equal((await asUser(A,'select * from public.wardrobe_visualization_files')).rows.length,0);
  await storage(f,'wardrobe-results');await run('./hosted-result-activate.sql');assert.equal((await asUser(A,'select * from public.wardrobe_visualization_files')).rows.length,1);
  await db.query("delete from storage.objects where bucket_id='wardrobe-results' and name in($1,$2)",[f.main_path,f.thumb_path]);
  await run('./hosted-result-teardown.sql');assert.equal((await db.query('select count(*) n from public.wardrobe_visualization_files')).rows[0].n,0);
  assert.equal((await db.query('select ai_consent_version from public.wardrobe_body_fit where account_id=$1',[A])).rows[0].ai_consent_version,null);
  assert.equal((await user(B,'bootstrap')).items.length,4);
});
