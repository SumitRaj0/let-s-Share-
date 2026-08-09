/**
 * SQLite client for Let'sShare.
 * Storage choice: better-sqlite3 (file at data/letsshare.sqlite).
 * Installed better-sqlite3@11 for Node 20 compatibility.
 */

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { migrate } from "./schema";

export type Db = Database.Database;

declare global {
  // eslint-disable-next-line no-var
  var __letsshare_db: Db | undefined;
}

const DB_FILENAME = "letsshare.sqlite";

function resolveDataDir(): string {
  return path.join(process.cwd(), "data");
}

function resolveDbPath(): string {
  return path.join(resolveDataDir(), DB_FILENAME);
}

export function getDb(): Db {
  if (globalThis.__letsshare_db) {
    return globalThis.__letsshare_db;
  }

  const dataDir = resolveDataDir();
  fs.mkdirSync(dataDir, { recursive: true });

  const db = new Database(resolveDbPath());
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);

  globalThis.__letsshare_db = db;
  return db;
}
