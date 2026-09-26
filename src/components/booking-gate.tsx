import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Clock, Video } from "lucide-react";

import { getBooking, type SampleBooking } from "@/lib/sample-bookings";

export function Notice({ title, body, children }: { title: string; body: string; children?: ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="step-transition w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-muted-foreground">{body}</p>
        {children ?? (
          <Link to="/book" className="mt-6 inline-flex min-h-11 items-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">Book a consultation</Link>
        )}
      </div>
    </main>
  );
}

/** Loads a booking by token and handles unknown / passed / cancelled links. */
export function BookingGate({ token, allowCancelled, children }: {
  token: string;
  allowCancelled?: boolean;
  children: (b: SampleBooking, setB: (b: SampleBooking) => void) => ReactNode;
}) {
  const [b, setB] = useState<SampleBooking | null | undefined>(undefined);
  useEffect(() => setB(getBooking(token)), [token]);

  if (b === undefined) return <main className="flex-1" />;
  if (!b) return <Notice title="Link not found or expired" body="We couldn't find a booking for this link. You can book a new free consultation with our engineers." />;
  if (b.cancelledAt && !allowCancelled) {
    return <Notice title="This consultation was cancelled" body="This booking is no longer active. You're welcome to book a new time." />;
  }
  if (!b.cancelledAt && Date.parse(b.start) + b.duration * 60000 < Date.now()) {
    return <Notice title="This session has passed" body="This consultation has already taken place. If you'd like to talk again, book a new time." />;
  }
  return <>{children(b, setB)}</>;
}

export function BookingSummary({ b, label = "Your consultation" }: { b: SampleBooking; label?: string }) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const s = Date.parse(b.start);
  const e = s + b.duration * 60000;
  const t = (ms: number) => new Intl.DateTimeFormat(undefined, { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(ms);
  const date = new Intl.DateTimeFormat(undefined, { timeZone: tz, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(s);
  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-start gap-3 p-4">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <div>
          <p className="text-sm text-muted-foreground">{label} · <span className="tnums">{b.duration} minutes</span></p>
          <p className="mt-1 font-medium tnums">{date}<br />{t(s)} – {t(e)} <span className="text-sm font-normal text-muted-foreground">({tz.replace(/_/g, " ")})</span></p>
        </div>
      </div>
      <div className="flex items-center gap-3 border-t border-border p-4 text-sm">
        <Video className="h-5 w-5 shrink-0 text-primary" aria-hidden />
        <span className="text-muted-foreground">Reference</span>
        <span className="ml-auto font-semibold tracking-wide tnums">{b.code}</span>
      </div>
    </div>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <main className="flex-1 px-4 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-[640px]">
        <div className="step-transition rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">{children}</div>
      </div>
    </main>
  );
}
