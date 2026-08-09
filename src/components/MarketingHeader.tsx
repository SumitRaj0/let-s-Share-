/**
 * Server-only header for marketing pages — plain anchors, no next/link client JS.
 */
export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--marketing-line,rgba(11,12,14,0.08))] bg-[rgba(245,246,248,0.78)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-margin-mobile py-4 md:px-10 lg:px-12">
        <div className="flex items-center gap-8 md:gap-10">
          <a
            href="/"
            className="font-display text-[17px] font-bold tracking-tight text-[var(--marketing-ink,#0b0c0e)]"
          >
            Let&apos;sShare
          </a>
          <nav
            className="hidden items-center gap-7 md:flex"
            aria-label="Primary"
          >
            <a
              href="/editor"
              className="text-[14px] font-medium text-[var(--marketing-ink,#0b0c0e)]"
            >
              ShareCode
            </a>
          </nav>
        </div>
        <a
          href="/editor"
          className="marketing-cta inline-flex items-center justify-center rounded-md bg-[var(--marketing-ink,#0b0c0e)] px-4 py-2 text-[13px] font-semibold tracking-wide text-white"
        >
          Start sharing
        </a>
      </div>
    </header>
  );
}
