// Sample (browser-only) confirmed bookings until Lovable Cloud is connected.
export const MEETING_LINK = "https://meet.google.com/xyz";
const KEY = "ads-sample-bookings";

export type SampleBooking = {
  token: string;
  code: string;
  name: string;
  email: string;
  company: string;
  duration: 30 | 60;
  start: string; // ISO UTC
  timeZone: string;
  meetingLink: string;
  attendanceConfirmedAt?: string | undefined;
  cancelledAt?: string | undefined;
  cancelReason?: string | undefined;
  rescheduledAt?: string | undefined;
  nda?: { name: string; title: string; signedAt: string } | undefined;
};

function rand(chars: string, n: number) {
  const a = new Uint32Array(n);
  crypto.getRandomValues(a);
  return Array.from(a, (x) => chars[x % chars.length]).join("");
}

export function newToken() {
  return rand("abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789", 32);
}
export function newCode() {
  return `ADS-${rand("ABCDEFGHJKMNPQRSTUVWXYZ23456789", 4)}`;
}

function all(): Record<string, SampleBooking> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}
export function saveBooking(b: SampleBooking) {
  localStorage.setItem(KEY, JSON.stringify({ ...all(), [b.token]: b }));
}
export function getBooking(token: string): SampleBooking | null {
  return all()[token] ?? null;
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
    `UID:${b.token}@book.advancingdatasolutions.com`,
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
