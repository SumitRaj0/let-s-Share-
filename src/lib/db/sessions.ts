import type { AuthSession, User } from "@/lib/types";
import { randomId } from "@/lib/store";
import { dbGet, dbRun } from "./client";

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

export async function createSessionRecord(
  user: User,
  maxAgeSeconds: number,
): Promise<AuthSession> {
  const token = randomId("sess");
  const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000).toISOString();

  await dbRun(
    `INSERT INTO sessions (token, user_id, email, name, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [token, user.id, user.email, user.name, expiresAt],
  );

  return {
    token,
    userId: user.id,
    email: user.email,
    name: user.name,
    expiresAt,
  };
}

export async function getSessionByToken(
  token: string,
): Promise<AuthSession | null> {
  const row = await dbGet<SessionRow>(
    `SELECT token, user_id, email, name, expires_at
     FROM sessions WHERE token = ?`,
    [token],
  );
  return row ? rowToSession(row) : null;
}

export async function deleteSession(token: string): Promise<void> {
  await dbRun(`DELETE FROM sessions WHERE token = ?`, [token]);
}

export async function deleteExpiredSessions(): Promise<void> {
  await dbRun(`DELETE FROM sessions WHERE expires_at <= ?`, [
    new Date().toISOString(),
  ]);
}
