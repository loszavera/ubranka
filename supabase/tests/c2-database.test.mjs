import assert from 'node:assert/strict';
import test from 'node:test';
import {makeDatabase} from './support/database.mjs';
const db=await makeDatabase(),raw=db.query.bind(db);
db.query=async(...args)=>{await db.exec('savepoint statement');try{const r=await raw(...args);await db.exec('release savepoint statement');return r;}catch(e){await db.exec('rollback to savepoint statement');await db.exec('release savepoint statement');throw e;}};
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`,A=id(1),B=id(2),HASH='a'.repeat(64),TRIAL='p33c-v1';
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
test.beforeEach(async()=>{
 await db.exec('begin');outfits={};
 for(const [account,email,base] of [[A,'c1-a@example.com',100],[B,'c1-b@example.com',200]]){
  await db.query('insert into auth.users values($1,$2,now())',[account,email]);await db.query('insert into wardrobe_private.invites(email) values($1)',[email]);await user(account,'bootstrap');
  await user(account,'saveState',{expectedRevision:0,data:{locale:'pl',profiles:[{id:'daily',name:'Daily',audience:'women',occasion:'casual',budget:500,priority:'comfort',defaultMode:'best'}],activeProfileId:'daily',feedback:[],askReason:true}});
  outfits[account]=await fixture(account,base);
 }
 await db.query("update wardrobe_private.b_trial set closed=true where id='p33b-v1'");
});
test.afterEach(()=>db.exec('rollback'));test.after(()=>db.close());
const gates={fundingVerified:true,autoReloadOff:true,keyExpiryVerified:true,qaPassed:true,devicesVerified:true};
const activate=()=>sql('c_activate',[[A,B],new Date(Date.now()+29*86400000).toISOString(),gates],'wardrobe_private');
async function seal(account=A){const i=await prepare(account);return admin('wardrobe_c_seal_intent',[account,i.id,i.inputs.map(p=>({photoId:p.photoId,version:'p33c-jpeg-v1',sha256:HASH,bytes:100,width:1024,height:1536})),HASH]);}
const admit=(account,i,jid=id(900),epoch=i.consentRevision)=>admin('wardrobe_c_reserve_v2',[account,jid,i.id,epoch,i.manifestHash,'p33c-ai-v1.2']);
const mark=(jid=id(900))=>admin('wardrobe_c_mark_sent',[jid]);
const output=(jid=id(900),fid=id(901))=>admin('wardrobe_c_manifest',[jid,fid,1000,100,HASH,HASH,'image/jpeg',600,900]);
async function publish(jid=id(900),fid=id(901),u=usage){const f=await output(jid,fid);await storage(f);return admin('wardrobe_c_complete',[jid,u,true,{providerMs:12000,totalMs:13000,providerResponseId:'img_fixture'}]);}

test('C2 defaults OFF and owner-only activation requires verified gates, finite TTL and exactly two active accounts',async()=>{
 const i=await seal();assert.equal((await user(A,'bootstrap')).visualization.mode,'off');
 await assert.rejects(admit(A,i),/AI_DISABLED/);
 await db.exec('set role service_role');await assert.rejects(activate(),/permission denied/);await db.exec('reset role');
 await assert.rejects(sql('c_activate',[[A,B],new Date(Date.now()+31*86400000).toISOString(),gates],'wardrobe_private'),/INVALID_MANIFEST/);
 await assert.rejects(sql('c_activate',[[A,B],new Date(Date.now()+86400000).toISOString(),{...gates,autoReloadOff:false}],'wardrobe_private'),/AI_UNAVAILABLE/);
 await assert.rejects(sql('c_activate',[[A,A],new Date(Date.now()+86400000).toISOString(),gates],'wardrobe_private'),/INVALID_MANIFEST/);
 const activated=await activate();assert.equal(Date.parse(activated.endsAt)-Date.parse(activated.startsAt),30*86400000);
 assert.equal((await user(A,'bootstrap')).visualization.mode,'private_pilot');await assert.rejects(activate(),/CONFLICT/);
 await db.query('insert into auth.users values($1,$2,now())',[id(3),'c2-unenrolled@example.com']);
 await db.query('insert into wardrobe_private.invites(email) values($1)',['c2-unenrolled@example.com']);
 assert.equal((await user(id(3),'bootstrap')).visualization.mode,'off');
 await assert.rejects(user(A,'requestVisualization',{accepted:true,intentId:i.id}),/AI_DISABLED/);
});

test('seal requires current owned inputs, exact dimensions/hash and is immutable; client cannot seal or reserve',async()=>{
 const i=await seal();assert.equal(i.consentVersion,'p33c-ai-v1.2');assert.equal(i.inputs[0].canonical.width,1024);
 await assert.rejects(user(B,'getVisualizationIntent',{intentId:i.id}),/NOT_FOUND/);
 await db.exec('set role authenticated');await assert.rejects(sql('wardrobe_c_seal_intent',[A,i.id,[],HASH]),/permission denied/);
 await assert.rejects(sql('wardrobe_c_reserve_v2',[A,id(900),i.id,0,HASH,'p33c-ai-v1.2']),/permission denied/);await db.exec('reset role');
 const entries=i.inputs.map(p=>({photoId:p.photoId,...p.canonical}));
 await assert.rejects(admin('wardrobe_c_seal_intent',[A,i.id,[{...entries[0],width:1600},...entries.slice(1)],HASH]),/INVALID_MANIFEST/);
 await assert.rejects(admin('wardrobe_c_seal_intent',[A,i.id,entries,'b'.repeat(64)]),/CONFLICT/);
 await db.query('update public.wardrobe_items set revision=revision+1 where id=$1',[id(100)]);
 await assert.rejects(user(A,'getVisualizationIntent',{intentId:i.id}),/CONFLICT/);
});

test('new policy is accepted only by successful CAS admission and one UUID wakes once, never another outfit replay',async()=>{
 const i=await seal();await activate();
 await assert.rejects(admin('wardrobe_c_reserve_v2',[A,id(900),i.id,0,HASH,'p33c-ai-v1.1']),/AI_CONSENT_REQUIRED/);
 await assert.rejects(admin('wardrobe_c_reserve_v2',[A,id(900),i.id,0,'b'.repeat(64),'p33c-ai-v1.2']),/MANIFEST_MISMATCH/);
 await assert.rejects(admit(A,i,id(900),99),/CONFLICT/);
 assert.equal((await user(A,'bootstrap')).visualization.consent.accepted,false);
 const j=await admit(A,i);assert.equal(j.dispatch,true);assert.equal((await admit(A,i)).dispatch,false);
 await assert.rejects(admit(A,i,id(999)),/CASE_USED/);
 const c=(await user(A,'bootstrap')).visualization.consent;assert.equal(c.version,'p33c-ai-v1.2');assert.equal(c.revision,1);assert.equal(c.accepted,true);
 const events=(await db.query('select revision,version,accepted from wardrobe_private.c_consent_events where account_id=$1 order by revision',[A])).rows;
 assert.deepEqual(events.map(x=>[x.revision,x.version,x.accepted]),[[0,'p33c-ai-v1.1',false],[1,'p33c-ai-v1.2',true]]);
});

test('global lock admits one account, preserves shared B month cost and releases only unsent hold',async()=>{
 await db.query("insert into wardrobe_private.ai_budgets(scope,limit_cents,spent_cents) values('month:'||to_char(now() at time zone 'UTC','YYYY-MM'),2500,149)");
 const i=await seal(),b=await seal(B);await activate();assert.equal((await admit(A,i)).job.reservedPln,23.51);
 await assert.rejects(admit(B,b,id(902)),/AI_BUSY/);
 const month=(await user(A,'bootstrap')).visualization.monthlyBudget;assert.equal(month.spentPln,1.49);assert.equal(month.reservedPln,23.51);assert.equal(month.availablePln,0);
 await admin('wardrobe_c_abort_unsent',[id(900)]);assert.equal((await user(A,'bootstrap')).visualization.monthlyBudget.reservedPln,0);
 assert.equal((await admit(A,i)).dispatch,false);await assert.rejects(admit(A,i,id(999)),/CASE_USED/);
 assert.equal((await admit(B,b,id(902))).dispatch,true);
});

test('worker plan contains opaque safety pseudonym and canonical proof; mark_sent is one-time and rejects changed input',async()=>{
 const i=await seal();await activate();await admit(A,i);
 const plan=await admin('wardrobe_c_worker_plan',[A,id(900)]);assert.match(plan.safetyIdentifier,/^[a-f0-9]{64}$/);assert.ok(!plan.safetyIdentifier.includes(A.replaceAll('-','')));
 assert.equal(plan.manifestHash,HASH);assert.equal(plan.inputs[0].canonical.sha256,HASH);assert.equal(plan.params.n,1);assert.ok(!plan.prompt.includes('Synthetic'));
 await assert.rejects(admin('wardrobe_c_worker_plan',[B,id(900)]),/NOT_FOUND/);
 assert.equal(await mark(),true);assert.equal(await mark(),false);
 await publish();const b=await seal(B);await admit(B,b,id(902));
 await db.query('update public.wardrobe_body_fit set revision=revision+1 where account_id=$1',[B]);assert.equal(await mark(id(902)),false);
 assert.equal((await db.query('select status from wardrobe_private.c_attempts where id=$1',[id(902)])).rows[0].status,'cancelled');
});

test('key/trial expiry and global stop prevent all new sends; legitimate sent response can settle and publish after close',async()=>{
 const i=await seal();await activate();await admit(A,i);assert.equal(await mark(),true);
 await sql('c_close',['MANUAL_STOP'],'wardrobe_private');assert.equal((await user(A,'bootstrap')).visualization.mode,'off');
 assert.equal((await publish()).status,'succeeded');assert.ok((await user(A,'getVisualization',{jobId:id(900)})).result);
 assert.equal((await db.query('select enabled from wardrobe_private.c_runtime')).rows[0].enabled,false);
});

test('expiry before dispatch closes on maintenance, returns reserved hold and does not erase case receipt',async()=>{
 const i=await seal();await activate();await admit(A,i);
 await db.query("update wardrobe_private.c_runtime set key_deadline=now()-interval '1 second' where singleton");
 await assert.rejects(mark(),/AI_DISABLED/);await admin('wardrobe_expire_uploads');
 assert.equal((await db.query('select stop_reason from wardrobe_private.c_runtime')).rows[0].stop_reason,'KEY_EXPIRED');
 assert.equal((await db.query('select reserved_cents from wardrobe_private.c_attempts')).rows[0].reserved_cents,0);
 assert.equal((await db.query('select job_id from wardrobe_private.c_intents where id=$1',[i.id])).rows[0].job_id,id(900));
});

test('revocation during flight blocks publication and records cost',async()=>{
 const i=await seal();await activate();await admit(A,i);await mark();const f=await output();
 const revoked=await user(A,'setAiConsent',{accepted:false,consentVersion:'p33c-ai-v1.2',expectedConsentRevision:1});assert.equal(revoked.revision,2);
 await storage(f);const done=await admin('wardrobe_c_complete',[id(900),usage,true,{failureStage:'publication'}]);assert.equal(done.status,'failed');
 assert.equal((await db.query('select status from public.wardrobe_visualization_files')).rows[0].status,'deleting');
 assert.equal((await db.query('select enabled from wardrobe_private.c_runtime')).rows[0].enabled,false);
 assert.equal((await db.query('select spent_cents from wardrobe_private.c_attempts')).rows[0].spent_cents,25);

});

test('unknown cost closes trial and keeps hold after personal account deletion; late known receipt settles exactly once',async()=>{
 const i=await seal();await activate();await admit(A,i);await mark();
 await admin('wardrobe_c_complete',[id(900),null,false,{stopReason:'provider_unknown'}]);await db.query('delete from auth.users where id=$1',[A]);
 assert.equal((await db.query('select reserved_cents from wardrobe_private.c_attempts')).rows[0].reserved_cents,2500);
 const m=(await db.query('select account_id,safety_identifier from wardrobe_private.c_members where slot=1')).rows[0];assert.equal(m.account_id,null);assert.equal(m.safety_identifier,null);
 const late=await admin('wardrobe_c_complete',[id(900),usage,false,{}]);assert.equal(late.spentPln,0.25);
 await admin('wardrobe_c_complete',[id(900),usage,false,{}]);assert.equal((await db.query("select spent_cents from wardrobe_private.ai_budgets where scope='trial:p33c-v1'")).rows[0].spent_cents,25);
});

test('measurements whitelist never accepts prompts or raw bytes and rollback preserves pending settlement',async()=>{
 const i=await seal();await activate();await admit(A,i);await mark();
 await assert.rejects(admin('wardrobe_c_complete',[id(900),usage,false,{prompt:'private'}]),/INVALID_USAGE/);
 assert.equal((await db.query('select status from wardrobe_private.c_attempts')).rows[0].status,'sent');
 await admin('wardrobe_c_complete',[id(900),usage,false,{failureStage:'storage',providerMs:12}]);
 assert.deepEqual((await db.query('select measurements from wardrobe_private.c_attempts')).rows[0].measurements,{failureStage:'storage',providerMs:12});
});

test('over-reservation usage is fully charged, closes C and never clips either ledger',async()=>{
 const i=await seal();await activate();await admit(A,i);await mark();
 const huge={textInputTokens:1_000_000,imageInputTokens:1_000_000,imageOutputTokens:1_000_000};
 const done=await publish(id(900),id(901),huge);assert.equal(done.status,'succeeded');assert.equal(done.spentPln,290.9);
 assert.equal((await db.query('select stop_reason from wardrobe_private.c_runtime')).rows[0].stop_reason,'COST_EXCEEDED');
 assert.deepEqual((await db.query('select spent_cents,reserved_cents from wardrobe_private.ai_budgets order by scope')).rows.map(x=>[x.spent_cents,x.reserved_cents]),[[29090,0],[29090,0]]);
 assert.equal((await user(A,'bootstrap')).visualization.monthlyBudget.availablePln,0);
});

test('trial end, global block and withdrawn invitation each stop dispatch without touching a paid provider',async()=>{
 const i=await seal();await activate();await admit(A,i);
 await db.query('update wardrobe_private.ai_control set blocked=true where singleton');await assert.rejects(mark(),/AI_DISABLED/);
 await db.query('update wardrobe_private.ai_control set blocked=false where singleton');
 await db.query('delete from wardrobe_private.invites where email=$1',['c1-a@example.com']);await assert.rejects(mark(),/ACCOUNT_UNAVAILABLE/);
 await db.query('insert into wardrobe_private.invites(email) values($1)',['c1-a@example.com']);
 await db.query("update wardrobe_private.c_trials set starts_at=now()-interval '31 days',ends_at=now()-interval '1 day' where id='p33c-v1'");await assert.rejects(mark(),/AI_DISABLED/);
 await admin('wardrobe_expire_uploads');assert.equal((await db.query('select stop_reason from wardrobe_private.c_runtime')).rows[0].stop_reason,'TRIAL_EXPIRED');
 assert.equal((await db.query('select count(*) n from wardrobe_private.c_attempts where sent_at is not null')).rows[0].n,0);
});

for(const [scope,count] of [['daily',5],['account',30],['trial',60]])test(`C2 public admission retains ${scope} paid-send ceiling without resetting policy or B`,async()=>{
 const i=await seal();await activate();
 // Past usage receipt has no personal job; it still counts as a paid attempt.
 await db.query(`insert into wardrobe_private.c_attempts(id,trial_id,member_id,status,month_scope,reserved_cents,spent_cents,sent_at,completed_at,consent_revision)
  select gen_random_uuid(),'p33c-v1',m.id,'failed','month:1900-01',0,0,
   case when $1='daily' then now() else now()-interval '2 days' end,now(),0
  from wardrobe_private.c_members m cross join generate_series(1,$2::integer) where m.trial_id='p33c-v1' and m.slot=1`,[scope,count]);
 await assert.rejects(admit(A,i),/AI_ATTEMPT_LIMIT/);
 assert.equal((await user(A,'bootstrap')).visualization.consent.revision,0);
});

const nonExpiringGates={fundingVerified:true,autoReloadOff:true,nonExpiringKeyApproved:true,qaPassed:true,devicesVerified:true};
const activateNonExpiring=(g=nonExpiringGates)=>sql('c_activate_nonexpiring',[[A,B],g],'wardrobe_private');

test('non-expiring activation has an explicit gate and never asserts provider expiry; cutoff is exactly 30 days',async()=>{
 const before=(await db.query('select * from wardrobe_private.c_runtime')).rows[0];assert.equal(before.enabled,false);assert.equal(before.provider_key_expires_at,null);
 for(const bad of [{...nonExpiringGates,nonExpiringKeyApproved:false},{...nonExpiringGates,nonExpiringKeyApproved:'true'},
  {fundingVerified:true,autoReloadOff:true,qaPassed:true,devicesVerified:true}])await assert.rejects(activateNonExpiring(bad),/AI_UNAVAILABLE/);
 await assert.rejects(activateNonExpiring({...nonExpiringGates,keyExpiryVerified:true}),/INVALID_MANIFEST/);
 await assert.rejects(activateNonExpiring(gates),/INVALID_MANIFEST/);
 await assert.rejects(sql('c_activate_with_key_mode',[[A,B],'NON_EXPIRING',new Date(Date.now()+31*86400000).toISOString(),nonExpiringGates],'wardrobe_private'),/INVALID_MANIFEST/);
 assert.deepEqual((await db.query('select * from wardrobe_private.c_runtime')).rows[0],before);
 const result=await activateNonExpiring(),runtime=(await db.query('select * from wardrobe_private.c_runtime')).rows[0];
 assert.equal(result.keyExpiryMode,'NON_EXPIRING');assert.equal(result.providerKeyExpiresAt,null);
 assert.equal(result.keyDeadline,result.serverUseEndsAt);assert.equal(result.keyDeadline,result.endsAt);
 assert.equal(Date.parse(result.serverUseEndsAt)-Date.parse(result.startsAt),30*86400000);
 assert.equal(runtime.provider_key_expires_at,null);assert.equal(runtime.gates.keyExpiryVerified,undefined);assert.deepEqual(runtime.gates,nonExpiringGates);
});

test('new mode preserves all existing funding/device gates and owner-only execution',async()=>{
 for(const key of ['fundingVerified','autoReloadOff','qaPassed','devicesVerified'])await assert.rejects(activateNonExpiring({...nonExpiringGates,[key]:false}),/AI_UNAVAILABLE/);
 for(const role of ['anon','authenticated','service_role']){
  await db.exec(`set role ${role}`);
  try{
   await assert.rejects(activateNonExpiring(),/permission denied/);
   await assert.rejects(sql('c_activate_with_key_mode',[[A,B],'NON_EXPIRING',null,nonExpiringGates],'wardrobe_private'),/permission denied/);
   await assert.rejects(db.query('select * from wardrobe_private.c_runtime'),/permission denied/);
  }finally{await db.exec('reset role');}
 }
 assert.equal((await db.query('select enabled from wardrobe_private.c_runtime')).rows[0].enabled,false);
});

test('activation cannot reset a prior hold or B/month spend; approved non-expiring first reserve uses remaining month',async()=>{
 await db.query("insert into wardrobe_private.ai_budgets(scope,limit_cents,spent_cents,reserved_cents) values('month:'||to_char(now() at time zone 'UTC','YYYY-MM'),2500,149,1),('trial:p33b-v1',1000,149,0)");
 const before=(await db.query('select * from wardrobe_private.ai_budgets order by scope')).rows;
 await assert.rejects(activateNonExpiring(),/AI_BUSY/);assert.deepEqual((await db.query('select * from wardrobe_private.ai_budgets order by scope')).rows,before);
 await db.query("update wardrobe_private.ai_budgets set reserved_cents=0 where scope like 'month:%'");
 const i=await seal();await activateNonExpiring();assert.equal((await admit(A,i)).job.reservedPln,23.51);
 assert.equal((await db.query("select spent_cents from wardrobe_private.ai_budgets where scope='trial:p33b-v1'")).rows[0].spent_cents,149);
});

test('non-expiring provider key cannot extend server use beyond 30 days and cleanup records TRIAL_EXPIRED',async()=>{
 const i=await seal();await activateNonExpiring();await admit(A,i);
 await db.query("update wardrobe_private.c_runtime set activated_at=now()-interval '31 days',key_deadline=now()-interval '1 day' where singleton");
 // Even an accidentally extended trial row cannot override the independent cutoff.
 assert.equal((await user(A,'bootstrap')).visualization.mode,'off');await assert.rejects(mark(),/AI_DISABLED/);
 await db.query("update wardrobe_private.c_trials set starts_at=now()-interval '31 days',ends_at=now()-interval '1 day' where id='p33c-v1'");
 await admin('wardrobe_expire_uploads');const runtime=(await db.query('select * from wardrobe_private.c_runtime')).rows[0];
 assert.equal(runtime.enabled,false);assert.equal(runtime.stop_reason,'TRIAL_EXPIRED');assert.equal(runtime.provider_key_expires_at,null);
 assert.equal((await db.query('select reserved_cents from wardrobe_private.c_attempts')).rows[0].reserved_cents,0);
 await assert.rejects(activateNonExpiring(),/CONFLICT/);await assert.rejects(activate(),/CONFLICT/);
});

test('closed pilot cannot reopen using another key mode, and sent cost holds survive the server cutoff',async()=>{
 const i=await seal();await activateNonExpiring();await admit(A,i);await mark();
 await db.query("update wardrobe_private.c_runtime set key_deadline=now()-interval '1 second' where singleton");
 await admin('wardrobe_expire_uploads');assert.equal((await db.query('select stop_reason from wardrobe_private.c_runtime')).rows[0].stop_reason,'TRIAL_EXPIRED');
 assert.equal((await db.query('select reserved_cents from wardrobe_private.c_attempts')).rows[0].reserved_cents,2500);
 await assert.rejects(activateNonExpiring(),/CONFLICT/);await assert.rejects(activate(),/CONFLICT/);
 const done=await admin('wardrobe_c_complete',[id(900),usage,false,{}]);assert.equal(done.spentPln,0.25);
 assert.equal((await db.query('select reserved_cents from wardrobe_private.c_attempts')).rows[0].reserved_cents,0);
});

test('legacy expiring activation remains truthful, bounded and uses KEY_EXPIRED at its actual deadline',async()=>{
 const result=await activate();assert.equal(result.keyExpiryMode,'EXPIRING');assert.equal(result.providerKeyExpiresAt,result.keyDeadline);
 const runtime=(await db.query('select * from wardrobe_private.c_runtime')).rows[0];assert.equal(runtime.gates.keyExpiryVerified,true);
 assert.equal((await db.query('select provider_key_expires_at=key_deadline as same from wardrobe_private.c_runtime')).rows[0].same,true);
 await db.query("update wardrobe_private.c_runtime set key_deadline=now()-interval '1 second',provider_key_expires_at=now()-interval '1 second' where singleton");
 await admin('wardrobe_expire_uploads');assert.equal((await db.query('select stop_reason from wardrobe_private.c_runtime')).rows[0].stop_reason,'KEY_EXPIRED');
});
