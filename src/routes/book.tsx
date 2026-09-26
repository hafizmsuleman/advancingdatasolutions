import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book a consultation — Advancing Data Solutions" },
      {
        name: "description",
        content:
          "Book a free consultation with an engineer about your AI, data, or web project.",
      },
      {
        property: "og:title",
        content: "Book a consultation — Advancing Data Solutions",
      },
      {
        property: "og:description",
        content:
          "Book a free consultation with an engineer about your AI, data, or web project.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BookPlaceholder,
});

function BookPlaceholder() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="flex max-w-md flex-col items-center gap-5">
        <h1 className="text-2xl tracking-tight text-foreground">
          Booking form coming soon
        </h1>
        <p className="text-sm text-muted-foreground">
          The booking flow is being built. In the meantime, head back to the
          home page.
        </p>
        <Link
          to="/"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
