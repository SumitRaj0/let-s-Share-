"use client";

import { Footer } from "@/components/Footer";
import { MarketingHeader } from "@/components/MarketingHeader";
import { motion, useReducedMotion } from "motion/react";

function CopyIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 shrink-0 text-[#858585]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
      <path d="M10.5 5.5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5"
      fill="currentColor"
    >
      <path d="M4.5 3.2v9.6L13 8 4.5 3.2Z" />
    </svg>
  );
}

function EditorPreview() {
  return (
    <div className="home-preview w-full overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] ring-1 ring-black/20">
      <div className="flex flex-wrap items-center gap-3 border-b border-[#2f2f2f] bg-[#252526] px-4 py-3 sm:flex-nowrap sm:gap-4">
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#3c3c3c]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#3c3c3c]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#3c3c3c]" />
        </div>

        <div className="order-last flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md bg-[#1e1e1e] px-3 py-1.5 sm:order-none">
          <span className="truncate font-mono text-[12px] text-[#cccccc] sm:text-[13px]">
            letsshare.io/x/k8j2m
          </span>
          <CopyIcon />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          <div className="flex items-center -space-x-2" aria-hidden>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#252526] bg-[#c4b5a5] text-[10px] font-semibold text-white">
              A
            </span>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#252526] bg-[#7a8fa6] text-[10px] font-semibold text-white">
              B
            </span>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#252526] bg-[#3c3c3c] text-[10px] font-semibold text-[#cccccc]">
              +1
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#0e639c] px-3 py-1.5 text-[12px] font-medium text-white">
            <PlayIcon />
            Run
          </span>
        </div>
      </div>

      <pre className="overflow-x-auto whitespace-pre bg-[#1e1e1e] px-5 py-7 font-mono text-[13px] leading-[1.75] text-[#d4d4d4] sm:px-8 sm:text-[14px]">
        <code>
          <span className="text-[#569cd6]">function</span>{" "}
          <span className="text-[#dcdcaa]">fibonacci</span>
          <span className="text-[#d4d4d4]">(n) {"{"}</span>
          {"\n"}
          {"  "}
          <span className="text-[#c586c0]">if</span>
          <span className="text-[#d4d4d4]"> (n &lt;= 1) </span>
          <span className="text-[#c586c0]">return</span>
          <span className="text-[#d4d4d4]"> n;</span>
          {"\n"}
          {"  "}
          <span className="text-[#c586c0]">return</span>{" "}
          <span className="text-[#dcdcaa]">fibonacci</span>
          <span className="text-[#d4d4d4]">(n - 1) + </span>
          <span className="text-[#dcdcaa]">fibonacci</span>
          <span className="text-[#d4d4d4]">(n - 2);</span>
          {"\n"}
          <span className="text-[#d4d4d4]">{"}"}</span>
          {"\n\n"}
          <span className="text-[#6a9955]">{"// Run it live with your team"}</span>
          {"\n"}
          <span className="text-[#569cd6]">const</span>
          <span className="text-[#d4d4d4]"> result = </span>
          <span className="text-[#dcdcaa]">fibonacci</span>
          <span className="text-[#d4d4d4]">(10);</span>
        </code>
      </pre>

      <div className="border-t border-[#2f2f2f] bg-[#181818] px-5 py-4 sm:px-8">
        <div className="mb-2 text-[11px] font-medium tracking-[0.14em] text-[#858585]">
          CONSOLE
        </div>
        <div className="font-mono text-[13px] leading-relaxed">
          <div className="text-[#6a9955]">System online. Ready for input.</div>
          <div className="text-[#dcdcaa]">
            <span className="text-[#858585]">&gt; </span>Result: 55
          </div>
        </div>
      </div>
    </div>
  );
}

const easeOut = [0.22, 1, 0.36, 1] as const;

const FEATURES = [
  { n: "01", title: "No login", body: "Start in seconds." },
  { n: "02", title: "Real-time", body: "Code together live." },
  { n: "03", title: "Runs your code", body: "See real output." },
] as const;

