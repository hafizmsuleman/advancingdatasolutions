import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Mail } from "lucide-react";

import { BookingProgress } from "@/components/booking-progress";
import { cn } from "@/lib/utils";
import { loadDraft, saveDraft, type BookingDraft } from "@/lib/booking-draft";
import { resendCode, verifyCode } from "@/lib/booking.functions";

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
  component: VerifyPage,
});

const STEPS = [{ label: "About you" }, { label: "Your project" }, { label: "Session" }, { label: "Time" }, { label: "Verify" }];
const EXPIRY_S = 600;
const RESEND_S = 60;
const MAX_ATTEMPTS = 5;
const MAX_RESENDS = 3;

type Err = null | "wrong_code" | "expired" | "too_many_attempts" | "slot_taken" | "email_has_active_booking" | "server";

function VerifyPage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Partial<BookingDraft> | null | undefined>(undefined);
  const [code, setCode] = useState("");
  const [sentAt, setSentAt] = useState(0);
  const [now, setNow] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [resends, setResends] = useState(0);
  const [error, setError] = useState<Err>(null);
  const [notice, setNotice] = useState("");
  const [limitMsg, setLimitMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(loadDraft());
    const t = Date.now();
    setSentAt(t);
    setNow(t);
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = sentAt ? Math.floor((now - sentAt) / 1000) : 0;
  const remaining = Math.max(0, EXPIRY_S - elapsed);
  const expired = sentAt > 0 && remaining === 0;
  const locked = attempts >= MAX_ATTEMPTS || error === "slot_taken";
  const resendIn = Math.max(0, RESEND_S - elapsed);

  useEffect(() => {
    if (expired && error !== "too_many_attempts") setError("expired");
  }, [expired, error]);

  if (draft === undefined) return <main className="flex-1" />;
  if (!draft?.email || !draft.slotStart || !draft.bookingId) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">Let's pick a time first</h1>
          <p className="mt-2 text-muted-foreground">Choose a time for your consultation, then we'll send your code.</p>
          <Link to="/book" className="mt-6 inline-flex min-h-11 items-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">Start booking</Link>
        </div>
      </main>
    );
  }

  async function submit(value: string) {
    if (busy || locked || expired || value.length !== 6) return;
    setBusy(true);
    setNotice("");
    const r = await verifyCode({ data: { bookingId: draft!.bookingId!, code: value } }).catch(() => ({ result: "server" as const }));
    setBusy(false);
    if (r.result === "confirmed" && "token" in r && r.token) {
      saveDraft({ ...draft, slotStart: undefined, bookingId: undefined });
      navigate({ to: "/booked/$token", params: { token: r.token } });
      return;
    }
    if (r.result === "slot_taken") {
      setError("slot_taken");
      saveDraft({ ...draft, slotStart: undefined, bookingId: undefined });
      setTimeout(() => navigate({ to: "/book/slot" }), 2500);
      return;
    }
    if (r.result === "wrong_code") {
      const left = "attemptsLeft" in r && typeof r.attemptsLeft === "number" ? r.attemptsLeft : MAX_ATTEMPTS - attempts - 1;
      setAttempts(MAX_ATTEMPTS - left);
      setError("wrong_code");
      setCode("");
      inputRef.current?.focus();
      return;
    }
    if (r.result === "too_many_attempts") setAttempts(MAX_ATTEMPTS);
    setError(r.result as Err);
    setCode("");
  }

  function onChange(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    if (error === "wrong_code") setError(null);
    if (digits.length === 6) submit(digits);
  }

  function toastLimit(e: "rate_limited" | "too_soon" | "max_resends") {
    setLimitMsg(e === "too_soon" ? "Please wait a minute before asking for another code."
      : e === "max_resends" ? "You've reached the maximum number of new codes. Please start again or email contact@advancingdatasolutions.com."
      : "We've sent a lot of codes recently. Please try again in an hour.");
  }

  async function resend() {
    if (resendIn > 0 || resends >= MAX_RESENDS || error === "slot_taken") return;
    const r = await resendCode({ data: { bookingId: draft!.bookingId! } }).catch(() => ({ error: "server" as const }));
    if ("error" in r) {
      if (r.error === "rate_limited" || r.error === "too_soon" || r.error === "max_resends") {
        setError(null);
        setNotice("");
        toastLimit(r.error);
        return;
      }
      setNotice("");
      setError(r.error === "expired" ? "expired" : "server");
      return;
    }
    const t = Date.now();
    setResends(resends + 1);
    setSentAt(t);
    setNow(t);
    setAttempts(0);
    setError(null);
    setCode("");
    setNotice(`We sent a new code to ${draft!.email}.`);
    inputRef.current?.focus();
  }

  const messages: Record<Exclude<Err, null>, string> = {
    wrong_code: `That code isn't right. ${MAX_ATTEMPTS - attempts} ${MAX_ATTEMPTS - attempts === 1 ? "attempt" : "attempts"} left.`,
    expired: "This code has expired. Please request a new one.",
    too_many_attempts: "Too many incorrect attempts. Please request a new code.",
    slot_taken: "That time was just booked by someone else. Please choose another slot.",
    email_has_active_booking: "Your email is verified, but it already has an upcoming consultation. Use the links in your confirmation email to manage it.",
    server: "Something went wrong on our end. Please try again in a moment.",
  };
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const canResend = resendIn === 0 && resends < MAX_RESENDS && error !== "slot_taken";

  return (
    <main className="flex-1 px-4 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-[640px]">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Check your email</h1>
          <p className="mt-2 text-muted-foreground">One last step to confirm your consultation.</p>
        </div>
        <div className="step-transition rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <BookingProgress steps={STEPS} currentStep={4} />

          <div className="mt-8 flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <p>We sent a 6-digit code to <strong className="font-medium break-all">{draft.email}</strong></p>
          </div>

          <label htmlFor="code" className="mt-6 block text-sm font-medium">Verification code</label>
          <div className="relative mt-2 flex max-w-sm gap-2" onClick={() => inputRef.current?.focus()}>
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} aria-hidden="true" className={cn("flex h-14 min-w-0 flex-1 items-center justify-center rounded-md border bg-card text-2xl font-semibold tnums", error ? "border-destructive" : "border-input", code.length === i && !busy && "ring-1 ring-ring")}>
                {code[i] ?? ""}
              </span>
            ))}
            <input id="code" ref={inputRef} autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6}
              value={code} onChange={(e) => onChange(e.target.value)} disabled={busy || locked || expired}
              aria-invalid={!!error} aria-describedby="code-status"
              className="absolute inset-0 h-full w-full cursor-text opacity-0" />
          </div>

          <div id="code-status" aria-live="polite" className="mt-3 min-h-6 text-sm">
            {busy && <span className="text-muted-foreground">Checking…</span>}
            {!busy && error && (
              <span className={cn("flex items-start gap-2", error === "slot_taken" ? "text-warning" : "text-destructive")}>
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {messages[error]}
              </span>
            )}
            {!busy && !error && notice && <span className="text-success">{notice}</span>}
            {!busy && !error && !notice && limitMsg && <span role="alert" className="text-warning">{limitMsg}</span>}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <span className="tnums">{expired ? "Code expired" : <>Code expires in <strong className="font-medium text-foreground">{mm}:{ss}</strong></>}</span>
            <button type="button" onClick={resend} disabled={!canResend}
              className="min-h-11 font-medium text-primary underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline tnums">
              {resends >= MAX_RESENDS ? "No more resends" : resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
            </button>
          </div>

          {error === "slot_taken" ? (
            <Link to="/book/slot" className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">Choose another time</Link>
          ) : (
            <button type="button" onClick={() => submit(code)} disabled={code.length !== 6 || busy || locked || expired}
              className="mt-6 min-h-11 w-full rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60">
              Confirm booking
            </button>
          )}

          <div className="mt-6 flex flex-wrap justify-between gap-3 text-sm">
            <Link to="/book" className="font-medium text-primary underline-offset-4 hover:underline">Change email</Link>
            <Link to="/book/slot" className="text-muted-foreground underline-offset-4 hover:underline">Back to times</Link>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">Can't find it? Check your spam folder. The code is valid for 10 minutes.</p>
        </div>
      </div>
    </main>
  );
}
