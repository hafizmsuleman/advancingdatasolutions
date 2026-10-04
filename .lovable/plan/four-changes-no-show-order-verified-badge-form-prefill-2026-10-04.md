# Four changes: no-show, order, Verified badge, form prefill

## 1. Mark no-show after the call (admin only)
**Today:** the automatic run marks a booking Completed once its end time passes. No-show and Complete only appear on Confirmed bookings after the start time, so in practice No-show is only available during the call.

**Change:** in Admin > Bookings:
- Completed bookings get a "Mark no-show" button, using the same styled confirmation dialog.
- No-show bookings get an "Undo no-show" button, also with a confirmation, which sets the booking back to Completed.
- Neither sends any email or touches the calendar event. It only changes the booking's status.

**Dashboard / Leads:** no change needed. No dashboard card counts Completed or No-show bookings: "Bookings this week" counts only new bookings, and "Attendance confirmed" counts only upcoming ones. Leads doesn't show booking status.

## 2. Newest first in Admin > Bookings
Sort by meeting time, latest first. My recommendation: don't group upcoming above past. Strict newest-first already puts the furthest-ahead upcoming calls at the top, then today, then the past. Grouping would add a new layout element. Say so if you want grouping anyway.

## 3. Remove the "Verified" badge on bookings
Remove it from the booking cards on the Dashboard, the Bookings list and the booking details panel (the "Verified / Unverified" pill). Leads keeps its Verified column. The NDA badge and the attendance badges ("Day-before check: pending" and the confirmed one) stay exactly as they are.

## 4. Old answers filling the booking form (client-facing)
**Where they're stored:** in the browser's tab memory (session storage), not in your database or the lead record. The form saves its answers there as the client moves through the steps, so a refresh doesn't lose them.

**Why they survive:** after the code is confirmed, the app only clears the chosen time and the booking reference. It keeps the rest: name, email, company, role, area, platform, need, timeline, budget and notes. So in that same tab, the next visit to /book reloads all of it. This tab memory clears only when the tab or browser is closed.

**Proposed behaviour:**
- While a booking is unfinished, the saved answers stay as they do now (refresh and back still work).
- As soon as the code is confirmed, the saved answers are cleared completely, so the next booking starts with an empty form.
- If the time was taken and the client is sent back to pick another, the answers stay, as today, because the booking isn't finished.
- /book?t=token is unchanged: it still fills the form from the lead record, the same way it does now.

No text, page or design changes.

## Credit cost
I can't see credit prices from here, so I can't quote an exact number. This is a small change: about four files, in one pass. On your plan that's typically a low single-digit number of credits.

## Technical details
- admin.bookings.tsx: sort descending by `start`. Add `completed → no_show` and `no_show → completed` actions through ActionDialog via the existing `set()`, which doesn't cancel reminders for these past bookings. No server email or calendar call.
- booking-drawer.tsx `Badges`: drop the verified pill (used by the Dashboard and the drawer); Leads untouched.
- booking-draft.ts: add `clearDraft()` (sessionStorage.removeItem). book.verify.tsx: on `confirmed`, call clearDraft instead of saveDraft before navigating to /booked.
