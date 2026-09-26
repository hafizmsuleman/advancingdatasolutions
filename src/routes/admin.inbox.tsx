import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Copy } from "lucide-react";
import { Panel, PageIntro, btn, btnPrimary, field } from "@/components/admin-ui";

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

const DRAFT = `Hi Rachel,

Thanks for reaching out. An internal assistant over your contracts and SOPs is a great fit for what our engineers do on Azure OpenAI.

We've pre-filled your details so booking takes under a minute: https://book.advancingdatasolutions.com/book?t=•••

We'd suggest a free 60-minute consultation, and you'll receive a written proposal afterwards.

Best regards,
Advancing Data Solutions`;

function InboxPage() {
  const [text, setText] = useState("");
  const [source, setSource] = useState("LinkedIn");
  const [done, setDone] = useState(false);

  const fields = [
    ["Name", "Rachel Ortiz"], ["Email", "rachel.ortiz@meridianfreight.com"], ["Company", "Meridian Freight"],
    ["Country", "US"], ["Project area", "AI & GenAI"], ["Platform", "Azure"], ["Need", "RAG / chatbot on our data"],
    ["Timeline", "1–3 months"], ["Budget", "$20k–50k"], ["Suggested session", "60 min"], ["Source", source],
  ];

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
              <select id="src" className={field} value={source} onChange={(e) => setSource(e.target.value)}>
                {["LinkedIn", "Email", "WhatsApp", "Form"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <button className={btnPrimary} disabled={!text.trim()} onClick={() => setDone(true)}>
              <Sparkles className="h-4 w-4" aria-hidden />Analyze
            </button>
          </div>
        </Panel>

        <Panel className="p-4">
          {!done ? (
            <div className="flex h-full min-h-60 flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <Sparkles className="mb-2 h-6 w-6" aria-hidden />
              Results appear here after you analyze an inquiry.
            </div>
          ) : (
            <div className="space-y-4">
              <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">Sample result layout. AI analysis is connected in Phase 2.</p>
              <dl className="grid grid-cols-[130px_1fr] gap-x-3 gap-y-1.5 text-sm">
                {fields.map(([k, v]) => (
                  <div key={k} className="contents"><dt className="text-muted-foreground">{k}</dt><dd>{v}</dd></div>
                ))}
              </dl>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="text-xs font-medium text-muted-foreground">Reply draft</h3>
                  <button className={btn} onClick={() => { navigator.clipboard?.writeText(DRAFT); toast.success("Reply copied"); }}>
                    <Copy className="h-3 w-3" aria-hidden />Copy
                  </button>
                </div>
                <pre className="whitespace-pre-wrap rounded-lg border border-border bg-background p-3 font-sans text-sm leading-relaxed">{DRAFT}</pre>
              </div>
              <button className={btnPrimary} onClick={() => toast.success("Lead saved (sample)")}>Save as lead</button>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
