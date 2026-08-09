import type { RoomRole, RoomSettings } from "@/lib/types";
import { getByShareCode as getSnippetByShareCode } from "./snippets";
import { dbGet, dbRun } from "./client";

type RoomSettingsRow = {
  share_code: string;
  snippet_id: string;
  interview_mode: number | bigint;
  default_join_role: string;
  kicked_client_ids: string;
  updated_at: string;
};

export type RoomSettingsUpdate = {
  interviewMode?: boolean;
  defaultJoinRole?: Exclude<RoomRole, "owner">;
};

function parseKickedIds(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (id): id is string => typeof id === "string" && id.length > 0,
    );
  } catch {
    return [];
  }
}

function isJoinRole(value: string): value is Exclude<RoomRole, "owner"> {
  return value === "editor" || value === "viewer";
}

function rowToSettings(row: RoomSettingsRow): RoomSettings {
  const defaultJoinRole = isJoinRole(row.default_join_role)
    ? row.default_join_role
    : "editor";

  return {
    shareCode: row.share_code,
    snippetId: row.snippet_id,
    interviewMode: Boolean(Number(row.interview_mode)),
    defaultJoinRole,
    updatedAt: row.updated_at,
  };
}

async function getRow(
  shareCode: string,
): Promise<RoomSettingsRow | undefined> {
  return dbGet<RoomSettingsRow>(
    `SELECT * FROM room_settings WHERE share_code = ? COLLATE NOCASE`,
    [shareCode],
  );
}

/** Ensure room settings exist for a share code; creates defaults from the snippet. */
export async function getOrCreateByShareCode(
  shareCode: string,
): Promise<RoomSettings | null> {
  const existing = await getRow(shareCode);
  if (existing) return rowToSettings(existing);

  const snippet = await getSnippetByShareCode(shareCode);
  if (!snippet) return null;

  const updatedAt = new Date().toISOString();
  await dbRun(
    `INSERT INTO room_settings (
      share_code, snippet_id, interview_mode, default_join_role,
      kicked_client_ids, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      snippet.shareCode,
      snippet.id,
      0,
      "editor",
      "[]",
      updatedAt,
    ],
  );

  return {
    shareCode: snippet.shareCode,
    snippetId: snippet.id,
    interviewMode: false,
    defaultJoinRole: "editor",
    updatedAt,
  };
}

export async function getByShareCode(
  shareCode: string,
): Promise<RoomSettings | null> {
  const row = await getRow(shareCode);
  return row ? rowToSettings(row) : null;
}

export async function updateSettings(
  shareCode: string,
  input: RoomSettingsUpdate,
): Promise<RoomSettings | null> {
  const current = await getOrCreateByShareCode(shareCode);
  if (!current) return null;

  const interviewMode =
    input.interviewMode !== undefined
      ? input.interviewMode
      : current.interviewMode;
  const defaultJoinRole =
    input.defaultJoinRole !== undefined
      ? input.defaultJoinRole
      : current.defaultJoinRole === "owner"
        ? "editor"
        : (current.defaultJoinRole as Exclude<RoomRole, "owner">);

  const updatedAt = new Date().toISOString();

  await dbRun(
    `UPDATE room_settings SET
      interview_mode = ?,
      default_join_role = ?,
      updated_at = ?
    WHERE share_code = ? COLLATE NOCASE`,
    [interviewMode ? 1 : 0, defaultJoinRole, updatedAt, shareCode],
  );

  return {
    ...current,
    interviewMode,
    defaultJoinRole,
    updatedAt,
  };
}

export async function listKickedClientIds(
  shareCode: string,
): Promise<string[]> {
  const row = await getRow(shareCode);
  if (!row) return [];
  return parseKickedIds(row.kicked_client_ids);
}

export async function isClientKicked(
  shareCode: string,
  clientId: string,
): Promise<boolean> {
  const kicked = await listKickedClientIds(shareCode);
  return kicked.includes(clientId);
}

/** Soft kick: mark a client id in room state (does not delete history). */
export async function kickClient(
  shareCode: string,
  clientId: string,
): Promise<RoomSettings | null> {
  const settings = await getOrCreateByShareCode(shareCode);
  if (!settings) return null;

  const row = await getRow(shareCode);
  if (!row) return null;

  const kicked = parseKickedIds(row.kicked_client_ids);
  if (!kicked.includes(clientId)) {
    kicked.push(clientId);
  }

  const updatedAt = new Date().toISOString();
  await dbRun(
    `UPDATE room_settings SET
      kicked_client_ids = ?,
      updated_at = ?
    WHERE share_code = ? COLLATE NOCASE`,
    [JSON.stringify(kicked), updatedAt, shareCode],
  );

  return { ...settings, updatedAt };
}

/**
 * Resolve join role for a participant.
 * Owner (snippet.ownerId match) always gets `owner`.
 * Interview mode: joiners default to `editor` unless defaultJoinRole is `viewer`.
 * Otherwise joiners get defaultJoinRole (editor | viewer).
 */
export function resolveJoinRole(options: {
  settings: RoomSettings;
  snippetOwnerId: string | null;
  userId: string | null;
}): RoomRole {
  const { settings, snippetOwnerId, userId } = options;

  if (snippetOwnerId && userId && snippetOwnerId === userId) {
    return "owner";
  }

  if (settings.interviewMode) {
    return settings.defaultJoinRole === "viewer" ? "viewer" : "editor";
  }

  if (settings.defaultJoinRole === "owner") {
    return "editor";
  }

  return settings.defaultJoinRole;
}
