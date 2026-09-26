<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Public booking pages read/act only via token RPCs (get_public_booking, sign_nda, confirm_attendance, get_lead_prefill) or server fns in src/lib/booking.functions.ts (service role) — tables stay admin-only under RLS.
- Admin pages use the browser client under RLS (is_admin()); /admin layout is ssr:false with a client beforeLoad gate.
- Until email sending (F12), all emails are queued as rows in `messages` (status scheduled); verification codes are readable in Admin → Outbox.
- Slot rules live in src/lib/slots.ts constants and are re-checked server-side in requestBooking/rescheduleBooking.
