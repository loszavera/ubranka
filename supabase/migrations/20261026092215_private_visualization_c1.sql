-- C1 prepares the private pilot; no remotely callable path can send to AI.
-- The reservation core is private, owner-only SQL, shared with the future
-- admission wrapper. It has no HTTP/test switch and never contacts a provider.
create table wardrobe_private.c_trials (
 id text primary key check(length(id) between 1 and 100), status text not null default 'prepared' check(status in('prepared','active','closed')),
 starts_at timestamptz, ends_at timestamptz, blocked boolean not null default true, revision bigint not null default 1,
 check((starts_at is null and ends_at is null) or ends_at=starts_at+interval '30 days')
);
insert into wardrobe_private.c_trials(id) values('p33c-v1');
create table wardrobe_private.c_members (
 id uuid primary key default gen_random_uuid(), trial_id text not null references wardrobe_private.c_trials,
 slot smallint not null check(slot in(1,2)), account_id uuid references public.wardrobe_accounts on delete set null,
 archived_sends integer not null default 0 check(archived_sends>=0),
 unique(trial_id,slot), unique(trial_id,account_id)
);
create table wardrobe_private.c_consents (
 account_id uuid primary key references public.wardrobe_accounts on delete cascade,
 revision bigint not null default 0 check(revision>=0), accepted boolean not null default false,
 version text not null default 'p33c-ai-v1.1' check(version='p33c-ai-v1.1')
);
create table wardrobe_private.c_intents (
 id uuid primary key default gen_random_uuid(), trial_id text not null references wardrobe_private.c_trials,
 account_id uuid not null references public.wardrobe_accounts on delete cascade,
 outfit_id uuid, fingerprint text not null, snapshot jsonb not null,
 body_revision bigint not null, styling_revision bigint not null, consent_revision bigint not null,
 job_id uuid, created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '15 minutes',
 unique(trial_id,account_id,fingerprint)
);
-- Independent receipt survives personal job/account deletion. Membership is an
-- anonymous fixed pilot slot after deletion; no photo, outfit, email or prompt.
create table wardrobe_private.c_attempts (
 id uuid primary key, trial_id text not null references wardrobe_private.c_trials,
 member_id uuid not null references wardrobe_private.c_members,
 status text not null check(status in('reserved','sent','succeeded','failed','outcome_unknown','cancelled','expired')),
 month_scope text not null, reserved_cents bigint not null check(reserved_cents>=0), spent_cents bigint not null default 0,
 cost_micro_usd bigint, usage jsonb, created_at timestamptz not null default now(), sent_at timestamptz,
 completed_at timestamptz, publish_until timestamptz, consent_revision bigint not null
);
alter table wardrobe_private.c_trials enable row level security;
alter table wardrobe_private.c_members enable row level security;
alter table wardrobe_private.c_consents enable row level security;
alter table wardrobe_private.c_intents enable row level security;
alter table wardrobe_private.c_attempts enable row level security;
revoke all on wardrobe_private.c_trials,wardrobe_private.c_members,wardrobe_private.c_consents,wardrobe_private.c_intents,wardrobe_private.c_attempts from public,anon,authenticated,service_role;
alter table public.wardrobe_visualizations add column c_intent_id uuid;
alter table public.wardrobe_visualization_files add column bucket text not null default 'wardrobe-results' check(bucket='wardrobe-results'),
 add column thumb_mime_type text not null default 'image/png' check(thumb_mime_type in('image/png','image/jpeg')),
 add column width integer not null default 1024 check(width=1024), add column height integer not null default 1536 check(height=1536),
 add column thumb_width integer not null default 120 check(thumb_width between 1 and 600),
 add column thumb_height integer not null default 180 check(thumb_height between 1 and 900);
update storage.buckets set allowed_mime_types=array['image/png','image/jpeg'] where id='wardrobe-results';
create function wardrobe_private.c_enabled() returns boolean language sql immutable set search_path='' as $$select false$$;

