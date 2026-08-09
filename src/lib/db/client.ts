/**
 * Database client for Let'sShare.
 *
 * - Turso: `@libsql/client/web` (Vercel / any host with TURSO_* env)
 * - Local without Turso: file SQLite via `./local-file-client` (not bundled on Vercel)
 */

import { createClient } from "@libsql/client/web";
import type { Client, InArgs } from "@libsql/client";
import { migrate } from "./schema";

export type Db = Client;

declare global {
  // eslint-disable-next-line no-var
  var __letsshare_db: Db | undefined;
  // eslint-disable-next-line no-var
  var __letsshare_db_migrated: boolean | undefined;
}

function toHttpUrl(url: string): string {
  if (url.startsWith("libsql://")) {
    return `https://${url.slice("libsql://".length)}`;
  }
  return url;
}

async function createDbClient(): Promise<Db> {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();

  if (tursoUrl) {
    return createClient({
      url: toHttpUrl(tursoUrl),
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Share storage needs a cloud database on Vercel. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in project env vars.",
    );
  }

  const { createLocalFileClient } = await import("./local-file-client");
  return createLocalFileClient();
}

export async function getDb(): Promise<Db> {
  if (!globalThis.__letsshare_db) {
    globalThis.__letsshare_db = await createDbClient();
  }

  const db = globalThis.__letsshare_db;
  if (!globalThis.__letsshare_db_migrated) {
    await migrate(db);
    globalThis.__letsshare_db_migrated = true;
  }
  return db;
}

export async function dbGet<T extends Record<string, unknown>>(
  sql: string,
  args: InArgs = [],
): Promise<T | undefined> {
  const db = await getDb();
  const result = await db.execute({ sql, args });
  const row = result.rows[0];
  return row ? (row as unknown as T) : undefined;
}

export async function dbAll<T extends Record<string, unknown>>(
  sql: string,
  args: InArgs = [],
): Promise<T[]> {
  const db = await getDb();
  const result = await db.execute({ sql, args });
  return result.rows as unknown as T[];
}

export async function dbRun(
  sql: string,
  args: InArgs = [],
): Promise<{ changes: number }> {
  const db = await getDb();
  const result = await db.execute({ sql, args });
  return { changes: Number(result.rowsAffected ?? 0) };
}

export async function dbExec(sql: string): Promise<void> {
  const db = await getDb();
  await db.executeMultiple(sql);
}
