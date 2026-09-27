-- lovable-cron-fallback-reviewed: existing user-specified 5-minute job, only its URL moves to the published app
SELECT cron.schedule('ads-automations-5min', '*/5 * * * *', $cron$
  select net.http_post(
    url := 'https://advancingdatasolutions.lovable.app/api/public/hooks/automations',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (select value from private.job_secrets where name = 'automations')),
    body := '{}'::jsonb);
$cron$);

DO $$
DECLARE f record; def text;
BEGIN
  FOR f IN SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND p.proname IN ('generate_demo_data','reset_demo_data') LOOP
    def := pg_get_functiondef(f.oid);
    IF position('book.advancingdatasolutions.com' in def) > 0 THEN
      EXECUTE replace(def, 'https://book.advancingdatasolutions.com', 'https://advancingdatasolutions.lovable.app');
    END IF;
  END LOOP;
END $$;

UPDATE public.messages
SET body = replace(replace(body, 'https://book.advancingdatasolutions.com', 'https://advancingdatasolutions.lovable.app'),
                   'https://id-preview--639d3410-a4ca-40ad-b551-be830977a438.lovable.app', 'https://advancingdatasolutions.lovable.app')
WHERE body LIKE '%book.advancingdatasolutions.com%' OR body LIKE '%id-preview--%';