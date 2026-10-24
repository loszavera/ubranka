-- Additive P3.3A. There is deliberately no live provider or configurable AI switch.
create table public.wardrobe_body_fit (
  account_id uuid primary key references public.wardrobe_accounts(id) on delete cascade,
  revision bigint not null default 0,
  data jsonb not null default '{"heightCm":null,"chestCm":null,"waistCm":null,"hipsCm":null,"sizeSystem":"EU","topSize":"","bottomSize":"","shoeSize":""}',
  photo_id uuid,
  storage_consent_version text,
  storage_consent_at timestamptz,
  ai_consent_version text,
  ai_consent_at timestamptz,
  updated_at timestamptz not null default now()
);
create table public.wardrobe_styling (
  account_id uuid primary key references public.wardrobe_accounts(id) on delete cascade,
  revision bigint not null default 0,
  data jsonb not null default '{"outfits":[],"feedback":[]}',
  updated_at timestamptz not null default now()
);
alter table public.wardrobe_photos add column kind text not null default 'item' check(kind in('item','body'));
alter table public.wardrobe_photos alter column item_id drop not null;
alter table public.wardrobe_photos add constraint wardrobe_photo_kind_owner check
  ((kind='item' and item_id is not null) or (kind='body' and item_id is null));
create unique index wardrobe_body_one_active on public.wardrobe_photos(account_id) where kind='body' and status='active';

-- Monetary rows never contain profiles/photos/account identifiers. One row is
-- the mutex for mutations, BEFORE account/photo/job locks. Cleanup crosses
-- accounts, so an account-first/global-second order could deadlock its triggers.
create table wardrobe_private.ai_control (
  singleton boolean primary key default true check(singleton),
  blocked boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  trial_id text not null default 'not-authorized'
);
insert into wardrobe_private.ai_control(singleton) values(true);
create table wardrobe_private.ai_budgets (
  scope text primary key,
  limit_cents bigint not null check(limit_cents>=0),
  spent_cents bigint not null default 0 check(spent_cents>=0),
  reserved_cents bigint not null default 0 check(reserved_cents>=0)
);
create table public.wardrobe_visualizations (
  id uuid primary key,
  account_id uuid not null references public.wardrobe_accounts(id) on delete cascade,
  revision bigint not null default 1,
  outfit_id uuid not null,
  fingerprint text not null,
  input_photo_ids uuid[] not null,
  input_body_revision bigint not null,
  input_styling_revision bigint not null,
  input_item_revisions jsonb not null,
  status text not null check(status in('reserved','sent','succeeded','failed','outcome_unknown','cancelled','expired')),
  trial_scope text not null,
  month_scope text not null,
  model text not null default 'gpt-image-2.5-flare-2026-09-08',
  consent_version text not null,
  reserved_cents bigint not null check(reserved_cents>=0),
  spent_cents bigint check(spent_cents>=0),
  cost_micro_usd bigint check(cost_micro_usd>=0),
  reserved_bytes bigint not null default 8100000 check(reserved_bytes between 0 and 8100000),
  usage jsonb,
  error_code text,
  cancel_requested boolean not null default false,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now()+interval '15 minutes',
  sent_at timestamptz,
  completed_at timestamptz
);
create index wardrobe_visualizations_account on public.wardrobe_visualizations(account_id,created_at);
create index wardrobe_visualizations_state on public.wardrobe_visualizations(status,expires_at);
alter table public.wardrobe_body_fit enable row level security;
alter table public.wardrobe_styling enable row level security;
alter table public.wardrobe_visualizations enable row level security;
revoke all on public.wardrobe_body_fit,public.wardrobe_styling,public.wardrobe_visualizations from public,anon,authenticated;
grant select on public.wardrobe_body_fit,public.wardrobe_styling,public.wardrobe_visualizations to authenticated;
grant all on public.wardrobe_body_fit,public.wardrobe_styling,public.wardrobe_visualizations to service_role;
create policy wardrobe_body_read on public.wardrobe_body_fit for select to authenticated using(public.wardrobe_is_active(account_id));
create policy wardrobe_styling_read on public.wardrobe_styling for select to authenticated using(public.wardrobe_is_active(account_id));
create policy wardrobe_visualization_read on public.wardrobe_visualizations for select to authenticated using(public.wardrobe_is_active(account_id) and not hidden);
drop policy wardrobe_photo_read on public.wardrobe_photos;
create policy wardrobe_photo_read on public.wardrobe_photos for select to authenticated using(
  public.wardrobe_is_active(account_id) and status='active' and (
    (kind='item' and exists(select 1 from public.wardrobe_items i where i.id=item_id and i.status='active' and i.photo_id=wardrobe_photos.id)) or
    (kind='body' and exists(select 1 from public.wardrobe_body_fit b where b.account_id=wardrobe_photos.account_id and b.photo_id=wardrobe_photos.id))
  )
);

create function wardrobe_private.assert_account(p_account uuid)
returns void language plpgsql set search_path='' as $$
begin
  perform 1 from wardrobe_private.ai_control where singleton for update;
  perform 1 from public.wardrobe_accounts a where a.id=p_account and a.status='active' for update;
  if not found or not exists(select 1 from auth.users u join wardrobe_private.invites v on v.email=lower(u.email) and v.enabled
    where u.id=p_account and u.email_confirmed_at is not null) then raise exception 'ACCOUNT_UNAVAILABLE'; end if;
