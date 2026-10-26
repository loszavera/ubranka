# C1: dwie zatwierdzane transakcje, AI stale OFF

Tylko operator PostgreSQL i świeże dwa konta syntetyczne `@example.com`.
Nie używać `service_role` do core: brak USAGE/EXECUTE jest zamierzony.
Nie uruchamiać żadnego `mark_sent`, workera ani dostawcy w próbie rezerwacji.
`p33c-v1`, B, globalne `blocked=true` i `c_enabled()=false` pozostają niezmienione.
Podmienić wszystkie `<...>` na dokładne UUID z lokalnej fixture. Wyniki SQL i
identyfikatory trzymać tylko w ignorowanych artefaktach.

## Przygotowanie (oddzielny commit)

Zachować snapshot finansowy B i wspólnego bieżącego miesiąca przed próbą.

```sql
begin;
do $$begin
 if wardrobe_private.c_enabled() or not (select blocked from wardrobe_private.ai_control where singleton)
  or (select status from wardrobe_private.c_trials where id='p33c-v1')<>'prepared'
  or not (select closed from wardrobe_private.b_trial) then raise exception 'QA_GUARD'; end if;
 if (select count(*) from auth.users where id in('<ACCOUNT_A>','<ACCOUNT_B>') and email like '%@example.com')<>2
  then raise exception 'QA_GUARD'; end if;
end$$;
insert into wardrobe_private.c_trials(id,status,starts_at,ends_at,blocked)
 values('p33c-fixture-<RUN_UUID>','active',now(),now()+interval '30 days',false);
insert into wardrobe_private.c_members(trial_id,slot,account_id)
 values('p33c-fixture-<RUN_UUID>',1,'<ACCOUNT_A>'),('p33c-fixture-<RUN_UUID>',2,'<ACCOUNT_B>');
commit;
```

Z własnymi syntetycznymi JWT wywołać zwykłe `prepareVisualization` dla tego
fixture trial i bieżących body/styling revisions; zapisać dwa intent UUID i ich
consentRevision. To nie akceptuje zgody ani nie rezerwuje kosztu. Zwykłe
`requestVisualization` oraz service `wardrobe_c_reserve` mają nadal odmówić.

## Sesja A — SQL editor (uruchomić pierwszą)

```sql
begin;
set local statement_timeout='35s';
select set_config('application_name','c1-holder-<RUN_UUID>',true);
select wardrobe_private.c_reserve_core('<ACCOUNT_A>','<JOB_A>','<INTENT_A>',<EPOCH_A>);
select pg_sleep(18);
commit;
```

## Sesja B — niezależny kanał MCP SQL podczas sleep

Ten blok oczekuje rzeczywistego `AI_BUSY` po COMMIT A. Każdy inny wyjątek jest
błędem. Cała transakcja B też kończy się COMMIT, ale nie tworzy rezerwacji.

```sql
begin;
set local statement_timeout='35s';
select set_config('application_name','c1-waiter-<RUN_UUID>',true);
create temporary table c1_observation(wait_ms numeric, outcome text) on commit preserve rows;
do $$declare started timestamptz:=clock_timestamp(); result text;
begin
 begin
  perform wardrobe_private.c_reserve_core('<ACCOUNT_B>','<JOB_B>','<INTENT_B>',<EPOCH_B>);
  raise exception 'QA_UNEXPECTED_SECOND_RESERVATION';
 exception when raise_exception then
  if sqlerrm<>'AI_BUSY' then raise; end if;
  result:=sqlerrm;
 end;
 insert into c1_observation values(extract(epoch from clock_timestamp()-started)*1000,result);
end$$;
commit;
select * from c1_observation;
drop table c1_observation;
```

Jeżeli da się wykonać trzeci odczyt podczas oczekiwania, sprawdzić
`pg_blocking_pids()` wyłącznie dla dokładnych dwóch application_name, bez
odczytu cudzych zapytań. Sam dodatni czas nie dowodzi blokady; COMMIT A + AI_BUSY
B + dokładnie jedna trwała rezerwacja dowodzą ograniczenia zwycięzcy. Brak
nakładania sesji trzeba ujawnić zamiast ogłaszać PASS współbieżności.

## Stan końcowy i sprzątanie

Przed sprzątaniem: dokładnie jeden `c_attempts.status='reserved'` w tym trial,
zero sent_at, jedna intencja z job_id, jedyna rezerwa na dwóch właściwych
ledgerach; C1 public API nadal OFF. Zapisać dowód przed kasowaniem.

```sql
begin;
do $$declare tid text:='p33c-fixture-<RUN_UUID>'; j uuid;
begin
 if tid !~ '^p33c-fixture-[a-f0-9-]{36}$' or wardrobe_private.c_enabled()
  or (select count(*) from wardrobe_private.c_members where trial_id=tid and account_id in('<ACCOUNT_A>','<ACCOUNT_B>'))<>2
  or exists(select 1 from wardrobe_private.c_attempts where trial_id=tid and (sent_at is not null or spent_cents<>0))
  then raise exception 'QA_GUARD'; end if;
 for j in select id from wardrobe_private.c_attempts where trial_id=tid loop perform wardrobe_private.cancel_job(j,true); end loop;
 if exists(select 1 from wardrobe_private.c_attempts where trial_id=tid and reserved_cents<>0)
  or exists(select 1 from public.wardrobe_visualization_files f join wardrobe_private.c_attempts a on a.id=f.job_id where a.trial_id=tid)
  then raise exception 'QA_GUARD'; end if;
 delete from public.wardrobe_visualizations where id in(select id from wardrobe_private.c_attempts where trial_id=tid);
 delete from wardrobe_private.c_intents where trial_id=tid;
 delete from wardrobe_private.c_attempts where trial_id=tid;
 delete from wardrobe_private.c_members where trial_id=tid;
 delete from wardrobe_private.ai_budgets where scope='trial:'||tid and reserved_cents=0 and spent_cents=0;
 delete from wardrobe_private.c_trials where id=tid;
end$$;
commit;
```

Nie kasować wspólnego miesięcznego ledgeru. Jego kwoty po zwolnieniu mają być
identyczne z baseline, B bez zmian. Root usuwa tylko własne fixture/Auth przez
normalny cleanup po dalszych testach. To dowód SQL na hostingu; nie dowodzi
płatnego dostawcy, C2 ani zachowania telefonu.
