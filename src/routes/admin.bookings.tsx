import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Panel, Pill, PageIntro, btn, field, th, td } from "@/components/admin-ui";
import { blockSender, useAdminBookings, useInvalidateAdmin } from "@/lib/admin-data";
import { supabase } from "@/integrations/supabase/client";
import { browserTimeZone, fmtIn, dayKeyIn, tzLabel, type AdminBooking, type BookingStatus } from "@/lib/admin-sample";
import { BookingDrawer } from "@/components/booking-drawer";
import { cancelAdminBooking } from "@/lib/admin-booking.functions";
import { cancellationText } from "@/lib/admin-sample";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/admin/bookings")({
  head: () => ({
    meta: [
      { title: "Bookings — Admin — Advancing Data Solutions" },
      { name: "description", content: "All consultation bookings." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Bookings,
});

const STATUS: Record<BookingStatus, { label: string; tone: "success" | "info" | "warning" | "error" | "neutral" }> = {
  confirmed: { label: "Confirmed", tone: "info" },
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

  const shown = rows
    .filter((b) => status === "all" || b.status === status)
    .filter((b) => area === "all" || b.area === area)
    .filter((b) => !date || dayKeyIn(b.start, browserTimeZone()) === date)
    .sort((a, b) => a.start.localeCompare(b.start));

  const set = async (id: string, s: BookingStatus, msg: string) => {
    if (s === "cancelled") {
      try { await cancelFn({ data: { id } }); toast.success(msg); invalidate(); }
      catch { toast.error("Couldn't cancel the booking or queue its notice"); }
      return;
    }
    const patch = { status: s };
    if (s !== "completed") void supabase.from("messages").update({ status: "cancelled" }).eq("booking_id", id).eq("status", "scheduled")
      .in("type", ["nda_reminder", "reminder_24h", "reminder_1h"]).gt("scheduled_utc", new Date().toISOString());
    supabase.from("bookings").update(patch).eq("id", id).then(({ error }) => {
      if (error) { toast.error("Couldn't update the booking"); return; }
      toast.success(msg);
      invalidate();
    });
  };

  const block = async (b: AdminBooking) => {
    const ok = await blockSender(b.email, "Bookings");
    if (ok === null) return;
    if (!ok) toast.error("Couldn't block this address"); else toast.success("Blocked");
  };

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
                <td className={td + " !whitespace-normal"}><Pill tone={STATUS[b.status].tone}>{STATUS[b.status].label}</Pill>{b.calendarFailed && <div className="mt-1"><Pill tone="warning">Calendar not synced</Pill></div>}{b.declined && b.status === "confirmed" && <div className="mt-1"><Pill tone="error">Client declined in calendar</Pill></div>}{b.status === "cancelled" && <div className="mt-1 text-xs text-muted-foreground">{cancellationText(b)}</div>}</td>
                <td className={td}>
                  <div className="flex flex-wrap justify-end gap-1 max-lg:min-w-[142px]">
                  {b.status === "confirmed" && (
                    <>
                      {Date.parse(b.start) <= Date.now() && (<>
                      <button className={btn} onClick={() => set(b.id, "completed", `${b.company} marked completed`)}>Complete</button>
                      <button className={btn} onClick={() => set(b.id, "no_show", `${b.company} marked no-show`)}>No-show</button>
                      </>)}
                      <button className={btn + " text-destructive"} onClick={() => confirm(`Cancel ${b.company}'s consultation?`) && set(b.id, "cancelled", "Booking cancelled")}>Cancel</button>
                    </>
                  )}
                    <button className={btn + " text-destructive"} onClick={() => block(b)}>Block</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <BookingDrawer b={open} onClose={() => setOpen(null)} />
    </div>
  );
}
