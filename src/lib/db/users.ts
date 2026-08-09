import type { User } from "@/lib/types";
import { randomId } from "@/lib/store";
import { getDb } from "./client";

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

export function createUser(input: {
  email: string;
  name: string;
  passwordHash: string;
}): User {
  const id = randomId("user");
  const createdAt = new Date().toISOString();
  const email = input.email.trim().toLowerCase();

  getDb()
    .prepare(
      `INSERT INTO users (id, email, name, password_hash, created_at)
       VALUES (@id, @email, @name, @password_hash, @created_at)`,
    )
    .run({
      id,
      email,
      name: input.name,
      password_hash: input.passwordHash,
      created_at: createdAt,
    });

  return { id, email, name: input.name, createdAt };
}

export function findUserByEmail(email: string): UserRecord | null {
  const row = getDb()
    .prepare(
      `SELECT id, email, name, password_hash, created_at
       FROM users WHERE email = ? COLLATE NOCASE`,
    )
    .get(email.trim().toLowerCase()) as UserRow | undefined;
  return row ? rowToRecord(row) : null;
}

export function findUserById(id: string): UserRecord | null {
  const row = getDb()
    .prepare(
      `SELECT id, email, name, password_hash, created_at
       FROM users WHERE id = ?`,
    )
    .get(id) as UserRow | undefined;
  return row ? rowToRecord(row) : null;
}

export function getPublicUserById(id: string): User | null {
  const record = findUserById(id);
  return record ? toPublicUser(record) : null;
}

export function emailExists(email: string): boolean {
  const row = getDb()
    .prepare(`SELECT 1 AS ok FROM users WHERE email = ? COLLATE NOCASE`)
    .get(email.trim().toLowerCase()) as { ok: number } | undefined;
  return Boolean(row);
}
