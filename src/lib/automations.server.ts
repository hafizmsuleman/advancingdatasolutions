// Server-only: the automations job (every 5 min + "Run now"). All emails are queued in
// `messages`; real sending picks up rows whose scheduled_utc has passed.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type DB = SupabaseClient<Database>;
type MsgType = Database["public"]["Enums"]["message_type"];

const ADMIN_EMAIL = "contact@advancingdatasolutions.com";
const H = 3600_000;
const BATCH = 200;
const REMINDER_TYPES: MsgType[] = ["nda_reminder", "reminder_24h", "reminder_1h"];
const SIGN = "\n\nThe Advancing Data Solutions team";

async function db(): Promise<DB> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as DB;
}

const first = (n?: string | null) => (n ?? "").split(" ")[0] || "there";
const when = (iso: string, tz: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: tz, dateStyle: "full", timeStyle: "short" }).format(Date.parse(iso));

type BookingForMail = {
  id: string; email: string; code: string; start_utc: string; length_min: number; client_tz: string;
  manage_token: string; lead_id: string; created_at: string; full_name?: string | null;
};

/** Cancel this booking's reminders that haven't gone out yet. */
export async function cancelPendingReminders(d: DB, bookingId: string) {
  await d.from("messages").update({ status: "cancelled" })
    .eq("booking_id", bookingId).eq("status", "scheduled").in("type", REMINDER_TYPES)
    .gt("scheduled_utc", new Date().toISOString());
}

/** Queue the NDA, 24h and 1h reminders for a confirmed booking. */
export async function scheduleReminders(d: DB, b: BookingForMail, origin: string, opts: { nda: boolean }) {
  const start = Date.parse(b.start_utc);
  const now = Date.now();
  const { data: s } = await d.from("settings").select("fallback_meeting_link").eq("id", 1).single();
  const link = s?.fallback_meeting_link ?? "";
  const hi = `Hi ${first(b.full_name)},\n\n`;
  const rows: Database["public"]["Tables"]["messages"]["Insert"][] = [];
  const ndaAt = Date.parse(b.created_at) + 2 * H;
  if (opts.nda && ndaAt < start) rows.push({
    type: "nda_reminder", booking_id: b.id, lead_id: b.lead_id, to_email: b.email, scheduled_utc: new Date(Math.max(ndaAt, now)).toISOString(),
    subject: "Please sign the NDA before your consultation",
    body: `${hi}So you can share details freely on the call, please sign our short mutual NDA before your consultation on ${when(b.start_utc, b.client_tz)} (your time):\n${origin}/nda/${b.manage_token}${SIGN}`,
  });
  // Booked less than 26h ahead: the confirmation already carries the attendance link.
  if (start - Date.parse(b.created_at) >= 26 * H && start - 24 * H > now) rows.push({
    type: "reminder_24h", booking_id: b.id, lead_id: b.lead_id, to_email: b.email, scheduled_utc: new Date(start - 24 * H).toISOString(),
    subject: "Tomorrow: please confirm your consultation",
    body: `${hi}Your free ${b.length_min}-minute consultation with our engineers is on ${when(b.start_utc, b.client_tz)} (your time).\n\nPlease confirm you can attend. If we don't hear from you 6 hours before the start, we'll release the time:\n${origin}/attend/${b.manage_token}\n\nNeed another time? ${origin}/reschedule/${b.manage_token}${SIGN}`,
  });
  if (start - H > now) rows.push({
    type: "reminder_1h", booking_id: b.id, lead_id: b.lead_id, to_email: b.email, scheduled_utc: new Date(start - H).toISOString(),
    subject: "Starting in 1 hour: your consultation",
    body: `${hi}Your consultation starts in one hour, at ${when(b.start_utc, b.client_tz)} (your time).\n\nMeeting link: ${link}\nReference: ${b.code}${SIGN}`,
  });
  if (rows.length) await d.from("messages").insert(rows);
}

async function queue(d: DB, m: Database["public"]["Tables"]["messages"]["Insert"], demo: boolean) {
  await d.from("messages").insert({ ...m, is_demo: demo, to_email: demo ? ADMIN_EMAIL : m.to_email });
}

