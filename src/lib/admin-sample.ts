// Sample data for the admin UI (Phase 1). Replaced by Lovable Cloud data in Phase 2.
export const TEAM_TZ = "Asia/Karachi";

export type Area = "Data" | "AI" | "Web";
export type BookingStatus = "confirmed" | "completed" | "no_show" | "cancelled" | "released";

export type AdminBooking = {
  id: string;
  code: string;
  name: string;
  email: string;
  company: string;
  role: string;
  country: string;
  clientTz: string;
  area: Area;
  platform: string;
  need: string;
  timeline: string;
  budget: string;
  notes: string;
  duration: 30 | 60;
  start: string; // UTC ISO
  createdAt: string;
  verified: boolean;
  ndaSigned: boolean;
  attendance: boolean;
  status: BookingStatus;
  isNew: boolean;
};

export const SAMPLE_BOOKINGS: AdminBooking[] = [
  {
    id: "b1", code: "ADS-7K2Q", name: "Megan Holloway", email: "megan.holloway@northwindlogistics.com",
    company: "Northwind Logistics", role: "Head of Data Engineering", country: "US", clientTz: "America/New_York",
    area: "Data", platform: "Databricks", need: "Migration", timeline: "1–3 months", budget: "$20k–50k",
    notes: "Moving 40+ SSIS packages and an on-prem SQL Server warehouse to a Databricks lakehouse. Want a phased plan and a cost estimate.",
    duration: 60, start: "2026-09-29T13:00:00Z", createdAt: "2026-09-26T19:42:00Z",
    verified: true, ndaSigned: true, attendance: true, status: "confirmed", isNew: true,
  },
  {
    id: "b2", code: "ADS-3M9T", name: "James Whitfield", email: "j.whitfield@harbourinsure.co.uk",
    company: "Harbour Insurance Group", role: "Director of Analytics", country: "UK", clientTz: "Europe/London",
    area: "AI", platform: "Azure", need: "RAG / chatbot on our data", timeline: "Under 1 month", budget: "$50k+",
    notes: "Claims handlers need answers from 12 years of policy documents. Azure OpenAI is approved internally; data must stay in UK South.",
    duration: 60, start: "2026-09-29T10:30:00Z", createdAt: "2026-09-26T22:05:00Z",
    verified: true, ndaSigned: false, attendance: false, status: "confirmed", isNew: true,
  },
  {
    id: "b3", code: "ADS-8PWD", name: "Omar Al Mansoori", email: "omar.mansoori@gulfretailgroup.ae",
    company: "Gulf Retail Group", role: "CTO", country: "UAE", clientTz: "Asia/Dubai",
    area: "Web", platform: "Azure", need: "AI-enabled API or integration", timeline: "1–3 months", budget: "$20k–50k",
    notes: "Customer-facing product search API with semantic ranking for 3 regional storefronts, built on ASP.NET Core.",
    duration: 60, start: "2026-09-30T11:00:00Z", createdAt: "2026-09-27T01:18:00Z",
    verified: true, ndaSigned: true, attendance: false, status: "confirmed", isNew: true,
  },
  {
    id: "b4", code: "ADS-2HVN", name: "Priya Raman", email: "priya.raman@clearpathhealth.com",
    company: "Clearpath Health", role: "Data Platform Lead", country: "US", clientTz: "America/Chicago",
    area: "Data", platform: "Snowflake", need: "Cost optimization", timeline: "3–6 months", budget: "Under $5k",
    notes: "Snowflake bill doubled this year. Looking for a quick review of warehouses and query patterns.",
    duration: 30, start: "2026-10-01T15:00:00Z", createdAt: "2026-09-26T23:40:00Z",
    verified: true, ndaSigned: false, attendance: false, status: "confirmed", isNew: true,
  },
  {
    id: "b5", code: "ADS-6RZC", name: "Sarah Kennedy", email: "s.kennedy@brightwaterenergy.co.uk",
    company: "Brightwater Energy", role: "Engineering Manager", country: "UK", clientTz: "Europe/London",
    area: "Web", platform: "Not decided", need: "Modernize existing app", timeline: "6+ months", budget: "Not sure",
    notes: "Legacy .NET Framework 4.6 customer portal. Want to understand options for moving to ASP.NET Core.",
    duration: 30, start: "2026-10-02T12:00:00Z", createdAt: "2026-09-25T14:10:00Z",
    verified: true, ndaSigned: true, attendance: true, status: "confirmed", isNew: false,
  },
  {
    id: "b6", code: "ADS-9QVB", name: "Khalid Al Harbi", email: "k.alharbi@najdfinance.sa",
    company: "Najd Finance", role: "Head of AI", country: "Saudi Arabia", clientTz: "Asia/Riyadh",
    area: "AI", platform: "AWS", need: "LLM data preparation", timeline: "1–3 months", budget: "$50k+",
    notes: "Preparing Arabic and English contract data for a Bedrock-based assistant.",
    duration: 60, start: "2026-09-24T11:00:00Z", createdAt: "2026-09-20T09:30:00Z",
    verified: true, ndaSigned: true, attendance: true, status: "completed", isNew: false,
  },
  {
    id: "b7", code: "ADS-4TLE", name: "Daniel Brooks", email: "dbrooks@summitmfg.com",
    company: "Summit Manufacturing", role: "IT Director", country: "US", clientTz: "America/Denver",
    area: "Data", platform: "Microsoft Fabric", need: "Data platform or lakehouse", timeline: "3–6 months", budget: "$5k–20k",
    notes: "Evaluating Fabric for plant sensor data and Power BI reporting.",
    duration: 60, start: "2026-09-23T16:00:00Z", createdAt: "2026-09-19T17:05:00Z",
    verified: true, ndaSigned: false, attendance: false, status: "released", isNew: false,
  },
  {
    id: "b8", code: "ADS-5JXA", name: "Aisha Rahman", email: "aisha@doharealty.qa",
    company: "Doha Realty Partners", role: "Digital Transformation Lead", country: "Qatar", clientTz: "Asia/Qatar",
    area: "AI", platform: "Snowflake", need: "Vector search", timeline: "1–3 months", budget: "$20k–50k",
    notes: "Property listing search by natural language using Snowflake Cortex.",
    duration: 60, start: "2026-10-05T10:00:00Z", createdAt: "2026-09-24T08:20:00Z",
    verified: true, ndaSigned: false, attendance: false, status: "cancelled", isNew: false,
  },
];

