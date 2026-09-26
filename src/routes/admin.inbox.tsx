import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Copy, Loader2, Ban } from "lucide-react";
import { Panel, PageIntro, btn, btnPrimary, field } from "@/components/admin-ui";
import { supabase } from "@/integrations/supabase/client";
import { analyze } from "@/lib/inbox.functions";
import { useInvalidateAdmin } from "@/lib/admin-data";
import { AREAS, BUDGETS, NEEDS, PLATFORMS, type AreaId } from "@/lib/booking-draft";
import { BUDGET_TO_DB, NEED_TO_DB, PLATFORM_TO_DB } from "@/lib/enums";
import type { Extracted } from "@/lib/inbox.server";

export const Route = createFileRoute("/admin/inbox")({
  head: () => ({
    meta: [
      { title: "Inbox — Admin — Advancing Data Solutions" },
      { name: "description", content: "Turn pasted inquiries into leads with a reply draft." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InboxPage,
});

const SAMPLE_TEXT = `Hi, I'm Rachel from Meridian Freight (Houston). We're on Azure and want to build an internal assistant that answers questions from our shipping contracts and SOPs. Hoping to have something live within 2 months, budget roughly $30k. Could we talk next week? rachel.ortiz@meridianfreight.com`;
const SOURCES = ["LinkedIn", "Email", "WhatsApp", "Form"] as const;
const SRC_DB = { LinkedIn: "linkedin", Email: "email", WhatsApp: "whatsapp", Form: "form" } as const;
const LINK = "{{BOOKING_LINK}}";

function InboxPage() {
  const analyzeFn = useServerFn(analyze);
  const invalidate = useInvalidateAdmin();
  const [text, setText] = useState("");
  const [source, setSource] = useState<(typeof SOURCES)[number]>("LinkedIn");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [r, setR] = useState<Extracted | null>(null);
  const [saved, setSaved] = useState<{ id: string; token: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function run() {
    setBusy(true); setErr(""); setR(null); setSaved(null);
    const res = await analyzeFn({ data: { text, source } }).catch(() => ({ error: "We couldn't analyze this message. Please try again." }));
    setBusy(false);
    if ("error" in res) setErr(res.error); else setR(res.result);
  }

  const upd = <K extends keyof Extracted>(k: K, v: Extracted[K]) => setR((x) => (x ? { ...x, [k]: v } : x));
  const link = saved ? `${window.location.origin}/book?t=${saved.token}` : "";
  const replyText = r ? r.reply.replace(LINK, saved ? link : "[booking link appears after you save the lead]") : "";

  async function save() {
    if (!r || saving) return;
    setSaving(true);
    const { data, error } = await supabase.from("leads").insert({
      source: SRC_DB[source], raw_message: text.slice(0, 5000),
      full_name: r.name || null, company: r.company || null, role: r.role || null, email: r.email || null,
      project_area: r.area, platform: PLATFORM_TO_DB[r.platform] ?? "not_decided", need: NEED_TO_DB[r.need] ?? "other",
      budget_range: r.budget ? BUDGET_TO_DB[r.budget] ?? null : null,
      ai_summary: r.summary, ai_reply_draft: r.reply, notes: `Urgency: ${r.urgency}`,
    }).select("id, booking_token").single();
    setSaving(false);
    if (error || !data) { toast.error("Couldn't save the lead"); return; }
    setSaved({ id: data.id, token: data.booking_token });
    toast.success("Lead saved");
    invalidate();
  }

  async function copy() {
    if (!saved) return;
    await navigator.clipboard?.writeText(replyText);
    const { error } = await supabase.from("leads").update({ status: "link_sent" }).eq("id", saved.id).eq("status", "new");
    toast.success(error ? "Reply copied" : "Reply copied. Lead marked as link sent");
    invalidate();
  }

  const input = "w-full rounded-md border border-input bg-card px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <label className="contents"><span className="self-center text-muted-foreground">{label}</span>{children}</label>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageIntro title="Inbox">Paste an inquiry from any channel. We'll extract the brief and draft a reply with a prefilled booking link.</PageIntro>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="p-4">
          <label htmlFor="inq" className="text-sm font-medium">Inquiry text</label>
          <textarea id="inq" rows={10} value={text} onChange={(e) => setText(e.target.value)} maxLength={5000}
            placeholder="Paste the message here…"
            className="mt-1.5 w-full rounded-lg border border-input bg-card p-3 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          <button type="button" className="mt-1 text-xs text-primary hover:underline" onClick={() => setText(SAMPLE_TEXT)}>Use a sample inquiry</button>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div>
              <label htmlFor="src" className="block text-xs text-muted-foreground">Source</label>
              <select id="src" className={field} value={source} onChange={(e) => setSource(e.target.value as typeof source)}>
                {SOURCES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <button className={btnPrimary} disabled={text.trim().length < 10 || busy} onClick={run}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
              {busy ? "Analyzing…" : "Analyze"}
            </button>
          </div>
        </Panel>

        <Panel className="p-4">
          {err ? (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>
          ) : !r ? (
            <div className="flex h-full min-h-60 flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <Sparkles className="mb-2 h-6 w-6" aria-hidden />
              {busy ? "Reading the message…" : "Results appear here after you analyze an inquiry."}
            </div>
          ) : r.spam ? (
            <div className="space-y-2">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning"><Ban className="h-3 w-3" aria-hidden />Spam or unrelated</p>
              <p className="text-sm text-muted-foreground">{r.spamReason || "This doesn't look like a project inquiry."} No lead will be created.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5 text-sm">
                <Row label="Name"><input className={input} value={r.name} onChange={(e) => upd("name", e.target.value)} disabled={!!saved} /></Row>
                <Row label="Company"><input className={input} value={r.company} onChange={(e) => upd("company", e.target.value)} disabled={!!saved} /></Row>
                <Row label="Role"><input className={input} value={r.role} onChange={(e) => upd("role", e.target.value)} disabled={!!saved} /></Row>
                <Row label="Email"><input className={input} type="email" value={r.email} onChange={(e) => upd("email", e.target.value)} disabled={!!saved} /></Row>
                <Row label="Project area">
                  <select className={input} value={r.area} disabled={!!saved}
                    onChange={(e) => { const a = e.target.value as AreaId; setR((x) => x && { ...x, area: a, need: NEEDS[a][0]! }); }}>
                    {AREAS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                  </select>
                </Row>
                <Row label="Platform">
                  <select className={input} value={r.platform} onChange={(e) => upd("platform", e.target.value)} disabled={!!saved}>
                    {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </Row>
                <Row label="Need">
                  <select className={input} value={r.need} onChange={(e) => upd("need", e.target.value)} disabled={!!saved}>
                    {NEEDS[r.area].map((n) => <option key={n}>{n}</option>)}
                  </select>
                </Row>
                <Row label="Urgency">
                  <select className={input} value={r.urgency} onChange={(e) => upd("urgency", e.target.value as Extracted["urgency"])} disabled={!!saved}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </select>
                </Row>
                <Row label="Budget">
                  <select className={input} value={r.budget} onChange={(e) => upd("budget", e.target.value)} disabled={!!saved}>
                    <option value="">Not mentioned</option>
                    {BUDGETS.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </Row>
                <Row label="Summary"><textarea className={input} rows={3} value={r.summary} onChange={(e) => upd("summary", e.target.value)} disabled={!!saved} /></Row>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="text-xs font-medium text-muted-foreground">Reply draft</h3>
                  <button className={btn} disabled={!saved} onClick={copy} title={saved ? undefined : "Save the lead first"}>
                    <Copy className="h-3 w-3" aria-hidden />Copy reply
                  </button>
                </div>
                <textarea aria-label="Reply draft" rows={9} value={replyText}
                  onChange={(e) => upd("reply", saved ? e.target.value.replace(link, LINK) : e.target.value)}
                  className="w-full rounded-lg border border-border bg-background p-3 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <button className={btnPrimary} disabled={!!saved || saving} onClick={save}>
                {saved ? "Lead saved" : saving ? "Saving…" : "Save lead"}
              </button>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
