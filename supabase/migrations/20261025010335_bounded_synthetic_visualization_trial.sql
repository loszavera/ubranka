-- P3.3B is an immutable six-case synthetic experiment, not a general AI switch.
-- ai_enabled() and all P3.3A provider RPCs remain hard OFF.
create table wardrobe_private.b_trial (
  id text primary key check(id='p33b-v1'), activated_at timestamptz, ends_at timestamptz,
  closed boolean not null default false, manifest_sha256 text not null check(manifest_sha256 ~ '^[a-f0-9]{64}$'),
  check(ends_at is null or ends_at=activated_at+interval '24 hours')
);
create table wardrobe_private.b_cases (
  id text primary key check(id in('B01','B02','B03','B04','B05','B06')),
  trial_id text not null references wardrobe_private.b_trial(id),
  account_id uuid references public.wardrobe_accounts(id) on delete set null,
  label text not null check(length(label) between 1 and 100), outfit_id uuid,
  body_revision bigint, styling_revision bigint, input_photo_ids uuid[], input_hashes jsonb,
  item_revisions jsonb, prompt text, prompt_sha256 text, params jsonb,
  job_id uuid unique, sent_at timestamptz, usage jsonb, cost_micro_usd bigint, spent_cents bigint,
  -- The case slot and totals survive deletion of a personal job/account.
  check(prompt is null or length(prompt) between 1 and 2500)
);
alter table wardrobe_private.b_trial enable row level security;
alter table wardrobe_private.b_cases enable row level security;
revoke all on wardrobe_private.b_trial,wardrobe_private.b_cases from public,anon,authenticated,service_role;
alter table public.wardrobe_visualizations add column b_case_id text references wardrobe_private.b_cases(id);
alter table public.wardrobe_visualizations add column review jsonb;
alter table public.wardrobe_visualizations add column measurements jsonb;

