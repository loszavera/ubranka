import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {makeDatabase} from './support/database.mjs';
const db=await makeDatabase(),raw=db.query.bind(db);
db.query=async(...args)=>{await db.exec('savepoint statement');try{const r=await raw(...args);await db.exec('release savepoint statement');return r;}catch(e){await db.exec('rollback to savepoint statement');await db.exec('release savepoint statement');throw e;}};
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`,A=id(1),B=id(2),HASH='a'.repeat(64),TRIAL='p33c-fixture-local';
const usage={textInputTokens:230,imageInputTokens:3072,imageOutputTokens:343};
async function sql(name,args=[],schema='public'){return(await db.query(`select ${schema}.${name}(${args.map((_,n)=>`$${n+1}`).join(',')}) v`,args)).rows[0].v;}
async function admin(name,args=[]){await db.exec('set role service_role');try{return await sql(name,args);}finally{await db.exec('reset role');}}
async function user(account,action,payload={}){await db.query("select set_config('request.jwt.claim.sub',$1,false)",[account]);await db.exec('set role authenticated');try{return await sql('wardrobe_execute',[action,payload]);}finally{await db.exec('reset role');}}
async function storage(p){await db.query('insert into storage.objects(bucket_id,name) values($1,$2),($1,$3)',[p.bucket??'wardrobe-private',p.main_path,p.thumb_path]);}
async function fixture(account,base){
 const items=[];
 for(let n=0;n<3;n++){
  const iid=id(base+n);items.push(iid);
  await user(account,'createItem',{itemId:iid,name:'Synthetic',category:['top','bottom','shoes'][n],color:'blue',occasions:['casual'],size:'M',photoKind:'garment'});
  const p=await admin('wardrobe_reserve_photo',[account,iid,id(base+10+n),1,100,50,HASH]);await storage(p);await admin('wardrobe_commit_photo',[account,p.id]);
 }
 const p=await admin('wardrobe_reserve_body_photo',[account,id(base+20),0,100,50,HASH,'p33a-body-v1']);await storage(p);await admin('wardrobe_commit_body_photo',[account,p.id]);
 const outfit={id:id(base+30),profileId:'daily',occasion:'casual',itemIds:items,itemRevisions:Object.fromEntries(items.map(x=>[x,2])),createdAt:'2026-10-26T00:00:00Z'};
 await user(account,'saveStyling',{expectedRevision:0,data:{outfits:[outfit],feedback:[]}});return outfit;
}
let outfits;
const prepare=(account=A)=>user(account,'prepareVisualization',{trialId:TRIAL,outfitId:outfits[account].id,expectedBodyRevision:1,expectedStylingRevision:1});
const reserve=(account,intent,jid=id(900),epoch=0)=>sql('c_reserve_core',[account,jid,intent,epoch],'wardrobe_private');
const sent=(jid=id(900))=>sql('c_mark_sent_core',[jid],'wardrobe_private');
const manifest=(jid=id(900),fid=id(901))=>sql('c_manifest_core',[jid,fid,1000,100,HASH,HASH,'image/jpeg',600,900],'wardrobe_private');
const complete=(jid=id(900),publish=false,u=usage)=>admin('wardrobe_c_complete',[jid,u,publish]);
async function finish(){const f=await manifest();await storage(f);return complete(id(900),true);}
test.beforeEach(async()=>{
 await db.exec('begin');outfits={};
 for(const [account,email,base] of [[A,'c1-a@example.com',100],[B,'c1-b@example.com',200]]){
  await db.query('insert into auth.users values($1,$2,now())',[account,email]);await db.query('insert into wardrobe_private.invites(email) values($1)',[email]);await user(account,'bootstrap');
  await user(account,'saveState',{expectedRevision:0,data:{locale:'pl',profiles:[{id:'daily',name:'Daily',audience:'women',occasion:'casual',budget:500,priority:'comfort',defaultMode:'best'}],activeProfileId:'daily',feedback:[],askReason:true}});
  outfits[account]=await fixture(account,base);
 }
 await db.query("insert into wardrobe_private.c_trials(id,status,starts_at,ends_at,blocked) values($1,'active',now()-interval '1 minute',now()-interval '1 minute'+interval '30 days',false)",[TRIAL]);
 await db.query('insert into wardrobe_private.c_members(trial_id,slot,account_id) values($1,1,$2),($1,2,$3)',[TRIAL,A,B]);
});
test.afterEach(()=>db.exec('rollback'));test.after(()=>db.close());

test('all remotely callable admission is hard OFF; private core is inaccessible even to service_role',async()=>{
 const i=await prepare();
 await assert.rejects(user(A,'requestVisualization',{operationId:id(900),intentId:i.id,accepted:true}),/AI_DISABLED/);
 await assert.rejects(admin('wardrobe_c_reserve',[A,id(900),i.id,0]),/AI_DISABLED/);
 await assert.rejects(admin('wardrobe_c_mark_sent',[id(900)]),/AI_DISABLED/);
 await assert.rejects(admin('wardrobe_b_activate',[HASH]),/permission denied/);
 await assert.rejects(admin('wardrobe_ai_reserve',[A,id(900),outfits[A].id,1,1]),/AI_DISABLED/);
 await db.exec('set role service_role');await assert.rejects(reserve(A,i.id),/permission denied/);await db.exec('reset role');
 const snap=(await user(A,'bootstrap')).visualization;
 assert.equal(snap.mode,'off');assert.equal(snap.pilot.status,'prepared');assert.equal(snap.pilot.blocked,true);assert.equal(snap.pilot.eligible,false);
 assert.equal((await db.query('select count(*) n from wardrobe_private.c_attempts')).rows[0].n,0);
});
test('own preview is immutable/idempotent and selected input changes conflict; foreign intent is denied',async()=>{
 const i=await prepare();assert.equal((await prepare()).id,i.id);assert.equal(i.inputs.length,4);assert.equal(i.inputs[0].kind,'body');
 await assert.rejects(reserve(B,i.id),/NOT_FOUND/);
 await db.query('update public.wardrobe_items set revision=revision+1 where id=$1',[id(100)]);
 await assert.rejects(reserve(A,i.id),/CONFLICT/);
});
test('atomic global slot, first reservation preserves shared monthly B spend, replay cannot reserve twice',async()=>{
 await db.query("insert into wardrobe_private.ai_budgets(scope,limit_cents,spent_cents) values('month:'||to_char(now() at time zone 'UTC','YYYY-MM'),2500,149)");
 const i=await prepare(),other=await prepare(B),j=await reserve(A,i.id);
 assert.equal(j.reservedPln,23.51);assert.deepEqual(await reserve(A,i.id),j);
 await assert.rejects(reserve(A,i.id,id(999)),/CASE_USED/);await assert.rejects(reserve(B,other.id,id(902)),/AI_BUSY/);
 assert.equal(await sent(),true);assert.equal(await sent(),false);await complete();
 assert.equal((await db.query("select spent_cents from wardrobe_private.ai_budgets where scope like 'month:%'")).rows[0].spent_cents,174);
 const next=await reserve(B,other.id,id(902));assert.equal(next.reservedPln,1);
});
test('explicit variant metadata and caller RLS protect JPEG result and old PNG; unrelated feedback does not invalidate',async()=>{
 const i=await prepare();await reserve(A,i.id);await sent();const done=await finish();
 assert.equal(done.result.thumbMimeType,'image/jpeg');assert.equal(done.result.thumbWidth,600);assert.equal(done.expiresAt,done.result.expiresAt);
 await db.query("update public.wardrobe_styling set revision=revision+1,data=jsonb_set(data,'{feedback}','[]') where account_id=$1",[A]);
 assert.equal((await user(A,'getVisualization',{jobId:done.id})).result.thumbWidth,600);
 for(const [account,allowed] of [[A,true],[B,false]]){
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[account]);await db.exec('set role authenticated');
  const v=await sql('wardrobe_photo_variant',[done.result.thumbPath]);assert.equal(!!v,allowed);if(v){assert.equal(v.bucket,'wardrobe-results');assert.equal(v.mimeType,'image/jpeg');}
  await db.exec('reset role');
 }
});
test('withdrawal epoch blocks late publication and reaccept cannot revive; completed output remains readable',async()=>{
 const i=await prepare();await reserve(A,i.id);await sent();const f=await manifest();
 await user(A,'setAiConsent',{accepted:false,consentVersion:'p33c-ai-v1.1',expectedConsentRevision:1});
 await db.query('update wardrobe_private.c_consents set accepted=true,revision=revision+1 where account_id=$1',[A]);
 await storage(f);assert.equal((await complete(id(900),true)).status,'failed');
 assert.equal((await db.query('select status from public.wardrobe_visualization_files')).rows[0].status,'deleting');
});
test('completed results survive revoke/normal trial end; delete AI data preserves original body and wardrobe',async()=>{
 const i=await prepare();await reserve(A,i.id);await sent();const done=await finish();
 await user(A,'setAiConsent',{accepted:false,consentVersion:'p33c-ai-v1.1',expectedConsentRevision:1});
 await db.query("update wardrobe_private.c_trials set status='closed',blocked=true where id=$1",[TRIAL]);
 assert.ok((await user(A,'getVisualization',{jobId:done.id})).result);
 const before=await user(A,'bootstrap');await user(A,'deleteAiData',{expectedRevision:1});const after=await user(A,'bootstrap');
 assert.deepEqual(after.bodyFit,before.bodyFit);assert.deepEqual(after.items,before.items);assert.equal(after.visualization.jobs.length,0);
 await assert.rejects(reserve(A,i.id,id(999)),/CASE_USED/);
});
test('normal stop permits in-flight publication within deadline but late deadline does not; usage settles while OFF',async()=>{
 const i=await prepare();await reserve(A,i.id);await sent();const f=await manifest();await storage(f);
 await db.query("update wardrobe_private.c_trials set status='closed',blocked=true where id=$1",[TRIAL]);
 assert.equal((await complete(id(900),true)).status,'succeeded');
 assert.equal((await db.query('select blocked from wardrobe_private.ai_control')).rows[0].blocked,true);
});
test('input deletion and output expiry block reads before physical cleanup, preserving late-write manifest',async()=>{
 const i=await prepare();await reserve(A,i.id);await sent();const done=await finish();
 await db.query("update public.wardrobe_visualization_files set expires_at=now()-interval '1 second' where job_id=$1",[done.id]);
 assert.equal((await user(A,'getVisualization',{jobId:done.id})).result,null);
 await admin('wardrobe_expire_uploads');assert.equal((await db.query('select status from public.wardrobe_visualization_files')).rows[0].status,'deleting');
 await assert.rejects(admin('wardrobe_finish_result_delete',[id(901)]),/DELETE_INCOMPLETE/);
});
test('unknown cost retains hold; accounting survives removal of all personal rows without replay',async()=>{
 const i=await prepare();await reserve(A,i.id);await sent();await complete(id(900),false,null);
 await db.query('delete from auth.users where id=$1',[A]);
 const a=(await db.query('select * from wardrobe_private.c_attempts')).rows[0];assert.equal(a.reserved_cents,2500);assert.equal(a.status,'outcome_unknown');
 assert.equal((await db.query('select account_id from wardrobe_private.c_members where slot=1')).rows[0].account_id,null);
 assert.equal((await complete()).spentPln,0.25);assert.equal((await complete()).spentPln,0.25);
 assert.equal((await db.query("select spent_cents,reserved_cents from wardrobe_private.ai_budgets where scope=$1",['trial:'+TRIAL])).rows[0].reserved_cents,0);
});
test('actual retained files plus output holds enforce 100MB and 250MB bounds',async()=>{
 const i=await prepare();await reserve(A,i.id);await sent();await finish();
 // Existing real manifest counts even when pending deletion. Synthetic jobs are
 // financial-free historic rows solely to exercise aggregate capacity.
 await db.query("update public.wardrobe_visualization_files set bytes=8000000,thumb_bytes=100000 where job_id=$1",[id(900)]);
 await db.query(`insert into public.wardrobe_visualizations(id,account_id,outfit_id,fingerprint,input_photo_ids,input_body_revision,input_styling_revision,input_item_revisions,status,trial_scope,month_scope,consent_version,reserved_cents,reserved_bytes)
 select gen_random_uuid(),$1,$2,'historic','{}',1,1,'{}','failed','old','old','old',0,8100000 from generate_series(1,11)`,[A,outfits[A].id]);
 await db.query("update public.wardrobe_styling set data=jsonb_set(data,'{outfits,0,occasion}','\"work\"') where account_id=$1",[A]);
 const next=await prepare();await assert.rejects(reserve(A,next.id,id(902),1),/STORAGE_LIMIT/);
});
test('UTC month rollover before dispatch releases only an unsent reservation and never permits another UUID',async()=>{
 const i=await prepare();await reserve(A,i.id);
 await db.query("update wardrobe_private.c_attempts set month_scope='month:1900-01' where id=$1",[id(900)]);
 assert.equal(await sent(),false);assert.equal((await user(A,'getVisualization',{jobId:id(900)})).status,'cancelled');
 await assert.rejects(reserve(A,i.id,id(999)),/CASE_USED/);
});
test('end of 30-day trial and expired reservation before send cancel without a paid slot',async()=>{
 const i=await prepare();await reserve(A,i.id);
 await db.query("update wardrobe_private.c_trials set starts_at=now()-interval '30 days',ends_at=now() where id=$1",[TRIAL]);
 assert.equal(await sent(),false);
 assert.equal((await db.query('select sent_at,reserved_cents from wardrobe_private.c_attempts')).rows[0].sent_at,null);
 const other=await prepare(B);await assert.rejects(reserve(B,other.id,id(902)),/AI_DISABLED/);
});
test('reserved expiry frees its exact holds, while sent watchdog retains unknown cost and rejects late publication',async()=>{
 const i=await prepare();await reserve(A,i.id);
 await db.query("update public.wardrobe_visualizations set expires_at=now()-interval '1 second' where id=$1",[id(900)]);
 await admin('wardrobe_expire_uploads');assert.equal((await db.query('select status,reserved_cents from wardrobe_private.c_attempts')).rows[0].status,'expired');
 const other=await prepare(B);await reserve(B,other.id,id(902));await sent(id(902));
 await db.query("update public.wardrobe_visualizations set sent_at=now()-interval '6 minutes' where id=$1",[id(902)]);
 await admin('wardrobe_expire_uploads');const a=(await db.query('select status,reserved_cents from wardrobe_private.c_attempts where id=$1',[id(902)])).rows[0];
 assert.equal(a.status,'outcome_unknown');assert.equal(a.reserved_cents,2500);
 assert.equal(await sql('c_manifest_core',[id(902),id(903),1000,100,HASH,HASH,'image/jpeg',600,900],'wardrobe_private'),null);
 assert.equal((await complete(id(902),true)).status,'failed');
});
test('publication deadline and invite revocation discard late files yet charge measured usage',async()=>{
 const i=await prepare();await reserve(A,i.id);await sent();const f=await manifest();await storage(f);
 await db.query("update wardrobe_private.c_attempts set publish_until=now()-interval '1 second' where id=$1",[id(900)]);
 assert.equal((await complete(id(900),true)).status,'failed');
 const other=await prepare(B);await reserve(B,other.id,id(902));await sent(id(902));
 await db.query("update wardrobe_private.invites set enabled=false where email='c1-b@example.com'");
 assert.equal((await complete(id(902),true)).status,'failed');
 assert.equal(Number((await db.query('select sum(spent_cents) n from wardrobe_private.c_attempts')).rows[0].n),50);
});
test('25PLN total cap and over-reservation measured cost never reset or clip accounting',async()=>{
 const i=await prepare();await reserve(A,i.id);await sent();
 await complete(id(900),false,{textInputTokens:1_000_000,imageInputTokens:0,imageOutputTokens:0});
 const a=(await db.query('select spent_cents from wardrobe_private.c_attempts')).rows[0];assert.ok(a.spent_cents>2500);
 const other=await prepare(B);await assert.rejects(reserve(B,other.id,id(902)),/AI_DISABLED/);
 assert.equal((await db.query('select blocked from wardrobe_private.c_trials where id=$1',[TRIAL])).rows[0].blocked,true);
});
for(const [name,count,sameMember,today] of [['daily',5,true,true],['account',30,true,false],['trial',60,false,false]]){
 test(`${name} count includes failed paid sends, survives deletion and does not reset with month`,async()=>{
  const i=await prepare();
  await db.query(`insert into wardrobe_private.c_attempts(id,trial_id,member_id,status,month_scope,reserved_cents,consent_revision,sent_at)
   select gen_random_uuid(),$1,(select id from wardrobe_private.c_members where trial_id=$1 and slot=$2),'failed','month:1900-01',0,1,
    now()-case when $3 then interval '0 seconds' else interval '2 days' end from generate_series(1,$4)`,[TRIAL,sameMember?1:2,today,count]);
  await assert.rejects(reserve(A,i.id),/AI_ATTEMPT_LIMIT/);
 });
}
test('hosted result operator template stages exact synthetic manifest without financial attempts or monthly writes',async()=>{
 const tid='p33c-fixture-'+id(777);
 await db.query('insert into wardrobe_private.c_trials(id) values($1)',[tid]);
 const i=await user(A,'prepareVisualization',{trialId:tid,outfitId:outfits[A].id,expectedBodyRevision:1,expectedStylingRevision:1});
 let source=await readFile(new URL('./operator/c1-result-fixture.sql',import.meta.url),'utf8');
 for(const [k,v] of Object.entries({ACCOUNT:A,INTENT:i.id,JOB:id(900),FILE:id(901),RUN_UUID:id(777),MAIN_BYTES:1000,THUMB_BYTES:100,MAIN_SHA256:HASH,THUMB_SHA256:HASH,THUMB_WIDTH:600,THUMB_HEIGHT:900}))source=source.replaceAll(`<${k}>`,String(v));
 // Remove outer transaction commands: this test already owns a rollback fixture.
 const blocks=source.replace(/^begin;|^commit;/gm,'').split('-- STOP here:');
 await db.exec(blocks[0]);const f=(await db.query('select * from public.wardrobe_visualization_files')).rows[0];await storage(f);
 const activate='--'+blocks[1].split('-- Exercise actual user')[0];await db.exec(activate);
 const output=(await user(A,'getVisualization',{jobId:id(900)})).result;assert.equal(output.thumbMimeType,'image/jpeg');
 assert.equal((await db.query('select count(*) n from wardrobe_private.c_attempts')).rows[0].n,0);
 assert.equal((await db.query('select count(*) n from wardrobe_private.ai_budgets')).rows[0].n,0);
 assert.ok((await user(A,'export')).aiIntents.some(x=>x.id===i.id));
});
test('90-day cleanup strips private inputs and settled receipts, preserves anonymous counts/spend and unresolved hold',async()=>{
 const i=await prepare();await reserve(A,i.id);await sent();await complete();
 const other=await prepare(B);await reserve(B,other.id,id(902));await sent(id(902));await complete(id(902),false,null);
 await db.query("update public.wardrobe_visualizations set created_at=now()-interval '92 days',completed_at=case when completed_at is not null then now()-interval '91 days' end");
 await db.query("update wardrobe_private.c_attempts set created_at=now()-interval '92 days',completed_at=case when completed_at is not null then now()-interval '91 days' end");
 await db.query("update wardrobe_private.c_trials set starts_at=now()-interval '119 days',ends_at=now()-interval '89 days',status='closed' where id=$1",[TRIAL]);
 const before=(await db.query('select scope,spent_cents,reserved_cents from wardrobe_private.ai_budgets order by scope')).rows;
 await db.exec(`create temporary table member_archive_audit(id uuid);
  create function pg_temp.audit_member_archive() returns trigger language plpgsql as $$begin insert into pg_temp.member_archive_audit values(new.id); return new; end$$;
  create trigger audit_member_archive after update of archived_sends on wardrobe_private.c_members for each row execute function pg_temp.audit_member_archive();`);
 await admin('wardrobe_expire_uploads');
 assert.equal((await db.query('select count(*) n from pg_temp.member_archive_audit')).rows[0].n,1,'only the eligible settled member is updated; unknown member is untouched');
 assert.equal((await db.query('select count(*) n from public.wardrobe_visualizations')).rows[0].n,0);
 assert.deepEqual((await db.query('select scope,spent_cents,reserved_cents from wardrobe_private.ai_budgets order by scope')).rows,before);
 const receipts=(await db.query('select status,reserved_cents from wardrobe_private.c_attempts')).rows;assert.deepEqual(receipts,[{status:'outcome_unknown',reserved_cents:100}]);
 assert.equal((await db.query('select count(*) n from wardrobe_private.c_intents')).rows[0].n,0);
 assert.equal((await db.query('select count(*) n from wardrobe_private.c_attempts a join wardrobe_private.c_intents i on i.job_id=a.id')).rows[0].n,0);
 const members=(await db.query('select account_id,archived_sends from wardrobe_private.c_members where trial_id=$1',[TRIAL])).rows;
 assert.ok(members.every(x=>x.account_id===null));assert.equal(members.reduce((n,m)=>n+m.archived_sends,0),1);
 await db.exec('truncate pg_temp.member_archive_audit');
 await admin('wardrobe_expire_uploads');assert.equal(Number((await db.query('select sum(archived_sends) n from wardrobe_private.c_members')).rows[0].n),1);
 assert.equal((await db.query('select count(*) n from pg_temp.member_archive_audit')).rows[0].n,0,'no receipt eligible: repeated cleanup must not issue any member archive UPDATE');
});
