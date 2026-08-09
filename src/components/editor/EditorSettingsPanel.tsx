"use client";

import type { SnippetLanguage } from "@/lib/types";
import { LanguageSelect } from "@/components/editor/LanguageSelect";

type EditorSettingsPanelProps = {
  open: boolean;
  onClose: () => void;
  language: SnippetLanguage;
  onLanguageChange: (language: SnippetLanguage) => void;
  disabled?: boolean;
};

/**
 * Lightweight settings drawer — language is the primary control.
 */
export function EditorSettingsPanel({
  open,
  onClose,
  language,
  onLanguageChange,
  disabled = false,
}: EditorSettingsPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close settings"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-settings-title"
        className="relative flex h-full w-full max-w-sm flex-col border-l border-[#333336] bg-[#1f1f22]"
      >
        <div className="flex items-center justify-between border-b border-[#333336] px-5 py-4">
          <h2
            id="editor-settings-title"
            className="font-display text-[17px] font-semibold tracking-tight text-[#f0f0f0]"
          >
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#8a8a8a] transition-colors hover:bg-[#2a2a2e] hover:text-[#e8e8e8]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-6 px-5 py-6">
          <div>
            <p className="mb-3 font-display text-[12px] font-semibold tracking-[0.08em] text-[#9a9a9a] uppercase">
              Editor language
            </p>
            <LanguageSelect
              id="editor-language"
              value={language}
              onChange={onLanguageChange}
              disabled={disabled}
            />
            <p className="mt-4 text-[13px] leading-relaxed text-[#7a7a7a]">
              Changes how the editor highlights and runs your code.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
