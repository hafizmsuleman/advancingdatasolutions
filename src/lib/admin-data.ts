// Admin data via the signed-in browser client (RLS: admins only).
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AREA_LABEL, BUDGET_LABEL, NEED_LABEL, PLATFORM_LABEL } from "./enums";
import { setAdminTimeZone, tzLabel, type AdminBooking, type AdminLead, type OutboxEmail, type BookingStatus, type LeadStatus } from "./admin-sample";

async function demoMode() {
  const { data } = await supabase.from("settings").select("demo_mode, team_timezone").eq("id", 1).single();
  if (data?.team_timezone) setAdminTimeZone(data.team_timezone);
  // Keep demo automations/emails on whenever the admin's view includes demo data.
  const want = readView() !== "real";
  if (data && data.demo_mode !== want) await supabase.from("settings").update({ demo_mode: want }).eq("id", 1);
  return want;
}

export function useDemoMode() {
  return useQuery({ queryKey: ["admin", "demo"], queryFn: demoMode });
}

// Admin pages follow Settings → Data view (stored per admin browser; default All data).
export type DataView = "real" | "demo" | "all";
const VIEW_KEY = "ads-admin-view";
const listeners = new Set<() => void>();
function readView(): DataView {
  if (typeof window === "undefined") return "all";
  const v = window.localStorage.getItem(VIEW_KEY);
  return v === "real" || v === "demo" ? v : "all";
}
export function setDataView(v: DataView) {
  window.localStorage.setItem(VIEW_KEY, v);
  listeners.forEach((l) => l());
}
export function useDataView(): DataView {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, readView, () => "all");
}
/** Apply the view to a query on a table with is_demo. */
function scope<Q>(q: Q, v: DataView): Q {
  return v === "all" ? q : (q as unknown as { eq: (c: string, val: boolean) => Q }).eq("is_demo", v === "demo");
}

export function useInvalidateAdmin() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["admin"] });
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function useAdminBookings() {
  const v = useDataView();
  return useQuery({
    queryKey: ["admin", "bookings", v],
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<AdminBooking[]> => {
      await demoMode();
      let q = supabase.from("bookings")
        .select("*, leads(full_name,company,role,project_area,platform,need,timeline,budget_range,notes,email_verified_at), ndas(id), messages(type,subject)")
        .neq("status", "pending_verification").order("start_utc");
      q = scope(q, v);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).filter((b) => b.cancel_reason !== "replaced").map((b) => {
        const l = b.leads;
        const nda = Array.isArray(b.ndas) ? b.ndas.length > 0 : !!b.ndas;
        const status = (b.status === "attendance_confirmed" ? "confirmed" : b.status === "rescheduled" ? "cancelled" : b.status) as BookingStatus;
        return {
          id: b.id, code: b.code, name: l?.full_name ?? "", email: b.email, company: l?.company ?? b.email,
          role: l?.role ?? "", country: tzLabel(b.client_tz), clientTz: b.client_tz,
          area: (AREA_LABEL[l?.project_area ?? ""] ?? "Data") as AdminBooking["area"],
          platform: PLATFORM_LABEL[l?.platform as keyof typeof PLATFORM_LABEL] ?? "—",
          need: NEED_LABEL[l?.need ?? ""] ?? "—",
          timeline: l?.timeline ?? "—",
          budget: BUDGET_LABEL[l?.budget_range as keyof typeof BUDGET_LABEL] ?? "—",
          notes: l?.notes ?? "",
          duration: b.length_min as 30 | 60, start: b.start_utc, createdAt: b.created_at,
          verified: !!l?.email_verified_at, ndaSigned: nda,
          attendance: b.status === "attendance_confirmed" || !!b.attendance_confirmed_at,
          calendarFailed: !b.is_demo && b.calendar_sync_status === "failed" && ["confirmed", "attendance_confirmed"].includes(b.status),
          status, isNew: status === "confirmed" && Date.now() - Date.parse(b.created_at) < 36 * 3600_000,
          declined: (b.messages ?? []).some((m) => m.type === "admin_alert" && m.subject.startsWith("Client declined in calendar")),
          cancelledAt: b.cancelled_at, cancelReason: b.cancel_reason, isDemo: b.is_demo,
        };
      });
    },
  });
}

