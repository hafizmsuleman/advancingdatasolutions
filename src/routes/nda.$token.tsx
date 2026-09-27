import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { z } from "zod";

import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import { fetchBooking, type SampleBooking } from "@/lib/sample-bookings";
import { supabase } from "@/integrations/supabase/client";
import { refreshSignedNdaCalendar } from "@/lib/booking.functions";

const TITLE = "Mutual NDA — Advancing Data Solutions";
const DESC = "Review and sign our mutual non-disclosure agreement before your consultation.";

export const Route = createFileRoute("/nda/$token")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NdaPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Please type your full name.").max(100, "Name must be under 100 characters."),
  title: z.string().trim().min(2, "Please enter your job title.").max(100, "Job title must be under 100 characters."),
  agree: z.boolean().refine((v) => v, "Please confirm you agree on behalf of your company."),
});

function NdaPage() {
  const { token } = Route.useParams();
  const [b, setB] = useState<SampleBooking | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchBooking(token).then((bk) => {
      setB(bk);
      if (bk) setName(bk.name);
    });
  }, [token]);

  if (b === undefined) return <main className="flex-1" />;
  if (!b) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">We couldn't find this booking</h1>
          <p className="mt-2 text-muted-foreground">The link may be incomplete. Check your confirmation email, or contact us at contact@advancingdatasolutions.com.</p>
        </div>
      </main>
    );
  }

  const company = b.company || "the Client";

  async function sign(e: React.FormEvent) {
    e.preventDefault();
    const r = schema.safeParse({ name, title, agree });
    if (!r.success) {
      const errs: Record<string, string> = {};
      for (const i of r.error.issues) errs[String(i.path[0])] ??= i.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    const { error } = await supabase.rpc("sign_nda", { p_token: token, p_name: r.data.name, p_title: r.data.title });
    if (error) { setErrors({ agree: "We couldn't save your signature. Please try again." }); return; }
    await refreshSignedNdaCalendar({ data: { token } }).catch(() => null);
    const nb = await fetchBooking(token);
    if (nb) setB(nb);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const signedAt = b.nda
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeStyle: "short" }).format(Date.parse(b.nda.signedAt))
    : "";

  return (
    <main className="flex-1 px-4 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-[720px]">
        {b.nda && (
          <div className="step-transition mb-6 rounded-xl border border-success/30 bg-card p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-success" aria-hidden />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-semibold tracking-tight">NDA signed</h1>
                  <StatusBadge kind="nda-signed" />
                </div>
                <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-[120px_1fr]">
                  <dt className="text-muted-foreground">Signed by</dt><dd className="font-medium">{b.nda.name}</dd>
                  <dt className="text-muted-foreground">Job title</dt><dd className="font-medium">{b.nda.title}</dd>
                  <dt className="text-muted-foreground">On behalf of</dt><dd className="font-medium">{company}</dd>
                  <dt className="text-muted-foreground">Date and time</dt><dd className="font-medium tnums">{signedAt}</dd>
                </dl>
                <Link to="/booked/$token" params={{ token }} className="mt-4 inline-flex min-h-11 items-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
                  Back to your booking
                </Link>
              </div>
            </div>
          </div>
        )}

        <article className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Template – to be reviewed by legal counsel
          </p>
          {b.nda ? (
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">Mutual Non-Disclosure Agreement</h2>
          ) : (
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">Mutual Non-Disclosure Agreement</h1>
          )}
          <p className="mt-3 text-muted-foreground">
            This agreement is between <strong className="font-medium text-foreground">Advancing Data Solutions LLC</strong>, St. Petersburg, Florida (“ADS”), and <strong className="font-medium text-foreground">{company}</strong> (“the Client”). Each is a “party”.
          </p>

          <ol className="mt-6 list-decimal space-y-4 pl-5 text-[15px] leading-relaxed text-muted-foreground marker:font-semibold marker:text-foreground">
            <li><strong className="font-semibold text-foreground">Purpose.</strong> The parties want to discuss a potential AI, data or web engineering project. This agreement protects information either party shares for that purpose.</li>
            <li><strong className="font-semibold text-foreground">Confidential information.</strong> Any non-public information shared by either party, in any form, including business plans, data, system designs, source code, pricing, customer details and technical documents, whether or not it is marked “confidential”.</li>
            <li><strong className="font-semibold text-foreground">Obligations of both parties.</strong> Each party will use the other’s confidential information only for the purpose above, keep it secure with at least reasonable care, share it only with employees or advisers who need it and are bound by similar duties, and return or delete it on request.</li>
            <li><strong className="font-semibold text-foreground">Exclusions.</strong> These duties do not apply to information that is or becomes public through no fault of the receiving party, was already known to it, is received lawfully from someone else without restriction, or is developed independently. A party may disclose information when required by law, after giving the other party prompt notice where allowed.</li>
            <li><strong className="font-semibold text-foreground">Term.</strong> This agreement lasts 2 years from the date it is signed. Duties for information shared during that time continue for 2 years after it ends.</li>
            <li><strong className="font-semibold text-foreground">No obligation to proceed.</strong> Signing this agreement does not commit either party to any project, purchase or further agreement. No licence or ownership rights are granted.</li>
            <li><strong className="font-semibold text-foreground">Governing law.</strong> This agreement is governed by the laws of the State of Florida, USA.</li>
          </ol>

          {!b.nda && (
            <form onSubmit={sign} noValidate className="mt-10 border-t border-border pt-8">
              <h2 className="text-lg font-semibold tracking-tight">Sign on behalf of {company}</h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field id="nda-name" label="Full name" value={name} onChange={setName} error={errors["name"]} autoComplete="name" />
                <Field id="nda-title" label="Job title" value={title} onChange={setTitle} error={errors["title"]} autoComplete="organization-title" />
              </div>
              <label className="mt-5 flex min-h-11 cursor-pointer items-start gap-3 text-sm">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} aria-invalid={!!errors["agree"]} aria-describedby={errors["agree"] ? "agree-err" : undefined}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--primary)]" />
                <span>I agree to this NDA on behalf of {company}</span>
              </label>
              {errors["agree"] && <p id="agree-err" className="mt-1 text-sm text-destructive">{errors["agree"]}</p>}
              <button type="submit" className="mt-6 min-h-11 w-full rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-hover sm:w-auto">
                Sign NDA
              </button>
              <p className="mt-4 text-xs text-muted-foreground">Typing your name and ticking the box counts as your signature. We’ll keep a copy with your booking.</p>
            </form>
          )}
        </article>
      </div>
    </main>
  );
}

function Field(props: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string | undefined; autoComplete: string }) {
  const { id, label, value, onChange, error, autoComplete } = props;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      <input id={id} value={value} maxLength={100} autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined}
        className={cn("min-h-11 w-full rounded-md border bg-card px-3 text-base", error ? "border-destructive" : "border-input")} />
      {error && <p id={`${id}-err`} className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
