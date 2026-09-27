create or replace function public.reset_demo_data()
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.is_admin() then raise exception 'Forbidden'; end if;
  if not (select demo_mode from public.settings where id = 1) then raise exception 'Demo mode is off'; end if;
  perform pg_advisory_xact_lock(18092026);
  if exists (select 1 from public.bookings b join public.leads l on l.id=b.lead_id where l.is_demo and not b.is_demo) then
    raise exception 'Cannot reset demo data linked to real bookings';
  end if;
  if exists (select 1 from public.messages m left join public.bookings b on b.id=m.booking_id left join public.leads l on l.id=m.lead_id where not m.is_demo and (b.is_demo or l.is_demo)) then
    raise exception 'Cannot reset demo data linked to real messages';
  end if;
  if exists (select 1 from public.bookings b join public.bookings prior on prior.id=b.rescheduled_from_id where prior.is_demo and not b.is_demo) then
    raise exception 'Cannot reset demo data linked to real bookings';
  end if;
  if exists (select 1 from public.leads where id::text like '00000000-0000-4000-a000-0000000000%' and not is_demo) then
    raise exception 'Sample ID belongs to a real lead';
  end if;
  if exists (select 1 from public.bookings where id::text like '00000000-0000-4000-b000-0000000000%' and not is_demo) then
    raise exception 'Sample ID belongs to a real booking';
  end if;
  delete from public.messages where is_demo;
  delete from public.bookings where is_demo;
  delete from public.leads where is_demo;
insert into public.leads (id, source, status, full_name, email, email_verified_at, company, role, project_area, platform, need, timeline, budget_range, notes, client_tz, nudge_count, last_nudged_at, consent_at, is_demo, created_at) values
 ('00000000-0000-4000-a000-000000000001','form','booked','Megan Holloway','megan.holloway@northwindlogistics.com','2026-09-26T19:42Z','Northwind Logistics','Head of Data Engineering','data','databricks','migration','1–3 months','20k_50k','Moving 40+ SSIS packages and an on-prem SQL Server warehouse to a Databricks lakehouse. Want a phased plan and a cost estimate.','America/New_York',0,null,'2026-09-26T19:30Z',true,'2026-09-26T19:30Z'),
 ('00000000-0000-4000-a000-000000000002','form','booked','James Whitfield','j.whitfield@harbourinsure.co.uk','2026-09-26T22:05Z','Harbour Insurance Group','Director of Analytics','ai','azure','rag_chatbot','Under 1 month','over_50k','Claims handlers need answers from 12 years of policy documents. Azure OpenAI is approved internally; data must stay in UK South.','Europe/London',0,null,'2026-09-26T22:00Z',true,'2026-09-26T22:00Z'),
 ('00000000-0000-4000-a000-000000000003','linkedin','booked','Omar Al Mansoori','omar.mansoori@gulfretailgroup.ae','2026-09-27T01:18Z','Gulf Retail Group','CTO','web','azure','ai_api','1–3 months','20k_50k','Customer-facing product search API with semantic ranking for 3 regional storefronts, built on ASP.NET Core.','Asia/Dubai',0,null,'2026-09-27T01:10Z',true,'2026-09-27T01:10Z'),
 ('00000000-0000-4000-a000-000000000004','form','booked','Priya Raman','priya.raman@clearpathhealth.com','2026-09-26T23:40Z','Clearpath Health','Data Platform Lead','data','snowflake','cost','3–6 months','under_5k','Snowflake bill doubled this year. Looking for a quick review of warehouses and query patterns.','America/Chicago',0,null,'2026-09-26T23:30Z',true,'2026-09-26T23:30Z'),
 ('00000000-0000-4000-a000-000000000005','form','booked','Sarah Kennedy','s.kennedy@brightwaterenergy.co.uk','2026-09-25T14:10Z','Brightwater Energy','Engineering Manager','web','not_decided','app_modernization','6+ months','not_sure','Legacy .NET Framework 4.6 customer portal. Want to understand options for moving to ASP.NET Core.','Europe/London',0,null,'2026-09-25T14:00Z',true,'2026-09-25T14:00Z'),
 ('00000000-0000-4000-a000-000000000006','email','booked','Khalid Al Harbi','k.alharbi@najdfinance.sa','2026-09-20T09:30Z','Najd Finance','Head of AI','ai','aws','llm_data_prep','1–3 months','over_50k','Preparing Arabic and English contract data for a Bedrock-based assistant.','Asia/Riyadh',0,null,'2026-09-20T09:20Z',true,'2026-09-20T09:20Z'),
 ('00000000-0000-4000-a000-000000000007','form','booked','Daniel Brooks','dbrooks@summitmfg.com','2026-09-19T17:05Z','Summit Manufacturing','IT Director','data','fabric','data_platform','3–6 months','5k_20k','Evaluating Fabric for plant sensor data and Power BI reporting.','America/Denver',0,null,'2026-09-19T17:00Z',true,'2026-09-19T17:00Z'),
 ('00000000-0000-4000-a000-000000000008','form','booked','Aisha Rahman','aisha@doharealty.qa','2026-09-24T08:20Z','Doha Realty Partners','Digital Transformation Lead','ai','snowflake','vector_search','1–3 months','20k_50k','Property listing search by natural language using Snowflake Cortex.','Asia/Qatar',0,null,'2026-09-24T08:10Z',true,'2026-09-24T08:10Z'),
 ('00000000-0000-4000-a000-000000000009','form','started','Tom Ashby','tom.ashby@ledgerlinepay.co.uk','2026-09-25T08:05Z','Ledgerline Payments','VP Engineering','ai','azure','ai_readiness','1–3 months','20k_50k',null,'Europe/London',1,'2026-09-26T08:00Z','2026-09-25T08:00Z',true,'2026-09-25T08:00Z'),
 ('00000000-0000-4000-a000-000000000010','linkedin','new','Fatima Al Zaabi','fatima@emiratesmedtech.ae',null,'Emirates MedTech','Head of Product','web','azure','web_app','3–6 months','20k_50k',null,'Asia/Dubai',0,null,null,true,'2026-09-26T16:45Z'),
 ('00000000-0000-4000-a000-000000000011','email','started','Ryan Mitchell','rmitchell@pinecrestbank.com','2026-09-24T11:05Z','Pinecrest Community Bank','Data Manager','data','azure','governance','3–6 months','5k_20k',null,'America/New_York',2,'2026-09-26T11:00Z','2026-09-24T11:00Z',true,'2026-09-24T11:00Z'),
 ('00000000-0000-4000-a000-000000000012','form','cold','Hannah Clarke','hannah.clarke@oakfieldretail.co.uk','2026-09-20T10:05Z','Oakfield Retail','Analytics Lead','ai','snowflake','rag_chatbot','6+ months','not_sure',null,'Europe/London',2,'2026-09-22T10:00Z','2026-09-20T10:00Z',true,'2026-09-20T10:00Z'),
 ('00000000-0000-4000-a000-000000000013','whatsapp','new','Yousef Haddad','yousef@kuwaitlogix.com','2026-09-26T21:15Z','Kuwait Logix','Operations Director','data','aws','pipelines','1–3 months','20k_50k',null,'Asia/Kuwait',0,null,null,true,'2026-09-26T21:10Z'),
 ('00000000-0000-4000-a000-000000000014','form','new','Laura Bennett','laura.bennett@vantagesaas.com','2026-09-26T23:58Z','Vantage SaaS','CTO','web','aws','microservices','1–3 months','over_50k',null,'America/Los_Angeles',0,null,'2026-09-26T23:55Z',true,'2026-09-26T23:55Z');

