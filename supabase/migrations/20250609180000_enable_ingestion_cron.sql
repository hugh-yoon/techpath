-- Enable ingestion cron jobs (pg_cron + pg_net + Vault secrets required).

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Remove prior schedules if re-applying.
DO $$
DECLARE
	r record;
BEGIN
	FOR r IN
		SELECT jobid FROM cron.job
		WHERE jobname IN (
			'banner-sync-daily',
			'banner-sync-monthly-reset',
			'rmp-sync-daily'
		)
	LOOP
		PERFORM cron.unschedule(r.jobid);
	END LOOP;
END $$;

-- Daily Banner batch continuation (10 subjects per term per run).
SELECT cron.schedule(
	'banner-sync-daily',
	'0 3 * * *',
	$$
	SELECT net.http_post(
		url := (SELECT decrypted_secret FROM vault.decrypted_secrets
			WHERE name = 'project_url') || '/functions/v1/banner-sync',
		headers := jsonb_build_object(
			'Content-Type', 'application/json',
			'Authorization', 'Bearer ' || (
				SELECT decrypted_secret FROM vault.decrypted_secrets
				WHERE name = 'cron_secret'
			)
		),
		body := '{}'::jsonb
	);
	$$
);

-- Monthly full Banner reset (1st of month, 02:00 UTC).
SELECT cron.schedule(
	'banner-sync-monthly-reset',
	'0 2 1 * *',
	$$
	SELECT net.http_post(
		url := (SELECT decrypted_secret FROM vault.decrypted_secrets
			WHERE name = 'project_url') || '/functions/v1/banner-sync',
		headers := jsonb_build_object(
			'Content-Type', 'application/json',
			'Authorization', 'Bearer ' || (
				SELECT decrypted_secret FROM vault.decrypted_secrets
				WHERE name = 'cron_secret'
			)
		),
		body := '{"reset": true}'::jsonb
	);
	$$
);

-- Daily RMP professor + review sync (04:00 UTC).
SELECT cron.schedule(
	'rmp-sync-daily',
	'0 4 * * *',
	$$
	SELECT net.http_post(
		url := (SELECT decrypted_secret FROM vault.decrypted_secrets
			WHERE name = 'project_url') || '/functions/v1/rmp-sync',
		headers := jsonb_build_object(
			'Content-Type', 'application/json',
			'Authorization', 'Bearer ' || (
				SELECT decrypted_secret FROM vault.decrypted_secrets
				WHERE name = 'cron_secret'
			)
		),
		body := '{}'::jsonb
	);
	$$
);
