import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

import { BookingGate, BookingSummary, Card } from "@/components/booking-gate";
import { SlotPicker } from "@/components/slot-picker";
import { fetchBooking, type SampleBooking } from "@/lib/sample-bookings";
import { rescheduleBooking } from "@/lib/booking.functions";
import type { Slot } from "@/lib/slots";

const TITLE = "Reschedule — Advancing Data Solutions";
const DESC = "Choose a new time for your free consultation with our engineers.";

export const Route = createFileRoute("/reschedule/$token")({
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
  component: ReschedulePage,
});

function ReschedulePage() {
  const { token } = Route.useParams();
  return <BookingGate token={token}>{(b, setB) => <Reschedule b={b} setB={setB} token={token} />}</BookingGate>;
}

function Reschedule({ b, setB, token }: { b: SampleBooking; setB: (b: SampleBooking) => void; token: string }) {
  const [tz, setTz] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [sel, setSel] = useState<Slot | null>(null);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function confirm() {
    if (!sel) return;
    setErr("");
    const r = await rescheduleBooking({ data: { token, slotStart: new Date(sel.start).toISOString(), timeZone: tz } });
    if ("error" in r) {
      setSel(null);
      setErr(r.error === "slot_taken" ? "That time was just booked by someone else. Please choose another slot." : "We couldn't move this booking. Please try again.");
      return;
    }
    const nb = await fetchBooking(token);
    if (nb) setB(nb);
    setDone(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (done) {
    return (
      <Card>
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" aria-hidden />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Rescheduled</h1>
          <p className="mt-2 text-muted-foreground">Your consultation has moved to the new time below. The meeting link stays the same.</p>
        </div>
        <div className="mt-6"><BookingSummary b={b} label="New time" /></div>
        <Link to="/booked/$token" params={{ token }} className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
          Back to your booking
        </Link>
      </Card>
    );
  }

  const fmt = (ms: number) => new Intl.DateTimeFormat(undefined, { timeZone: tz, weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" }).format(ms);

  return (
    <Card>
      <h1 className="text-2xl font-semibold tracking-tight">Reschedule your consultation</h1>
      <p className="mt-2 text-muted-foreground">Pick a new time. Your session length stays the same.</p>
      <div className="mt-6"><BookingSummary b={b} label="Current time" /></div>
      <h2 className="mt-8 mb-4 text-lg font-semibold tracking-tight">Choose a new time</h2>
      <SlotPicker duration={b.duration} tz={tz} onTzChange={setTz} selected={sel} onSelect={setSel} excludeStart={Date.parse(b.start)} excludeToken={token} />
      {err && <p role="alert" className="mt-4 text-sm text-warning">{err}</p>}
      {sel && <p className="mt-6 text-sm tnums" aria-live="polite">New time: <strong className="font-medium">{fmt(sel.start)}</strong></p>}
      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
        <Link to="/booked/$token" params={{ token }} className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-6 text-sm font-medium hover:bg-muted">Keep current time</Link>
        <button type="button" disabled={!sel} onClick={confirm}
          className="min-h-11 flex-1 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60">
          Confirm new time
        </button>
      </div>
    </Card>
  );
}
