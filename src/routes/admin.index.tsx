import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholder } from "@/components/admin-placeholder";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Overnight — Admin — Advancing Data Solutions" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminPlaceholder
      title="Overnight"
      description="Overnight stats and new bookings with badges will appear here."
    />
  ),
});
