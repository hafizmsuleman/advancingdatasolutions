-- Advancing Data Solutions LLC — Consultation Booking Portal (schema.sql + approved fixes 1–12)
create extension if not exists btree_gist with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- ---------- Enums ----------
create type public.lead_source    as enum ('form','email','linkedin','whatsapp','pasted');
create type public.lead_status    as enum ('new','link_sent','started','booked','cold');
create type public.project_area   as enum ('data','ai','web');
create type public.platform_type  as enum ('aws','azure','fabric','databricks','snowflake','not_decided','other');
create type public.need_type      as enum ('data_platform','pipelines','migration','cost','governance',
                                    'rag_chatbot','vector_search','llm_data_prep','ai_readiness',
                                    'web_app','ai_api','app_modernization','microservices','other');
create type public.budget_range   as enum ('under_5k','5k_20k','20k_50k','over_50k','not_sure');
create type public.session_type   as enum ('free_consultation');
create type public.booking_status as enum ('pending_verification','confirmed','attendance_confirmed',
                                    'released','rescheduled','cancelled','completed','no_show');
create type public.calendar_sync  as enum ('pending','synced','failed');
create type public.message_type   as enum ('verification_code','confirmation','admin_new_booking','nda_reminder',
                                    'reminder_24h','reminder_1h','release_notice','reschedule_notice',
                                    'cancel_notice','nudge','admin_alert');   -- fix 11
create type public.message_status as enum ('scheduled','sent','failed','cancelled');
create type public.weekday        as enum ('mon','tue','wed','thu','fri','sat','sun');

-- ---------- Admins ----------
create table public.admins (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid unique,
  email      text not null unique,
  name       text,
  created_at timestamptz not null default now()
);

