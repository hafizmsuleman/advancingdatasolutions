// Move upcoming demo bookings off any time that isn't free (real bookings, Google busy, availability, daily cap).
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { calendarBusy } from "./calendar.server";
import { dateKey, generateSlots, type Busy } from "./slots";
import { loadRules } from "./schedule-rules.server";

export async function placeDemoBookings(db: SupabaseClient<Database>) {
  const now = Date.now();
  const since = new Date(now - 86400_000).toISOString();
  const [{ teamTz, rules }, { data: rows }, cal] = await Promise.all([
    loadRules(db),
    db.from("bookings").select("id,start_utc,end_utc,length_min,client_tz,is_demo")
      .in("status", ["confirmed", "attendance_confirmed"]).gte("end_utc", since).order("start_utc"),
    calendarBusy(),
  ]);
  const BUF = rules.bufferMin * 60_000;
  const all = rows ?? [];
  const busy: Busy[] = [
    ...all.filter((b) => !b.is_demo).map((b) => ({ start: Date.parse(b.start_utc), end: Date.parse(b.end_utc) })),
    ...cal.map((c) => ({ start: c.start, end: c.end, calendar: true })),
  ];
  const free = (st: number, en: number) => {
    const day = dateKey(st, teamTz);
    const count = busy.filter((x) => !x.calendar && dateKey(x.start, teamTz) === day).length;
    return count < rules.cap && !busy.some((x) => st < x.end + BUF && en > x.start - BUF);
  };
  for (const b of all.filter((x) => x.is_demo)) {
    const st = Date.parse(b.start_utc), en = Date.parse(b.end_utc);
    // Past/ongoing demo bookings stay put; only upcoming ones must avoid real times.
    if (st <= now || free(st, en)) { busy.push({ start: st, end: en }); continue; }
    const dur = (b.length_min === 60 ? 60 : 30) as 30 | 60;
    const options = generateSlots({ now, duration: dur, visitorTz: b.client_tz, busy, teamTz, rules });
    const pick = options.sort((a, c) => Math.abs(a.start - st) - Math.abs(c.start - st))[0];
    if (!pick) {
      await db.from("bookings").update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancel_reason: "No free time for sample" }).eq("id", b.id);
      await db.from("messages").update({ status: "cancelled" }).eq("booking_id", b.id).eq("status", "scheduled");
      continue;
    }
    const delta = pick.start - st;
    await db.from("bookings").update({
      start_utc: new Date(pick.start).toISOString(), end_utc: new Date(pick.end).toISOString(),
      blocked_until_utc: new Date(pick.end + BUF).toISOString(),
    }).eq("id", b.id);
    const { data: msgs } = await db.from("messages").select("id,scheduled_utc").eq("booking_id", b.id).eq("status", "scheduled").gt("scheduled_utc", new Date(now).toISOString());
    for (const m of msgs ?? []) {
      await db.from("messages").update({ scheduled_utc: new Date(Date.parse(m.scheduled_utc) + delta).toISOString() }).eq("id", m.id);
    }
    busy.push({ start: pick.start, end: pick.end });
  }
}
