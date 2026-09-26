// Server-only: Google Calendar via the connector gateway (the team's own calendar).
// Busy times feed the slot picker; confirmed bookings get an event with a Meet link.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { AREA_LABEL, BUDGET_LABEL, NEED_LABEL, PLATFORM_LABEL } from "./enums";
import { HORIZON_DAYS } from "./slots";

type DB = SupabaseClient<Database>;
const GATEWAY = "https://connector-gateway.lovable.dev/google_calendar/calendar/v3";
const CAL = "primary";

export type CalBusy = { start: number; end: number; eventId: string; calendar: true };

async function gcal(path: string, init: RequestInit = {}) {
  const lk = process.env["LOVABLE_API_KEY"];
  const ck = process.env["GOOGLE_CALENDAR_API_KEY"];
  if (!lk || !ck) throw new Error("Google Calendar is not connected");
  const res = await fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${lk}`, "X-Connection-Api-Key": ck, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`Google Calendar [${res.status}]: ${body.slice(0, 500)}`) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

// Last good read — used only as a fallback when Google can't be reached.
let cache: { at: number; data: CalBusy[] } | null = null;

/** Busy events on the team calendar for the booking horizon — always a live read. */
export async function calendarBusy(): Promise<CalBusy[]> {
  const now = Date.now();
  const q = new URLSearchParams({
    timeMin: new Date(now - 86400_000).toISOString(),
    timeMax: new Date(now + (HORIZON_DAYS + 2) * 86400_000).toISOString(),
    singleEvents: "true", orderBy: "startTime", maxResults: "2500",
    fields: "items(id,status,transparency,start,end,attendees(self,responseStatus))",
  });
  try {
    const j = await gcal(`/calendars/${CAL}/events?${q}`);
    type Ev = { id: string; status?: string; transparency?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string }; attendees?: { self?: boolean; responseStatus?: string }[] };
    const data: CalBusy[] = ((j?.items ?? []) as Ev[])
      .filter((e) => e.status !== "cancelled" && e.transparency !== "transparent")
      .filter((e) => !e.attendees?.some((a) => a.self && a.responseStatus === "declined"))
      .filter((e) => e.start?.dateTime || e.transparency === "opaque")
      .map((e) => ({
        start: Date.parse(e.start!.dateTime ?? `${e.start!.date}T00:00:00Z`),
        end: Date.parse(e.end!.dateTime ?? `${e.end!.date}T00:00:00Z`),
        eventId: e.id, calendar: true as const,
      }));
    cache = { at: now, data };
    return data;
  } catch (e) {
    console.error("calendarBusy failed", e);
    return cache?.data ?? [];
  }
}

function invalidate() { cache = null; }

type Sync = "synced" | "failed";

/**
 * Bring the Google event in line with the booking (idempotent, safe to retry):
 * active booking -> create or move its event; inactive booking -> delete its event.
 * Demo bookings never touch the calendar.
 */
export async function syncBookingCalendar(d: DB, bookingId: string): Promise<Sync | "skipped"> {
  const { data: b } = await d.from("bookings")
    .select("id,code,email,status,start_utc,end_utc,length_min,is_demo,google_event_id,meet_link,manage_token, leads(full_name,company,role,project_area,platform,need,budget_range,notes), ndas(id,signer_name,signed_at)")
    .eq("id", bookingId).single();
  if (!b || b.is_demo) return "skipped";
  const active = b.status === "confirmed" || b.status === "attendance_confirmed";
  try {
    if (!active) {
      if (b.google_event_id) {
        try {
          await gcal(`/calendars/${CAL}/events/${encodeURIComponent(b.google_event_id)}?sendUpdates=all`, { method: "DELETE" });
        } catch (e) {
          const s = (e as { status?: number }).status;
          if (s !== 404 && s !== 410) throw e;
        }
        await d.from("bookings").update({ google_event_id: null, calendar_sync_status: "synced" }).eq("id", b.id);
        invalidate();
        return "synced";
      }
      return "skipped";
    }
    const l = b.leads as { full_name: string | null; company: string | null; role: string | null; project_area: string | null; platform: string | null; need: string | null; budget_range: string | null; notes: string | null } | null;
    const nda = (Array.isArray(b.ndas) ? b.ndas[0] : b.ndas) as { signer_name: string; signed_at: string } | undefined;
    const description = [
      `Free Consultation (${b.length_min} min) · Reference ${b.code}`,
      "",
      `Name: ${l?.full_name ?? "—"}`,
      `Role: ${l?.role ?? "—"}`,
      `Company: ${l?.company ?? "—"}`,
      `Email: ${b.email}`,
      `Project area: ${AREA_LABEL[l?.project_area ?? ""] ?? "—"}`,
      `Platform: ${PLATFORM_LABEL[l?.platform as keyof typeof PLATFORM_LABEL] ?? "—"}`,
      `Need: ${NEED_LABEL[l?.need ?? ""] ?? "—"}`,
      `Budget: ${BUDGET_LABEL[l?.budget_range as keyof typeof BUDGET_LABEL] ?? "—"}`,
      `Notes: ${l?.notes || "—"}`,
      "",
      `NDA: ${nda ? `signed by ${nda.signer_name} on ${new Date(nda.signed_at).toISOString().slice(0, 10)}` : "not signed yet"}`,
    ].join("\n");
    const body = {
      summary: `Consultation: ${l?.company || b.email} (Advancing Data Solutions)`,
      description,
      start: { dateTime: b.start_utc, timeZone: "UTC" },
      end: { dateTime: b.end_utc, timeZone: "UTC" },
      attendees: [{ email: b.email, displayName: l?.full_name ?? undefined }],
      guestsCanModify: false,
      reminders: { useDefault: true },
    };
    let ev: { id: string; hangoutLink?: string; conferenceData?: { entryPoints?: { entryPointType: string; uri: string }[] } } | null = null;
    if (b.google_event_id) {
      try {
        ev = await gcal(`/calendars/${CAL}/events/${encodeURIComponent(b.google_event_id)}?sendUpdates=all&conferenceDataVersion=1`, { method: "PATCH", body: JSON.stringify(body) });
      } catch (e) {
        const s = (e as { status?: number }).status;
        if (s !== 404 && s !== 410) throw e;
      }
    }
    if (!ev) {
      ev = await gcal(`/calendars/${CAL}/events?sendUpdates=all&conferenceDataVersion=1`, {
        method: "POST",
        body: JSON.stringify({ ...body, conferenceData: { createRequest: { requestId: `ads-${b.id}-${Date.now()}`, conferenceSolutionKey: { type: "hangoutsMeet" } } } }),
      });
    }
    const meet = ev?.hangoutLink ?? ev?.conferenceData?.entryPoints?.find((p) => p.entryPointType === "video")?.uri ?? b.meet_link;
    await d.from("bookings").update({ google_event_id: ev!.id, meet_link: meet ?? null, calendar_sync_status: meet ? "synced" : "failed" }).eq("id", b.id);
    invalidate();
    return meet ? "synced" : "failed";
  } catch (e) {
    console.error(`Calendar sync failed for ${b.code}`, e);
    await d.from("bookings").update({ calendar_sync_status: "failed" }).eq("id", b.id);
    return "failed";
  }
}

/** Meeting link for a booking: its Meet link, else the fallback from Settings. */
export async function meetingLink(d: DB, bookingId: string) {
  const [{ data: b }, { data: s }] = await Promise.all([
    d.from("bookings").select("meet_link").eq("id", bookingId).single(),
    d.from("settings").select("fallback_meeting_link").eq("id", 1).single(),
  ]);
  return b?.meet_link || s?.fallback_meeting_link || "";
}
