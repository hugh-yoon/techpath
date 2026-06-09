-- Ingestion cron schedules (pg_cron + pg_net)
--
-- CADENCE (confirmed):
--   MONTHLY — banner-sync  → course/section info from GT Banner
--   DAILY   — rmp-sync     → teacher ratings, reviews, difficulty from RMP
--
-- Run AFTER deploying banner-sync and rmp-sync Edge Functions.
-- Store project_url and cron_secret in Vault before uncommenting schedules.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Store secrets in Supabase Vault before enabling:
--   project_url  → https://<project-ref>.supabase.co
--   cron_secret  → random bearer token (set CRON_SECRET on Edge Functions)

-- MONTHLY: course & section info (Banner) — 1st of month, 03:00 UTC
-- SELECT cron.schedule(
--   'banner-sync-monthly',
--   '0 3 1 * *',
--   $$
--   SELECT net.http_post(
--     url := (SELECT decrypted_secret FROM vault.decrypted_secrets
--             WHERE name = 'project_url') || '/functions/v1/banner-sync',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || (
--         SELECT decrypted_secret FROM vault.decrypted_secrets
--         WHERE name = 'cron_secret'
--       )
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );

-- DAILY: teacher ratings, reviews, difficulty (RMP) — every day, 04:00 UTC
-- SELECT cron.schedule(
--   'rmp-sync-daily',
--   '0 4 * * *',
--   $$
--   SELECT net.http_post(
--     url := (SELECT decrypted_secret FROM vault.decrypted_secrets
--             WHERE name = 'project_url') || '/functions/v1/rmp-sync',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || (
--         SELECT decrypted_secret FROM vault.decrypted_secrets
--         WHERE name = 'cron_secret'
--       )
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
