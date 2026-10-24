-- P3.1: data-plane access is denied unless an invited, verified account is active.
create schema if not exists wardrobe_private;
revoke all on schema wardrobe_private from public, anon, authenticated;

create table wardrobe_private.invites (
  email text primary key check (email = lower(trim(email))),
  enabled boolean not null default true
);

create table public.wardrobe_accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','deleting')),
  state jsonb not null default '{"locale":"pl","profiles":[],"activeProfileId":"","feedback":[],"askReason":true}',
  revision bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deletion_requested_at timestamptz
);
create table public.wardrobe_items (
  id uuid primary key,
  account_id uuid not null references public.wardrobe_accounts(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  category text not null check (category in ('top','bottom','layer','shoes','dress','accessory')),
  color text not null check (length(color) <= 60),
  occasions text[] not null check (cardinality(occasions) between 1 and 6 and occasions <@ array['casual','elegant','wedding','work','date','party']),
  size text not null default '' check (length(size) <= 40),
  photo_kind text not null default 'garment' check (photo_kind in ('garment','person')),
  status text not null default 'active' check (status in ('active','deleting')),
  revision bigint not null default 1,
  photo_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index wardrobe_items_account on public.wardrobe_items(account_id);
create table public.wardrobe_photos (
  id uuid primary key,
  account_id uuid not null references public.wardrobe_accounts(id) on delete cascade,
  item_id uuid not null references public.wardrobe_items(id) on delete cascade,
  status text not null default 'staged' check (status in ('staged','active','deleting')),
  expected_revision bigint not null,
  main_path text not null unique,
  thumb_path text not null unique,
  bytes integer not null check (bytes between 1 and 1000000),
  thumb_bytes integer not null check (thumb_bytes between 1 and 100000),
  mime_type text not null check (mime_type = 'image/jpeg'),
  fingerprint text not null check (length(fingerprint) = 64),
  created_at timestamptz not null default now(),
  cleanup_after timestamptz not null default now() + interval '5 minutes',
  cleanup_attempts integer not null default 0,
  cleanup_error text,
  cleanup_attempted_at timestamptz
);
create index wardrobe_photos_cleanup on public.wardrobe_photos(status, created_at);
create index wardrobe_photos_account on public.wardrobe_photos(account_id);
create unique index wardrobe_photos_one_active on public.wardrobe_photos(item_id) where status = 'active';
create table wardrobe_private.import_receipts (
  account_id uuid not null references public.wardrobe_accounts(id) on delete cascade,
  import_id uuid not null,
  created_at timestamptz not null default now(),
  primary key(account_id, import_id)
);

create or replace function public.wardrobe_before_user_created(event jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from wardrobe_private.invites where email = lower(event->'user'->>'email') and enabled) then
    return '{"error":{"http_code":403,"message":"This pilot is invitation only."}}'::jsonb;
  end if;
  return '{}'::jsonb;
end;
$$;
revoke all on function public.wardrobe_before_user_created(jsonb) from public, anon, authenticated;
grant execute on function public.wardrobe_before_user_created(jsonb) to supabase_auth_admin;

create or replace function public.wardrobe_is_active(p_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_id = auth.uid() and exists (
    select 1 from public.wardrobe_accounts a join auth.users u on u.id = a.id
    join wardrobe_private.invites i on i.email = lower(u.email) and i.enabled
    where a.id = p_id and a.status = 'active' and u.email_confirmed_at is not null
  );
$$;
revoke all on function public.wardrobe_is_active(uuid) from public, anon;
grant execute on function public.wardrobe_is_active(uuid) to authenticated;

alter table public.wardrobe_accounts enable row level security;
alter table public.wardrobe_items enable row level security;
alter table public.wardrobe_photos enable row level security;
revoke all on public.wardrobe_accounts, public.wardrobe_items, public.wardrobe_photos from anon, authenticated;
grant select on public.wardrobe_accounts, public.wardrobe_items, public.wardrobe_photos to authenticated;
grant all on public.wardrobe_accounts, public.wardrobe_items, public.wardrobe_photos to service_role;
create policy wardrobe_account_read on public.wardrobe_accounts for select to authenticated using (public.wardrobe_is_active(id));
create policy wardrobe_item_read on public.wardrobe_items for select to authenticated using (public.wardrobe_is_active(account_id));
create policy wardrobe_photo_read on public.wardrobe_photos for select to authenticated using (
  public.wardrobe_is_active(account_id) and status = 'active' and exists (
    select 1 from public.wardrobe_items i where i.id = item_id and i.status = 'active' and i.photo_id = wardrobe_photos.id
  )
);

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('wardrobe-private','wardrobe-private',false,1000000,array['image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = 1000000, allowed_mime_types = array['image/jpeg'];
create policy wardrobe_storage_read on storage.objects for select to authenticated using (
  bucket_id = 'wardrobe-private' and exists (
    select 1 from public.wardrobe_photos p join public.wardrobe_items i on i.id = p.item_id
    where (p.main_path = storage.objects.name or p.thumb_path = storage.objects.name) and p.status = 'active'
      and i.status = 'active' and i.photo_id = p.id and public.wardrobe_is_active(p.account_id)
  )
);
-- No authenticated INSERT/UPDATE/DELETE policies. Only the validated Edge upload
-- path can write, so fabricated sizes or a direct Storage call cannot bypass limits.

create or replace function wardrobe_private.assert_state(v jsonb)
returns void language plpgsql set search_path = '' as $$
declare p jsonb; f jsonb; ids text[] := '{}';
begin
  if jsonb_typeof(v) is distinct from 'object' or octet_length(v::text) > 500000
    or (v - array['locale','profiles','activeProfileId','feedback','askReason']) <> '{}'::jsonb
    or coalesce(v->>'locale','') not in ('pl','en')
    or jsonb_typeof(v->'askReason') is distinct from 'boolean'
    or jsonb_typeof(v->'activeProfileId') is distinct from 'string'
    or jsonb_typeof(v->'profiles') is distinct from 'array' or jsonb_array_length(v->'profiles') > 20
    or jsonb_typeof(v->'feedback') is distinct from 'array' or jsonb_array_length(v->'feedback') > 1000 then
    raise exception 'INVALID_STATE';
  end if;
  for p in select value from jsonb_array_elements(v->'profiles') loop
    if jsonb_typeof(p) is distinct from 'object' or (p - array['id','name','audience','occasion','budget','priority','defaultMode']) <> '{}'::jsonb
      or jsonb_typeof(p->'id') is distinct from 'string' or jsonb_typeof(p->'name') is distinct from 'string'
      or coalesce(length(p->>'id'),0) not between 1 and 100 or p->>'id' = any(ids)
      or coalesce(length(trim(p->>'name')),0) not between 1 and 60
      or coalesce(p->>'audience','') not in ('women','men')
      or coalesce(p->>'occasion','') not in ('casual','elegant','wedding','work','date','party')
      or coalesce(p->>'priority','') not in ('comfort','quality','versatility')
      or coalesce(p->>'defaultMode','') not in ('best','value')
      or jsonb_typeof(p->'budget') is distinct from 'number' then raise exception 'INVALID_STATE'; end if;
    if (p->>'budget')::numeric < 0 or (p->>'budget')::numeric > 1000000 then raise exception 'INVALID_STATE'; end if;
    ids := array_append(ids,p->>'id');
  end loop;
  if (cardinality(ids) = 0 and v->>'activeProfileId' <> '') or
    (cardinality(ids) > 0 and not (v->>'activeProfileId' = any(ids))) then raise exception 'INVALID_STATE'; end if;
  for f in select value from jsonb_array_elements(v->'feedback') loop
    if jsonb_typeof(f) is distinct from 'object' or (f - array['profileId','outfitId','vote','reason']) <> '{}'::jsonb
      or jsonb_typeof(f->'profileId') is distinct from 'string'
      or (f ? 'reason' and jsonb_typeof(f->'reason') is distinct from 'string')
      or not (coalesce(f->>'profileId','') = any(ids))
      or coalesce(f->>'outfitId','') !~ '^[wm][1-6]$'
      or coalesce(f->>'vote','') not in ('like','dislike')
      or coalesce(length(f->>'reason'),0) > 500 then raise exception 'INVALID_STATE'; end if;
  end loop;
end;
$$;

create or replace function wardrobe_private.item_json(p_id uuid)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id',i.id,'name',i.name,'category',i.category,'color',i.color,
    'occasions',i.occasions,'size',i.size,'photoKind',i.photo_kind,'revision',i.revision,
    'status',i.status,'createdAt',i.created_at,'updatedAt',i.updated_at,'photo',
    (select jsonb_build_object('id',p.id,'mainPath',p.main_path,'thumbPath',p.thumb_path,
      'mimeType',p.mime_type,'bytes',p.bytes,'thumbBytes',p.thumb_bytes)
      from public.wardrobe_photos p where p.id = i.photo_id and p.status = 'active'))
    from public.wardrobe_items i where i.id = p_id;
$$;
create or replace function wardrobe_private.snapshot(p_id uuid)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('accountId',a.id,'state',jsonb_build_object('revision',a.revision,'data',a.state),
    'items',coalesce((select jsonb_agg(wardrobe_private.item_json(i.id) order by i.created_at desc)
      from public.wardrobe_items i where i.account_id = a.id),'[]'::jsonb))
    from public.wardrobe_accounts a where a.id = p_id;
$$;

create or replace function public.wardrobe_execute(p_action text, p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); a public.wardrobe_accounts; item public.wardrobe_items;
  iid uuid; request_import_id uuid; fields jsonb; occ text[]; result jsonb;
begin
  if uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_action = 'bootstrap' then
    if not exists(select 1 from auth.users u join wardrobe_private.invites v on v.email=lower(u.email)
      where u.id=uid and u.email_confirmed_at is not null and v.enabled) then raise exception 'NOT_INVITED'; end if;
    insert into public.wardrobe_accounts(id) values(uid) on conflict do nothing;
  end if;
  select * into a from public.wardrobe_accounts where id=uid for update;
  if not found or not public.wardrobe_is_active(uid) then raise exception 'ACCOUNT_UNAVAILABLE'; end if;
  if p_action in ('bootstrap','export') then
    result := wardrobe_private.snapshot(uid);
    if p_action='export' then result:=result || jsonb_build_object('exportedAt',now()); end if;
    return result;
  elsif p_action='saveState' then
    request_import_id := nullif(p_payload->>'importId','')::uuid;
    if request_import_id is not null and exists(select 1 from wardrobe_private.import_receipts r where r.account_id=uid and r.import_id=request_import_id) then
      return jsonb_build_object('revision',a.revision,'data',a.state);
    end if;
    if a.revision is distinct from (p_payload->>'expectedRevision')::bigint then raise exception 'CONFLICT'; end if;
    perform wardrobe_private.assert_state(p_payload->'data');
    update public.wardrobe_accounts set state=p_payload->'data',revision=revision+1,updated_at=now() where id=uid returning * into a;
    if request_import_id is not null then insert into wardrobe_private.import_receipts values(uid,request_import_id,now()); end if;
    return jsonb_build_object('revision',a.revision,'data',a.state);
  elsif p_action='deleteAccount' then
    update public.wardrobe_accounts set status='deleting',deletion_requested_at=now(),updated_at=now() where id=uid;
    update public.wardrobe_items set status='deleting',updated_at=now() where account_id=uid;
    update public.wardrobe_photos set status='deleting' where account_id=uid;
    return '{"status":"pending"}';
  end if;
  iid := (p_payload->>'itemId')::uuid;
  if iid is null then raise exception 'INVALID_ITEM'; end if;
  select * into item from public.wardrobe_items where id=iid;
  if p_action='createItem' and not found then
    if (select count(*) from public.wardrobe_items where account_id=uid) >= 100 then raise exception 'ITEM_LIMIT'; end if;
    fields := p_payload;
    select array_agg(value) into occ from jsonb_array_elements_text(fields->'occasions');
    insert into public.wardrobe_items(id,account_id,name,category,color,occasions,size,photo_kind)
      values(iid,uid,trim(fields->>'name'),fields->>'category',fields->>'color',occ,coalesce(fields->>'size',''),fields->>'photoKind');
    return wardrobe_private.item_json(iid);
  end if;
  if item.account_id is distinct from uid then raise exception 'NOT_FOUND'; end if;
  if p_action='createItem' then return wardrobe_private.item_json(iid); end if;
  if item.status <> 'active' then
    if p_action='deleteItem' then return '{"status":"pending"}'; end if;
    raise exception 'NOT_FOUND';
  end if;
  if item.revision is distinct from (p_payload->>'expectedRevision')::bigint then raise exception 'CONFLICT'; end if;
  if p_action='updateItem' then
    fields:=p_payload;
    select array_agg(value) into occ from jsonb_array_elements_text(fields->'occasions');
    update public.wardrobe_items set name=trim(fields->>'name'),category=fields->>'category',color=fields->>'color',
      occasions=occ,size=coalesce(fields->>'size',''),photo_kind=fields->>'photoKind',revision=revision+1,updated_at=now() where id=iid;
    return wardrobe_private.item_json(iid);
  elsif p_action in ('deleteItem','deletePhoto') then
    update public.wardrobe_photos set status='deleting' where item_id=iid;
    update public.wardrobe_items set photo_id=null,revision=revision+1,updated_at=now(),
      status=case when p_action='deleteItem' then 'deleting' else status end where id=iid;
    return '{"status":"pending"}';
  end if;
  raise exception 'INVALID_ACTION';
end;
$$;
revoke all on function public.wardrobe_execute(text,jsonb) from public, anon;
grant execute on function public.wardrobe_execute(text,jsonb) to authenticated;

-- Only the Edge service role can reserve bytes. The Edge has verified both
-- actual byte arrays and their fingerprint before this transaction starts.
create or replace function public.wardrobe_reserve_photo(p_account uuid,p_item uuid,p_id uuid,p_revision bigint,p_bytes integer,p_thumb_bytes integer,p_fingerprint text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.wardrobe_accounts; i public.wardrobe_items; p public.wardrobe_photos;
begin
  select * into a from public.wardrobe_accounts where id=p_account for update;
  if not found or a.status<>'active' or not exists(select 1 from auth.users u join wardrobe_private.invites v on v.email=lower(u.email) and v.enabled where u.id=p_account and u.email_confirmed_at is not null) then raise exception 'ACCOUNT_UNAVAILABLE'; end if;
  select * into i from public.wardrobe_items where id=p_item and account_id=p_account;
  if not found or i.status<>'active' then raise exception 'NOT_FOUND'; end if;
  select * into p from public.wardrobe_photos where id=p_id;
  if found then
    if p.account_id<>p_account or p.item_id<>p_item or p.fingerprint<>p_fingerprint or p.status='deleting' then raise exception 'CONFLICT'; end if;
    if p.status='staged' then update public.wardrobe_photos set cleanup_after=now()+interval '5 minutes' where id=p.id returning * into p; end if;
    return to_jsonb(p);
  end if;
  if i.revision is distinct from p_revision then raise exception 'CONFLICT'; end if;
  if coalesce((select sum(bytes+thumb_bytes) from public.wardrobe_photos where account_id=p_account),0)+p_bytes+p_thumb_bytes > 250000000 then raise exception 'STORAGE_LIMIT'; end if;
  if (select count(*) from public.wardrobe_photos where account_id=p_account) >= 200 then raise exception 'UPLOAD_PENDING'; end if;
  if exists(select 1 from public.wardrobe_photos where item_id=p_item and status='staged') then raise exception 'UPLOAD_PENDING'; end if;
  insert into public.wardrobe_photos(id,account_id,item_id,expected_revision,main_path,thumb_path,bytes,thumb_bytes,mime_type,fingerprint)
    values(p_id,p_account,p_item,p_revision,p_account||'/'||p_item||'/'||p_id||'/main.jpg',p_account||'/'||p_item||'/'||p_id||'/thumb.jpg',p_bytes,p_thumb_bytes,'image/jpeg',p_fingerprint)
    returning * into p;
  return to_jsonb(p);
end;
$$;
create or replace function public.wardrobe_commit_photo(p_account uuid,p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.wardrobe_accounts; i public.wardrobe_items; p public.wardrobe_photos;
begin
  select * into a from public.wardrobe_accounts where id=p_account for update;
  if not found or a.status<>'active' or not exists(select 1 from auth.users u join wardrobe_private.invites v on v.email=lower(u.email) and v.enabled where u.id=p_account and u.email_confirmed_at is not null) then raise exception 'ACCOUNT_UNAVAILABLE'; end if;
  select * into p from public.wardrobe_photos where id=p_id and account_id=p_account;
  if not found or p.status='deleting' then raise exception 'NOT_FOUND'; end if;
  select * into i from public.wardrobe_items where id=p.item_id and account_id=p_account;
  if not found or i.status<>'active' then raise exception 'NOT_FOUND'; end if;
  if p.status='active' and i.photo_id=p.id then return wardrobe_private.item_json(i.id); end if;
  if i.revision<>p.expected_revision then raise exception 'CONFLICT'; end if;
  if (select count(*) from storage.objects where bucket_id='wardrobe-private' and name in(p.main_path,p.thumb_path))<>2 then raise exception 'UPLOAD_INCOMPLETE'; end if;
  update public.wardrobe_photos set status='deleting' where id=i.photo_id;
  update public.wardrobe_photos set status='active' where id=p.id;
  update public.wardrobe_items set photo_id=p.id,revision=revision+1,updated_at=now() where id=i.id;
  return wardrobe_private.item_json(i.id);
end;
$$;
create or replace function public.wardrobe_expire_uploads()
returns void language sql security definer set search_path = '' as $$
  update public.wardrobe_photos set status='deleting' where status='staged'
    and created_at < now()-interval '1 hour' and cleanup_after <= now();
$$;
create or replace function public.wardrobe_finish_photo_delete(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare p public.wardrobe_photos;
begin
  select * into p from public.wardrobe_photos where id=p_id for update;
  if not found then return; end if;
  if p.status<>'deleting' or p.cleanup_after > now() then raise exception 'CONFLICT'; end if;
  if exists(select 1 from storage.objects where bucket_id='wardrobe-private' and name in(p.main_path,p.thumb_path)) then raise exception 'DELETE_INCOMPLETE'; end if;
  delete from public.wardrobe_photos where id=p_id;
end;
$$;
create or replace function public.wardrobe_finish_item_deletes()
returns void language sql security definer set search_path = '' as $$
  delete from public.wardrobe_items i where status='deleting' and not exists(select 1 from public.wardrobe_photos p where p.item_id=i.id);
$$;
create or replace function public.wardrobe_prepare_auth_delete(p_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.wardrobe_accounts where id=p_id and status='deleting' for update;
  if not found or exists(select 1 from public.wardrobe_items where account_id=p_id)
    or exists(select 1 from public.wardrobe_photos where account_id=p_id) then return false; end if;
  delete from wardrobe_private.import_receipts where account_id=p_id;
  update public.wardrobe_accounts set state='{}'::jsonb where id=p_id;
  return true;
end;
$$;
revoke all on function public.wardrobe_reserve_photo(uuid,uuid,uuid,bigint,integer,integer,text),public.wardrobe_commit_photo(uuid,uuid),public.wardrobe_expire_uploads(),public.wardrobe_finish_photo_delete(uuid),public.wardrobe_finish_item_deletes() from public,anon,authenticated;
grant execute on function public.wardrobe_reserve_photo(uuid,uuid,uuid,bigint,integer,integer,text),public.wardrobe_commit_photo(uuid,uuid),public.wardrobe_expire_uploads(),public.wardrobe_finish_photo_delete(uuid),public.wardrobe_finish_item_deletes() to service_role;
revoke all on function public.wardrobe_prepare_auth_delete(uuid) from public,anon,authenticated;
grant execute on function public.wardrobe_prepare_auth_delete(uuid) to service_role;
revoke all on all functions in schema wardrobe_private from public,anon,authenticated;
