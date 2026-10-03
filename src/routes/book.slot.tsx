import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Globe, ChevronLeft, ChevronRight } from "lucide-react";

import { BookingProgress } from "@/components/booking-progress";
import { cn } from "@/lib/utils";
import { loadDraft, saveDraft, type BookingDraft } from "@/lib/booking-draft";
import { DAY_PARTS, dateKey, generateSlots, partsIn, visitorDays, type Slot } from "@/lib/slots";
import { useBusy } from "@/lib/use-busy";
import { friendlyTimeZone } from "@/lib/time-zone-label";
import { TimeZoneSelect } from "@/components/time-zone-select";
import { requestBooking } from "@/lib/booking.functions";

const TITLE = "Choose a time — Advancing Data Solutions";
const DESC = "Pick a time for your free consultation with our engineers, shown in your local time.";

export const Route = createFileRoute("/book/slot")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SlotPage,
});

const STEPS = [{ label: "About you" }, { label: "Your project" }, { label: "Session" }, { label: "Time" }, { label: "Verify" }];

function SlotPage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Partial<BookingDraft> | null | undefined>(undefined);
  const [tz, setTz] = useState("UTC");
  const [now, setNow] = useState(0);
  const [editingTz, setEditingTz] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [day, setDay] = useState<string>("");
  const [selected, setSelected] = useState<number | null>(null);
  const { busy, teamTz, rules, ready, now: liveNow } = useBusy();
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const d = loadDraft();
    setDraft(d);
    setTz(d?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
    setNow(Date.now());
    if (d?.slotStart) setSelected(Date.parse(d.slotStart));
  }, []);

  const duration = draft?.duration ?? 30;
  const slots = useMemo(
    () => (now && ready ? generateSlots({ now: liveNow, duration, visitorTz: tz, busy, teamTz, rules }) : []),
    [now, ready, liveNow, duration, tz, busy, teamTz, rules],
  );
  const days = useMemo(() => (now ? visitorDays(now, tz) : []), [now, tz]);
  const byDay = useMemo(() => {
    const m = new Map<string, Slot[]>();
    for (const s of slots) {
      const k = dateKey(s.start, tz);
      m.set(k, [...(m.get(k) ?? []), s]);
    }
    return m;
  }, [slots, tz]);

  useEffect(() => {
    if (!ready) return;
    if (!days.length) return;
    if (day && days.some((d) => d.key === day)) return;
    const first = days.find((d) => byDay.has(d.key));
    setDay((first ?? days[0]!).key);
  }, [ready, days, byDay, day]);

  if (draft === undefined) return <main className="flex-1" />;
  if (!draft?.area || !draft.email) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">Let's start with your project</h1>
          <p className="mt-2 text-muted-foreground">We need a few details before showing available times.</p>
          <Link to="/book" className="mt-6 inline-flex min-h-11 items-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">Start booking</Link>
        </div>
      </main>
    );
  }

  const fmtTime = (ms: number) => new Intl.DateTimeFormat(undefined, { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(ms);
  const fmtDay = (ms: number, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(undefined, { timeZone: tz, ...o }).format(ms);
  const daySlots = byDay.get(day) ?? [];
  const groups = DAY_PARTS.map((p) => ({ label: p.label, items: daySlots.filter((s) => { const h = partsIn(s.start, tz).h; return h >= p.from && h < p.to; }) }));
  const selectedSlot = slots.find((s) => s.start === selected);

  function changeTz(z: string) {
    setTz(z);
    setSelected(null);
    setEditingTz(false);
    const nd = { ...draft, timeZone: z, slotStart: undefined };
    saveDraft(nd);
    setDraft(nd);
  }

  async function next() {
    if (!selectedSlot || sending) return;
    if (!draft?.leadToken) { navigate({ to: "/book" }); return; }
    setSending(true);
    setErr("");
    const slotStart = new Date(selectedSlot.start).toISOString();
    const r = await requestBooking({ data: { leadToken: draft.leadToken, duration, slotStart, timeZone: tz } }).catch(() => ({ error: "server" as const }));
    setSending(false);
    if ("error" in r) {
      const msg: Record<string, string> = {
        slot_taken: "That time was just booked by someone else. Please choose another slot.",
        email_has_active_booking: "This email already has an upcoming consultation. Use the links in your confirmation email to reschedule or cancel it.",
        disposable: "Please use your work email.",
        blocked: "We're unable to accept a booking from this address. If you think this is a mistake, email us at contact@advancingdatasolutions.com.",
        rate_limited: "Too many attempts. Please try again in an hour.",
        server: "Something went wrong on our end. Please try again.",
      };
      setErr(msg[r.error] ?? msg["server"]!);
      if (r.error === "slot_taken") setSelected(null);
      return;
    }
    saveDraft({ ...draft, timeZone: tz, slotStart, bookingId: r.bookingId, email: r.email });
    navigate({ to: "/book/verify" });
  }

  const Group = ({ label, items }: { label: string; items: Slot[] }) =>
    items.length ? (
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">{label}</h3>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {items.map((s) => {
            const on = s.start === selected;
            return (
              <button key={s.start} type="button" aria-pressed={on} onClick={() => setSelected(s.start)}
                className={cn("min-h-11 rounded-full border px-3 text-sm font-medium tnums transition-colors",
                  on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/60")}>
                {fmtTime(s.start)}
              </button>
            );
          })}
        </div>
      </div>
    ) : null;

  return (
    <main className="flex-1 px-4 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-[640px]">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Choose a time</h1>
          <p className="mt-2 text-muted-foreground tnums">{duration}-minute free consultation with our engineers</p>
        </div>
        <div className="step-transition rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <BookingProgress steps={STEPS} currentStep={3} />

          <div className="mt-8 flex flex-wrap items-center gap-2 text-sm">
            <Globe className="h-4 w-4 text-primary" aria-hidden />
            <span>Times shown in <strong className="font-medium">{friendlyTimeZone(tz)}</strong></span>
            <button type="button" onClick={() => setEditingTz((v) => !v)} className="font-medium text-primary underline-offset-4 hover:underline">
              {editingTz ? "Cancel" : "Change"}
            </button>
          </div>
          {editingTz && (
            <div className="mt-3">
              <label htmlFor="tz" className="mb-1 block text-sm font-medium">Your time zone</label>
              <TimeZoneSelect id="tz" value={tz} onChange={changeTz} />
            </div>
          )}

          <div className="mt-6 flex items-center gap-1">
          <button type="button" aria-label="Earlier dates" onClick={() => tabsRef.current?.scrollBy({ left: -220, behavior: "smooth" })} className="flex h-11 w-8 shrink-0 items-center justify-center text-primary"><ChevronLeft className="h-5 w-5" /></button>
          <div ref={tabsRef} role="tablist" aria-label="Dates" className="date-tabs flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 pb-2">
            {days.map((d) => {
              const on = d.key === day;
              const has = byDay.has(d.key);
              return (
                <button key={d.key} role="tab" aria-selected={on} type="button" onClick={() => setDay(d.key)}
                  className={cn("flex min-h-11 min-w-[64px] shrink-0 flex-col items-center rounded-md border px-3 py-2 text-sm transition-colors",
                    on ? "border-primary bg-secondary text-primary" : "border-border hover:border-primary/50",
                    !has && !on && "text-muted-foreground/70")}>
                  <span className="text-xs">{fmtDay(d.ms, { weekday: "short" })}</span>
                  <span className="font-semibold tnums">{fmtDay(d.ms, { day: "numeric" })}</span>
                  <span className="text-xs">{fmtDay(d.ms, { month: "short" })}</span>
                </button>
              );
            })}
          </div>

          <button type="button" aria-label="Later dates" onClick={() => tabsRef.current?.scrollBy({ left: 220, behavior: "smooth" })} className="flex h-11 w-8 shrink-0 items-center justify-center text-primary"><ChevronRight className="h-5 w-5" /></button>
          </div>

          <div role="tabpanel" className="min-h-[120px]">
            {daySlots.length === 0 ? (
              <p className="mt-6 rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">{ready ? "No times available" : "Loading available times…"}</p>
            ) : (
              <>
                {groups.map((g) => <Group key={g.label} label={g.label} items={g.items} />)}
              </>
            )}
          </div>

          {selectedSlot && (
            <p className="mt-6 text-sm tnums" aria-live="polite">
              Selected: <strong className="font-medium">{fmtDay(selectedSlot.start, { weekday: "long", day: "numeric", month: "long" })}, {fmtTime(selectedSlot.start)} – {fmtTime(selectedSlot.end)}</strong>
            </p>
          )}

          {err && <p role="alert" className="mt-4 text-sm text-warning">{err}</p>}
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
            <Link to="/book/session" className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-6 text-sm font-medium hover:bg-muted">Back</Link>
            <button type="button" disabled={!selectedSlot || sending} onClick={next}
              className="min-h-11 flex-1 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60">
              {sending ? "Sending your code…" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
