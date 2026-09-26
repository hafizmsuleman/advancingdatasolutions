// Public booking view model, loaded only through the token-based get_public_booking function.
import { supabase } from "@/integrations/supabase/client";

export type SampleBooking = {
  token: string;
  code: string;
  name: string;
  company: string;
  duration: 30 | 60;
  start: string; // ISO UTC
  timeZone: string;
  meetingLink: string;
  status: string;
  attendanceConfirmedAt?: string | undefined;
  cancelledAt?: string | undefined;
  nda?: { name: string; title: string; signedAt: string } | undefined;
};

export async function fetchBooking(token: string): Promise<SampleBooking | null> {
  const { data, error } = await supabase.rpc("get_public_booking", { p_token: token });
  const r = data?.[0];
  if (error || !r) return null;
  const inactive = r.status === "cancelled" || r.status === "released";
  return {
    token: r.manage_token,
    code: r.code,
    name: r.full_name ?? "",
    company: r.company ?? "",
    duration: r.length_min as 30 | 60,
    start: r.start_utc,
    timeZone: r.client_tz,
    meetingLink: r.meet_link ?? "",
    status: r.status,
    attendanceConfirmedAt: r.attendance_confirmed_at ?? undefined,
    cancelledAt: inactive ? r.start_utc : undefined,
    nda: r.nda_signed ? { name: r.nda_signer_name ?? "", title: r.nda_signer_title ?? "", signedAt: r.nda_signed_at ?? "" } : undefined,
  };
}

function icsDate(ms: number) {
  return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
export function buildIcs(b: SampleBooking) {
  const s = Date.parse(b.start);
  const e = s + b.duration * 60000;
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Advancing Data Solutions//Booking//EN", "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${b.code}@book.advancingdatasolutions.com`,
    `DTSTAMP:${icsDate(Date.now())}`,
    `DTSTART:${icsDate(s)}`,
    `DTEND:${icsDate(e)}`,
    `SUMMARY:Free consultation with Advancing Data Solutions (${b.duration} min)`,
    `DESCRIPTION:Booking ${b.code}. Join: ${b.meetingLink}`,
    `LOCATION:${b.meetingLink}`,
    `URL:${b.meetingLink}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}
