create or replace function public.generate_demo_data()
returns integer language plpgsql security definer set search_path = public, extensions as $$
declare
  r record; tz text; d date; n int := 0; wd int := 0; lid uuid; bid uuid; st timestamptz; tok text; first text;
  base date;
begin
  if not public.is_admin() then raise exception 'Forbidden'; end if;
  if not (select demo_mode from public.settings where id = 1) then raise exception 'Demo mode is off'; end if;
  perform pg_advisory_xact_lock(18092026);
  if exists (select 1 from public.leads where is_demo and email = 'l.carter@atlasfreight.com') then
    raise exception 'already_generated';
  end if;
  select team_timezone into tz from public.settings where id = 1;
  base := (now() at time zone tz)::date;

  for r in select * from (values
    (1,'Lauren Carter','l.carter@atlasfreight.com','Atlas Freight','VP Data','data','snowflake','pipelines','1–3 months','20k_50k','America/New_York','10:00',60,'confirmed',true,'Nightly loads from 30 carrier APIs into Snowflake are failing silently. Want a monitored, incremental pipeline design.'),
    (2,'Oliver Grant','oliver.grant@kingswayanalytics.co.uk','Kingsway Analytics','Head of AI','ai','azure','rag_chatbot','Under 1 month','over_50k','Europe/London','12:00',60,'attendance_confirmed',true,'Analysts want grounded answers over 8,000 research reports. Azure OpenAI approved; must stay in UK South.'),
    (3,'Mariam Al Suwaidi','mariam@alnoorhospitals.ae','Al Noor Hospitals','Director of Digital Health','ai','azure','vector_search','1–3 months','20k_50k','Asia/Dubai','15:00',30,'confirmed',false,'Clinical guideline search across Arabic and English documents.'),
    (4,'Felix Braun','f.braun@rheinwerk-auto.de','Rheinwerk Automotive','Lead Data Architect','data','databricks','data_platform','3–6 months','over_50k','Europe/Berlin','13:00',60,'completed',true,'Consolidating plant telemetry from 6 factories into a Databricks lakehouse.'),
    (5,'Ethan Morales','ethan.morales@lumenretail.com','Lumen Retail','Engineering Manager','web','aws','web_app','3–6 months','5k_20k','America/Chicago','10:00',30,'cancelled',false,'Store operations portal for 120 locations, replacing spreadsheets.'),
    (6,'Abdullah Al Qahtani','a.alqahtani@qamartelecom.sa','Qamar Telecom','Data Platform Manager','data','aws','migration','1–3 months','20k_50k','Asia/Riyadh','14:00',60,'released',false,'Moving an on-prem Teradata warehouse to AWS.'),
    (7,'Sanne de Vries','sanne.devries@nordhavnshipping.nl','Nordhavn Shipping','CTO','ai','databricks','llm_data_prep','1–3 months','20k_50k','Europe/Amsterdam','13:00',60,'confirmed',true,'Preparing 15 years of voyage reports for an internal LLM assistant.'),
    (8,'Grace Liu','grace.liu@pacificcrestins.com','Pacific Crest Insurance','Director of Engineering','web','azure','microservices','3–6 months','over_50k','America/Los_Angeles','10:00',60,'confirmed',false,'Breaking a claims monolith into ASP.NET Core services on Azure.'),
    (9,'Charlotte Evans','c.evans@thamesidehousing.org.uk','Thameside Housing','Data Manager','data','fabric','governance','3–6 months','5k_20k','Europe/London','14:00',30,'attendance_confirmed',false,'Setting up data governance and lineage in Microsoft Fabric.'),
    (10,'Hamad Al Thani','hamad@dohacapital.qa','Doha Capital Partners','Head of Technology','ai','snowflake','ai_readiness','1–3 months','20k_50k','Asia/Qatar','14:00',30,'cancelled',false,'Assessing whether our Snowflake data is ready for Cortex-based analytics.'),
    (11,'Noah Fischer','noah.fischer@alpenbank.ch',  'Alpen Private Bank','Head of Data','data','azure','cost','1–3 months','5k_20k','Europe/Zurich',null,null,'new',false,null),
    (12,'Emily Hart','emily.hart@brookfieldedu.com','Brookfield Education','CIO','web','aws','app_modernization','3–6 months','20k_50k','America/New_York',null,null,'nudged',false,null),
    (13,'Tariq Mahmood','tariq@gulfstarlogistics.ae','Gulfstar Logistics','Operations Director','data','not_decided','data_platform','6+ months','not_sure','Asia/Dubai',null,null,'nudged2',false,null)
  ) as t(i,name,email,company,role,area,platform,need,timeline,budget,ctz,ctime,len,status,nda,notes)
  loop
    lid := gen_random_uuid();
    first := split_part(r.name,' ',1);
    insert into public.leads (id, source, status, full_name, email, email_verified_at, company, role, project_area, platform, need, timeline, budget_range, notes, client_tz, nudge_count, last_nudged_at, consent_at, is_demo, created_at)
    values (lid, (case when r.i in (3,13) then 'linkedin' when r.i = 6 then 'email' else 'form' end)::lead_source,
      (case when r.status='new' then 'new' when r.status='nudged' then 'started' when r.status='nudged2' then 'cold' else 'booked' end)::lead_status,
      r.name, r.email, case when r.status='new' then null else now() - interval '2 days' end, r.company, r.role, r.area::project_area, r.platform::platform_type, r.need::need_type, r.timeline, r.budget::budget_range, r.notes, r.ctz,
      case when r.status='nudged' then 1 when r.status='nudged2' then 2 else 0 end,
      case when r.status in ('nudged','nudged2') then now() - interval '20 hours' end,
      now() - interval '2 days', true, now() - interval '2 days' - (r.i || ' hours')::interval);

    if r.status = 'nudged' or r.status = 'nudged2' then
      insert into public.messages (type,status,lead_id,to_email,subject,body,scheduled_utc,sent_at,minutes_saved,is_demo)
      values ('nudge','sent',lid,r.email,'Still keen to talk about your project?',
        E'Hi '||first||E',\n\nYou started booking a free consultation with us but didn''t pick a time. Our engineers have times available this week.\n\nThe Advancing Data Solutions team',
        now() - interval '20 hours', now() - interval '20 hours', 5, true);
    end if;
    if r.ctime is null then continue; end if;

    -- next weekday in the team's time zone (completed one goes to the previous weekday)
    if r.status = 'completed' then
      d := base - 1; while extract(isodow from d) > 5 loop d := d - 1; end loop;
    else
      wd := wd + 1; d := base; n := 0;
      loop d := d + 1; if extract(isodow from d) <= 5 then n := n + 1; exit when n = wd; end if; end loop;
    end if;
    st := (d + r.ctime::time) at time zone r.ctz;
    bid := gen_random_uuid(); tok := encode(gen_random_bytes(16),'hex');
    insert into public.bookings (id, code, lead_id, email, session_type, length_min, start_utc, end_utc, blocked_until_utc, client_tz, status, manage_token, attendance_confirmed_at, released_at, cancelled_at, cancel_reason, calendar_sync_status, is_demo, created_at)
    values (bid, 'ADS-'||upper(substr(md5(bid::text),1,4)), lid, r.email, 'free_consultation', r.len, st, st + (r.len||' minutes')::interval, st + ((r.len+15)||' minutes')::interval, r.ctz,
      r.status::booking_status, tok,
      case when r.status in ('attendance_confirmed','completed') then now() - interval '1 day' end,
      case when r.status='released' then now() - interval '1 hour' end,
      case when r.status='cancelled' then now() - interval '5 hours' end,
      case when r.i=5 then 'Budget review moved to next quarter' when r.i=10 then 'Cancelled by our team' end,
      'synced', true, now() - interval '2 days');
    if r.nda then
      insert into public.ndas (booking_id, signer_name, signer_title, signer_email, signed_at) values (bid, r.name, r.role, r.email, now() - interval '1 day');
    end if;
    insert into public.messages (type,status,booking_id,lead_id,to_email,subject,body,scheduled_utc,sent_at,minutes_saved,is_demo)
    values ('confirmation','sent',bid,lid,r.email,'You''re booked: Free Consultation, '||to_char(st at time zone r.ctz,'Dy DD Mon'),
      E'Hi '||first||E',\n\nThanks for booking a free '||r.len||E'-minute consultation with our engineers. Your call is on '||trim(to_char(st at time zone r.ctz,'FMDay DD FMMonth'))||' at '||to_char(st at time zone r.ctz,'FMHH12:MI am')||E' (your time).\n\nManage your booking: https://book.advancingdatasolutions.com/booked/'||tok||E'\n\nThe Advancing Data Solutions team',
      now() - interval '2 days', now() - interval '2 days', 10, true);
    if r.status in ('confirmed','attendance_confirmed') then
      insert into public.messages (type,status,booking_id,lead_id,to_email,subject,body,scheduled_utc,minutes_saved,is_demo)
      values ('reminder_24h','scheduled',bid,lid,r.email,'Tomorrow: your consultation with our engineers',
        E'Hi '||first||E',\n\nA reminder that your free consultation is tomorrow at '||to_char(st at time zone r.ctz,'FMHH12:MI am')||E' (your time).\n\nConfirm attendance: https://book.advancingdatasolutions.com/attend/'||tok||E'\n\nThe Advancing Data Solutions team',
        st - interval '24 hours', 5, true);
    elsif r.status = 'cancelled' then
      insert into public.messages (type,status,booking_id,lead_id,to_email,subject,body,scheduled_utc,sent_at,minutes_saved,is_demo)
      values ('cancel_notice','sent',bid,lid,r.email,'Your consultation has been cancelled',
        E'Hi '||first||E',\n\nYour consultation has been cancelled. You can book a new time whenever suits you: https://book.advancingdatasolutions.com/book\n\nThe Advancing Data Solutions team',
        now() - interval '5 hours', now() - interval '5 hours', 5, true);
    elsif r.status = 'released' then
      insert into public.messages (type,status,booking_id,lead_id,to_email,subject,body,scheduled_utc,sent_at,minutes_saved,is_demo)
      values ('release_notice','sent',bid,lid,r.email,'We''ve released your consultation slot',
        E'Hi '||first||E',\n\nWe didn''t receive an attendance confirmation, so we''ve released your slot. Book a new time whenever suits you: https://book.advancingdatasolutions.com/book\n\nThe Advancing Data Solutions team',
        now() - interval '1 hour', now() - interval '1 hour', 5, true);
    end if;
  end loop;
  return 13;
end; $$;
revoke all on function public.generate_demo_data() from public, anon;
grant execute on function public.generate_demo_data() to authenticated;