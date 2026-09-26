import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

import { BookingGate, BookingSummary, Card } from "@/components/booking-gate";
import { StatusBadge } from "@/components/status-badge";
import { saveBooking } from "@/lib/sample-bookings";

const TITLE = "Confirm attendance — Advancing Data Solutions";
const DESC = "Confirm you'll attend your free consultation with our engineers.";

export const Route = createFileRoute("/attend/$token")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AttendPage,
});

function AttendPage() {
  const { token } = Route.useParams();
  return (
    <BookingGate token={token}>
      {(b, setB) => (
        <Card>
          {b.attendanceConfirmedAt ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-success" aria-hidden />
              <h1 className="mt-4 text-2xl font-semibold tracking-tight">You're confirmed</h1>
              <div className="mt-3"><StatusBadge kind="attendance-confirmed" /></div>
              <p className="mt-3 text-muted-foreground">Thanks for letting us know. Our engineers will see you then.</p>
            </div>
          ) : (
            <div className="text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Confirm your attendance</h1>
              <p className="mt-2 text-muted-foreground">Please confirm so we can keep this time reserved for you.</p>
            </div>
          )}
          <div className="mt-6"><BookingSummary b={b} /></div>
          {!b.attendanceConfirmedAt && (
            <button type="button" onClick={() => { const nb = { ...b, attendanceConfirmedAt: new Date().toISOString() }; saveBooking(nb); setB(nb); }}
              className="mt-6 min-h-11 w-full rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
              Confirm my attendance
            </button>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm">
            <Link to="/booked/$token" params={{ token }} className="font-medium text-primary underline-offset-4 hover:underline">View booking</Link>
            <Link to="/reschedule/$token" params={{ token }} className="font-medium text-primary underline-offset-4 hover:underline">Reschedule</Link>
          </div>
        </Card>
      )}
    </BookingGate>
  );
}
