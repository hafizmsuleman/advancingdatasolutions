// Public backend functions for the booking flow. They run on the server with the
import { SITE_URL } from "@/lib/site";
// service role; the browser never touches tables or the privileged SQL functions.
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { AREAS, BUDGETS, PLATFORMS, TIMELINES } from "./booking-draft";
import { BUDGET_TO_DB, NEED_TO_DB, PLATFORM_TO_DB } from "./enums";
import { generateSlots, type Busy } from "./slots";
import { cancelPendingReminders, scheduleReminders } from "./automations.server";
import { calendarBusy, meetingLink, syncBookingCalendar } from "./calendar.server";
import { deliverMessage } from "./mailer.server";

const DISPOSABLE = ["mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com", "temp-mail.org", "yopmail.com", "trashmail.com", "sharklasers.com", "getnada.com", "dispostable.com", "maildrop.cc", "throwawaymail.com"];
const stripLinks = (s: string) => s.replace(/(https?:\/\/|www\.)\S+/gi, "").trim();

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function visitorHash() {
  const req = getRequest();
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const ua = req.headers.get("user-agent") ?? "";
  const salt = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${ip}|${ua}|${salt}`));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

function sixDigits() {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return String(a[0]! % 1_000_000).padStart(6, "0");
}

async function isBlocked(db: Awaited<ReturnType<typeof admin>>, email: string) {
  const e = email.toLowerCase();
  const domain = e.split("@")[1] ?? "";
  if (DISPOSABLE.includes(domain)) return "disposable" as const;
  const { data } = await db.from("blocked_senders").select("id").in("value", [e, domain]).limit(1);
  return data?.length ? ("blocked" as const) : null;
}

/** Busy intervals for the slot picker (no client data leaves the server). */
async function loadBusy(db: Awaited<ReturnType<typeof admin>>, excludeToken?: string): Promise<Busy[]> {
  return (await loadSchedule(db, excludeToken)).busy;
}

/** Busy times plus the team's availability time zone (Settings → Your time zone). */
async function loadSchedule(db: Awaited<ReturnType<typeof admin>>, excludeToken?: string): Promise<{ busy: Busy[]; teamTz: string }> {
  const { data: s } = await db.from("settings").select("demo_mode, team_timezone").eq("id", 1).single();
  let q = db.from("bookings").select("start_utc,end_utc,manage_token,is_demo,google_event_id")
    .in("status", ["confirmed", "attendance_confirmed"])
    .gte("end_utc", new Date(Date.now() - 86400_000).toISOString());
  if (!s?.demo_mode) q = q.eq("is_demo", false);
  const [{ data }, cal] = await Promise.all([q, calendarBusy()]);
  const own = (data ?? []).find((b) => b.manage_token === excludeToken)?.google_event_id;
  const bookings: Busy[] = (data ?? []).filter((b) => b.manage_token !== excludeToken)
    .map((b) => ({ start: Date.parse(b.start_utc), end: Date.parse(b.end_utc) }));
  // Google busy times (minus this booking's own event when rescheduling); only start/end leave the server.
  const google: Busy[] = cal.filter((c) => c.eventId !== own).map((c) => ({ start: c.start, end: c.end, calendar: true }));
  return { busy: [...bookings, ...google], teamTz: s?.team_timezone || "Asia/Karachi" };
}

export const getBusy = createServerFn({ method: "GET" })
  .inputValidator((d: { excludeToken?: string } | undefined) => z.object({ excludeToken: z.string().max(64).optional() }).parse(d ?? {}))
  .handler(async ({ data }) => ({ ...(await loadSchedule(await admin(), data.excludeToken)), serverNow: Date.now() }));

async function queueMessage(db: Awaited<ReturnType<typeof admin>>, m: {
  type: "verification_code" | "confirmation" | "admin_new_booking" | "reschedule_notice" | "cancel_notice";
  to: string; subject: string; body: string; bookingId?: string; leadId?: string; minutes?: number;
}) {
  const { data: row } = await db.from("messages").insert({
    type: m.type, to_email: m.to, subject: m.subject, body: m.body,
    booking_id: m.bookingId ?? null, lead_id: m.leadId ?? null, minutes_saved: m.minutes ?? 5,
  }).select("id").single();
  if (row) await deliverMessage(db, row.id);
}

const SIGN = "\n\nThe Advancing Data Solutions team";
const gcal = (d: number) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

// ---------- Lead creation ----------
const leadSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  company: z.string().trim().min(1).max(120),
  role: z.string().trim().min(1).max(100),
  area: z.enum(AREAS.map((a) => a.id) as ["data", "ai", "web"]),
  platform: z.enum(PLATFORMS),
  need: z.string().refine((v) => v in NEED_TO_DB),
  timeline: z.enum(TIMELINES),
  budget: z.enum(BUDGETS),
  notes: z.string().max(1000).default(""),
  timeZone: z.string().max(64).optional(),
  leadToken: z.string().max(64).optional(),
});

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((d: z.input<typeof leadSchema>) => leadSchema.parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const email = data.email.toLowerCase();
    const blk = await isBlocked(db, email);
    if (blk) return { error: blk };
    const vh = await visitorHash();
    const since = new Date(Date.now() - 86400_000).toISOString();
    const { count } = await db.from("leads").select("id", { count: "exact", head: true }).eq("visitor_hash", vh).gte("created_at", since);
    if ((count ?? 0) >= 5 && !data.leadToken) return { error: "rate_limited" as const };

    const row = {
      full_name: stripLinks(data.name), email, company: stripLinks(data.company), role: stripLinks(data.role),
      project_area: data.area, platform: PLATFORM_TO_DB[data.platform]!, need: NEED_TO_DB[data.need]!,
      timeline: data.timeline, budget_range: BUDGET_TO_DB[data.budget]!, notes: stripLinks(data.notes).slice(0, 1000) || null,
      client_tz: data.timeZone ?? null, consent_at: new Date().toISOString(), visitor_hash: vh,
    };
    if (data.leadToken) {
      const { data: l } = await db.from("leads").update(row).eq("booking_token", data.leadToken)
        .not("status", "in", "(booked,cold)").select("id,booking_token").maybeSingle();
      if (l) return { leadId: l.id, leadToken: l.booking_token };
    }
    const { data: l, error } = await db.from("leads").insert({ ...row, source: "form" }).select("id,booking_token").single();
    if (error) { console.error(error); return { error: "server" as const }; }
    return { leadId: l.id, leadToken: l.booking_token };
  });

// ---------- Booking request + code email ----------
export const requestBooking = createServerFn({ method: "POST" })
  .inputValidator((d: { leadToken: string; duration: 30 | 60; slotStart: string; timeZone: string }) =>
    z.object({ leadToken: z.string().min(16).max(64), duration: z.union([z.literal(30), z.literal(60)]), slotStart: z.string().datetime(), timeZone: z.string().min(1).max(64) }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const vh = await visitorHash();
    // The secret booking token proves the visitor is entitled to use this lead.
    const { data: lead } = await db.from("leads").select("id,email,full_name,status").eq("booking_token", data.leadToken).single();
    if (!lead?.email) return { error: "server" as const };
    const blk = await isBlocked(db, lead.email);
    if (blk) return { error: blk };

    // Server-side slot re-check (availability, notice, horizon, local hours, cap, busy)
    const start = Date.parse(data.slotStart);
    const valid = generateSlots({ now: Date.now(), duration: data.duration, visitorTz: data.timeZone, ...(await loadSchedule(db)) })
      .some((s) => s.start === start);
    if (!valid) return { error: "slot_taken" as const };

    // Limits: 5 requests/visitor/day, 3 code emails/address/hour, 10/visitor/hour
    const day = new Date(Date.now() - 86400_000).toISOString();
    const hour = new Date(Date.now() - 3600_000).toISOString();
    const [{ count: perDay }, { count: perAddr }, { count: perVisitor }] = await Promise.all([
      db.from("bookings").select("id", { count: "exact", head: true }).eq("visitor_hash", vh).gte("created_at", day),
      db.from("email_verifications").select("id", { count: "exact", head: true }).eq("email", lead.email).gte("created_at", hour),
      db.from("email_verifications").select("id", { count: "exact", head: true }).eq("visitor_hash", vh).gte("created_at", hour),
    ]);
    if ((perDay ?? 0) >= 5 || (perAddr ?? 0) >= 3 || (perVisitor ?? 0) >= 10) return { error: "rate_limited" as const };

    const { data: bookingId, error } = await db.rpc("create_booking_request", {
      p_lead_id: lead.id, p_email: lead.email, p_session: "free_consultation", p_length: data.duration,
      p_start: new Date(start).toISOString(), p_client_tz: data.timeZone, p_visitor: vh,
    });
    if (error) {
      if (error.message.includes("email_has_active_booking")) return { error: "email_has_active_booking" as const };
      if (error.message.includes("slot_taken")) return { error: "slot_taken" as const };
      console.error(error);
      return { error: "server" as const };
    }
    await sendCode(db, bookingId as string, lead.email, lead.full_name ?? "", lead.id, vh, 0);
    await db.from("leads").update({ client_tz: data.timeZone }).eq("id", lead.id);
    return { bookingId: bookingId as string, email: lead.email };
  });

async function sendCode(db: Awaited<ReturnType<typeof admin>>, bookingId: string, email: string, name: string, leadId: string, vh: string, resendCount: number) {
  const code = sixDigits();
  await db.rpc("create_verification", { p_booking_id: bookingId, p_email: email, p_code: code, p_visitor: vh });
  if (resendCount > 0) {
    const { data: v } = await db.from("email_verifications").select("id").eq("booking_id", bookingId).order("created_at", { ascending: false }).limit(1).single();
    if (v) await db.from("email_verifications").update({ resend_count: resendCount }).eq("id", v.id);
  }
  const first = name.split(" ")[0] || "there";
  await queueMessage(db, {
    type: "verification_code", to: email, bookingId, leadId,
    subject: "Your verification code",
    body: `Hi ${first},\n\nYour Advancing Data Solutions verification code is ${code}. It expires in 10 minutes.\n\nIf you didn't request this, you can ignore this email.`,
  });
}

