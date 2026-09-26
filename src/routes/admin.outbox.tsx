import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { RotateCw, Clock, CheckCircle2, XCircle, Ban } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Panel, Pill, PageIntro, DemoNote, btn } from "@/components/admin-ui";
import { SAMPLE_OUTBOX, TEAM_TZ, fmtIn, type EmailStatus, type OutboxEmail } from "@/lib/admin-sample";

export const Route = createFileRoute("/admin/outbox")({
  head: () => ({
    meta: [
      { title: "Outbox — Admin — Advancing Data Solutions" },
      { name: "description", content: "Automated emails: scheduled, sent and failed." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Outbox,
});

const STATUS: Record<EmailStatus, { label: string; tone: "success" | "info" | "error" | "neutral"; icon: typeof Clock }> = {
  scheduled: { label: "Scheduled", tone: "info", icon: Clock },
  sent: { label: "Sent", tone: "success", icon: CheckCircle2 },
  failed: { label: "Failed", tone: "error", icon: XCircle },
  cancelled: { label: "Cancelled", tone: "neutral", icon: Ban },
};

function Outbox() {
  const [rows, setRows] = useState(SAMPLE_OUTBOX);
  const [open, setOpen] = useState<OutboxEmail | null>(null);
  const sorted = [...rows].sort((a, b) => b.at.localeCompare(a.at));
  const retry = (id: string) => {
    setRows((r) => r.map((e) => (e.id === id ? { ...e, status: "sent" } : e)));
    toast.success("Email re-sent");
  };
  return (
    <div className="mx-auto max-w-4xl">
      <PageIntro title="Outbox">Every automated email, logged. Times in team time (PKT).</PageIntro>
      <Panel className="divide-y divide-border">
        {sorted.map((e) => {
          const s = STATUS[e.status];
          return (
            <div key={e.id} className="flex items-start gap-3 p-3 hover:bg-muted/30">
              <button onClick={() => setOpen(e)} className="min-w-0 flex-1 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium text-foreground">{e.subject}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">{e.type}</span>
                </div>
                <div className="text-xs text-muted-foreground">To {e.to}</div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{e.body.split("\n").find((l) => l.trim() && !/^Hi /.test(l)) ?? e.body}</p>
              </button>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span className="text-xs tabular-nums text-muted-foreground">{fmtIn(e.at, TEAM_TZ)}</span>
                <Pill tone={s.tone} icon={s.icon}>{s.label}</Pill>
                {e.status === "failed" && (
                  <button className={btn} onClick={() => retry(e.id)}><RotateCw className="h-3 w-3" aria-hidden />Retry</button>
                )}
              </div>
            </div>
          );
        })}
      </Panel>
      <DemoNote />
      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle>{open.subject}</SheetTitle>
                <SheetDescription>To {open.to} · {fmtIn(open.at, TEAM_TZ)}</SheetDescription>
              </SheetHeader>
              <div className="space-y-3 px-4 pb-6">
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <Pill tone={STATUS[open.status].tone} icon={STATUS[open.status].icon}>{STATUS[open.status].label}</Pill>
                  <span>From notify.advancingdatasolutions.com · Reply-to contact@advancingdatasolutions.com</span>
                </div>
                <pre className="whitespace-pre-wrap rounded-lg border border-border bg-background p-4 font-sans text-sm leading-relaxed text-foreground">{open.body}</pre>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