create function wardrobe_private.c_snapshot(p_account uuid,p_outfit uuid)
returns jsonb language plpgsql stable set search_path='' as $$
declare b public.wardrobe_body_fit; o jsonb; inputs jsonb; ids uuid[];
begin
 select * into b from public.wardrobe_body_fit where account_id=p_account;
 select value into o from public.wardrobe_styling s, jsonb_array_elements(s.data->'outfits') where s.account_id=p_account and value->>'id'=p_outfit::text;
 if o is null or b.photo_id is null then raise exception 'NOT_FOUND'; end if;
 select array_agg(value::uuid order by value) into ids from jsonb_array_elements_text(o->'itemIds');
 if coalesce(cardinality(ids),0) not between 1 and 3 then raise exception 'CONFLICT'; end if;
 if (select count(*) from public.wardrobe_items i where i.account_id=p_account and i.id=any(ids) and i.status='active'
   and i.photo_id is not null and i.revision=(o->'itemRevisions'->>i.id::text)::bigint)<>cardinality(ids) then raise exception 'CONFLICT'; end if;
 select jsonb_agg(jsonb_build_object('photoId',p.id,'itemId',p.item_id,'path',p.main_path,'thumbPath',p.thumb_path,
   'bytes',p.bytes,'thumbBytes',p.thumb_bytes,'kind',p.kind,'fingerprint',p.fingerprint,
   'itemRevision',(select revision from public.wardrobe_items where id=p.item_id)) order by (p.kind='body') desc,p.item_id)
 into inputs from public.wardrobe_photos p where p.account_id=p_account and p.status='active' and
  (p.id=b.photo_id or p.id in(select photo_id from public.wardrobe_items where account_id=p_account and id=any(ids)));
 if coalesce(jsonb_array_length(inputs),0)<>cardinality(ids)+1 then raise exception 'NOT_FOUND'; end if;
 -- Whole styling revision deliberately excluded: unrelated feedback is not an input.
 return jsonb_build_object('outfit',jsonb_set(o-array['createdAt','id'],'{itemIds}',to_jsonb(ids)),'bodyRevision',b.revision,'inputs',inputs);
end; $$;
create function wardrobe_private.c_inputs_current(p_job uuid)
returns boolean language plpgsql stable set search_path='' as $$
declare j public.wardrobe_visualizations; i wardrobe_private.c_intents;
begin
 select * into j from public.wardrobe_visualizations where id=p_job;
 select * into i from wardrobe_private.c_intents where id=j.c_intent_id and account_id=j.account_id;
 if i.id is null or j.hidden or j.cancel_requested or not exists(
  select 1 from public.wardrobe_accounts ac join auth.users u on u.id=ac.id
  join wardrobe_private.invites inv on inv.email=lower(u.email) and inv.enabled
  where ac.id=j.account_id and ac.status='active' and u.email_confirmed_at is not null) then return false; end if;
 return wardrobe_private.c_snapshot(j.account_id,j.outfit_id)=i.snapshot;
exception when others then return false;
end; $$;
alter function wardrobe_private.ai_inputs_current(uuid) rename to ai_inputs_current_p33b;
create function wardrobe_private.ai_inputs_current(p_job uuid)
returns boolean language sql stable set search_path='' as $$
 select case when exists(select 1 from public.wardrobe_visualizations where id=p_job and c_intent_id is not null)
 then wardrobe_private.c_inputs_current(p_job) else wardrobe_private.ai_inputs_current_p33b(p_job) end;
$$;
create function wardrobe_private.c_publishable(p_job uuid)
returns boolean language sql stable set search_path='' as $$
 select coalesce(a.status='sent' and a.publish_until>now() and c.accepted and c.revision=a.consent_revision
  and wardrobe_private.c_inputs_current(j.id),false)
 from wardrobe_private.c_attempts a join public.wardrobe_visualizations j on j.id=a.id
 join wardrobe_private.c_consents c on c.account_id=j.account_id where a.id=p_job;
$$;
create function wardrobe_private.c_reservation(p_trial text)
returns bigint language sql stable set search_path='' as $$
 select case when not exists(select 1 from wardrobe_private.c_attempts where trial_id=p_trial and sent_at is not null)
 then greatest(0,least(2500-coalesce((select spent_cents+reserved_cents from wardrobe_private.ai_budgets where scope='trial:'||p_trial),0),
  2500-coalesce((select spent_cents+reserved_cents from wardrobe_private.ai_budgets where scope='month:'||to_char(now() at time zone 'UTC','YYYY-MM')),0)))
 else greatest(100,20+2*coalesce((select max(spent_cents) from wardrobe_private.c_attempts where trial_id=p_trial),0)) end;
$$;
create function wardrobe_private.c_intent_json(p_id uuid)
returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('id',i.id,'trialId',i.trial_id,'outfitId',i.outfit_id,'fingerprint',i.fingerprint,
  'bodyRevision',i.body_revision,'stylingRevision',i.styling_revision,'consentRevision',i.consent_revision,
  'expiresAt',i.expires_at,'inputs',i.snapshot->'inputs','reservePln',wardrobe_private.c_reservation(i.trial_id)/100.0,'jobId',i.job_id)
 from wardrobe_private.c_intents i where i.id=p_id;
$$;

create function wardrobe_private.c_reserve_core(p_account uuid,p_id uuid,p_intent uuid,p_epoch bigint)
returns jsonb language plpgsql set search_path='' as $$
declare i wardrobe_private.c_intents; t wardrobe_private.c_trials; m wardrobe_private.c_members; c wardrobe_private.c_consents;
 a wardrobe_private.c_attempts; amount bigint; mon text; total bigint; ai bigint; photos uuid[]; bodyrev bigint;
