import { createFileRoute } from "@tanstack/react-router";
import { runAutomations } from "@/lib/automations.server";

// Called every 5 minutes by the database scheduler with a private bearer token.
export const Route = createFileRoute("/api/public/hooks/automations")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = /^Bearer ([a-f0-9]{32,128})$/.exec(request.headers.get("authorization") ?? "")?.[1];
        if (!token) return new Response("Unauthorized", { status: 401 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: ok } = await supabaseAdmin.rpc("check_job_token", { p_name: "automations", p_token: token });
        if (!ok) return new Response("Unauthorized", { status: 401 });
        return Response.json(await runAutomations(new URL(request.url).origin));
      },
    },
  },
});
