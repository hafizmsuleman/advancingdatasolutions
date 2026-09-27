import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { COMMON_ZONES, friendlyTimeZone, timeZoneOptions } from "@/lib/time-zone-label";

/** Searchable list of city-based time zones with friendly names. */
export function TimeZoneSelect({ id, value, onChange, className }: { id: string; value: string; onChange: (tz: string) => void; className?: string }) {
  const opts = useMemo(() => timeZoneOptions(value), [value]);
  const shown = opts;
  const common = shown.filter((o) => COMMON_ZONES.includes(o.value));
  const others = shown.filter((o) => !COMMON_ZONES.includes(o.value));
  const hasValue = shown.some((o) => o.value === value);
  const box = cn("w-full rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className);
  return (
    <div className="space-y-2">
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={box + " min-h-11"}>
        {!hasValue && <option value={value}>{friendlyTimeZone(value)}</option>}
        {common.length > 0 && <optgroup label="Most common">{common.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</optgroup>}
        {others.length > 0 && <optgroup label="All time zones">{others.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</optgroup>}
      </select>
    </div>
  );
}
