import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholder } from "@/components/admin-placeholder";

export const Route = createFileRoute("/admin/leads")({
  head: () => ({
    meta: [
      { title: "Leads — Admin — Advancing Data Solutions" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminPlaceholder
      title="Leads"
      description="Leads from the inquiry inbox, with nudge status, will appear here."
    />
  ),
});
