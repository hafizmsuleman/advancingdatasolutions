# Fix the two automation bugs

## What's actually wrong

**Bug 1: the 5-minute job runs, but our site turns it away every time.**
- The scheduled job exists, is switched on, and fires every 5 minutes. Every run is logged as "succeeded".
- It calls `advancingdatasolutions.lovable.app`. That address now forwards to your own domain, `book.advancingdatasolutions.com`.
- When a call gets forwarded to a different address, the secret pass is dropped on the way. Our site gets a call with no secret, so it answers "Unauthorized" (401). The logs show this on every run, all day.
- "Run now" works because it runs from your signed-in admin session and never makes that forwarded call.
- The secret itself is fine: it's stored correctly and matches what the site checks for.
- One run today also hit the job's 5-second wait limit, which is too short for a full automations run.

**Bug 2: the two NDA reminders are stuck because they are too old to send.**
- Both were due Thu 1 Oct at 10:14 and 10:15 pm (Karachi). Because of Bug 1, nothing ran at that time.
- The sender only picks up emails that became due in the last 6 hours, so a late reminder doesn't arrive hours after it would have made sense. By the time you pressed Run now they were about 17 hours overdue, so they were skipped.
- Nothing ever closes out emails like that, so they stay "Scheduled" forever. Three older real reminders from Sep 28–29 and one demo reminder are stuck the same way.

## The fix

1. **Point the job at the final address.** It will call `https://book.advancingdatasolutions.com/api/public/hooks/automations` directly, so nothing forwards it and the secret arrives. I'll also raise its wait limit from 5 to 30 seconds. The secret, the schedule (every 5 minutes) and the site's secret check stay the same.
2. **Close out emails that missed their send window.** Each run, any reminder still "Scheduled" more than 6 hours after it was due gets marked "Cancelled – Not sent", with the note "Missed send window". It is not sent late. This clears the two NDA reminders and the other stuck ones, and the Outbox shows what really happened.

Nothing else changes: the same rules, email texts, pages, timing and 6-hour window.

## How I'll check it
- After the next 5-minute run, the job log shows success (200) and Settings shows a new "Last run" time without anyone pressing Run now.
- The two NDA reminders show as cancelled with "Missed send window".

## Technical details
- Update `cron.job` 1 command (via run_sql, not a migration): `url := 'https://book.advancingdatasolutions.com/api/public/hooks/automations'`, add `timeout_milliseconds := 30000`. Root cause evidence: `net._http_response` = 401 "Unauthorized", worker logs show the request arriving on host book.advancingdatasolutions.com (a redirect strips Authorization on the host change).
- `src/lib/automations.server.ts`: new step before delivery — update `messages` set status `cancelled`, error `Missed send window` where status `scheduled` and `scheduled_utc < now - 6h`, limited to a batch. This matches the existing 6h cutoff in `deliverDue`.
