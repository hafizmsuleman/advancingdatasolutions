import { z } from "zod";

export const AREAS = [
  { id: "data", label: "Data platform & pipelines" },
  { id: "ai", label: "AI & GenAI" },
  { id: "web", label: "Web & applications" },
] as const;
export type AreaId = (typeof AREAS)[number]["id"];

export const PLATFORMS = ["AWS", "Azure", "Microsoft Fabric", "Databricks", "Snowflake", "Not decided", "Other"] as const;

export const NEEDS: Record<AreaId, readonly string[]> = {
  data: ["Data platform or lakehouse", "ETL/pipelines", "Migration", "Cost optimization", "Governance & security"],
  ai: ["RAG / chatbot on our data", "Vector search", "LLM data preparation", "AI-readiness review"],
  web: ["New web application", "AI-enabled API or integration", "Modernize existing app", "Microservices"],
};

export const TIMELINES = ["Under 1 month", "1–3 months", "3–6 months", "6+ months", "Not sure"] as const;
export const BUDGETS = ["Under $5k", "$5k–20k", "$20k–50k", "Over $50k", "Not sure"] as const;

export const PRIVACY_URL = "/privacy";

const noLinks = (v: string) => !/(https?:\/\/|www\.)/i.test(v);

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(100, "Name must be under 100 characters."),
  email: z.string().trim().min(1, "Please enter your work email.").email("Please enter a valid email address.").max(255, "Email must be under 255 characters."),
  company: z.string().trim().min(1, "Please enter your company.").max(120, "Company must be under 120 characters."),
  role: z.string().trim().min(1, "Please enter your role.").max(100, "Role must be under 100 characters."),
});

export const projectSchema = z.object({
  area: z.enum(["data", "ai", "web"], { message: "Please choose a project area." }),
  platform: z.enum(PLATFORMS, { message: "Please choose a platform." }),
  need: z.string().min(1, "Please choose what you need."),
  timeline: z.enum(TIMELINES, { message: "Please choose a timeline." }),
  budget: z.enum(BUDGETS, { message: "Please choose a budget range." }),
  notes: z.string().trim().max(1000, "Notes must be under 1000 characters.").refine(noLinks, "Please remove links from your notes."),
  consent: z.literal(true, { message: "Please accept the privacy policy to continue." }),
});

export type BookingDraft = z.infer<typeof contactSchema> & z.infer<typeof projectSchema> & { duration?: 30 | 60; slotStart?: string | undefined; timeZone?: string | undefined; leadId?: string | undefined; leadToken?: string | undefined; bookingId?: string | undefined };

export function routeDuration(d: Pick<BookingDraft, "budget" | "timeline">): 30 | 60 {
  const bigBudget = d.budget === "$5k–20k" || d.budget === "$20k–50k" || d.budget === "Over $50k";
  const fast = d.timeline === "Under 1 month" || d.timeline === "1–3 months";
  return bigBudget || fast ? 60 : 30;
}

export const REASONS_60: Record<AreaId, string> = {
  data: "We suggest 60 minutes for enterprise data platform work.",
  ai: "We suggest 60 minutes for GenAI and RAG architecture.",
  web: "We suggest 60 minutes for application architecture.",
};
export const REASON_30 = "A focused 30-minute call fits this scope.";

const KEY = "ads-booking-draft";
export function saveDraft(d: Partial<BookingDraft>) {
  sessionStorage.setItem(KEY, JSON.stringify(d));
}
export function loadDraft(): Partial<BookingDraft> | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
