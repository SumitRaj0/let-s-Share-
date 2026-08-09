"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "ls_announce_v1";

export function AnnouncementBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      // private mode / quota — still show once this session
    }
    setVisible(true);
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="status"
      className="relative z-[60] border-b border-white/15 bg-primary-container text-on-primary"
    >
      <div className="mx-auto flex w-full max-w-full items-start gap-3 px-margin-mobile py-2.5 md:items-center md:px-margin-desktop">
        <p className="min-w-0 flex-1 text-caption leading-relaxed md:text-label-md">
          Realtime collaboration is live — share a link and run code together in
          the editor.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-full p-1 text-on-primary/80 transition-colors hover:bg-white/15 hover:text-on-primary"
          aria-label="Dismiss announcement"
        >
          <span aria-hidden="true" className="text-[18px] leading-none">
            ×
          </span>
        </button>
      </div>
    </div>
  );
}
