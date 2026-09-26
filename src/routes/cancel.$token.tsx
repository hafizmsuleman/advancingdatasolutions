import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { BookingGate, BookingSummary, Card } from "@/components/booking-gate";
import { saveBooking, type SampleBooking } from "@/lib/sample-bookings";

const TITLE = "Cancel consultation — Advancing Data Solutions";
const DESC = "Cancel your free consultation with our engineers.";

export const Route = createFileRoute("/cancel/$token")({
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
  component: CancelPage,
});

function CancelPage() {
  const { token } = Route.useParams();
  return <BookingGate token={token} allowCancelled>{(b, setB) => <Cancel b={b} setB={setB} token={token} />}</BookingGate>;
}

const MAX = 500;
const clean = (s: string) => s.replace(/(https?:\/\/|www\.)\S+/gi, "").trim().slice(0, MAX);

function Cancel({ b, setB, token }: { b: SampleBooking; setB: (b: SampleBooking) => void; token: string }) {
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);

  if (b.cancelledAt) {
    return (
      <Card>
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" aria-hidden />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Cancelled</h1>
          <p className="mt-2 text-muted-foreground">Your consultation ({b.code}) has been cancelled and the time has been released. We hope to talk another time.</p>
          <Link to="/book" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
            Book a new time
          </Link>
        </div>
      </Card>
    );
  }

  function cancel() {
    const nb = { ...b, cancelledAt: new Date().toISOString(), cancelReason: clean(reason) || undefined };
    saveBooking(nb);
    setB(nb);
  }

  return (
    <Card>
      <h1 className="text-2xl font-semibold tracking-tight">Cancel your consultation</h1>
      <p className="mt-2 text-muted-foreground">If another time would suit you better, you can <Link to="/reschedule/$token" params={{ token }} className="font-medium text-primary underline-offset-4 hover:underline">reschedule instead</Link>.</p>
      <div className="mt-6"><BookingSummary b={b} /></div>

      <label htmlFor="reason" className="mt-6 block text-sm font-medium">Reason <span className="font-normal text-muted-foreground">(optional)</span></label>
      <textarea id="reason" rows={3} maxLength={MAX} value={reason} onChange={(e) => setReason(e.target.value)}
        placeholder="Let us know why, so we can improve."
        className="mt-2 w-full rounded-md border border-input bg-card px-3 py-2 text-base" />
      <p className="mt-1 text-right text-xs text-muted-foreground tnums">{reason.length}/{MAX}</p>

      {confirming ? (
        <div role="alertdialog" aria-labelledby="confirm-title" className="step-transition mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-5">
          <p id="confirm-title" className="flex items-start gap-2 font-medium">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden /> Are you sure? This releases your time slot.
          </p>
          <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row">
            <button type="button" onClick={() => setConfirming(false)} className="min-h-11 rounded-md border border-border bg-card px-6 text-sm font-medium hover:bg-muted">Keep my booking</button>
            <button type="button" onClick={cancel} className="min-h-11 flex-1 rounded-md bg-destructive px-6 text-sm font-semibold text-destructive-foreground hover:opacity-90">Yes, cancel consultation</button>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
          <Link to="/booked/$token" params={{ token }} className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-6 text-sm font-medium hover:bg-muted">Keep my booking</Link>
          <button type="button" onClick={() => setConfirming(true)} className="min-h-11 flex-1 rounded-md border border-destructive px-6 text-sm font-semibold text-destructive hover:bg-destructive/5">
            Cancel consultation
          </button>
        </div>
      )}
    </Card>
  );
}
