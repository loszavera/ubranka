-- Operator-only persistent Storage/RLS fixture, NOT a generator or AI fallback.
-- JSON placeholder is base64 UTF-8 of {accountId,jobId,fileId,outfitId,
-- bytes,thumbBytes,sha256,thumbSha256}. IDs must be fresh operator-owned UUIDs.
-- Allowed identity p33b-...@example.com only; no changes to other accounts.
-- 1. Run setup. 2. Upload exact PNG bytes to returned private paths via Storage
-- API. 3. Activate fixture explicitly with the separate SQL below. 4. Test reads.
-- This commits a labeled test job and temporary test consent on this account;
-- it is deliberately NOT a rollback test. Record exact fresh job/file UUIDs for
-- teardown. Run before real B provision, with no OpenAI key/provider involved.
-- It validates storage/access plumbing, not provider response validation or
-- publication: compare downloaded byte hashes separately in the HTTP harness.
begin;
do $$
declare v jsonb:=convert_from(decode('__RESULT_BASE64__','base64'),'UTF8')::jsonb;
  a uuid:=(v->>'accountId')::uuid; jid uuid:=(v->>'jobId')::uuid; fid uuid:=(v->>'fileId')::uuid;
  b public.wardrobe_body_fit; s public.wardrobe_styling; o jsonb; photos uuid[];
begin
  perform wardrobe_private.assert_account(a);
  if not exists(select 1 from auth.users where id=a and email ~ '^p33b-[a-z0-9-]+@example[.]com$') then raise exception 'NOT_SYNTHETIC'; end if;
  if exists(select 1 from wardrobe_private.b_trial) then raise exception 'PROVISIONED_TRIAL_MUST_NOT_BE_TOUCHED'; end if;
  select * into b from public.wardrobe_body_fit where account_id=a;
  select * into s from public.wardrobe_styling where account_id=a;
  select value into o from jsonb_array_elements(s.data->'outfits') where value->>'id'=v->>'outfitId';
  if b.photo_id is null or o is null or b.ai_consent_version is not null then raise exception 'INVALID_FIXTURE'; end if;
  select array_agg(i.photo_id order by i.id) into photos from public.wardrobe_items i where i.account_id=a
    and o->'itemRevisions' ? i.id::text and i.status='active';
  photos:=array_prepend(b.photo_id,photos);
  update public.wardrobe_body_fit set ai_consent_version='p33b-storage-fixture-v1',ai_consent_at=now() where account_id=a;
  insert into public.wardrobe_visualizations(id,account_id,outfit_id,fingerprint,input_photo_ids,input_body_revision,input_styling_revision,input_item_revisions,
    status,trial_scope,month_scope,consent_version,reserved_cents,reserved_bytes)
    values(jid,a,(v->>'outfitId')::uuid,'p33b-storage-fixture-v1',photos,b.revision,s.revision,o->'itemRevisions',
      'reserved','fixture:p33b-storage','fixture:p33b-storage','p33b-storage-fixture-v1',0,0);
  insert into public.wardrobe_visualization_files(id,job_id,account_id,status,main_path,thumb_path,bytes,thumb_bytes,sha256,thumb_sha256)
    values(fid,jid,a,'staged',a||'/'||jid||'/'||fid||'/main.png',a||'/'||jid||'/'||fid||'/thumb.png',
      (v->>'bytes')::int,(v->>'thumbBytes')::int,v->>'sha256',v->>'thumbSha256');
end; $$;
select f.main_path,f.thumb_path from public.wardrobe_visualization_files f
  where f.id=(convert_from(decode('__RESULT_BASE64__','base64'),'UTF8')::jsonb->>'fileId')::uuid;
commit;

-- Run hosted-result-activate.sql separately only after both exact uploads.
-- For deletion test call ordinary deleteVisualization as the fixture user. The
-- result must be immediately denied. Let the existing cron remove the physical
-- files after the 5-minute lease; do not manually invoke global cleanup.