end; $$;
create function wardrobe_private.assert_body(v jsonb)
returns void language plpgsql set search_path='' as $$
declare k text; n numeric;
begin
  if jsonb_typeof(v) is distinct from 'object' or octet_length(v::text)>2000 or
    (v-array['heightCm','chestCm','waistCm','hipsCm','sizeSystem','topSize','bottomSize','shoeSize'])<>'{}'::jsonb or
    not(v ?& array['heightCm','chestCm','waistCm','hipsCm','sizeSystem','topSize','bottomSize','shoeSize']) or
    coalesce(v->>'sizeSystem','') not in('EU','UK','US','other') then raise exception 'INVALID_BODY'; end if;
  foreach k in array array['heightCm','chestCm','waistCm','hipsCm'] loop
    if jsonb_typeof(v->k)='null' then continue; end if;
    if jsonb_typeof(v->k) is distinct from 'number' then raise exception 'INVALID_BODY'; end if;
    n:=(v->>k)::numeric;
    if n<=0 or n>300 then raise exception 'INVALID_BODY'; end if;
  end loop;
  foreach k in array array['topSize','bottomSize','shoeSize'] loop
    if jsonb_typeof(v->k) is distinct from 'string' or length(v->>k)>40 then raise exception 'INVALID_BODY'; end if;
  end loop;
end; $$;
create function wardrobe_private.photo_json(p_id uuid)
returns jsonb language sql stable set search_path='' as $$
  select jsonb_build_object('id',id,'mainPath',main_path,'thumbPath',thumb_path,'mimeType',mime_type,'bytes',bytes,'thumbBytes',thumb_bytes)
  from public.wardrobe_photos where id=p_id and status='active';
$$;
create function wardrobe_private.body_json(p_account uuid)
returns jsonb language sql stable set search_path='' as $$
  select jsonb_build_object('revision',coalesce(b.revision,0),'data',coalesce(b.data,
    '{"heightCm":null,"chestCm":null,"waistCm":null,"hipsCm":null,"sizeSystem":"EU","topSize":"","bottomSize":"","shoeSize":""}'::jsonb),
    'photo',wardrobe_private.photo_json(b.photo_id),'photoDeletion',case when exists(select 1 from public.wardrobe_photos
      where account_id=p_account and kind='body' and status='deleting') then 'pending' end)
    from (select p_account id) x left join public.wardrobe_body_fit b on b.account_id=x.id;
$$;
create function wardrobe_private.job_json(p_id uuid)
returns jsonb language sql stable set search_path='' as $$
  select jsonb_build_object('id',id,'revision',revision,'outfitId',outfit_id,'status',status,'createdAt',created_at,
    'completedAt',completed_at,'expiresAt',expires_at,'errorCode',error_code,'reservedPln',reserved_cents/100.0,
    'spentPln',spent_cents/100.0,'result',null) from public.wardrobe_visualizations where id=p_id;
