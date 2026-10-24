import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import test from 'node:test';

// Real Postgres engine in WASM; only Supabase-owned auth/storage schemas are
// represented by fixtures. This proves SQL/RLS behavior, not HTTP Storage/OAuth.
const { PGlite } = await import(process.env.PGLITE_MODULE ? pathToFileURL(process.env.PGLITE_MODULE).href : '@electric-sql/pglite');
const db = new PGlite();
const A = '00000000-0000-4000-8000-000000000001';
const B = '00000000-0000-4000-8000-000000000002';
const C = '00000000-0000-4000-8000-000000000003';
const itemA = '10000000-0000-4000-8000-000000000001';
const photoA = '20000000-0000-4000-8000-000000000001';
const receipt = '30000000-0000-4000-8000-000000000001';

await db.exec(`
  create role anon; create role authenticated; create role service_role bypassrls; create role supabase_auth_admin;
  create schema auth; create schema storage;
  revoke usage on schema public from public;
  grant usage on schema auth,public,storage to anon,authenticated,service_role;
  create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
  create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,metadata jsonb default '{}');
  alter table storage.objects enable row level security;
  grant select,insert,update,delete on storage.objects to authenticated;
`);
assert.equal((await db.query("select has_schema_privilege('supabase_auth_admin','public','usage') permitted")).rows[0].permitted,false,
  'Auth role starts without public schema USAGE, like a hosted project before hook setup');
const migrationDirectory = new URL('../migrations/', import.meta.url);
for (const filename of (await readdir(migrationDirectory)).filter(name=>name.endsWith('.sql')).sort()) {
  await db.exec(await readFile(new URL(filename,migrationDirectory),'utf8'));
}
await db.query('insert into auth.users values ($1,$2,now()),($3,$4,now()),($5,$6,now())', [A,'a@example.invalid',B,'b@example.invalid',C,'c@example.invalid']);
await db.exec("insert into wardrobe_private.invites(email) values('a@example.invalid'),('b@example.invalid')");

async function user(id, fn) {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec('set role authenticated');
  try { return await fn(); } finally { await db.exec('reset role'); }
}
async function rpc(action,payload={}) {
  return (await db.query('select public.wardrobe_execute($1,$2) result',[action,JSON.stringify(payload)])).rows[0].result;
}
async function adminRpc(name,args,values) {
  await db.exec('set role service_role');
  try { return (await db.query(`select public.${name}(${args}) result`,values)).rows[0].result; }
  finally { await db.exec('reset role'); }
}
const fields={name:'Synthetic shirt',category:'top',color:'blue',occasions:['casual'],size:'M',photoKind:'garment'};

test('Auth hook is callable by its hosted Auth role and unavailable to application users',async()=>{
  await db.exec('set role supabase_auth_admin');
  try {
    const allowed=await db.query("select public.wardrobe_before_user_created('{\"user\":{\"email\":\"a@example.invalid\"}}') result");
    assert.deepEqual(allowed.rows[0].result,{});
    const denied=await db.query("select public.wardrobe_before_user_created('{\"user\":{\"email\":\"c@example.invalid\"}}') result");
    assert.equal(denied.rows[0].result.error.http_code,403);
  }finally{await db.exec('reset role');}
  await assert.rejects(user(A,()=>db.query("select public.wardrobe_before_user_created('{}')")),/permission denied/);
});

