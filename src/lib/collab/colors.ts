/**
 * Stable collaborator colors derived from a user id or display name.
 * Returns hex values suitable for rings, cursors, and awareness labels.
 */

const PALETTE = [
  "#E85D4C", // coral
  "#3D7EA6", // steel blue
  "#2A9D8F", // teal
  "#E9A319", // amber
  "#7B6B9C", // muted violet
  "#C45C26", // rust
  "#2D6A4F", // forest
  "#BC4B51", // rose
  "#4A6FA5", // slate blue
  "#8B5E3C", // walnut
  "#1B9AAA", // cyan
  "#D1495B", // raspberry
] as const;

export type PresenceColor = (typeof PALETTE)[number];

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Pick a stable palette color from any id/name seed. */
export function colorFromSeed(seed: string): PresenceColor {
  const key = seed.trim() || "guest";
  return PALETTE[hashSeed(key) % PALETTE.length]!;
}

/** Readable text color (near-white or near-black) for a hex background. */
export function contrastTextColor(hex: string): "#ffffff" | "#1a1c1d" {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return "#ffffff";
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  // Relative luminance (sRGB)
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.55 ? "#1a1c1d" : "#ffffff";
}
