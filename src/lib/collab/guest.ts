"use client";

/**
 * Guest display identity persisted for the browser tab session.
 * Used when the visitor is not signed in.
 */

const GUEST_KEY = "letsshare:guest-name";
const GUEST_ID_KEY = "letsshare:guest-id";

function randomSuffix(len = 4): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  const bytes =
    typeof crypto !== "undefined" && crypto.getRandomValues
      ? crypto.getRandomValues(new Uint8Array(len))
      : null;
  for (let i = 0; i < len; i++) {
    const n = bytes ? bytes[i]! : Math.floor(Math.random() * alphabet.length);
    out += alphabet[n % alphabet.length];
  }
  return out;
}

function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // private mode / quota — ignore
  }
}

/** Display name, stable for the tab session (`Guest-xxxx` by default). */
export function getGuestDisplayName(): string {
  const existing = readStorage(GUEST_KEY)?.trim();
  if (existing) return existing;
  const name = `Guest-${randomSuffix(4)}`;
  writeStorage(GUEST_KEY, name);
  return name;
}

/** Persist a custom guest display name for this tab session. */
export function setGuestDisplayName(name: string): string {
  const trimmed = name.trim().slice(0, 40);
  const next = trimmed || `Guest-${randomSuffix(4)}`;
  writeStorage(GUEST_KEY, next);
  return next;
}

/** Stable guest id for awareness `id` field (not the display name). */
export function getGuestId(): string {
  const existing = readStorage(GUEST_ID_KEY);
  if (existing) return existing;
  const id = `guest_${randomSuffix(8)}`;
  writeStorage(GUEST_ID_KEY, id);
  return id;
}
