import * as Y from "yjs";
import { dbGet, dbRun } from "./client";
import { normalizeShareCode } from "@/lib/share/codes";
import type { CollabPeer } from "@/lib/collab/types";

export type { CollabPeer } from "@/lib/collab/types";

const PEER_TTL_MS = 12_000;

type RoomCollabRow = {
  share_code: string;
  yjs_state: string;
  peers_json: string;
  updated_at: string;
};

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(value, "base64"));
  }
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function parsePeers(raw: string | null | undefined): CollabPeer[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is CollabPeer =>
        !!p &&
        typeof p === "object" &&
        typeof (p as CollabPeer).id === "string" &&
        typeof (p as CollabPeer).name === "string" &&
        typeof (p as CollabPeer).color === "string" &&
        typeof (p as CollabPeer).seenAt === "number",
    );
  } catch {
    return [];
  }
}

function prunePeers(peers: CollabPeer[], now = Date.now()): CollabPeer[] {
  return peers.filter((p) => now - p.seenAt < PEER_TTL_MS);
}

function upsertPeer(
  peers: CollabPeer[],
  peer: Omit<CollabPeer, "seenAt">,
): CollabPeer[] {
  const now = Date.now();
  const next = prunePeers(peers, now).filter((p) => p.id !== peer.id);
  next.push({ ...peer, seenAt: now });
  return next;
}

async function ensureRow(shareCode: string): Promise<RoomCollabRow> {
  const code = normalizeShareCode(shareCode);
  const existing = await dbGet<RoomCollabRow>(
    `SELECT share_code, yjs_state, peers_json, updated_at
     FROM room_collab WHERE share_code = ? COLLATE NOCASE`,
    [code],
  );
  if (existing) return existing;

  const now = new Date().toISOString();
  await dbRun(
    `INSERT OR IGNORE INTO room_collab (share_code, yjs_state, peers_json, updated_at)
     VALUES (?, '', '[]', ?)`,
    [code, now],
  );
  return (
    (await dbGet<RoomCollabRow>(
      `SELECT share_code, yjs_state, peers_json, updated_at
       FROM room_collab WHERE share_code = ? COLLATE NOCASE`,
      [code],
    )) ?? {
      share_code: code,
      yjs_state: "",
      peers_json: "[]",
      updated_at: now,
    }
  );
}

export async function getRoomCollab(shareCode: string): Promise<{
  state: string;
  peers: CollabPeer[];
  updatedAt: string;
}> {
  const row = await ensureRow(shareCode);
  return {
    state: row.yjs_state,
    peers: prunePeers(parsePeers(row.peers_json)),
    updatedAt: row.updated_at,
  };
}

export async function mergeRoomCollab(
  shareCode: string,
  input: {
    state?: string;
    peer?: { id: string; name: string; color: string };
  },
): Promise<{
  state: string;
  peers: CollabPeer[];
  updatedAt: string;
}> {
  const code = normalizeShareCode(shareCode);
  const row = await ensureRow(code);
  let peers = prunePeers(parsePeers(row.peers_json));
  if (input.peer?.id) {
    peers = upsertPeer(peers, input.peer);
  }

  let nextState = row.yjs_state;
  if (input.state && input.state.length > 0) {
    const doc = new Y.Doc();
    try {
      if (row.yjs_state) {
        Y.applyUpdate(doc, base64ToBytes(row.yjs_state));
      }
      Y.applyUpdate(doc, base64ToBytes(input.state));
      nextState = bytesToBase64(Y.encodeStateAsUpdate(doc));
    } finally {
      doc.destroy();
    }
  }

  const updatedAt = new Date().toISOString();
  await dbRun(
    `UPDATE room_collab
     SET yjs_state = ?, peers_json = ?, updated_at = ?
     WHERE share_code = ? COLLATE NOCASE`,
    [nextState, JSON.stringify(peers), updatedAt, code],
  );

  return { state: nextState, peers, updatedAt };
}
