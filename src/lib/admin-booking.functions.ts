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
       body: `We've cancelled your consultation and released the time.${reason ? `\nReason: ${reason}` : ""} You're welcome to book a new time:\n${origin}/book\n\nThe Advancing Data Solutions team`,
    }).select("id").single();
    if (row) await deliverMessage(db, row.id);
    if (messageError) throw new Error("Booking cancelled, but the notice couldn't be queued");
    return { ok: true };
  });