test('invitation gate, owner RLS, direct write denial, and CAS/import', async () => {
  const denied=await db.query("select public.wardrobe_before_user_created('{\"user\":{\"email\":\"c@example.invalid\"}}') result");
  assert.equal(denied.rows[0].result.error.http_code,403);
  await assert.rejects(user(C,()=>rpc('bootstrap')),/NOT_INVITED/);
  const initial=await user(A,()=>rpc('bootstrap'));
  assert.equal(initial.state.revision,0);
  await user(B,()=>rpc('bootstrap'));
  await user(A,()=>rpc('createItem',{itemId:itemA,...fields}));
  const own=await user(A,()=>db.query('select id from public.wardrobe_items'));
  assert.deepEqual(own.rows,[{id:itemA}]);
  assert.equal((await user(B,()=>db.query('select id from public.wardrobe_items'))).rows.length,0);
  await assert.rejects(user(B,()=>rpc('updateItem',{itemId:itemA,expectedRevision:1,...fields})),/NOT_FOUND/);
  await assert.rejects(user(A,()=>db.query("update public.wardrobe_items set name='tamper'")),/permission denied/);
  await assert.rejects(user(A,()=>rpc('updateItem',{itemId:itemA,...fields})),/CONFLICT/);
  await user(A,()=>rpc('updateItem',{itemId:itemA,expectedRevision:1,...fields,name:'Edited'}));
  await assert.rejects(user(A,()=>rpc('updateItem',{itemId:itemA,expectedRevision:1,...fields})),/CONFLICT/);
  const state={locale:'en',profiles:[{id:'p2:everyday',name:'Daily',audience:'women',occasion:'casual',budget:500,priority:'comfort',defaultMode:'best'}],activeProfileId:'p2:everyday',feedback:[{profileId:'p2:everyday',outfitId:'w1',vote:'like'}],askReason:true};
  const saved=await user(A,()=>rpc('saveState',{expectedRevision:0,data:state,importId:receipt}));
  assert.equal(saved.revision,1);
  const repeated=await user(A,()=>rpc('saveState',{expectedRevision:0,data:state,importId:receipt}));
  assert.deepEqual(repeated,saved);
  await assert.rejects(user(A,()=>rpc('saveState',{expectedRevision:0,data:state})),/CONFLICT/);
  await assert.rejects(user(A,()=>rpc('saveState',{expectedRevision:1,data:{...state,ownedItemIds:['demo']}})),/INVALID_STATE/);
  const malformed=structuredClone(state);delete malformed.profiles[0].budget;
  await assert.rejects(user(A,()=>rpc('saveState',{expectedRevision:1,data:malformed})),/INVALID_STATE/);
});

test('server item quota cannot be bypassed by RPC or direct writes',async()=>{
  await user(B,async()=>{
    for(let n=1;n<=100;n++)await rpc('createItem',{itemId:`40000000-0000-4000-8000-${String(n).padStart(12,'0')}`,...fields});
    await assert.rejects(rpc('createItem',{itemId:'40000000-0000-4000-8000-000000000101',...fields}),/ITEM_LIMIT/);
  });
});

test('photo reservations, ownership, active read gate, and durable delete',async()=>{
  await assert.rejects(user(A,()=>db.query('select public.wardrobe_reserve_photo($1,$2,$3,2,5,5,$4)',[A,itemA,photoA,'a'.repeat(64)])),/permission denied/);
  await assert.rejects(adminRpc('wardrobe_reserve_photo','$1,$2,$3,2,1000001,5,$4',[A,itemA,photoA,'a'.repeat(64)]),/check constraint/);
  const photo=await adminRpc('wardrobe_reserve_photo','$1,$2,$3,2,100,50,$4',[A,itemA,photoA,'a'.repeat(64)]);
  await assert.rejects(adminRpc('wardrobe_reserve_photo','$1,$2,$3,2,100,50,$4',[B,itemA,photoA,'a'.repeat(64)]),/NOT_FOUND/);
  await assert.rejects(adminRpc('wardrobe_commit_photo','$1,$2',[A,photoA]),/UPLOAD_INCOMPLETE/);
  await db.query('insert into storage.objects(bucket_id,name) values ($1,$2),($1,$3)',['wardrobe-private',photo.main_path,photo.thumb_path]);
  assert.equal((await user(A,()=>db.query('select name from storage.objects'))).rows.length,0,'staged paths unreadable');
  const item=await adminRpc('wardrobe_commit_photo','$1,$2',[A,photoA]);
  assert.equal(item.revision,3);
  assert.equal((await user(A,()=>db.query('select name from storage.objects'))).rows.length,0,'even owner cannot warm authenticated Storage CDN');
  assert.equal((await user(A,()=>db.query('select id from public.wardrobe_photos'))).rows.length,1,'fresh metadata gate permits owner Edge download');
  assert.equal((await user(B,()=>db.query('select name from storage.objects'))).rows.length,0);
  await assert.rejects(user(A,()=>db.query("insert into storage.objects(bucket_id,name) values('wardrobe-private','forged')")),/row-level security/);
  await user(A,()=>rpc('deleteItem',{itemId:itemA,expectedRevision:3}));
  assert.equal((await user(A,()=>db.query('select name from storage.objects'))).rows.length,0,'pending deletion blocks reads immediately');
  assert.equal((await user(A,()=>db.query('select id from public.wardrobe_photos'))).rows.length,0,'pending deletion blocks the Edge metadata gate immediately');
  await assert.rejects(adminRpc('wardrobe_finish_photo_delete','$1',[photoA]),/CONFLICT/,'write lease prevents cleanup racing in-flight upload');
  await db.query("update public.wardrobe_photos set cleanup_after=now()-interval '1 minute' where id=$1",[photoA]);
  await assert.rejects(adminRpc('wardrobe_finish_photo_delete','$1',[photoA]),/DELETE_INCOMPLETE/);
  // Storage API is not running in this harness; simulate its completed metadata
  // removal only here, then verify SQL refuses/accepts the correct lifecycle.
  await db.exec('delete from storage.objects');
  await adminRpc('wardrobe_finish_photo_delete','$1',[photoA]);
  await adminRpc('wardrobe_finish_item_deletes','',[]);
  assert.equal((await db.query('select id from public.wardrobe_items where id=$1',[itemA])).rows.length,0);
});

