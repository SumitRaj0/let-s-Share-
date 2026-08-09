import type { User } from "@/lib/types";
import { randomId } from "@/lib/store";
import { dbGet, dbRun } from "./client";

export type UserRecord = User & { passwordHash: string };

type UserRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
};

function rowToRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
    passwordHash: row.password_hash,
  };
}

function toPublicUser(record: UserRecord): User {
  return {
    id: record.id,
    email: record.email,
    name: record.name,
    createdAt: record.createdAt,
  };
}

export async function createUser(input: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<User> {
  const id = randomId("user");
  const createdAt = new Date().toISOString();
  const email = input.email.trim().toLowerCase();

  await dbRun(
    `INSERT INTO users (id, email, name, password_hash, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, email, input.name, input.passwordHash, createdAt],
  );

  return { id, email, name: input.name, createdAt };
}

export async function findUserByEmail(
  email: string,
): Promise<UserRecord | null> {
  const row = await dbGet<UserRow>(
    `SELECT id, email, name, password_hash, created_at
     FROM users WHERE email = ? COLLATE NOCASE`,
    [email.trim().toLowerCase()],
  );
  return row ? rowToRecord(row) : null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const row = await dbGet<UserRow>(
    `SELECT id, email, name, password_hash, created_at
     FROM users WHERE id = ?`,
    [id],
  );
  return row ? rowToRecord(row) : null;
}

export async function getPublicUserById(id: string): Promise<User | null> {
  const record = await findUserById(id);
  return record ? toPublicUser(record) : null;
}

export async function emailExists(email: string): Promise<boolean> {
  const row = await dbGet<{ ok: number }>(
    `SELECT 1 AS ok FROM users WHERE email = ? COLLATE NOCASE`,
    [email.trim().toLowerCase()],
  );
  return Boolean(row);
}