insert into public.bookings (id, code, lead_id, email, session_type, length_min, start_utc, end_utc, blocked_until_utc, client_tz, status, attendance_confirmed_at, released_at, cancelled_at, is_demo, created_at) values
 ('00000000-0000-4000-b000-000000000001','ADS-7K2Q','00000000-0000-4000-a000-000000000001','megan.holloway@northwindlogistics.com','free_consultation',60,'2026-09-29T13:00Z','2026-09-29T14:00Z','2026-09-29T14:15Z','America/New_York','attendance_confirmed','2026-09-26T20:00Z',null,null,true,'2026-09-26T19:42Z'),
 ('00000000-0000-4000-b000-000000000002','ADS-3M9T','00000000-0000-4000-a000-000000000002','j.whitfield@harbourinsure.co.uk','free_consultation',60,'2026-09-29T10:30Z','2026-09-29T11:30Z','2026-09-29T11:45Z','Europe/London','confirmed',null,null,null,true,'2026-09-26T22:05Z'),
 ('00000000-0000-4000-b000-000000000003','ADS-8PWD','00000000-0000-4000-a000-000000000003','omar.mansoori@gulfretailgroup.ae','free_consultation',60,'2026-09-30T11:00Z','2026-09-30T12:00Z','2026-09-30T12:15Z','Asia/Dubai','confirmed',null,null,null,true,'2026-09-27T01:18Z'),
 ('00000000-0000-4000-b000-000000000004','ADS-2HVN','00000000-0000-4000-a000-000000000004','priya.raman@clearpathhealth.com','free_consultation',30,'2026-10-01T15:00Z','2026-10-01T15:30Z','2026-10-01T15:45Z','America/Chicago','confirmed',null,null,null,true,'2026-09-26T23:40Z'),
 ('00000000-0000-4000-b000-000000000005','ADS-6RZC','00000000-0000-4000-a000-000000000005','s.kennedy@brightwaterenergy.co.uk','free_consultation',30,'2026-10-02T12:00Z','2026-10-02T12:30Z','2026-10-02T12:45Z','Europe/London','attendance_confirmed','2026-09-25T15:00Z',null,null,true,'2026-09-25T14:10Z'),
 ('00000000-0000-4000-b000-000000000006','ADS-9QVB','00000000-0000-4000-a000-000000000006','k.alharbi@najdfinance.sa','free_consultation',60,'2026-09-24T11:00Z','2026-09-24T12:00Z','2026-09-24T12:15Z','Asia/Riyadh','completed','2026-09-23T09:00Z',null,null,true,'2026-09-20T09:30Z'),
 ('00000000-0000-4000-b000-000000000007','ADS-4TLE','00000000-0000-4000-a000-000000000007','dbrooks@summitmfg.com','free_consultation',60,'2026-09-23T16:00Z','2026-09-23T17:00Z','2026-09-23T17:15Z','America/Denver','released',null,'2026-09-23T10:00Z',null,true,'2026-09-19T17:05Z'),
 ('00000000-0000-4000-b000-000000000008','ADS-5JXA','00000000-0000-4000-a000-000000000008','aisha@doharealty.qa','free_consultation',60,'2026-10-05T10:00Z','2026-10-05T11:00Z','2026-10-05T11:15Z','Asia/Qatar','cancelled',null,null,'2026-09-25T09:00Z',true,'2026-09-24T08:20Z');

