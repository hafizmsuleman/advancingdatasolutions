import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Send, Ban, BadgeCheck } from "lucide-react";
import { Panel, Pill, PageIntro, DemoNote, btn, th, td } from "@/components/admin-ui";
import { SAMPLE_LEADS, TEAM_TZ, fmtIn, type LeadStatus } from "@/lib/admin-sample";

export const Route = createFileRoute("/admin/leads")({
  head: () => ({
    meta: [
      { title: "Leads — Admin — Advancing Data Solutions" },
      { name: "description", content: "Leads and follow-up nudges." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Leads,
});

const STATUS: Record<LeadStatus, { label: string; tone: "success" | "info" | "warning" | "error" | "neutral" }> = {
  new: { label: "New", tone: "info" },
  nudged: { label: "Nudged", tone: "warning" },
  booked: { label: "Booked", tone: "success" },
  cold: { label: "Cold", tone: "neutral" },
  blocked: { label: "Blocked", tone: "error" },
};

function Leads() {
  const [rows, setRows] = useState(SAMPLE_LEADS);
  return (
    <div className="mx-auto max-w-6xl">
      <PageIntro title="Leads">Only verified leads receive nudges (24h and 48h, max 2), then go cold at 72h.</PageIntro>
      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className={th}>Lead</th><th className={th}>Status</th><th className={th}>Source</th><th className={th}>Area</th>
              <th className={th}>Verified</th><th className={th}>Last nudge</th><th className={th}><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((l) => (
              <tr key={l.id} className="hover:bg-muted/30">
                <td className={td}>
                  <div className="font-medium">{l.name} <span className="font-normal text-muted-foreground">· {l.company}</span></div>
                  <div className="text-xs text-muted-foreground">{l.email}</div>
                </td>
                <td className={td}><Pill tone={STATUS[l.status].tone}>{STATUS[l.status].label}</Pill></td>
                <td className={td}>{l.source}</td>
                <td className={td}>{l.area}</td>
                <td className={td}>{l.verified ? <Pill tone="success" icon={BadgeCheck}>Verified</Pill> : <Pill tone="neutral">No</Pill>}</td>
                <td className={td + " tabular-nums"}>{l.lastNudge ? <>{fmtIn(l.lastNudge, TEAM_TZ)} <span className="text-xs text-muted-foreground">({l.nudges}/2)</span></> : <span className="text-muted-foreground">—</span>}</td>
                <td className={td}>
                  <div className="flex justify-end gap-1.5">
                    <button className={btn} disabled={!l.verified || l.status === "blocked" || l.status === "booked"}
                      onClick={() => toast.success(`Booking link resent to ${l.email}`)}>
                      <Send className="h-3 w-3" aria-hidden />Resend
                    </button>
                    <button className={btn + " text-destructive"} disabled={l.status === "blocked"}
                      onClick={() => { setRows((r) => r.map((x) => (x.id === l.id ? { ...x, status: "blocked" } : x))); toast.success(`${l.email} blocked`); }}>
                      <Ban className="h-3 w-3" aria-hidden />Block
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <DemoNote />
    </div>
  );
}
