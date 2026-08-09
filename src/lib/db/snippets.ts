import type {
  CreateSnippetInput,
  ShareSnippet,
  SnippetLanguage,
  UpdateSnippetInput,
} from "@/lib/types";
import { randomId, randomShareCode } from "@/lib/store";
import {
  isShareCodeFormat,
  normalizeShareCode,
} from "@/lib/share/codes";
import { getDb } from "./client";

const DEFAULT_TITLE = "Untitled snippet";
const DEFAULT_LANGUAGE: SnippetLanguage = "javascript";
const MAX_TAGS = 20;

type SnippetRow = {
  id: string;
  title: string;
  language: string;
  content: string;
  owner_id: string | null;
  owner_name: string | null;
  is_public: number;
  share_code: string;
  created_at: string;
  updated_at: string;
  view_count: number;
  is_locked: number;
  expires_at: string | null;
  is_revoked: number;
  tags?: string | null;
};

export type ListExploreOptions = {
  q?: string;
  tag?: string;
  language?: string;
  limit?: number;
};

function normalizeTags(tags?: string[] | null): string[] {
  if (!tags || !Array.isArray(tags)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    if (typeof raw !== "string") continue;
    const slug = raw
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push(slug);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return normalizeTags(Array.isArray(parsed) ? (parsed as string[]) : []);
  } catch {
    return [];
  }
}

function serializeTags(tags: string[]): string {
  return JSON.stringify(tags);
}

function rowToSnippet(row: SnippetRow): ShareSnippet {
  return {
    id: row.id,
    title: row.title,
    language: row.language as SnippetLanguage,
    content: row.content,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    isPublic: Boolean(row.is_public),
    shareCode: row.share_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    viewCount: row.view_count,
    isLocked: Boolean(row.is_locked),
    expiresAt: row.expires_at,
    isRevoked: Boolean(row.is_revoked),
    tags: parseTags(row.tags),
  };
}

function isExpired(expiresAt: string | null, now = Date.now()): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= now;
}

function isShareAccessible(snippet: ShareSnippet): boolean {
  if (snippet.isRevoked) return false;
  if (isExpired(snippet.expiresAt)) return false;
  return true;
}

function uniqueShareCode(): string {
  const db = getDb();
  const exists = db.prepare(
    `SELECT 1 AS ok FROM snippets WHERE share_code = ? COLLATE NOCASE`,
  );
  let code = randomShareCode();
  while (exists.get(code)) {
    code = randomShareCode();
  }
  return code;
}

export function createSnippet(input: CreateSnippetInput): ShareSnippet {
  const now = new Date().toISOString();
  const tags = normalizeTags(input.tags);
  const snippet: ShareSnippet = {
    id: randomId("snip"),
    title: input.title?.trim() || DEFAULT_TITLE,
    language: input.language ?? DEFAULT_LANGUAGE,
    content: input.content ?? "",
    ownerId: input.ownerId ?? null,
    ownerName: input.ownerName ?? null,
    isPublic: input.isPublic ?? true,
    shareCode: uniqueShareCode(),
    createdAt: now,
    updatedAt: now,
    viewCount: 0,
    isLocked: input.isLocked ?? false,
    expiresAt: input.expiresAt ?? null,
    isRevoked: false,
    tags,
  };

  getDb()
    .prepare(
      `INSERT INTO snippets (
        id, title, language, content, owner_id, owner_name,
        is_public, share_code, created_at, updated_at, view_count,
        is_locked, expires_at, is_revoked, tags
      ) VALUES (
        @id, @title, @language, @content, @owner_id, @owner_name,
        @is_public, @share_code, @created_at, @updated_at, @view_count,
        @is_locked, @expires_at, @is_revoked, @tags
      )`,
    )
    .run({
      id: snippet.id,
      title: snippet.title,
      language: snippet.language,
      content: snippet.content,
      owner_id: snippet.ownerId,
      owner_name: snippet.ownerName,
      is_public: snippet.isPublic ? 1 : 0,
      share_code: snippet.shareCode,
      created_at: snippet.createdAt,
      updated_at: snippet.updatedAt,
      view_count: snippet.viewCount,
      is_locked: snippet.isLocked ? 1 : 0,
      expires_at: snippet.expiresAt,
      is_revoked: snippet.isRevoked ? 1 : 0,
      tags: serializeTags(snippet.tags),
    });

  return snippet;
}

export function getById(id: string): ShareSnippet | null {
  const row = getDb()
    .prepare(`SELECT * FROM snippets WHERE id = ?`)
    .get(id) as SnippetRow | undefined;
  return row ? rowToSnippet(row) : null;
}

export function getByShareCode(shareCode: string): ShareSnippet | null {
  const row = getDb()
    .prepare(`SELECT * FROM snippets WHERE share_code = ? COLLATE NOCASE`)
    .get(shareCode) as SnippetRow | undefined;
  if (!row) return null;

  const snippet = rowToSnippet(row);
  if (!isShareAccessible(snippet)) return null;
  return snippet;
}

