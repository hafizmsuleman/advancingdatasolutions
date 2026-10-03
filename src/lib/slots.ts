// Slot generation (sample data). All instants are UTC ms; zones via Intl (DST-safe).
export const TEAM_TZ = "Asia/Karachi";
const AVAIL_START_MIN = 15 * 60; // 15:00
const AVAIL_END_MIN = 24 * 60; // 24:00
const STEP_MIN = 30;
const BUFFER_MIN = 15;
export const MAX_PER_DAY = 3;
const NOTICE_MS = 24 * 3600_000;
export const HORIZON_DAYS = 14;
/** Part-of-day groups for the picker, by hour in the visitor's time zone. */
export const DAY_PARTS = [
  { label: "Night", from: 0, to: 5 },
  { label: "Morning", from: 5, to: 12 },
  { label: "Afternoon", from: 12, to: 17 },
  { label: "Evening", from: 17, to: 24 },
] as const;

type Parts = { y: number; m: number; d: number; h: number; min: number; wd: number };
const WD: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function partsIn(ms: number, tz: string): Parts {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, year: "numeric", month: "numeric", day: "numeric",
    hour: "numeric", minute: "numeric", weekday: "short", hourCycle: "h23",
  });
  const o: Record<string, string> = {};
  for (const p of f.formatToParts(new Date(ms))) o[p.type] = p.value;
  return { y: +o["year"]!, m: +o["month"]!, d: +o["day"]!, h: +o["hour"]! % 24, min: +o["minute"]!, wd: WD[o["weekday"]!] ?? 0 };
}

function offsetMs(ms: number, tz: string) {
  const p = partsIn(ms, tz);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.min) - Math.floor(ms / 60000) * 60000;
}

/** Wall-clock time in tz → UTC ms. Minutes may exceed 24h (e.g. 24:00). */
export function zonedToUtc(y: number, m: number, d: number, minutes: number, tz: string) {
  const guess = Date.UTC(y, m - 1, d, 0, minutes);
  let ms = guess - offsetMs(guess, tz);
  ms = guess - offsetMs(ms, tz);
  return ms;
}

export function dateKey(ms: number, tz: string) {
  const p = partsIn(ms, tz);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

/** calendar: busy time from Google Calendar — blocks slots but doesn't count toward the daily cap. */
export type Busy = { start: number; end: number; calendar?: boolean };

/** Sample confirmed bookings, placed relative to now so some slots are always hidden. */
export function sampleBookings(now: number): Busy[] {
  const out: Busy[] = [];
  let weekday = 0;
  for (let i = 1; i <= HORIZON_DAYS + 1; i++) {
    const p = partsIn(now + i * 86400_000, TEAM_TZ);
    if (p.wd === 0 || p.wd === 6) continue;
    weekday++;
    const at = (min: number, dur: number) => {
      const s = zonedToUtc(p.y, p.m, p.d, min, TEAM_TZ);
      out.push({ start: s, end: s + dur * 60000 });
    };
    if (weekday === 2) { at(17 * 60, 30); at(19 * 60, 60); }
    if (weekday === 4) { at(16 * 60, 60); at(18 * 60, 30); at(20 * 60, 30); } // full day (3)
    if (weekday === 6) at(21 * 60 + 30, 60);
  }
  return out;
}

export type Slot = { start: number; end: number };

/** Saved scheduling rules (Admin → Settings). windows: weekday 0=Sun..6=Sat → minutes from midnight. */
export type Rules = {
  windows: Record<number, { from: number; to: number }>;
  noticeMin: number; bufferMin: number; cap: number; horizonDays: number; stepMin: number;
};
const W = { from: AVAIL_START_MIN, to: AVAIL_END_MIN };
export const DEFAULT_RULES: Rules = {
  windows: { 1: W, 2: W, 3: W, 4: W, 5: W },
  noticeMin: NOTICE_MS / 60000, bufferMin: BUFFER_MIN, cap: MAX_PER_DAY, horizonDays: HORIZON_DAYS, stepMin: STEP_MIN,
};

export function generateSlots(opts: { now: number; duration: 30 | 60; visitorTz: string; busy: Busy[]; teamTz?: string | undefined; rules?: Rules | undefined }) {
  const { now, duration, visitorTz, busy } = opts;
  const team = opts.teamTz || TEAM_TZ;
  const r = opts.rules ?? DEFAULT_RULES;
  const slots: Slot[] = [];
  const earliest = now + r.noticeMin * 60000;
  const horizonEnd = now + r.horizonDays * 86400_000;
  const step = Math.max(5, r.stepMin) * 60000;
  const buf = r.bufferMin * 60000;
  for (let i = 0; i <= r.horizonDays; i++) {
    const p = partsIn(now + i * 86400_000, team);
    const w = r.windows[p.wd];
    if (!w) continue;
    const dayStart = zonedToUtc(p.y, p.m, p.d, w.from, team);
    const dayEnd = zonedToUtc(p.y, p.m, p.d, w.to, team);
    const dayBusy = busy.filter((b) => !b.calendar && b.start >= dayStart && b.start < dayEnd);
    if (dayBusy.length >= r.cap) continue;
    for (let s = dayStart; s + duration * 60000 <= dayEnd; s += step) {
      const e = s + duration * 60000;
      if (s < earliest || s > horizonEnd) continue;
      const clash = busy.some((b) => s < b.end + buf && e > b.start - buf);
      if (clash) continue;
      void visitorTz; // no client-local hour filter: every slot in the team's availability is offered
      slots.push({ start: s, end: e });
    }
  }
  return slots;
}

export function visitorDays(now: number, tz: string) {
  const days: { key: string; ms: number }[] = [];
  for (let i = 0; i < HORIZON_DAYS; i++) {
    const ms = now + i * 86400_000;
    days.push({ key: dateKey(ms, tz), ms });
  }
  return days;
}
