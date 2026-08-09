"use client";

import Link from "next/link";
import { ForkButton } from "@/components/share/ForkButton";
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

type SharesTableProps = {
  snippets: ShareSnippet[];
  loading?: boolean;
  onDelete: (id: string) => void;
  deletingId?: string | null;
};

function isExpired(snippet: ShareSnippet): boolean {
  if (!snippet.expiresAt) return false;
  return new Date(snippet.expiresAt).getTime() <= Date.now();
}

function formatUpdatedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function SharesTable({
  snippets,
  loading = false,
  onDelete,
  deletingId = null,
}: SharesTableProps) {
  if (loading) {
    return (
      <div className="glass-panel rounded-2xl px-6 py-12 text-center text-body-md text-on-surface-variant">
        Loading your shares…
      </div>
    );
  }

  if (snippets.length === 0) {
    return (
      <div className="glass-panel flex flex-col items-center gap-5 rounded-2xl px-6 py-14 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary-container/40 text-secondary">
          <span className="material-symbols-outlined text-[28px]">
            folder_open
          </span>
        </div>
        <div>
          <h2 className="text-headline-lg text-primary">No shares yet</h2>
          <p className="mt-2 max-w-sm text-body-md text-on-surface-variant">
            Create a share link to start collecting views and collaborating.
          </p>
        </div>
        <Link
          href="/share"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-container px-6 py-3 text-label-md text-on-primary shadow-[0_4px_14px_0_rgba(29,29,31,0.1)] transition-transform duration-300 ease-out hover:scale-[1.02] active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Create your first share
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {snippets.map((snippet) => {
        const expired = isExpired(snippet);
        const busy = deletingId === snippet.id;

        return (
          <li key={snippet.id}>
            <article className="glass-panel flex flex-col gap-4 rounded-xl px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-label-md font-semibold text-on-surface">
                    {snippet.title}
                  </h3>
                  {snippet.isLocked ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-surface-container-high px-2 py-0.5 text-caption text-on-surface-variant">
                      <span className="material-symbols-outlined text-[14px]">
                        lock
                      </span>
                      Locked
                    </span>
                  ) : null}
                  {expired ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-error-container px-2 py-0.5 text-caption text-on-error-container">
                      <span className="material-symbols-outlined text-[14px]">
                        schedule
                      </span>
                      Expired
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-on-surface-variant">
                  <span>{LANGUAGE_LABELS[snippet.language]}</span>
                  <span className="font-mono tracking-wide">
                    {snippet.shareCode}
                  </span>
                  <span>
                    {snippet.viewCount}{" "}
                    {snippet.viewCount === 1 ? "view" : "views"}
                  </span>
                  <span>Updated {formatUpdatedAt(snippet.updatedAt)}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                <Link
                  href={`/editor?code=${encodeURIComponent(snippet.shareCode)}`}
                  className="inline-flex items-center gap-1 rounded-full border border-outline-variant/50 bg-white/50 px-4 py-2 text-caption font-medium text-on-surface transition-transform duration-200 hover:scale-[1.02] active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    code
                  </span>
                  Editor
                </Link>
                <Link
                  href={`/${snippet.shareCode}`}
                  className="inline-flex items-center gap-1 rounded-full border border-outline-variant/50 bg-white/50 px-4 py-2 text-caption font-medium text-secondary transition-transform duration-200 hover:scale-[1.02] active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    link
                  </span>
                  Public
                </Link>
                {snippet.isPublic && !snippet.isRevoked && !expired ? (
                  <ForkButton
                    snippetId={snippet.id}
                    label="Fork"
                    className="inline-flex items-center gap-1 rounded-full border border-outline-variant/50 bg-white/50 px-4 py-2 text-caption font-medium text-on-surface transition-transform duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-60"
                  />
                ) : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onDelete(snippet.id)}
                  className="inline-flex items-center gap-1 rounded-full border border-error/20 bg-error-container/40 px-4 py-2 text-caption font-medium text-on-error-container transition-transform duration-200 hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    delete
                  </span>
                  {busy ? "Deleting…" : "Delete"}
                </button>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
