import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, FileText } from "lucide-react";

import { BookingProgress } from "@/components/booking-progress";
import { cn } from "@/lib/utils";
import { AREAS, REASON_30, REASONS_60, loadDraft, routeDuration, saveDraft, type AreaId, type BookingDraft } from "@/lib/booking-draft";

const TITLE = "Your consultation — Advancing Data Solutions";
const DESC = "Review the free consultation length our engineers suggest for your project.";

export const Route = createFileRoute("/book/session")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SessionPage,
});

const STEPS = [{ label: "About you" }, { label: "Your project" }, { label: "Session" }, { label: "Time" }, { label: "Verify" }];

function SessionPage() {
  const [draft, setDraft] = useState<Partial<BookingDraft> | null | undefined>(undefined);

  useEffect(() => setDraft(loadDraft()), []);

  if (draft === undefined) return <main className="flex-1" />;

  if (!draft?.area || !draft.budget || !draft.timeline) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">Let's start with your project</h1>
          <p className="mt-2 text-muted-foreground">We need a few details before suggesting a session.</p>
          <Link to="/book" className="mt-6 inline-flex min-h-11 items-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
            Start booking
          </Link>
        </div>
      </main>
    );
  }

  const area = draft.area as AreaId;
  const suggested = routeDuration({ budget: draft.budget, timeline: draft.timeline });
  const duration = draft.duration ?? suggested;
  const reason = suggested === 60 ? REASONS_60[area] : REASON_30;

  function choose(d: 30 | 60) {
    const nd = { ...draft, duration: d };
    saveDraft(nd);
    setDraft(nd);
  }

  return (
    <main className="flex-1 px-4 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-[640px]">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Your free consultation</h1>
          <p className="mt-2 text-muted-foreground">{AREAS.find((a) => a.id === area)?.label} · {draft.need}</p>
        </div>
        <div className="step-transition rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <BookingProgress steps={STEPS} currentStep={2} />
          <div className="mt-8 rounded-lg border border-primary/30 bg-secondary/40 p-5">
            <p className="text-sm font-medium text-primary">Our suggestion: {suggested} minutes</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tnums">{duration}-minute consultation{duration !== suggested ? " – your choice" : ""}</p>
            <p className="mt-2 text-muted-foreground">{reason}</p>
          </div>

          <fieldset className="mt-6">
            <legend className="mb-3 text-sm font-medium">Session length</legend>
            <div className="grid grid-cols-2 gap-3">
              {([30, 60] as const).map((d) => (
                <label key={d} className={cn(
                  "flex min-h-11 cursor-pointer flex-col items-center justify-center rounded-md border px-4 py-3 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                  duration === d ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50",
                )}>
                  <input type="radio" name="duration" className="sr-only" checked={duration === d} onChange={() => choose(d)} />
                  <span className="font-semibold tnums">{d} minutes</span>
                  <span className={cn("text-xs", duration === d ? "text-primary-foreground/80" : "text-muted-foreground")}>
                    {d === suggested ? "Suggested" : "Also available"}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" aria-hidden /> Always free, with one of our engineers</li>
            <li className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" aria-hidden /> Ends with a written proposal</li>
          </ul>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
            <Link to="/book" className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-6 text-sm font-medium hover:bg-muted">Edit details</Link>
            <Link to="/book/slot" onClick={() => saveDraft({ ...draft, duration })} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
              Choose a time
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
