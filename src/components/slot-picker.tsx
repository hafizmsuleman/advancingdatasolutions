import { useEffect, useMemo, useState } from "react";
import { Globe, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { DAY_PARTS, dateKey, generateSlots, partsIn, visitorDays, type Slot } from "@/lib/slots";
import { useBusy } from "@/lib/use-busy";
import { useRef } from "react";
import { friendlyTimeZone } from "@/lib/time-zone-label";
import { TimeZoneSelect } from "@/components/time-zone-select";

/** Shared slot picker: same scheduling rules as /book/slot. */
export function SlotPicker(props: {
  duration: 30 | 60;
  tz: string;
  onTzChange: (tz: string) => void;
  selected: Slot | null;
  onSelect: (s: Slot | null) => void;
  excludeStart?: number | undefined;
  excludeToken?: string | undefined;
}) {
  const { duration, tz, onTzChange, selected, onSelect, excludeStart, excludeToken } = props;
  const { busy, teamTz, ready, now } = useBusy(excludeToken);
  const [editingTz, setEditingTz] = useState(false);
  const [day, setDay] = useState("");
  const tabsRef = useRef<HTMLDivElement>(null);

  const slots = useMemo(
    () => (ready ? generateSlots({ now, duration, visitorTz: tz, busy, teamTz }).filter((s) => s.start !== excludeStart) : []),
    [ready, now, duration, tz, excludeStart, busy, teamTz],
  );
  const days = useMemo(() => visitorDays(now, tz), [now, tz]);
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
    if (day && days.some((d) => d.key === day)) return;
    const first = days.find((d) => byDay.has(d.key));
    setDay((first ?? days[0]!).key);
  }, [ready, days, byDay, day]);

  const fmtTime = (ms: number) => new Intl.DateTimeFormat(undefined, { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(ms);
  const fmtDay = (ms: number, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(undefined, { timeZone: tz, ...o }).format(ms);
  const daySlots = byDay.get(day) ?? [];
  const groups = DAY_PARTS.map((p) => ({ label: p.label, items: daySlots.filter((s) => { const h = partsIn(s.start, tz).h; return h >= p.from && h < p.to; }) }));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Globe className="h-4 w-4 text-primary" aria-hidden />
        <span>Times shown in <strong className="font-medium">{friendlyTimeZone(tz)}</strong></span>
        <button type="button" onClick={() => setEditingTz((v) => !v)} className="font-medium text-primary underline-offset-4 hover:underline">
          {editingTz ? "Cancel" : "Change"}
        </button>
      </div>
      {editingTz && (
        <div className="mt-3">
          <label htmlFor="tz" className="mb-1 block text-sm font-medium">Your time zone</label>
          <TimeZoneSelect id="tz" value={tz} onChange={(z) => { onTzChange(z); onSelect(null); setEditingTz(false); }} />
        </div>
      )}

      <div className="mt-6 flex items-center gap-1">
      <button type="button" aria-label="Earlier dates" onClick={() => tabsRef.current?.scrollBy({ left: -220, behavior: "smooth" })} className="flex h-11 w-8 shrink-0 items-center justify-center text-primary"><ChevronLeft className="h-5 w-5" /></button>
      <div ref={tabsRef} role="tablist" aria-label="Dates" className="date-tabs flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 pb-2">
        {days.map((d) => {
          const on = d.key === day;
          return (
            <button key={d.key} role="tab" aria-selected={on} type="button" onClick={() => setDay(d.key)}
              className={cn("flex min-h-11 min-w-[64px] shrink-0 flex-col items-center rounded-md border px-3 py-2 text-sm transition-colors",
                on ? "border-primary bg-secondary text-primary" : "border-border hover:border-primary/50",
                !byDay.has(d.key) && !on && "text-muted-foreground/70")}>
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
          groups.map((g) => g.items.length ? (
            <div key={g.label} className="mt-6">
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">{g.label}</h3>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {g.items.map((s) => {
                  const on = s.start === selected?.start;
                  return (
                    <button key={s.start} type="button" aria-pressed={on} onClick={() => onSelect(s)}
                      className={cn("min-h-11 rounded-full border px-3 text-sm font-medium tnums transition-colors",
                        on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/60")}>
                      {fmtTime(s.start)}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null)
        )}
      </div>
    </div>
  );
}