export function HomePage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="marketing flex min-h-full flex-col">
      <MarketingHeader />
      <main className="mx-auto flex w-full max-w-[1200px] flex-grow flex-col px-margin-mobile md:px-10 lg:px-12">
        <section className="home-hero relative z-10 flex min-h-[min(72vh,640px)] flex-col items-center justify-center pb-10 pt-16 text-center md:min-h-[min(78vh,720px)] md:pb-12 md:pt-20">
          <div className="relative z-10 flex flex-col items-center">
            <p className="marketing-rise font-display text-[48px] font-bold leading-[0.95] tracking-[-0.045em] text-[var(--marketing-ink)] sm:text-[64px] md:text-[80px]">
              Let&apos;sShare
            </p>
            <h1 className="marketing-rise-delay mt-6 max-w-[18ch] font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-[var(--marketing-ink)] sm:max-w-none sm:whitespace-nowrap sm:text-[36px] md:mt-7 md:text-[44px] lg:text-[48px]">
              Sharing, made Easy &amp; instant.
            </h1>
            <p className="marketing-rise-delay mt-5 max-w-md text-[16px] leading-relaxed text-[var(--marketing-muted)] md:mt-6 md:max-w-lg md:text-[18px]">
              Live code links for your team. Open, edit, and run — no setup.
            </p>
            <div className="marketing-rise-delay-2 mt-8 flex flex-wrap items-center justify-center gap-3 md:mt-10">
              <motion.a
                href="/editor"
                className="marketing-cta inline-flex items-center justify-center rounded-md bg-[var(--marketing-ink)] px-7 py-3.5 text-[15px] font-semibold tracking-wide text-white"
                whileHover={reduceMotion ? undefined : { scale: 1.05, y: -3 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                Start sharing
              </motion.a>
              <a
                href="/#features"
                className="inline-flex items-center justify-center rounded-md px-5 py-3.5 text-[15px] font-medium text-[var(--marketing-muted)] transition-colors hover:text-[var(--marketing-ink)]"
              >
                See how it looks
              </a>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="home-preview-wrap relative z-10 w-full pb-16 md:pb-24"
          aria-label="Product preview"
        >
          <motion.div
            className="home-preview-stage marketing-preview-in mx-auto w-full max-w-[1040px]"
            animate={
              reduceMotion
                ? undefined
                : {
                    y: [0, -10, 0],
                    transition: {
                      duration: 4.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1,
                    },
                  }
            }
            whileHover={
              reduceMotion
                ? undefined
                : { y: -14, transition: { duration: 0.28, ease: easeOut } }
            }
          >
            <EditorPreview />
          </motion.div>
        </section>

        <section
          className="relative z-10 mb-24 grid w-full grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-[var(--marketing-line)] bg-white/70 md:mb-32 md:grid-cols-3"
          aria-label="Highlights"
        >
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.n}
              className={`marketing-feature-rise ${
                index < FEATURES.length - 1
                  ? "border-b border-[var(--marketing-line)] p-7 md:border-b-0 md:border-r md:p-8"
                  : "p-7 md:p-8"
              }`}
              style={
                reduceMotion
                  ? undefined
                  : ({
                      ["--feature-delay" as string]: `${0.08 + index * 0.12}s`,
                    } as React.CSSProperties)
              }
              whileHover={
                reduceMotion
                  ? undefined
                  : { y: -4, transition: { duration: 0.22, ease: easeOut } }
              }
            >
              <p className="font-mono text-[12px] font-medium tracking-[0.16em] text-[var(--marketing-slate)]">
                {feature.n}
              </p>
              <h2 className="mt-3 font-display text-[20px] font-semibold tracking-tight text-[var(--marketing-ink)]">
                {feature.title}
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-[var(--marketing-muted)]">
                {feature.body}
              </p>
            </motion.div>
          ))}
        </section>

        <section id="about" className="sr-only" aria-label="About">
          Let&apos;sShare is a realtime code sharing platform for developers.
          Share code with a link, collaborate live, and run snippets together —
          no login required to start.
        </section>
      </main>
      <Footer />
    </div>
  );
}