/** One run of every automation. Bounded per run; single-flight via a lease on settings. */
export async function runAutomations(origin: string) {
  const d = await db();
  const nowIso = new Date().toISOString();
  const { data: lease } = await d.from("settings")
    .update({ automation_lock_until: new Date(Date.now() + 2 * 60_000).toISOString() })
    .eq("id", 1).or(`automation_lock_until.is.null,automation_lock_until.lt.${nowIso}`).select("*").maybeSingle();
  if (!lease) return { skipped: true as const, summary: "Another run is in progress." };

  const c = { expired: 0, deleted: 0, cancelledReminders: 0, flagged: 0, released: 0, completed: 0, nudges: 0, cold: 0 };
  try {
    const now = Date.now();
    const demoNow = now + lease.virtual_clock_offset_min * 60_000;
    const clock = (demo: boolean) => (demo ? demoNow : now);

    // 1. Expire pending requests after 10 minutes.
    const { data: exp } = await d.from("bookings").update({ status: "cancelled", cancelled_at: nowIso, cancel_reason: "expired" })
      .eq("status", "pending_verification").lt("verify_expires_at", nowIso).select("id");
    c.expired = exp?.length ?? 0;

    // 2. Delete unverified requests after 24 hours.
    const { data: old } = await d.from("bookings").select("id")
      .or("status.eq.pending_verification,and(status.eq.cancelled,cancel_reason.in.(expired,replaced,too_many_attempts,slot_taken,email_has_active_booking))")
      .lt("created_at", new Date(now - 24 * H).toISOString()).is("attendance_confirmed_at", null).limit(BATCH);
    const oldIds = (old ?? []).map((b) => b.id);
    if (oldIds.length) {
      const { data: refs } = await d.from("bookings").select("rescheduled_from_id").in("rescheduled_from_id", oldIds);
      const ids = oldIds.filter((id) => !(refs ?? []).some((r) => r.rescheduled_from_id === id));
      const { data: nda } = await d.from("ndas").select("booking_id").in("booking_id", ids);
      const del = ids.filter((id) => !(nda ?? []).some((n) => n.booking_id === id));
      if (del.length) {
        await d.from("email_verifications").delete().in("booking_id", del);
        await d.from("messages").delete().in("booking_id", del);
        const { data: gone } = await d.from("bookings").delete().in("id", del).select("id");
        c.deleted = gone?.length ?? 0;
      }
    }

    // 3. Drop due reminders that no longer apply (NDA signed, booking no longer active).
    const { data: due } = await d.from("messages").select("id,type,booking_id, bookings(status, ndas(id))")
      .eq("status", "scheduled").in("type", REMINDER_TYPES).lte("scheduled_utc", nowIso)
      .gte("scheduled_utc", new Date(now - 2 * H).toISOString()).limit(BATCH);
    const drop = (due ?? []).filter((m) => {
      const b = m.bookings as { status: string; ndas: { id: string }[] | { id: string } | null } | null;
      if (!b || !["confirmed", "attendance_confirmed"].includes(b.status)) return true;
      const signed = Array.isArray(b.ndas) ? b.ndas.length > 0 : !!b.ndas;
      return m.type === "nda_reminder" && signed;
    }).map((m) => m.id);
    if (drop.length) {
      await d.from("messages").update({ status: "cancelled" }).in("id", drop);
      c.cancelledReminders = drop.length;
    }

    // 4. Active bookings: complete, release at 6h, flag at 12h.
    let bq = d.from("bookings").select("id,code,email,start_utc,end_utc,length_min,client_tz,status,manage_token,lead_id,is_demo,attendance_confirmed_at, leads(full_name,company)")
      .in("status", ["confirmed", "attendance_confirmed"]).order("start_utc").limit(BATCH);
    if (!lease.demo_mode) bq = bq.eq("is_demo", false);
    const { data: active } = await bq;
    for (const b of active ?? []) {
      const t = clock(b.is_demo);
      const start = Date.parse(b.start_utc);
      const lead = b.leads as { full_name: string | null; company: string | null } | null;
      if (Date.parse(b.end_utc) < t) {
        await d.from("bookings").update({ status: "completed" }).eq("id", b.id).in("status", ["confirmed", "attendance_confirmed"]);
        c.completed++; continue;
      }
      if (b.status !== "confirmed" || b.attendance_confirmed_at || start <= t) continue;
      const left = start - t;
      if (left <= lease.attendance_release_hours * H) {
        const { data: rel } = await d.from("bookings").update({ status: "released", released_at: nowIso })
          .eq("id", b.id).eq("status", "confirmed").select("id");
        if (!rel?.length) continue;
        await cancelPendingReminders(d, b.id);
        await queue(d, {
          type: "release_notice", booking_id: b.id, lead_id: b.lead_id, to_email: b.email,
          subject: "We've released your consultation time",
          body: `Hi ${first(lead?.full_name)},\n\nWe didn't receive your attendance confirmation, so we've released your consultation on ${when(b.start_utc, b.client_tz)} (your time) for others to book.\n\nYou're welcome to choose a new time whenever suits you:\n${origin}/book${SIGN}`,
        }, b.is_demo);
        c.released++;
      } else if (left <= lease.attendance_flag_hours * H) {
        const key = `Session start: ${b.start_utc}`;
        const { data: ex } = await d.from("messages").select("id").eq("booking_id", b.id).eq("type", "admin_alert").ilike("body", `%${key}%`).limit(1);
        if (ex?.length) continue;
        await queue(d, {
          type: "admin_alert", booking_id: b.id, lead_id: b.lead_id, to_email: ADMIN_EMAIL,
          subject: `Attendance unconfirmed: ${lead?.company ?? b.email} (${b.code})`,
          body: `${lead?.full_name ?? b.email} from ${lead?.company ?? "—"} hasn't confirmed attendance for ${b.code}. The time will be released ${lease.attendance_release_hours} hours before the start if they don't confirm.\n\n${key}`,
        }, b.is_demo);
        c.flagged++;
      }
    }

    // 5. Nudges for verified or admin-pasted leads with no booking; cold at 72h.
    const { data: leads } = await d.from("leads").select("id,email,full_name,source,email_verified_at,nudge_count,created_at,booking_token")
      .in("status", ["new", "link_sent", "started"]).eq("is_demo", false).not("email", "is", null)
      .lt("created_at", new Date(now - 24 * H).toISOString()).order("created_at").limit(BATCH);
    const { data: blocked } = await d.from("blocked_senders").select("value");
    const bl = new Set((blocked ?? []).map((x) => x.value.toLowerCase()));
    for (const l of leads ?? []) {
      const age = now - Date.parse(l.created_at);
      if (age >= 72 * H) {
        await d.from("leads").update({ status: "cold" }).eq("id", l.id); c.cold++; continue;
      }
      const email = l.email!.toLowerCase();
      const eligible = !!l.email_verified_at || l.source !== "form";
      const want = age >= 48 * H ? 2 : 1;
      if (!eligible || l.nudge_count >= Math.min(want, 2) || bl.has(email) || bl.has(email.split("@")[1] ?? "")) continue;
      const { data: act } = await d.from("bookings").select("id").ilike("email", email)
        .in("status", ["confirmed", "attendance_confirmed", "completed"]).limit(1);
      if (act?.length) continue;
      const { data: upd } = await d.from("leads").update({ nudge_count: l.nudge_count + 1, last_nudged_at: nowIso })
        .eq("id", l.id).eq("nudge_count", l.nudge_count).select("id");
      if (!upd?.length) continue;
      await queue(d, {
        type: "nudge", lead_id: l.id, to_email: email,
        subject: l.nudge_count === 0 ? "Your free consultation with our engineers" : "Still keen to talk about your project?",
        body: `Hi ${first(l.full_name)},\n\n${l.nudge_count === 0 ? "We noticed you haven't picked a time yet." : "Just a gentle reminder in case our last note got buried."} Your details are saved, so booking a free consultation takes under a minute:\n${origin}/book?t=${l.booking_token}${SIGN}`,
      }, false);
      c.nudges++;
    }
  } finally {
    const summary = `Expired ${c.expired}, deleted ${c.deleted}, completed ${c.completed}, flagged ${c.flagged}, released ${c.released}, nudges ${c.nudges}, cold ${c.cold}, reminders dropped ${c.cancelledReminders}`;
    await d.from("settings").update({ automation_lock_until: null, automation_last_run_at: new Date().toISOString(), automation_last_summary: summary }).eq("id", 1);
  }
  return { skipped: false as const, counts: c };
}