export const resendCode = createServerFn({ method: "POST" })
  .inputValidator((d: { bookingId: string }) => z.object({ bookingId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const vh = await visitorHash();
    const { data: b } = await db.from("bookings").select("id,email,lead_id,status,visitor_hash,leads(full_name)").eq("id", data.bookingId).single();
    // Only the visitor who requested the booking may resend its code.
    if (!b || b.status !== "pending_verification" || b.visitor_hash !== vh) return { error: "expired" as const };
    const { data: last } = await db.from("email_verifications").select("resend_count,last_sent_at").eq("booking_id", b.id).order("created_at", { ascending: false }).limit(1).single();
    if (!last) return { error: "expired" as const };
    if (last.resend_count >= 3) return { error: "max_resends" as const };
    if (Date.now() - Date.parse(last.last_sent_at) < 60_000) return { error: "too_soon" as const };
    const hour = new Date(Date.now() - 3600_000).toISOString();
    const [{ count }, { count: perVisitor }] = await Promise.all([
      db.from("email_verifications").select("id", { count: "exact", head: true }).eq("email", b.email).gte("created_at", hour),
      db.from("email_verifications").select("id", { count: "exact", head: true }).eq("visitor_hash", vh).gte("created_at", hour),
    ]);
    if ((count ?? 0) >= 3 || (perVisitor ?? 0) >= 10) return { error: "rate_limited" as const };
    await db.from("bookings").update({ verify_expires_at: new Date(Date.now() + 600_000).toISOString() }).eq("id", b.id);
    const name = (b.leads as { full_name: string | null } | null)?.full_name ?? "";
    await sendCode(db, b.id, b.email, name, b.lead_id, vh, last.resend_count + 1);
    return { ok: true as const };
  });

// ---------- Confirmation ----------
export const verifyCode = createServerFn({ method: "POST" })
  .inputValidator((d: { bookingId: string; code: string }) => z.object({ bookingId: z.string().uuid(), code: z.string().regex(/^\d{6}$/) }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    // Verify the code first — only the code holder may affect this booking.
    const { data: result, error } = await db.rpc("confirm_booking", { p_booking_id: data.bookingId, p_code: data.code });
    if (error) { console.error(error); return { result: "server" as const }; }
    const r = result as "confirmed" | "wrong_code" | "expired" | "too_many_attempts" | "slot_taken" | "email_has_active_booking";
    if (r === "confirmed") {
      // Live calendar re-check right after confirming: release if the time now clashes.
      const { data: pend } = await db.from("bookings").select("start_utc,end_utc").eq("id", data.bookingId).single();
      if (pend) {
        const s = Date.parse(pend.start_utc), e = Date.parse(pend.end_utc), buf = 15 * 60_000;
        const clash = (await loadBusy(db)).some((x) => s < x.end + buf && e > x.start - buf);
        if (clash) {
          await db.from("bookings").update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancel_reason: "slot_taken" }).eq("id", data.bookingId);
          await cancelPendingReminders(db, data.bookingId);
          return { result: "slot_taken" as const };
        }
      }
    }
    if (r !== "confirmed") {
      if (r === "wrong_code") {
        const { data: v } = await db.from("email_verifications").select("attempts").eq("booking_id", data.bookingId).order("created_at", { ascending: false }).limit(1).single();
        return { result: r, attemptsLeft: 5 - (v?.attempts ?? 0) };
      }
      return { result: r };
    }
    const { data: b } = await db.from("bookings").select("id,manage_token,code,email,start_utc,end_utc,length_min,client_tz,lead_id,created_at,leads(full_name,company,role,project_area,need,platform)").eq("id", data.bookingId).single();
    if (b) {
      const lead = b.leads as { full_name: string | null; company: string | null; role: string | null; project_area: string | null; need: string | null; platform: string | null } | null;
      const when = new Intl.DateTimeFormat("en-GB", { timeZone: b.client_tz, dateStyle: "full", timeStyle: "short" }).format(Date.parse(b.start_utc));
      await syncBookingCalendar(db, b.id);
      const link = await meetingLink(db, b.id);
      const origin = SITE_URL;
      const short = Date.parse(b.start_utc) - Date.parse(b.created_at) < 26 * 3600_000;
      const attend = short ? `\n\nPlease confirm you can attend. If we don't hear from you 6 hours before the start, we'll release the time:\n${origin}/attend/${b.manage_token}` : "";
      const cal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Free consultation with Advancing Data Solutions")}&dates=${gcal(Date.parse(b.start_utc))}/${gcal(Date.parse(b.end_utc))}&details=${encodeURIComponent(`Meeting link: ${link}\nManage your booking: ${origin}/booked/${b.manage_token}`)}&location=${encodeURIComponent(link)}`;
      const { data: st } = await db.from("settings").select("team_timezone").eq("id", 1).single();
      const fmt = (tz: string) => new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(Date.parse(b.start_utc));
      await queueMessage(db, {
        type: "confirmation", to: b.email, bookingId: b.id, leadId: b.lead_id, minutes: 10,
        subject: `You're booked: Free Consultation (${b.length_min} min)`,
        body: `Hi ${(lead?.full_name ?? "").split(" ")[0] || "there"},\n\nThanks for booking a free ${b.length_min}-minute consultation with our engineers. Your call is on ${when} (your time).\n\nMeeting link: ${link}${attend}\n\nAdd it to your calendar: ${cal}\n\nSo you can share details freely on the call, please sign our short mutual NDA before the consultation: ${origin}/nda/${b.manage_token}\n\nNeed another time? ${origin}/reschedule/${b.manage_token}\n\nCan't make it? ${origin}/cancel/${b.manage_token}${SIGN}`,
      });
      await scheduleReminders(db, { ...b, full_name: lead?.full_name ?? null }, origin, { nda: true });
      await queueMessage(db, {
        type: "admin_new_booking", to: "contact@advancingdatasolutions.com", bookingId: b.id, leadId: b.lead_id,
        subject: `New booking: ${lead?.company ?? b.email} (${b.length_min} min)`,
        body: `${lead?.full_name ?? b.email} from ${lead?.company ?? "—"} booked a free ${b.length_min}-minute consultation.\n\nYour time: ${fmt(st?.team_timezone || "Asia/Karachi")}\nClient's time: ${fmt(b.client_tz)}\n\nEmail: ${b.email}\nRole: ${lead?.role ?? "—"}\nArea: ${lead?.project_area ?? "—"} · Need: ${lead?.need ?? "—"} · Platform: ${lead?.platform ?? "—"}\n\n${origin}/admin/bookings`,
      });
      return { result: r, token: b.manage_token };
    }
    return { result: r };
  });

