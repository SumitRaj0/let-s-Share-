"use client";

import { useEffect, useState } from "react";
import type { ShareSnippet } from "@/lib/types";

export type ExpiryPreset = "1h" | "24h" | "7d" | "never";

const EXPIRY_OPTIONS: {
  value: ExpiryPreset;
  label: string;
  hint: string;
}[] = [
  { value: "1h", label: "1 hour", hint: "Short" },
  { value: "24h", label: "1 day", hint: "Today" },
  { value: "7d", label: "7 days", hint: "Week" },
  { value: "never", label: "Never", hint: "Keep" },
];

const PRESET_MS: Record<Exclude<ExpiryPreset, "never">, number> = {
  "1h": 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
};

export function expiryPresetToIso(preset: ExpiryPreset): string | null {
  if (preset === "never") return null;
  return new Date(Date.now() + PRESET_MS[preset]).toISOString();
}

export function isoToExpiryPreset(expiresAt: string | null): ExpiryPreset {
  if (!expiresAt) return "never";
  const remaining = new Date(expiresAt).getTime() - Date.now();
  if (remaining <= 0) return "1h";
  if (remaining <= 2 * PRESET_MS["1h"]) return "1h";
  if (remaining <= 2 * PRESET_MS["24h"]) return "24h";
  return "7d";
}

type ShareControlsPanelProps = {
  snippetId: string;
  isLocked?: boolean;
  expiresAt?: string | null;
  isRevoked?: boolean;
  open: boolean;
  onUpdated?: (snippet: ShareSnippet) => void;
  /** Match the parent share card. */
  variant?: "dark" | "light";
};

/**
 * Inline link controls — expands inside the share card (no separate modal).
 */
export function ShareControlsPanel({
  snippetId,
  isLocked: initialLocked = false,
  expiresAt: initialExpiresAt = null,
  isRevoked: initialRevoked = false,
  open,
  onUpdated,
  variant = "dark",
}: ShareControlsPanelProps) {
  const [isLocked, setIsLocked] = useState(initialLocked);
  const [expiry, setExpiry] = useState<ExpiryPreset>(
    isoToExpiryPreset(initialExpiresAt),
  );
  const [isRevoked, setIsRevoked] = useState(initialRevoked);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dark = variant === "dark";

  useEffect(() => {
    if (!open) return;
    setIsLocked(initialLocked);
    setExpiry(isoToExpiryPreset(initialExpiresAt));
    setIsRevoked(initialRevoked);
    setError(null);
  }, [open, initialLocked, initialExpiresAt, initialRevoked]);

  async function patchControls(body: {
    isLocked?: boolean;
    expiresAt?: string | null;
    isRevoked?: boolean;
  }) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/snippets/${encodeURIComponent(snippetId)}/controls`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = (await res.json().catch(() => null)) as {
        snippet?: ShareSnippet;
        error?: string;
      } | null;
      if (!res.ok || !data?.snippet) {
        throw new Error(data?.error || "Could not update share controls");
      }
      onUpdated?.(data.snippet);
      return data.snippet;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleLockToggle() {
    if (isRevoked || saving) return;
    const next = !isLocked;
    setIsLocked(next);
    const snippet = await patchControls({ isLocked: next });
    if (!snippet) setIsLocked(!next);
  }

  async function handleExpiryChange(preset: ExpiryPreset) {
    if (isRevoked || saving || preset === expiry) return;
    const prev = expiry;
    setExpiry(preset);
    const snippet = await patchControls({
      expiresAt: expiryPresetToIso(preset),
    });
    if (!snippet) setExpiry(prev);
  }

  async function handleRevoke() {
    if (isRevoked || saving) return;
    const ok = window.confirm(
      "Revoke this link? Anyone with it will lose access. This cannot be undone.",
    );
    if (!ok) return;
    const snippet = await patchControls({ isRevoked: true });
    if (snippet) setIsRevoked(true);
  }

  const row = dark
    ? "rounded-lg border border-[#3c3c3c] bg-[#252526] px-3 py-3"
    : "rounded-lg border border-surface-container-high/50 bg-surface-container-low/70 px-3 py-3";
  const title = dark ? "text-[13px] font-semibold text-[#e8e8e8]" : "text-[13px] font-semibold text-on-surface";
  const hint = dark ? "text-[11px] leading-snug text-[#858585]" : "text-[11px] leading-snug text-on-surface-variant";
  const chip = dark
    ? "rounded-md px-2.5 py-1.5 text-[12px] text-[#cccccc] transition-colors hover:bg-[#3c3c3c] disabled:opacity-40"
    : "rounded-md px-2.5 py-1.5 text-[12px] text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-40";
  const chipOn = dark
    ? "rounded-md bg-[#0e639c] px-2.5 py-1.5 text-[12px] font-semibold text-white"
    : "rounded-md bg-primary px-2.5 py-1.5 text-[12px] font-semibold text-on-primary";

  return (
    <div className="flex flex-col gap-3">
      <p className={hint}>
        Manage who can edit this link and how long it stays open.
      </p>

      {isRevoked ? (
        <div
          className={
            dark
              ? "rounded-lg border border-[#5a1d1d] bg-[#3a1515] px-3 py-2.5 text-[12px] text-[#f48771]"
              : "rounded-lg bg-error-container px-3 py-2.5 text-[12px] text-on-error-container"
          }
          role="status"
        >
          This link is revoked. It can no longer be opened.
        </div>
      ) : null}

      {/* View only */}
      <div className={`flex items-center justify-between gap-3 ${row}`}>
        <div className="min-w-0">
          <p className={title}>View only</p>
          <p className={`mt-0.5 ${hint}`}>
            Others can read the code, but cannot edit it.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isLocked}
          aria-label="View only"
          disabled={isRevoked || saving}
          onClick={() => void handleLockToggle()}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isLocked
              ? dark
                ? "bg-[#0e639c]"
                : "bg-primary"
              : dark
                ? "bg-[#3c3c3c]"
                : "bg-surface-container-high"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${
              isLocked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Expires */}
      <div className={row}>
        <p className={title}>Link expires</p>
        <p className={`mt-0.5 ${hint}`}>
          After this time, the share link stops working.
        </p>
        <div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {EXPIRY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={isRevoked || saving}
              onClick={() => void handleExpiryChange(opt.value)}
              className={expiry === opt.value ? chipOn : chip}
              title={opt.hint}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Revoke */}
      <div className={row}>
        <p className={title}>Revoke link</p>
        <p className={`mt-0.5 ${hint}`}>
          Permanently disable this link for everyone.
        </p>
        <button
          type="button"
          disabled={isRevoked || saving}
          onClick={() => void handleRevoke()}
          className={
            dark
              ? "mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-[#5a1d1d] bg-[#3a1515] px-3 py-2 text-[12px] font-semibold text-[#f48771] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              : "mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-error-container bg-error-container/50 px-3 py-2 text-[12px] font-semibold text-on-error-container transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          }
        >
          <span className="material-symbols-outlined text-[16px]">
            link_off
          </span>
          {isRevoked ? "Already revoked" : "Revoke now"}
        </button>
      </div>

      {error ? (
        <p
          className={
            dark
              ? "rounded-lg bg-[#3a1515] px-3 py-2 text-[12px] text-[#f48771]"
              : "rounded-lg bg-error-container px-3 py-2 text-[12px] text-on-error-container"
          }
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {saving ? (
        <p className={`text-center ${hint}`}>Saving…</p>
      ) : null}
    </div>
  );
}
