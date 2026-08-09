"use client";

import { useMemo, useState } from "react";
import { DashboardToolbar } from "@/components/dashboard/DashboardToolbar";
import { SharesTable } from "@/components/dashboard/SharesTable";
import type { ShareSnippet } from "@/lib/types";

type DashboardShellProps = {
  initialSnippets: ShareSnippet[];
};

export function DashboardShell({ initialSnippets }: DashboardShellProps) {
  const [snippets, setSnippets] = useState<ShareSnippet[]>(initialSnippets);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return snippets;
    return snippets.filter((s) => {
      return (
        s.title.toLowerCase().includes(q) ||
        s.language.toLowerCase().includes(q) ||
        s.shareCode.toLowerCase().includes(q)
      );
    });
  }, [snippets, query]);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this share permanently?")) return;

    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/snippets/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Unable to delete share.");
      }
      setSnippets((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete share.");
    } finally {
      setDeletingId(null);
    }
  }

  const showEmptySearch = snippets.length > 0 && filtered.length === 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-headline-xl text-primary">Your shares</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">
          Search, open, or remove the snippets you own.
        </p>
      </div>

      <DashboardToolbar query={query} onQueryChange={setQuery} />

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-error/20 bg-error-container/50 px-4 py-3 text-body-md text-on-error-container"
        >
          {error}
        </div>
      ) : null}

      {showEmptySearch ? (
        <div className="glass-panel rounded-2xl px-6 py-10 text-center text-body-md text-on-surface-variant">
          No shares match “{query.trim()}”. Try a different title, language, or
          code.
        </div>
      ) : (
        <SharesTable
          snippets={filtered}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      )}
    </div>
  );
}
