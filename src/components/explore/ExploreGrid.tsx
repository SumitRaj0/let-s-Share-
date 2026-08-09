"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { ShareSnippet, SnippetLanguage } from "@/lib/types";
import { ExploreCard } from "./ExploreCard";
import { ExploreFilters } from "./ExploreFilters";

type ExploreGridProps = {
  initialSnippets: ShareSnippet[];
  initialQ?: string;
  initialTag?: string;
  initialLanguage?: string;
};

export function ExploreGrid({
  initialSnippets,
  initialQ = "",
  initialTag = "",
  initialLanguage = "",
}: ExploreGridProps) {
  const router = useRouter();
  const [snippets, setSnippets] = useState(initialSnippets);
  const [q, setQ] = useState(initialQ);
  const [tag, setTag] = useState(initialTag);
  const [language, setLanguage] = useState(initialLanguage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const availableTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const snippet of snippets) {
      for (const t of snippet.tags ?? []) {
        counts.set(t, (counts.get(t) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name]) => name);
  }, [snippets]);

  async function fetchExplore(next: {
    q: string;
    tag: string;
    language: string;
  }) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (next.q.trim()) params.set("q", next.q.trim());
      if (next.tag) params.set("tag", next.tag);
      if (next.language) params.set("language", next.language);
      params.set("limit", "48");

      const res = await fetch(`/api/snippets/explore?${params.toString()}`);
      const data = (await res.json().catch(() => null)) as {
        snippets?: ShareSnippet[];
        error?: string;
      } | null;

      if (!res.ok || !data?.snippets) {
        throw new Error(data?.error || "Failed to load explore feed");
      }

      setSnippets(data.snippets);

      const url = new URL(window.location.href);
      if (next.q.trim()) url.searchParams.set("q", next.q.trim());
      else url.searchParams.delete("q");
      if (next.tag) url.searchParams.set("tag", next.tag);
      else url.searchParams.delete("tag");
      if (next.language) url.searchParams.set("language", next.language);
      else url.searchParams.delete("language");
      startTransition(() => {
        router.replace(`${url.pathname}${url.search}`);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load explore feed");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(nextQ: string) {
    setQ(nextQ);
    void fetchExplore({ q: nextQ, tag, language });
  }

  function handleTag(nextTag: string) {
    const resolved = tag === nextTag ? "" : nextTag;
    setTag(resolved);
    void fetchExplore({ q, tag: resolved, language });
  }

  function handleLanguage(nextLanguage: string) {
    setLanguage(nextLanguage);
    void fetchExplore({ q, tag, language: nextLanguage });
  }

  function handleClear() {
    setQ("");
    setTag("");
    setLanguage("");
    void fetchExplore({ q: "", tag: "", language: "" });
  }

  return (
    <div className="flex flex-col gap-8">
      <ExploreFilters
        q={q}
        tag={tag}
        language={language as SnippetLanguage | ""}
        availableTags={availableTags}
        loading={loading || pending}
        onSearch={handleSearch}
        onTagChange={handleTag}
        onLanguageChange={handleLanguage}
        onClear={handleClear}
      />

      {error ? (
        <div className="glass-panel rounded-2xl px-5 py-4 text-body-md text-on-error-container">
          {error}
        </div>
      ) : null}

      {snippets.length === 0 ? (
        <div className="glass-panel flex flex-col items-center gap-4 rounded-2xl px-6 py-14 text-center">
          <span className="material-symbols-outlined text-[36px] text-secondary">
            travel_explore
          </span>
          <div>
            <h2 className="text-headline-lg text-primary">No snippets found</h2>
            <p className="mt-2 max-w-md text-body-md text-on-surface-variant">
              Try another search, clear filters, or share something public for
              others to discover.
            </p>
          </div>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {snippets.map((snippet) => (
            <li key={snippet.id}>
              <ExploreCard
                snippet={snippet}
                activeTag={tag}
                onTagClick={handleTag}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