// ---------- Reschedule / cancel (token-based) ----------
export const rescheduleBooking = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; slotStart: string; timeZone: string }) =>
    z.object({ token: z.string().min(16).max(64), slotStart: z.string().datetime(), timeZone: z.string().min(1).max(64) }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: b } = await db.from("bookings").select("id,email,length_min,start_utc,lead_id,code")
      .eq("manage_token", data.token).in("status", ["confirmed", "attendance_confirmed"]).maybeSingle();
    if (!b || Date.parse(b.start_utc) < Date.now()) return { error: "not_found" as const };
    const start = Date.parse(data.slotStart);
    const duration = b.length_min as 30 | 60;
    const valid = generateSlots({ now: Date.now(), duration, visitorTz: data.timeZone, ...(await loadSchedule(db, data.token)) })
      .some((s) => s.start === start);
    if (!valid) return { error: "slot_taken" as const };
    const { data: s } = await db.from("settings").select("buffer_min").eq("id", 1).single();
    const end = start + duration * 60000;
    const { error } = await db.from("bookings").update({
      start_utc: new Date(start).toISOString(), end_utc: new Date(end).toISOString(),
      blocked_until_utc: new Date(end + (s?.buffer_min ?? 15) * 60000).toISOString(),
      client_tz: data.timeZone, status: "confirmed", attendance_confirmed_at: null,
    }).eq("id", b.id);
    if (error) return { error: "slot_taken" as const };
    await syncBookingCalendar(db, b.id);
    const origin = SITE_URL;
    const { data: full } = await db.from("bookings").select("manage_token, leads(full_name), ndas(id)").eq("id", b.id).single();
    const signed = Array.isArray(full?.ndas) ? full.ndas.length > 0 : !!full?.ndas;
    const short = start - Date.now() < 26 * 3600_000;
    const attend = short ? `\n\nPlease confirm you can attend. If we don't hear from you 6 hours before the start, we'll release the time:\n${origin}/attend/${data.token}` : "";
    await cancelPendingReminders(db, b.id);
    await queueMessage(db, {
      type: "reschedule_notice", to: b.email, bookingId: b.id, leadId: b.lead_id,
      subject: "Your consultation has moved",
      body: `Your consultation is now on ${new Intl.DateTimeFormat("en-GB", { timeZone: data.timeZone, dateStyle: "full", timeStyle: "short" }).format(start)} (your time). The meeting link stays the same.${attend}\n\nView your booking: ${origin}/booked/${data.token}${SIGN}`,
    });
    await scheduleReminders(db, {
      id: b.id, email: b.email, code: b.code, start_utc: new Date(start).toISOString(), length_min: b.length_min,
      client_tz: data.timeZone, manage_token: data.token, lead_id: b.lead_id, created_at: new Date().toISOString(),
      full_name: (full?.leads as { full_name: string | null } | null)?.full_name ?? null,
    }, origin, { nda: !signed });
    return { ok: true as const };
  });

