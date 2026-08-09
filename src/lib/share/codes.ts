/** Share-code alphabet for auto-generation (readable: no i/l/1). */
export const SHARE_CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz023456789";

/** Paths that must never be treated as share codes. */
const RESERVED_SHARE_CODES = new Set([
  "api",
  "editor",
  "settings",
  "login",
  "signup",
  "share",
  "explore",
  "dashboard",
  "privacy",
  "terms",
  "s",
  "favicon",
  "robots",
  "sitemap",
  "llms",
  "_next",
]);

/** Auto + custom codes: 3–12 chars, letters/digits. */
const SHARE_CODE_RE = /^[a-z0-9]{3,12}$/;

export function normalizeShareCode(value: string): string {
  return value.trim().toLowerCase();
}

export function isReservedShareCode(value: string): boolean {
  return RESERVED_SHARE_CODES.has(normalizeShareCode(value));
}

export function isShareCodeFormat(value: string): boolean {
  const code = normalizeShareCode(value);
  return SHARE_CODE_RE.test(code) && !isReservedShareCode(code);
}

/** Canonical short path — e.g. `/0845`. */
export function sharePath(shareCode: string): string {
  return `/${normalizeShareCode(shareCode)}`;
}

/** Absolute share URL for copy / QR. */
export function absoluteShareUrl(shareCode: string, origin: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}${sharePath(shareCode)}`;
}