export function useAdminStats() {
  const v = useDataView();
  return useQuery({
    queryKey: ["admin", "stats", v],
    refetchInterval: 15_000,
    queryFn: async () => {
      const week = new Date(Date.now() - 7 * 86400_000).toISOString();
      let b = supabase.from("bookings").select("id", { count: "exact", head: true })
        .in("status", ["confirmed", "attendance_confirmed", "completed"]).gte("created_at", week);
      // Queued emails count once due; real sending will flip them to "sent".
       let m = supabase.from("messages").select("id").in("status", ["sent", "scheduled"])
        .gte("scheduled_utc", week).lte("scheduled_utc", new Date().toISOString());
       let upcoming = supabase.from("bookings").select("id", { count: "exact", head: true })
         .in("status", ["confirmed", "attendance_confirmed"]).gt("start_utc", new Date().toISOString());
       let confirmed = supabase.from("bookings").select("id", { count: "exact", head: true })
         .in("status", ["confirmed", "attendance_confirmed"])
         .or("status.eq.attendance_confirmed,attendance_confirmed_at.not.is.null")
         .gt("start_utc", new Date().toISOString());
       b = scope(b, v); m = scope(m, v); upcoming = scope(upcoming, v); confirmed = scope(confirmed, v);
      const n = supabase.from("ndas").select("id, bookings!inner(is_demo)", { count: "exact", head: true }).gte("signed_at", week);
       const [{ count: bookings }, { data: msgs }, { count: ndas }, { count: upcomingTotal }, { count: attendanceConfirmed }] = await Promise.all([b, m, v === "all" ? n : n.eq("bookings.is_demo", v === "demo"), upcoming, confirmed]);
       return { bookingsThisWeek: bookings ?? 0, ndasSigned: ndas ?? 0, emailsAutomated: msgs?.length ?? 0,
         upcomingTotal: upcomingTotal ?? 0, attendanceConfirmed: attendanceConfirmed ?? 0 };
    },
  });
}

export function useAdminLeads() {
  const v = useDataView();
  return useQuery({
    queryKey: ["admin", "leads", v],
    queryFn: async (): Promise<(AdminLead & { bookingToken: string })[]> => {
      await demoMode();
      const q = scope(supabase.from("leads").select("*").order("created_at", { ascending: false }), v);
      const [{ data, error }, { data: blocked }] = await Promise.all([q, supabase.from("blocked_senders").select("value")]);
      if (error) throw error;
      const bl = new Set((blocked ?? []).map((b) => b.value.toLowerCase()));
      const src: Record<string, AdminLead["source"]> = { form: "Form", linkedin: "LinkedIn", email: "Email", whatsapp: "WhatsApp", pasted: "Email" };
      return (data ?? []).map((l) => {
        const email = (l.email ?? "").toLowerCase();
        const isBlocked = bl.has(email) || bl.has(email.split("@")[1] ?? "");
        const status: LeadStatus = isBlocked ? "blocked" : l.status === "booked" ? "booked" : l.status === "cold" ? "cold" : l.nudge_count > 0 ? "nudged" : l.status === "link_sent" ? "link_sent" : "new";
        return {
          id: l.id, name: l.full_name ?? "—", email: l.email ?? "", company: l.company ?? "—", country: l.client_tz ? tzLabel(l.client_tz) : "",
          status, source: src[l.source] ?? "Form", area: (AREA_LABEL[l.project_area ?? ""] ?? "Data") as AdminLead["area"],
          verified: !!l.email_verified_at && Date.now() - Date.parse(l.email_verified_at) < 30 * 86400_000,
          nudges: l.nudge_count, lastNudge: l.last_nudged_at, createdAt: l.created_at, bookingToken: l.booking_token, isDemo: l.is_demo,
        };
      });
    },
  });
}

export function useAdminOutbox() {
  const v = useDataView();
  return useQuery({
    queryKey: ["admin", "outbox", v],
    queryFn: async (): Promise<OutboxEmail[]> => {
      await demoMode();
      const q = scope(supabase.from("messages").select("*, bookings(status,cancel_reason)").order("scheduled_utc", { ascending: false }).limit(200), v);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((m) => ({ id: m.id, to: m.to_email, type: m.type, subject: m.subject.replace(/\s*\(ADS-[A-Z0-9]+\)/g, ""), body: m.body.replace(/^Reference: ADS-[A-Z0-9]+\n?/gm, "").replace(/\sADS-[A-Z0-9]+\b/g, ""), at: m.sent_at ?? m.scheduled_utc, status: m.status, isDemo: m.is_demo,
        cancellationNote: m.status === "cancelled" && ["nda_reminder", "reminder_24h", "reminder_1h"].includes(m.type) && (m.bookings?.status === "cancelled" || m.bookings?.status === "rescheduled") && m.bookings?.cancel_reason !== "slot_taken" }));
    },
  });
}

export { cap };

/** Remove an email and its domain from blocked_senders. */
export async function unblockSender(email: string): Promise<boolean> {
  const e = email.toLowerCase();
  const { error } = await supabase.from("blocked_senders").delete().in("value", [e, e.split("@")[1] ?? e]);
  return !error;
}

/** Validate and add the email or domain selected in the styled block dialog. */
export async function blockSender(input: string, source: string): Promise<boolean> {
  const value = input.trim().toLowerCase().replace(/^@/, "");
  if (!/^([^\s@]+@)?[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(value) || value.length > 254) return false;
  const { data: exists } = await supabase.from("blocked_senders").select("id").eq("value", value).limit(1);
  if (exists?.length) return true;
  const { error } = await supabase.from("blocked_senders").insert({ value, reason: `Blocked from ${source}` });
  return !error;
}