test('staged upload retry follows acknowledged edits but rejects stale or intervening revisions',async()=>{
  const retryItem='10000000-0000-4000-8000-000000000003';
  const retryPhoto='20000000-0000-4000-8000-000000000003';
  await user(A,()=>rpc('createItem',{itemId:retryItem,...fields}));
  await adminRpc('wardrobe_reserve_photo','$1,$2,$3,1,100,50,$4',[A,retryItem,retryPhoto,'d'.repeat(64)]);
  await user(A,()=>rpc('updateItem',{itemId:retryItem,expectedRevision:1,...fields,name:'Edited after interrupted upload'}));
  await db.query("update public.wardrobe_photos set cleanup_after=now()-interval '1 minute' where id=$1",[retryPhoto]);
  const oldLease=(await db.query('select cleanup_after::text lease from public.wardrobe_photos where id=$1',[retryPhoto])).rows[0].lease;
  await assert.rejects(adminRpc('wardrobe_reserve_photo','$1,$2,$3,1,100,50,$4',[A,retryItem,retryPhoto,'d'.repeat(64)]),/CONFLICT/);
  assert.equal((await db.query('select cleanup_after::text lease from public.wardrobe_photos where id=$1',[retryPhoto])).rows[0].lease,oldLease,'stale retries do not extend the lease');
  const resumed=await adminRpc('wardrobe_reserve_photo','$1,$2,$3,2,100,50,$4',[A,retryItem,retryPhoto,'d'.repeat(64)]);
  assert.equal(resumed.expected_revision,2);
  await db.query('insert into storage.objects(bucket_id,name) values ($1,$2),($1,$3)',['wardrobe-private',resumed.main_path,resumed.thumb_path]);
  await user(A,()=>rpc('updateItem',{itemId:retryItem,expectedRevision:2,...fields,name:'Concurrent device edit'}));
  await assert.rejects(adminRpc('wardrobe_commit_photo','$1,$2',[A,retryPhoto]),/CONFLICT/,'intervening edit still prevents stale commit');
  await adminRpc('wardrobe_reserve_photo','$1,$2,$3,3,100,50,$4',[A,retryItem,retryPhoto,'d'.repeat(64)]);
  const committed=await adminRpc('wardrobe_commit_photo','$1,$2',[A,retryPhoto]);
  assert.equal(committed.revision,4);
  assert.equal(committed.name,'Concurrent device edit');
  await user(A,()=>rpc('deleteItem',{itemId:retryItem,expectedRevision:4}));
  await db.query("update public.wardrobe_photos set cleanup_after=now()-interval '1 minute' where id=$1",[retryPhoto]);
  await db.query('delete from storage.objects where name in ($1,$2)',[resumed.main_path,resumed.thumb_path]);
  await adminRpc('wardrobe_finish_photo_delete','$1',[retryPhoto]);
  await adminRpc('wardrobe_finish_item_deletes','',[]);
});

