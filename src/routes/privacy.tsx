import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

const TITLE = "Privacy — Advancing Data Solutions";
const DESC = "What we collect when you book a consultation, how we use it, and how to ask us to delete it.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: "https://advancingdatasolutions.lovable.app/privacy" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://advancingdatasolutions.lovable.app/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="flex-1 px-4 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-[640px]">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Privacy</h1>
        <p className="mt-3 text-muted-foreground">Plain-language summary. Last updated September 2026.</p>

        <div className="mt-8 space-y-8 text-[16px] leading-relaxed text-foreground">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight">What we collect</h2>
            <p className="text-muted-foreground">
              When you book a consultation, we ask for your full name, work email, company, role, project area,
              platform, what you need, timeline, budget range, and any notes you choose to add. We also record
              the time slot you select and the verification code used to confirm your email.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight">How we use it</h2>
            <p className="text-muted-foreground">
              We use these details only to prepare for the consultation and to follow up afterward — for example,
              matching you with the right engineer, sending reminders, and sharing a written proposal. We never sell
              your data, and we do not share it with third parties for marketing.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight">How long we keep it</h2>
            <p className="text-muted-foreground">
              If you start a booking but never confirm your email, we delete that request within 24 hours. If we
              have not heard from you after a consultation inquiry, we treat the lead as inactive and remove it
              after 12 months. Confirmed bookings are kept for as long as needed to deliver and follow up on the
              consultation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight">Your choices</h2>
            <p className="text-muted-foreground">
              You can ask us to delete your details at any time by emailing{" "}
              <a
                href="mailto:contact@advancingdatasolutions.com"
                className="font-medium text-primary underline underline-offset-2"
              >
                contact@advancingdatasolutions.com
              </a>
              . We will remove your data and confirm by reply.
            </p>
          </section>
        </div>

        <div className="mt-10">
          <Link
            to="/book"
            className="inline-flex min-h-11 items-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Book a consultation
          </Link>
        </div>
      </div>
    </main>
  );
}
