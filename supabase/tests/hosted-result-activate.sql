-- Explicit activation of the synthetic Storage fixture after its two real PNG
-- uploads. This is operator test SQL, never deployed as an RPC or app endpoint.
begin;
do $$
declare v jsonb:=convert_from(decode('__RESULT_BASE64__','base64'),'UTF8')::jsonb;
  f public.wardrobe_visualization_files; j public.wardrobe_visualizations;
begin
  select * into j from public.wardrobe_visualizations where id=(v->>'jobId')::uuid
    and account_id=(v->>'accountId')::uuid and fingerprint='p33b-storage-fixture-v1' and b_case_id is null;
  if not found then raise exception 'WRONG_FIXTURE'; end if;
  select * into f from public.wardrobe_visualization_files where id=(v->>'fileId')::uuid and job_id=j.id and status='staged';
  if not found or (select count(*) from storage.objects where bucket_id='wardrobe-results' and name in(f.main_path,f.thumb_path))<>2
    then raise exception 'UPLOAD_INCOMPLETE'; end if;
  update public.wardrobe_visualization_files set status='active' where id=f.id;
  update public.wardrobe_visualizations set status='succeeded',completed_at=now(),expires_at=f.expires_at where id=j.id;
end; $$;
commit;
