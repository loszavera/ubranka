-- Apply separately after the approved test/pilot project is provisioned.
-- Put project_url and wardrobe_cleanup_secret in Supabase Vault first, using
-- a local ignored file or the dashboard. Never commit either secret value.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.schedule('wardrobe-cleanup', '*/10 * * * *', $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/wardrobe-cleanup',
    headers := jsonb_build_object('Content-Type','application/json',
      'x-wardrobe-cleanup',(select decrypted_secret from vault.decrypted_secrets where name = 'wardrobe_cleanup_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
$job$);

-- No request body, image, token or profile is logged by application handlers.
-- Keep scheduler operational history within the application's seven-day goal.
select cron.schedule('wardrobe-prune-job-history', '47 3 * * *', $job$
  delete from cron.job_run_details where end_time < now() - interval '7 days'
    and jobid in (select jobid from cron.job where jobname in ('wardrobe-cleanup','wardrobe-prune-job-history'));
$job$);
