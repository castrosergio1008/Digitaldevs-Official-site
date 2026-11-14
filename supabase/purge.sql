-- Retention purge (design doc section 4.5):
--   leads       -> 12 months
--   chat_events -> 90 days
--
-- Optional: run it on a schedule (Supabase pg_cron, or a Vercel Cron route
-- that executes these statements) or manually from the SQL editor. The client
-- can disable it if they prefer to keep the data longer.
--
-- For large tables, delete in batches instead of a single statement, e.g.:
--   delete from chat_events where id in (
--     select id from chat_events where created_at < now() - interval '90 days' limit 1000
--   );

delete from chat_events where created_at < now() - interval '90 days';
delete from leads where created_at < now() - interval '12 months';
