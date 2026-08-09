"use client";

import * as Y from "yjs";
import type { CollabPeer } from "@/lib/collab/types";

export type HttpSyncPeer = {
  id: string;
  name: string;
  color: string;
};

export type HttpSyncOptions = {
  shareCode: string;
  doc: Y.Doc;
  peer: HttpSyncPeer;
  onPeers?: (peers: CollabPeer[]) => void;
  /** Push debounce after local edits. */
  pushMs?: number;
  /** Pull interval for remote edits. */
  pullMs?: number;
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Server-mediated Yjs sync (works across devices / networks).
 * Tuned for low typing latency: short debounce + frequent pull.
 */
export function startHttpYjsSync(options: HttpSyncOptions): () => void {
  const {
    shareCode,
    doc,
    peer,
    onPeers,
    pushMs = 45,
    pullMs = 120,
  } = options;

  const endpoint = `/api/rooms/${encodeURIComponent(shareCode)}/collab`;
  let disposed = false;
  let applyingRemote = false;
  let lastApplied = "";
  let lastPushed = "";
  let pushTimer: number | null = null;
  let pullTimer: number | null = null;
  let pushInFlight = false;
  let pullInFlight = false;
  let pushQueued = false;

  const notifyPeers = (peers: CollabPeer[]) => {
    onPeers?.(peers.filter((p) => p.id !== peer.id));
  };

  const pull = async () => {
    if (disposed || pullInFlight) return;
    pullInFlight = true;
    try {
      const res = await fetch(endpoint, { method: "GET", cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        state?: string;
        peers?: CollabPeer[];
      };
      if (disposed) return;
      if (Array.isArray(data.peers)) notifyPeers(data.peers);

      const remote = typeof data.state === "string" ? data.state : "";
      if (!remote || remote === lastApplied || remote === lastPushed) return;

      applyingRemote = true;
      try {
        Y.applyUpdate(doc, base64ToBytes(remote), "http-sync");
        lastApplied = remote;
      } finally {
        applyingRemote = false;
      }
    } catch {
      // transient network — next poll retries
    } finally {
      pullInFlight = false;
    }
  };

  const push = async () => {
    if (disposed || applyingRemote) return;
    if (pushInFlight) {
      pushQueued = true;
      return;
    }
    pushInFlight = true;
    pushQueued = false;
    try {
      const state = bytesToBase64(Y.encodeStateAsUpdate(doc));
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, peer }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        state?: string;
        peers?: CollabPeer[];
      };
      if (disposed) return;
      if (typeof data.state === "string" && data.state) {
        lastPushed = state;
        lastApplied = data.state;
        if (data.state !== state) {
          applyingRemote = true;
          try {
            Y.applyUpdate(doc, base64ToBytes(data.state), "http-sync");
          } finally {
            applyingRemote = false;
          }
        }
      }
      if (Array.isArray(data.peers)) notifyPeers(data.peers);
    } catch {
      // retry on next local change / pull
    } finally {
      pushInFlight = false;
      if (pushQueued && !disposed) {
        pushQueued = false;
        void push();
      }
    }
  };

  const schedulePush = () => {
    if (disposed || applyingRemote) return;
    if (pushTimer != null) window.clearTimeout(pushTimer);
    pushTimer = window.setTimeout(() => {
      pushTimer = null;
      void push();
    }, pushMs);
  };

  const onUpdate = (_update: Uint8Array, origin: unknown) => {
    if (origin === "http-sync") return;
    schedulePush();
  };

  doc.on("update", onUpdate);

  void push();
  pullTimer = window.setInterval(() => {
    void pull();
  }, pullMs);

  const presenceTimer = window.setInterval(() => {
    void fetch(endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ peer }),
    })
      .then(async (res) => {
        if (!res.ok || disposed) return;
        const data = (await res.json()) as { peers?: CollabPeer[] };
        if (Array.isArray(data.peers)) notifyPeers(data.peers);
      })
      .catch(() => {});
  }, 5000);

  return () => {
    disposed = true;
    doc.off("update", onUpdate);
    if (pushTimer != null) window.clearTimeout(pushTimer);
    if (pullTimer != null) window.clearInterval(pullTimer);
    window.clearInterval(presenceTimer);
  };
}
