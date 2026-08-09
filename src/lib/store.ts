/** Shared ID helpers. Durable state lives in src/lib/db (SQLite). */

export function randomId(prefix = ""): string {
  const id =
    Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  return prefix ? `${prefix}_${id}` : id;
}

export function randomShareCode(length = 4): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz023456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
