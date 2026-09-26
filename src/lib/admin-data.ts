// Admin data via the signed-in browser client (RLS: admins only).
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AREA_LABEL, BUDGET_LABEL, NEED_LABEL, PLATFORM_LABEL } from "./enums";
import { tzLabel, type AdminBooking, type AdminLead, type OutboxEmail, type BookingStatus, type LeadStatus } from "./admin-sample";

async function demoMode() {
  const { data } = await supabase.from("settings").select("demo_mode").eq("id", 1).single();
  return !!data?.demo_mode;
}

export function useDemoMode() {
  return useQuery({ queryKey: ["admin", "demo"], queryFn: demoMode });
}

export function useInvalidateAdmin() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["admin"] });
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function useAdminBookings() {
  return useQuery({
    queryKey: ["admin", "bookings"],
    queryFn: async (): Promise<AdminBooking[]> => {
      const demo = await demoMode();
      let q = supabase.from("bookings")
        .select("*, leads(full_name,company,role,project_area,platform,need,timeline,budget_range,notes,email_verified_at), ndas(id)")
        .neq("status", "pending_verification").order("start_utc");
      if (!demo) q = q.eq("is_demo", false);
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
          status, isNew: status === "confirmed" && Date.now() - Date.parse(b.created_at) < 36 * 3600_000,
        };
      });
    },
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const demo = await demoMode();
      const week = new Date(Date.now() - 7 * 86400_000).toISOString();
      let b = supabase.from("bookings").select("id", { count: "exact", head: true })
        .in("status", ["confirmed", "attendance_confirmed", "completed"]).gte("created_at", week);
      let m = supabase.from("messages").select("minutes_saved").eq("status", "sent").gte("created_at", week);
      if (!demo) { b = b.eq("is_demo", false); m = m.eq("is_demo", false); }
      const n = supabase.from("ndas").select("id, bookings!inner(is_demo)", { count: "exact", head: true }).gte("signed_at", week);
      const [{ count: bookings }, { data: msgs }, { count: ndas }] = await Promise.all([b, m, demo ? n : n.eq("bookings.is_demo", false)]);
      const minutes = (msgs ?? []).reduce((s, x) => s + x.minutes_saved, 0);
      return { bookingsThisWeek: bookings ?? 0, ndasSigned: ndas ?? 0, emailsAutomated: msgs?.length ?? 0, hoursSaved: minutes / 60 };
    },
  });
}

export function useAdminLeads() {
  return useQuery({
    queryKey: ["admin", "leads"],
    queryFn: async (): Promise<(AdminLead & { bookingToken: string })[]> => {
      const demo = await demoMode();
      let q = supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (!demo) q = q.eq("is_demo", false);
      const [{ data, error }, { data: blocked }] = await Promise.all([q, supabase.from("blocked_senders").select("value")]);
      if (error) throw error;
      const bl = new Set((blocked ?? []).map((b) => b.value.toLowerCase()));
      const src: Record<string, AdminLead["source"]> = { form: "Form", linkedin: "LinkedIn", email: "Email", whatsapp: "WhatsApp", pasted: "Email" };
      return (data ?? []).map((l) => {
        const email = (l.email ?? "").toLowerCase();
        const isBlocked = bl.has(email) || bl.has(email.split("@")[1] ?? "");
        const status: LeadStatus = isBlocked ? "blocked" : l.status === "booked" ? "booked" : l.status === "cold" ? "cold" : l.nudge_count > 0 ? "nudged" : "new";
        return {
          id: l.id, name: l.full_name ?? "—", email: l.email ?? "", company: l.company ?? "—", country: l.client_tz ? tzLabel(l.client_tz) : "",
          status, source: src[l.source] ?? "Form", area: (AREA_LABEL[l.project_area ?? ""] ?? "Data") as AdminLead["area"],
          verified: !!l.email_verified_at && Date.now() - Date.parse(l.email_verified_at) < 30 * 86400_000,
          nudges: l.nudge_count, lastNudge: l.last_nudged_at, createdAt: l.created_at, bookingToken: l.booking_token,
        };
      });
    },
  });
}

export function useAdminOutbox() {
  return useQuery({
    queryKey: ["admin", "outbox"],
    queryFn: async (): Promise<OutboxEmail[]> => {
      const demo = await demoMode();
      let q = supabase.from("messages").select("*").order("scheduled_utc", { ascending: false }).limit(200);
      if (!demo) q = q.eq("is_demo", false);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((m) => ({ id: m.id, to: m.to_email, type: m.type, subject: m.subject, body: m.body, at: m.sent_at ?? m.scheduled_utc, status: m.status }));
    },
  });
}

export { cap };
