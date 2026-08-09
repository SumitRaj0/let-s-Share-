"use client";

import type { SnippetLanguage } from "@/lib/types";

export const EXT_BY_LANGUAGE: Record<SnippetLanguage, string> = {
  javascript: "js",
  typescript: "ts",
  python: "py",
  html: "html",
  css: "css",
  json: "json",
  markdown: "md",
  plaintext: "txt",
};

export function buildDownloadFilename(
  title: string,
  language: SnippetLanguage,
): string {
  const base = title.trim() || "index";
  const safe =
    base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "index";
  if (/\.\w+$/.test(safe)) return safe;
  return `${safe}.${EXT_BY_LANGUAGE[language]}`;
}

type DownloadButtonProps = {
  content: string;
  title: string;
  language: SnippetLanguage;
  disabled?: boolean;
};

export function DownloadButton({
  content,
  title,
  language,
  disabled = false,
}: DownloadButtonProps) {
  function handleDownload() {
    const filename = buildDownloadFilename(title, language);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={disabled}
      className="flex items-center gap-2 rounded-full bg-surface-container-high px-4 py-2 text-label-md text-on-surface transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
      title={`Download ${buildDownloadFilename(title, language)}`}
      aria-label="Download current file"
    >
      <span className="material-symbols-outlined text-[18px]">download</span>
      Download
    </button>
  );
}
