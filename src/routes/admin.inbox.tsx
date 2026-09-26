import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholder } from "@/components/admin-placeholder";

export const Route = createFileRoute("/admin/inbox")({
  head: () => ({
    meta: [
      { title: "Inbox — Admin — Advancing Data Solutions" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminPlaceholder
      title="Inbox"
      description="New inquiries with AI-extracted details and reply drafts will appear here."
    />
  ),
});
