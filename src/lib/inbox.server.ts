// Server-only: calls Lovable AI to extract a lead brief from a pasted inquiry.
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NEEDS, PLATFORMS, BUDGETS } from "./booking-draft";

export type Extracted = {
  spam: boolean; spamReason: string;
  name: string; company: string; role: string; email: string;
  area: "data" | "ai" | "web"; platform: string; need: string;
  urgency: "low" | "medium" | "high"; budget: string; summary: string; reply: string;
};

const PROMPT = `You triage inquiries for Advancing Data Solutions, an AI, data and web engineering consultancy (Microsoft, Databricks, Snowflake partner). We offer only a free consultation (30 or 60 minutes) that ends with a written proposal.

Return ONLY a JSON object with these keys:
- spam: true if the message is spam, a sales pitch to us, recruiting, or unrelated to a potential client project; otherwise false
- spamReason: short reason if spam, else ""
- name, company, role, email: from the message, "" if not present (never invent)
- area: one of "data", "ai", "web"
- platform: one of ${JSON.stringify(PLATFORMS)} ("Not decided" if unclear)
- need: must be exactly one of the options for the chosen area: data=${JSON.stringify(NEEDS.data)}, ai=${JSON.stringify(NEEDS.ai)}, web=${JSON.stringify(NEEDS.web)}
- urgency: "low", "medium" or "high"
- budget: one of ${JSON.stringify(BUDGETS)} if a budget is mentioned, else ""
- summary: exactly 2 sentences describing who they are and what they need
- reply: a 60-90 word reply in "we" voice (say "our engineers", never individual names), greeting them by first name if known, acknowledging their specific need, inviting them to book a free consultation using the literal placeholder {{BOOKING_LINK}} on its own line, no pricing, cost or timeline promises, signed on its own final line "The Advancing Data Solutions team". Empty string if spam.`;

export async function analyzeInquiry(text: string, source: string, signal?: AbortSignal): Promise<Extracted> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured");
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    system: PROMPT,
    prompt: `Source channel: ${source}\n\nInquiry:\n${text}`,
    abortSignal: signal,
    providerOptions: {
      openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] },
    },
  });
  const raw = await result.text;
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("bad_output");
  const j = JSON.parse(m[0]) as Partial<Extracted>;
  const area = (["data", "ai", "web"] as const).includes(j.area as "data") ? j.area! : "data";
  const s = (v: unknown, max = 200) => (typeof v === "string" ? v.replace(/(https?:\/\/|www\.)\S+/gi, "").trim().slice(0, max) : "");
  return {
    spam: !!j.spam, spamReason: s(j.spamReason),
    name: s(j.name, 100), company: s(j.company, 120), role: s(j.role, 100),
    email: typeof j.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(j.email.trim()) ? j.email.trim().toLowerCase() : "",
    area,
    platform: (PLATFORMS as readonly string[]).includes(j.platform ?? "") ? j.platform! : "Not decided",
    need: NEEDS[area].includes(j.need ?? "") ? j.need! : NEEDS[area][0]!,
    urgency: (["low", "medium", "high"] as const).includes(j.urgency as "low") ? j.urgency! : "medium",
    budget: (BUDGETS as readonly string[]).includes(j.budget ?? "") ? j.budget! : "",
    summary: s(j.summary, 600),
    reply: typeof j.reply === "string" ? j.reply.trim().slice(0, 1200) : "",
  };
}
