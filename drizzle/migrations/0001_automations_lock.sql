CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS automation_lock_until timestamptz;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS automation_last_run_at timestamptz;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS automation_last_summary text;