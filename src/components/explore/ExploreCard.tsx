"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ShareSnippet, SnippetLanguage } from "@/lib/types";

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

type ExploreCardProps = {
  snippet: ShareSnippet;
  activeTag?: string;
  onTagClick?: (tag: string) => void;
};

export function ExploreCard({
  snippet,
  activeTag,
  onTagClick,
}: ExploreCardProps) {
  const router = useRouter();
  const [forking, setForking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = snippet.content.trim().slice(0, 160);
  const owner = snippet.ownerName?.trim() || "Anonymous";

  async function handleFork() {
    setForking(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/snippets/${encodeURIComponent(snippet.id)}/fork`,
        { method: "POST" },
      );
      const data = (await res.json().catch(() => null)) as {
        shareCode?: string;
        editorUrl?: string;
        error?: string;
      } | null;

      if (!res.ok || !data?.shareCode) {
        throw new Error(data?.error || "Could not fork snippet");
      }

      router.push(
        data.editorUrl ??
          `/editor?code=${encodeURIComponent(data.shareCode)}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not fork snippet");
      setForking(false);
    }
  }

  return (
    <article className="glass-panel flex h-full flex-col gap-4 rounded-2xl p-5 transition-transform duration-300 hover:scale-[1.01]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/${snippet.shareCode}`}
            className="block truncate text-label-md font-semibold text-on-surface transition-colors hover:text-primary"
          >
            {snippet.title}
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-on-surface-variant">
            <span>{LANGUAGE_LABELS[snippet.language]}</span>
            <span>{owner}</span>
            <span>
              {snippet.viewCount}{" "}
              {snippet.viewCount === 1 ? "view" : "views"}
            </span>
          </div>
        </div>
      </div>

      <pre className="max-h-28 overflow-hidden whitespace-pre-wrap rounded-xl bg-white/50 p-3 font-mono text-xs leading-relaxed text-on-surface-variant">
        {preview || "(empty snippet)"}
        {snippet.content.trim().length > 160 ? "…" : ""}
      </pre>

      {(snippet.tags?.length ?? 0) > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {snippet.tags.map((t) => {
            const active = activeTag === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => onTagClick?.(t)}
                className={
                  active
                    ? "rounded-full bg-secondary-container px-2.5 py-1 text-caption font-medium text-on-secondary-container"
                    : "rounded-full bg-surface-container-high/60 px-2.5 py-1 text-caption font-medium text-on-surface-variant transition-colors hover:bg-secondary-container/50"
                }
              >
                #{t}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-2">
        <Link
          href={`/${snippet.shareCode}`}
          className="inline-flex items-center gap-1 rounded-full border border-outline-variant/50 bg-white/50 px-4 py-2 text-caption font-medium text-on-surface transition-transform duration-200 hover:scale-[1.02] active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px]">
            visibility
          </span>
          View
        </Link>
        <button
          type="button"
          disabled={forking}
          onClick={() => void handleFork()}
          className="inline-flex items-center gap-1 rounded-full bg-primary-container px-4 py-2 text-caption font-medium text-on-primary transition-transform duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-[16px]">
            fork_right
          </span>
          {forking ? "Forking…" : "Fork"}
        </button>
      </div>

      {error ? (
        <p className="text-caption text-on-error-container">{error}</p>
      ) : null}
    </article>
  );
}
