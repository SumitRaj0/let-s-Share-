"use client";

import type * as Y from "yjs";
import type { WebrtcProvider } from "y-webrtc";

const TEXT_KEY = "content";

/** Prefer BroadcastChannel + optional signaling; public servers are flaky. */
const SIGNALING = [
  "wss://y-webrtc-eu.fly.dev",
  "wss://signaling.yjs.dev",
];

export function roomNameForShareCode(shareCode: string): string {
  return `letsshare:${shareCode}`;
}

export type CollabRoom = {
  doc: Y.Doc;
  provider: WebrtcProvider;
  ytext: Y.Text;
  roomName: string;
};

const rooms = new Map<string, CollabRoom>();

/**
 * Create or reuse a Y.Doc + WebrtcProvider for a share room.
 * Room id is the shareCode; provider room name is `letsshare:{shareCode}`.
 * Dynamic-imports yjs / y-webrtc so they never load on the server.
 *
 * HTTP sync (Turso) is the reliable cross-device path — WebRTC is best-effort.
 */
export async function getOrCreateRoom(shareCode: string): Promise<CollabRoom> {
  const roomName = roomNameForShareCode(shareCode);
  const existing = rooms.get(roomName);
  if (existing) return existing;

  const Y = await import("yjs");
  const { WebrtcProvider } = await import("y-webrtc");

  const doc = new Y.Doc();
  const ytext = doc.getText(TEXT_KEY);
  const provider = new WebrtcProvider(roomName, doc, {
    signaling: SIGNALING,
    // Same-browser tabs sync via BroadcastChannel; still allow WebRTC peers.
    filterBcConns: false,
  });

  const room: CollabRoom = { doc, provider, ytext, roomName };
  rooms.set(roomName, room);
  return room;
}

/** Tear down provider + doc and drop the cached room entry. */
export function destroyRoom(shareCode: string): void {
  const roomName = roomNameForShareCode(shareCode);
  const room = rooms.get(roomName);
  if (!room) return;

  try {
    room.provider.destroy();
  } catch {
    // provider may already be destroyed
  }
  try {
    room.doc.destroy();
  } catch {
    // doc may already be destroyed
  }
  rooms.delete(roomName);
}

/**
 * Seed Y.Text once when empty. Call after a short sync wait so peer
 * state can arrive before we insert local session content.
 */
export function seedYTextIfEmpty(ytext: Y.Text, content: string): boolean {
  if (ytext.length > 0) return false;
  if (!content) return false;
  ytext.insert(0, content);
  return true;
}
