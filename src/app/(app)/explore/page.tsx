import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ExploreGrid } from "@/components/explore/ExploreGrid";
import { listExplore } from "@/lib/share/snippets";
import type { SnippetLanguage } from "@/lib/types";

const LANGUAGES: SnippetLanguage[] = [
  "javascript",
  "typescript",
  "python",
  "html",
  "css",
  "json",
  "markdown",
  "plaintext",
];

type ExplorePageProps = {
  searchParams: Promise<{
    q?: string;
    tag?: string;
    language?: string;
  }>;
};

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const tag = params.tag?.trim().toLowerCase() || "";
  const languageRaw = params.language?.trim().toLowerCase() || "";
  const language = LANGUAGES.includes(languageRaw as SnippetLanguage)
    ? languageRaw
    : "";

  const snippets = listExplore({
    q: q || undefined,
    tag: tag || undefined,
    language: language || undefined,
    limit: 48,
  });

  return (
    <>
      <Header active="none" />
      <main className="relative mx-auto flex w-full max-w-[1200px] flex-grow flex-col gap-10 px-margin-mobile py-10 md:px-margin-desktop md:py-16">
        <div className="pointer-events-none absolute -right-16 -top-10 h-56 w-56 rounded-full bg-secondary-container/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-10 h-48 w-48 rounded-full bg-primary-container/5 blur-3xl" />

        <header className="relative z-10 flex flex-col gap-3">
          <p className="text-caption font-medium tracking-wide text-secondary uppercase">
            Discover
          </p>
          <h1 className="text-headline-xl text-primary">Explore</h1>
          <p className="max-w-xl text-body-md text-on-surface-variant">
            Browse public shares, filter by tags and language, then fork into
            your own editor session.
          </p>
        </header>

        <div className="relative z-10">
          <ExploreGrid
            initialSnippets={snippets}
            initialQ={q}
            initialTag={tag}
            initialLanguage={language}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
