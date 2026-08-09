"use client";

import { useState } from "react";
import type { SnippetLanguage } from "@/lib/types";
import { AiAssistPanel } from "@/components/editor/AiAssistPanel";

type ExplainThisButtonProps = {
  language: SnippetLanguage;
  content: string;
  title: string;
};

/**
 * Client island for the public share page — opens AI assist in explain mode.
 */
export function ExplainThisButton({
  language,
  content,
  title,
}: ExplainThisButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-surface-container-high px-6 py-3 text-label-md text-on-surface transition-transform duration-300 hover:scale-[1.02] active:scale-95"
      >
        <span className="material-symbols-outlined text-[18px]">lightbulb</span>
        Explain this
      </button>
      <AiAssistPanel
        open={open}
        onClose={() => setOpen(false)}
        language={language}
        content={content}
        title={title}
        initialMode="explain"
      />
    </>
  );
}
