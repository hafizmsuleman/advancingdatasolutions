import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { runAutomations } from "@/lib/automations.server";

export const Route = createFileRoute("/api/public/hooks/automations")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        const result = await runAutomations(new URL(request.url).origin);
        return Response.json(result);
      },
    },
  },
});