create table public.wardrobe_visualization_files (
  id uuid primary key, job_id uuid not null unique references public.wardrobe_visualizations(id),
  account_id uuid not null references public.wardrobe_accounts(id),
  status text not null check(status in('staged','active','deleting')),
  main_path text not null unique, thumb_path text not null unique,
  bytes integer not null check(bytes between 1 and 8000000),
  thumb_bytes integer not null check(thumb_bytes between 1 and 100000),
  mime_type text not null default 'image/png' check(mime_type='image/png'),
  sha256 text not null check(sha256 ~ '^[a-f0-9]{64}$'), thumb_sha256 text not null check(thumb_sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '30 days',
  cleanup_after timestamptz not null default now()+interval '5 minutes',
  cleanup_attempts integer not null default 0, cleanup_attempted_at timestamptz, cleanup_error text
);
create index wardrobe_visualization_files_cleanup on public.wardrobe_visualization_files(status,cleanup_after);
alter table public.wardrobe_visualization_files enable row level security;
revoke all on public.wardrobe_visualization_files from public,anon,authenticated;
grant select on public.wardrobe_visualization_files to authenticated;
grant all on public.wardrobe_visualization_files to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
  values('wardrobe-results','wardrobe-results',false,8000000,array['image/png']);
-- No Storage policies: bytes only through a fresh authenticated POST proxy.

create function wardrobe_private.b_case_current(p_case text,p_account uuid)
returns boolean language sql stable set search_path='' as $$
  select exists(select 1 from wardrobe_private.b_cases c
    join public.wardrobe_accounts a on a.id=c.account_id and a.status='active'
    join auth.users u on u.id=a.id and u.email_confirmed_at is not null
    join wardrobe_private.invites v on v.email=lower(u.email) and v.enabled
    join public.wardrobe_body_fit b on b.account_id=a.id and b.revision=c.body_revision and b.photo_id=c.input_photo_ids[1]
    join public.wardrobe_styling s on s.account_id=a.id and s.revision=c.styling_revision
    where c.id=p_case and c.account_id=p_account
    and exists(select 1 from jsonb_array_elements(s.data->'outfits') o where o->>'id'=c.outfit_id::text and o->'itemRevisions'=c.item_revisions)
    and (select count(*) from public.wardrobe_photos p where p.id=any(c.input_photo_ids) and p.account_id=a.id and p.status='active')=cardinality(c.input_photo_ids)
    and (select count(*) from public.wardrobe_items i,jsonb_each_text(c.item_revisions) r where i.id=r.key::uuid and i.account_id=a.id
      and i.status='active' and i.revision=r.value::bigint and i.photo_id=any(c.input_photo_ids[2:]))=(select count(*) from jsonb_object_keys(c.item_revisions)));
$$;
create function wardrobe_private.b_open(p_account uuid)
returns boolean language sql stable set search_path='' as $$
  select exists(select 1 from wardrobe_private.b_trial t,wardrobe_private.ai_control ctrl
    where t.id='p33b-v1' and not t.closed and not ctrl.blocked and ctrl.singleton and t.activated_at<=now() and t.ends_at>now()
    and exists(select 1 from wardrobe_private.b_cases c where c.account_id=p_account));
$$;
create function wardrobe_private.b_reservation()
returns bigint language sql stable set search_path='' as $$
  select case when not exists(select 1 from wardrobe_private.b_cases where sent_at is not null) then 1000
    else greatest(100,coalesce((select max(spent_cents)*2+20 from wardrobe_private.b_cases),100)) end;
$$;
create function public.wardrobe_result_readable(p_job uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.wardrobe_visualizations j where j.id=p_job and public.wardrobe_is_active(j.account_id)
    and j.status='succeeded' and not j.hidden and not j.cancel_requested and wardrobe_private.ai_inputs_current(j.id));
$$;
revoke all on function public.wardrobe_result_readable(uuid) from public,anon;
grant execute on function public.wardrobe_result_readable(uuid) to authenticated;
create policy wardrobe_result_read on public.wardrobe_visualization_files for select to authenticated
  using(status='active' and expires_at>now() and public.wardrobe_result_readable(job_id));

-- Provision once, while OFF. No client role can register identities, bytes or prompts.
create function public.wardrobe_b_provision(p_manifest jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare c jsonb; ids uuid[]; h jsonb; o jsonb; a uuid; expected jsonb:='{"model":"gpt-image-2.5-flare-2026-09-08","n":1,"quality":"medium","size":"1024x1536","output_format":"png","background":"opaque","moderation":"auto"}';
begin
  perform 1 from wardrobe_private.ai_control where singleton for update;
  if exists(select 1 from wardrobe_private.b_trial) then raise exception 'CONFLICT'; end if;
  if p_manifest->>'id' is distinct from 'p33b-v1' or jsonb_typeof(p_manifest->'cases') is distinct from 'array'
    or jsonb_array_length(p_manifest->'cases')<>6 or coalesce(p_manifest->>'manifestSha256','') !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_MANIFEST'; end if;
  insert into wardrobe_private.b_trial(id,manifest_sha256) values('p33b-v1',p_manifest->>'manifestSha256');
  for c in select value from jsonb_array_elements(p_manifest->'cases') loop
    a:=(c->>'accountId')::uuid; perform wardrobe_private.assert_account(a);
    -- These are temporary test identities; a normal OAuth identity cannot be enrolled accidentally.
    if not exists(select 1 from auth.users where id=a and lower(email) ~ '^p33b-[a-z0-9-]+@example[.]com$') then raise exception 'INVALID_MANIFEST'; end if;
    if c->'params' is distinct from expected or coalesce(c->>'promptSha256','') !~ '^[a-f0-9]{64}$'
      or jsonb_typeof(c->'inputHashes') is distinct from 'array' then raise exception 'INVALID_MANIFEST'; end if;
    select array_agg(value::uuid order by ord) into ids from jsonb_array_elements_text(c->'inputPhotoIds') with ordinality v(value,ord);
    if coalesce(cardinality(ids),0) not between 3 and 4 or cardinality(ids)<>(select count(distinct x) from unnest(ids) x)
      or jsonb_array_length(c->'inputHashes')<>cardinality(ids) then raise exception 'INVALID_MANIFEST'; end if;
    for h in select value from jsonb_array_elements(c->'inputHashes') loop
      if jsonb_typeof(h) is distinct from 'string' or h#>>'{}' !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_MANIFEST'; end if;
    end loop;
    select x into o from public.wardrobe_styling s,jsonb_array_elements(s.data->'outfits') x
      where s.account_id=a and x->>'id'=c->>'outfitId';
    if o is null or cardinality(ids)<>jsonb_array_length(o->'itemIds')+1 then raise exception 'INVALID_MANIFEST'; end if;
    if o->>'occasion' is distinct from (case when c->>'id' in('B01','B02') then 'casual' when c->>'id' in('B03','B04') then 'elegant' else 'wedding' end) then raise exception 'INVALID_MANIFEST'; end if;
    if c->>'id'='B05' and cardinality(ids)<>3 then raise exception 'INVALID_MANIFEST'; end if;
    insert into wardrobe_private.b_cases(id,trial_id,account_id,label,outfit_id,body_revision,styling_revision,input_photo_ids,input_hashes,item_revisions,prompt,prompt_sha256,params)
      values(c->>'id','p33b-v1',a,c->>'label',(c->>'outfitId')::uuid,(c->>'bodyRevision')::bigint,(c->>'stylingRevision')::bigint,
        ids,c->'inputHashes',o->'itemRevisions',c->>'prompt',c->>'promptSha256',c->'params');
    if not wardrobe_private.b_case_current(c->>'id',a) then raise exception 'INVALID_MANIFEST'; end if;
  end loop;
  if (select count(*) from (select account_id from wardrobe_private.b_cases group by account_id having count(*)=3) x)<>2 then raise exception 'INVALID_MANIFEST'; end if;
  if (select count(distinct account_id) from wardrobe_private.b_cases where id in('B01','B03','B05'))<>1 or
    (select count(distinct account_id) from wardrobe_private.b_cases where id in('B02','B04','B06'))<>1 then raise exception 'INVALID_MANIFEST'; end if;
  if not exists(select 1 from wardrobe_private.b_cases where id='B01' and cardinality(input_photo_ids)=4) then raise exception 'INVALID_MANIFEST'; end if;
  insert into wardrobe_private.ai_budgets(scope,limit_cents) values('trial:p33b-v1',1000);
exception when invalid_text_representation or check_violation or not_null_violation or unique_violation then raise exception 'INVALID_MANIFEST';
end; $$;

create function public.wardrobe_b_activate(p_manifest_sha256 text)
returns void language plpgsql security definer set search_path='' as $$
begin
  perform 1 from wardrobe_private.ai_control where singleton for update;
  update wardrobe_private.b_trial set activated_at=now(),ends_at=now()+interval '24 hours'
    where id='p33b-v1' and activated_at is null and not closed and manifest_sha256=p_manifest_sha256;
  if not found then raise exception 'CONFLICT'; end if;
  update wardrobe_private.ai_control set blocked=false where singleton;
end; $$;
create function public.wardrobe_b_close()
returns void language plpgsql security definer set search_path='' as $$
begin
  perform 1 from wardrobe_private.ai_control where singleton for update;
  update wardrobe_private.b_trial set closed=true;
  update wardrobe_private.ai_control set blocked=true where singleton;
end; $$;

-- This plan contains only registered synthetic bytes. Edge verifies hashes before reserve
-- and the worker repeats the verification just before the atomic send transition.
create function public.wardrobe_b_plan(p_account uuid,p_case text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare c wardrobe_private.b_cases;
begin
  perform wardrobe_private.assert_account(p_account);
  select * into c from wardrobe_private.b_cases where id=p_case and account_id=p_account;
  if not found then raise exception 'AI_DISABLED'; end if;
  if not wardrobe_private.b_open(p_account) then raise exception 'AI_UNAVAILABLE'; end if;
  if not wardrobe_private.b_case_current(p_case,p_account) then raise exception 'CONFLICT'; end if;
  return jsonb_build_object('caseId',c.id,'prompt',c.prompt,'promptSha256',c.prompt_sha256,'params',c.params,'inputHashes',c.input_hashes,
    'inputs',(select jsonb_agg(jsonb_build_object('path',p.main_path,'bytes',p.bytes) order by v.ord)
      from unnest(c.input_photo_ids) with ordinality v(id,ord) join public.wardrobe_photos p on p.id=v.id));
end; $$;

create function public.wardrobe_b_reserve(p_account uuid,p_id uuid,p_case text,p_hashes jsonb,p_prompt_hash text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare c wardrobe_private.b_cases; b wardrobe_private.ai_budgets; r bigint; mon text;
begin
  perform wardrobe_private.assert_account(p_account);
  select * into c from wardrobe_private.b_cases where id=p_case and account_id=p_account for update;
  if not found then raise exception 'AI_DISABLED'; end if;
  if c.job_id is not null then
    if c.job_id<>p_id then raise exception 'CASE_USED'; end if;
    if not exists(select 1 from public.wardrobe_visualizations where id=p_id and not hidden) then raise exception 'CASE_USED'; end if;
    return wardrobe_private.job_json(p_id);
  end if;
  if not wardrobe_private.b_open(p_account) then raise exception 'AI_UNAVAILABLE'; end if;
  if not wardrobe_private.b_case_current(p_case,p_account) then raise exception 'CONFLICT'; end if;
  if p_hashes is distinct from c.input_hashes or p_prompt_hash is distinct from c.prompt_sha256 then raise exception 'MANIFEST_MISMATCH'; end if;
  if exists(select 1 from public.wardrobe_visualizations where status in('reserved','sent','outcome_unknown')) then raise exception 'AI_BUSY'; end if;
  if p_case<>'B01' and not exists(select 1 from wardrobe_private.b_cases where id='B01' and spent_cents is not null) then raise exception 'CALIBRATION_REQUIRED'; end if;
  if (select count(*) from wardrobe_private.b_cases where sent_at is not null)>=6 or
    (select count(*) from public.wardrobe_visualizations where account_id=p_account and sent_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC')>=5 then raise exception 'AI_ATTEMPT_LIMIT'; end if;
  if coalesce((select sum(reserved_bytes) from public.wardrobe_visualizations where account_id=p_account),0)+
      coalesce((select sum(bytes+thumb_bytes) from public.wardrobe_visualization_files where account_id=p_account),0)+8100000>100000000 or
    coalesce((select sum(reserved_bytes) from public.wardrobe_visualizations where account_id=p_account),0)+
      coalesce((select sum(bytes+thumb_bytes) from public.wardrobe_visualization_files where account_id=p_account),0)+
      coalesce((select sum(bytes+thumb_bytes) from public.wardrobe_photos where account_id=p_account),0)+8100000>250000000 then raise exception 'STORAGE_LIMIT'; end if;
  r:=wardrobe_private.b_reservation(); mon:='month:'||to_char(now() at time zone 'UTC','YYYY-MM');
  insert into wardrobe_private.ai_budgets(scope,limit_cents) values(mon,2500) on conflict do nothing;
  for b in select * from wardrobe_private.ai_budgets where scope in('trial:p33b-v1',mon) order by scope for update loop
    if b.spent_cents+b.reserved_cents+r>b.limit_cents then raise exception 'AI_BUDGET_LIMIT'; end if;
  end loop;
  update wardrobe_private.ai_budgets set reserved_cents=reserved_cents+r where scope in('trial:p33b-v1',mon);
  update public.wardrobe_body_fit set ai_consent_version='p33b-synthetic-v1',ai_consent_at=now() where account_id=p_account;
  insert into public.wardrobe_visualizations(id,account_id,outfit_id,fingerprint,input_photo_ids,input_body_revision,input_styling_revision,input_item_revisions,
    status,trial_scope,month_scope,consent_version,reserved_cents,b_case_id)
    values(p_id,p_account,c.outfit_id,c.id,c.input_photo_ids,c.body_revision,c.styling_revision,c.item_revisions,
      'reserved','trial:p33b-v1',mon,'p33b-synthetic-v1',r,c.id);
  update wardrobe_private.b_cases set job_id=p_id where id=c.id;
  return wardrobe_private.job_json(p_id);
end; $$;

create function public.wardrobe_b_mark_sent(p_account uuid,p_id uuid,p_hashes jsonb,p_prompt_hash text)
returns boolean language plpgsql security definer set search_path='' as $$
declare j public.wardrobe_visualizations; c wardrobe_private.b_cases;
begin
  perform wardrobe_private.assert_account(p_account);
  select * into j from public.wardrobe_visualizations where id=p_id and account_id=p_account for update;
  select * into c from wardrobe_private.b_cases where job_id=p_id and account_id=p_account for update;
  if not found then raise exception 'AI_DISABLED'; end if;
  if j.status<>'reserved' or c.sent_at is not null then return false; end if;
  if not wardrobe_private.b_open(p_account) or not wardrobe_private.b_case_current(c.id,p_account) or not wardrobe_private.ai_inputs_current(p_id)
    or j.expires_at<=now() or j.month_scope<>'month:'||to_char(now() at time zone 'UTC','YYYY-MM') then
    perform wardrobe_private.cancel_job(p_id); return false; end if;
  if p_hashes is distinct from c.input_hashes or p_prompt_hash is distinct from c.prompt_sha256 then raise exception 'MANIFEST_MISMATCH'; end if;
  if (select count(*) from wardrobe_private.b_cases where sent_at is not null)>=6 then raise exception 'AI_ATTEMPT_LIMIT'; end if;
  update wardrobe_private.b_cases set sent_at=now() where id=c.id;
  update public.wardrobe_visualizations set status='sent',sent_at=now(),revision=revision+1 where id=p_id;
  return true;
end; $$;

create function public.wardrobe_b_abort_unsent(p_account uuid,p_job uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  perform 1 from wardrobe_private.ai_control where singleton for update;
  perform 1 from public.wardrobe_accounts where id=p_account for update;
  if exists(select 1 from public.wardrobe_visualizations where id=p_job and account_id=p_account and b_case_id is not null and status='reserved') then
    perform wardrobe_private.cancel_job(p_job);
    -- A manifest/key/pre-dispatch failure requires operator review, not another case.
    update wardrobe_private.ai_control set blocked=true where singleton;
  end if;
end; $$;

create function public.wardrobe_b_manifest(p_account uuid,p_job uuid,p_id uuid,p_bytes integer,p_thumb_bytes integer,p_sha256 text,p_thumb_sha256 text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare j public.wardrobe_visualizations; f public.wardrobe_visualization_files;
begin
  perform wardrobe_private.assert_account(p_account);
  select * into j from public.wardrobe_visualizations where id=p_job and account_id=p_account for update;
  if not found or j.b_case_id is null or j.status<>'sent' or j.cancel_requested or j.hidden or not wardrobe_private.ai_inputs_current(p_job)
    or not wardrobe_private.b_open(p_account) then return null; end if;
  if p_bytes not between 1 and 8000000 or p_thumb_bytes not between 1 and 100000 then raise exception 'INVALID_PHOTO'; end if;
  if exists(select 1 from public.wardrobe_visualization_files where job_id=p_job) then raise exception 'CONFLICT'; end if;
  insert into public.wardrobe_visualization_files(id,job_id,account_id,status,main_path,thumb_path,bytes,thumb_bytes,sha256,thumb_sha256)
    values(p_id,p_job,p_account,'staged',p_account||'/'||p_job||'/'||p_id||'/main.png',p_account||'/'||p_job||'/'||p_id||'/thumb.png',p_bytes,p_thumb_bytes,p_sha256,p_thumb_sha256)
    returning * into f;
  update public.wardrobe_visualizations set reserved_bytes=0 where id=p_job;
  return to_jsonb(f);
end; $$;

-- Known usage and publication commit together, after both uploads. There is no
-- externally visible 'succeeded' without a durable active output manifest.
create function public.wardrobe_b_complete(p_account uuid,p_job uuid,p_usage jsonb,p_publish boolean,p_measurements jsonb default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
declare j public.wardrobe_visualizations; f public.wardrobe_visualization_files; k text; micro bigint; cents bigint; publishable boolean;
begin
  perform 1 from wardrobe_private.ai_control where singleton for update;
  perform 1 from public.wardrobe_accounts where id=p_account for update;
  select * into j from public.wardrobe_visualizations where id=p_job and account_id=p_account and b_case_id is not null for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if j.status in('succeeded','failed') then
    if j.usage is distinct from p_usage then raise exception 'CONFLICT'; end if;
    return wardrobe_private.job_json(p_job);
  end if;
  if j.status not in('sent','outcome_unknown') then raise exception 'CONFLICT'; end if;
  if octet_length(p_measurements::text)>3000 then raise exception 'INVALID_USAGE'; end if;
  if p_usage is null then
    update public.wardrobe_visualizations set status='outcome_unknown',error_code='OUTCOME_UNKNOWN',measurements=p_measurements,revision=revision+1 where id=p_job;
    update wardrobe_private.ai_control set blocked=true where singleton;
    update public.wardrobe_visualization_files set status='deleting' where job_id=p_job;
    return wardrobe_private.job_json(p_job);
  end if;
  foreach k in array array['textInputTokens','imageInputTokens','imageOutputTokens'] loop
    if jsonb_typeof(p_usage->k) is distinct from 'number' or (p_usage->>k)::numeric<0 or (p_usage->>k)::numeric>100000000 or
      (p_usage->>k)::numeric<>trunc((p_usage->>k)::numeric) then raise exception 'INVALID_USAGE'; end if;
  end loop;
  micro:=(p_usage->>'textInputTokens')::bigint*5+(p_usage->>'imageInputTokens')::bigint*8+(p_usage->>'imageOutputTokens')::bigint*30;
  cents:=ceil(micro::numeric*6765/10000000)::bigint;
  select * into f from public.wardrobe_visualization_files where job_id=p_job for update;
  publishable:=p_publish and f.id is not null and f.status='staged' and f.expires_at>now() and
    j.status='sent' and not j.hidden and not j.cancel_requested and wardrobe_private.ai_inputs_current(p_job) and wardrobe_private.b_open(p_account) and
    (select count(*) from storage.objects where bucket_id='wardrobe-results' and name in(f.main_path,f.thumb_path))=2;
  update wardrobe_private.ai_budgets set reserved_cents=reserved_cents-j.reserved_cents,spent_cents=spent_cents+cents where scope in(j.trial_scope,j.month_scope);
  update wardrobe_private.b_cases set usage=p_usage,cost_micro_usd=micro,spent_cents=cents where id=j.b_case_id;
  if cents>j.reserved_cents then update wardrobe_private.ai_control set blocked=true where singleton; end if;
  update public.wardrobe_visualization_files set status=case when publishable then 'active' else 'deleting' end where job_id=p_job;
  update public.wardrobe_visualizations set status=case when publishable then 'succeeded' else 'failed' end,
    error_code=case when publishable then null when not wardrobe_private.ai_inputs_current(p_job) then 'CANCELLED'
      when not wardrobe_private.b_open(p_account) then 'AI_UNAVAILABLE' else 'GENERATION_FAILED' end,
    reserved_cents=0,reserved_bytes=0,spent_cents=cents,cost_micro_usd=micro,usage=p_usage,measurements=p_measurements,
    expires_at=case when publishable then f.expires_at else j.expires_at end,
    completed_at=now(),revision=revision+1 where id=p_job;
  return wardrobe_private.job_json(p_job);
end; $$;

-- Cancellation hides bytes immediately, but preserves the upload lease so a
-- late write cannot recreate an object after cleanup has forgotten its path.
create function wardrobe_private.invalidate_result_files()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.hidden or new.cancel_requested or new.status in('failed','outcome_unknown','cancelled','expired') then
    update public.wardrobe_visualization_files set status='deleting' where job_id=new.id;
  end if;
  return new;
end; $$;
create trigger wardrobe_result_invalidation after update on public.wardrobe_visualizations for each row execute function wardrobe_private.invalidate_result_files();

create or replace function wardrobe_private.enforce_storage_quota()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform 1 from wardrobe_private.ai_control where singleton for update;
  perform 1 from public.wardrobe_accounts where id=new.account_id for update;
  if coalesce((select sum(bytes+thumb_bytes) from public.wardrobe_photos where account_id=new.account_id),0)
    +coalesce((select sum(reserved_bytes) from public.wardrobe_visualizations where account_id=new.account_id),0)
    +coalesce((select sum(bytes+thumb_bytes) from public.wardrobe_visualization_files where account_id=new.account_id),0)
    +new.bytes+new.thumb_bytes>250000000 then raise exception 'STORAGE_LIMIT'; end if;
  return new;
end; $$;

alter function public.wardrobe_expire_uploads() rename to wardrobe_expire_uploads_p33a;
revoke all on function public.wardrobe_expire_uploads_p33a() from public,anon,authenticated,service_role;
create function public.wardrobe_expire_uploads()
returns void language plpgsql security definer set search_path='' as $$
declare j public.wardrobe_visualizations;
begin
  perform 1 from wardrobe_private.ai_control where singleton for update;
  -- Hide invalid/expired output immediately; keep the actual paths until Storage confirms deletion.
  update public.wardrobe_visualization_files f set status='deleting' where status<>'deleting' and
    (expires_at<=now() or (status='staged' and cleanup_after<=now()) or not wardrobe_private.ai_inputs_current(job_id));
  perform public.wardrobe_expire_uploads_p31();
  for j in select * from public.wardrobe_visualizations where status='reserved' and expires_at<=now() for update loop
    perform wardrobe_private.cancel_job(j.id);
    update public.wardrobe_visualizations set status='expired' where id=j.id;
  end loop;
  if exists(select 1 from public.wardrobe_visualizations where status='sent' and sent_at<now()-interval '5 minutes') then
    update public.wardrobe_visualizations set status='outcome_unknown',error_code='OUTCOME_UNKNOWN',revision=revision+1
      where status='sent' and sent_at<now()-interval '5 minutes';
    update wardrobe_private.ai_control set blocked=true where singleton;
  end if;
  delete from public.wardrobe_visualizations old_job where completed_at<now()-interval '90 days' and reserved_cents=0 and reserved_bytes=0
    and not exists(select 1 from public.wardrobe_visualization_files f where f.job_id=old_job.id);
end; $$;
create function public.wardrobe_finish_result_delete(p_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare f public.wardrobe_visualization_files;
begin
  select * into f from public.wardrobe_visualization_files where id=p_id and status='deleting' for update;
  if not found then return; end if;
  if f.cleanup_after>now() or exists(select 1 from storage.objects where bucket_id='wardrobe-results' and name in(f.main_path,f.thumb_path)) then raise exception 'DELETE_INCOMPLETE'; end if;
  delete from public.wardrobe_visualization_files where id=p_id;
end; $$;

alter function public.wardrobe_prepare_auth_delete(uuid) rename to wardrobe_prepare_auth_delete_p33a;
revoke all on function public.wardrobe_prepare_auth_delete_p33a(uuid) from public,anon,authenticated,service_role;
create function public.wardrobe_prepare_auth_delete(p_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
begin
  perform 1 from wardrobe_private.ai_control where singleton for update;
  perform 1 from public.wardrobe_accounts where id=p_id and status='deleting' for update;
  if not found then return false; end if;
  update public.wardrobe_visualization_files set status='deleting' where account_id=p_id;
  if exists(select 1 from public.wardrobe_visualization_files where account_id=p_id) or exists(select 1 from public.wardrobe_visualizations
    where account_id=p_id and status='sent' and sent_at>now()-interval '5 minutes') then return false; end if;
  if not public.wardrobe_prepare_auth_delete_p33a(p_id) then return false; end if;
  update wardrobe_private.b_cases set account_id=null,outfit_id=null,body_revision=null,styling_revision=null,
    input_photo_ids=null,input_hashes=null,item_revisions=null,prompt=null,prompt_sha256=null,params=null where account_id=p_id;
  return true;
end; $$;

create or replace function wardrobe_private.job_json(p_id uuid)
returns jsonb language sql stable set search_path='' as $$
  select jsonb_build_object('id',j.id,'revision',j.revision,'outfitId',j.outfit_id,'status',j.status,'createdAt',j.created_at,
    'completedAt',j.completed_at,'expiresAt',j.expires_at,'errorCode',j.error_code,'reservedPln',j.reserved_cents/100.0,'spentPln',j.spent_cents/100.0,
    'review',j.review,'result',case when j.status='succeeded' and not j.hidden and not j.cancel_requested and wardrobe_private.ai_inputs_current(j.id) then
      (select jsonb_build_object('mainPath',f.main_path,'thumbPath',f.thumb_path,'bytes',f.bytes,'thumbBytes',f.thumb_bytes,
        'mimeType','image/png','thumbMimeType','image/png','expiresAt',f.expires_at) from public.wardrobe_visualization_files f
        where f.job_id=j.id and f.status='active' and f.expires_at>now()) end) from public.wardrobe_visualizations j where j.id=p_id;
$$;
alter function wardrobe_private.visualization_json(uuid) rename to visualization_json_p33a;
create function wardrobe_private.visualization_json(p_account uuid)
returns jsonb language sql stable set search_path='' as $$
  select wardrobe_private.visualization_json_p33a(p_account)||jsonb_build_object('mode',case when wardrobe_private.b_open(p_account) then 'synthetic_trial' else 'off' end,
    'trial',(select jsonb_build_object('id',t.id,'endsAt',t.ends_at,'budgetPln',10,'spentPln',b.spent_cents/100.0,'reservedPln',b.reserved_cents/100.0,
      'maxSends',6,'sentCount',(select count(*) from wardrobe_private.b_cases where sent_at is not null),'blocked',not wardrobe_private.b_open(p_account),
      'cases',(select jsonb_agg(jsonb_build_object('id',c.id,'label',c.label,'personPath',coalesce((select main_path from public.wardrobe_photos where id=c.input_photo_ids[1]),''),
        'itemPaths',coalesce((select jsonb_agg(p.main_path order by v.ord) from unnest(c.input_photo_ids[2:]) with ordinality v(id,ord) join public.wardrobe_photos p on p.id=v.id),'[]'::jsonb),
        'reservePln',wardrobe_private.b_reservation()/100.0,'model','gpt-image-2.5-flare-2026-09-08','promptVersion','p33b-v1','jobId',c.job_id,'sent',c.sent_at is not null) order by c.id)
        from wardrobe_private.b_cases c where c.account_id=p_account))
      from wardrobe_private.b_trial t join wardrobe_private.ai_budgets b on b.scope='trial:p33b-v1'
      where exists(select 1 from wardrobe_private.b_cases where account_id=p_account)));
$$;

alter function public.wardrobe_execute(text,jsonb) rename to wardrobe_execute_p33a;
revoke all on function public.wardrobe_execute_p33a(text,jsonb) from public,anon,authenticated,service_role;
create function public.wardrobe_execute(p_action text,p_payload jsonb default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); j public.wardrobe_visualizations; v jsonb; k text;
begin
  if p_action<>'reviewVisualization' then return public.wardrobe_execute_p33a(p_action,p_payload); end if;
  if uid is null then raise exception 'UNAUTHENTICATED'; end if;
  perform wardrobe_private.assert_account(uid);
  select * into j from public.wardrobe_visualizations where id=(p_payload->>'jobId')::uuid and account_id=uid and not hidden for update;
  if not found or j.status<>'succeeded' then raise exception 'NOT_FOUND'; end if;
  if j.revision is distinct from (p_payload->>'expectedRevision')::bigint then raise exception 'CONFLICT'; end if;
  v:=jsonb_build_object('scores',p_payload->'scores','criticalError',p_payload->'criticalError','note',p_payload->'note');
  if jsonb_typeof(v->'scores') is distinct from 'object' or (v->'scores')-array['person','garments','completeness','artifacts','usefulness']<>'{}'
    or jsonb_typeof(v->'criticalError') is distinct from 'boolean' or jsonb_typeof(v->'note') is distinct from 'string' or length(v->>'note')>1000 then raise exception 'INVALID_REVIEW'; end if;
  foreach k in array array['person','garments','completeness','artifacts','usefulness'] loop
    if jsonb_typeof(v->'scores'->k) is distinct from 'number' or coalesce(v->'scores'->>k,'') not in('0','1','2') then raise exception 'INVALID_REVIEW'; end if;
  end loop;
  update public.wardrobe_visualizations set review=v,revision=revision+1 where id=j.id;
  return wardrobe_private.job_json(j.id);
end; $$;

revoke all on all functions in schema wardrobe_private from public,anon,authenticated,service_role;
revoke all on function public.wardrobe_execute(text,jsonb) from public,anon;
grant execute on function public.wardrobe_execute(text,jsonb) to authenticated;
revoke all on function public.wardrobe_b_provision(jsonb),public.wardrobe_b_activate(text),public.wardrobe_b_close(),
  public.wardrobe_b_plan(uuid,text),public.wardrobe_b_reserve(uuid,uuid,text,jsonb,text),public.wardrobe_b_mark_sent(uuid,uuid,jsonb,text),
  public.wardrobe_b_abort_unsent(uuid,uuid),
  public.wardrobe_b_manifest(uuid,uuid,uuid,integer,integer,text,text),public.wardrobe_b_complete(uuid,uuid,jsonb,boolean,jsonb),
  public.wardrobe_expire_uploads(),public.wardrobe_prepare_auth_delete(uuid),public.wardrobe_finish_result_delete(uuid) from public,anon,authenticated;
grant execute on function public.wardrobe_b_provision(jsonb),public.wardrobe_b_activate(text),public.wardrobe_b_close(),
  public.wardrobe_b_plan(uuid,text),public.wardrobe_b_reserve(uuid,uuid,text,jsonb,text),public.wardrobe_b_mark_sent(uuid,uuid,jsonb,text),
  public.wardrobe_b_abort_unsent(uuid,uuid),
  public.wardrobe_b_manifest(uuid,uuid,uuid,integer,integer,text,text),public.wardrobe_b_complete(uuid,uuid,jsonb,boolean,jsonb),
  public.wardrobe_expire_uploads(),public.wardrobe_prepare_auth_delete(uuid),public.wardrobe_finish_result_delete(uuid) to service_role;
