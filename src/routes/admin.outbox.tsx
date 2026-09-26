import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholder } from "@/components/admin-placeholder";

export const Route = createFileRoute("/admin/outbox")({
  head: () => ({
    meta: [
      { title: "Outbox — Admin — Advancing Data Solutions" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminPlaceholder
      title="Outbox"
      description="Every email we send, logged with delivery status, will appear here."
    />
  ),
});
