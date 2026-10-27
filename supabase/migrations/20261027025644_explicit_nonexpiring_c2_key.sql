-- 2026-10-27: explicit owner approval for a non-expiring provider credential.
-- Its server-use cutoff remains finite; this migration does not activate C.
alter table wardrobe_private.c_runtime
 add column key_expiry_mode text not null default 'EXPIRING' check(key_expiry_mode in('EXPIRING','NON_EXPIRING')),
 add column provider_key_expires_at timestamptz;
update wardrobe_private.c_runtime set provider_key_expires_at=key_deadline where activated_at is not null;
comment on column wardrobe_private.c_runtime.key_deadline is
 'Finite server-use cutoff. In NON_EXPIRING mode equals C trial end; does not claim provider credential expiry.';
comment on column wardrobe_private.c_runtime.provider_key_expires_at is
 'Confirmed provider expiry for EXPIRING only; NULL for an explicitly approved non-expiring credential.';

-- One shared owner-only admission implementation keeps all existing gates and
-- locks. The two entrypoints select distinct exact gate sets, without inventing
-- a positive keyExpiryVerified assertion for NON_EXPIRING.
create function wardrobe_private.c_activate_with_key_mode(p_accounts uuid[],p_mode text,p_provider_deadline timestamptz,p_gates jsonb)
returns jsonb language plpgsql set search_path='' as $$
declare aid uuid; k text; required text[]; started timestamptz:=now(); cutoff timestamptz; n integer:=0;
begin
 perform 1 from wardrobe_private.ai_control where singleton for update;
 if (select activated_at from wardrobe_private.c_runtime where singleton) is not null
  or not exists(select 1 from wardrobe_private.c_trials where id='p33c-v1' and status='prepared' and starts_at is null)
  or exists(select 1 from wardrobe_private.c_members where trial_id='p33c-v1')
  or exists(select 1 from wardrobe_private.c_attempts where trial_id='p33c-v1') then raise exception 'CONFLICT'; end if;
 if p_mode='EXPIRING' then
  required:=array['fundingVerified','autoReloadOff','keyExpiryVerified','qaPassed','devicesVerified'];
  cutoff:=p_provider_deadline;
  if cutoff is null or cutoff<=started+interval '150 seconds' or cutoff>started+interval '30 days' then raise exception 'INVALID_MANIFEST';end if;
 elsif p_mode='NON_EXPIRING' then
  required:=array['fundingVerified','autoReloadOff','nonExpiringKeyApproved','qaPassed','devicesVerified'];
  if p_provider_deadline is not null then raise exception 'INVALID_MANIFEST';end if;
  cutoff:=started+interval '30 days';
 else raise exception 'INVALID_MANIFEST';end if;
 if coalesce(cardinality(p_accounts),0)<>2 or p_accounts[1]=p_accounts[2] or p_accounts[1] is null or p_accounts[2] is null
  or jsonb_typeof(p_gates) is distinct from 'object' or p_gates-required<>'{}' then raise exception 'INVALID_MANIFEST'; end if;
 foreach k in array required loop
  if p_gates->k is distinct from 'true'::jsonb then raise exception 'AI_UNAVAILABLE'; end if;
 end loop;
 if exists(select 1 from wardrobe_private.b_trial where not closed)
  or exists(select 1 from public.wardrobe_visualizations where status in('reserved','sent','outcome_unknown'))
  or exists(select 1 from wardrobe_private.c_attempts where status in('reserved','sent','outcome_unknown'))
  or exists(select 1 from wardrobe_private.ai_budgets where reserved_cents<>0) then raise exception 'AI_BUSY'; end if;
 foreach aid in array p_accounts loop
  perform wardrobe_private.assert_account(aid);n:=n+1;
  insert into wardrobe_private.c_members(trial_id,slot,account_id) values('p33c-v1',n,aid);
 end loop;
 insert into wardrobe_private.ai_budgets(scope,limit_cents) values('trial:p33c-v1',2500) on conflict do nothing;
 update wardrobe_private.c_trials set status='active',blocked=false,starts_at=started,ends_at=started+interval '30 days',revision=revision+1 where id='p33c-v1';
 update wardrobe_private.c_runtime set enabled=true,activated_at=started,key_deadline=cutoff,gates=p_gates,stop_reason=null,
  key_expiry_mode=p_mode,provider_key_expires_at=p_provider_deadline where singleton;
 update wardrobe_private.ai_control set blocked=false where singleton;
 return jsonb_build_object('startsAt',started,'endsAt',started+interval '30 days','keyDeadline',cutoff,
  'keyExpiryMode',p_mode,'serverUseEndsAt',cutoff,'providerKeyExpiresAt',p_provider_deadline);
end; $$;
create or replace function wardrobe_private.c_activate(p_accounts uuid[],p_key_deadline timestamptz,p_gates jsonb)
returns jsonb language sql set search_path='' as $$
 select wardrobe_private.c_activate_with_key_mode(p_accounts,'EXPIRING',p_key_deadline,p_gates);
$$;
create function wardrobe_private.c_activate_nonexpiring(p_accounts uuid[],p_gates jsonb)
returns jsonb language sql set search_path='' as $$
 select wardrobe_private.c_activate_with_key_mode(p_accounts,'NON_EXPIRING',null,p_gates);
$$;
revoke all on function wardrobe_private.c_activate_with_key_mode(uuid[],text,timestamptz,jsonb),
 wardrobe_private.c_activate(uuid[],timestamptz,jsonb),wardrobe_private.c_activate_nonexpiring(uuid[],jsonb)
 from public,anon,authenticated,service_role;

-- The worker/admission still honor the same finite key_deadline and trial end.
-- In NON_EXPIRING mode expiry closes the pilot, not the provider credential.
create or replace function public.wardrobe_expire_uploads() returns void language plpgsql security definer set search_path='' as $$
begin
 perform public.wardrobe_expire_uploads_c1();
 if exists(select 1 from wardrobe_private.c_runtime r join wardrobe_private.c_trials t on t.id='p33c-v1'
  where r.singleton and r.enabled and (r.key_deadline<=now() or t.ends_at<=now())) then
  perform wardrobe_private.c_close(case when exists(select 1 from wardrobe_private.c_runtime
   where singleton and key_expiry_mode='EXPIRING' and key_deadline<=now()) then 'KEY_EXPIRED' else 'TRIAL_EXPIRED' end);
 end if;
 delete from wardrobe_private.c_consent_events e using wardrobe_private.c_consents c
  where e.account_id=c.account_id and e.revision<c.revision and e.created_at<now()-interval '90 days';
end;$$;
revoke all on function public.wardrobe_expire_uploads() from public,anon,authenticated;
grant execute on function public.wardrobe_expire_uploads() to service_role;
