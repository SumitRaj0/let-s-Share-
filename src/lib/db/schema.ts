import type { Client } from "@libsql/client";

const SCHEMA_VERSION = 4;

/**
 * Turso remote rejects `PRAGMA user_version = N` (HTTP 400), so version is
 * stored in a normal table instead of SQLite's user_version pragma.
 */
async function getSchemaVersion(db: Client): Promise<number> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_meta (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      version INTEGER NOT NULL
    )
  `);
  const result = await db.execute(
    "SELECT version FROM schema_meta WHERE id = 1",
  );
  const row = result.rows[0] as { version?: number | bigint } | undefined;
  return Number(row?.version ?? 0);
}

async function setSchemaVersion(db: Client, version: number): Promise<void> {
  await db.execute({
    sql: `
      INSERT INTO schema_meta (id, version) VALUES (1, ?)
      ON CONFLICT(id) DO UPDATE SET version = excluded.version
    `,
    args: [version],
  });
}

export async function migrate(db: Client): Promise<void> {
  const current = await getSchemaVersion(db);

  if (current < 1) {
    await db.executeMultiple(`
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
    await setSchemaVersion(db, 1);
  }

  if ((await getSchemaVersion(db)) < 2) {
    await db.executeMultiple(`
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
    await setSchemaVersion(db, 2);
  }

  if ((await getSchemaVersion(db)) < 3) {
    try {
      await db.execute(`
        ALTER TABLE snippets
          ADD COLUMN tags TEXT NOT NULL DEFAULT '[]';
      `);
    } catch {
      // Column may already exist on reused DBs.
    }
    await setSchemaVersion(db, 3);
  }

  if ((await getSchemaVersion(db)) < 4) {
    await db.executeMultiple(`
      CREATE TABLE IF NOT EXISTS room_collab (
        share_code TEXT PRIMARY KEY NOT NULL COLLATE NOCASE,
        yjs_state TEXT NOT NULL DEFAULT '',
        peers_json TEXT NOT NULL DEFAULT '[]',
        updated_at TEXT NOT NULL
      );
    `);
    await setSchemaVersion(db, SCHEMA_VERSION);
  }
}
