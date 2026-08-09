import { cookies } from "next/headers";
import type { AuthSession, User } from "@/lib/types";
import {
  createSessionRecord,
  deleteSession,
  getSessionByToken,
} from "@/lib/db/sessions";
import { getPublicUserById } from "@/lib/db/users";

export const SESSION_COOKIE = "ls_session";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function cookieOptions(maxAge?: number) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    ...(typeof maxAge === "number" ? { maxAge } : {}),
  };
}

export async function createSession(user: User): Promise<AuthSession> {
  const session = createSessionRecord(user, SESSION_MAX_AGE_SECONDS);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, session.token, cookieOptions(SESSION_MAX_AGE_SECONDS));

  return session;
}

export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = getSessionByToken(token);
  if (!session) return null;

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    deleteSession(token);
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  return session;
}

export async function getSessionUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  return getPublicUserById(session.userId);
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    deleteSession(token);
  }

  cookieStore.set(SESSION_COOKIE, "", cookieOptions(0));
}
