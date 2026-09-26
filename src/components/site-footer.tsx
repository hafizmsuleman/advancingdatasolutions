import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-[1120px] flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} Advancing Data Solutions LLC. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="font-medium text-primary transition-colors hover:text-primary-hover">
            Privacy
          </Link>
          <a
            href="mailto:contact@advancingdatasolutions.com"
            className="font-medium text-primary transition-colors hover:text-primary-hover"
          >
            contact@advancingdatasolutions.com
          </a>
        </div>
      </div>
    </footer>
  );
}
