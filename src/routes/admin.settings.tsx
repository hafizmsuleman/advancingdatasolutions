import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholder } from "@/components/admin-placeholder";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Admin — Advancing Data Solutions" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminPlaceholder
      title="Settings"
      description="Availability, limits, the meeting link, blocked senders and demo mode will be managed here."
    />
  ),
});
