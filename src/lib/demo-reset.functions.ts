import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
export const resetDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: allowed } = await context.supabase.rpc("is_admin");
    if (!allowed) throw new Error("Forbidden");
    // The database function verifies admin access again and performs the entire restore atomically.
    const { error } = await context.supabase.rpc("reset_demo_data" as "is_admin");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
