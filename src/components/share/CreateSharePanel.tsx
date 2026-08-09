"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { ShareSnippet, SnippetLanguage } from "@/lib/types";
import {
  expiryPresetToIso,
  type ExpiryPreset,
} from "./ShareControlsPanel";
import { ShareLinkBar } from "./ShareLinkBar";

const LANGUAGES: { value: SnippetLanguage; label: string }[] = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "markdown", label: "Markdown" },
  { value: "plaintext", label: "Plain text" },
];

const EXPIRY_OPTIONS: { value: ExpiryPreset; label: string }[] = [
  { value: "never", label: "Never" },
  { value: "1h", label: "1 hour" },
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
];

type CreateSharePanelProps = {
  /** Where to go after create. Defaults to share page. */
  navigateTo?: "share" | "editor";
  onCreated?: (snippet: ShareSnippet, shareUrl: string) => void;
};

export function CreateSharePanel({
  navigateTo = "share",
  onCreated,
}: CreateSharePanelProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState<SnippetLanguage>("javascript");
  const [content, setContent] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [expiry, setExpiry] = useState<ExpiryPreset>("never");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    id: string;
    shareCode: string;
    shareUrl: string;
    isLocked: boolean;
    expiresAt: string | null;
    isRevoked: boolean;
  } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const expiresAt = expiryPresetToIso(expiry);
      const res = await fetch("/api/snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || undefined,
          language,
          content,
          isPublic: true,
          ownerId: user?.id ?? null,
          ownerName: user?.name ?? null,
          isLocked,
          expiresAt,
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        snippet?: ShareSnippet;
        shareUrl?: string;
        error?: string;
      } | null;

      if (!res.ok || !data?.snippet || !data.shareUrl) {
        throw new Error(data?.error || "Could not create share link");
      }

      setCreated({
        id: data.snippet.id,
        shareCode: data.snippet.shareCode,
        shareUrl: data.shareUrl,
        isLocked: data.snippet.isLocked ?? isLocked,
        expiresAt: data.snippet.expiresAt ?? expiresAt,
        isRevoked: data.snippet.isRevoked ?? false,
      });
      onCreated?.(data.snippet, data.shareUrl);

      const dest =
        navigateTo === "editor"
          ? `/editor?code=${encodeURIComponent(data.snippet.shareCode)}`
          : data.shareUrl;

      router.push(dest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel flex w-full flex-col gap-6 rounded-2xl p-6 md:p-8"
    >
      <div>
        <h2 className="text-headline-lg text-primary">Start a share</h2>
        <p className="mt-2 text-body-md text-on-surface-variant">
          Create a snippet and get a link you can send instantly.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-label-md text-on-surface">Title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled snippet"
            className="rounded-lg border-none bg-surface-container-low px-4 py-3 text-body-md text-on-surface outline-none transition-shadow focus:ring-1 focus:ring-primary/20"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-label-md text-on-surface">Language</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SnippetLanguage)}
            className="rounded-lg border-none bg-surface-container-low px-4 py-3 text-body-md text-on-surface outline-none transition-shadow focus:ring-1 focus:ring-primary/20"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-label-md text-on-surface">
            Content{" "}
            <span className="font-normal text-on-surface-variant">
              (optional)
            </span>
          </span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            spellCheck={false}
            placeholder="// Paste or write your code here"
            className="resize-y rounded-lg border-none bg-surface-container-low px-4 py-3 font-mono text-body-md text-on-surface outline-none transition-shadow focus:ring-1 focus:ring-primary/20"
          />
        </label>

        <div className="flex flex-col gap-3 rounded-xl bg-surface-container-low/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-4 sm:justify-start">
            <div>
              <p className="text-label-md text-on-surface">View only</p>
              <p className="text-caption text-on-surface-variant">
                Lock editing for recipients
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isLocked}
              onClick={() => setIsLocked((v) => !v)}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                isLocked ? "bg-primary" : "bg-surface-container-high"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  isLocked ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <label className="flex min-w-[10rem] flex-col gap-1.5">
            <span className="text-label-md text-on-surface">Expires</span>
            <select
              value={expiry}
              onChange={(e) => setExpiry(e.target.value as ExpiryPreset)}
              className="rounded-lg border-none bg-white/70 px-3 py-2 text-body-md text-on-surface outline-none transition-shadow focus:ring-1 focus:ring-primary/20"
            >
              {EXPIRY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error ? (
        <p
          className="rounded-lg bg-error-container px-4 py-3 text-caption text-on-error-container"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {created ? (
        <div className="flex flex-col gap-2">
          <span className="text-label-md text-on-surface">Your share link</span>
          <ShareLinkBar
            shareCode={created.shareCode}
            shareUrl={created.shareUrl}
            snippetId={created.id}
            isLocked={created.isLocked}
            expiresAt={created.expiresAt}
            isRevoked={created.isRevoked}
            variant="light"
          />
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-container px-8 py-4 text-label-md text-on-primary shadow-[0_8px_30px_rgba(29,29,31,0.12)] transition-transform duration-300 ease-out hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
      >
        <span className="material-symbols-outlined text-[18px]">link</span>
        {loading ? "Creating…" : "Create share link"}
      </button>
    </form>
  );
}