export function isShareCodeTaken(
  shareCode: string,
  exceptSnippetId?: string,
): boolean {
  const code = normalizeShareCode(shareCode);
  const row = getDb()
    .prepare(
      `SELECT id FROM snippets WHERE share_code = ? COLLATE NOCASE LIMIT 1`,
    )
    .get(code) as { id: string } | undefined;
  if (!row) return false;
  if (exceptSnippetId && row.id === exceptSnippetId) return false;
  return true;
}

export function updateSnippet(
  id: string,
  input: UpdateSnippetInput,
): ShareSnippet | null {
  const existing = getById(id);
  if (!existing) return null;

  let nextShareCode = existing.shareCode;
  if (input.shareCode !== undefined) {
    const code = normalizeShareCode(input.shareCode);
    if (!isShareCodeFormat(code)) {
      throw new Error(
        "Link must be 3–12 letters or numbers (no spaces or symbols)",
      );
    }
    if (isShareCodeTaken(code, id)) {
      throw new Error("That link is already taken — try another");
    }
    nextShareCode = code;
  }

  const updated: ShareSnippet = {
    ...existing,
    title:
      input.title !== undefined
        ? input.title.trim() || DEFAULT_TITLE
        : existing.title,
    language: input.language ?? existing.language,
    content: input.content ?? existing.content,
    isPublic: input.isPublic ?? existing.isPublic,
    isLocked: input.isLocked ?? existing.isLocked,
    expiresAt:
      input.expiresAt !== undefined ? input.expiresAt : existing.expiresAt,
    isRevoked: input.isRevoked ?? existing.isRevoked,
    tags: input.tags !== undefined ? normalizeTags(input.tags) : existing.tags,
    shareCode: nextShareCode,
    updatedAt: new Date().toISOString(),
  };

  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE snippets SET
        title = @title,
        language = @language,
        content = @content,
        is_public = @is_public,
        is_locked = @is_locked,
        expires_at = @expires_at,
        is_revoked = @is_revoked,
        tags = @tags,
        share_code = @share_code,
        updated_at = @updated_at
      WHERE id = @id`,
    ).run({
      id,
      title: updated.title,
      language: updated.language,
      content: updated.content,
      is_public: updated.isPublic ? 1 : 0,
      is_locked: updated.isLocked ? 1 : 0,
      expires_at: updated.expiresAt,
      is_revoked: updated.isRevoked ? 1 : 0,
      tags: serializeTags(updated.tags),
      share_code: updated.shareCode,
      updated_at: updated.updatedAt,
    });

    if (updated.shareCode !== existing.shareCode) {
      db.prepare(
        `UPDATE room_settings SET share_code = ? WHERE share_code = ? COLLATE NOCASE`,
      ).run(updated.shareCode, existing.shareCode);
    }
  });
  tx();

  return updated;
}

export function deleteSnippet(id: string): boolean {
  const result = getDb().prepare(`DELETE FROM snippets WHERE id = ?`).run(id);
  return result.changes > 0;
}

export function listPublic(limit = 20): ShareSnippet[] {
  const now = new Date().toISOString();
  const rows = getDb()
    .prepare(
      `SELECT * FROM snippets
       WHERE is_public = 1
         AND is_revoked = 0
         AND (expires_at IS NULL OR expires_at > ?)
       ORDER BY created_at DESC
       LIMIT ?`,
    )
    .all(now, limit) as SnippetRow[];
  return rows.map(rowToSnippet);
}

export function listExplore(options: ListExploreOptions = {}): ShareSnippet[] {
  const limit = Math.min(Math.max(options.limit ?? 24, 1), 50);
  const now = new Date().toISOString();
  const clauses = [
    `is_public = 1`,
    `is_revoked = 0`,
    `(expires_at IS NULL OR expires_at > ?)`,
  ];
  const params: (string | number)[] = [now];

  const q = options.q?.trim();
  if (q) {
    clauses.push(`(title LIKE ? COLLATE NOCASE OR content LIKE ? COLLATE NOCASE)`);
    const like = `%${q}%`;
    params.push(like, like);
  }

  const language = options.language?.trim().toLowerCase();
  if (language) {
    clauses.push(`language = ?`);
    params.push(language);
  }

  const tag = normalizeTags(options.tag ? [options.tag] : [])[0];
  if (tag) {
    // Match whole JSON string element: "tag"
    clauses.push(`tags LIKE ?`);
    params.push(`%"${tag}"%`);
  }

  params.push(limit);

  const rows = getDb()
    .prepare(
      `SELECT * FROM snippets
       WHERE ${clauses.join(" AND ")}
       ORDER BY created_at DESC
       LIMIT ?`,
    )
    .all(...params) as SnippetRow[];

  return rows.map(rowToSnippet);
}

export function listByOwner(ownerId: string): ShareSnippet[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM snippets
       WHERE owner_id = ?
       ORDER BY updated_at DESC`,
    )
    .all(ownerId) as SnippetRow[];
  return rows.map(rowToSnippet);
}

export function incrementViews(id: string): ShareSnippet | null {
  const result = getDb()
    .prepare(
      `UPDATE snippets SET view_count = view_count + 1 WHERE id = ?`,
    )
    .run(id);
  if (result.changes === 0) return null;
  return getById(id);
}
