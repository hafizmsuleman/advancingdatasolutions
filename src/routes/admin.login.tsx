import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/site";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/ads-logo-horizontal.svg.asset.json";

const logoUrl = logoAsset.url;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin sign in — Advancing Data Solutions" },
      { name: "description", content: "Sign in to manage consultation bookings for Advancing Data Solutions." },
      { property: "og:title", content: "Admin sign in — Advancing Data Solutions" },
      { property: "og:description", content: "Sign in to manage consultation bookings for Advancing Data Solutions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true); setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) { setBusy(false); setMsg({ kind: "error", text: "That email and password don't match." }); return; }
    const { data: ok } = await supabase.rpc("is_admin");
    setBusy(false);
    if (!ok) { await supabase.auth.signOut(); setMsg({ kind: "error", text: "This account doesn't have admin access." }); return; }
    void navigate({ to: "/admin" });
  }

  async function forgot() {
    if (!email.trim()) { setMsg({ kind: "error", text: "Enter your email first, then choose Forgot password." }); return; }
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${SITE_URL}/reset-password` });
    setMsg({ kind: "info", text: "If that address has an admin account, we've emailed a link to set a new password." });
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8 flex justify-center">
          <img src={logoUrl} alt="Advancing Data Solutions" className="h-9 w-auto" />
        </div>
        <h1 className="text-center text-xl font-semibold tracking-tight text-foreground">
          Admin sign in
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          For the Advancing Data Solutions team.
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void signIn();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="admin-password">Password</Label>
              <button type="button" onClick={forgot} className="text-xs text-primary hover:underline">
                Forgot password?
              </button>
            </div>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
            />
          </div>
          {msg && (
            <p role="alert" className={msg.kind === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>{msg.text}</p>
          )}
          <Button type="submit" className="h-11 w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