test('new photo selection supersedes a staged upload with CAS and preserves its cleanup lease and quota',async()=>{
  const selectedItem='10000000-0000-4000-8000-000000000004';
  const oldPhoto='20000000-0000-4000-8000-000000000004';
  const newPhoto='20000000-0000-4000-8000-000000000005';
  const stalePhoto='20000000-0000-4000-8000-000000000006';
  await user(A,()=>rpc('createItem',{itemId:selectedItem,...fields}));
  const original=await adminRpc('wardrobe_reserve_photo','$1,$2,$3,1,100,50,$4',[A,selectedItem,oldPhoto,'e'.repeat(64)]);
  await db.query('insert into storage.objects(bucket_id,name) values ($1,$2)',['wardrobe-private',original.main_path]);
  const oldLease=(await db.query('select cleanup_after::text lease from public.wardrobe_photos where id=$1',[oldPhoto])).rows[0].lease;
  await assert.rejects(adminRpc('wardrobe_reserve_photo','$1,$2,$3,0,200,50,$4',[A,selectedItem,newPhoto,'f'.repeat(64)]),/CONFLICT/);
  assert.equal((await db.query('select status from public.wardrobe_photos where id=$1',[oldPhoto])).rows[0].status,'staged','stale new selection does not cancel a current upload');
  const replacement=await adminRpc('wardrobe_reserve_photo','$1,$2,$3,1,200,50,$4',[A,selectedItem,newPhoto,'f'.repeat(64)]);
  const previous=(await db.query('select status,cleanup_after::text lease from public.wardrobe_photos where id=$1',[oldPhoto])).rows[0];
  assert.equal(previous.status,'deleting');
  assert.equal(previous.lease,oldLease,'superseding does not shorten the in-flight write lease');
  assert.equal(replacement.status,'staged');
  assert.equal((await db.query('select sum(bytes+thumb_bytes)::int total from public.wardrobe_photos where item_id=$1',[selectedItem])).rows[0].total,400,'quota still reserves both old and new variants');
  // The old request completes its transfer after supersession; it must never
  // become active or make its paths readable, regardless of transfer ordering.
  await db.query('insert into storage.objects(bucket_id,name) values ($1,$2),($1,$3),($1,$4)',['wardrobe-private',original.thumb_path,replacement.main_path,replacement.thumb_path]);
  await assert.rejects(adminRpc('wardrobe_commit_photo','$1,$2',[A,oldPhoto]),/NOT_FOUND/);
  await assert.rejects(adminRpc('wardrobe_reserve_photo','$1,$2,$3,1,100,50,$4',[A,selectedItem,oldPhoto,'e'.repeat(64)]),/CONFLICT/);
  await assert.rejects(adminRpc('wardrobe_finish_photo_delete','$1',[oldPhoto]),/CONFLICT/,'cleanup still respects the old write lease');
  const committed=await adminRpc('wardrobe_commit_photo','$1,$2',[A,newPhoto]);
  assert.equal(committed.photo.id,newPhoto);
  assert.equal(committed.revision,2);
  const visible=(await user(A,()=>db.query('select id from public.wardrobe_photos'))).rows.map(r=>r.id);
  assert.deepEqual(visible,[replacement.id],'only replacement authorizes an Edge read');
  assert.equal((await user(A,()=>db.query('select name from storage.objects'))).rows.length,0);
  // Opposite ordering: once a photo is committed, a selection based on the old
  // revision must conflict instead of superseding the newly active image.
  await assert.rejects(adminRpc('wardrobe_reserve_photo','$1,$2,$3,1,100,50,$4',[A,selectedItem,stalePhoto,'a'.repeat(64)]),/CONFLICT/);
  assert.equal((await db.query('select status from public.wardrobe_photos where id=$1',[newPhoto])).rows[0].status,'active');
  await user(A,()=>rpc('deleteItem',{itemId:selectedItem,expectedRevision:2}));
  await db.query("update public.wardrobe_photos set cleanup_after=now()-interval '1 minute' where item_id=$1",[selectedItem]);
  await db.query('delete from storage.objects where name in ($1,$2,$3,$4)',[original.main_path,original.thumb_path,replacement.main_path,replacement.thumb_path]);
  await adminRpc('wardrobe_finish_photo_delete','$1',[oldPhoto]);
  await adminRpc('wardrobe_finish_photo_delete','$1',[newPhoto]);
  await adminRpc('wardrobe_finish_item_deletes','',[]);
});

