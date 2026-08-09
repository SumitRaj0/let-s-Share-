import type { AuthSession, User } from "@/lib/types";
import { randomId } from "@/lib/store";
import { getDb } from "./client";

type SessionRow = {
  token: string;
  user_id: string;
  email: string;
  name: string;
  expires_at: string;
};

function rowToSession(row: SessionRow): AuthSession {
  return {
    token: row.token,
    userId: row.user_id,
    email: row.email,
    name: row.name,
    expiresAt: row.expires_at,
  };
}

export function createSessionRecord(
  user: User,
  maxAgeSeconds: number,
): AuthSession {
  const token = randomId("sess");
  const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000).toISOString();

  getDb()
    .prepare(
      `INSERT INTO sessions (token, user_id, email, name, expires_at)
       VALUES (@token, @user_id, @email, @name, @expires_at)`,
    )
    .run({
      token,
      user_id: user.id,
      email: user.email,
      name: user.name,
      expires_at: expiresAt,
    });

  return {
    token,
    userId: user.id,
    email: user.email,
    name: user.name,
    expiresAt,
  };
}

export function getSessionByToken(token: string): AuthSession | null {
  const row = getDb()
    .prepare(
      `SELECT token, user_id, email, name, expires_at
       FROM sessions WHERE token = ?`,
    )
    .get(token) as SessionRow | undefined;
  return row ? rowToSession(row) : null;
}

export function deleteSession(token: string): void {
  getDb().prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
}

export function deleteExpiredSessions(): void {
  getDb()
    .prepare(`DELETE FROM sessions WHERE expires_at <= ?`)
    .run(new Date().toISOString());
}