$$;
create function wardrobe_private.visualization_json(p_account uuid)
returns jsonb language sql stable set search_path='' as $$
  select jsonb_build_object('mode','off','consent',jsonb_build_object('accepted',false,'version','p33-ai-v1'),
    'jobs',coalesce((select jsonb_agg(wardrobe_private.job_json(id) order by created_at desc) from public.wardrobe_visualizations
      where account_id=p_account and not hidden),'[]'::jsonb),
    'limits',jsonb_build_object('results',30,'attempts',40,'dailyAttempts',5,
      'usedResults',(select count(*) from public.wardrobe_visualizations where account_id=p_account and status='succeeded' and sent_at>=date_trunc('month',now() at time zone 'UTC') at time zone 'UTC'),
      'usedAttempts',(select count(*) from public.wardrobe_visualizations where account_id=p_account and sent_at>=date_trunc('month',now() at time zone 'UTC') at time zone 'UTC'),
      'usedDailyAttempts',(select count(*) from public.wardrobe_visualizations where account_id=p_account and sent_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC'),
      'reservedPln',coalesce((select sum(reserved_cents)/100.0 from public.wardrobe_visualizations where account_id=p_account),0),
      'spentPln',coalesce((select sum(spent_cents)/100.0 from public.wardrobe_visualizations where account_id=p_account),0),
      'budgetPln',0,'trialEndsAt',null,
      'monthResetsAt',(date_trunc('month',now() at time zone 'UTC')+interval '1 month') at time zone 'UTC',
      'dayResetsAt',(date_trunc('day',now() at time zone 'UTC')+interval '1 day') at time zone 'UTC'));
$$;
create or replace function wardrobe_private.snapshot(p_id uuid)
returns jsonb language sql stable set search_path='' as $$
  select jsonb_build_object('accountId',a.id,'state',jsonb_build_object('revision',a.revision,'data',a.state),
    'items',coalesce((select jsonb_agg(wardrobe_private.item_json(i.id) order by i.created_at desc)
      from public.wardrobe_items i where i.account_id=a.id),'[]'::jsonb),
    'bodyFit',wardrobe_private.body_json(a.id),
    'styling',coalesce((select jsonb_build_object('revision',s.revision,'data',s.data) from public.wardrobe_styling s where s.account_id=a.id),
      '{"revision":0,"data":{"outfits":[],"feedback":[]}}'::jsonb),
    'visualization',wardrobe_private.visualization_json(a.id)) from public.wardrobe_accounts a where a.id=p_id;
$$;

-- A single shared storage quota includes body uploads, old variants and AI holds.
create function wardrobe_private.enforce_storage_quota()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform 1 from wardrobe_private.ai_control where singleton for update;
  perform 1 from public.wardrobe_accounts where id=new.account_id for update;
  if coalesce((select sum(bytes+thumb_bytes) from public.wardrobe_photos where account_id=new.account_id),0)
     +coalesce((select sum(reserved_bytes) from public.wardrobe_visualizations where account_id=new.account_id),0)
     +new.bytes+new.thumb_bytes>250000000 then raise exception 'STORAGE_LIMIT'; end if;
  return new;
end; $$;
create trigger wardrobe_shared_storage_quota before insert on public.wardrobe_photos for each row execute function wardrobe_private.enforce_storage_quota();

create function public.wardrobe_reserve_body_photo(p_account uuid,p_id uuid,p_revision bigint,p_bytes integer,p_thumb_bytes integer,p_fingerprint text,p_consent text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare b public.wardrobe_body_fit; p public.wardrobe_photos;
begin
  perform wardrobe_private.assert_account(p_account);
  if p_consent is distinct from 'p33a-body-v1' then raise exception 'STORAGE_CONSENT_REQUIRED'; end if;
  insert into public.wardrobe_body_fit(account_id) values(p_account) on conflict do nothing;
  select * into b from public.wardrobe_body_fit where account_id=p_account;
  select * into p from public.wardrobe_photos where id=p_id;
  if found then
    if p.account_id<>p_account or p.kind<>'body' or p.fingerprint<>p_fingerprint or p.status='deleting' then raise exception 'CONFLICT'; end if;
    if p.status='staged' then
      if b.revision is distinct from p_revision then raise exception 'CONFLICT'; end if;
      update public.wardrobe_photos set expected_revision=p_revision,cleanup_after=now()+interval '5 minutes' where id=p.id returning * into p;
    end if;
    return to_jsonb(p);
  end if;
  if b.revision is distinct from p_revision then raise exception 'CONFLICT'; end if;
  if coalesce((select sum(bytes+thumb_bytes) from public.wardrobe_photos where account_id=p_account),0)
    +coalesce((select sum(reserved_bytes) from public.wardrobe_visualizations where account_id=p_account),0)
    +p_bytes+p_thumb_bytes>250000000 then raise exception 'STORAGE_LIMIT'; end if;
  if (select count(*) from public.wardrobe_photos where account_id=p_account)>=200 then raise exception 'UPLOAD_PENDING'; end if;
  update public.wardrobe_photos set status='deleting' where account_id=p_account and kind='body' and status='staged';
  insert into public.wardrobe_photos(id,account_id,item_id,kind,expected_revision,main_path,thumb_path,bytes,thumb_bytes,mime_type,fingerprint)
    values(p_id,p_account,null,'body',p_revision,p_account||'/'||p_account||'/'||p_id||'/main.jpg',
      p_account||'/'||p_account||'/'||p_id||'/thumb.jpg',p_bytes,p_thumb_bytes,'image/jpeg',p_fingerprint) returning * into p;
  update public.wardrobe_body_fit set storage_consent_version=p_consent,storage_consent_at=now() where account_id=p_account;
  return to_jsonb(p);
end; $$;
create function public.wardrobe_commit_body_photo(p_account uuid,p_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare b public.wardrobe_body_fit; p public.wardrobe_photos;
begin
  perform wardrobe_private.assert_account(p_account);
  select * into b from public.wardrobe_body_fit where account_id=p_account;
  select * into p from public.wardrobe_photos where id=p_id and account_id=p_account and kind='body';
  if not found or p.status='deleting' then raise exception 'NOT_FOUND'; end if;
  if p.status='active' and b.photo_id=p.id then return wardrobe_private.body_json(p_account); end if;
  if b.revision<>p.expected_revision then raise exception 'CONFLICT'; end if;
  if (select count(*) from storage.objects where bucket_id='wardrobe-private' and name in(p.main_path,p.thumb_path))<>2 then raise exception 'UPLOAD_INCOMPLETE'; end if;
  update public.wardrobe_photos set status='deleting' where id=b.photo_id;
  update public.wardrobe_photos set status='active' where id=p.id;
  update public.wardrobe_body_fit set photo_id=p.id,revision=revision+1,updated_at=now() where account_id=p_account;
  return wardrobe_private.body_json(p_account);
end; $$;

-- Keep the P3.1 implementation and wrap it, without rewriting applied history.
alter function public.wardrobe_reserve_photo(uuid,uuid,uuid,bigint,integer,integer,text) rename to wardrobe_reserve_photo_p31;
revoke all on function public.wardrobe_reserve_photo_p31(uuid,uuid,uuid,bigint,integer,integer,text) from public,anon,authenticated,service_role;
create function public.wardrobe_reserve_photo(p_account uuid,p_item uuid,p_id uuid,p_revision bigint,p_bytes integer,p_thumb_bytes integer,p_fingerprint text)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  perform 1 from wardrobe_private.ai_control where singleton for update;
  if exists(select 1 from public.wardrobe_photos where id=p_id and kind<>'item') then raise exception 'CONFLICT'; end if;
  return public.wardrobe_reserve_photo_p31(p_account,p_item,p_id,p_revision,p_bytes,p_thumb_bytes,p_fingerprint);
end; $$;

alter function public.wardrobe_commit_photo(uuid,uuid) rename to wardrobe_commit_photo_p31;
revoke all on function public.wardrobe_commit_photo_p31(uuid,uuid) from public,anon,authenticated,service_role;
create function public.wardrobe_commit_photo(p_account uuid,p_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  perform 1 from wardrobe_private.ai_control where singleton for update;
  return public.wardrobe_commit_photo_p31(p_account,p_id);
end; $$;

create function wardrobe_private.assert_styling(p_account uuid,v jsonb,previous jsonb)
returns void language plpgsql set search_path='' as $$
declare o jsonb; f jsonb; ids uuid[]; oid uuid; cats text[]; existing jsonb; seen text[]:='{}'; k text; it public.wardrobe_items;
begin
  if jsonb_typeof(v) is distinct from 'object' or octet_length(v::text)>500000 or
    v-array['outfits','feedback']<>'{}'::jsonb or jsonb_typeof(v->'outfits') is distinct from 'array' or
    jsonb_typeof(v->'feedback') is distinct from 'array' or jsonb_array_length(v->'outfits')>100 or jsonb_array_length(v->'feedback')>1000
    then raise exception 'INVALID_STYLING'; end if;
  for o in select value from jsonb_array_elements(v->'outfits') loop
    if jsonb_typeof(o) is distinct from 'object' or o-array['id','profileId','occasion','itemIds','itemRevisions','createdAt']<>'{}'::jsonb or
      not(o ?& array['id','profileId','occasion','itemIds','itemRevisions','createdAt']) or
      jsonb_typeof(o->'itemIds') is distinct from 'array' or jsonb_typeof(o->'itemRevisions') is distinct from 'object' or
      jsonb_typeof(o->'profileId') is distinct from 'string' or length(o->>'profileId') not between 1 and 100 or
      coalesce(o->>'occasion','') not in('casual','elegant','wedding','work','date','party') or
      jsonb_typeof(o->'createdAt') is distinct from 'string' or length(o->>'createdAt')>40 or
      (o->>'id')=any(seen) then raise exception 'INVALID_STYLING'; end if;
    oid:=(o->>'id')::uuid; perform (o->>'createdAt')::timestamptz;
    if oid is null then raise exception 'INVALID_STYLING'; end if;
    seen:=array_append(seen,o->>'id');
    select array_agg(value::uuid order by value) into ids from jsonb_array_elements_text(o->'itemIds');
    if coalesce(cardinality(ids),0) not between 2 and 3 or cardinality(ids)<>(select count(distinct x) from unnest(ids) x) or
      (select count(*) from jsonb_object_keys(o->'itemRevisions'))<>cardinality(ids) then raise exception 'INVALID_STYLING'; end if;
    foreach k in array (select array_agg(x::text) from unnest(ids) x) loop
      if jsonb_typeof(o->'itemRevisions'->k) is distinct from 'number' or
        (o->'itemRevisions'->>k)::numeric<1 or (o->'itemRevisions'->>k)::numeric<>trunc((o->'itemRevisions'->>k)::numeric)
        then raise exception 'INVALID_STYLING'; end if;
    end loop;
    select value into existing from jsonb_array_elements(previous->'outfits') where value->>'id'=o->>'id';
    -- An unchanged historical selection can retain references to removed things.
    -- New or modified selections must prove ownership/current revisions now.
    if existing is not null and existing=o then continue; end if;
    if not exists(select 1 from public.wardrobe_accounts a,jsonb_array_elements(a.state->'profiles') p
      where a.id=p_account and p->>'id'=o->>'profileId') then raise exception 'INVALID_STYLING'; end if;
    cats:='{}';
    for it in select * from public.wardrobe_items where id=any(ids) and account_id=p_account and status='active' loop
      if not(o->>'occasion'=any(it.occasions)) or it.revision<>(o->'itemRevisions'->>it.id::text)::bigint then raise exception 'CONFLICT'; end if;
      cats:=array_append(cats,it.category);
    end loop;
    if cardinality(cats)<>cardinality(ids) then raise exception 'NOT_FOUND'; end if;
    select array_agg(x order by x) into cats from unnest(cats) x;
    if cats<>array['bottom','shoes','top'] and cats<>array['dress','shoes'] and cats<>array['dress','layer','shoes'] then raise exception 'INVALID_STYLING'; end if;
  end loop;
  seen:='{}';
  for f in select value from jsonb_array_elements(v->'feedback') loop
    if jsonb_typeof(f) is distinct from 'object' or f-array['profileId','outfitId','itemIds','vote','reason']<>'{}'::jsonb or
      not(f ?& array['profileId','outfitId','itemIds','vote']) or jsonb_typeof(f->'itemIds') is distinct from 'array' or
      jsonb_typeof(f->'profileId') is distinct from 'string' or length(f->>'profileId') not between 1 and 100 or
      coalesce(f->>'vote','') not in('like','dislike') or
      (f ? 'reason' and (jsonb_typeof(f->'reason') is distinct from 'string' or length(f->>'reason')>500)) then raise exception 'INVALID_STYLING'; end if;
    oid:=(f->>'outfitId')::uuid;
    k:=(f->>'profileId')||':'||oid;
    if oid is null or k=any(seen) then raise exception 'INVALID_STYLING'; end if;
    seen:=array_append(seen,k);
    select array_agg(value::uuid) into ids from jsonb_array_elements_text(f->'itemIds');
    if coalesce(cardinality(ids),0) not between 2 and 3 or cardinality(ids)<>(select count(distinct x) from unnest(ids) x) then raise exception 'INVALID_STYLING'; end if;
    if exists(select 1 from jsonb_array_elements(previous->'feedback') old where old=f) then continue; end if;
    if not exists(select 1 from public.wardrobe_accounts a,jsonb_array_elements(a.state->'profiles') p
      where a.id=p_account and p->>'id'=f->>'profileId') then raise exception 'INVALID_STYLING'; end if;
    if (select count(*) from public.wardrobe_items where id=any(ids) and account_id=p_account and status='active')<>cardinality(ids) then raise exception 'NOT_FOUND'; end if;
  end loop;
exception when invalid_text_representation or invalid_datetime_format or datetime_field_overflow or numeric_value_out_of_range or invalid_parameter_value then
  raise exception 'INVALID_STYLING';
end; $$;

-- Intentionally hard-coded. Tests replace this function ONLY in their local,
-- disposable Postgres fixture. No env flag or HTTP payload can turn paid AI on.
create function wardrobe_private.ai_enabled()
returns boolean language sql immutable set search_path='' as $$select false$$;

create function wardrobe_private.ai_inputs_current(p_id uuid)
returns boolean language sql stable set search_path='' as $$
  select exists(select 1 from public.wardrobe_visualizations j
    join public.wardrobe_accounts a on a.id=j.account_id and a.status='active'
    join auth.users u on u.id=a.id and u.email_confirmed_at is not null
    join wardrobe_private.invites invite on invite.email=lower(u.email) and invite.enabled
    join public.wardrobe_body_fit b on b.account_id=a.id and b.revision=j.input_body_revision
      and b.ai_consent_version=j.consent_version and b.ai_consent_at is not null
    join public.wardrobe_styling s on s.account_id=a.id and s.revision=j.input_styling_revision
    where j.id=p_id and not j.cancel_requested
      and (select count(*) from public.wardrobe_photos p where p.id=any(j.input_photo_ids) and p.account_id=a.id and p.status='active')=cardinality(j.input_photo_ids)
      and (select count(*) from public.wardrobe_items i,jsonb_each_text(j.input_item_revisions) r
        where i.id=r.key::uuid and i.account_id=a.id and i.status='active' and i.revision=r.value::bigint)
        =(select count(*) from jsonb_object_keys(j.input_item_revisions)));
$$;

create function wardrobe_private.cancel_job(p_id uuid,p_hide boolean default false)
returns void language plpgsql set search_path='' as $$
declare j public.wardrobe_visualizations;
begin
  perform 1 from wardrobe_private.ai_control where singleton for update;
  select * into j from public.wardrobe_visualizations where id=p_id for update;
  if not found then return; end if;
  if j.status='reserved' then
    update wardrobe_private.ai_budgets set reserved_cents=reserved_cents-j.reserved_cents where scope in(j.trial_scope,j.month_scope);
    update public.wardrobe_visualizations set status='cancelled',reserved_cents=0,reserved_bytes=0,
      completed_at=now(),revision=revision+1,cancel_requested=true,hidden=hidden or p_hide where id=p_id;
  else
    update public.wardrobe_visualizations set cancel_requested=true,hidden=hidden or p_hide,revision=revision+1 where id=p_id;
  end if;
end; $$;
create function wardrobe_private.invalidate_photo_jobs()
returns trigger language plpgsql security definer set search_path='' as $$
declare jid uuid;
begin
  if new.status='deleting' and old.status<>'deleting' then
    for jid in select id from public.wardrobe_visualizations where account_id=old.account_id and old.id=any(input_photo_ids) and not hidden loop
      perform wardrobe_private.cancel_job(jid,true);
    end loop;
  end if;
  return new;
end; $$;
create trigger wardrobe_photo_job_invalidation after update of status on public.wardrobe_photos for each row execute function wardrobe_private.invalidate_photo_jobs();

alter function public.wardrobe_execute(text,jsonb) rename to wardrobe_execute_p31;
revoke all on function public.wardrobe_execute_p31(text,jsonb) from public,anon,authenticated,service_role;
create function public.wardrobe_execute(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); b public.wardrobe_body_fit; s public.wardrobe_styling; j public.wardrobe_visualizations; jid uuid;
begin
  if uid is null then raise exception 'UNAUTHENTICATED'; end if;
  -- Direct RPC cannot bypass the A-only gate, even with forged consent/budgets.
  if p_action in('requestVisualization','setAiConsent') then raise exception 'AI_DISABLED'; end if;
  perform 1 from wardrobe_private.ai_control where singleton for update;
  if p_action in('bootstrap','saveState','createItem','updateItem','uploadPhoto','deleteItem','deletePhoto','deleteAccount','export') then
    return public.wardrobe_execute_p31(p_action,p_payload);
  end if;
  perform wardrobe_private.assert_account(uid);
  if p_action in('saveBodyFit','deleteBodyPhoto','deleteAiData') then
    insert into public.wardrobe_body_fit(account_id) values(uid) on conflict do nothing;
    select * into b from public.wardrobe_body_fit where account_id=uid;
    if b.revision is distinct from (p_payload->>'expectedRevision')::bigint then raise exception 'CONFLICT'; end if;
    if p_action='saveBodyFit' then
      perform wardrobe_private.assert_body(p_payload->'data');
      update public.wardrobe_body_fit set data=p_payload->'data',revision=revision+1,updated_at=now() where account_id=uid;
      return wardrobe_private.body_json(uid);
    end if;
    update public.wardrobe_photos set status='deleting' where account_id=uid and kind='body';
    update public.wardrobe_body_fit set photo_id=null,revision=revision+1,updated_at=now(),
      ai_consent_version=null,ai_consent_at=null where account_id=uid;
    if p_action='deleteAiData' then
      for jid in select id from public.wardrobe_visualizations where account_id=uid loop perform wardrobe_private.cancel_job(jid,true); end loop;
    end if;
    return jsonb_build_object('status',case when exists(select 1 from public.wardrobe_photos where account_id=uid and kind='body') then 'pending' else 'deleted' end);
  elsif p_action='saveStyling' then
    insert into public.wardrobe_styling(account_id) values(uid) on conflict do nothing;
    select * into s from public.wardrobe_styling where account_id=uid;
    if s.revision is distinct from (p_payload->>'expectedRevision')::bigint then raise exception 'CONFLICT'; end if;
    perform wardrobe_private.assert_styling(uid,p_payload->'data',s.data);
    update public.wardrobe_styling set data=p_payload->'data',revision=revision+1,updated_at=now() where account_id=uid returning * into s;
    return jsonb_build_object('revision',s.revision,'data',s.data);
  elsif p_action in('getVisualization','cancelVisualization','deleteVisualization') then
    perform 1 from wardrobe_private.ai_control where singleton for update;
    select * into j from public.wardrobe_visualizations where id=(p_payload->>'jobId')::uuid and account_id=uid and not hidden for update;
    if not found then raise exception 'NOT_FOUND'; end if;
    if p_action='getVisualization' then return wardrobe_private.job_json(j.id); end if;
    if j.revision is distinct from (p_payload->>'expectedRevision')::bigint then raise exception 'CONFLICT'; end if;
    perform wardrobe_private.cancel_job(j.id,p_action='deleteVisualization');
    if p_action='deleteVisualization' then return '{"status":"deleted"}'::jsonb; end if;
    return wardrobe_private.job_json(j.id);
  end if;
  raise exception 'INVALID_ACTION';
end; $$;

-- Service-only financial state machine. Live admission is hard OFF above and
-- below. Its executable tests substitute ai_enabled() only inside disposable DB.
create function public.wardrobe_ai_reserve(p_account uuid,p_id uuid,p_outfit uuid,p_body_revision bigint,p_styling_revision bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare c wardrobe_private.ai_control; b public.wardrobe_body_fit; s public.wardrobe_styling; j public.wardrobe_visualizations;
  o jsonb; signature text; photos uuid[]; ids uuid[]; trial text; mon text; budget wardrobe_private.ai_budgets;
begin
  if not wardrobe_private.ai_enabled() then raise exception 'AI_DISABLED'; end if;
  perform wardrobe_private.assert_account(p_account);
  select * into c from wardrobe_private.ai_control where singleton for update;
  signature:=jsonb_build_array(p_outfit,p_body_revision,p_styling_revision)::text;
  select * into j from public.wardrobe_visualizations where id=p_id;
  if found then
    if j.account_id<>p_account or j.fingerprint<>signature then raise exception 'CONFLICT'; end if;
    return wardrobe_private.job_json(p_id);
  end if;
  if c.blocked or c.starts_at is null or c.ends_at is null or now()<c.starts_at or now()>=c.ends_at then raise exception 'AI_UNAVAILABLE'; end if;
  if exists(select 1 from public.wardrobe_visualizations where status in('reserved','sent','outcome_unknown')) then raise exception 'AI_BUSY'; end if;
  select * into b from public.wardrobe_body_fit where account_id=p_account;
  select * into s from public.wardrobe_styling where account_id=p_account;
  if b.revision is distinct from p_body_revision or s.revision is distinct from p_styling_revision then raise exception 'CONFLICT'; end if;
  if b.ai_consent_version is distinct from 'p33-ai-v1' or b.ai_consent_at is null then raise exception 'AI_CONSENT_REQUIRED'; end if;
  select value into o from jsonb_array_elements(s.data->'outfits') where value->>'id'=p_outfit::text;
  if o is null or b.photo_id is null then raise exception 'NOT_FOUND'; end if;
  select array_agg(value::uuid) into ids from jsonb_array_elements_text(o->'itemIds');
  select array_agg(i.photo_id order by i.id) into photos from public.wardrobe_items i where i.id=any(ids) and i.account_id=p_account
    and i.status='active' and i.revision=(o->'itemRevisions'->>i.id::text)::bigint and i.photo_id is not null;
  if coalesce(cardinality(photos),0)<>cardinality(ids) then raise exception 'CONFLICT'; end if;
  photos:=array_prepend(b.photo_id,photos);
  if (select count(*) from public.wardrobe_photos where id=any(photos) and account_id=p_account and status='active')<>cardinality(photos) then raise exception 'NOT_FOUND'; end if;
  if (select count(*) from public.wardrobe_visualizations where account_id=p_account and sent_at>=date_trunc('month',now() at time zone 'UTC') at time zone 'UTC')>=40 or
    (select count(*) from public.wardrobe_visualizations where account_id=p_account and sent_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC')>=5 or
    (select count(*) from public.wardrobe_visualizations where account_id=p_account and status='succeeded' and sent_at>=date_trunc('month',now() at time zone 'UTC') at time zone 'UTC')>=30 then raise exception 'AI_ATTEMPT_LIMIT'; end if;
  if coalesce((select sum(reserved_bytes) from public.wardrobe_visualizations where account_id=p_account),0)+8100000>100000000 or
    coalesce((select sum(reserved_bytes) from public.wardrobe_visualizations where account_id=p_account),0)+8100000+
      coalesce((select sum(bytes+thumb_bytes) from public.wardrobe_photos where account_id=p_account),0)>250000000 then raise exception 'STORAGE_LIMIT'; end if;
  trial:='trial:'||c.trial_id; mon:='month:'||to_char(now() at time zone 'UTC','YYYY-MM');
  insert into wardrobe_private.ai_budgets(scope,limit_cents) values(mon,2500) on conflict do nothing;
  if not exists(select 1 from wardrobe_private.ai_budgets where scope=trial) then raise exception 'AI_UNAVAILABLE'; end if;
  for budget in select * from wardrobe_private.ai_budgets where scope in(trial,mon) order by scope for update loop
    if budget.spent_cents+budget.reserved_cents+100>budget.limit_cents then raise exception 'AI_BUDGET_LIMIT'; end if;
  end loop;
  update wardrobe_private.ai_budgets set reserved_cents=reserved_cents+100 where scope in(trial,mon);
  insert into public.wardrobe_visualizations(id,account_id,outfit_id,fingerprint,input_photo_ids,input_body_revision,input_styling_revision,input_item_revisions,status,trial_scope,month_scope,consent_version,reserved_cents)
    values(p_id,p_account,p_outfit,signature,photos,p_body_revision,p_styling_revision,o->'itemRevisions','reserved',trial,mon,'p33-ai-v1',100);
  return wardrobe_private.job_json(p_id);
end; $$;

create function public.wardrobe_ai_mark_sent(p_account uuid,p_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare j public.wardrobe_visualizations; c wardrobe_private.ai_control;
begin
  if not wardrobe_private.ai_enabled() then raise exception 'AI_DISABLED'; end if;
  perform wardrobe_private.assert_account(p_account);
  select * into c from wardrobe_private.ai_control where singleton for update;
  select * into j from public.wardrobe_visualizations where id=p_id and account_id=p_account for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if j.status<>'reserved' then return false; end if;
  if c.blocked or now()>=c.ends_at or j.expires_at<=now() or not wardrobe_private.ai_inputs_current(p_id)
    then perform wardrobe_private.cancel_job(p_id); return false; end if;
  -- Month/day boundaries between admission and dispatch cannot evade counters.
  if j.month_scope<>'month:'||to_char(now() at time zone 'UTC','YYYY-MM') then
    perform wardrobe_private.cancel_job(p_id); return false;
  end if;
  update public.wardrobe_visualizations set status='sent',sent_at=now(),revision=revision+1 where id=p_id;
  return true;
end; $$;

create function public.wardrobe_ai_settle(p_account uuid,p_id uuid,p_outcome text,p_usage jsonb default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare j public.wardrobe_visualizations; k text; micro bigint; cents bigint; cancelled boolean;
begin
  if not wardrobe_private.ai_enabled() then raise exception 'AI_DISABLED'; end if;
  -- A deleting account can settle a known cost, never make its output visible.
  perform 1 from wardrobe_private.ai_control where singleton for update;
  perform 1 from public.wardrobe_accounts where id=p_account for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  perform 1 from wardrobe_private.ai_control where singleton for update;
  select * into j from public.wardrobe_visualizations where id=p_id and account_id=p_account for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if p_outcome not in('succeeded','failed','outcome_unknown') then raise exception 'INVALID_ACTION'; end if;
  if j.status in('succeeded','failed') then
    if j.usage is distinct from p_usage then raise exception 'CONFLICT'; end if;
    return wardrobe_private.job_json(p_id);
  end if;
  if j.status<>'sent' then raise exception 'CONFLICT'; end if;
  if p_outcome='outcome_unknown' or p_usage is null then
    update public.wardrobe_visualizations set status='outcome_unknown',error_code='OUTCOME_UNKNOWN',revision=revision+1 where id=p_id;
    update wardrobe_private.ai_control set blocked=true where singleton;
    return wardrobe_private.job_json(p_id);
  end if;
  foreach k in array array['textInputTokens','imageInputTokens','imageOutputTokens'] loop
    if jsonb_typeof(p_usage->k) is distinct from 'number' or (p_usage->>k)::numeric<0 or (p_usage->>k)::numeric>100000000 or
      (p_usage->>k)::numeric<>trunc((p_usage->>k)::numeric) then raise exception 'INVALID_USAGE'; end if;
  end loop;
  micro:=(p_usage->>'textInputTokens')::bigint*5+(p_usage->>'imageInputTokens')::bigint*8+(p_usage->>'imageOutputTokens')::bigint*30;
  cents:=ceil(micro::numeric*6765/10000000)::bigint;
  cancelled:=not wardrobe_private.ai_inputs_current(p_id);
  update wardrobe_private.ai_budgets set reserved_cents=reserved_cents-j.reserved_cents,spent_cents=spent_cents+cents where scope in(j.trial_scope,j.month_scope);
  if cents>j.reserved_cents then update wardrobe_private.ai_control set blocked=true where singleton; end if;
  update public.wardrobe_visualizations set status=case when cancelled then 'failed' else p_outcome end,
    error_code=case when cancelled then 'CANCELLED' when p_outcome='failed' then 'GENERATION_FAILED' end,
    reserved_cents=0,reserved_bytes=0,cost_micro_usd=micro,spent_cents=cents,usage=p_usage,
    completed_at=now(),revision=revision+1 where id=p_id;
  return wardrobe_private.job_json(p_id);
end; $$;

alter function public.wardrobe_expire_uploads() rename to wardrobe_expire_uploads_p31;
revoke all on function public.wardrobe_expire_uploads_p31() from public,anon,authenticated,service_role;
create function public.wardrobe_expire_uploads()
returns void language plpgsql security definer set search_path='' as $$
declare j public.wardrobe_visualizations;
begin
  perform 1 from wardrobe_private.ai_control where singleton for update;
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
  delete from public.wardrobe_visualizations where completed_at<now()-interval '90 days' and reserved_cents=0 and reserved_bytes=0;
end; $$;

revoke all on all functions in schema wardrobe_private from public,anon,authenticated,service_role;
revoke all on function public.wardrobe_execute(text,jsonb) from public,anon;
grant execute on function public.wardrobe_execute(text,jsonb) to authenticated;
revoke all on function public.wardrobe_reserve_photo(uuid,uuid,uuid,bigint,integer,integer,text),public.wardrobe_commit_photo(uuid,uuid),
  public.wardrobe_reserve_body_photo(uuid,uuid,bigint,integer,integer,text,text),public.wardrobe_commit_body_photo(uuid,uuid),
  public.wardrobe_ai_reserve(uuid,uuid,uuid,bigint,bigint),public.wardrobe_ai_mark_sent(uuid,uuid),
  public.wardrobe_ai_settle(uuid,uuid,text,jsonb),public.wardrobe_expire_uploads() from public,anon,authenticated;
grant execute on function public.wardrobe_reserve_photo(uuid,uuid,uuid,bigint,integer,integer,text),public.wardrobe_commit_photo(uuid,uuid),
  public.wardrobe_reserve_body_photo(uuid,uuid,bigint,integer,integer,text,text),public.wardrobe_commit_body_photo(uuid,uuid),
  public.wardrobe_ai_reserve(uuid,uuid,uuid,bigint,bigint),public.wardrobe_ai_mark_sent(uuid,uuid),
  public.wardrobe_ai_settle(uuid,uuid,text,jsonb),public.wardrobe_expire_uploads() to service_role;

-- User deletion retains aggregate project spend/unknown holds but not personal
-- job inputs. Auth is still last, after every photo variant has left Storage.
create or replace function public.wardrobe_prepare_auth_delete(p_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare j public.wardrobe_visualizations;
begin
  perform 1 from wardrobe_private.ai_control where singleton for update;
  perform 1 from public.wardrobe_accounts where id=p_id and status='deleting' for update;
  if not found or exists(select 1 from public.wardrobe_items where account_id=p_id)
    or exists(select 1 from public.wardrobe_photos where account_id=p_id) then return false; end if;
  perform 1 from wardrobe_private.ai_control where singleton for update;
  for j in select * from public.wardrobe_visualizations where account_id=p_id loop
    if j.status='reserved' then perform wardrobe_private.cancel_job(j.id,true);
    elsif j.reserved_cents>0 then update wardrobe_private.ai_control set blocked=true where singleton; end if;
  end loop;
  delete from public.wardrobe_visualizations where account_id=p_id;
  delete from public.wardrobe_body_fit where account_id=p_id;
  delete from public.wardrobe_styling where account_id=p_id;
  delete from wardrobe_private.import_receipts where account_id=p_id;
  update public.wardrobe_accounts set state='{}'::jsonb where id=p_id;
  return true;
end; $$;
