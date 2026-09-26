import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Advancing Data Solutions — Book a call with an engineer" },
      {
        name: "description",
        content:
          "Talk to an engineer about your AI, data, or web project. Book a call with Advancing Data Solutions.",
      },
      {
        property: "og:title",
        content: "Advancing Data Solutions — Book a call with an engineer",
      },
      {
        property: "og:description",
        content:
          "Talk to an engineer about your AI, data, or web project. Book a call with Advancing Data Solutions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_60rem_at_50%_-20%,var(--accent),transparent)] opacity-70"
      />
      <div className="relative z-10 flex max-w-4xl flex-col items-center gap-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-sm">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Advancing Data Solutions Booking Portal
        </span>
        <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
          Talk to an engineer about your{" "}
          <span className="text-primary">AI</span>,{" "}
          <span className="text-primary">data</span> or{" "}
          <span className="text-primary">web</span> project
        </h1>
        <p className="text-base text-muted-foreground sm:text-lg">
          This is a placeholder page — booking functionality is coming soon.
        </p>
      </div>
    </main>
  );
}
