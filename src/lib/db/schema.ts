import type { Db } from "./client";

const SCHEMA_VERSION = 3;

export function migrate(db: Db): void {
  const row = db.pragma("user_version", { simple: true }) as number;
  const current = typeof row === "number" ? row : 0;

  if (current < 1) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

      CREATE TABLE IF NOT EXISTS snippets (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        language TEXT NOT NULL,
        content TEXT NOT NULL,
        owner_id TEXT,
        owner_name TEXT,
        is_public INTEGER NOT NULL DEFAULT 1,
        share_code TEXT NOT NULL UNIQUE COLLATE NOCASE,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        view_count INTEGER NOT NULL DEFAULT 0,
        is_locked INTEGER NOT NULL DEFAULT 0,
        expires_at TEXT,
        is_revoked INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_snippets_owner_id ON snippets(owner_id);
      CREATE INDEX IF NOT EXISTS idx_snippets_is_public ON snippets(is_public);
      CREATE INDEX IF NOT EXISTS idx_snippets_created_at ON snippets(created_at);
    `);
    db.pragma("user_version = 1");
  }

  if (current < 2) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS room_settings (
        share_code TEXT PRIMARY KEY NOT NULL COLLATE NOCASE,
        snippet_id TEXT NOT NULL,
        interview_mode INTEGER NOT NULL DEFAULT 0,
        default_join_role TEXT NOT NULL DEFAULT 'editor',
        kicked_client_ids TEXT NOT NULL DEFAULT '[]',
        updated_at TEXT NOT NULL,
        FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_room_settings_snippet_id
        ON room_settings(snippet_id);
    `);
    db.pragma("user_version = 2");
  }

  if (current < 3) {
    db.exec(`
      ALTER TABLE snippets
        ADD COLUMN tags TEXT NOT NULL DEFAULT '[]';
    `);
    db.pragma(`user_version = ${SCHEMA_VERSION}`);
  }
}
