-- OPERATOR TEMPLATE ONLY. Replace every <...> with local synthetic fixture
-- values. This is NOT AI execution or financial admission. No sent marker,
-- attempt/cost/budget writes. A separate fixture trial and preview intent must
-- exist (see c1-concurrency.md); exact account must be @example.com.
-- Upload only an existing synthetic PNG/JPEG after this durable staged manifest.
begin;
do $$
declare aid uuid:='<ACCOUNT>'; iid uuid:='<INTENT>'; jid uuid:='<JOB>'; fid uuid:='<FILE>';
 i wardrobe_private.c_intents; photos uuid[];
begin
 select * into i from wardrobe_private.c_intents where id=iid and account_id=aid;
 if i.id is null or i.trial_id !~ '^p33c-fixture-[a-f0-9-]{36}$' or i.job_id is not null
  or not exists(select 1 from auth.users where id=aid and email like '%@example.com')
  or wardrobe_private.c_enabled() or not (select blocked from wardrobe_private.ai_control where singleton)
  or i.snapshot is distinct from wardrobe_private.c_snapshot(aid,i.outfit_id) then raise exception 'QA_GUARD'; end if;
 select array_agg((value->>'photoId')::uuid) into photos from jsonb_array_elements(i.snapshot->'inputs');
 insert into public.wardrobe_visualizations(id,account_id,outfit_id,fingerprint,input_photo_ids,input_body_revision,input_styling_revision,
  input_item_revisions,status,trial_scope,month_scope,consent_version,reserved_cents,reserved_bytes,spent_cents,c_intent_id,expires_at,completed_at)
 values(jid,aid,i.outfit_id,i.fingerprint,photos,i.body_revision,i.styling_revision,i.snapshot->'outfit'->'itemRevisions',
  'succeeded','fixture:'||i.trial_id,'fixture:none','p33c-ai-v1.1',0,0,0,iid,now()+interval '30 days',now());
 update wardrobe_private.c_intents set job_id=jid where id=iid;
 insert into public.wardrobe_visualization_files(id,job_id,account_id,status,main_path,thumb_path,bytes,thumb_bytes,sha256,thumb_sha256,
  thumb_mime_type,thumb_width,thumb_height)
 values(fid,jid,aid,'staged',aid||'/'||jid||'/'||fid||'/main.png',aid||'/'||jid||'/'||fid||'/thumb.jpg',
  <MAIN_BYTES>,<THUMB_BYTES>,'<MAIN_SHA256>','<THUMB_SHA256>','image/jpeg',<THUMB_WIDTH>,<THUMB_HEIGHT>);
end$$;
commit;

-- STOP here: use real Storage API with service authorization to upload exactly
-- the two known synthetic files to these paths and recorded content types.
-- Then execute the activation block separately, before the five-minute lease.
begin;
do $$declare fid uuid:='<FILE>'; aid uuid:='<ACCOUNT>'; f public.wardrobe_visualization_files;
begin
 select * into f from public.wardrobe_visualization_files where id=fid and account_id=aid and status='staged' for update;
 if f.id is null or f.cleanup_after<=now() or not exists(select 1 from auth.users where id=aid and email like '%@example.com')
  or not exists(select 1 from public.wardrobe_visualizations j join wardrobe_private.c_intents i on i.id=j.c_intent_id
   where j.id=f.job_id and i.trial_id ~ '^p33c-fixture-[a-f0-9-]{36}$' and wardrobe_private.c_inputs_current(j.id))
  or (select count(*) from storage.objects where bucket_id=f.bucket and name in(f.main_path,f.thumb_path))<>2 then raise exception 'QA_GUARD'; end if;
 update public.wardrobe_visualization_files set status='active' where id=fid;
 update public.wardrobe_visualizations set expires_at=f.expires_at where id=f.job_id;
end$$;
commit;

-- Exercise actual user POST reads / wrong account / raw Storage denial / export
-- / UI / deletion. Delete using ordinary deleteVisualization or deleteAiData and
-- wait for physical Storage cleanup lease. Never DELETE storage.objects in SQL.
-- Root performs own fixture account deletion. Only after files are absent:
begin;
do $$declare tid text:='p33c-fixture-<RUN_UUID>'; jid uuid:='<JOB>'; aid uuid:='<ACCOUNT>';
begin
 if tid !~ '^p33c-fixture-[a-f0-9-]{36}$'
  or exists(select 1 from public.wardrobe_visualization_files where job_id=jid)
  or exists(select 1 from wardrobe_private.c_attempts where trial_id=tid and sent_at is not null)
  or exists(select 1 from public.wardrobe_visualizations where id=jid and (account_id<>aid or trial_scope<>'fixture:'||tid))
  then raise exception 'QA_GUARD'; end if;
 delete from public.wardrobe_visualizations where id=jid and account_id=aid;
 delete from wardrobe_private.c_intents where trial_id=tid and account_id=aid;
 -- Other fixture member remains for independent tests; do not globally clear.
end$$;
commit;
