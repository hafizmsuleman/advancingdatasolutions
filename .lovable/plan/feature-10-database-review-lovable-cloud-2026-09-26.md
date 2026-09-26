# Feature 10 — Database review (Lovable Cloud)

No code in this step. This is how we would create your schema, how the public pages and backend would use it, and the problems we found in the SQL.

## 1. How we'd create it

- Turn on Lovable Cloud, then run your schema.sql as a single migration, in order: extensions, enums, tables, indexes, seed rows, functions, grants, RLS.
- We apply it as written. We change only the "must fix" items in section 4 (without them it won't install or the admin can't read data) and any "recommended" items you approve. Nothing else.
- Afterwards we create the admin login contact@advancingdatasolutions.com by hand and add its user ID to `admins`. Public sign-up stays off.

## 2. Public pages use only token functions

These pages call only the five functions granted to anonymous visitors. They never read a table directly.

```text
/booked, /nda, /attend, /reschedule, /cancel  -> get_public_booking(manage_token)
/nda/:token (submit)                           -> sign_nda
/attend/:token                                 -> confirm_attendance
/cancel/:token                                 -> cancel_booking_by_token (then backend sends email / removes event)
/book?t=token                                  -> get_lead_prefill(booking_token)
```

- Links always use the long `manage_token`. The ADS-XXXX code is for display only.
- RLS keeps every table admin-only (`is_admin()`). We will never add a `using (true)` policy.

## 3. Backend functions (server side, with the service role)

In this app, "edge functions" means our own backend functions. They run on the server with the service-role key, which never reaches the browser.

- **submitLead**: validates input, rejects disposable or blocked emails, removes links, applies per-visitor limits, then inserts or updates the lead with consent_at and visitor_hash.
- **requestBooking**: re-checks the slot on the server (availability, 24h notice, 14-day horizon, 08:00–19:00 client window, daily cap, Google busy times later). Then it calls `create_booking_request`, generates a 6-digit code, calls `create_verification`, and logs and sends the `verification_code` email. It enforces 3 code emails per address and 10 per visitor per hour.
- **resendCode**: 60-second wait, at most 3 resends.
- **verifyCode**: calls `confirm_booking`. When the result is `confirmed`, it queues the confirmation, admin_new_booking and reminder emails.
- **rescheduleBooking**: runs on the server, because no public reschedule function exists.
- The browser never calls these three: `create_booking_request`, `create_verification`, `confirm_booking`. They are already revoked from anon and authenticated.

## 4. Problems found in the SQL

### Must fix (it won't install, or it won't work)

1. **The no-overlap rule won't install.** An index expression may only use functions Postgres marks IMMUTABLE. `end_utc + interval '15 minutes'` (timestamptz + interval) is only STABLE, so the rule fails to install. Fix: add a plain column `blocked_until_utc` (end + buffer), filled by the booking functions, and build the rule on `tstzrange(start_utc, blocked_until_utc)`.
2. **The admin can't read any table.** There are no table GRANTs. Lovable Cloud doesn't give the `authenticated` or `service_role` roles table access by default, so RLS alone isn't enough. Fix: grant select/insert/update/delete on all 9 tables to `authenticated` (RLS still limits this to admins) and all rights to `service_role`. No table access for `anon`.
3. **Extension location.** `btree_gist` should be created in the `extensions` schema (`with schema extensions`), which is where `pgcrypto` already lives.

### Recommended (it installs, but behaves wrongly)

4. **The daily cap of 3 isn't enforced when two clients confirm at once.** Two visitors confirming different slots on the same day can both succeed. Add `pg_advisory_xact_lock` per team day in `confirm_booking`, then re-check the cap. Your brief already calls for this fallback.
5. **Off-by-one on attempts.** The 5th wrong code still returns `wrong_code`, and `too_many_attempts` only appears on the 6th try. Return `too_many_attempts` once the 5th failure is recorded.
6. **Lost slots stay pending.** On `slot_taken` in `confirm_booking`, the request stays `pending_verification` and still blocks that email's pending slot. Set it to cancelled.
7. **Demo bookings are handled inconsistently.** The `email_has_active_booking` check skips demo bookings in `create_booking_request` but counts them in `confirm_booking`. Make both skip them.
8. **The meeting link will be blank.** `get_public_booking` returns `b.meet_link`, which stays empty until Google Calendar is connected, and visitors can't read `settings`. Return `coalesce(b.meet_link, settings.fallback_meeting_link)`.
9. **The public booking lookup is missing fields.** `get_public_booking` doesn't return what the pages already show: signer name, title and signed time (NDA signed view), client full name (NDA prefill), and attendance_confirmed_at. Add these columns. It still returns only that one client's data.
10. **Prefill can reuse a booked lead's link.** `get_lead_prefill` also returns leads that are already booked. Exclude `status = 'booked'` so an old link can't start a second booking.
11. **Missing email types.** `message_type` has no value for admin alerts (more than 20 emails an hour, calendar sync failure). Add `admin_alert`.
12. **updated_at never changes.** Nothing updates it on leads, bookings or settings. Add a small trigger.

### Notes (no change needed)

- `'24:00'` is valid for the Postgres `time` type, so the availability seed works.
- `lead_status` has no "nudged" or "blocked". The admin Leads page will use nudge_count and blocked_senders instead of the sample labels.
- Nudge at 48h, cold at 72h, resend limits and email rate limits aren't settings columns, so they live in backend code as constants.
- Housekeeping steps 1–4 will run in the 5-minute job (Feature 13).

## Technical details

- Migration order: extensions (in the extensions schema), enums, tables, the `blocked_until_utc` column, indexes and exclusion constraint, seed rows, functions, revoke/grant on functions, table GRANTs, RLS loop, updated_at trigger.
- Server code loads `supabaseAdmin` inside handlers only. Public pages use the browser client `.rpc()` with the anon key.
- Visitor hash: SHA-256 of IP + user agent + a server secret, computed on the server.
