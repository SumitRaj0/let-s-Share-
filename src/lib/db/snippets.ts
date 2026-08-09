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
import { dbAll, dbGet, dbRun, getDb } from "./client";

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
  is_public: number | bigint;
  share_code: string;
  created_at: string;
  updated_at: string;
  view_count: number | bigint;
  is_locked: number | bigint;
  expires_at: string | null;
  is_revoked: number | bigint;
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
    isPublic: Boolean(Number(row.is_public)),
    shareCode: row.share_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    viewCount: Number(row.view_count),
    isLocked: Boolean(Number(row.is_locked)),
    expiresAt: row.expires_at,
    isRevoked: Boolean(Number(row.is_revoked)),
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

async function uniqueShareCode(): Promise<string> {
  let code = randomShareCode();
  for (let i = 0; i < 20; i++) {
    const existing = await dbGet<{ ok: number }>(
      `SELECT 1 AS ok FROM snippets WHERE share_code = ? COLLATE NOCASE`,
      [code],
    );
    if (!existing) return code;
    code = randomShareCode();
  }
  return randomShareCode(6);
}

export async function createSnippet(
  input: CreateSnippetInput,
): Promise<ShareSnippet> {
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
    shareCode: await uniqueShareCode(),
    createdAt: now,
    updatedAt: now,
    viewCount: 0,
    isLocked: input.isLocked ?? false,
    expiresAt: input.expiresAt ?? null,
    isRevoked: false,
    tags,
  };

  await dbRun(
    `INSERT INTO snippets (
      id, title, language, content, owner_id, owner_name,
      is_public, share_code, created_at, updated_at, view_count,
      is_locked, expires_at, is_revoked, tags
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?
    )`,
    [
      snippet.id,
      snippet.title,
      snippet.language,
      snippet.content,
      snippet.ownerId,
      snippet.ownerName,
      snippet.isPublic ? 1 : 0,
      snippet.shareCode,
      snippet.createdAt,
      snippet.updatedAt,
      snippet.viewCount,
      snippet.isLocked ? 1 : 0,
      snippet.expiresAt,
      snippet.isRevoked ? 1 : 0,
      serializeTags(snippet.tags),
    ],
  );

  return snippet;
}

export async function getById(id: string): Promise<ShareSnippet | null> {
  const row = await dbGet<SnippetRow>(`SELECT * FROM snippets WHERE id = ?`, [
    id,
  ]);
  return row ? rowToSnippet(row) : null;
}

export async function getByShareCode(
  shareCode: string,
): Promise<ShareSnippet | null> {
  const row = await dbGet<SnippetRow>(
    `SELECT * FROM snippets WHERE share_code = ? COLLATE NOCASE`,
    [shareCode],
  );
  if (!row) return null;

  const snippet = rowToSnippet(row);
  if (!isShareAccessible(snippet)) return null;
  return snippet;
}

export async function isShareCodeTaken(
  shareCode: string,
  exceptSnippetId?: string,
): Promise<boolean> {
  const code = normalizeShareCode(shareCode);
  const row = await dbGet<{ id: string }>(
    `SELECT id FROM snippets WHERE share_code = ? COLLATE NOCASE LIMIT 1`,
    [code],
  );
  if (!row) return false;
  if (exceptSnippetId && row.id === exceptSnippetId) return false;
  return true;
}

export async function updateSnippet(
  id: string,
  input: UpdateSnippetInput,
): Promise<ShareSnippet | null> {
  const existing = await getById(id);
  if (!existing) return null;

  let nextShareCode = existing.shareCode;
  if (input.shareCode !== undefined) {
    const code = normalizeShareCode(input.shareCode);
    if (!isShareCodeFormat(code)) {
      throw new Error(
        "Link must be 3–12 letters or numbers (no spaces or symbols)",
      );
    }
    if (await isShareCodeTaken(code, id)) {
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

  const db = await getDb();
  await db.batch(
    [
      {
        sql: `UPDATE snippets SET
          title = ?,
          language = ?,
          content = ?,
          is_public = ?,
          is_locked = ?,
          expires_at = ?,
          is_revoked = ?,
          tags = ?,
          share_code = ?,
          updated_at = ?
        WHERE id = ?`,
        args: [
          updated.title,
          updated.language,
          updated.content,
          updated.isPublic ? 1 : 0,
          updated.isLocked ? 1 : 0,
          updated.expiresAt,
          updated.isRevoked ? 1 : 0,
          serializeTags(updated.tags),
          updated.shareCode,
          updated.updatedAt,
          id,
        ],
      },
      ...(updated.shareCode !== existing.shareCode
        ? [
            {
              sql: `UPDATE room_settings SET share_code = ? WHERE share_code = ? COLLATE NOCASE`,
              args: [updated.shareCode, existing.shareCode],
            },
          ]
        : []),
    ],
    "write",
  );

  return updated;
}

export async function deleteSnippet(id: string): Promise<boolean> {
  const result = await dbRun(`DELETE FROM snippets WHERE id = ?`, [id]);
  return result.changes > 0;
}

export async function listPublic(limit = 20): Promise<ShareSnippet[]> {
  const now = new Date().toISOString();
  const rows = await dbAll<SnippetRow>(
    `SELECT * FROM snippets
     WHERE is_public = 1
       AND is_revoked = 0
       AND (expires_at IS NULL OR expires_at > ?)
     ORDER BY created_at DESC
     LIMIT ?`,
    [now, limit],
  );
  return rows.map(rowToSnippet);
}

export async function listExplore(
  options: ListExploreOptions = {},
): Promise<ShareSnippet[]> {
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
    clauses.push(
      `(title LIKE ? COLLATE NOCASE OR content LIKE ? COLLATE NOCASE)`,
    );
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
    clauses.push(`tags LIKE ?`);
    params.push(`%"${tag}"%`);
  }

  params.push(limit);

  const rows = await dbAll<SnippetRow>(
    `SELECT * FROM snippets
     WHERE ${clauses.join(" AND ")}
     ORDER BY created_at DESC
     LIMIT ?`,
    params,
  );

  return rows.map(rowToSnippet);
}

export async function listByOwner(ownerId: string): Promise<ShareSnippet[]> {
  const rows = await dbAll<SnippetRow>(
    `SELECT * FROM snippets
     WHERE owner_id = ?
     ORDER BY updated_at DESC`,
    [ownerId],
  );
  return rows.map(rowToSnippet);
}

export async function incrementViews(id: string): Promise<ShareSnippet | null> {
  const result = await dbRun(
    `UPDATE snippets SET view_count = view_count + 1 WHERE id = ?`,
    [id],
  );
  if (result.changes === 0) return null;
  return getById(id);
}
