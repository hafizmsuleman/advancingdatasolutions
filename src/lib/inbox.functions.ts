import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { analyzeInquiry } from "./inbox.server";

export const analyze = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { text: string; source: string }) =>
    z.object({ text: z.string().trim().min(10).max(5000), source: z.enum(["LinkedIn", "Email", "WhatsApp", "Form"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: ok } = await context.supabase.rpc("is_admin");
    if (!ok) throw new Error("Forbidden");
    try {
      return { result: await analyzeInquiry(data.text, data.source) };
    } catch (e) {
      const status = (e as { statusCode?: number })?.statusCode;
      console.error("inbox analyze failed", e);
      if (status === 402) return { error: "AI credits have run out. Add credits in Settings → Plans & credits." };
      if (status === 429) return { error: "The AI is busy right now. Please try again in a minute." };
      return { error: "We couldn't analyze this message. Please try again." };
    }
  });
