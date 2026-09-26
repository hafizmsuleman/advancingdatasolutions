-- lovable-cron-fallback-reviewed: user-specified 5-minute cadence for time-based reminders, 6h release and nudges
INSERT INTO private.job_secrets(name, value)
SELECT 'automations', encode(extensions.gen_random_bytes(32), 'hex')
ON CONFLICT (name) DO NOTHING;

CREATE OR REPLACE FUNCTION public.check_job_token(p_name text, p_token text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = private, public AS $$
  select exists (select 1 from private.job_secrets where name = p_name and value = p_token and length(p_token) >= 32);
$$;
REVOKE ALL ON FUNCTION public.check_job_token(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_job_token(text, text) TO service_role;

SELECT cron.schedule('ads-automations-5min', '*/5 * * * *', $cron$
  select net.http_post(
    url := 'https://project--639d3410-a4ca-40ad-b551-be830977a438-dev.lovable.app/api/public/hooks/automations',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (select value from private.job_secrets where name = 'automations')),
    body := '{}'::jsonb);
$cron$);