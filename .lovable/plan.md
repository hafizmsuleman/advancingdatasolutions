# "Ended" status, outcome tidy-ups, optional no-show email

Items 1 to 6 are admin-only. Item 7 is client-facing and needs your approval of the draft email below. The outcome actions and private note stay exactly as they are.

## 1. New "Ended" status
- **How statuses are stored:** a fixed list in the database (completed, no_show, cancelled and so on). It is not a check rule.
- **Change needed:** add one value, `ended`, to that list. This only adds an option; nothing existing is removed or renamed.
- **What the 5-minute job does:** after a booking's end time it sets **Ended** instead of Completed. Only you set Completed or No-show.
- **Admin > Bookings:** Ended bookings show the pill **"Ended: outcome not recorded"** (neutral grey). The Status filter gets an "Ended" option.

## 2. What depends on "Completed" (checked)
- **Daily cap, free times and overlap protection:** these only count Booked bookings, not Completed ones. This holds in the time picker, the final checks when a client requests and confirms a time, and the database overlap rule. Ended will be treated exactly like Completed is today, so taking slots and rebooking work the same as now.
- **Client emails and reminders:** none of them are sent or chosen based on "Completed". Reminders whose booking is no longer Booked are already dropped, and Ended is not Booked, so they behave the same. No client email changes.
- **Public pages:** none of them check for "Completed". A client opening their link sees exactly what a Completed booking shows today.
- **Calendar:** Ended is handled like Completed, so events are left alone.
- **Lead nudges (needs a change to stay the same):** a lead with a Completed booking is never nudged. Ended must count the same way, or clients would start getting "pick a time" emails after their call. I'll add Ended there.
- **Dashboard "Bookings this week" card:** it counts Completed bookings, so I'll add Ended to keep the number unchanged. The "Attendance confirmed" card counts upcoming bookings only, so it isn't affected.
- **Reset demo data / Generate sample data:** their samples marked Completed stay Completed, which stands for an outcome you recorded. Sample bookings that end later turn Ended through the job, like real ones.

## 3. Bookings already marked Completed
They stay Completed, with no change. Their buttons still let you switch them to No-show or edit the note, as today.

## 4. Actions per row
- **Booked, before the end time:** as today: Cancel and Block. After the start time you also get Mark completed and No-show.
- **Ended:** Mark completed, No-show, Block. No Cancel. The attendance badge stays visible ("Attendance confirmed" or "Attendance not confirmed").
- **Completed / No-show:** as today, with no Cancel.

## 5. Note button wording
On the current outcome, the button reads **"Add note"** when there is no note and **"Update note"** when there is one.

## 6. Dashboard count
The Dashboard already loads every booking, so no new data fetching is needed. I'll add a small line, **"N waiting for an outcome"**, that links to Admin > Bookings filtered to Ended. It follows the Data view setting.

## 7. Optional email to the client on No-show
- The No-show dialog keeps **"Private note"** (only our team sees it). Below it go a separate **"Message to client (optional)"** box (up to 500 characters; links and line breaks removed, like the cancel reason) and a tick box **"Send an email to the client"**, off by default.
- No email is sent unless you tick the box. Without the tick, No-show works exactly as now: no email, no calendar change.
- **Sending rules:**
  - The email goes out at most once per booking, even if you click twice or switch back and forth.
  - Switching to Completed never sends anything.
  - Demo and sample bookings never send it: it is logged as "Sent (demo)" and never delivered.
  - The private note is never used in the email or saved with it.
- **Outbox:** each email is logged with its own type, "No-show follow-up", and shows Sent or Failed. It retries up to 3 times, and blocked or unsubscribed addresses show as Failed. Nothing about other emails changes.

### Draft email (for approval)
Subject: **Sorry we missed you today**

> Hi {first name},
>
> We were ready for your free consultation on {Tuesday 29 September, 4:00 PM (Pakistan time)}, but we weren't able to connect on the call.
>
> {Your message, if you wrote one}
>
> If you'd still like to talk, you're welcome to choose a new time that suits you.
>
> [Book a new time] (button, links to book.advancingdatasolutions.com/book)
>
> The Advancing Data Solutions team

If you leave the message box empty, that line is left out. The email uses the same branded layout and plain-text version as our other emails, and times are shown in the client's own time zone.

## Credit cost
Medium-small: two additions to the database's fixed lists, plus edits to about seven files (job, Bookings page, Dashboard, details panel, data loading, one new email template and one server step), done in one pass. I can't see exact prices from here. On your plan this is usually a single-digit number of credits.

## Technical details
- Migration: `ALTER TYPE public.booking_status ADD VALUE 'ended'; ALTER TYPE public.message_type ADD VALUE 'no_show_notice';`.
- `automations.server.ts` step 4: `update({ status: "ended" })`. Nudge active-booking check: add `"ended"`. Step 5 stale-event list is unchanged (ended is not included, same as completed).
- `admin-sample.ts` BookingStatus: add `"ended"`. `admin-data.ts`: map it, and add `ended` to the bookingsThisWeek statuses. `admin.bookings.tsx`: STATUS entry, actions, Add/Update note label, no-show dialog extras. `admin.index.tsx`: count from useAdminBookings.
- New `markNoShowWithEmail` server fn (requireSupabaseAuth + is_admin, like cancelAdminBooking): updates status and note. Only when `notify` is set and no `no_show_notice` message exists for the booking, it inserts one (is_demo copied; the demo guard handles the recipient) and calls deliverMessage. Without `notify`, the existing browser update path stays.
- Registry: add a `no_show_notice` template using branded.tsx with a "Book a new time" button to `${SITE_URL}/book`. Outbox label "No-show follow-up".
- `ActionDialog`: optional extra input + checkbox props, so other dialogs are unchanged.
