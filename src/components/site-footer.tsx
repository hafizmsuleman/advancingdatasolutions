export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-[1120px] flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} Advancing Data Solutions LLC. All rights reserved.</p>
        <a
          href="mailto:contact@advancingdatasolutions.com"
          className="font-medium text-primary transition-colors hover:text-primary-hover"
        >
          contact@advancingdatasolutions.com
        </a>
      </div>
    </footer>
  );
}
