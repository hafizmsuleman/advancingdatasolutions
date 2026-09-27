import { createServerFn } from "@tanstack/react-start";
import { SITE_URL } from "@/lib/site";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runAutomations } from "./automations.server";

export const runAutomationsNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: ok } = await context.supabase.rpc("is_admin");
    if (!ok) throw new Error("Forbidden");
    return runAutomations(SITE_URL);
  });
