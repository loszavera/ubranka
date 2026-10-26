-- C2 ships OFF. Only the database owner can perform the separately authorized
-- one-time activation after verifying funding, key expiry and acceptance gates.
create table wardrobe_private.c_runtime (
 singleton boolean primary key default true check(singleton), enabled boolean not null default false,
 activated_at timestamptz, key_deadline timestamptz, gates jsonb,
 limits_version text not null default 'p33c-v1', policy_version text not null default 'p33c-ai-v1.2',
 canonical_version text not null default 'p33c-jpeg-v1', stop_reason text
);
insert into wardrobe_private.c_runtime(singleton) values(true);
alter table wardrobe_private.c_runtime enable row level security;
revoke all on wardrobe_private.c_runtime from public,anon,authenticated,service_role;
alter table wardrobe_private.c_members add column safety_identifier text default
 (replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-',''));
alter table wardrobe_private.c_intents add column canonical jsonb, add column manifest_hash text check(manifest_hash ~ '^[a-f0-9]{64}$');
alter table wardrobe_private.c_attempts add column measurements jsonb;
alter table wardrobe_private.c_consents drop constraint c_consents_version_check;
alter table wardrobe_private.c_consents add constraint c_consents_version_check check(version in('p33c-ai-v1.1','p33c-ai-v1.2'));
create table wardrobe_private.c_consent_events (
 account_id uuid not null references public.wardrobe_accounts on delete cascade,
 revision bigint not null, version text not null, accepted boolean not null, created_at timestamptz not null default now(),
 primary key(account_id,revision)
);
alter table wardrobe_private.c_consent_events enable row level security;
revoke all on wardrobe_private.c_consent_events from public,anon,authenticated,service_role;
-- Preserve previous policy receipts verbatim; a new policy never inherits acceptance.
insert into wardrobe_private.c_consent_events(account_id,revision,version,accepted)
 select account_id,revision,version,accepted from wardrobe_private.c_consents;
create function wardrobe_private.c_record_consent() returns trigger language plpgsql set search_path='' as $$
begin
 insert into wardrobe_private.c_consent_events(account_id,revision,version,accepted) values(new.account_id,new.revision,new.version,new.accepted)
 on conflict(account_id,revision) do nothing;
 return new;
end; $$;
create trigger c_consent_history after insert or update on wardrobe_private.c_consents for each row execute function wardrobe_private.c_record_consent();
create function wardrobe_private.c_detach_safety() returns trigger language plpgsql set search_path='' as $$
begin if new.account_id is null then new.safety_identifier:=null; end if; return new; end; $$;
create trigger c_member_privacy before update of account_id on wardrobe_private.c_members for each row execute function wardrobe_private.c_detach_safety();

create or replace function wardrobe_private.c_enabled() returns boolean language sql stable set search_path='' as $$
 select coalesce(r.enabled and r.key_deadline>now() and t.status='active' and not t.blocked
  and t.starts_at<=now() and t.ends_at>now() and not c.blocked,false)
 from wardrobe_private.c_runtime r cross join wardrobe_private.ai_control c
 join wardrobe_private.c_trials t on t.id='p33c-v1' where r.singleton and c.singleton;
$$;
create function wardrobe_private.c_open(p_account uuid) returns boolean language sql stable set search_path='' as $$
 select coalesce(r.enabled and r.activated_at is not null and r.key_deadline>now() and not ctl.blocked
  and t.status='active' and not t.blocked and t.starts_at<=now() and t.ends_at>now()
  and r.policy_version='p33c-ai-v1.2' and r.canonical_version='p33c-jpeg-v1'
  and exists(select 1 from wardrobe_private.c_members where trial_id=t.id and account_id=p_account and safety_identifier is not null),false)
 from wardrobe_private.c_runtime r join wardrobe_private.c_trials t on t.id='p33c-v1'
 cross join wardrobe_private.ai_control ctl where r.singleton and ctl.singleton;
$$;
create function wardrobe_private.c_activate(p_accounts uuid[],p_key_deadline timestamptz,p_gates jsonb)
returns jsonb language plpgsql set search_path='' as $$
declare aid uuid; k text; started timestamptz:=now(); n integer:=0;
begin
 perform 1 from wardrobe_private.ai_control where singleton for update;
 if (select activated_at from wardrobe_private.c_runtime where singleton) is not null
  or not exists(select 1 from wardrobe_private.c_trials where id='p33c-v1' and status='prepared' and starts_at is null)
  or exists(select 1 from wardrobe_private.c_members where trial_id='p33c-v1')
  or exists(select 1 from wardrobe_private.c_attempts where trial_id='p33c-v1') then raise exception 'CONFLICT'; end if;
 if coalesce(cardinality(p_accounts),0)<>2 or p_accounts[1]=p_accounts[2] or p_accounts[1] is null or p_accounts[2] is null
  or p_key_deadline is null or p_key_deadline<=started+interval '150 seconds' or p_key_deadline>started+interval '30 days'
  or jsonb_typeof(p_gates) is distinct from 'object' or p_gates-array['fundingVerified','autoReloadOff','keyExpiryVerified','qaPassed','devicesVerified']<>'{}' then raise exception 'INVALID_MANIFEST'; end if;
 foreach k in array array['fundingVerified','autoReloadOff','keyExpiryVerified','qaPassed','devicesVerified'] loop
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
 update wardrobe_private.c_runtime set enabled=true,activated_at=started,key_deadline=p_key_deadline,gates=p_gates,stop_reason=null where singleton;
 update wardrobe_private.ai_control set blocked=false where singleton;
 return jsonb_build_object('startsAt',started,'endsAt',started+interval '30 days','keyDeadline',p_key_deadline);
end; $$;
create function wardrobe_private.c_close(p_reason text) returns void language plpgsql set search_path='' as $$
declare jid uuid;
begin
 perform 1 from wardrobe_private.ai_control where singleton for update;
 if p_reason not in('MANUAL_STOP','TRIAL_EXPIRED','KEY_EXPIRED','LIMIT_REACHED','GENERATION_FAILED','OUTCOME_UNKNOWN','COST_EXCEEDED') then raise exception 'INVALID_STATE'; end if;
 update wardrobe_private.c_runtime set enabled=false,stop_reason=p_reason where singleton;
 update wardrobe_private.c_trials set status='closed',blocked=true,revision=revision+1 where id='p33c-v1' and status<>'closed';
 update wardrobe_private.ai_control set blocked=true where singleton;
 for jid in select id from public.wardrobe_visualizations where trial_scope='trial:p33c-v1' and status='reserved' loop perform wardrobe_private.cancel_job(jid); end loop;
end; $$;

alter function wardrobe_private.c_intent_json(uuid) rename to c_intent_json_c1;
create function wardrobe_private.c_intent_json(p_id uuid) returns jsonb language sql stable set search_path='' as $$
 select wardrobe_private.c_intent_json_c1(p_id)||jsonb_build_object('manifestHash',i.manifest_hash,'consentVersion','p33c-ai-v1.2',
 'inputs',coalesce((select jsonb_agg(v.value||jsonb_build_object('canonical',c.value-'photoId') order by v.ord)
  from jsonb_array_elements(i.snapshot->'inputs') with ordinality v(value,ord)
  left join lateral (select value from jsonb_array_elements(i.canonical) where value->>'photoId'=v.value->>'photoId') c on true),'[]'::jsonb))
 from wardrobe_private.c_intents i where i.id=p_id;
$$;
create function public.wardrobe_c_seal_intent(p_account uuid,p_intent uuid,p_canonical jsonb,p_manifest_hash text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare i wardrobe_private.c_intents; c jsonb; source jsonb; ord bigint;
begin
 perform wardrobe_private.assert_account(p_account);
 select * into i from wardrobe_private.c_intents where id=p_intent and account_id=p_account for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 if i.expires_at<=now() or i.snapshot is distinct from wardrobe_private.c_snapshot(p_account,i.outfit_id) then raise exception 'CONFLICT'; end if;
 if p_manifest_hash is null or p_manifest_hash !~ '^[a-f0-9]{64}$' or jsonb_typeof(p_canonical) is distinct from 'array'
  or jsonb_array_length(p_canonical)<>jsonb_array_length(i.snapshot->'inputs') then raise exception 'INVALID_MANIFEST'; end if;
 for c,ord in select value,ordinality from jsonb_array_elements(p_canonical) with ordinality loop
  source:=i.snapshot->'inputs'->(ord::integer-1);
  if c-array['photoId','version','sha256','bytes','width','height']<>'{}' or c->>'photoId' is distinct from source->>'photoId'
   or c->>'version' is distinct from 'p33c-jpeg-v1' or coalesce(c->>'sha256','') !~ '^[a-f0-9]{64}$'
   or jsonb_typeof(c->'bytes') is distinct from 'number' or (c->>'bytes')::numeric not between 1 and 1000000 or (c->>'bytes')::numeric<>trunc((c->>'bytes')::numeric)
   or jsonb_typeof(c->'width') is distinct from 'number' or (c->>'width')::numeric not between 1 and 1024 or (c->>'width')::numeric<>trunc((c->>'width')::numeric)
   or jsonb_typeof(c->'height') is distinct from 'number' or (c->>'height')::numeric not between 1 and 1536 or (c->>'height')::numeric<>trunc((c->>'height')::numeric)
   then raise exception 'INVALID_MANIFEST'; end if;
 end loop;
 if i.manifest_hash is not null then
  if i.canonical is distinct from p_canonical or i.manifest_hash<>p_manifest_hash then raise exception 'CONFLICT'; end if;
 else
  if i.job_id is not null then raise exception 'CASE_USED'; end if;
  update wardrobe_private.c_intents set canonical=p_canonical,manifest_hash=p_manifest_hash where id=i.id;
 end if;
 return wardrobe_private.c_intent_json(i.id);
end; $$;

-- The C1 four-argument API is permanently retired; it lacks the confirmed byte manifest.
create or replace function public.wardrobe_c_reserve(p_account uuid,p_id uuid,p_intent uuid,p_epoch bigint)
returns jsonb language plpgsql security definer set search_path='' as $$begin raise exception 'AI_DISABLED'; end; $$;
create function public.wardrobe_c_reserve_v2(p_account uuid,p_id uuid,p_intent uuid,p_epoch bigint,p_manifest_hash text,p_consent_version text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare i wardrobe_private.c_intents; old wardrobe_private.c_consents; j jsonb;
begin
 perform wardrobe_private.assert_account(p_account);
 select * into i from wardrobe_private.c_intents where id=p_intent and account_id=p_account for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 if i.trial_id<>'p33c-v1' or not wardrobe_private.c_open(p_account) then raise exception 'AI_DISABLED'; end if;
 if p_consent_version is distinct from 'p33c-ai-v1.2' then raise exception 'AI_CONSENT_REQUIRED'; end if;
 if i.manifest_hash is null or p_manifest_hash is distinct from i.manifest_hash or i.canonical is null then raise exception 'MANIFEST_MISMATCH'; end if;
 if i.job_id is not null then
  if i.job_id<>p_id then raise exception 'CASE_USED'; end if;
  return jsonb_build_object('job',wardrobe_private.job_json(p_id),'dispatch',false);
 end if;
 select * into old from wardrobe_private.c_consents where account_id=p_account;
 -- Only a successful atomic reservation creates acceptance of V1.2. Preserve
 -- prior receipt, then let the core increment the monotonic epoch once.
 update wardrobe_private.c_consents set version='p33c-ai-v1.2' where account_id=p_account;
 j:=wardrobe_private.c_reserve_core(p_account,p_id,p_intent,p_epoch);
 update public.wardrobe_visualizations set consent_version='p33c-ai-v1.2' where id=p_id and account_id=p_account;
 return jsonb_build_object('job',wardrobe_private.job_json(p_id),'dispatch',true);
end; $$;

create function public.wardrobe_c_worker_plan(p_account uuid,p_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare j public.wardrobe_visualizations; i wardrobe_private.c_intents; c wardrobe_private.c_consents; v jsonb;
begin
 perform wardrobe_private.assert_account(p_account);
 if not wardrobe_private.c_open(p_account) then raise exception 'AI_DISABLED'; end if;
 select * into j from public.wardrobe_visualizations where id=p_id and account_id=p_account and status='reserved' and trial_scope='trial:p33c-v1';
 if not found then raise exception 'NOT_FOUND'; end if;
 select * into i from wardrobe_private.c_intents where id=j.c_intent_id;
 select * into c from wardrobe_private.c_consents where account_id=p_account;
 if i.manifest_hash is null or i.canonical is null or not wardrobe_private.c_inputs_current(j.id)
  or j.consent_version<>'p33c-ai-v1.2' or c.version<>'p33c-ai-v1.2' or not c.accepted then raise exception 'CONFLICT'; end if;
 v:=wardrobe_private.c_intent_json(i.id);
 return jsonb_build_object('jobId',j.id,'accountId',j.account_id,'trialId',i.trial_id,'inputs',v->'inputs','manifestHash',i.manifest_hash,
  'safetyIdentifier',(select safety_identifier from wardrobe_private.c_members where trial_id=i.trial_id and account_id=p_account),
  'keyDeadline',(select key_deadline from wardrobe_private.c_runtime where singleton),
  'promptVersion','p33c-v1','prompt','Create one realistic full-body outfit visualization. The first image shows the consenting adult participant. Preserve this person and their body proportions. The following images show the selected clothing items. Dress the participant in those items, preserving their colors, cut, patterns and visible details. Use a calm neutral background. Do not add people, text, logos or unrequested accessories. This is a visual illustration, not evidence of garment size or physical fit.',
  'params',jsonb_build_object('model','gpt-image-2.5-flare-2026-09-08','n',1,'quality','medium','size','1024x1536','output_format','png','background','opaque','moderation','auto'));
end; $$;
-- Old plan cannot become an unsealed alternate worker entrypoint.
create or replace function public.wardrobe_c_plan(p_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$begin raise exception 'AI_DISABLED'; end; $$;
create or replace function public.wardrobe_c_mark_sent(p_id uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare j public.wardrobe_visualizations; i wardrobe_private.c_intents;
begin
 perform 1 from wardrobe_private.ai_control where singleton for update;
 if not wardrobe_private.c_enabled() then raise exception 'AI_DISABLED'; end if;
 select * into j from public.wardrobe_visualizations where id=p_id and c_intent_id is not null;
 if not found then raise exception 'NOT_FOUND'; end if;
 if not wardrobe_private.c_open(j.account_id) then raise exception 'AI_DISABLED'; end if;
 select * into i from wardrobe_private.c_intents where id=j.c_intent_id;
 if i.manifest_hash is null or i.canonical is null or j.consent_version<>'p33c-ai-v1.2' then raise exception 'AI_CONSENT_REQUIRED'; end if;
 return wardrobe_private.c_mark_sent_core(p_id);
end; $$;
create function public.wardrobe_c_abort_unsent(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 perform 1 from wardrobe_private.ai_control where singleton for update;
 if exists(select 1 from public.wardrobe_visualizations where id=p_id and trial_scope='trial:p33c-v1' and status='reserved') then perform wardrobe_private.cancel_job(p_id); end if;
end; $$;
-- Operational OFF/expiry stops new sends; a legitimate already-sent response
-- may still obtain its manifest in the short window, with current consent/inputs.
create or replace function public.wardrobe_c_manifest(p_job uuid,p_id uuid,p_bytes integer,p_thumb_bytes integer,p_sha text,p_thumb_sha text,p_thumb_mime text,p_width integer,p_height integer)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.wardrobe_visualizations where id=p_job and trial_scope='trial:p33c-v1' and consent_version='p33c-ai-v1.2') then raise exception 'AI_DISABLED'; end if;
 return wardrobe_private.c_manifest_core(p_job,p_id,p_bytes,p_thumb_bytes,p_sha,p_thumb_sha,p_thumb_mime,p_width,p_height);
end; $$;
alter function public.wardrobe_c_complete(uuid,jsonb,boolean) rename to wardrobe_c_complete_c1;
revoke all on function public.wardrobe_c_complete_c1(uuid,jsonb,boolean) from public,anon,authenticated,service_role;
create function public.wardrobe_c_complete(p_id uuid,p_usage jsonb,p_publish boolean,p_measurements jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; k text; v jsonb; before_attempt wardrobe_private.c_attempts;
begin
 if jsonb_typeof(p_measurements) is distinct from 'object' or octet_length(p_measurements::text)>3000
  or p_measurements-array['providerResponseId','inputMs','canonicalMs','providerMs','decodeMs','uploadMs','totalMs','failureStage','stopReason']<>'{}' then raise exception 'INVALID_USAGE'; end if;
 for k,v in select key,value from jsonb_each(p_measurements) loop
  if k in('providerResponseId','failureStage','stopReason') then
   if jsonb_typeof(v) is distinct from 'string' or length(v#>>'{}')>200 or v#>>'{}' !~ '^[a-zA-Z0-9_.:-]*$' then raise exception 'INVALID_USAGE'; end if;
  elsif jsonb_typeof(v) is distinct from 'number' or (v#>>'{}')::numeric not between 0 and 300000 then raise exception 'INVALID_USAGE'; end if;
 end loop;
 perform 1 from wardrobe_private.ai_control where singleton for update;
 select * into before_attempt from wardrobe_private.c_attempts where id=p_id;
 result:=public.wardrobe_c_complete_c1(p_id,p_usage,p_publish);
 update wardrobe_private.c_attempts set measurements=p_measurements where id=p_id and measurements is null;
 update public.wardrobe_visualizations set measurements=p_measurements where id=p_id and measurements is null;
 if before_attempt.trial_id='p33c-v1' and before_attempt.status in('sent','outcome_unknown') then
  if p_usage is null or before_attempt.status='outcome_unknown' then perform wardrobe_private.c_close('OUTCOME_UNKNOWN');
  elsif exists(select 1 from wardrobe_private.c_attempts where id=p_id and spent_cents>before_attempt.reserved_cents) then perform wardrobe_private.c_close('COST_EXCEEDED');
  elsif exists(select 1 from wardrobe_private.c_attempts where id=p_id and status='failed') then perform wardrobe_private.c_close('GENERATION_FAILED');
  elsif exists(select 1 from wardrobe_private.ai_budgets where scope='trial:p33c-v1' and spent_cents>=2500)
   or (select count(*) from wardrobe_private.c_attempts where trial_id='p33c-v1' and sent_at is not null)
     +coalesce((select sum(archived_sends) from wardrobe_private.c_members where trial_id='p33c-v1'),0)>=60
   then perform wardrobe_private.c_close('LIMIT_REACHED'); end if;
 end if;
 return result;
end; $$;
create function public.wardrobe_c_complete(p_id uuid,p_usage jsonb,p_publish boolean)
returns jsonb language sql security definer set search_path='' as $$select public.wardrobe_c_complete(p_id,p_usage,p_publish,'{}'::jsonb);$$;
revoke all on function public.wardrobe_c_complete(uuid,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.wardrobe_c_complete(uuid,jsonb,boolean) to service_role;
create or replace function wardrobe_private.c_publishable(p_job uuid)
returns boolean language sql stable set search_path='' as $$
 select coalesce(a.status='sent' and a.publish_until>now() and c.accepted and c.revision=a.consent_revision
  and c.version=j.consent_version and wardrobe_private.c_inputs_current(j.id),false)
 from wardrobe_private.c_attempts a join public.wardrobe_visualizations j on j.id=a.id
 join wardrobe_private.c_consents c on c.account_id=j.account_id where a.id=p_job;
$$;

alter function public.wardrobe_execute(text,jsonb) rename to wardrobe_execute_c1;
revoke all on function public.wardrobe_execute_c1(text,jsonb) from public,anon,authenticated,service_role;
create function public.wardrobe_execute(p_action text,p_payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); i wardrobe_private.c_intents; v jsonb;
begin
 if uid is null then raise exception 'UNAUTHENTICATED'; end if;
 if p_action='getVisualizationIntent' then
  perform wardrobe_private.assert_account(uid);
  select * into i from wardrobe_private.c_intents where id=(p_payload->>'intentId')::uuid and account_id=uid;
  if not found then raise exception 'NOT_FOUND'; end if;
  if i.expires_at<=now() or i.snapshot is distinct from wardrobe_private.c_snapshot(uid,i.outfit_id) then raise exception 'CONFLICT'; end if;
  return wardrobe_private.c_intent_json(i.id);
 elsif p_action='setAiConsent' and p_payload->'accepted'='false'::jsonb and p_payload->>'consentVersion'='p33c-ai-v1.2' then
  perform wardrobe_private.assert_account(uid);
  update wardrobe_private.c_consents set version='p33c-ai-v1.2' where account_id=uid;
  v:=public.wardrobe_execute_c1(p_action,p_payload||jsonb_build_object('consentVersion','p33c-ai-v1.1'));
  return v||jsonb_build_object('version','p33c-ai-v1.2');
 end if;
 -- Direct request RPC remains OFF: only Edge verifies canonical bytes/consent
 -- and calls the restricted service admission API. No client role can do so.
 return public.wardrobe_execute_c1(p_action,p_payload);
end; $$;
alter function wardrobe_private.visualization_json(uuid) rename to visualization_json_c1;
create function wardrobe_private.visualization_json(p_account uuid) returns jsonb language sql stable set search_path='' as $$
 select wardrobe_private.visualization_json_c1(p_account)||jsonb_build_object(
  'mode',case when wardrobe_private.c_open(p_account) then 'private_pilot' else 'off' end,
  'consent',jsonb_build_object('accepted',coalesce(c.accepted and c.version='p33c-ai-v1.2',false),'version','p33c-ai-v1.2','revision',coalesce(c.revision,0)),
  'pilot',(wardrobe_private.visualization_json_c1(p_account)->'pilot')||jsonb_build_object('blocked',not wardrobe_private.c_open(p_account),
   'keyDeadline',r.key_deadline,'stopReason',r.stop_reason,'policyVersion','p33c-ai-v1.2'),
  'monthlyBudget',jsonb_build_object('budgetPln',25,'spentPln',coalesce(b.spent_cents,0)/100.0,'reservedPln',coalesce(b.reserved_cents,0)/100.0,
   'availablePln',greatest(0,2500-coalesce(b.spent_cents+b.reserved_cents,0))/100.0,
   'resetsAt',(date_trunc('month',now() at time zone 'UTC')+interval '1 month') at time zone 'UTC'))
 from wardrobe_private.c_runtime r left join wardrobe_private.c_consents c on c.account_id=p_account
 left join wardrobe_private.ai_budgets b on b.scope='month:'||to_char(now() at time zone 'UTC','YYYY-MM') where r.singleton;
$$;
create function wardrobe_private.c_clear_canonical() returns trigger language plpgsql set search_path='' as $$
begin if new.snapshot='{}' then new.canonical:=null;new.manifest_hash:=null;end if;return new;end;$$;
create trigger c_intent_retention before update of snapshot on wardrobe_private.c_intents for each row execute function wardrobe_private.c_clear_canonical();
alter function public.wardrobe_expire_uploads() rename to wardrobe_expire_uploads_c1;
revoke all on function public.wardrobe_expire_uploads_c1() from public,anon,authenticated,service_role;
create function public.wardrobe_expire_uploads() returns void language plpgsql security definer set search_path='' as $$
begin
 perform public.wardrobe_expire_uploads_c1();
 if exists(select 1 from wardrobe_private.c_runtime r join wardrobe_private.c_trials t on t.id='p33c-v1'
  where r.singleton and r.enabled and (r.key_deadline<=now() or t.ends_at<=now())) then
  perform wardrobe_private.c_close(case when (select key_deadline<=now() from wardrobe_private.c_runtime where singleton) then 'KEY_EXPIRED' else 'TRIAL_EXPIRED' end);
 end if;
 delete from wardrobe_private.c_consent_events e using wardrobe_private.c_consents c
  where e.account_id=c.account_id and e.revision<c.revision and e.created_at<now()-interval '90 days';
end;$$;
revoke all on function public.wardrobe_expire_uploads() from public,anon,authenticated;
grant execute on function public.wardrobe_expire_uploads() to service_role;

revoke all on all functions in schema wardrobe_private from public,anon,authenticated,service_role;
revoke all on function public.wardrobe_c_seal_intent(uuid,uuid,jsonb,text),public.wardrobe_c_reserve_v2(uuid,uuid,uuid,bigint,text,text),
 public.wardrobe_c_worker_plan(uuid,uuid),public.wardrobe_c_abort_unsent(uuid),public.wardrobe_c_complete(uuid,jsonb,boolean,jsonb) from public,anon,authenticated;
grant execute on function public.wardrobe_c_seal_intent(uuid,uuid,jsonb,text),public.wardrobe_c_reserve_v2(uuid,uuid,uuid,bigint,text,text),
 public.wardrobe_c_worker_plan(uuid,uuid),public.wardrobe_c_abort_unsent(uuid),public.wardrobe_c_complete(uuid,jsonb,boolean,jsonb) to service_role;
revoke all on function public.wardrobe_execute(text,jsonb) from public,anon;
grant execute on function public.wardrobe_execute(text,jsonb) to authenticated;