-- ---------- Leads ----------
create table public.leads (
  id                uuid primary key default gen_random_uuid(),
  source            public.lead_source  not null default 'form',
  status            public.lead_status  not null default 'new',
  raw_message       text,
  full_name         text check (char_length(full_name) <= 120),
  email             text check (char_length(email) <= 254),
  email_verified_at timestamptz,
  company           text check (char_length(company) <= 160),
  role              text check (char_length(role) <= 120),
  project_area      public.project_area,
  platform          public.platform_type,
  need              public.need_type,
  timeline          text check (char_length(timeline) <= 60),
  budget_range      public.budget_range,
  notes             text check (char_length(notes) <= 1000),
  client_tz         text,
  booking_token     text not null unique default encode(extensions.gen_random_bytes(16),'hex'),
  ai_summary        text,
  ai_reply_draft    text,
  consent_at        timestamptz,
  nudge_count       int not null default 0 check (nudge_count between 0 and 2),
  last_nudged_at    timestamptz,
  visitor_hash      text,
  is_demo           boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index leads_email_idx   on public.leads (lower(email));
create index leads_status_idx  on public.leads (status, created_at);

-- ---------- Bookings ----------
create table public.bookings (
  id                      uuid primary key default gen_random_uuid(),
  code                    text not null unique,
  lead_id                 uuid not null references public.leads(id) on delete cascade,
  email                   text not null,
  session_type            public.session_type not null,
  length_min              int not null check (length_min in (30,60)),
  start_utc               timestamptz not null,
  end_utc                 timestamptz not null,
  blocked_until_utc       timestamptz not null,             -- fix 1: end_utc + buffer
  client_tz               text not null,
  status                  public.booking_status not null default 'pending_verification',
  verify_expires_at       timestamptz,
  manage_token            text not null unique default encode(extensions.gen_random_bytes(16),'hex'),
  attendance_confirmed_at timestamptz,
  released_at             timestamptz,
  cancelled_at            timestamptz,
  cancel_reason           text check (char_length(cancel_reason) <= 300),
  rescheduled_from_id     uuid references public.bookings(id),
  google_event_id         text,
  meet_link               text,
  calendar_sync_status    public.calendar_sync not null default 'pending',
  visitor_hash            text,
  is_demo                 boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  check (end_utc > start_utc),
  check (blocked_until_utc >= end_utc)
);

alter table public.bookings add constraint bookings_no_overlap
  exclude using gist (
    tstzrange(start_utc, blocked_until_utc) with &&
  ) where (status in ('confirmed','attendance_confirmed') and not is_demo);

create unique index bookings_one_active_per_email
  on public.bookings (lower(email))
  where status in ('confirmed','attendance_confirmed') and not is_demo;

create unique index bookings_one_pending_per_email
  on public.bookings (lower(email))
  where status = 'pending_verification';

create index bookings_start_idx  on public.bookings (start_utc) where status in ('confirmed','attendance_confirmed');
create index bookings_status_idx on public.bookings (status, start_utc);

-- ---------- Email verifications ----------
create table public.email_verifications (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null references public.bookings(id) on delete cascade,
  email         text not null,
  code_hash     text not null,
  expires_at    timestamptz not null,
  attempts      int not null default 0 check (attempts <= 5),
  resend_count  int not null default 0 check (resend_count <= 3),
  last_sent_at  timestamptz not null default now(),
  verified_at   timestamptz,
  visitor_hash  text,
  created_at    timestamptz not null default now()
);
create index email_verifications_email_idx on public.email_verifications (lower(email), created_at);

-- ---------- NDAs ----------
create table public.ndas (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null unique references public.bookings(id) on delete cascade,
  signer_name  text not null check (char_length(signer_name) <= 120),
  signer_title text not null check (char_length(signer_title) <= 120),
  signer_email text,
  nda_version  text not null default 'v1',
  signed_at    timestamptz not null default now(),
  ip_address   text
);

-- ---------- Messages (Outbox) ----------
create table public.messages (
  id            uuid primary key default gen_random_uuid(),
  type          public.message_type not null,
  status        public.message_status not null default 'scheduled',
  booking_id    uuid references public.bookings(id) on delete cascade,
  lead_id       uuid references public.leads(id) on delete cascade,
  to_email      text not null,
  subject       text not null,
  body          text not null,
  scheduled_utc timestamptz not null default now(),
  sent_at       timestamptz,
  error         text,
  retry_count   int not null default 0 check (retry_count <= 3),
  minutes_saved int not null default 5,
  is_demo       boolean not null default false,
  created_at    timestamptz not null default now()
);
create index messages_due_idx on public.messages (status, scheduled_utc);

-- ---------- Availability ----------
create table public.availability_windows (
  id         uuid primary key default gen_random_uuid(),
  weekday    public.weekday not null,
  start_time time not null,
  end_time   time not null,
  active     boolean not null default true,
  check (end_time > start_time)
);

-- ---------- Blocked senders ----------
create table public.blocked_senders (
  id         uuid primary key default gen_random_uuid(),
  value      text not null unique,
  reason     text,
  created_at timestamptz not null default now()
);

-- ---------- Settings ----------
create table public.settings (
  id                        int primary key default 1 check (id = 1),
  team_timezone             text not null default 'Asia/Karachi',
  client_day_start          time not null default '08:00',
  client_day_end            time not null default '19:00',
  slot_interval_min         int  not null default 30,
  buffer_min                int  not null default 15,
  daily_cap                 int  not null default 3,
  min_notice_hours          int  not null default 24,
  booking_horizon_days      int  not null default 14,
  attendance_flag_hours     int  not null default 12,
  attendance_release_hours  int  not null default 6,
  nudge_after_hours         int  not null default 24,
  budget_threshold          public.budget_range not null default '5k_20k',
  fallback_meeting_link     text,
  demo_mode                 boolean not null default false,
  virtual_clock_offset_min  int not null default 0,
  updated_at                timestamptz not null default now()
);

insert into public.settings (id, fallback_meeting_link) values (1, 'https://meet.google.com/xyz');
insert into public.availability_windows (weekday, start_time, end_time) values
  ('mon','15:00','24:00'), ('tue','15:00','24:00'), ('wed','15:00','24:00'),
  ('thu','15:00','24:00'), ('fri','15:00','24:00');
insert into public.admins (email, name) values ('contact@advancingdatasolutions.com', 'Advancing Data Solutions');

-- ---------- fix 12: updated_at trigger ----------
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
create trigger leads_updated_at    before update on public.leads    for each row execute function public.set_updated_at();
create trigger bookings_updated_at before update on public.bookings for each row execute function public.set_updated_at();
create trigger settings_updated_at before update on public.settings for each row execute function public.set_updated_at();

-- ---------- Create a booking request ----------
create or replace function public.create_booking_request(
  p_lead_id uuid, p_email text, p_session public.session_type, p_length int,
  p_start timestamptz, p_client_tz text, p_visitor text)
returns uuid
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_id uuid; v_code text; v_buffer int;
begin
  select buffer_min into v_buffer from settings where id = 1;
  if exists (select 1 from bookings
              where lower(email) = lower(p_email) and not is_demo
                and status in ('confirmed','attendance_confirmed')) then
    raise exception 'email_has_active_booking';
  end if;

  update bookings
     set status = 'cancelled', cancelled_at = now(), cancel_reason = 'replaced'
   where status = 'pending_verification'
     and (lower(email) = lower(p_email) or (p_visitor is not null and visitor_hash = p_visitor));

  if exists (select 1 from bookings
              where not is_demo and status in ('confirmed','attendance_confirmed')
                and tstzrange(start_utc, blocked_until_utc)
                 && tstzrange(p_start, p_start + make_interval(mins => p_length + v_buffer))) then
    raise exception 'slot_taken';
  end if;

  loop
    v_code := 'ADS-' || upper(substr(encode(gen_random_bytes(3),'hex'),1,4));
    exit when not exists (select 1 from bookings where code = v_code);
  end loop;

  insert into bookings (code, lead_id, email, session_type, length_min, start_utc, end_utc, blocked_until_utc,
                        client_tz, status, verify_expires_at, visitor_hash)
  values (v_code, p_lead_id, lower(p_email), p_session, p_length, p_start,
          p_start + make_interval(mins => p_length),
          p_start + make_interval(mins => p_length + v_buffer), p_client_tz,
          'pending_verification', now() + interval '10 minutes', p_visitor)
  returning id into v_id;

  update leads set status = 'started' where id = p_lead_id and status in ('new','link_sent');
  return v_id;
end;
$$;

create or replace function public.create_verification(p_booking_id uuid, p_email text, p_code text, p_visitor text)
returns void language sql security definer set search_path = public, extensions
as $$
  insert into email_verifications (booking_id, email, code_hash, expires_at, visitor_hash)
  values (p_booking_id, lower(p_email), crypt(p_code, gen_salt('bf')), now() + interval '10 minutes', p_visitor);
$$;

-- ---------- Atomic confirmation (fixes 4, 5, 6, 7) ----------
create or replace function public.confirm_booking(p_booking_id uuid, p_code text)
returns text language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_booking bookings%rowtype;
  v_ver     email_verifications%rowtype;
  v_tz      text;
  v_cap     int;
  v_day     date;
begin
  select * into v_booking from bookings where id = p_booking_id for update;
  if not found or v_booking.status <> 'pending_verification' then
    return 'expired';
  end if;

  select * into v_ver from email_verifications
   where booking_id = p_booking_id and verified_at is null
   order by created_at desc limit 1 for update;

  if not found or v_ver.expires_at < now() then
    return 'expired';
  end if;
  if v_ver.attempts >= 5 then
    update bookings set status = 'cancelled', cancelled_at = now(), cancel_reason = 'too_many_attempts' where id = p_booking_id;
    return 'too_many_attempts';
  end if;
  if v_ver.code_hash <> crypt(p_code, v_ver.code_hash) then
    update email_verifications set attempts = attempts + 1 where id = v_ver.id;
    if v_ver.attempts + 1 >= 5 then
      update bookings set status = 'cancelled', cancelled_at = now(), cancel_reason = 'too_many_attempts' where id = p_booking_id;
      return 'too_many_attempts';
    end if;
    return 'wrong_code';
  end if;

  update email_verifications set verified_at = now() where id = v_ver.id;
  update leads set email_verified_at = coalesce(email_verified_at, now()) where id = v_booking.lead_id;

  if exists (select 1 from bookings
              where lower(email) = lower(v_booking.email) and not is_demo
                and status in ('confirmed','attendance_confirmed')
                and id <> p_booking_id) then
    update bookings set status = 'cancelled', cancelled_at = now(), cancel_reason = 'email_has_active_booking' where id = p_booking_id;
    return 'email_has_active_booking';
  end if;

  -- serialize confirmations per team day, then enforce the daily cap
  select team_timezone, daily_cap into v_tz, v_cap from settings where id = 1;
  v_day := (v_booking.start_utc at time zone v_tz)::date;
  perform pg_advisory_xact_lock(hashtext('ads_booking_day:' || v_day::text));
  if (select count(*) from bookings
       where not is_demo and status in ('confirmed','attendance_confirmed')
         and (start_utc at time zone v_tz)::date = v_day) >= v_cap then
    update bookings set status = 'cancelled', cancelled_at = now(), cancel_reason = 'slot_taken' where id = p_booking_id;
    return 'slot_taken';
  end if;

  begin
    update bookings
       set status = 'confirmed', verify_expires_at = null
     where id = p_booking_id;
  exception when exclusion_violation or unique_violation then
    update bookings set status = 'cancelled', cancelled_at = now(), cancel_reason = 'slot_taken' where id = p_booking_id;
    return 'slot_taken';
  end;

  update leads set status = 'booked' where id = v_booking.lead_id;
  return 'confirmed';
end;
$$;

-- ---------- Public token functions (fixes 8, 9, 10) ----------
create or replace function public.get_public_booking(p_token text)
returns table (code text, session_type public.session_type, length_min int, start_utc timestamptz,
               end_utc timestamptz, client_tz text, status public.booking_status, meet_link text,
               company text, full_name text, nda_signed boolean, nda_signer_name text,
               nda_signer_title text, nda_signed_at timestamptz, attendance_confirmed_at timestamptz,
               manage_token text)
language sql stable security definer set search_path = public, extensions as $$
  select b.code, b.session_type, b.length_min, b.start_utc, b.end_utc, b.client_tz, b.status,
         coalesce(b.meet_link, (select s.fallback_meeting_link from settings s where s.id = 1)),
         l.company, l.full_name, n.id is not null, n.signer_name, n.signer_title, n.signed_at,
         b.attendance_confirmed_at, b.manage_token
    from bookings b
    join leads l on l.id = b.lead_id
    left join ndas n on n.booking_id = b.id
   where b.manage_token = p_token
     and b.status <> 'pending_verification'
   limit 1;
$$;

create or replace function public.sign_nda(p_token text, p_name text, p_title text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; v_email text;
begin
  select id, email into v_id, v_email from bookings
   where manage_token = p_token and status in ('confirmed','attendance_confirmed');
  if not found then return 'not_found'; end if;
  if exists (select 1 from ndas where booking_id = v_id) then return 'already_signed'; end if;
  insert into ndas (booking_id, signer_name, signer_title, signer_email)
  values (v_id, left(p_name,120), left(p_title,120), v_email);
  return 'signed';
end; $$;

create or replace function public.confirm_attendance(p_token text)
returns text language plpgsql security definer set search_path = public, extensions as $$
begin
  update bookings set status = 'attendance_confirmed', attendance_confirmed_at = now()
   where manage_token = p_token and status = 'confirmed' and start_utc > now();
  if found then return 'confirmed'; end if;
  if exists (select 1 from bookings where manage_token = p_token and status = 'attendance_confirmed') then
    return 'already_confirmed'; end if;
  return 'not_found_or_passed';
end; $$;

create or replace function public.cancel_booking_by_token(p_token text, p_reason text)
returns text language plpgsql security definer set search_path = public, extensions as $$
begin
  update bookings set status = 'cancelled', cancelled_at = now(), cancel_reason = left(p_reason,300)
   where manage_token = p_token and status in ('confirmed','attendance_confirmed') and start_utc > now();
  if found then return 'cancelled'; end if;
  return 'not_found_or_passed';
end; $$;

create or replace function public.get_lead_prefill(p_booking_token text)
returns table (full_name text, email text, company text, role text, project_area public.project_area,
               platform public.platform_type, need public.need_type, budget_range public.budget_range)
language sql stable security definer set search_path = public, extensions as $$
  select full_name, email, company, role, project_area, platform, need, budget_range
    from leads where booking_token = p_booking_token and status not in ('cold','booked') limit 1;
$$;

revoke execute on function public.create_booking_request(uuid,text,public.session_type,int,timestamptz,text,text),
                          public.create_verification(uuid,text,text,text),
                          public.confirm_booking(uuid,text)
  from public, anon, authenticated;
grant execute on function public.create_booking_request(uuid,text,public.session_type,int,timestamptz,text,text),
                          public.create_verification(uuid,text,text,text),
                          public.confirm_booking(uuid,text) to service_role;
grant execute on function public.get_public_booking(text), public.sign_nda(text,text,text),
      public.confirm_attendance(text), public.cancel_booking_by_token(text,text),
      public.get_lead_prefill(text) to anon, authenticated;

-- ---------- Admin check (user_id, or the seeded admin email for manually created logins) ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins
                  where user_id = auth.uid()
                     or (user_id is null and lower(email) = lower(coalesce(auth.jwt() ->> 'email',''))));
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- fix 2: table grants ----------
grant select, insert, update, delete on
  public.admins, public.leads, public.bookings, public.email_verifications, public.ndas,
  public.messages, public.availability_windows, public.blocked_senders, public.settings
  to authenticated;
grant all on
  public.admins, public.leads, public.bookings, public.email_verifications, public.ndas,
  public.messages, public.availability_windows, public.blocked_senders, public.settings
  to service_role;

-- ---------- RLS: admin only ----------
do $$
declare t text;
begin
  foreach t in array array['admins','leads','bookings','email_verifications','ndas',
                           'messages','availability_windows','blocked_senders','settings']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
                   t || '_admin_all', t);
  end loop;
