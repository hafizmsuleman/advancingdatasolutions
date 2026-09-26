import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import logoUrl from "@/assets/ads-logo-horizontal.svg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin sign in — Advancing Data Solutions" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
            void navigate({ to: "/admin" });
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
              placeholder="you@advancingdatasolutions.com"
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="admin-password">Password</Label>
              <Link
                to="/admin/login"
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </Link>
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
          <Button type="submit" className="h-11 w-full">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
