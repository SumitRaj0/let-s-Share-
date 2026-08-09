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

type SnippetMetaProps = {
  snippet: Pick<
    ShareSnippet,
    "title" | "language" | "ownerName" | "viewCount"
  >;
  className?: string;
};

export function SnippetMeta({ snippet, className = "" }: SnippetMetaProps) {
  const owner = snippet.ownerName?.trim() || "Anonymous";

  return (
    <div className={`flex flex-col gap-2 ${className}`.trim()}>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-headline-lg text-primary">{snippet.title}</h1>
        <span className="rounded-full bg-secondary-container px-3 py-1 text-caption font-medium text-on-secondary-container">
          {LANGUAGE_LABELS[snippet.language]}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-caption text-on-surface-variant">
        <span className="inline-flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">person</span>
          {owner}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">visibility</span>
          {snippet.viewCount.toLocaleString()}{" "}
          {snippet.viewCount === 1 ? "view" : "views"}
        </span>
      </div>
    </div>
  );
}