export type LeadStatus = "new" | "nudged" | "booked" | "cold" | "blocked";
export type AdminLead = {
  id: string; name: string; email: string; company: string; country: string;
  status: LeadStatus; source: "Form" | "LinkedIn" | "Email" | "WhatsApp";
  area: Area; verified: boolean; nudges: number; lastNudge: string | null; createdAt: string;
};

export const SAMPLE_LEADS: AdminLead[] = [
  { id: "l1", name: "Megan Holloway", email: "megan.holloway@northwindlogistics.com", company: "Northwind Logistics", country: "US", status: "booked", source: "Form", area: "Data", verified: true, nudges: 0, lastNudge: null, createdAt: "2026-09-26T19:30:00Z" },
  { id: "l2", name: "Tom Ashby", email: "tom.ashby@ledgerlinepay.co.uk", company: "Ledgerline Payments", country: "UK", status: "nudged", source: "Form", area: "AI", verified: true, nudges: 1, lastNudge: "2026-09-26T08:00:00Z", createdAt: "2026-09-25T08:00:00Z" },
  { id: "l3", name: "Fatima Al Zaabi", email: "fatima@emiratesmedtech.ae", company: "Emirates MedTech", country: "UAE", status: "new", source: "LinkedIn", area: "Web", verified: false, nudges: 0, lastNudge: null, createdAt: "2026-09-26T16:45:00Z" },
  { id: "l4", name: "Ryan Mitchell", email: "rmitchell@pinecrestbank.com", company: "Pinecrest Community Bank", country: "US", status: "nudged", source: "Email", area: "Data", verified: true, nudges: 2, lastNudge: "2026-09-26T11:00:00Z", createdAt: "2026-09-24T11:00:00Z" },
  { id: "l5", name: "Hannah Clarke", email: "hannah.clarke@oakfieldretail.co.uk", company: "Oakfield Retail", country: "UK", status: "cold", source: "Form", area: "AI", verified: true, nudges: 2, lastNudge: "2026-09-22T10:00:00Z", createdAt: "2026-09-20T10:00:00Z" },
  { id: "l6", name: "Yousef Haddad", email: "yousef@kuwaitlogix.com", company: "Kuwait Logix", country: "Kuwait", status: "new", source: "WhatsApp", area: "Data", verified: true, nudges: 0, lastNudge: null, createdAt: "2026-09-26T21:10:00Z" },
  { id: "l7", name: "Chris Evans", email: "chris@quickmail-temp.io", company: "—", country: "US", status: "blocked", source: "Form", area: "Web", verified: false, nudges: 0, lastNudge: null, createdAt: "2026-09-25T03:12:00Z" },
  { id: "l8", name: "Laura Bennett", email: "laura.bennett@vantagesaas.com", company: "Vantage SaaS", country: "US", status: "new", source: "Form", area: "Web", verified: true, nudges: 0, lastNudge: null, createdAt: "2026-09-26T23:55:00Z" },
];

