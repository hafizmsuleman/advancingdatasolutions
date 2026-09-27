# Roadmap — Advancing Data Solutions Booking Portal

Build order: frontend-first with sample data, then Lovable Cloud (schema.sql pasted by user at Phase 2). One feature per prompt.

## Phase 1 — Frontend (sample data)
- [x] F1 Design system & shell (brand tokens, Inter, header/footer, progress bar, badges, logo + favicon)
- [x] F2 Landing page `/`
- [ ] F3 Booking flow `/book` (qualification, routing 30/60 min, `?t=` prefill)
- [ ] F4 Session & slot picker `/book/session`, `/book/slot`
- [ ] F5 Verify & confirmation `/book/verify`, `/booked/:token`
- [ ] F6 NDA page `/nda/:token` (placeholder mutual NDA, lawyer-review label)
- [ ] F7 Manage pages `/attend/:token`, `/reschedule/:token`, `/cancel/:token`
- [x] F8 Admin shell & login screen
- [x] F9 Admin pages (dashboard, bookings, leads, outbox, inbox, settings)

## Phase 2 — Lovable Cloud
- [x] F10 Enable Cloud + apply user-provided schema.sql exactly
- [ ] F11 Booking RPCs (create_booking_request, create_verification, confirm_booking, token RPCs, rate limits)
- [ ] F12 Email sending (notify.advancingdatasolutions.com, reply-to contact@, Outbox logging)
- [x] F13 Automations job (5-min + Run now, reminders, attendance flags, nudges)
- [ ] F14 Admin auth + inbox AI (one admin: contact@advancingdatasolutions.com, manual creation)
- [x] F15 Google Calendar
- [x] F16 Demo mode & cleanup jobs

## Phase 3 — Launch
- [ ] F17 Polish pass, security scan, publish, custom domain book.advancingdatasolutions.com, set project public

## Key decisions
- All consultations free (30/60 min); no paid Assessment, no payments anywhere.
- Copy written by us in brand voice ("we", "our engineers"); user reviews.
- Logo: ads-logo-horizontal.svg (CDN asset); favicon.ico in public/.
