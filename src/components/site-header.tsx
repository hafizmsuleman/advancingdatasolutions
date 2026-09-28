import { Link } from "@tanstack/react-router";

import logoAsset from "@/assets/ads-logo-horizontal.svg.asset.json";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-6">
        <a
          href="https://advancingdatasolutions.com"
          aria-label="Advancing Data Solutions — home"
          className="flex items-center"
        >
          <img
            src={logoAsset.url}
            alt="Advancing Data Solutions"
            className="h-8 w-auto"
            width={253}
            height={70}
          />
        </a>
        <nav className="flex items-center gap-6" aria-label="Main">
          <a
            href="https://advancingdatasolutions.com"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            Home
          </a>
          <Link
            to="/book"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Book a call
          </Link>
        </nav>
      </div>
    </header>
  );
}
