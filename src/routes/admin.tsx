import {
  createFileRoute,
  Link,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Mail,
  Inbox,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import logoAsset from "@/assets/ads-logo-horizontal.svg.asset.json";

const logoUrl = logoAsset.url;
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

type NavItem = {
  title: string;
  to: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { title: "Overnight", to: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Bookings", to: "/admin/bookings", icon: CalendarDays },
  { title: "Leads", to: "/admin/leads", icon: Users },
  { title: "Outbox", to: "/admin/outbox", icon: Mail },
  { title: "Inbox", to: "/admin/inbox", icon: Inbox },
  { title: "Settings", to: "/admin/settings", icon: Settings },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === "/admin/login") {
    return <Outlet />;
  }

  const current =
    NAV.find((n) => (n.exact ? pathname === n.to : pathname.startsWith(n.to))) ??
    ({ title: "Admin" } as const);

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname.startsWith(to);

  const navContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link to="/admin" onClick={() => setMobileOpen(false)}>
          <img src={logoUrl} alt="Advancing Data Solutions" className="h-7 w-auto" />
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors",
              isActive(item.to, "exact" in item && item.exact)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.title}
          </Link>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <Link
          to="/admin/login"
          className="flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 border-r border-border bg-card md:block">
        {navContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-border bg-card shadow-lg">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-3.5 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
            {navContent}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col md:pl-56">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-card px-4 md:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-semibold tracking-tight text-foreground">
            {current.title}
          </h1>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
        <Toaster />
      </div>
    </div>
  );
}
