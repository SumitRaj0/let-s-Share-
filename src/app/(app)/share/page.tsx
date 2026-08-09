import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { CreateSharePanel } from "@/components/share/CreateSharePanel";
import { listPublic } from "@/lib/share/snippets";
import type { SnippetLanguage } from "@/lib/types";

/** Hits Turso at request time — do not prerender during `next build`. */
export const dynamic = "force-dynamic";

const LANGUAGE_LABELS: Record<SnippetLanguage, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  html: "HTML",
  css: "CSS",
  json: "JSON",
  markdown: "Markdown",
  plaintext: "Plain text",
};

export default async function ShareStartPage() {
  const recent = await listPublic(12);

  return (
    <>
      <Header active="none" />
      <main className="mx-auto flex w-full max-w-[1100px] flex-grow flex-col gap-12 px-margin-mobile py-10 md:px-margin-desktop md:py-16">
        <div className="relative">
          <div className="pointer-events-none absolute -right-16 -top-10 h-56 w-56 rounded-full bg-secondary-container/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 -left-10 h-48 w-48 rounded-full bg-primary-container/5 blur-3xl" />
          <CreateSharePanel navigateTo="share" />
        </div>

        <section className="flex flex-col gap-6">
          <div>
            <h2 className="text-headline-lg text-primary">Recent public shares</h2>
            <p className="mt-2 text-body-md text-on-surface-variant">
              Latest snippets shared with the community.
            </p>
          </div>

          {recent.length === 0 ? (
            <div className="glass-panel rounded-2xl px-6 py-10 text-center text-body-md text-on-surface-variant">
              No public snippets yet. Create the first share link above.
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {recent.map((snippet) => (
                <li key={snippet.id}>
                  <Link
                    href={`/${snippet.shareCode}`}
                    className="glass-panel flex flex-col gap-2 rounded-xl px-5 py-4 transition-transform duration-300 hover:scale-[1.01] active:scale-[0.99] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-label-md font-semibold text-on-surface">
                        {snippet.title}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-caption text-on-surface-variant">
                        <span>{LANGUAGE_LABELS[snippet.language]}</span>
                        <span>
                          {snippet.ownerName?.trim() || "Anonymous"}
                        </span>
                        <span>
                          {snippet.viewCount}{" "}
                          {snippet.viewCount === 1 ? "view" : "views"}
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-caption text-secondary">
                      Open
                      <span className="material-symbols-outlined text-[16px]">
                        arrow_forward
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