export const cancelBooking = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; reason: string }) => z.object({ token: z.string().min(16).max(64), reason: z.string().max(500) }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: r } = await db.rpc("cancel_booking_by_token", { p_token: data.token, p_reason: stripLinks(data.reason).slice(0, 300) });
    if (r !== "cancelled") return { error: "not_found" as const };
    const { data: b } = await db.from("bookings").select("id,email,lead_id,is_demo").eq("manage_token", data.token).single();
    if (b) await cancelPendingReminders(db, b.id);
    if (b) await syncBookingCalendar(db, b.id);
    if (b) {
      const { data: row, error } = await db.from("messages").insert({
        type: "cancel_notice", to_email: b.email, booking_id: b.id, lead_id: b.lead_id, is_demo: b.is_demo,
        subject: "Your consultation has been cancelled",
        body: `Your consultation has been cancelled and the time released. You're welcome to book a new time whenever suits you:\n${SITE_URL}/book${SIGN}`,
      }).select("id").single();
      if (row) await deliverMessage(db, row.id);
      if (error) throw new Error("Booking cancelled, but the notice couldn't be queued");
    }
    return { ok: true as const };
  });

/** Public token was validated by sign_nda; refresh only that booking's calendar event. */
export const refreshSignedNdaCalendar = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => z.object({ token: z.string().min(16).max(64) }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: b } = await db.from("bookings").select("id,ndas(id)").eq("manage_token", data.token).maybeSingle();
    if (!b || !b.ndas || (Array.isArray(b.ndas) && !b.ndas.length)) return { ok: false as const };
    await syncBookingCalendar(db, b.id);
    return { ok: true as const };
  });
