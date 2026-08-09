"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { SnippetLanguage } from "@/lib/types";

const LANGUAGES: { value: SnippetLanguage; label: string; hint: string }[] = [
  { value: "javascript", label: "JavaScript", hint: "JS" },
  { value: "typescript", label: "TypeScript", hint: "TS" },
  { value: "python", label: "Python", hint: "PY" },
  { value: "html", label: "HTML", hint: "HTML" },
  { value: "css", label: "CSS", hint: "CSS" },
  { value: "json", label: "JSON", hint: "JSON" },
  { value: "markdown", label: "Markdown", hint: "MD" },
  { value: "plaintext", label: "Plain text", hint: "TXT" },
];

type LanguageSelectProps = {
  value: SnippetLanguage;
  onChange: (language: SnippetLanguage) => void;
  disabled?: boolean;
  id?: string;
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={`h-4 w-4 shrink-0 text-[#9a9a9a] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-4 w-4 text-[#4ec9b0]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Custom language picker — avoids native OS `<select>` chrome.
 */
export function LanguageSelect({
  value,
  onChange,
  disabled = false,
  id,
}: LanguageSelectProps) {
  const autoId = useId();
  const listboxId = id ?? `language-listbox-${autoId}`;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = LANGUAGES.find((l) => l.value === value) ?? LANGUAGES[0];

  useEffect(() => {
    if (!open) return;

    function onPointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(next: SnippetLanguage) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        id={listboxId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Editor language"
        onClick={() => {
          if (!disabled) setOpen((v) => !v);
        }}
        className={`flex w-full items-center gap-3 rounded-xl border bg-[#1a1a1c] px-3.5 py-3 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
          open
            ? "border-[#4ec9b0]/70 shadow-[0_0_0_3px_rgba(78,201,176,0.12)]"
            : "border-[#3a3a3c] hover:border-[#555558] hover:bg-[#1f1f22]"
        }`}
      >
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2a2a2e] font-mono text-[10px] font-semibold tracking-wide text-[#9cdcfe]">
          {selected.hint}
        </span>
        <span className="min-w-0 flex-1 font-display text-[15px] font-medium text-[#e8e8e8]">
          {selected.label}
        </span>
        <Chevron open={open} />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-labelledby={listboxId}
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-10 max-h-72 overflow-auto rounded-xl border border-[#3a3a3c] bg-[#1e1e21] p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
        >
          {LANGUAGES.map((lang) => {
            const isActive = lang.value === value;
            return (
              <li key={lang.value} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  onClick={() => pick(lang.value)}
                  className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors ${
                    isActive
                      ? "bg-[#2a2d2e] text-[#ffffff]"
                      : "text-[#c8c8c8] hover:bg-[#2a2a2e] hover:text-[#ffffff]"
                  }`}
                >
                  <span
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-semibold tracking-wide ${
                      isActive
                        ? "bg-[#0e639c]/35 text-[#9cdcfe]"
                        : "bg-[#2a2a2e] text-[#858585]"
                    }`}
                  >
                    {lang.hint}
                  </span>
                  <span className="min-w-0 flex-1 font-display text-[14px] font-medium">
                    {lang.label}
                  </span>
                  {isActive ? <CheckIcon /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
