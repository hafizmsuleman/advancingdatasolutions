import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { FileSignature, CalendarCheck, Clock } from "lucide-react";
import { Panel, Pill, PageIntro, btn, field, th, td } from "@/components/admin-ui";
import { blockSender, useAdminBookings, useInvalidateAdmin } from "@/lib/admin-data";
import { supabase } from "@/integrations/supabase/client";
import { browserTimeZone, fmtIn, dayKeyIn, tzLabel, type AdminBooking, type BookingStatus } from "@/lib/admin-sample";
import { BookingDrawer } from "@/components/booking-drawer";
import { cancelAdminBooking } from "@/lib/admin-booking.functions";
import { cancellationText } from "@/lib/admin-sample";
import { useServerFn } from "@tanstack/react-start";
import { ActionDialog } from "@/components/action-dialog";

export const Route = createFileRoute("/admin/bookings")({
  head: () => ({
    meta: [
      { title: "Bookings — Admin — Advancing Data Solutions" },
      { name: "description", content: "All consultation bookings." },
      { property: "og:title", content: "Bookings — Admin — Advancing Data Solutions" },
      { property: "og:description", content: "All consultation bookings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Bookings,
});

const STATUS: Record<BookingStatus, { label: string; tone: "success" | "info" | "warning" | "error" | "neutral" }> = {
  confirmed: { label: "Booked", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  no_show: { label: "No-show", tone: "error" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  released: { label: "Released", tone: "warning" },
};

function Bookings() {
  const { data: rows = [] } = useAdminBookings();
  const invalidate = useInvalidateAdmin();
  const cancelFn = useServerFn(cancelAdminBooking);
  const [status, setStatus] = useState("all");
  const [area, setArea] = useState("all");
  const [date, setDate] = useState("");
  const [open, setOpen] = useState<AdminBooking | null>(null);
  const [action, setAction] = useState<{ booking: AdminBooking; kind: Kind } | null>(null);
  const [reason, setReason] = useState("");
  const [blockValue, setBlockValue] = useState("");
  const [busy, setBusy] = useState(false);

  const shown = rows
    .filter((b) => status === "all" || b.status === status)
    .filter((b) => area === "all" || b.area === area)
    .filter((b) => !date || dayKeyIn(b.start, browserTimeZone()) === date)
    .sort((a, b) => b.start.localeCompare(a.start));

  const cancel = async (id: string, reason: string) => {
    try { await cancelFn({ data: { id, reason } }); toast.success("Booking cancelled"); invalidate(); return true; }
    catch { toast.error("Couldn't cancel the booking or queue its notice"); return false; }
  };

  // Outcome: status + private note only. No email, no calendar change.
  const setOutcome = async (b: AdminBooking, to: "completed" | "no_show", raw: string) => {
    const note = raw.replace(/(?:https?:\/\/|www\.)\S+/gi, "").replace(/[\r\n]+/g, " ").trim().slice(0, 500);
    const { error } = await supabase.from("bookings").update({ status: to, outcome_note: note || null })
      .eq("id", b.id).in("status", ["confirmed", "attendance_confirmed", "completed", "no_show"]);
    if (error) { toast.error("Couldn't update the booking"); return false; }
    toast.success(`${b.company} marked ${to === "no_show" ? "no-show" : "completed"}`);
    invalidate();
    return true;
  };

  const ask = (booking: AdminBooking, kind: Kind) => {
    setReason(kind === "completed" || kind === "no_show" ? booking.outcomeNote ?? "" : "");
    setBlockValue(booking.email.toLowerCase()); setAction({ booking, kind });
  };
  const applyAction = async () => {
    if (!action) return;
    setBusy(true);
    const { booking, kind } = action;
    let ok: boolean;
    if (kind === "block") {
      ok = await blockSender(blockValue, "Bookings");
      if (!ok) toast.error("Couldn't block this address"); else toast.success("Blocked");
    } else if (kind === "cancelled") {
      ok = await cancel(booking.id, reason);
    } else {
      ok = await setOutcome(booking, kind, reason);
    }
    setBusy(false);
    if (ok) setAction(null);
  };
  const k = action?.kind;
  const same = !!action && action.booking.status === k;

  return (
    <div className="mx-auto max-w-6xl">
      <PageIntro title="Bookings">{shown.length} of {rows.length} bookings</PageIntro>
      <div className="mb-3 flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="f-status">Status</label>
        <select id="f-status" className={field} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <label className="sr-only" htmlFor="f-area">Project area</label>
        <select id="f-area" className={field} value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="all">All areas</option>
          <option value="Data">Data</option><option value="AI">AI</option><option value="Web">Web</option>
        </select>
        <label className="sr-only" htmlFor="f-date">Date (your time)</label>
        <input id="f-date" type="date" className={field} value={date} onChange={(e) => setDate(e.target.value)} />
        {(status !== "all" || area !== "all" || date) && (
          <button className={btn + " h-9"} onClick={() => { setStatus("all"); setArea("all"); setDate(""); }}>Clear</button>
        )}
      </div>
      <Panel className="overflow-x-auto lg:overflow-x-visible">
        <table className="w-full min-w-[800px] table-fixed lg:min-w-0">
          <colgroup><col className="w-[18%]"/><col className="w-[6%]"/><col className="w-[13%]"/><col className="w-[17%]"/><col className="w-[7%]"/><col className="w-[17%]"/><col className="w-[22%]"/></colgroup>
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className={th}>Client</th><th className={th}>Area</th><th className={th}>Your time</th>
              <th className={th}>Client's time</th><th className={th}>Length</th><th className={th}>Status</th><th className={th}><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {shown.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">No bookings match these filters.</td></tr>
            )}
            {shown.map((b) => (
              <tr key={b.id} className="hover:bg-muted/30">
                <td className={td + " !whitespace-normal"}>
                  <button onClick={() => setOpen(b)} className="block w-full min-w-0 text-left">
                     <span className="block break-words font-medium leading-snug text-primary hover:underline">{b.company}</span>
                    <span className="block break-words text-xs leading-snug text-muted-foreground">{b.name}</span>
                  </button>
                </td>
                <td className={td}>{b.area}</td>
                <td className={td + " !whitespace-normal tabular-nums"}>{fmtIn(b.start, browserTimeZone())}</td>
                <td className={td + " !whitespace-normal tabular-nums"}>{fmtIn(b.start, b.clientTz)}<div className="break-words text-xs text-muted-foreground">({tzLabel(b.clientTz)})</div></td>
                <td className={td + " tabular-nums"}>{b.duration} min</td>
                <td className={td + " !whitespace-normal"}><Pill tone={STATUS[b.status].tone}>{STATUS[b.status].label}</Pill>{(b.status === "completed" || b.status === "no_show") && b.outcomeNote && <div className="mt-1 truncate text-xs text-muted-foreground" title={b.outcomeNote}>{b.outcomeNote}</div>}{b.calendarFailed && <div className="mt-1"><Pill tone="warning">Calendar not synced</Pill></div>}{b.declined && b.status === "confirmed" && <div className="mt-1"><Pill tone="error">Client declined in calendar</Pill></div>}{b.status === "cancelled" && <div className="mt-1 text-xs text-muted-foreground">{cancellationText(b)}</div>}{b.status !== "cancelled" && (b.ndaSigned ? <div className="mt-1"><Pill tone="success" icon={FileSignature}>NDA signed</Pill></div> : <div className="mt-1"><Pill tone="neutral" icon={FileSignature}>NDA not signed</Pill></div>)}{b.status === "confirmed" && (b.attendance ? <div className="mt-1"><Pill tone="success" icon={CalendarCheck}>Attendance confirmed</Pill></div> : <div className="mt-1"><Pill tone="warning" icon={Clock}>Attendance not confirmed</Pill></div>)}</td>
                <td className={td}>
                  <div className="flex flex-wrap justify-end gap-1 max-lg:min-w-[142px]">
                  {["confirmed", "completed", "no_show"].includes(b.status) && Date.parse(b.start) <= Date.now() && (<>
                    <button className={btn} onClick={() => ask(b, "completed")}>{b.status === "completed" ? "Update note" : "Mark completed"}</button>
                    <button className={btn} onClick={() => ask(b, "no_show")}>{b.status === "no_show" ? "Update note" : "No-show"}</button>
                  </>)}
                  {b.status === "confirmed" && <button className={btn + " text-destructive"} onClick={() => ask(b, "cancelled")}>Cancel</button>}
                     <button className={btn + " text-destructive"} onClick={() => ask(b, "block")}>Block</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <ActionDialog open={!!action} onOpenChange={(v) => { if (!v) setAction(null); }}
        title={k === "cancelled" ? `Cancel ${action?.booking.company}'s consultation?` : k === "block" ? "Block this email, or edit it to a domain (e.g. example.com):" : same ? `Update the note for ${action?.booking.company}` : k === "no_show" ? `Mark ${action?.booking.company} as no-show?` : `Mark ${action?.booking.company ?? "booking"} as completed?`}
        confirmLabel={k === "cancelled" ? "Cancel booking" : k === "block" ? "Block" : same ? "Save note" : k === "no_show" ? "No-show" : "Mark completed"}
        destructive={k === "cancelled" || k === "block"} busy={busy} onConfirm={applyAction}
        input={k === "cancelled" ? { label: "Reason (optional)", value: reason, onChange: setReason, note: "This will be included in the email to the client", maxLength: 500, multiline: true } : k === "block" ? { label: "Email or domain", value: blockValue, onChange: setBlockValue, maxLength: 254 } : { label: "Private note (optional)", value: reason, onChange: setReason, note: "Only visible to our team. No email is sent and the calendar is unchanged.", maxLength: 500, multiline: true }} />
      <BookingDrawer b={open} onClose={() => setOpen(null)} />
    </div>
  );
}
