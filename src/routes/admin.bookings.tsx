import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholder } from "@/components/admin-placeholder";

export const Route = createFileRoute("/admin/bookings")({
  head: () => ({
    meta: [
      { title: "Bookings — Admin — Advancing Data Solutions" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminPlaceholder
      title="Bookings"
      description="All consultations, with status, attendance and NDA badges, will appear here."
    />
  ),
});
