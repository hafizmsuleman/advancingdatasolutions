import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, FileSignature, Mail, Timer, BadgeCheck, CalendarCheck, Clock, Inbox } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Panel, Pill, PageIntro, DemoNote } from "@/components/admin-ui";
import { SAMPLE_BOOKINGS, STATS, TEAM_TZ, fmtIn, tzLabel, type AdminBooking } from "@/lib/admin-sample";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Overnight — Admin — Advancing Data Solutions" },
      { name: "description", content: "Overnight bookings and automation stats." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Overnight,
});

export function Badges({ b }: { b: AdminBooking }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {b.verified ? <Pill tone="success" icon={BadgeCheck}>Verified</Pill> : <Pill tone="neutral">Unverified</Pill>}
      {b.ndaSigned ? <Pill tone="success" icon={FileSignature}>NDA signed</Pill> : <Pill tone="neutral" icon={FileSignature}>NDA not signed</Pill>}
      {b.attendance ? <Pill tone="success" icon={CalendarCheck}>Attendance confirmed</Pill> : <Pill tone="warning" icon={Clock}>Attendance unconfirmed</Pill>}
    </div>
  );
}

export function BookingDrawer({ b, onClose }: { b: AdminBooking | null; onClose: () => void }) {
  return (
    <Sheet open={!!b} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {b && (
          <>
            <SheetHeader>
              <SheetTitle>{b.company}</SheetTitle>
              <SheetDescription>{b.name} · {b.role}</SheetDescription>
            </SheetHeader>
            <div className="mt-4 space-y-4 px-4 pb-6 text-sm">
              <Badges b={b} />
              <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2">
                {[
                  ["Reference", b.code],
                  ["Email", b.email],
                  ["Country", b.country],
                  ["Session", `Free Consultation · ${b.duration} min`],
                  ["Team time", `${fmtIn(b.start, TEAM_TZ)} (PKT)`],
                  ["Client time", `${fmtIn(b.start, b.clientTz)} (${tzLabel(b.clientTz)})`],
                  ["Project area", b.area],
                  ["Platform", b.platform],
                  ["Need", b.need],
                  ["Timeline", b.timeline],
                  ["Budget", b.budget],
                  ["Booked", fmtIn(b.createdAt, TEAM_TZ)],
                ].map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="tabular-nums text-foreground break-words">{v}</dd>
                  </div>
                ))}
              </dl>
              <div>
                <h3 className="mb-1 text-xs font-medium text-muted-foreground">Notes from the client</h3>
                <p className="rounded-lg bg-muted p-3 leading-relaxed text-foreground">{b.notes}</p>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Overnight() {
  const [open, setOpen] = useState<AdminBooking | null>(null);
  const fresh = SAMPLE_BOOKINGS.filter((b) => b.isNew && b.status === "confirmed");
  const stats = [
    { label: "Bookings this week", value: STATS.bookingsThisWeek, icon: CalendarDays },
    { label: "NDAs signed", value: STATS.ndasSigned, icon: FileSignature },
    { label: "Emails automated", value: STATS.emailsAutomated, icon: Mail },
    { label: "Hours saved", value: STATS.hoursSaved.toFixed(1), icon: Timer },
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

      <PageIntro title="New bookings">Booked since you last checked.</PageIntro>
      {fresh.length === 0 ? (
        <Panel className="flex flex-col items-center p-10 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="mt-2 font-medium text-foreground">All caught up</p>
          <p className="text-sm text-muted-foreground">No new bookings overnight.</p>
        </Panel>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {fresh.map((b) => (
            <button key={b.id} onClick={() => setOpen(b)} className="text-left">
              <Panel className="h-full p-4 transition-colors hover:border-primary/40">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-foreground">{b.company}</div>
                    <div className="text-xs text-muted-foreground">{b.role} · {b.country}</div>
                  </div>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">{b.duration} min</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <span className="text-muted-foreground">Area / platform</span><span>{b.area} · {b.platform}</span>
                  <span className="text-muted-foreground">Need</span><span>{b.need}</span>
                  <span className="text-muted-foreground">Budget</span><span className="tabular-nums">{b.budget}</span>
                  <span className="text-muted-foreground">Team (PKT)</span><span className="tabular-nums">{fmtIn(b.start, TEAM_TZ)}</span>
                  <span className="text-muted-foreground">Client ({tzLabel(b.clientTz)})</span><span className="tabular-nums">{fmtIn(b.start, b.clientTz)}</span>
                </div>
                <div className="mt-3"><Badges b={b} /></div>
              </Panel>
            </button>
          ))}
        </div>
      )}
      <DemoNote />
      <BookingDrawer b={open} onClose={() => setOpen(null)} />
    </div>
  );
}
