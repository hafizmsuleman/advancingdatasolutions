import { createServerFn } from "@tanstack/react-start";
import { SITE_URL } from "@/lib/site";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { cancelPendingReminders } from "./automations.server";
import { syncBookingCalendar } from "./calendar.server";
import { deliverMessage } from "./mailer.server";

export const cancelAdminBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; reason?: string }) => z.object({ id: z.string().uuid(), reason: z.string().max(500).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: allowed } = await context.supabase.rpc("is_admin");
    if (!allowed) throw new Error("Forbidden");
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data: b } = await db.from("bookings").select("id,email,lead_id,status,is_demo").eq("id", data.id).single();
    if (!b || !["confirmed", "attendance_confirmed"].includes(b.status)) throw new Error("Booking is no longer active");
    const reason = (data.reason ?? "").replace(/(?:https?:\/\/|www\.)\S+/gi, "").replace(/[\r\n]+/g, " ").trim().slice(0, 500);
    const { data: changed, error } = await db.from("bookings").update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancel_reason: reason ? `Cancelled by our team: ${reason}` : "Cancelled by our team" })
      .eq("id", b.id).in("status", ["confirmed", "attendance_confirmed"]).select("id");
    if (error || !changed?.length) throw new Error("Couldn't cancel booking");
    await cancelPendingReminders(db, b.id);
    await syncBookingCalendar(db, b.id);
    const origin = SITE_URL;
    const { data: row, error: messageError } = await db.from("messages").insert({
      type: "cancel_notice", to_email: b.email, booking_id: b.id, lead_id: b.lead_id,
      subject: "Your consultation has been cancelled", is_demo: b.is_demo,
       body: `We've cancelled your consultation and released the time.${reason ? `\nReason: ${reason}\n` : " "}You're welcome to book a new time:\n${origin}/book\n\nThe Advancing Data Solutions team`,
    }).select("id").single();
    if (row) await deliverMessage(db, row.id);
    if (messageError) throw new Error("Booking cancelled, but the notice couldn't be queued");
    return { ok: true };
  });
/** Admin outcome "No-show" with an optional client email (sent at most once per booking). */
export const markNoShow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; note?: string; notify?: boolean; message?: string }) =>
    z.object({ id: z.string().uuid(), note: z.string().max(500).optional(), notify: z.boolean().optional(), message: z.string().max(500).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: allowed } = await context.supabase.rpc("is_admin");
    if (!allowed) throw new Error("Forbidden");
    const clean = (s?: string) => (s ?? "").replace(/(?:https?:\/\/|www\.)\S+/gi, "").replace(/[\r\n]+/g, " ").trim().slice(0, 500);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data: b } = await db.from("bookings").select("id,email,lead_id,status,is_demo,start_utc,client_tz, leads(full_name)").eq("id", data.id).single();
    if (!b || !["confirmed", "attendance_confirmed", "ended", "completed", "no_show"].includes(b.status) || Date.parse(b.start_utc) > Date.now()) throw new Error("Booking can't be marked no-show");
    const note = clean(data.note);
    const { error } = await db.from("bookings").update({ status: "no_show", outcome_note: note || null }).eq("id", b.id);
    if (error) throw new Error("Couldn't update the booking");
    if (!data.notify) return { ok: true, emailed: false };
    const { data: prior } = await db.from("messages").select("id").eq("booking_id", b.id).eq("type", "no_show_notice").limit(1);
    if (prior?.length) return { ok: true, emailed: false, alreadySent: true };
    const msg = clean(data.message);
    const first = ((b.leads as { full_name: string | null } | null)?.full_name ?? "").split(" ")[0] || "there";
    const { emailWhen } = await import("@/lib/time-zone-label");
    const body = `Hi ${first},\n\nWe were ready for your free consultation on ${emailWhen(b.start_utc, b.client_tz)}, but we weren't able to connect.${msg ? `\n\n${msg}` : ""}\n\nIf you'd still like to talk, you're welcome to choose a new time that suits you.\n\n${SITE_URL}/book\n\nThe Advancing Data Solutions team`;
    const { data: row, error: mErr } = await db.from("messages").insert({
      type: "no_show_notice", to_email: b.email, booking_id: b.id, lead_id: b.lead_id, is_demo: b.is_demo,
      subject: "Sorry we missed you", body,
    }).select("id").single();
    if (mErr || !row) throw new Error("Marked no-show, but the email couldn't be queued");
    const r = await deliverMessage(db, row.id);
    return { ok: true, emailed: r === "sent", failed: r === "failed" };
  });
