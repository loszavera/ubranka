-- Hosted safeupdate rejects UPDATE without WHERE. Target only members with
-- receipts actually eligible for archival; no settings or historic migration
-- changes. Empty and repeated cleanup performs no archived_sends UPDATE.
create or replace function public.wardrobe_expire_uploads()
returns void language plpgsql security definer set search_path='' as $$
begin
 perform public.wardrobe_expire_uploads_p33b();
 update wardrobe_private.c_intents i set snapshot='{}',outfit_id=null from wardrobe_private.c_attempts a
  where a.id=i.job_id and coalesce(a.completed_at,a.created_at)<now()-interval '90 days';
 delete from public.wardrobe_visualizations j where c_intent_id is not null and coalesce(completed_at,created_at)<now()-interval '90 days'
  and not exists(select 1 from public.wardrobe_visualization_files f where f.job_id=j.id);
 update wardrobe_private.c_intents i set snapshot='{}',outfit_id=null where job_id is not null and created_at<now()-interval '90 days'
  and not exists(select 1 from wardrobe_private.c_attempts a where a.id=i.job_id)
  and not exists(select 1 from public.wardrobe_visualizations j where j.id=i.job_id);
 update wardrobe_private.c_members m set archived_sends=archived_sends+(select count(*) from wardrobe_private.c_attempts a
  where a.member_id=m.id and a.sent_at is not null and a.completed_at<now()-interval '90 days' and a.reserved_cents=0
   and not exists(select 1 from public.wardrobe_visualizations j where j.id=a.id))
 where exists(select 1 from wardrobe_private.c_attempts eligible
  where eligible.member_id=m.id and eligible.sent_at is not null and eligible.completed_at<now()-interval '90 days' and eligible.reserved_cents=0
   and not exists(select 1 from public.wardrobe_visualizations j where j.id=eligible.id));
 delete from wardrobe_private.c_attempts a where completed_at<now()-interval '90 days' and reserved_cents=0
  and not exists(select 1 from public.wardrobe_visualizations j where j.id=a.id);
 update wardrobe_private.c_members m set account_id=null from wardrobe_private.c_trials t
  where m.trial_id=t.id and t.ends_at<now() and not exists(select 1 from wardrobe_private.c_attempts a
   where a.member_id=m.id and coalesce(a.completed_at,a.created_at)>=now()-interval '90 days');
 delete from wardrobe_private.c_intents where job_id is null and expires_at<now()-interval '24 hours';
 delete from wardrobe_private.c_intents i using wardrobe_private.c_trials t where i.trial_id=t.id
  and t.ends_at<now() and i.snapshot='{}' and not exists(select 1 from public.wardrobe_visualizations j where j.c_intent_id=i.id);
end; $$;
