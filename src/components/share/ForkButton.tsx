"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ForkButtonProps = {
  snippetId: string;
  className?: string;
  label?: string;
};

export function ForkButton({
  snippetId,
  className = "",
  label = "Fork",
}: ForkButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFork() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/snippets/${encodeURIComponent(snippetId)}/fork`,
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
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={loading}
        onClick={() => void handleFork()}
        className={
          className ||
          "inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-outline-variant/50 bg-white/60 px-6 py-3 text-label-md text-on-surface transition-transform duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-60"
        }
      >
        <span className="material-symbols-outlined text-[18px]">
          fork_right
        </span>
        {loading ? "Forking…" : label}
      </button>
      {error ? (
        <span className="text-caption text-on-error-container">{error}</span>
      ) : null}
    </div>
  );
}
