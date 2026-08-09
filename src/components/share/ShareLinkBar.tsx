"use client";

import { useEffect, useState } from "react";
import type { ShareSnippet } from "@/lib/types";
import { sharePath } from "@/lib/share/codes";
import { ShareControlsPanel } from "./ShareControlsPanel";
import { ShareQrCode, isLocalOnlyOrigin } from "./ShareQrCode";

type ShareLinkBarProps = {
  shareCode: string;
  shareUrl?: string;
  snippetId?: string;
  isLocked?: boolean;
  expiresAt?: string | null;
  isRevoked?: boolean;
  onControlsUpdated?: (snippet: ShareSnippet) => void;
  variant?: "dark" | "light";
  onDismiss?: () => void;
};

type Panel = "qr" | "controls" | null;

function displayHostPath(absoluteUrl: string, fallback: string): string {
  try {
    const u = new URL(absoluteUrl);
    return `${u.host}${u.pathname}`;
  } catch {
    return fallback.replace(/^https?:\/\//, "");
  }
}

export function ShareLinkBar({
  shareCode,
  shareUrl,
  snippetId,
  isLocked = false,
  expiresAt = null,
  isRevoked = false,
  onControlsUpdated,
  variant = "dark",
  onDismiss,
}: ShareLinkBarProps) {
  const path = shareUrl ?? sharePath(shareCode);
  const relativePath = path.startsWith("/") ? path : `/${path}`;
  const [absoluteUrl, setAbsoluteUrl] = useState(relativePath);
  const [copied, setCopied] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [locked, setLocked] = useState(isLocked);
  const [expires, setExpires] = useState<string | null>(expiresAt);
  const [revoked, setRevoked] = useState(isRevoked);
  const [localOnly, setLocalOnly] = useState(false);
  const dark = variant === "dark";

  useEffect(() => {
    const absolute = `${window.location.origin}${relativePath}`;
    setAbsoluteUrl(absolute);
    setLocalOnly(isLocalOnlyOrigin(window.location.origin));
  }, [relativePath]);

  useEffect(() => {
    setLocked(isLocked);
    setExpires(expiresAt);
    setRevoked(isRevoked);
  }, [isLocked, expiresAt, isRevoked]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  function handleUpdated(snippet: ShareSnippet) {
    setLocked(snippet.isLocked);
    setExpires(snippet.expiresAt);
    setRevoked(snippet.isRevoked);
    onControlsUpdated?.(snippet);
  }

  function togglePanel(next: Exclude<Panel, null>) {
    setPanel((prev) => (prev === next ? null : next));
  }

  const shell = dark
    ? "overflow-hidden rounded-xl border border-[#3c3c3c] bg-[#252526] shadow-[0_16px_48px_rgba(0,0,0,0.45)]"
    : "overflow-hidden rounded-xl border border-surface-container-high/60 bg-surface-container-lowest shadow-sm";

  const label = dark ? "text-[#858585]" : "text-on-surface-variant";
  const urlText = dark ? "text-[#e8e8e8]" : "text-on-surface";
  const btn = dark
    ? "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[12px] text-[#cccccc] transition-colors hover:bg-[#3c3c3c]"
    : "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[12px] text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary";
  const btnActive = dark
    ? "inline-flex items-center gap-1 rounded-md bg-[#3c3c3c] px-2.5 py-1.5 text-[12px] text-[#ffffff]"
    : "inline-flex items-center gap-1 rounded-md bg-surface-container-high px-2.5 py-1.5 text-[12px] text-primary";
  const primaryBtn = dark
    ? "inline-flex items-center gap-1 rounded-md bg-[#0e639c] px-3 py-1.5 text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
    : "inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-on-primary transition-opacity hover:opacity-90";

  const panelOpen = panel !== null;

  return (
    <div className={`relative w-full ${shell}`}>
      <div className="flex items-start justify-between gap-3 px-3.5 pt-3.5">
        <div className="min-w-0 flex-1">
          <p
            className={`text-[11px] font-medium tracking-[0.14em] uppercase ${label}`}
          >
            Link ready
          </p>
          <p
            className={`mt-1 truncate font-mono text-[13px] tracking-tight ${urlText}`}
            title={absoluteUrl}
          >
            {displayHostPath(absoluteUrl, relativePath)}
          </p>
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className={
              dark
                ? "shrink-0 rounded-md p-1 text-[#858585] transition-colors hover:bg-[#3c3c3c] hover:text-[#cccccc]"
                : "shrink-0 rounded-md p-1 text-on-surface-variant transition-colors hover:bg-surface-container-high"
            }
            title="Dismiss"
            aria-label="Dismiss share banner"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 px-3 pb-3 pt-3">
        <button
          type="button"
          onClick={() => void handleCopy()}
          className={primaryBtn}
        >
          <span className="material-symbols-outlined text-[16px]">
            {copied ? "check" : "content_copy"}
          </span>
          {copied ? "Copied" : "Copy link"}
        </button>

        <button
          type="button"
          onClick={() => togglePanel("qr")}
          className={panel === "qr" ? btnActive : btn}
          title="Show QR code"
          aria-label="Show QR code"
          aria-expanded={panel === "qr"}
        >
          <span className="material-symbols-outlined text-[16px]">
            qr_code_2
          </span>
          QR
        </button>

        {snippetId ? (
          <button
            type="button"
            onClick={() => togglePanel("controls")}
            className={panel === "controls" ? btnActive : btn}
            title="Link controls"
            aria-label="Open link controls"
            aria-expanded={panel === "controls"}
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            Controls
          </button>
        ) : null}

        {revoked ? (
          <span className="ml-auto text-[11px] font-medium text-[#f48771]">
            Revoked
          </span>
        ) : locked ? (
          <span className={`ml-auto text-[11px] ${label}`}>View only</span>
        ) : null}
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
          panelOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={`border-t px-3.5 py-3.5 ${
              dark
                ? "border-[#3c3c3c] bg-[#1e1e1e]"
                : "border-surface-container-high/60 bg-surface-container-low/40"
            } ${panelOpen ? "animate-[share-qr-in_280ms_ease-out]" : ""}`}
          >
            {panel === "qr" ? (
              <div className="flex flex-col items-center gap-2">
                <ShareQrCode url={absoluteUrl} size={148} />
                <p
                  className={
                    dark
                      ? "text-[11px] font-medium tracking-wide text-[#858585]"
                      : "text-caption text-on-surface-variant"
                  }
                >
                  Scan to open
                </p>
                {localOnly ? (
                  <p
                    className={
                      dark
                        ? "max-w-[16rem] text-center text-[11px] leading-snug text-[#ce9178]"
                        : "max-w-[16rem] text-center text-[11px] leading-snug text-amber-800"
                    }
                  >
                    Localhost only works on this device. Use your LAN IP or a
                    deployed URL for phone scans.
                  </p>
                ) : null}
              </div>
            ) : null}

            {panel === "controls" && snippetId ? (
              <ShareControlsPanel
                snippetId={snippetId}
                isLocked={locked}
                expiresAt={expires}
                isRevoked={revoked}
                open={panel === "controls"}
                onUpdated={handleUpdated}
                variant={variant}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
