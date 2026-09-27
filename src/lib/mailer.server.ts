// Server-only: delivers Outbox rows (`messages`) through Lovable's managed email.
// Status on the row is the truth: sent / failed (after 3 attempts) / cancelled.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { sendTemplateEmail } from "./email-templates/send-email";

type DB = SupabaseClient<Database>;
type MsgType = Database["public"]["Enums"]["message_type"];

const REPLY_TO = "contact@advancingdatasolutions.com";
const MAX_ATTEMPTS = 3;
const TEMPLATE: Record<MsgType, string> = {
  verification_code: "verification-code", confirmation: "confirmation", admin_new_booking: "admin-new-booking",
  nda_reminder: "nda-reminder", reminder_24h: "reminder-24h", reminder_1h: "reminder-1h",
  release_notice: "release-notice", reschedule_notice: "reschedule-notice", cancel_notice: "cancel-notice",
  nudge: "nudge", admin_alert: "admin-alert",
};

/** Send one due Outbox row. Demo rows (already addressed to the admin) only send while demo mode is on. */
export async function deliverMessage(d: DB, id: string, demoMode?: boolean): Promise<"sent" | "failed" | "retry" | "skipped"> {
  const { data: m } = await d.from("messages").select("*").eq("id", id).eq("status", "scheduled").maybeSingle();
  if (!m || Date.parse(m.scheduled_utc) > Date.now()) return "skipped";
  if (m.is_demo) {
    if (demoMode === undefined) demoMode = !!(await d.from("settings").select("demo_mode").eq("id", 1).single()).data?.demo_mode;
    if (!demoMode) return "skipped";
  }
  try {
    const r = await sendTemplateEmail(TEMPLATE[m.type], m.to_email, {
      templateData: { subject: m.subject, body: m.body },
      idempotencyKey: `msg-${m.id}`,
      replyTo: REPLY_TO,
    });
    if (!r.sent) {
      await d.from("messages").update({ status: "failed", error: "Recipient has unsubscribed or their address bounced" }).eq("id", m.id);
      return "failed";
    }
    await d.from("messages").update({ status: "sent", sent_at: new Date().toISOString(), error: null }).eq("id", m.id).eq("status", "scheduled");
    return "sent";
  } catch (e) {
    const attempts = m.retry_count + 1;
    const final = attempts >= MAX_ATTEMPTS;
    console.error("email send failed", m.id, e);
    await d.from("messages").update({
      retry_count: attempts, status: final ? "failed" : "scheduled",
      error: (e instanceof Error ? e.message : String(e)).slice(0, 300),
    }).eq("id", m.id);
    return final ? "failed" : "retry";
  }
}

/** Send every due row (including retries). Rows due more than 6h ago are left alone. */
export async function deliverDue(d: DB) {
  const now = Date.now();
  const { data: s } = await d.from("settings").select("demo_mode").eq("id", 1).single();
  const { data: due } = await d.from("messages").select("id").eq("status", "scheduled")
    .lte("scheduled_utc", new Date(now).toISOString()).gte("scheduled_utc", new Date(now - 6 * 3600_000).toISOString())
    .lt("retry_count", MAX_ATTEMPTS).order("scheduled_utc").limit(50);
  const c = { sent: 0, failed: 0 };
  for (const { id } of due ?? []) {
    const r = await deliverMessage(d, id, !!s?.demo_mode);
    if (r === "sent") c.sent++; else if (r === "failed") c.failed++;
  }
  return c;
}