begin
 perform wardrobe_private.assert_account(p_account); -- global mutex first, including other accounts/trials
 select * into i from wardrobe_private.c_intents where id=p_intent and account_id=p_account for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 select * into a from wardrobe_private.c_attempts where id=p_id;
 if found then
  if i.job_id is distinct from p_id then raise exception 'CONFLICT'; end if;
  return wardrobe_private.job_json(p_id);
 end if;
 if i.job_id is not null then raise exception 'CASE_USED'; end if;
 select * into t from wardrobe_private.c_trials where id=i.trial_id;
 select * into m from wardrobe_private.c_members where trial_id=t.id and account_id=p_account;
 if m.id is null or t.status<>'active' or t.blocked or t.starts_at is null or now()<t.starts_at or now()>=t.ends_at
  then raise exception 'AI_DISABLED'; end if;
 if exists(select 1 from public.wardrobe_visualizations where status in('reserved','sent','outcome_unknown'))
  or exists(select 1 from wardrobe_private.c_attempts where status in('reserved','sent','outcome_unknown')) then raise exception 'AI_BUSY'; end if;
 insert into wardrobe_private.c_consents(account_id) values(p_account) on conflict do nothing;
 select * into c from wardrobe_private.c_consents where account_id=p_account;
 if c.revision is distinct from p_epoch or i.consent_revision is distinct from p_epoch or i.expires_at<=now()
  or i.snapshot is distinct from wardrobe_private.c_snapshot(p_account,i.outfit_id) then raise exception 'CONFLICT'; end if;
 if (select count(*) from wardrobe_private.c_attempts where trial_id=t.id and sent_at is not null)
    +coalesce((select sum(archived_sends) from wardrobe_private.c_members where trial_id=t.id),0)>=60
  or (select count(*) from wardrobe_private.c_attempts where member_id=m.id and sent_at is not null)+m.archived_sends>=30
  or (select count(*) from wardrobe_private.c_attempts where member_id=m.id and sent_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC')>=5
  or (select count(*) from public.wardrobe_visualization_files where account_id=p_account and status='active' and expires_at>now())>=30 then raise exception 'AI_ATTEMPT_LIMIT'; end if;
 select coalesce(sum(bytes+thumb_bytes),0) into ai from public.wardrobe_visualization_files where account_id=p_account;
 ai:=ai+coalesce((select sum(reserved_bytes) from public.wardrobe_visualizations where account_id=p_account),0);
 total:=ai+coalesce((select sum(bytes+thumb_bytes) from public.wardrobe_photos where account_id=p_account),0);
 if ai+8100000>100000000 or total+8100000>250000000 then raise exception 'STORAGE_LIMIT'; end if;
 mon:='month:'||to_char(now() at time zone 'UTC','YYYY-MM');
 insert into wardrobe_private.ai_budgets(scope,limit_cents) values(mon,2500),('trial:'||t.id,2500) on conflict do nothing;
 amount:=wardrobe_private.c_reservation(t.id);
 if amount<=0 or exists(select 1 from wardrobe_private.ai_budgets where scope in(mon,'trial:'||t.id)
   and spent_cents+reserved_cents+amount>least(limit_cents,2500)) then raise exception 'AI_BUDGET_LIMIT'; end if;
 update wardrobe_private.c_consents set accepted=true,revision=revision+1 where account_id=p_account returning * into c;
 select array_agg((value->>'photoId')::uuid) into photos from jsonb_array_elements(i.snapshot->'inputs');
 insert into public.wardrobe_visualizations(id,account_id,outfit_id,fingerprint,input_photo_ids,input_body_revision,input_styling_revision,input_item_revisions,
  status,trial_scope,month_scope,consent_version,reserved_cents,c_intent_id)
 values(p_id,p_account,i.outfit_id,i.fingerprint,photos,i.body_revision,i.styling_revision,i.snapshot->'outfit'->'itemRevisions',
  'reserved','trial:'||t.id,mon,'p33c-ai-v1.1',amount,i.id);
 insert into wardrobe_private.c_attempts(id,trial_id,member_id,status,month_scope,reserved_cents,consent_revision)
 values(p_id,t.id,m.id,'reserved',mon,amount,c.revision);
 update wardrobe_private.c_intents set job_id=p_id where id=i.id;
 update wardrobe_private.ai_budgets set reserved_cents=reserved_cents+amount where scope in(mon,'trial:'||t.id);
 return wardrobe_private.job_json(p_id);
end; $$;
create function public.wardrobe_c_reserve(p_account uuid,p_id uuid,p_intent uuid,p_epoch bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform 1 from wardrobe_private.ai_control where singleton for update;
 if not wardrobe_private.c_enabled() then raise exception 'AI_DISABLED'; end if;
 if (select blocked from wardrobe_private.ai_control where singleton) then raise exception 'AI_UNAVAILABLE'; end if;
 return wardrobe_private.c_reserve_core(p_account,p_id,p_intent,p_epoch);
end; $$;

-- Sync cancellation/watchdog into the durable financial receipt. Generic
-- cancellation owns releasing a RESERVED hold; a sent/unknown hold stays intact.
create function wardrobe_private.c_sync_job() returns trigger language plpgsql set search_path='' as $$
begin
 if new.c_intent_id is not null then
  update wardrobe_private.c_attempts set status=new.status,reserved_cents=new.reserved_cents,
   spent_cents=coalesce(new.spent_cents,0),cost_micro_usd=new.cost_micro_usd,usage=new.usage,sent_at=new.sent_at,completed_at=new.completed_at where id=new.id;
 end if;
 return new;
end; $$;
create trigger wardrobe_c_sync after update on public.wardrobe_visualizations for each row execute function wardrobe_private.c_sync_job();
create function wardrobe_private.c_mark_sent_core(p_id uuid)
returns boolean language plpgsql set search_path='' as $$
declare a wardrobe_private.c_attempts; j public.wardrobe_visualizations; t wardrobe_private.c_trials;
begin
 perform 1 from wardrobe_private.ai_control where singleton for update;
 select * into a from wardrobe_private.c_attempts where id=p_id;
 select * into j from public.wardrobe_visualizations where id=p_id;
 if a.status is distinct from 'reserved' or j.id is null then return false; end if;
 perform wardrobe_private.assert_account(j.account_id);
 select * into t from wardrobe_private.c_trials where id=a.trial_id;
 if t.status<>'active' or t.blocked or now()<t.starts_at or now()>=t.ends_at or j.expires_at<=now()
  or a.month_scope<>'month:'||to_char(now() at time zone 'UTC','YYYY-MM')
  or not wardrobe_private.c_inputs_current(p_id)
  or not exists(select 1 from wardrobe_private.c_consents where account_id=j.account_id and accepted and revision=a.consent_revision) then
  perform wardrobe_private.cancel_job(p_id); return false;
 end if;
 update wardrobe_private.c_attempts set publish_until=now()+interval '150 seconds' where id=p_id;
 update public.wardrobe_visualizations set status='sent',sent_at=now(),revision=revision+1 where id=p_id;
 return true;
end; $$;
create function public.wardrobe_c_mark_sent(p_id uuid) returns boolean language plpgsql security definer set search_path='' as $$
begin
 perform 1 from wardrobe_private.ai_control where singleton for update;
 if not wardrobe_private.c_enabled() then raise exception 'AI_DISABLED'; end if;
 if (select blocked from wardrobe_private.ai_control where singleton) then raise exception 'AI_UNAVAILABLE'; end if;
 return wardrobe_private.c_mark_sent_core(p_id);
end; $$;
create function public.wardrobe_c_plan(p_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare j public.wardrobe_visualizations; i wardrobe_private.c_intents;
begin
 if not wardrobe_private.c_enabled() then raise exception 'AI_DISABLED'; end if;
 select * into j from public.wardrobe_visualizations where id=p_id and c_intent_id is not null and status='reserved';
 if not found then raise exception 'NOT_FOUND'; end if;
 perform wardrobe_private.assert_account(j.account_id);
 if not wardrobe_private.c_inputs_current(p_id) then raise exception 'CONFLICT'; end if;
 select * into i from wardrobe_private.c_intents where id=j.c_intent_id;
 return jsonb_build_object('jobId',j.id,'accountId',j.account_id,'trialId',i.trial_id,'inputs',i.snapshot->'inputs',
  'promptVersion','p33c-v1','prompt','Create one photorealistic full-body outfit preview of the fictional or consenting adult in the first image. Preserve the person, pose and body proportions. Use the garments in the remaining images. Preserve their visible cut, colour, pattern and details. Show the entire outfit clearly. This is an appearance preview, not a fit or size prediction.',
  'params',jsonb_build_object('model','gpt-image-2.5-flare-2026-09-08','n',1,'quality','medium','size','1024x1536','output_format','png','background','opaque','moderation','auto'));
end; $$;

create function wardrobe_private.c_manifest_core(p_job uuid,p_id uuid,p_bytes integer,p_thumb_bytes integer,p_sha text,p_thumb_sha text,p_thumb_mime text,p_width integer,p_height integer)
returns jsonb language plpgsql set search_path='' as $$
declare j public.wardrobe_visualizations; f public.wardrobe_visualization_files; ext text;
begin
 perform 1 from wardrobe_private.ai_control where singleton for update;
 select * into j from public.wardrobe_visualizations where id=p_job for update;
 if not coalesce(wardrobe_private.c_publishable(p_job),false) then return null; end if;
 if p_bytes not between 1 and 8000000 or p_thumb_bytes not between 1 and 100000 or p_sha !~ '^[a-f0-9]{64}$' or p_thumb_sha !~ '^[a-f0-9]{64}$'
  or p_thumb_mime not in('image/png','image/jpeg') or p_width not between 1 and 600 or p_height not between 1 and 900
  or p_width*3<>p_height*2 then raise exception 'INVALID_MANIFEST'; end if;
 if exists(select 1 from public.wardrobe_visualization_files where job_id=p_job) then raise exception 'CONFLICT'; end if;
 ext:=case when p_thumb_mime='image/jpeg' then 'jpg' else 'png' end;
 -- Convert reserved bytes into actual durable manifest BEFORE any upload.
 update public.wardrobe_visualizations set reserved_bytes=0 where id=p_job;
 insert into public.wardrobe_visualization_files(id,job_id,account_id,status,main_path,thumb_path,bytes,thumb_bytes,sha256,thumb_sha256,thumb_mime_type,thumb_width,thumb_height)
 values(p_id,p_job,j.account_id,'staged',j.account_id||'/'||p_job||'/'||p_id||'/main.png',j.account_id||'/'||p_job||'/'||p_id||'/thumb.'||ext,
  p_bytes,p_thumb_bytes,p_sha,p_thumb_sha,p_thumb_mime,p_width,p_height) returning * into f;
 return to_jsonb(f);
end; $$;
create function public.wardrobe_c_manifest(p_job uuid,p_id uuid,p_bytes integer,p_thumb_bytes integer,p_sha text,p_thumb_sha text,p_thumb_mime text,p_width integer,p_height integer)
returns jsonb language plpgsql security definer set search_path='' as $$
begin if not wardrobe_private.c_enabled() then raise exception 'AI_DISABLED'; end if;
 return wardrobe_private.c_manifest_core(p_job,p_id,p_bytes,p_thumb_bytes,p_sha,p_thumb_sha,p_thumb_mime,p_width,p_height); end; $$;

-- Settlement deliberately works after OFF, expiry and account deletion. No new
-- reservation, file or provider request can be created by this RPC.
create function public.wardrobe_c_complete(p_id uuid,p_usage jsonb,p_publish boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a wardrobe_private.c_attempts; j public.wardrobe_visualizations; f public.wardrobe_visualization_files; k text; micro bigint; cents bigint; ok boolean;
begin
 perform 1 from wardrobe_private.ai_control where singleton for update;
 select * into a from wardrobe_private.c_attempts where id=p_id for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 if a.status in('succeeded','failed') then
  if a.usage is distinct from p_usage then raise exception 'CONFLICT'; end if;
  return coalesce(wardrobe_private.job_json(p_id),jsonb_build_object('status',a.status,'spentPln',a.spent_cents/100.0));
 end if;
 if a.status not in('sent','outcome_unknown') then raise exception 'CONFLICT'; end if;
 if p_usage is null then
  update wardrobe_private.c_trials set blocked=true where id=a.trial_id;
  update wardrobe_private.c_attempts set status='outcome_unknown' where id=p_id;
  update public.wardrobe_visualizations set status='outcome_unknown',error_code='OUTCOME_UNKNOWN',revision=revision+1 where id=p_id;
  update wardrobe_private.ai_control set blocked=true where singleton;
  return jsonb_build_object('status','outcome_unknown');
 end if;
 foreach k in array array['textInputTokens','imageInputTokens','imageOutputTokens'] loop
  if jsonb_typeof(p_usage->k) is distinct from 'number' or (p_usage->>k)::numeric<0 or (p_usage->>k)::numeric>100000000
   or (p_usage->>k)::numeric<>trunc((p_usage->>k)::numeric) then raise exception 'INVALID_USAGE'; end if;
 end loop;
 micro:=(p_usage->>'textInputTokens')::bigint*5+(p_usage->>'imageInputTokens')::bigint*8+(p_usage->>'imageOutputTokens')::bigint*30;
 cents:=ceil(micro::numeric*6765/10000000)::bigint;
 select * into j from public.wardrobe_visualizations where id=p_id;
 select * into f from public.wardrobe_visualization_files where job_id=p_id;
 ok:=p_publish and coalesce(wardrobe_private.c_publishable(p_id),false) and f.status='staged' and f.expires_at>now()
  and (select count(*) from storage.objects where bucket_id=f.bucket and name in(f.main_path,f.thumb_path))=2;
 ok:=coalesce(ok,false);
 update wardrobe_private.ai_budgets set reserved_cents=reserved_cents-a.reserved_cents,spent_cents=spent_cents+cents where scope in('trial:'||a.trial_id,a.month_scope);
 if cents>a.reserved_cents or a.status='outcome_unknown' then
  update wardrobe_private.ai_control set blocked=true where singleton;
  update wardrobe_private.c_trials set blocked=true where id=a.trial_id;
 end if;
 update wardrobe_private.c_attempts set status=case when ok then 'succeeded' else 'failed' end,reserved_cents=0,spent_cents=cents,
  cost_micro_usd=micro,usage=p_usage,completed_at=now() where id=p_id;
 update public.wardrobe_visualization_files set status=case when ok then 'active' else 'deleting' end where job_id=p_id;
 update public.wardrobe_visualizations set status=case when ok then 'succeeded' else 'failed' end,reserved_cents=0,reserved_bytes=0,
  spent_cents=cents,cost_micro_usd=micro,usage=p_usage,completed_at=now(),revision=revision+1,
  expires_at=case when ok then f.expires_at else expires_at end,error_code=case when ok then null else 'GENERATION_FAILED' end where id=p_id;
 return coalesce(wardrobe_private.job_json(p_id),jsonb_build_object('status','failed','spentPln',cents/100.0));
end; $$;

alter function wardrobe_private.job_json(uuid) rename to job_json_p33b;
create function wardrobe_private.job_json(p_id uuid) returns jsonb language sql stable set search_path='' as $$
 select wardrobe_private.job_json_p33b(p_id)||jsonb_build_object('trialId',coalesce(a.trial_id,(select trial_id from wardrobe_private.c_intents where id=j.c_intent_id)),'intentId',j.c_intent_id,
  'result',case when j.status='succeeded' and not j.hidden and not j.cancel_requested and j.expires_at>now() and wardrobe_private.ai_inputs_current(j.id)
   then (select jsonb_build_object('mainPath',f.main_path,'thumbPath',f.thumb_path,'bytes',f.bytes,'thumbBytes',f.thumb_bytes,
    'mimeType',f.mime_type,'thumbMimeType',f.thumb_mime_type,'bucket',f.bucket,'width',f.width,'height',f.height,
    'thumbWidth',f.thumb_width,'thumbHeight',f.thumb_height,'expiresAt',f.expires_at)
    from public.wardrobe_visualization_files f where f.job_id=j.id and f.status='active' and f.expires_at>now()) end)
 from public.wardrobe_visualizations j left join wardrobe_private.c_attempts a on a.id=j.id where j.id=p_id;
$$;
alter function wardrobe_private.visualization_json(uuid) rename to visualization_json_p33b;
create function wardrobe_private.visualization_json(p_account uuid) returns jsonb language sql stable set search_path='' as $$
 select wardrobe_private.visualization_json_p33b(p_account)||jsonb_build_object('mode','off',
  'consent',jsonb_build_object('accepted',coalesce(c.accepted,false),'version','p33c-ai-v1.1','revision',coalesce(c.revision,0)),
  'pilot',jsonb_build_object('id',t.id,'status',t.status,'eligible',m.id is not null,'startsAt',t.starts_at,'endsAt',t.ends_at,
   'maxSends',60,'accountMaxSends',30,'dailyMaxSends',5,'budgetPln',25,'blocked',true,
   'sentCount',(select count(*) from wardrobe_private.c_attempts where trial_id=t.id and sent_at is not null)
      +coalesce((select sum(archived_sends) from wardrobe_private.c_members where trial_id=t.id),0),
   'accountSentCount',(select count(*) from wardrobe_private.c_attempts where member_id=m.id and sent_at is not null)+coalesce(m.archived_sends,0),
   'dailySentCount',(select count(*) from wardrobe_private.c_attempts where member_id=m.id and sent_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC'),
   'spentPln',coalesce(b.spent_cents,0)/100.0,'reservedPln',coalesce(b.reserved_cents,0)/100.0,
   'availablePln',greatest(0,least(2500-coalesce(b.spent_cents+b.reserved_cents,0),2500-coalesce(mon.spent_cents+mon.reserved_cents,0)))/100.0))
 from wardrobe_private.c_trials t left join wardrobe_private.c_members m on m.trial_id=t.id and m.account_id=p_account
 left join wardrobe_private.c_consents c on c.account_id=p_account
 left join wardrobe_private.ai_budgets b on b.scope='trial:'||t.id
 left join wardrobe_private.ai_budgets mon on mon.scope='month:'||to_char(now() at time zone 'UTC','YYYY-MM') where t.id='p33c-v1';
$$;

alter function public.wardrobe_execute(text,jsonb) rename to wardrobe_execute_p33b;
revoke all on function public.wardrobe_execute_p33b(text,jsonb) from public,anon,authenticated,service_role;
create function public.wardrobe_execute(p_action text,p_payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); i wardrobe_private.c_intents; c wardrobe_private.c_consents; snapshot jsonb; bodyrev bigint; stylerev bigint; jid uuid;
begin
 if uid is null then raise exception 'UNAUTHENTICATED'; end if;
 if p_action='requestVisualization' then raise exception 'AI_DISABLED'; end if;
 if p_action='export' then
  perform wardrobe_private.assert_account(uid);
  return public.wardrobe_execute_p33b(p_action,p_payload)||jsonb_build_object('aiIntents',coalesce(
   (select jsonb_agg(wardrobe_private.c_intent_json(id) order by created_at) from wardrobe_private.c_intents where account_id=uid),'[]'::jsonb));
 end if;
 if p_action not in('prepareVisualization','setAiConsent','deleteAiData') then return public.wardrobe_execute_p33b(p_action,p_payload); end if;
 perform wardrobe_private.assert_account(uid);
 insert into wardrobe_private.c_consents(account_id) values(uid) on conflict do nothing;
 select * into c from wardrobe_private.c_consents where account_id=uid;
 if p_action='prepareVisualization' then
  if not exists(select 1 from wardrobe_private.c_trials where id=p_payload->>'trialId') then raise exception 'NOT_FOUND'; end if;
  select revision into bodyrev from public.wardrobe_body_fit where account_id=uid;
  select revision into stylerev from public.wardrobe_styling where account_id=uid;
  if bodyrev is distinct from (p_payload->>'expectedBodyRevision')::bigint or stylerev is distinct from (p_payload->>'expectedStylingRevision')::bigint then raise exception 'CONFLICT'; end if;
  snapshot:=wardrobe_private.c_snapshot(uid,(p_payload->>'outfitId')::uuid);
  -- md5 is an idempotency key, not authenticity. Immutable photo fingerprint is
  -- SHA256 of both actual upload variants and is verified by the worker adapter.
  insert into wardrobe_private.c_intents(trial_id,account_id,outfit_id,fingerprint,snapshot,body_revision,styling_revision,consent_revision)
  values(p_payload->>'trialId',uid,(p_payload->>'outfitId')::uuid,md5(snapshot::text),snapshot,bodyrev,stylerev,c.revision)
  on conflict(trial_id,account_id,fingerprint) do update set consent_revision=case when c_intents.job_id is null then excluded.consent_revision else c_intents.consent_revision end,
   styling_revision=case when c_intents.job_id is null then excluded.styling_revision else c_intents.styling_revision end,
   expires_at=case when c_intents.job_id is null then now()+interval '15 minutes' else c_intents.expires_at end returning * into i;
  return wardrobe_private.c_intent_json(i.id);
 elsif p_action='setAiConsent' then
  if p_payload->'accepted' is distinct from 'false'::jsonb then raise exception 'AI_DISABLED'; end if;
  if p_payload->>'consentVersion' is distinct from 'p33c-ai-v1.1' then raise exception 'AI_CONSENT_REQUIRED'; end if;
  if c.revision is distinct from (p_payload->>'expectedConsentRevision')::bigint then raise exception 'CONFLICT'; end if;
  update wardrobe_private.c_consents set accepted=false,revision=revision+1 where account_id=uid returning * into c;
  for jid in select id from public.wardrobe_visualizations where account_id=uid and c_intent_id is not null and status in('reserved','sent','outcome_unknown') loop
   perform wardrobe_private.cancel_job(jid); end loop;
  return jsonb_build_object('accepted',c.accepted,'version',c.version,'revision',c.revision);
 else
  if coalesce((select revision from public.wardrobe_body_fit where account_id=uid),0) is distinct from (p_payload->>'expectedRevision')::bigint then raise exception 'CONFLICT'; end if;
  for jid in select id from public.wardrobe_visualizations where account_id=uid loop perform wardrobe_private.cancel_job(jid,true); end loop;
  return jsonb_build_object('status',case when exists(select 1 from public.wardrobe_visualization_files where account_id=uid) then 'pending' else 'deleted' end);
 end if;
end; $$;

-- Caller RLS determines variant, bucket and MIME. File extension never grants
-- access or chooses the privileged Storage bucket. Returned bytes are rechecked
-- by the Edge handler after download, so in-flight deletion blocks delivery.
create function public.wardrobe_photo_variant(p_path text) returns jsonb language sql stable security invoker set search_path='' as $$
 select v from (
  select jsonb_build_object('path',p_path,'bucket','wardrobe-private','mimeType','image/jpeg',
   'bytes',case when p_path=p.main_path then p.bytes else p.thumb_bytes end,'main',p_path=p.main_path) v
  from public.wardrobe_photos p where p_path=p.main_path or p_path=p.thumb_path
  union all
  select jsonb_build_object('path',p_path,'bucket',f.bucket,'mimeType',case when p_path=f.main_path then f.mime_type else f.thumb_mime_type end,
   'bytes',case when p_path=f.main_path then f.bytes else f.thumb_bytes end,'main',p_path=f.main_path,
   'width',case when p_path=f.main_path then f.width else f.thumb_width end,'height',case when p_path=f.main_path then f.height else f.thumb_height end) v
  from public.wardrobe_visualization_files f where p_path=f.main_path or p_path=f.thumb_path
 ) variants limit 1;
$$;
create or replace function public.wardrobe_result_readable(p_job uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.wardrobe_visualizations j where j.id=p_job and j.account_id=auth.uid()
  and public.wardrobe_is_active(j.account_id) and j.status='succeeded' and not j.hidden and not j.cancel_requested
  and j.expires_at>now() and wardrobe_private.ai_inputs_current(j.id));
$$;
alter function public.wardrobe_expire_uploads() rename to wardrobe_expire_uploads_p33b;
revoke all on function public.wardrobe_expire_uploads_p33b() from public,anon,authenticated,service_role;
create function public.wardrobe_expire_uploads() returns void language plpgsql security definer set search_path='' as $$
begin
 perform public.wardrobe_expire_uploads_p33b();
 -- Personal job/input metadata expires even if a provider cost is unresolved;
 -- the separate minimal receipt retains that hold without an account/photo link.
 update wardrobe_private.c_intents i set snapshot='{}',outfit_id=null from wardrobe_private.c_attempts a
  where a.id=i.job_id and coalesce(a.completed_at,a.created_at)<now()-interval '90 days';
 delete from public.wardrobe_visualizations j where c_intent_id is not null and coalesce(completed_at,created_at)<now()-interval '90 days'
  and not exists(select 1 from public.wardrobe_visualization_files f where f.job_id=j.id);
 update wardrobe_private.c_intents i set snapshot='{}',outfit_id=null where job_id is not null and created_at<now()-interval '90 days'
  and not exists(select 1 from wardrobe_private.c_attempts a where a.id=i.job_id)
  and not exists(select 1 from public.wardrobe_visualizations j where j.id=i.job_id);
 update wardrobe_private.c_members m set archived_sends=archived_sends+(select count(*) from wardrobe_private.c_attempts a
  where a.member_id=m.id and a.sent_at is not null and a.completed_at<now()-interval '90 days' and a.reserved_cents=0
   and not exists(select 1 from public.wardrobe_visualizations j where j.id=a.id));
 delete from wardrobe_private.c_attempts a where completed_at<now()-interval '90 days' and reserved_cents=0
  and not exists(select 1 from public.wardrobe_visualizations j where j.id=a.id);
 update wardrobe_private.c_members m set account_id=null from wardrobe_private.c_trials t
  where m.trial_id=t.id and t.ends_at<now() and not exists(select 1 from wardrobe_private.c_attempts a
   where a.member_id=m.id and coalesce(a.completed_at,a.created_at)>=now()-interval '90 days');
 -- Unsubmitted previews carry private input references only briefly. Used
 -- intent tombstones remain throughout the trial and technical retention so
 -- deletion/reinstallation cannot reopen a paid signature.
 delete from wardrobe_private.c_intents where job_id is null and expires_at<now()-interval '24 hours';
 delete from wardrobe_private.c_intents i using wardrobe_private.c_trials t where i.trial_id=t.id
  and t.ends_at<now() and i.snapshot='{}' and not exists(select 1 from public.wardrobe_visualizations j where j.c_intent_id=i.id);
end; $$;
revoke all on function public.wardrobe_expire_uploads() from public,anon,authenticated;
grant execute on function public.wardrobe_expire_uploads() to service_role;
revoke all on all functions in schema wardrobe_private from public,anon,authenticated,service_role;
revoke all on function public.wardrobe_c_plan(uuid),public.wardrobe_c_reserve(uuid,uuid,uuid,bigint),public.wardrobe_c_mark_sent(uuid),
 public.wardrobe_c_manifest(uuid,uuid,integer,integer,text,text,text,integer,integer),public.wardrobe_c_complete(uuid,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.wardrobe_c_plan(uuid),public.wardrobe_c_reserve(uuid,uuid,uuid,bigint),public.wardrobe_c_mark_sent(uuid),
 public.wardrobe_c_manifest(uuid,uuid,integer,integer,text,text,text,integer,integer),public.wardrobe_c_complete(uuid,jsonb,boolean) to service_role;
revoke all on function public.wardrobe_execute(text,jsonb),public.wardrobe_photo_variant(text) from public,anon;
grant execute on function public.wardrobe_execute(text,jsonb),public.wardrobe_photo_variant(text) to authenticated;
-- Retired B admission cannot be reopened through a service HTTP request. Its
-- close/settlement/cleanup and historical receipts remain intact.
revoke all on function public.wardrobe_b_provision(jsonb),public.wardrobe_b_activate(text),public.wardrobe_b_plan(uuid,text),
 public.wardrobe_b_reserve(uuid,uuid,text,jsonb,text),public.wardrobe_b_mark_sent(uuid,uuid,jsonb,text),
 public.wardrobe_b_manifest(uuid,uuid,uuid,integer,integer,text,text) from service_role;
