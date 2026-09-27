import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { runAutomationsNow } from "@/lib/automations.functions";
import { resetDemoData, generateDemoData } from "@/lib/demo-reset.functions";
import { TimeZoneSelect } from "@/components/time-zone-select";
import { setAdminTimeZone } from "@/lib/admin-sample";
import { useInvalidateAdmin } from "@/lib/admin-data";
import { BUDGET_LABEL, BUDGET_TO_DB } from "@/lib/enums";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Panel, PageIntro, btn, btnPrimary, field } from "@/components/admin-ui";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Admin — Advancing Data Solutions" },
      { name: "description", content: "Availability, limits, meeting link and demo mode." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function Section({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <Panel className="p-4">
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      {desc && <p className="mb-3 text-xs text-muted-foreground">{desc}</p>}
      <div className={desc ? "" : "mt-3"}>{children}</div>
    </Panel>
  );
}

function Num({ id, label, value, onChange, suffix }: { id: string; label: string; value: number; onChange: (n: number) => void; suffix: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs text-muted-foreground">{label}</label>
      <div className="mt-1 flex items-center gap-2">
        <input id={id} type="number" min={0} className={field + " w-24 tabular-nums"} value={value} onChange={(e) => onChange(Number(e.target.value))} />
        <span className="text-sm text-muted-foreground">{suffix}</span>
      </div>
    </div>
  );
}

function SettingsPage() {
  const [days, setDays] = useState(DAYS.map((d, i) => ({ d, on: i < 5, from: "15:00", to: "24:00" })));
  const [n, setN] = useState({ buffer: 15, cap: 3, notice: 24, flag: 12, release: 6 });
  const [threshold, setThreshold] = useState("$5k–20k");
  const [link, setLink] = useState("https://meet.google.com/xyz");
  const [blocked, setBlocked] = useState(["mailinator.com", "quickmail-temp.io", "spam@example.com"]);
  const [newBlock, setNewBlock] = useState("");
  const [demo, setDemo] = useState(false);
  const [offset, setOffset] = useState(0);
  const [availabilityTz, setAvailabilityTz] = useState("Asia/Karachi");
  const invalidate = useInvalidateAdmin();
  const runFn = useServerFn(runAutomationsNow);
  const resetFn = useServerFn(resetDemoData);
  const genFn = useServerFn(generateDemoData);
  const [generating, setGenerating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<{ at: string; summary: string } | null>(null);
  const WD = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
  const hhmm = (t: string) => (t.startsWith("24") ? "24:00" : t.slice(0, 5));

  useEffect(() => {
    (async () => {
      const [{ data: st }, { data: win }, { data: bl }] = await Promise.all([
        supabase.from("settings").select("*").eq("id", 1).single(),
        supabase.from("availability_windows").select("*"),
        supabase.from("blocked_senders").select("value").order("created_at"),
      ]);
      if (st) {
        if (st.automation_last_run_at) setLastRun({ at: st.automation_last_run_at, summary: st.automation_last_summary ?? "" });
        setN({ buffer: st.buffer_min, cap: st.daily_cap, notice: st.min_notice_hours, flag: st.attendance_flag_hours, release: st.attendance_release_hours });
        setThreshold(BUDGET_LABEL[st.budget_threshold]);
        setLink(st.fallback_meeting_link ?? "");
        setDemo(st.demo_mode);
        setOffset(Math.round(st.virtual_clock_offset_min / 60));
        setAvailabilityTz(st.team_timezone);
      }
      if (win) setDays(DAYS.map((d, i) => {
        const w = win.find((x) => x.weekday === WD[i]);
        return { d, on: !!w?.active, from: w ? hhmm(w.start_time) : "15:00", to: w ? hhmm(w.end_time) : "24:00" };
      }));
      if (bl) setBlocked(bl.map((b) => b.value));
    })();
  }, []);

  async function saveAll() {
    const { error } = await supabase.from("settings").update({
      buffer_min: n.buffer, daily_cap: n.cap, min_notice_hours: n.notice, attendance_flag_hours: n.flag,
      attendance_release_hours: n.release, team_timezone: availabilityTz, budget_threshold: BUDGET_TO_DB[threshold]!, fallback_meeting_link: link.trim() || null,
    }).eq("id", 1);
    if (error) { toast.error("Couldn't save settings"); return; }
    await supabase.from("availability_windows").delete().in("weekday", [...WD]);
    const rows = days.map((x, i) => ({ weekday: WD[i]!, start_time: x.from, end_time: x.to, active: x.on })).filter((x) => x.active);
    const { error: e2 } = await supabase.from("availability_windows").insert(rows);
    if (e2) { toast.error("Couldn't save availability. Check the times (use 24:00 for midnight)."); return; }
    setAdminTimeZone(availabilityTz);
    toast.success("Settings saved");
    invalidate();
  }
  async function addBlocked(v: string) {
    const { error } = await supabase.from("blocked_senders").insert({ value: v });
    if (error) toast.error("Couldn't add"); else setBlocked((b) => [...b, v]);
  }
  async function removeBlocked(v: string) {
    const { error } = await supabase.from("blocked_senders").delete().eq("value", v);
    if (error) toast.error("Couldn't remove"); else setBlocked((b) => b.filter((x) => x !== v));
  }
  async function setDemoMode(on: boolean) {
    const { error } = await supabase.from("settings").update({ demo_mode: on }).eq("id", 1);
    if (error) { toast.error("Couldn't change demo mode"); return; }
    setDemo(on); invalidate();
  }
  async function runNow() {
    setRunning(true);
    try {
      let r = await runFn();
      for (let i = 0; r.skipped && i < 3; i++) { await new Promise((ok) => setTimeout(ok, 3000)); r = await runFn(); }
      if (r.skipped) toast.message("A run is already in progress");
      else toast.success("Automations ran");
      const { data: st } = await supabase.from("settings").select("automation_last_run_at, automation_last_summary").eq("id", 1).single();
      if (st?.automation_last_run_at) setLastRun({ at: st.automation_last_run_at, summary: st.automation_last_summary ?? "" });
      invalidate();
    } catch { toast.error("Couldn't run automations"); }
    setRunning(false);
  }
  async function setClock(h: number) {
    const { error } = await supabase.from("settings").update({ virtual_clock_offset_min: h * 60 }).eq("id", 1);
    if (error) { toast.error("Couldn't change simulated time"); return; }
    setOffset(h);
    if (h > 0) await runNow();
    else invalidate();
  }
  async function generateDemo() {
    if (!demo) return;
    setGenerating(true);
    try {
      await genFn();
      invalidate();
      toast.success("10 sample bookings and 3 sample leads added");
    } catch (e) {
      toast.error(String(e).includes("already_generated") ? "Sample data is already added. Use Reset demo data first." : "Couldn't add sample data. No real data was changed.");
    }
    setGenerating(false);
  }
  async function restoreDemo() {
    if (!demo || !window.confirm("Delete all demo data and restore the original sample bookings, leads and emails? Real data will stay as it is.")) return;
    setResetting(true);
    try {
      await resetFn();
      setOffset(0);
      invalidate();
      toast.success("Demo data restored");
    } catch { toast.error("Couldn't restore demo data. No real bookings were changed."); }
    setResetting(false);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageIntro title="Settings" actions={<button className={btnPrimary} onClick={saveAll}>Save changes</button>} />

      <Section title="Availability" desc="Availability hours are in your time zone. Slots start every 30 minutes.">
        <div className="mb-3">
          <label htmlFor="availability-time-zone" className="block text-xs text-muted-foreground">Your time zone</label>
          <div className="mt-1 max-w-sm"><TimeZoneSelect id="availability-time-zone" value={availabilityTz} onChange={setAvailabilityTz} className="h-9 min-h-9 rounded-lg" /></div>
          <p className="mt-1 text-xs text-muted-foreground">Admin times follow this zone. Clients never see it. Click Save changes to apply.</p>
        </div>
        <div className="divide-y divide-border">
          {days.map((row, i) => (
            <div key={row.d} className="flex flex-wrap items-center gap-3 py-2">
              <label className="flex w-32 items-center gap-2 text-sm">
                <Switch checked={row.on} onCheckedChange={(on) => setDays((ds) => ds.map((x, j) => (j === i ? { ...x, on } : x)))} aria-label={`${row.d} available`} />
                {row.d}
              </label>
              {row.on ? (
                <div className="flex items-center gap-2 text-sm tabular-nums">
                  <input aria-label={`${row.d} from`} className={field + " w-24"} value={row.from} onChange={(e) => setDays((ds) => ds.map((x, j) => (j === i ? { ...x, from: e.target.value } : x)))} />
                  <span className="text-muted-foreground">to</span>
                  <input aria-label={`${row.d} to`} className={field + " w-24"} value={row.to} onChange={(e) => setDays((ds) => ds.map((x, j) => (j === i ? { ...x, to: e.target.value } : x)))} />
                </div>
              ) : <span className="text-sm text-muted-foreground">Unavailable</span>}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Limits and automations">
        <div className="grid gap-4 sm:grid-cols-3">
          <Num id="buffer" label="Buffer between sessions" value={n.buffer} onChange={(v) => setN({ ...n, buffer: v })} suffix="min" />
          <Num id="cap" label="Daily cap" value={n.cap} onChange={(v) => setN({ ...n, cap: v })} suffix="sessions" />
          <Num id="notice" label="Minimum notice" value={n.notice} onChange={(v) => setN({ ...n, notice: v })} suffix="hours" />
          <Num id="flag" label="Amber attendance flag" value={n.flag} onChange={(v) => setN({ ...n, flag: v })} suffix="h before" />
          <Num id="release" label="Release if unconfirmed" value={n.release} onChange={(v) => setN({ ...n, release: v })} suffix="h before" />
          <div>
            <label htmlFor="thr" className="block text-xs text-muted-foreground">60-minute budget threshold</label>
            <select id="thr" className={field + " mt-1"} value={threshold} onChange={(e) => setThreshold(e.target.value)}>
              {["$5k–20k", "$20k–50k", "Over $50k"].map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
        </div>
      </Section>

      <Section title="Meeting link" desc="Used for every booking until Google Calendar is connected, and as the fallback afterwards.">
        <label htmlFor="link" className="sr-only">Meeting link</label>
        <input id="link" type="url" className={field + " w-full"} value={link} onChange={(e) => setLink(e.target.value)} />
      </Section>

      <Section title="Blocked emails and domains" desc="Requests from these addresses are rejected.">
        <div className="flex flex-wrap gap-1.5">
          {blocked.map((b) => (
            <span key={b} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs">
              {b}
              <button aria-label={`Remove ${b}`} onClick={() => removeBlocked(b)} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); const v = newBlock.trim().toLowerCase(); if (v && !blocked.includes(v)) addBlocked(v); setNewBlock(""); }}>
          <label htmlFor="nb" className="sr-only">Add email or domain</label>
          <input id="nb" className={field + " flex-1"} placeholder="name@company.com or domain.com" value={newBlock} onChange={(e) => setNewBlock(e.target.value)} />
          <button className={btn + " h-9"} type="submit">Add</button>
        </form>
      </Section>

      <Section title="Automations" desc="Reminders, attendance release, nudges and clean-up run every 5 minutes.">
        <div className="flex flex-wrap items-center gap-3">
          <button className={btn + " h-9"} disabled={running} onClick={runNow}>{running ? "Running…" : "Run now"}</button>
          <span className="text-sm text-muted-foreground">
            {lastRun ? <>Last run <span className="tabular-nums">{new Date(lastRun.at).toLocaleString()}</span>{lastRun.summary ? ` · ${lastRun.summary}` : ""}</> : "Not run yet"}
          </span>
        </div>
      </Section>

      <Section title="Demo mode" desc="Shows sample bookings and leads. Demo emails go only to the admin; no calendar events are created.">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={demo} onCheckedChange={setDemoMode} aria-label="Demo mode" />
          {demo ? "Demo mode is on" : "Demo mode is off"}
        </label>
        <div className="mt-4">
          <div className="text-xs text-muted-foreground">Simulate time (demo bookings only)</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {[1, 12, 24].map((h) => (
              <button key={h} className={btn + " h-9"} disabled={!demo} onClick={() => setClock(offset + h)}>+{h}h</button>
            ))}
            <button className={btn + " h-9"} disabled={!demo || offset === 0} onClick={() => setClock(0)}>Reset</button>
            {demo && <button className={btn + " h-9"} disabled={resetting} onClick={restoreDemo}>{resetting ? "Restoring…" : "Reset demo data"}</button>}
            {demo && <button className={btn + " h-9"} disabled={generating} onClick={generateDemo}>{generating ? "Adding…" : "Generate sample data"}</button>}
          </div>
          {demo && (
            <div className="mt-3 rounded-[10px] border border-border bg-muted px-3 py-2 text-sm" role="status">
              <span className="font-medium tabular-nums">Simulated time: {offset === 0 ? "real time (no offset)" : `+${offset}h`}</span>
              {offset > 0 && <span className="text-muted-foreground tabular-nums"> · demo clock reads {new Date(Date.now() + offset * 3600_000).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>}
              <div className="text-xs text-muted-foreground">Each step runs the automations straight away. Real bookings always use real time.</div>
            </div>
          )}
          <div className="hidden">
          </div>
        </div>
      </Section>
    </div>
  );
}
