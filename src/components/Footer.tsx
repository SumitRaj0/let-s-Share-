/** Server-friendly footer — plain anchors avoid next/link on marketing pages. */
export function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-[var(--marketing-line,rgba(11,12,14,0.08))] bg-transparent">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-4 px-margin-mobile py-8 md:flex-row md:px-10 lg:px-12">
        <div className="font-display text-[15px] font-bold tracking-tight text-[var(--marketing-ink,#0b0c0e)]">
          Let&apos;sShare
        </div>
        <nav className="flex flex-wrap justify-center gap-8" aria-label="Footer">
          <a
            href="/privacy"
            className="text-[14px] text-[var(--marketing-muted,#5b616b)] transition-colors duration-200 hover:text-[var(--marketing-ink,#0b0c0e)]"
          >
            Privacy
          </a>
          <a
            href="/terms"
            className="text-[14px] text-[var(--marketing-muted,#5b616b)] transition-colors duration-200 hover:text-[var(--marketing-ink,#0b0c0e)]"
          >
            Terms
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] text-[var(--marketing-muted,#5b616b)] transition-colors duration-200 hover:text-[var(--marketing-ink,#0b0c0e)]"
          >
            Github
          </a>
        </nav>
        <div className="text-center text-[13px] text-[var(--marketing-muted,#5b616b)] md:text-right">
          © 2026 Let&apos;sShare. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
