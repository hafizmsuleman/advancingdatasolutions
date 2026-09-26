import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Send, Ban, BadgeCheck } from "lucide-react";
import { Panel, Pill, PageIntro, btn, th, td } from "@/components/admin-ui";
import { browserTimeZone, fmtIn, type LeadStatus } from "@/lib/admin-sample";
import { useAdminLeads, useInvalidateAdmin } from "@/lib/admin-data";
import { blockSender, unblockSender } from "@/lib/admin-data";
import { supabase } from "@/integrations/supabase/client";

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
  link_sent: { label: "Link sent", tone: "info" },
  nudged: { label: "Nudged", tone: "warning" },
  booked: { label: "Booked", tone: "success" },
  cold: { label: "Cold", tone: "neutral" },
  blocked: { label: "Blocked", tone: "error" },
};

function Leads() {
  const { data: rows = [] } = useAdminLeads();
  const invalidate = useInvalidateAdmin();
  const resend = async (l: (typeof rows)[number]) => {
    const link = `${window.location.origin}/book?t=${l.bookingToken}`;
    const { error } = await supabase.from("messages").insert({
      type: "nudge", to_email: l.email, lead_id: l.id,
      subject: "Your booking link for a free consultation",
      body: `Hi ${l.name.split(" ")[0] || "there"},\n\nHere's your link to book a free consultation with our engineers. Your details are already filled in:\n${link}\n\nAdvancing Data Solutions`,
    });
    if (error) toast.error("Couldn't queue the email"); else { toast.success(`Booking link queued for ${l.email}`); invalidate(); }
  };
  const block = async (l: (typeof rows)[number]) => {
    const ok = await blockSender(l.email, "Leads");
    if (ok === null) return;
    if (!ok) toast.error("Couldn't block this address"); else { toast.success("Blocked"); invalidate(); }
  };
  const unblock = async (l: (typeof rows)[number]) => {
    if (await unblockSender(l.email)) { toast.success("Unblocked"); invalidate(); } else toast.error("Couldn't unblock this address");
  };
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
                <td className={td + " tabular-nums"}>{l.lastNudge ? <>{fmtIn(l.lastNudge, browserTimeZone())} <span className="text-xs text-muted-foreground">({l.nudges}/2)</span></> : <span className="text-muted-foreground">—</span>}</td>
                <td className={td}>
                  <div className="flex justify-end gap-1.5">
                    <button className={btn} disabled={!l.verified || l.status === "blocked" || l.status === "booked"}
                      onClick={() => resend(l)}>
                      <Send className="h-3 w-3" aria-hidden />Resend
                    </button>
                    {l.status === "blocked" ? (
                      <button className={btn} onClick={() => unblock(l)}>
                        <Ban className="h-3 w-3" aria-hidden />Unblock
                      </button>
                    ) : (
                      <button className={btn + " text-destructive"} onClick={() => block(l)}>
                        <Ban className="h-3 w-3" aria-hidden />Block
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
