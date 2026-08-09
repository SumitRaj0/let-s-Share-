"use client";

import { useEffect, useState } from "react";
import type {
  AiAssistMode,
  AiAssistResponse,
  SnippetLanguage,
} from "@/lib/types";

export type AiAssistPanelProps = {
  open: boolean;
  onClose: () => void;
  language: SnippetLanguage;
  content: string;
  title?: string;
  /** Called when user applies a suggested title (mode=title) */
  onApplyTitle?: (title: string) => void;
  /** Pre-select a mode when opening (e.g. share page "Explain this") */
  initialMode?: AiAssistMode;
};

const MODE_OPTIONS: { mode: AiAssistMode; label: string; icon: string }[] = [
  { mode: "explain", label: "Explain", icon: "lightbulb" },
  { mode: "title", label: "Title", icon: "title" },
  { mode: "readme", label: "README", icon: "description" },
  { mode: "interview", label: "Interview Qs", icon: "quiz" },
];

export function AiAssistPanel({
  open,
  onClose,
  language,
  content,
  title,
  onApplyTitle,
  initialMode = "explain",
}: AiAssistPanelProps) {
  const [mode, setMode] = useState<AiAssistMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiAssistResponse | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    setError(null);
    setResult(null);
    setCopied(false);
  }, [open, initialMode]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function runAssist() {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          language,
          content,
          ...(title != null && title !== "" ? { title } : {}),
        }),
      });
      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          data && typeof data === "object" && "error" in data
            ? String((data as { error: unknown }).error)
            : "AI assist failed";
        throw new Error(msg);
      }
      setResult(data as AiAssistResponse);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "AI assist failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result?.text) return;
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Could not copy to clipboard");
    }
  }

  function handleApplyTitle() {
    if (!result || result.mode !== "title" || !onApplyTitle) return;
    const next = result.text.trim().split(/\r?\n/)[0]?.trim() ?? "";
    if (!next) return;
    onApplyTitle(next);
    onClose();
  }

  if (!open) return null;

  const canApplyTitle =
    result?.mode === "title" && Boolean(onApplyTitle) && result.text.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-assist-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-on-surface/30 backdrop-blur-sm"
        aria-label="Close AI assist"
        onClick={onClose}
      />

      <div className="glass-panel relative z-10 m-0 flex h-full w-full max-w-lg flex-col gap-5 overflow-hidden rounded-none p-5 shadow-[0_30px_60px_rgba(29,29,31,0.12)] sm:m-4 sm:h-auto sm:max-h-[min(90vh,720px)] sm:rounded-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="ai-assist-title"
              className="text-headline-lg text-primary"
            >
              AI assist
            </h2>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Explain, title, README, or interview questions for this share.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Assist mode"
        >
          {MODE_OPTIONS.map((opt) => {
            const active = mode === opt.mode;
            return (
              <button
                key={opt.mode}
                type="button"
                onClick={() => {
                  setMode(opt.mode);
                  setResult(null);
                  setError(null);
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-caption transition-transform hover:scale-[1.02] ${
                  active
                    ? "bg-primary text-on-primary shadow-md"
                    : "bg-surface-container-high text-on-surface"
                }`}
                aria-pressed={active}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {opt.icon}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void runAssist()}
            disabled={loading || !content.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-label-md text-on-primary shadow-md transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">
              auto_awesome
            </span>
            {loading ? "Running…" : "Run assist"}
          </button>
          {!content.trim() ? (
            <span className="text-caption text-on-surface-variant">
              Add some code first
            </span>
          ) : (
            <span className="text-caption text-on-surface-variant">
              {language}
              {title?.trim() ? ` · ${title.trim()}` : ""}
            </span>
          )}
        </div>

        {error ? (
          <p
            className="rounded-lg bg-error-container px-4 py-3 text-caption text-on-error-container"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <p className="text-label-md text-on-surface">Result</p>
            {result ? (
              <span
                className={`rounded-full px-2.5 py-0.5 text-caption ${
                  result.mocked
                    ? "bg-surface-container-high text-on-surface-variant"
                    : "bg-secondary-container/70 text-on-secondary-container"
                }`}
              >
                {result.mocked ? "Offline mock" : "Live AI"}
              </span>
            ) : null}
          </div>

          <div className="min-h-[10rem] flex-1 overflow-auto rounded-xl bg-surface-container-low/80 px-4 py-3">
            {loading ? (
              <p className="text-body-md text-on-surface-variant">
                Thinking…
              </p>
            ) : result?.text ? (
              <pre className="whitespace-pre-wrap font-sans text-body-md leading-relaxed text-on-surface">
                {result.text}
              </pre>
            ) : (
              <p className="text-body-md text-on-surface-variant">
                Choose a mode and run assist to see a suggestion here.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleCopy()}
            disabled={!result?.text}
            className="inline-flex items-center gap-2 rounded-full bg-surface-container-high px-4 py-2 text-label-md text-on-surface transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">
              content_copy
            </span>
            {copied ? "Copied" : "Copy"}
          </button>
          {canApplyTitle ? (
            <button
              type="button"
              onClick={handleApplyTitle}
              className="inline-flex items-center gap-2 rounded-full bg-secondary-container px-4 py-2 text-label-md text-on-secondary-container transition-transform hover:scale-[1.02]"
            >
              <span className="material-symbols-outlined text-[18px]">
                check
              </span>
              Apply title
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
