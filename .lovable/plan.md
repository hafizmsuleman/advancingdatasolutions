# Admin > Bookings: outcome actions with private note

Admin-only. Nothing changes for clients: no texts, emails, reminders, scheduling rules or public pages.

## What you will see

**Before the start time**
- Row actions: **Cancel** (same optional reason, still sent to the client) and **Block**. No Complete or No-show buttons.

**After the start time** (status Booked, Completed or No-show)
- Row actions: **Mark completed**, **No-show**, and **Block**. On a Booked row, Cancel stays as it is today.
- Each one opens the usual styled dialog with an optional **"Private note"** box (up to 500 characters, never shown to the client). If the booking already has a note, the box starts with it, so you can edit it.
- You can switch between Completed and No-show at any time. The button for the current outcome reads "Update note" so you can change the note without changing the outcome.
- This replaces today's separate "Mark no-show" and "Undo no-show" buttons.

**List and details**
- Under the status pill: a one-line grey preview of the note, cut off with "…" when long.
- Booking details panel: a new "Outcome" section with Completed or No-show and the full note.

**Attendance badge**
- "Attendance not confirmed" (amber) also stays on a **Booked** row after the start time, until the booking is marked Completed or No-show. Completed, No-show and Cancelled rows still don't show it.

**Guarantees**
- Marking an outcome changes only the status and the note: no email, no calendar change, no reminder change.
- The note is stored in an admin-only field, and no public page or email reads it.

## Database change needed
Add one optional text column to bookings: `outcome_note` (empty by default). This is an addition to the schema you pasted. Existing data and existing code aren't affected, and access stays admin-only through the current rules.

## Credit cost
Small: one database addition and edits to about four admin files, done in one pass. I can't see exact prices from here. On your plan this is usually a low single-digit number of credits.

## Technical details
- Migration: `ALTER TABLE public.bookings ADD COLUMN outcome_note text;` (no new policies needed; bookings_admin_all already covers it).
- `src/lib/admin-data.ts`: select `outcome_note`, map it to `outcomeNote` on AdminBooking (`admin-sample.ts` type).
- `src/routes/admin.bookings.tsx`: collapse the action kinds into `outcome_completed` / `outcome_no_show`, shown when `start <= now` and status is confirmed, completed or no_show. Apply `update({ status, outcome_note })` through the browser client. Sanitize the note the same way as the cancel reason (strip links and newlines, max 500). Booked rows still cancel future reminders on outcome, as `set()` does today. The attendance badge condition becomes `status === "confirmed"` (no future-only check). Add the note preview under the pill (`truncate`).
- `src/components/booking-drawer.tsx`: Outcome section for completed and no_show bookings.
- The automatic "Completed after end time" behaviour in automations stays as it is and doesn't touch the note.
