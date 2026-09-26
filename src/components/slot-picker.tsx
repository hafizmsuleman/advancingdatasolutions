import { useEffect, useMemo, useState } from "react";
import { Globe } from "lucide-react";

import { cn } from "@/lib/utils";
import { dateKey, generateSlots, partsIn, sampleBookings, visitorDays, type Slot } from "@/lib/slots";

function allZones(current: string): string[] {
  const fn = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf;
  const list = fn ? fn("timeZone") : [];
  return list.includes(current) ? list : [current, ...list];
}

/** Shared slot picker: same scheduling rules as /book/slot. */
export function SlotPicker(props: {
  duration: 30 | 60;
  tz: string;
  onTzChange: (tz: string) => void;
  selected: Slot | null;
  onSelect: (s: Slot | null) => void;
  excludeStart?: number | undefined;
}) {
  const { duration, tz, onTzChange, selected, onSelect, excludeStart } = props;
  const [now] = useState(() => Date.now());
  const [editingTz, setEditingTz] = useState(false);
  const [day, setDay] = useState("");

  const slots = useMemo(
    () => generateSlots({ now, duration, visitorTz: tz, busy: sampleBookings(now) }).filter((s) => s.start !== excludeStart),
    [now, duration, tz, excludeStart],
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
    if (day && days.some((d) => d.key === day)) return;
    const first = days.find((d) => byDay.has(d.key));
    setDay((first ?? days[0]!).key);
  }, [days, byDay, day]);

  const fmtTime = (ms: number) => new Intl.DateTimeFormat(undefined, { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(ms);
  const fmtDay = (ms: number, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(undefined, { timeZone: tz, ...o }).format(ms);
  const daySlots = byDay.get(day) ?? [];
  const groups = [
    { label: "Morning", items: daySlots.filter((s) => partsIn(s.start, tz).h < 12) },
    { label: "Afternoon", items: daySlots.filter((s) => partsIn(s.start, tz).h >= 12) },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Globe className="h-4 w-4 text-primary" aria-hidden />
        <span>Times shown in <strong className="font-medium">{tz.replace(/_/g, " ")}</strong></span>
        <button type="button" onClick={() => setEditingTz((v) => !v)} className="font-medium text-primary underline-offset-4 hover:underline">
          {editingTz ? "Cancel" : "Change"}
        </button>
      </div>
      {editingTz && (
        <div className="mt-3">
          <label htmlFor="tz" className="mb-1 block text-sm font-medium">Your time zone</label>
          <select id="tz" value={tz} onChange={(e) => { onTzChange(e.target.value); onSelect(null); setEditingTz(false); }}
            className="min-h-11 w-full rounded-md border border-input bg-card px-3 text-sm">
            {allZones(tz).map((z) => <option key={z} value={z}>{z.replace(/_/g, " ")}</option>)}
          </select>
        </div>
      )}

      <div role="tablist" aria-label="Dates" className="-mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-2">
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

      <div role="tabpanel" className="min-h-[120px]">
        {daySlots.length === 0 ? (
          <p className="mt-6 rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">No times available</p>
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
