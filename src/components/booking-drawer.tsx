import { FileSignature, CalendarCheck, Clock, CalendarX } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Pill } from "@/components/admin-ui";
import { browserTimeZone, fmtIn, tzLabel, cancellationText, type AdminBooking } from "@/lib/admin-sample";

export function Badges({ b }: { b: AdminBooking }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {b.status !== "cancelled" && (b.ndaSigned ? <Pill tone="success" icon={FileSignature}>NDA signed</Pill> : <Pill tone="neutral" icon={FileSignature}>NDA not signed</Pill>)}
      {b.status === "confirmed" && Date.parse(b.start) > Date.now() && (b.attendance ? <Pill tone="success" icon={CalendarCheck}>Attendance confirmed</Pill> : <Pill tone="warning" icon={Clock}>Attendance not confirmed</Pill>)}
      {b.declined && <Pill tone="error" icon={CalendarX}>Client declined in calendar</Pill>}
      {b.calendarFailed && <Pill tone="warning" icon={CalendarX}>Calendar not synced · fallback link in use</Pill>}
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
              <SheetTitle>{b.company} – {b.name}</SheetTitle>
              <SheetDescription>{b.role}</SheetDescription>
            </SheetHeader>
            <div className="mt-4 space-y-4 px-4 pb-6 text-sm">
              <Badges b={b} />
              <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2">
                {[
                  ["Email", b.email],
                  ["Country", b.country],
                  ["Session", `Free Consultation · ${b.duration} min`],
                  ["Your time", fmtIn(b.start, browserTimeZone())],
                  [`Client's time (${tzLabel(b.clientTz)})`, fmtIn(b.start, b.clientTz)],
                  ["Project area", b.area],
                  ["Platform", b.platform],
                  ["Need", b.need],
                  ["Timeline", b.timeline],
                  ["Budget", b.budget],
                  ["Booked", fmtIn(b.createdAt, browserTimeZone())],
                ].map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="tabular-nums text-foreground break-words">{v}</dd>
                  </div>
                ))}
              </dl>
              {b.status === "cancelled" && <p className="text-sm text-muted-foreground">{cancellationText(b)}</p>}
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

