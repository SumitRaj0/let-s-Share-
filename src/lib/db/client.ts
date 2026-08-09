/**
 * Database client for Let'sShare.
 *
 * - Local/dev: libSQL file at `data/letsshare.sqlite`
 * - Production (Vercel): Turso via TURSO_DATABASE_URL + TURSO_AUTH_TOKEN
 *
 * File SQLite cannot persist on Vercel serverless — cloud DB is required there.
 */

import fs from "node:fs";
import path from "node:path";
import { createClient as createNodeClient } from "@libsql/client";
import { createClient as createWebClient } from "@libsql/client/web";
import type { Client, InArgs } from "@libsql/client";
import { migrate } from "./schema";

export type Db = Client;

declare global {
  // eslint-disable-next-line no-var
  var __letsshare_db: Db | undefined;
  // eslint-disable-next-line no-var
  var __letsshare_db_migrated: boolean | undefined;
}

/** Web/HTTP client is required on Vercel serverless (no native libsql binary). */
function toHttpUrl(url: string): string {
  if (url.startsWith("libsql://")) {
    return `https://${url.slice("libsql://".length)}`;
  }
  return url;
}

function createDbClient(): Db {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();

  if (tursoUrl) {
    return createWebClient({
      url: toHttpUrl(tursoUrl),
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Share storage needs a cloud database on Vercel. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in project env vars.",
    );
  }

  const dataDir = path.join(process.cwd(), "data");
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, "letsshare.sqlite").replace(/\\/g, "/");
  return createNodeClient({ url: `file:${dbPath}` });
}

export async function getDb(): Promise<Db> {
  if (!globalThis.__letsshare_db) {
    globalThis.__letsshare_db = createDbClient();
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
