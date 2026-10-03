// Saved scheduling rules from Admin → Settings (settings + availability_windows).
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { DEFAULT_RULES, type Rules } from "./slots";

const WD: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
const mins = (t: string) => { const [h, m] = t.split(":"); return +h! * 60 + +(m ?? 0); };

export async function loadRules(db: SupabaseClient<Database>): Promise<{ teamTz: string; rules: Rules }> {
  const [{ data: s }, { data: win }] = await Promise.all([
    db.from("settings").select("team_timezone,min_notice_hours,buffer_min,daily_cap,booking_horizon_days,slot_interval_min").eq("id", 1).single(),
    db.from("availability_windows").select("weekday,start_time,end_time,active").eq("active", true),
  ]);
  const windows: Rules["windows"] = {};
  for (const w of win ?? []) {
    const from = mins(w.start_time);
    let to = mins(w.end_time);
    if (to === 0) to = 24 * 60; // 00:00 end means midnight
    if (to > from) windows[WD[w.weekday]!] = { from, to };
  }
  const d = DEFAULT_RULES;
  return {
    teamTz: s?.team_timezone || "Asia/Karachi",
    rules: {
      windows: win ? windows : d.windows,
      noticeMin: s ? s.min_notice_hours * 60 : d.noticeMin,
      bufferMin: s?.buffer_min ?? d.bufferMin,
      cap: s && s.daily_cap >= 1 ? s.daily_cap : d.cap,
      horizonDays: s && s.booking_horizon_days >= 1 ? s.booking_horizon_days : d.horizonDays,
      stepMin: s && s.slot_interval_min >= 5 ? s.slot_interval_min : d.stepMin,
    },
  };
}
