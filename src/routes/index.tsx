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
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="flex max-w-4xl flex-col items-center gap-8">
        <h1 className="text-balance text-4xl tracking-tight text-foreground sm:text-5xl md:text-6xl">
          Talk to an engineer about your{" "}
          <span className="text-navy">AI</span>, <span className="text-navy">data</span> or{" "}
          <span className="text-navy">web</span> project
        </h1>
        <p className="text-base text-muted-foreground sm:text-lg">
          This is a placeholder page — booking functionality is coming soon.
        </p>
      </div>
    </main>
  );
}
