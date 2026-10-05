import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, FileSignature, Mail, CalendarCheck, Inbox } from "lucide-react";
import { Badges, BookingDrawer } from "@/components/booking-drawer";
import { Panel, PageIntro } from "@/components/admin-ui";
import { browserTimeZone, fmtIn, tzLabel, type AdminBooking } from "@/lib/admin-sample";
import { useAdminBookings, useAdminStats } from "@/lib/admin-data";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Admin — Advancing Data Solutions" },
      { name: "description", content: "New bookings and automation stats." },
      { property: "og:title", content: "Dashboard — Admin — Advancing Data Solutions" },
      { property: "og:description", content: "New bookings and automation stats." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [open, setOpen] = useState<AdminBooking | null>(null);
  const { data: all = [] } = useAdminBookings();
   const { data: STATS = { bookingsThisWeek: 0, ndasSigned: 0, emailsAutomated: 0, upcomingTotal: 0, attendanceConfirmed: 0 } } = useAdminStats();
  const waiting = all.filter((b) => b.status === "ended").length;
  const fresh = all.filter((b) => b.isNew && b.status === "confirmed");
  const stats = [
    { label: "Bookings this week", value: STATS.bookingsThisWeek, icon: CalendarDays },
    { label: "NDAs signed", value: STATS.ndasSigned, icon: FileSignature },
    { label: "Emails automated", value: STATS.emailsAutomated, icon: Mail },
     { label: "Attendance confirmed", value: `${STATS.attendanceConfirmed} of ${STATS.upcomingTotal}`, icon: CalendarCheck },
  ];
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Panel key={s.label} className="p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {s.label}
              <s.icon className="h-4 w-4" aria-hidden />
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground">{s.value}</div>
          </Panel>
        ))}
      </div>

      {waiting > 0 && (
        <p className="-mt-3 mb-6 text-sm text-muted-foreground">
          <Link to="/admin/bookings" search={{ status: "ended" }} className="font-medium text-primary hover:underline">{waiting} waiting for an outcome</Link>
        </p>
      )}
      <PageIntro title="New bookings">Booked since you last checked.</PageIntro>
      {fresh.length === 0 ? (
        <Panel className="flex flex-col items-center p-10 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="mt-2 font-medium text-foreground">All caught up</p>
           <p className="text-sm text-muted-foreground">No new bookings.</p>
        </Panel>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {fresh.map((b) => (
            <button key={b.id} onClick={() => setOpen(b)} className="text-left">
              <Panel className="h-full p-4 transition-colors hover:border-primary/40">
                <div className="flex items-start justify-between gap-2">
                  <div>
                     <div className="font-semibold text-foreground">{b.company} – {b.name}</div>
                    <div className="text-xs text-muted-foreground">{b.role} · {b.country}</div>
                  </div>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">{b.duration} min</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <span className="text-muted-foreground">Area / platform</span><span>{b.area} · {b.platform}</span>
                  <span className="text-muted-foreground">Need</span><span>{b.need}</span>
                  <span className="text-muted-foreground">Budget</span><span className="tabular-nums">{b.budget}</span>
                   <span className="text-muted-foreground">Your time</span><span className="tabular-nums">{fmtIn(b.start, browserTimeZone())}</span>
                   <span className="text-muted-foreground">Client's time ({tzLabel(b.clientTz)})</span><span className="tabular-nums">{fmtIn(b.start, b.clientTz)}</span>
                </div>
                <div className="mt-3"><Badges b={b} /></div>
              </Panel>
            </button>
          ))}
        </div>
      )}
      <BookingDrawer b={open} onClose={() => setOpen(null)} />
    </div>
  );
}