test('abandoned uploads expire and pending bytes count against account quota',async()=>{
  const orphanItem='10000000-0000-4000-8000-000000000002';
  const orphanPhoto='20000000-0000-4000-8000-000000000002';
  await user(A,()=>rpc('createItem',{itemId:orphanItem,...fields}));
  await adminRpc('wardrobe_reserve_photo','$1,$2,$3,1,100,50,$4',[A,orphanItem,orphanPhoto,'b'.repeat(64)]);
  await db.query("update public.wardrobe_photos set created_at=now()-interval '2 hours' where id=$1",[orphanPhoto]);
  await adminRpc('wardrobe_reserve_photo','$1,$2,$3,1,100,50,$4',[A,orphanItem,orphanPhoto,'b'.repeat(64)]);
  await adminRpc('wardrobe_expire_uploads','',[]);
  assert.equal((await db.query('select status from public.wardrobe_photos where id=$1',[orphanPhoto])).rows[0].status,'staged','retry renewed lease survives expiry worker');
  await db.query("update public.wardrobe_photos set cleanup_after=now()-interval '1 hour' where id=$1",[orphanPhoto]);
  await adminRpc('wardrobe_expire_uploads','',[]);
  assert.equal((await db.query('select status from public.wardrobe_photos where id=$1',[orphanPhoto])).rows[0].status,'deleting');
  await adminRpc('wardrobe_finish_photo_delete','$1',[orphanPhoto]);
  // Administrative fixture represents a pre-existing deletion backlog. User
  // requests cannot insert these rows or lie about byte counts.
  await db.query(`insert into public.wardrobe_photos(id,account_id,item_id,expected_revision,main_path,thumb_path,bytes,thumb_bytes,mime_type,fingerprint,status)
    select gen_random_uuid(),$1,$2,1,'quota/'||n||'/main.jpg','quota/'||n||'/thumb.jpg',1000000,100000,'image/jpeg',repeat('c',64),'deleting' from generate_series(1,227) n`,[A,orphanItem]);
  await assert.rejects(adminRpc('wardrobe_reserve_photo','$1,$2,$3,1,1000000,100000,$4',[A,orphanItem,orphanPhoto,'b'.repeat(64)]),/STORAGE_LIMIT/);
  await db.query('delete from public.wardrobe_photos where account_id=$1',[A]);
  await user(A,()=>rpc('deleteItem',{itemId:orphanItem,expectedRevision:1}));
  await adminRpc('wardrobe_finish_item_deletes','',[]);
});

test('revoked invitation and deleting account invalidate old user JWT access',async()=>{
  await db.exec("update wardrobe_private.invites set enabled=false where email='b@example.invalid'");
  assert.equal((await user(B,()=>db.query('select id from public.wardrobe_items'))).rows.length,0);
  await assert.rejects(user(B,()=>rpc('bootstrap')),/NOT_INVITED/);
  await db.exec("update wardrobe_private.invites set enabled=true where email='b@example.invalid'");
  await user(A,()=>rpc('deleteAccount'));
  await assert.rejects(user(A,()=>rpc('bootstrap')),/ACCOUNT_UNAVAILABLE/);
  assert.equal((await user(A,()=>db.query('select id from public.wardrobe_accounts'))).rows.length,0);
  assert.equal(await adminRpc('wardrobe_prepare_auth_delete','$1',[A]),true);
  assert.equal((await db.query('select count(*) n from wardrobe_private.import_receipts where account_id=$1',[A])).rows[0].n,0);
});

test.after(async()=>{await db.close();});
