# Settings not reaching the time picker + second NDA reminder

## 1. Bug: weekend times and 2-hour notice not showing

**What I checked**
- Your saved settings are correct in the database: all 7 days (including Saturday and Sunday) are on, 15:00 to 24:00, and minimum notice is 2 hours.
- No cache is the cause. The booking page re-reads busy times each time it opens (and every 60 seconds); Google Calendar busy times are kept for 5 minutes. Neither stores your settings.

**The cause**
The code that builds the list of times never reads your availability or notice settings. It has fixed rules written into it: Monday to Friday only, 15:00 to 24:00, 24-hour notice (and also the 15-minute gap, 3 per day, 14 days, every 30 minutes). The only setting it reads is your time zone. So Settings saves correctly, but the booking page ignores it. The same fixed rules are used in the final checks when a client requests and confirms a time, so those ignore Settings too.

**The fix**
- The server reads your saved availability (per day, with start and end times), minimum notice, gap, daily cap, horizon and slot step from Settings, and sends them to the time picker with the busy times.
- The time picker, the reschedule picker and both final checks use those same values, so they always agree. Current values stay as fallbacks if something is missing.
- No design or text changes. Sample-data placement uses the same rules.

**How to test:** open /book in a private window, reach the time step, and check that Saturday and Sunday show 3:00 PM to midnight (Pakistan time) and that times from about 2 hours from now appear.

## 2. Second NDA reminder

**Proposed rule**
- First reminder: unchanged, 2 hours after booking, dropped if the NDA is signed.
- Second reminder: 1 hour before the call, only if the NDA is still unsigned when it is due.
- Late bookings: if the call is **less than 3 hours** after booking, only the second one (1 hour before the call) is sent. With your 2-hour minimum notice, that reminder always lands after booking and before the call.
- Never after the call has started: any NDA reminder whose call has started is dropped, never sent.
- Signed NDA: every unsent NDA reminder for that booking is dropped.

Example: booked Monday 10:00 for Wednesday 16:00 means reminders at Monday 12:00 and Wednesday 15:00. Booked 10:00 for 12:30 the same day means only one, at 11:30.

Note: the second NDA reminder goes out at the same time as the existing "Starting in 1 hour" email, so an unsigned client gets two emails together. If you'd rather, I can send it at 2 hours before the call instead. Tell me which you prefer; the plan assumes 1 hour as you asked.

**Reschedule and cancel:** same as the other reminders. Reschedule cancels the unsent ones and re-creates them for the new time using the rule above (the "2 hours after booking" one keeps the original booking time). Cancel cancels both.

**Existing scheduled NDA reminders:** left as they are. Bookings confirmed before this change don't get the second reminder unless they're rescheduled. I won't add it to them unless you ask.

**6-hour missed-send rule:** no effect on the new reminder. That rule only closes emails more than 6 hours overdue. The new one is either sent before the call or dropped once the call starts.

**Text:** the new email reuses the existing NDA reminder text and subject unchanged ("Please sign the NDA before your consultation ... on [date and time]"), which reads correctly 1 hour before. No new wording.

**Demo bookings:** they follow the same rule on the simulated clock, appear in the Outbox, and are never delivered.

## Technical details
- `loadSchedule` returns `rules` (windows per weekday, notice, buffer, cap, horizon, step) from `settings` + `availability_windows`. `generateSlots` takes `rules` (defaults equal current constants). `useBusy` passes them through. `requestBooking`/`verifyCode`/`rescheduleBooking` and `demo-placement.server.ts` use the same rules.
- No schema change: the second reminder is a second `nda_reminder` row at `start - 1h`. In `scheduleReminders`: add the 2h-after row only if `start - created >= 3h` and it's before the start; always add the start-1h row if it's in the future.
- Automations step 3 also drops NDA reminders whose booking has started. The demo path counts NDA reminders by scheduled time, not just by type, so both can be created.
