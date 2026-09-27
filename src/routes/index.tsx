import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Database,
  Sparkles,
  Globe,
  Check,
  FileText,
  Video,
  CalendarCheck,
  ShieldCheck,
  Clock,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Book a free consultation — Advancing Data Solutions" },
      {
        name: "description",
        content:
          "Talk to an engineer about your AI, data, or web project. Book a free consultation in 2 minutes — brief and NDA sorted before the call.",
      },
      {
        property: "og:title",
        content: "Book a free consultation — Advancing Data Solutions",
      },
      {
        property: "og:description",
        content:
          "Talk to an engineer about your AI, data, or web project. Book a free consultation in 2 minutes — brief and NDA sorted before the call.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const PARTNERS = ["Microsoft", "Databricks", "Snowflake"];

const SERVICE_PILLARS = [
  {
    icon: Database,
    title: "Data platforms & pipelines",
    description:
      "Cloud data platforms on Snowflake, Databricks and Azure. Pipelines, warehousing and analytics-ready infrastructure that your team can trust.",
  },
  {
    icon: Sparkles,
    title: "AI & GenAI",
    description:
      "Retrieval-augmented generation, vector search and LLM data preparation on Bedrock, Azure OpenAI and Snowflake Cortex — AI built on clean, governed data.",
  },
  {
    icon: Globe,
    title: "Web & applications",
    description:
      "ASP.NET Core web apps, AI-enabled APIs and microservices. Secure, well-tested systems that fit the way your business runs.",
  },
];

const STEPS = [
  {
    icon: FileText,
    title: "Tell us about your project",
    description:
      "Share your project area, what you need and your timeline. It takes under 2 minutes — no account needed.",
  },
  {
    icon: ShieldCheck,
    title: "Brief and NDA before the call",
    description:
      "We review your brief and send a mutual NDA, so you can speak freely when we talk.",
  },
  {
    icon: Video,
    title: "Talk to an engineer",
    description:
      "A 30 or 60-minute call with an engineer, not a salesperson. You leave with a written proposal and clear next steps.",
  },
];

const FAQS = [
  {
    question: "Is the consultation really free?",
    answer:
      "Yes. Every consultation is free — 30 or 60 minutes — and ends with a written proposal. There are no paid sessions and no payments anywhere on this portal.",
  },
  {
    question: "Who will I speak with?",
    answer:
      "You'll speak with one of our engineers — the person who would actually work on your project — not a salesperson. We keep things technical and practical.",
  },
  {
    question: "Do I need to sign an NDA?",
    answer:
      "We send a mutual NDA before the call so you can share details freely. Signing is quick and happens through a private link after you book.",
  },
  {
    question: "What happens after the call?",
    answer:
      "We follow up with a written proposal summarising what we discussed, our recommendation and clear next steps. There's no obligation to continue.",
  },
];

function Index() {
  return (
    <main className="flex-1">
      <Hero />
      <Partners />
      <ServicePillars />
      <ConsultationCard />
      <HowItWorks />
      <FAQ />
      <CTASection />
    </main>
  );
}

function Hero() {
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto max-w-[1120px] px-6 py-20 sm:py-28">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
            Free consultation · No account needed
          </span>
          <h1 className="mt-6 text-balance text-4xl tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Talk to an engineer about your{" "}
            <span className="text-navy">AI</span>,{" "}
            <span className="text-navy">data</span> or{" "}
            <span className="text-navy">web</span> project
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            Book a free consultation in 2 minutes. Brief and NDA sorted before
            the call.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              to="/book"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Book a consultation
            </Link>
            <Link
              to="/book"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-card px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              See how it works
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Partners() {
  return (
    <section aria-label="Technology partners">
      <div className="mx-auto max-w-[1120px] px-6 py-10">
        <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Microsoft · Databricks · Snowflake partner
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {PARTNERS.map((partner) => (
            <span
              key={partner}
              className="text-lg font-semibold tracking-tight text-muted-foreground"
            >
              {partner}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServicePillars() {
  return (
    <section aria-labelledby="services-heading" className="border-t border-border">
      <div className="mx-auto max-w-[1120px] px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="services-heading"
            className="text-2xl tracking-tight text-foreground sm:text-3xl"
          >
            What we do
          </h2>
          <p className="mt-3 text-muted-foreground">
            AI, data and web engineering for teams that need it done properly.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="flex flex-col rounded-lg border border-border bg-card p-6 shadow-card"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-foreground">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ConsultationCard() {
  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-[1120px] px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-8 shadow-card sm:p-10">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <CalendarCheck className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-2xl tracking-tight text-foreground">
                Free Consultation
              </h2>
              <p className="mt-2 text-muted-foreground">
                A focused conversation with an engineer about your project —
                30 or 60 minutes, always free, ending with a written proposal.
              </p>
            </div>
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "30 or 60 minutes, always free",
              "Ends with a written proposal",
              "Engineer, not a salesperson",
              "Mutual NDA sorted before the call",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-success"
                  aria-hidden
                />
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/book"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Book a consultation
            </Link>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" aria-hidden />
              Takes about 2 minutes
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section
      aria-labelledby="how-heading"
      className="border-t border-border bg-card"
    >
      <div className="mx-auto max-w-[1120px] px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="how-heading"
            className="text-2xl tracking-tight text-foreground sm:text-3xl"
          >
            How it works
          </h2>
          <p className="mt-3 text-muted-foreground">
            Three simple steps from idea to conversation.
          </p>
        </div>
        <ol className="mt-12 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="relative flex flex-col rounded-lg border border-border bg-card p-6 shadow-card"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="mt-4 text-xs font-semibold uppercase tracking-wide text-primary tnums">
                  Step {index + 1}
                </span>
                <h3 className="mt-1 text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function FAQ() {
  return (
    <section aria-labelledby="faq-heading" className="border-t border-border">
      <div className="mx-auto max-w-[860px] px-6 py-16 sm:py-20">
        <div className="text-center">
          <h2
            id="faq-heading"
            className="text-2xl tracking-tight text-foreground sm:text-3xl"
          >
            Frequently asked questions
          </h2>
        </div>
        <div className="mt-10 divide-y divide-border border-y border-border">
          {FAQS.map((faq) => (
            <FAQItem key={faq.question} {...faq} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-base font-medium text-foreground">
          {question}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>
      {open && (
        <p className="pb-5 text-sm text-muted-foreground">{answer}</p>
      )}
    </div>
  );
}

function CTASection() {
  return (
    <section className="border-t border-border bg-navy">
      <div className="mx-auto max-w-[1120px] px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl tracking-tight text-card sm:text-3xl">
            Ready to talk to an engineer?
          </h2>
          <p className="mt-3 text-card/80">
            Book your free consultation in 2 minutes. We'll handle the brief and
            NDA so you can focus on the conversation.
          </p>
          <div className="mt-8">
            <Link
              to="/book"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-card px-6 text-sm font-medium text-navy transition-colors hover:bg-background"
            >
              Book a consultation
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
