"use client";

import { useEffect, useState } from "react";

const AUTO_DISMISS_SECONDS = 8;

type SnippetLoadErrorDialogProps = {
  message: string;
  onCancel: () => void;
};

/**
 * Shown when a share code in the URL fails to load (e.g. "Snippet not found").
 * Auto-dismisses after a short countdown; Cancel skips the wait.
 */
export function SnippetLoadErrorDialog({
  message,
  onCancel,
}: SnippetLoadErrorDialogProps) {
  const [secondsLeft, setSecondsLeft] = useState(AUTO_DISMISS_SECONDS);

  useEffect(() => {
    setSecondsLeft(AUTO_DISMISS_SECONDS);
    const tick = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(tick);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(tick);
  }, [message]);

  useEffect(() => {
    if (secondsLeft === 0) onCancel();
  }, [secondsLeft, onCancel]);

  const progress =
    ((AUTO_DISMISS_SECONDS - secondsLeft) / AUTO_DISMISS_SECONDS) * 100;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="snippet-error-title"
        aria-describedby="snippet-error-desc"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[#3a3a3c] bg-[#1f1f22] shadow-[0_24px_64px_rgba(0,0,0,0.45)]"
      >
        <div className="h-1 w-full bg-[#2a2a2e]">
          <div
            className="h-full bg-[#c45c5c] transition-[width] duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="px-6 py-6">
          <p className="font-mono text-[11px] font-semibold tracking-[0.14em] text-[#c45c5c] uppercase">
            Load failed
          </p>
          <h2
            id="snippet-error-title"
            className="mt-2 font-display text-[20px] font-semibold tracking-tight text-[#f0f0f0]"
          >
            {message || "Snippet not found"}
          </h2>
          <p
            id="snippet-error-desc"
            className="mt-3 text-[14px] leading-relaxed text-[#9a9a9a]"
          >
            This share link may be wrong, expired, or revoked. Starting a fresh
            editor in{" "}
            <span className="font-semibold text-[#cccccc] tabular-nums">
              {secondsLeft}s
            </span>
            .
          </p>

          <div className="mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center rounded-md bg-[#e8e8e8] px-4 py-2.5 text-[14px] font-semibold text-[#1a1a1a] transition-opacity hover:opacity-90"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
