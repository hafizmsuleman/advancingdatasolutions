import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Panel, Pill, PageIntro, btn, field, th, td } from "@/components/admin-ui";
import { useAdminBookings, useInvalidateAdmin } from "@/lib/admin-data";
import { supabase } from "@/integrations/supabase/client";
import { browserTimeZone, fmtIn, dayKeyIn, tzLabel, type AdminBooking, type BookingStatus } from "@/lib/admin-sample";
import { BookingDrawer } from "@/components/booking-drawer";

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
  const [status, setStatus] = useState("all");
  const [area, setArea] = useState("all");
  const [date, setDate] = useState("");
  const [open, setOpen] = useState<AdminBooking | null>(null);

  const shown = rows
    .filter((b) => status === "all" || b.status === status)
    .filter((b) => area === "all" || b.area === area)
    .filter((b) => !date || dayKeyIn(b.start, browserTimeZone()) === date)
    .sort((a, b) => a.start.localeCompare(b.start));

  const set = (id: string, s: BookingStatus, msg: string) => {
    const patch = s === "cancelled" ? { status: s, cancelled_at: new Date().toISOString(), cancel_reason: "Cancelled by our team" } : { status: s };
    supabase.from("bookings").update(patch).eq("id", id).then(({ error }) => {
      if (error) { toast.error("Couldn't update the booking"); return; }
      toast.success(msg);
      invalidate();
    });
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
      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[1000px]">
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
                <td className={td}>
                  <button onClick={() => setOpen(b)} className="text-left font-medium text-primary hover:underline">{b.company}</button>
                  <div className="text-xs text-muted-foreground">{b.name} · {b.code}</div>
                </td>
                <td className={td}>{b.area}</td>
                <td className={td + " tabular-nums"}>{fmtIn(b.start, browserTimeZone())}</td>
                <td className={td + " tabular-nums"}>{fmtIn(b.start, b.clientTz)}<div className="text-xs text-muted-foreground">Client's time ({tzLabel(b.clientTz)})</div></td>
                <td className={td + " tabular-nums"}>{b.duration} min</td>
                <td className={td}><Pill tone={STATUS[b.status].tone}>{STATUS[b.status].label}</Pill></td>
                <td className={td}>
                  {b.status === "confirmed" && (
                    <div className="flex justify-end gap-1.5">
                      <button className={btn} onClick={() => set(b.id, "completed", `${b.company} marked completed`)}>Mark completed</button>
                      <button className={btn} onClick={() => set(b.id, "no_show", `${b.company} marked no-show`)}>Mark no-show</button>
                      <button className={btn + " text-destructive"} onClick={() => confirm(`Cancel ${b.company}'s consultation?`) && set(b.id, "cancelled", "Booking cancelled")}>Cancel</button>
                    </div>
                  )}
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