end $$;

-- ---------- Demo seed (is_demo = true; visible to admin only when demo mode is on) ----------
insert into public.blocked_senders (value, reason) values
  ('mailinator.com','Disposable email'), ('quickmail-temp.io','Disposable email');

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
 ('confirmation','sent','00000000-0000-4000-b000-000000000001','00000000-0000-4000-a000-000000000001','megan.holloway@northwindlogistics.com','You''re booked: Free Consultation, Tue 29 Sep',E'Hi Megan,\n\nThanks for booking a free 60-minute consultation with our engineers. Your call is on Tuesday 29 September at 9:00 am (your time).\n\nMeeting link: https://meet.google.com/xyz\nReference: ADS-7K2Q\n\nSpeak soon,\nAdvancing Data Solutions','2026-09-26T19:43Z','2026-09-26T19:43Z',10,true),
 ('nda_reminder','scheduled','00000000-0000-4000-b000-000000000002','00000000-0000-4000-a000-000000000002','j.whitfield@harbourinsure.co.uk','One step before our call: sign the NDA',E'Hi James,\n\nA quick reminder that you can sign our mutual NDA before Tuesday''s consultation.\n\nAdvancing Data Solutions','2026-09-27T00:05Z',null,5,true),
 ('confirmation','sent','00000000-0000-4000-b000-000000000003','00000000-0000-4000-a000-000000000003','omar.mansoori@gulfretailgroup.ae','You''re booked: Free Consultation, Wed 30 Sep',E'Hi Omar,\n\nThanks for booking a free 60-minute consultation with our engineers. Your call is on Wednesday 30 September at 3:00 pm (your time).\n\nAdvancing Data Solutions','2026-09-27T01:19Z','2026-09-27T01:19Z',10,true),
 ('nudge','failed',null,'00000000-0000-4000-a000-000000000009','tom.ashby@ledgerlinepay.co.uk','Still keen to talk about your GenAI project?',E'Hi Tom,\n\nYou started booking a consultation with us but didn''t pick a time. Our engineers have slots this week.\n\nAdvancing Data Solutions','2026-09-26T08:00Z',null,5,true),
 ('reminder_24h','scheduled','00000000-0000-4000-b000-000000000005','00000000-0000-4000-a000-000000000005','s.kennedy@brightwaterenergy.co.uk','Tomorrow: your consultation with our engineers',E'Hi Sarah,\n\nThis is a reminder that your free 30-minute consultation is tomorrow at 1:00 pm (your time).\n\nAdvancing Data Solutions','2026-10-01T12:00Z',null,5,true),
 ('release_notice','sent','00000000-0000-4000-b000-000000000007','00000000-0000-4000-a000-000000000007','dbrooks@summitmfg.com','We''ve released your consultation slot',E'Hi Daniel,\n\nWe didn''t receive an attendance confirmation, so we''ve released your slot. You''re welcome to book a new time whenever suits you.\n\nAdvancing Data Solutions','2026-09-23T10:00Z','2026-09-23T10:00Z',5,true),
 ('reminder_1h','cancelled','00000000-0000-4000-b000-000000000008','00000000-0000-4000-a000-000000000008','aisha@doharealty.qa','Starting in 1 hour',E'Hi Aisha,\n\nYour consultation starts in one hour.\n\nAdvancing Data Solutions','2026-10-05T09:00Z',null,5,true);
