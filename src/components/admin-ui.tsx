import type { ReactNode } from "react";
import { CheckCircle2, Clock, XCircle, Ban, CircleDot, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { setDataView, useDataView, useDemoMode, type DataView } from "@/lib/admin-data";

type Tone = "success" | "warning" | "error" | "neutral" | "info";

const TONE: Record<Tone, string> = {
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  neutral: "border-border bg-muted text-muted-foreground",
  info: "border-primary/30 bg-primary/10 text-primary",
};
const ICON = { success: CheckCircle2, warning: AlertTriangle, error: XCircle, neutral: Ban, info: CircleDot };

export function Pill({ tone, children, icon }: { tone: Tone; children: ReactNode; icon?: typeof Clock }) {
  const Icon = icon ?? ICON[tone];
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium", TONE[tone])}>
      <Icon className="h-3 w-3" aria-hidden />
      {children}
    </span>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-border bg-card shadow-sm", className)}>{children}</div>;
}

export function PageIntro({ title, children, actions }: { title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {children && <p className="text-sm text-muted-foreground">{children}</p>}
      </div>
      {actions}
    </div>
  );
}

export const btn =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none";
export const btnPrimary =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50";
export const field =
  "h-9 rounded-lg border border-input bg-card px-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
export const th = "px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap";
export const td = "px-3 py-2 align-middle text-sm whitespace-nowrap";

export function DemoNote() {
  return (
    <p className="mt-4 text-xs text-muted-foreground">
      Sample data. Actions update this page only until the backend is connected.
    </p>
  );
}

/** "Show: Real / Demo / All" — shared across Dashboard, Bookings, Leads and Outbox. */
export function ViewFilter() {
  const v = useDataView();
  const { data: demo } = useDemoMode();
  const opts: { id: DataView; label: string }[] = [{ id: "real", label: "Real" }, { id: "demo", label: "Demo" }, { id: "all", label: "All" }];
  return (
    <div className="mb-4 flex items-center gap-2 text-xs">
      <span className="text-muted-foreground" id="view-filter-label">Show:</span>
      <div role="radiogroup" aria-labelledby="view-filter-label" className="inline-flex rounded-lg border border-border bg-card p-0.5">
        {opts.map((o) => {
          const disabled = o.id !== "real" && !demo;
          return (
            <button key={o.id} type="button" role="radio" aria-checked={v === o.id} disabled={disabled}
              title={disabled ? "Turn on Demo mode in Settings" : undefined} onClick={() => setDataView(o.id)}
              className={cn("h-7 rounded-md px-3 font-medium transition-colors disabled:opacity-40",
                v === o.id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted")}>
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Small "Demo" label for demo items when showing All. */
export function DemoTag({ show }: { show?: boolean | undefined }) {
  if (!show) return null;
  return <span className="ml-1.5 inline-flex rounded border border-warning/30 bg-warning/10 px-1.5 py-px align-middle text-[10px] font-semibold uppercase tracking-wide text-warning">Demo</span>;
}
