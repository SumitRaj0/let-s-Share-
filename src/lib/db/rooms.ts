import type { RoomRole, RoomSettings } from "@/lib/types";
import { getByShareCode as getSnippetByShareCode } from "./snippets";
import { getDb } from "./client";

type RoomSettingsRow = {
  share_code: string;
  snippet_id: string;
  interview_mode: number;
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
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
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
    interviewMode: Boolean(row.interview_mode),
    defaultJoinRole,
    updatedAt: row.updated_at,
  };
}

function getRow(shareCode: string): RoomSettingsRow | undefined {
  return getDb()
    .prepare(
      `SELECT * FROM room_settings WHERE share_code = ? COLLATE NOCASE`,
    )
    .get(shareCode) as RoomSettingsRow | undefined;
}

/** Ensure room settings exist for a share code; creates defaults from the snippet. */
export function getOrCreateByShareCode(shareCode: string): RoomSettings | null {
  const existing = getRow(shareCode);
  if (existing) return rowToSettings(existing);

  const snippet = getSnippetByShareCode(shareCode);
  if (!snippet) return null;

  const updatedAt = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO room_settings (
        share_code, snippet_id, interview_mode, default_join_role,
        kicked_client_ids, updated_at
      ) VALUES (
        @share_code, @snippet_id, @interview_mode, @default_join_role,
        @kicked_client_ids, @updated_at
      )`,
    )
    .run({
      share_code: snippet.shareCode,
      snippet_id: snippet.id,
      interview_mode: 0,
      default_join_role: "editor",
      kicked_client_ids: "[]",
      updated_at: updatedAt,
    });

  return {
    shareCode: snippet.shareCode,
    snippetId: snippet.id,
    interviewMode: false,
    defaultJoinRole: "editor",
    updatedAt,
  };
}

export function getByShareCode(shareCode: string): RoomSettings | null {
  const row = getRow(shareCode);
  return row ? rowToSettings(row) : null;
}

export function updateSettings(
  shareCode: string,
  input: RoomSettingsUpdate,
): RoomSettings | null {
  const current = getOrCreateByShareCode(shareCode);
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

  getDb()
    .prepare(
      `UPDATE room_settings SET
        interview_mode = @interview_mode,
        default_join_role = @default_join_role,
        updated_at = @updated_at
      WHERE share_code = @share_code COLLATE NOCASE`,
    )
    .run({
      share_code: shareCode,
      interview_mode: interviewMode ? 1 : 0,
      default_join_role: defaultJoinRole,
      updated_at: updatedAt,
    });

  return {
    ...current,
    interviewMode,
    defaultJoinRole,
    updatedAt,
  };
}

export function listKickedClientIds(shareCode: string): string[] {
  const row = getRow(shareCode);
  if (!row) return [];
  return parseKickedIds(row.kicked_client_ids);
}

export function isClientKicked(shareCode: string, clientId: string): boolean {
  return listKickedClientIds(shareCode).includes(clientId);
}

/** Soft kick: mark a client id in room state (does not delete history). */
export function kickClient(
  shareCode: string,
  clientId: string,
): RoomSettings | null {
  const settings = getOrCreateByShareCode(shareCode);
  if (!settings) return null;

  const row = getRow(shareCode);
  if (!row) return null;

  const kicked = parseKickedIds(row.kicked_client_ids);
  if (!kicked.includes(clientId)) {
    kicked.push(clientId);
  }

  const updatedAt = new Date().toISOString();
  getDb()
    .prepare(
      `UPDATE room_settings SET
        kicked_client_ids = @kicked_client_ids,
        updated_at = @updated_at
      WHERE share_code = @share_code COLLATE NOCASE`,
    )
    .run({
      share_code: shareCode,
      kicked_client_ids: JSON.stringify(kicked),
      updated_at: updatedAt,
    });

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
