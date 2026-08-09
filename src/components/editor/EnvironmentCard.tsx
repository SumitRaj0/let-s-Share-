"use client";

import type { SnippetLanguage } from "@/lib/types";

type EnvironmentCardProps = {
  language: SnippetLanguage;
};

const ENV_BY_LANGUAGE: Record<
  SnippetLanguage,
  { runtime: string; chips: string[] }
> = {
  javascript: { runtime: "Node.js v18.16.0", chips: ["ES6", "Strict"] },
  typescript: { runtime: "TypeScript 5.x", chips: ["Strict", "ESNext"] },
  python: { runtime: "Python 3.12", chips: ["CPython", "UTF-8"] },
  html: { runtime: "Browser DOM", chips: ["HTML5", "Sandbox"] },
  css: { runtime: "CSSOM preview", chips: ["Modern", "Cascade"] },
  json: { runtime: "JSON parser", chips: ["UTF-8", "Strict"] },
  markdown: { runtime: "Markdown preview", chips: ["GFM", "Safe"] },
  plaintext: { runtime: "Plain buffer", chips: ["UTF-8"] },
};

export function EnvironmentCard({ language }: EnvironmentCardProps) {
  const env = ENV_BY_LANGUAGE[language];

  return (
    <div className="flex h-48 flex-col justify-between rounded-xl p-6 glass-panel">
      <div>
        <h3 className="mb-2 text-label-md font-semibold text-on-surface">
          Environment
        </h3>
        <p className="text-caption text-on-surface-variant">
          {env.runtime}
          <br />
          Memory Usage: 42MB
        </p>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {env.chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-surface-container-high px-3 py-1 text-caption text-on-surface"
            >
              {chip}
            </span>
          ))}
        </div>
        <span
          className="text-outline"
          title="Environment settings (preview)"
          aria-hidden
        >
          <span className="material-symbols-outlined">settings</span>
        </span>
      </div>
    </div>
  );
}