export type EmailStatus = "scheduled" | "sent" | "failed" | "cancelled";
export type OutboxEmail = {
  id: string; to: string; type: string; subject: string; body: string; at: string; status: EmailStatus;
};

export const SAMPLE_OUTBOX: OutboxEmail[] = [
  { id: "e1", to: "megan.holloway@northwindlogistics.com", type: "confirmation", subject: "You're booked: Free Consultation, Tue 29 Sep",
    body: "Hi Megan,\n\nThanks for booking a free 60-minute consultation with our engineers. Your call is on Tuesday 29 September at 9:00 am (your time).\n\nMeeting link: https://meet.google.com/xyz\nReference: ADS-7K2Q\n\nTo help us prepare, you can sign our mutual NDA before the call. If you need to change the time, use the reschedule link in this email.\n\nSpeak soon,\nAdvancing Data Solutions",
    at: "2026-09-26T19:43:00Z", status: "sent" },
  { id: "e2", to: "j.whitfield@harbourinsure.co.uk", type: "nda_reminder", subject: "One step before our call: sign the NDA",
    body: "Hi James,\n\nA quick reminder that you can sign our mutual NDA before Tuesday's consultation, so you can share details about your policy documents freely.\n\nIt takes about a minute.\n\nAdvancing Data Solutions",
    at: "2026-09-27T00:05:00Z", status: "scheduled" },
  { id: "e3", to: "omar.mansoori@gulfretailgroup.ae", type: "confirmation", subject: "You're booked: Free Consultation, Wed 30 Sep",
    body: "Hi Omar,\n\nThanks for booking a free 60-minute consultation with our engineers. Your call is on Wednesday 30 September at 3:00 pm (your time).\n\nMeeting link: https://meet.google.com/xyz\nReference: ADS-8PWD\n\nAdvancing Data Solutions",
    at: "2026-09-27T01:19:00Z", status: "sent" },
  { id: "e4", to: "tom.ashby@ledgerlinepay.co.uk", type: "nudge", subject: "Still keen to talk about your GenAI project?",
    body: "Hi Tom,\n\nYou started booking a consultation with us but didn't pick a time. Our engineers have slots this week, and you can pick up where you left off with one click.\n\nAdvancing Data Solutions",
    at: "2026-09-26T08:00:00Z", status: "failed" },
  { id: "e5", to: "priya.raman@clearpathhealth.com", type: "verification_code", subject: "Your verification code",
    body: "Your Advancing Data Solutions verification code is 48•••2. It expires in 10 minutes.\n\nIf you didn't request this, you can ignore this email.",
    at: "2026-09-26T23:38:00Z", status: "sent" },
  { id: "e6", to: "s.kennedy@brightwaterenergy.co.uk", type: "reminder_24h", subject: "Tomorrow: your consultation with our engineers",
    body: "Hi Sarah,\n\nThis is a reminder that your free 30-minute consultation is tomorrow at 1:00 pm (your time). Please confirm you can still attend.\n\nAdvancing Data Solutions",
    at: "2026-10-01T12:00:00Z", status: "scheduled" },
  { id: "e7", to: "dbrooks@summitmfg.com", type: "release_notice", subject: "We've released your consultation slot",
    body: "Hi Daniel,\n\nWe didn't receive an attendance confirmation, so we've released your slot to keep our calendar fair. You're welcome to book a new time whenever suits you.\n\nAdvancing Data Solutions",
    at: "2026-09-23T10:00:00Z", status: "sent" },
  { id: "e8", to: "aisha@doharealty.qa", type: "reminder_1h", subject: "Starting in 1 hour",
    body: "Hi Aisha,\n\nYour consultation starts in one hour.\n\nAdvancing Data Solutions",
    at: "2026-10-05T09:00:00Z", status: "cancelled" },
];

export const STATS = { bookingsThisWeek: 6, ndasSigned: 4, emailsAutomated: 37, hoursSaved: 3.4 };

// Built from parts so server and browser render identical text.
export function fmtIn(iso: string, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, weekday: "short", day: "numeric", month: "short",
    hour: "numeric", minute: "2-digit", hour12: true,
  }).formatToParts(new Date(iso));
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${g("weekday")} ${g("day")} ${g("month")}, ${g("hour")}:${g("minute")} ${g("dayPeriod").toLowerCase()}`;
}

export function dayKeyIn(iso: string, tz: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

export function tzLabel(tz: string) {
  return tz.split("/").pop()!.replace(/_/g, " ");
}
