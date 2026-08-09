"use client";

import { useState, type FormEvent } from "react";
import type { SnippetLanguage } from "@/lib/types";

const LANGUAGES: { value: SnippetLanguage | ""; label: string }[] = [
  { value: "", label: "All languages" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "markdown", label: "Markdown" },
  { value: "plaintext", label: "Plain text" },
];

type ExploreFiltersProps = {
  q: string;
  tag: string;
  language: SnippetLanguage | "";
  availableTags: string[];
  loading?: boolean;
  onSearch: (q: string) => void;
  onTagChange: (tag: string) => void;
  onLanguageChange: (language: string) => void;
  onClear: () => void;
};

export function ExploreFilters({
  q,
  tag,
  language,
  availableTags,
  loading = false,
  onSearch,
  onTagChange,
  onLanguageChange,
  onClear,
}: ExploreFiltersProps) {
  const [draft, setDraft] = useState(q);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSearch(draft);
  }

  const hasFilters = Boolean(q || tag || language);

  return (
    <div className="glass-panel flex flex-col gap-5 rounded-2xl p-5 md:p-6">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search snippets</span>
          <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[18px] text-on-surface-variant">
            search
          </span>
          <input
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search titles and code…"
            className="w-full rounded-full border border-outline-variant/40 bg-white/60 py-3 pr-4 pl-10 text-body-md text-on-surface outline-none transition-shadow focus:border-primary/40 focus:shadow-[0_0_0_3px_rgba(29,29,31,0.06)]"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="rounded-full border border-outline-variant/40 bg-white/60 px-4 py-3 text-label-md text-on-surface outline-none"
            aria-label="Filter by language"
          >
            {LANGUAGES.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-label-md text-on-primary transition-transform duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-60"
          >
            {loading ? "Searching…" : "Search"}
          </button>
          {hasFilters ? (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center justify-center rounded-full border border-outline-variant/50 bg-white/50 px-4 py-3 text-label-md text-on-surface-variant transition-transform duration-200 hover:scale-[1.02] active:scale-95"
            >
              Clear
            </button>
          ) : null}
        </div>
      </form>

      {availableTags.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-caption font-medium text-on-surface-variant">
            Filter by tag
          </p>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((name) => {
              const active = tag === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onTagChange(name)}
                  className={
                    active
                      ? "rounded-full bg-primary px-3 py-1.5 text-caption font-medium text-on-primary transition-transform duration-200 hover:scale-[1.02] active:scale-95"
                      : "rounded-full border border-outline-variant/40 bg-white/50 px-3 py-1.5 text-caption font-medium text-on-surface-variant transition-transform duration-200 hover:scale-[1.02] active:scale-95"
                  }
                >
                  #{name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
