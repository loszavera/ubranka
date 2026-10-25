-- Operator-only hosted SQL smoke. Replace __MANIFEST_BASE64__ with base64 UTF-8
-- JSON of the final synthetic manifest (never raw SQL interpolation). Run this
-- ENTIRE script in one transaction. There is no HTTP/provider/storage call.
-- All trial slots, fake settlement fixtures and budget changes roll back.
-- No OpenAI key is read, required, or inferred from this test. The sequential
-- transaction checks SQL rules, not concurrent hosted sessions or paid dispatch.
-- After this whole batch succeeds, use a NEW read to compare trial/cases/jobs,
-- body AI consent, ai_control and budget rows against the pre-test baseline.
-- If a client stops the batch on error, ensure ROLLBACK/session close completes;
-- do not reuse a pooled connection that still holds this transaction open.
begin;
select public.wardrobe_b_provision(convert_from(decode('__MANIFEST_BASE64__','base64'),'UTF8')::jsonb);
do $$
declare c wardrobe_private.b_cases; a uuid; jid uuid; j jsonb; original_job uuid;
begin
  if has_function_privilege('authenticated','public.wardrobe_b_reserve(uuid,uuid,text,jsonb,text)','execute')
    or has_function_privilege('anon','public.wardrobe_b_activate(text)','execute') then raise exception 'SMOKE_BAD_GRANTS'; end if;
  perform public.wardrobe_b_activate((select manifest_sha256 from wardrobe_private.b_trial));
  for c in select * from wardrobe_private.b_cases order by id loop
    jid:=gen_random_uuid();
    j:=public.wardrobe_b_reserve(c.account_id,jid,c.id,c.input_hashes,c.prompt_sha256);
    if (j->>'reservedPln')::numeric<>(case when c.id='B01' then 10 else 1 end) then raise exception 'SMOKE_RESERVATION'; end if;
    if public.wardrobe_b_reserve(c.account_id,jid,c.id,c.input_hashes,c.prompt_sha256)->>'id'<>jid::text then raise exception 'SMOKE_REPLAY'; end if;
    begin
      perform public.wardrobe_b_reserve(c.account_id,gen_random_uuid(),c.id,c.input_hashes,c.prompt_sha256);
      raise exception 'SMOKE_ALLOWED_NEW_ID';
    exception when raise_exception then if sqlerrm<>'CASE_USED' then raise; end if; end;
    if not public.wardrobe_b_mark_sent(c.account_id,jid,c.input_hashes,c.prompt_sha256) or public.wardrobe_b_mark_sent(c.account_id,jid,c.input_hashes,c.prompt_sha256) then raise exception 'SMOKE_CLAIM'; end if;
    -- Synthetic accounting fixture only; no provider was invoked.
    j:=public.wardrobe_b_complete(c.account_id,jid,'{"textInputTokens":230,"imageInputTokens":3072,"imageOutputTokens":343}',false,'{"fixture":true}');
    if (j->>'spentPln')::numeric<>0.25 or j->>'status'<>'failed' then raise exception 'SMOKE_SETTLEMENT'; end if;
  end loop;
  if (select count(*) from wardrobe_private.b_cases where sent_at is not null)<>6 or
    (select spent_cents from wardrobe_private.ai_budgets where scope='trial:p33b-v1')<>150 then raise exception 'SMOKE_TOTALS'; end if;
  perform public.wardrobe_b_close();
  if wardrobe_private.b_open(c.account_id) then raise exception 'SMOKE_CLOSE'; end if;
end; $$;
select 'PASS: six synthetic SQL assertions; zero provider calls; the following ROLLBACK must complete' as result;
rollback;
