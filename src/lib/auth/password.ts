import { createHash } from "node:crypto";

/** MVP password hash — sha256 hex. Not suitable for production. */
export function hashPassword(password: string): string {
  return createHash("sha256").update(password, "utf8").digest("hex");
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  return hashPassword(password) === passwordHash;
}
