# Advancing Data Solutions Booking Portal — Feature Breakdown

Build order follows the Knowledge file: **frontend-first with sample data, then Lovable Cloud using schema.sql exactly. One feature per prompt.**

## Phase 1 — Frontend with sample data (no backend yet)

1. **Design system & shell** — Brand tokens (navy #1B3860, off-white #FAFAF9, accent #2A5298), Inter from Google Fonts, 1120px content width, card/button/radius rules, shared header/footer, progress bar component, badges (Verified, NDA signed, Attendance).
2. **Landing page `/`** — Real copy for the consultancy (services, session types, how it works), replacing the placeholder heading page.
3. **Booking flow step 1–2 `/book`** — Qualification form: project area (Data / AI / Web) → filtered need options, budget, timeline, contact details, privacy consent. Routing logic (Assessment / 60-min / 30-min) with client-switchable session type. Supports `?t=token` prefill (sample lead data for now).
4. **Session & slot picker `/book/session`, `/book/slot`** — Calendar + pill-grid time slots in the visitor's local time, 08:00–19:00 local filter, 30-min starts, sample busy times. DST-safe zone math (date-fns-tz or Intl).
5. **Verification & confirmation screens `/book/verify`, `/booked/:token`** — 6-digit code entry UI (resend timer, attempts), confirmation page with badges and Add-to-calendar.
6. **NDA page `/nda/:token`** — NDA text, e-sign checkbox + name, signed state.
7. **Manage pages `/attend/:token`, `/reschedule/:token`, `/cancel/:token`** — Confirm attendance, pick a new slot, cancel — all token-based, sample data.
8. **Admin shell & login screen** — Left sidebar layout, denser tables, login form (UI only).
9. **Admin pages** — `/admin` (overnight stats + new bookings with badges), `/admin/bookings`, `/admin/leads`, `/admin/outbox`, `/admin/inbox` (AI extract + reply draft UI), `/admin/settings` (availability, limits, fallback link, blocked senders, demo mode, Simulate time) — all on sample data.

## Phase 2 — Lovable Cloud backend

10. **Enable Cloud + schema** — Apply schema.sql exactly: tables, GRANTs, RLS (admin-only, no `using(true)`), exclusion constraint, admins table, roles per security rules.
11. **Booking RPCs** — `create_booking_request`, `create_verification` (hashed codes), `confirm_booking` (atomic, advisory lock fallback), public token RPCs (`get_public_booking`, `sign_nda`, `confirm_attendance`, `cancel_booking_by_token`, `get_lead_prefill`). Rate limits, disposable/blocked email rejection.
12. **Email sending** — Transactional templates from notify.advancingdatasolutions.com: verification code, confirmation, reminders, NDA reminder, release/cancel/reschedule notices, nudges. All logged to Outbox.
13. **Automations job** — 5-min scheduler + Run now: reminder_24h/1h, amber flag 12h, release 6h, nudge 24h/48h, cold 72h, completed-after-end, retries, minutes_saved.
14. **Google Calendar connector** — Busy-time read (5-min cache), event create/move/delete with Meet link, retry + fallback meeting link on failure.
15. **Admin auth + inbox AI** — Email/password login, route guards, Lovable AI inquiry extraction + reply drafts.
16. **Demo mode & cleanup jobs** — is_demo seed data, Simulate time, delete unverified requests after 24h, cold leads after 12 months.

## Questions before we start

1. **schema.sql** — The brief says "using schema.sql exactly" but I don't have that file. Will you paste it when we reach Phase 2, or should I design the schema from the brief for your review?
2. **NDA text** — Do you have the actual NDA document/copy, or should I draft placeholder legal text for you to replace?
3. **Assessment price** — "price in settings" — what default price should settings start with?
4. **Logo** — Can you upload the logo file (or give me the website URL to pull it from)?
5. **Fallback meeting link** — Which URL should be the fallback when Google Calendar event creation fails?
6. **Admin accounts** — How many admin users, and do you create them manually in the database (no public sign-up, per brief)?
7. **Copy** — Should I write all marketing/email copy myself in the brand voice ("we", "our engineers"), or will you supply any of it?

## Technical notes

- TanStack Start + Tailwind v4; one route file per page per the URL map in the brief.
- Slots stored in UTC, computed per date with IANA zones; team zone Asia/Karachi stays private.
- No HELD status anywhere; PENDING_VERIFICATION does not reserve the slot.
- Public pages only via token RPCs; manage_token in URLs, never the short booking code.
- Suggested starting point: Feature 1 (design system & shell), then Feature 2.
