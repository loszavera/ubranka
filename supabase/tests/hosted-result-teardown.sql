-- AFTER Storage API/normal cron confirms both fixture objects absent. This
-- deletes only the exact operator-owned job, and clears only its test consent.
-- Keep the two synthetic accounts and their actual inputs for the later trial.
begin;
do $$
declare v jsonb:=convert_from(decode('__RESULT_BASE64__','base64'),'UTF8')::jsonb;
  jid uuid:=(v->>'jobId')::uuid; a uuid:=(v->>'accountId')::uuid;
begin
  if not exists(select 1 from auth.users where id=a and email ~ '^p33b-[a-z0-9-]+@example[.]com$') then raise exception 'NOT_SYNTHETIC'; end if;
  if exists(select 1 from storage.objects where bucket_id='wardrobe-results' and name like a||'/'||jid||'/%') then raise exception 'STORAGE_NOT_DELETED'; end if;
  if exists(select 1 from public.wardrobe_visualizations where id=jid and (account_id<>a or fingerprint<>'p33b-storage-fixture-v1' or b_case_id is not null)) then raise exception 'WRONG_FIXTURE'; end if;
  delete from public.wardrobe_visualization_files where job_id=jid and account_id=a;
  delete from public.wardrobe_visualizations where id=jid and account_id=a and fingerprint='p33b-storage-fixture-v1';
  update public.wardrobe_body_fit set ai_consent_version=null,ai_consent_at=null
    where account_id=a and ai_consent_version='p33b-storage-fixture-v1';
end; $$;
commit;
