# Advancing Data Solutions Booking Portal — Feature Breakdown (approved, updated)

Build order follows the Knowledge file: **frontend-first with sample data, then Lovable Cloud using schema.sql exactly. One feature per prompt.**

**Update:** All consultations are free (30 or 60 min). No paid Platform Assessment, no payments anywhere.

## Phase 1 — Frontend with sample data (no backend yet)

1. **Design system & shell** — Brand tokens (navy #1B3860, off-white #FAFAF9, accent #2A5298), Inter from Google Fonts, 1120px content width, card/button/radius rules, shared header/footer with the uploaded logo (ads-logo-horizontal.svg), favicon.ico for the browser tab, progress bar component, badges (Verified, NDA signed, Attendance).
2. **Landing page `/`** — Real copy in brand voice ("we", "our engineers"): services, session types, how it works.
3. **Booking flow `/book`** — Qualification: project area (Data / AI / Web) → filtered needs, budget, timeline, contact details, privacy consent. Routing: 60 min if budget ≥ $5k–20k or timeline < 3 months, else 30 min; client can switch. `?t=token` prefill (sample data).
4. **Session & slot picker `/book/session`, `/book/slot`** — Calendar + pill-grid slots in visitor's local time, 08:00–19:00 local filter, 30-min starts, sample busy times, DST-safe zone math.
5. **Verification & confirmation `/book/verify`, `/booked/:token`** — 6-digit code UI (resend timer, attempts), confirmation page with badges and Add-to-calendar.
6. **NDA page `/nda/:token`** — Placeholder one-page mutual NDA drafted by us, labelled as a template for lawyer review; e-sign checkbox + name.
7. **Manage pages `/attend/:token`, `/reschedule/:token`, `/cancel/:token`** — Token-based, sample data.
8. **Admin shell & login screen** — Left sidebar, denser tables, login UI.
9. **Admin pages** — `/admin`, `/admin/bookings`, `/admin/leads`, `/admin/outbox`, `/admin/inbox`, `/admin/settings` (availability, limits, meeting link, blocked senders, demo mode, Simulate time) — sample data.

## Phase 2 — Lovable Cloud backend

10. **Enable Cloud + schema** — Apply the schema.sql the user pastes at that point, exactly. No self-designed schema.
11. **Booking RPCs** — `create_booking_request`, `create_verification` (hashed codes), `confirm_booking` (atomic, advisory lock fallback), public token RPCs. Rate limits, disposable/blocked email rejection.
12. **Email sending** — From notify.advancingdatasolutions.com, reply-to contact@advancingdatasolutions.com; all emails logged to Outbox.
13. **Automations job** — 5-min scheduler + Run now: reminders, amber flag 12h, release 6h, nudges, cold 72h, retries, minutes_saved.
14. **Admin auth + inbox AI** — One admin (contact@advancingdatasolutions.com alias), created manually; no public sign-up. Lovable AI inquiry extraction + reply drafts.
15. **Google Calendar connector** — Decision deferred until this feature. Until connected, every booking uses the single meeting link from Admin → Settings (placeholder https://meet.google.com/xyz, editable).
16. **Demo mode & cleanup jobs** — is_demo seed data, Simulate time, delete unverified requests after 24h, cold leads after 12 months.

## Phase 3 — Launch

17. **Polish & go live** — Polish pass, security scan, publish, connect custom domain book.advancingdatasolutions.com, set project public.

## Technical notes

- TanStack Start + Tailwind v4; one route file per page per the URL map in the brief.
- Slots stored in UTC, computed per date with IANA zones; team zone Asia/Karachi stays private.
- No HELD status anywhere; PENDING_VERIFICATION does not reserve the slot.
- Public pages only via token RPCs; manage_token in URLs, never the short booking code.
- Starting now: Feature 1 (design system & shell).
