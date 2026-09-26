import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/nda/$token")({
  head: () => ({
    meta: [
      { title: "Nda — Advancing Data Solutions" },
      { name: "description", content: "Manage your consultation with Advancing Data Solutions." },
      { property: "og:title", content: "Nda — Advancing Data Solutions" },
      { property: "og:description", content: "Manage your consultation with Advancing Data Solutions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Placeholder,
});

function Placeholder() {
  const { token } = Route.useParams();
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">This page is coming soon</h1>
        <p className="mt-2 text-muted-foreground">We're still building this step.</p>
        <Link to="/booked/$token" params={{ token }} className="mt-6 inline-flex min-h-11 items-center rounded-md border border-border px-6 text-sm font-medium hover:bg-muted">Back to your booking</Link>
      </div>
    </main>
  );
}
