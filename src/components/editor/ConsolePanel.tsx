"use client";

import { useState } from "react";

type ConsolePanelProps = {
  logs: string[];
  onClear: () => void;
  onClose: () => void;
  shared?: boolean;
  running?: boolean;
};

/** Side output panel — slides in beside the editor after Run. */
export function ConsolePanel({
  logs,
  onClear,
  onClose,
  shared = false,
  running = false,
}: ConsolePanelProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = logs.join("\n").trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be denied — ignore quietly
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-[#181818]">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#2f2f2f] bg-[#252526] px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-[11px] font-medium tracking-[0.14em] text-[#858585] uppercase">
            Output
          </span>
          {running ? (
            <span className="text-[12px] text-[#9cdcfe]">Running…</span>
          ) : null}
          {shared ? (
            <span
              className="truncate rounded bg-[#094771] px-2 py-0.5 text-[11px] text-[#9cdcfe]"
              title="Console lines sync live across this share link"
            >
              Live
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => void handleCopy()}
            disabled={logs.length === 0}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[12px] text-[#858585] transition-colors hover:bg-[#3c3c3c] hover:text-[#cccccc] disabled:cursor-not-allowed disabled:opacity-40"
            title="Copy output"
          >
            <span className="material-symbols-outlined text-[16px]">
              {copied ? "check" : "content_copy"}
            </span>
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-md px-2.5 py-1.5 text-[12px] text-[#858585] transition-colors hover:bg-[#3c3c3c] hover:text-[#cccccc]"
            title="Clear output"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-md border border-[#3c3c3c] px-2.5 py-1.5 text-[12px] font-medium text-[#cccccc] transition-colors hover:bg-[#3c3c3c]"
            title="Close output and restore editor"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
            Close
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 font-mono text-[13px] leading-relaxed text-[#cccccc]">
        {logs.length === 0 ? (
          <p className="text-[#858585]">
            {running ? "Waiting for output…" : "No output yet."}
          </p>
        ) : (
          logs.map((line, i) => (
            <div
              key={`${i}-${line.slice(0, 24)}`}
              className="whitespace-pre-wrap wrap-break-word"
            >
              <span className="text-[#858585]">&gt; </span>
              {i === logs.length - 1 ? (
                <span className="text-[#dcdcaa]">{line}</span>
              ) : (
                line
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
