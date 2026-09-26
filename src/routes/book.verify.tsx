import { createFileRoute, Link } from "@tanstack/react-router";

const TITLE = "Verify your email — Advancing Data Solutions";
const DESC = "Confirm your email with a 6-digit code to secure your consultation.";

export const Route = createFileRoute("/book/verify")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">Email verification is coming next</h1>
        <p className="mt-2 text-muted-foreground">Your chosen time is saved. We'll add the 6-digit code step in the next feature.</p>
        <Link to="/book/slot" className="mt-6 inline-flex min-h-11 items-center rounded-md border border-border px-6 text-sm font-medium hover:bg-muted">
          Back to times
        </Link>
      </div>
    </main>
  ),
});
