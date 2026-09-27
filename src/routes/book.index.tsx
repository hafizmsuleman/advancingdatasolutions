import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { submitLead } from "@/lib/booking.functions";
import { BUDGET_LABEL, NEED_LABEL, PLATFORM_LABEL } from "@/lib/enums";

import { BookingProgress } from "@/components/booking-progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  AREAS, BUDGETS, NEEDS, PLATFORMS, PRIVACY_URL, TIMELINES,
  contactSchema, loadDraft, projectSchema, routeDuration, saveDraft,
  type AreaId, type BookingDraft,
} from "@/lib/booking-draft";

const TITLE = "Book a free consultation — Advancing Data Solutions";
const DESC = "Tell us about your AI, data or web project in two short steps and book a free call with our engineers.";

export const Route = createFileRoute("/book/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: "https://advancingdatasolutions.lovable.app/book" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => (typeof s["t"] === "string" && s["t"].length <= 64 ? { t: s["t"] } : {}) as { t?: string },
  component: BookPage,
});

const STEPS = [{ label: "About you" }, { label: "Your project" }, { label: "Session" }, { label: "Time" }, { label: "Verify" }];

type Form = Omit<Partial<BookingDraft>, "consent"> & { consent: boolean };
type Errors = Partial<Record<keyof BookingDraft, string>>;

function BookPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>({ name: "", email: "", company: "", role: "", notes: "", need: "", consent: false });
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState("");
  const { t } = Route.useSearch();

  useEffect(() => {
    const d = loadDraft();
    if (d) setForm((f) => ({ ...f, ...d, consent: false }));
    if (!t) return;
    supabase.rpc("get_lead_prefill", { p_booking_token: t }).then(({ data }) => {
      const l = data?.[0];
      if (!l) return;
      setForm((f) => ({
        ...f,
        leadToken: t,
        name: l.full_name ?? f.name, email: l.email ?? f.email, company: l.company ?? f.company, role: l.role ?? f.role,
        ...(l.project_area ? { area: l.project_area } : {}),
        ...(l.platform ? { platform: PLATFORM_LABEL[l.platform] as BookingDraft["platform"] } : {}),
        ...(l.need ? { need: NEED_LABEL[l.need] } : {}),
        ...(l.budget_range ? { budget: BUDGET_LABEL[l.budget_range] as BookingDraft["budget"] } : {}),
      }));
    });
  }, [t]);

  function set<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function collect(result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) {
    const e: Errors = {};
    result.error?.issues.forEach((i) => {
      const k = i.path[0] as keyof BookingDraft;
      if (!e[k]) e[k] = i.message;
    });
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) document.getElementById(`f-${first}`)?.focus();
  }

  function next() {
    const r = contactSchema.safeParse(form);
    if (!r.success) return collect(r);
    setStep(1);
    window.scrollTo({ top: 0 });
  }

  async function submit() {
    const r = projectSchema.safeParse(form);
    if (!r.success) return collect(r);
    if (sending) return;
    const data = { ...contactSchema.parse(form), ...r.data };
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    setSending(true);
    setServerError("");
    const res = await submitLead({ data: { ...data, timeZone, ...(form.leadToken ? { leadToken: form.leadToken } : {}) } })
      .catch(() => ({ error: "server" as const }));
    setSending(false);
    if ("error" in res) {
      setServerError(
        res.error === "disposable" ? "Please use your work email."
        : res.error === "blocked" ? "We're unable to accept a booking from this address. If you think this is a mistake, email us at contact@advancingdatasolutions.com."
        : res.error === "rate_limited" ? "Too many attempts today. Please try again tomorrow or email contact@advancingdatasolutions.com."
        : "Something went wrong on our end. Please try again.",
      );
      return;
    }
    saveDraft({ ...data, duration: routeDuration(data), leadId: res.leadId, leadToken: form.leadToken });
    navigate({ to: "/book/session" });
  }

  const area = form.area as AreaId | undefined;

  return (
    <main className="flex-1 px-4 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-[640px]">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Book a free consultation</h1>
          <p className="mt-2 text-muted-foreground">Two short steps so our engineers come prepared.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <BookingProgress steps={STEPS} currentStep={step} />
          <form
            noValidate
            className="step-transition mt-8 space-y-6"
            key={step}
            onSubmit={(e) => { e.preventDefault(); step === 0 ? next() : submit(); }}
          >
            {step === 0 ? (
              <>
                <h2 className="text-lg font-semibold tracking-tight">About you</h2>
                <TextField id="name" label="Full name" autoComplete="name" value={form.name} error={errors.name} onChange={(v) => set("name", v)} />
                <TextField id="email" label="Work email" type="email" autoComplete="email" value={form.email} error={errors.email} onChange={(v) => set("email", v)} />
                <TextField id="company" label="Company" autoComplete="organization" value={form.company} error={errors.company} onChange={(v) => set("company", v)} />
                <TextField id="role" label="Role" autoComplete="organization-title" value={form.role} error={errors.role} onChange={(v) => set("role", v)} />
                <PrimaryButton>Continue</PrimaryButton>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold tracking-tight">Your project</h2>
                <Choice id="area" legend="Project area" options={AREAS.map((a) => ({ value: a.id, label: a.label }))} value={form.area} error={errors.area}
                  onChange={(v) => { set("area", v as AreaId); set("need", ""); }} cols="sm:grid-cols-3" />
                <Choice id="platform" legend="Platform" options={PLATFORMS.map((p) => ({ value: p, label: p }))} value={form.platform} error={errors.platform}
                  onChange={(v) => set("platform", v as Form["platform"])} />
                {area ? (
                  <Choice id="need" legend="What do you need?" options={NEEDS[area].map((n) => ({ value: n, label: n }))} value={form.need} error={errors.need}
                    onChange={(v) => set("need", v)} />
                ) : (
                  <p className="text-sm text-muted-foreground" id="f-need" tabIndex={-1}>
                    Choose a project area to see matching needs.
                    {errors.need && <span className="mt-1 block text-destructive">{errors.need}</span>}
                  </p>
                )}
                <Choice id="timeline" legend="Timeline" options={TIMELINES.map((t) => ({ value: t, label: t }))} value={form.timeline} error={errors.timeline}
                  onChange={(v) => set("timeline", v as Form["timeline"])} />
                <Choice id="budget" legend="Budget range" options={BUDGETS.map((b) => ({ value: b, label: b }))} value={form.budget} error={errors.budget}
                  onChange={(v) => set("budget", v as Form["budget"])} />
                <div className="space-y-2">
                  <Label htmlFor="f-notes">Notes <span className="font-normal text-muted-foreground">(optional)</span></Label>
                  <Textarea id="f-notes" rows={4} maxLength={1000} value={form.notes} onChange={(e) => set("notes", e.target.value)}
                    placeholder="Anything our engineers should know before the call" aria-invalid={!!errors.notes} aria-describedby={errors.notes ? "e-notes" : undefined} />
                  <FieldError id="notes" msg={errors.notes} />
                </div>
                <div className="space-y-2">
                  <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-muted-foreground">
                    <input id="f-consent" type="checkbox" className="mt-1 h-4 w-4 accent-[var(--color-primary)]" checked={form.consent}
                      onChange={(e) => set("consent", e.target.checked)} aria-invalid={!!errors.consent} aria-describedby={errors.consent ? "e-consent" : undefined} />
                    <span>
                      I agree that Advancing Data Solutions may use these details to arrange my consultation, as described in our{" "}
                      <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-2">privacy policy</a>.
                    </span>
                  </label>
                  <FieldError id="consent" msg={errors.consent} />
                </div>
                {serverError && <p role="alert" className="text-sm text-destructive">{serverError}</p>}
                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <button type="button" onClick={() => setStep(0)} className="min-h-11 rounded-md border border-border px-6 text-sm font-medium hover:bg-muted">Back</button>
                  <PrimaryButton>{sending ? "Saving…" : "See my session"}</PrimaryButton>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}

function FieldError({ id, msg }: { id: string; msg?: string | undefined }) {
  if (!msg) return null;
  return <p id={`e-${id}`} role="alert" className="text-sm text-destructive">{msg}</p>;
}

function PrimaryButton({ children }: { children: React.ReactNode }) {
  return (
    <button type="submit" className="min-h-11 w-full flex-1 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover">
      {children}
    </button>
  );
}

function TextField(p: { id: string; label: string; value?: string | undefined; error?: string | undefined; type?: string; autoComplete?: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`f-${p.id}`}>{p.label}</Label>
      <Input id={`f-${p.id}`} type={p.type ?? "text"} autoComplete={p.autoComplete} value={p.value ?? ""} className="h-11"
        onChange={(e) => p.onChange(e.target.value)} aria-invalid={!!p.error} aria-describedby={p.error ? `e-${p.id}` : undefined} />
      <FieldError id={p.id} msg={p.error} />
    </div>
  );
}

function Choice(p: { id: string; legend: string; options: { value: string; label: string }[]; value?: string | undefined; error?: string | undefined; cols?: string; onChange: (v: string) => void }) {
  return (
    <fieldset className="space-y-2" aria-describedby={p.error ? `e-${p.id}` : undefined}>
      <legend className="mb-2 text-sm font-medium">{p.legend}</legend>
      <div className={cn("grid grid-cols-1 gap-2 sm:grid-cols-2", p.cols)}>
        {p.options.map((o, i) => {
          const checked = p.value === o.value;
          return (
            <label key={o.value} className={cn(
              "flex min-h-11 cursor-pointer items-center rounded-md border px-4 py-2 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
              checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50",
            )}>
              <input type="radio" name={p.id} id={i === 0 ? `f-${p.id}` : undefined} value={o.value} checked={checked}
                onChange={() => p.onChange(o.value)} className="sr-only" />
              {o.label}
            </label>
          );
        })}
      </div>
      <FieldError id={p.id} msg={p.error} />
    </fieldset>
  );
}
