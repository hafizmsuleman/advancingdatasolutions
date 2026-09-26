import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarPlus, CheckCircle2, Clock, FileSignature, Video } from "lucide-react";

import { buildIcs, getBooking, type SampleBooking } from "@/lib/sample-bookings";

const TITLE = "You're booked — Advancing Data Solutions";
const DESC = "Your free consultation with our engineers is confirmed.";

export const Route = createFileRoute("/booked/$token")({
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
  component: BookedPage,
});

function BookedPage() {
  const { token } = Route.useParams();
  const [b, setB] = useState<SampleBooking | null | undefined>(undefined);
  useEffect(() => setB(getBooking(token)), [token]);

  if (b === undefined) return <main className="flex-1" />;
  if (!b) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">We couldn't find this booking</h1>
          <p className="mt-2 text-muted-foreground">The link may be incomplete. Check the confirmation email, or contact us at contact@advancingdatasolutions.com.</p>
          <Link to="/book" className="mt-6 inline-flex min-h-11 items-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">Book a consultation</Link>
        </div>
      </main>
    );
  }

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const s = Date.parse(b.start);
  const e = s + b.duration * 60000;
  const dateStr = new Intl.DateTimeFormat(undefined, { timeZone: tz, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(s);
  const t = (ms: number) => new Intl.DateTimeFormat(undefined, { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(ms);

  function download() {
    const blob = new Blob([buildIcs(b!)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `consultation-${b!.code}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="flex-1 px-4 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-[640px]">
        <div className="step-transition rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" aria-hidden />
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">You're booked</h1>
            <p className="mt-2 text-muted-foreground">We've sent the details to <span className="break-all font-medium text-foreground">{b.email}</span>.</p>
          </div>

          <dl className="mt-8 divide-y divide-border rounded-lg border border-border">
            <div className="flex items-start gap-3 p-4">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div>
                <dt className="text-sm text-muted-foreground">Free consultation · <span className="tnums">{b.duration} minutes</span></dt>
                <dd className="mt-1 font-medium tnums">{dateStr}<br />{t(s)} – {t(e)} <span className="text-sm font-normal text-muted-foreground">({tz.replace(/_/g, " ")})</span></dd>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4">
              <Video className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0">
                <dt className="text-sm text-muted-foreground">Meeting link</dt>
                <dd className="mt-1 break-all"><a href={b.meetingLink} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline-offset-4 hover:underline">{b.meetingLink}</a></dd>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 p-4">
              <dt className="text-sm text-muted-foreground">Booking reference</dt>
              <dd className="font-semibold tracking-wide tnums">{b.code}</dd>
            </div>
          </dl>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={download} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border px-6 text-sm font-medium hover:bg-muted">
              <CalendarPlus className="h-4 w-4" aria-hidden /> Add to calendar
            </button>
            <Link to="/nda/$token" params={{ token }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
              <FileSignature className="h-4 w-4" aria-hidden /> Sign NDA
            </Link>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Signing our mutual NDA before the call lets you share details freely. It takes a minute.</p>

          <div className="mt-8 flex justify-center gap-6 border-t border-border pt-6 text-sm">
            <Link to="/reschedule/$token" params={{ token }} className="font-medium text-primary underline-offset-4 hover:underline">Reschedule</Link>
            <Link to="/cancel/$token" params={{ token }} className="font-medium text-primary underline-offset-4 hover:underline">Cancel</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