insert into public.ndas (booking_id, signer_name, signer_title, signer_email, signed_at) values
 ('00000000-0000-4000-b000-000000000001','Megan Holloway','Head of Data Engineering','megan.holloway@northwindlogistics.com','2026-09-26T20:10Z'),
 ('00000000-0000-4000-b000-000000000003','Omar Al Mansoori','CTO','omar.mansoori@gulfretailgroup.ae','2026-09-27T01:30Z'),
 ('00000000-0000-4000-b000-000000000005','Sarah Kennedy','Engineering Manager','s.kennedy@brightwaterenergy.co.uk','2026-09-25T14:30Z'),
 ('00000000-0000-4000-b000-000000000006','Khalid Al Harbi','Head of AI','k.alharbi@najdfinance.sa','2026-09-20T10:00Z');

insert into public.messages (type, status, booking_id, lead_id, to_email, subject, body, scheduled_utc, sent_at, minutes_saved, is_demo) values
 ('confirmation','sent','00000000-0000-4000-b000-000000000001','00000000-0000-4000-a000-000000000001','megan.holloway@northwindlogistics.com','You''re booked: Free Consultation, Tue 29 Sep',E'Hi Megan,\n\nThanks for booking a free 60-minute consultation with our engineers. Your call is on Tuesday 29 September at 9:00 am (your time).\n\nMeeting link: https://meet.google.com/xyz\n\nSpeak soon,\nAdvancing Data Solutions','2026-09-26T19:43Z','2026-09-26T19:43Z',10,true),
 ('nda_reminder','scheduled','00000000-0000-4000-b000-000000000002','00000000-0000-4000-a000-000000000002','j.whitfield@harbourinsure.co.uk','One step before our call: sign the NDA',E'Hi James,\n\nA quick reminder that you can sign our mutual NDA before Tuesday''s consultation.\n\nAdvancing Data Solutions','2026-09-27T00:05Z',null,5,true),
 ('confirmation','sent','00000000-0000-4000-b000-000000000003','00000000-0000-4000-a000-000000000003','omar.mansoori@gulfretailgroup.ae','You''re booked: Free Consultation, Wed 30 Sep',E'Hi Omar,\n\nThanks for booking a free 60-minute consultation with our engineers. Your call is on Wednesday 30 September at 3:00 pm (your time).\n\nAdvancing Data Solutions','2026-09-27T01:19Z','2026-09-27T01:19Z',10,true),
 ('nudge','failed',null,'00000000-0000-4000-a000-000000000009','tom.ashby@ledgerlinepay.co.uk','Still keen to talk about your GenAI project?',E'Hi Tom,\n\nYou started booking a consultation with us but didn''t pick a time. Our engineers have slots this week.\n\nAdvancing Data Solutions','2026-09-26T08:00Z',null,5,true),
 ('reminder_24h','scheduled','00000000-0000-4000-b000-000000000005','00000000-0000-4000-a000-000000000005','s.kennedy@brightwaterenergy.co.uk','Tomorrow: your consultation with our engineers',E'Hi Sarah,\n\nThis is a reminder that your free 30-minute consultation is tomorrow at 1:00 pm (your time).\n\nAdvancing Data Solutions','2026-10-01T12:00Z',null,5,true),
 ('release_notice','sent','00000000-0000-4000-b000-000000000007','00000000-0000-4000-a000-000000000007','dbrooks@summitmfg.com','We''ve released your consultation slot',E'Hi Daniel,\n\nWe didn''t receive an attendance confirmation, so we''ve released your slot. You''re welcome to book a new time whenever suits you.\n\nAdvancing Data Solutions','2026-09-23T10:00Z','2026-09-23T10:00Z',5,true),
 ('reminder_1h','cancelled','00000000-0000-4000-b000-000000000008','00000000-0000-4000-a000-000000000008','aisha@doharealty.qa','Starting in 1 hour',E'Hi Aisha,\n\nYour consultation starts in one hour.\n\nAdvancing Data Solutions','2026-10-05T09:00Z',null,5,true);
  update public.settings set virtual_clock_offset_min = 0 where id = 1;
end; $$;
revoke all on function public.reset_demo_data() from public, anon;
grant execute on function public.reset_demo_data() to authenticated;
