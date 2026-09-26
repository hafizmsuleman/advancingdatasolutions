import { FileSignature, BadgeCheck, CalendarCheck, Clock } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Pill } from "@/components/admin-ui";
import { TEAM_TZ, fmtIn, tzLabel, type AdminBooking } from "@/lib/admin-sample";

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

