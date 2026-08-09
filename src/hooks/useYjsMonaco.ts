"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type * as Y from "yjs";
import type { WebrtcProvider } from "y-webrtc";
import type { Awareness } from "y-protocols/awareness";
import type { editor as MonacoEditorNS } from "monaco-editor";
import {
  destroyRoom,
  getOrCreateRoom,
  seedYTextIfEmpty,
} from "@/lib/collab/doc";
import { startHttpYjsSync } from "@/lib/collab/http-sync";
import type { CollabPeer } from "@/lib/collab/types";

/** Wait briefly for WebRTC/BroadcastChannel before seeding from API. */
const SYNC_WAIT_MS = 500;

export type UseYjsMonacoResult = {
  ytext: Y.Text | null;
  provider: WebrtcProvider | null;
  /** Pass to Presence agent for live cursors / names. */
  awareness: Awareness | null;
  ready: boolean;
  /** Peers discovered via reliable HTTP sync (excludes self). */
  httpPeers: CollabPeer[];
  destroy: () => void;
  /** Call from Monaco `onMount` to attach y-monaco. No-op when inactive. */
  bindEditor: (editor: MonacoEditorNS.IStandaloneCodeEditor) => void;
};

function waitForProviderSynced(
  provider: WebrtcProvider,
  timeoutMs: number,
): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      provider.off("synced", onSynced);
      window.clearTimeout(timer);
      resolve();
    };

    const onSynced = (event: { synced: boolean }) => {
      if (event.synced) finish();
    };

    provider.on("synced", onSynced);
    const timer = window.setTimeout(finish, timeoutMs);
  });
}

/**
 * Client-only Yjs room: HTTP sync (reliable) + WebRTC (best-effort).
 */
export function useYjsMonaco(
  shareCode: string | null,
  initialContent: string,
  peer?: { id: string; name: string; color: string } | null,
): UseYjsMonacoResult {
  const [ready, setReady] = useState(false);
  const [ytext, setYtext] = useState<Y.Text | null>(null);
  const [provider, setProvider] = useState<WebrtcProvider | null>(null);
  const [awareness, setAwareness] = useState<Awareness | null>(null);
  const [httpPeers, setHttpPeers] = useState<CollabPeer[]>([]);

  const initialContentRef = useRef(initialContent);
  initialContentRef.current = initialContent;

  const peerRef = useRef(peer);
  peerRef.current = peer;

  const bindingRef = useRef<{ destroy: () => void } | null>(null);
  const editorRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null);
  const shareCodeRef = useRef(shareCode);
  shareCodeRef.current = shareCode;
  const ytextRef = useRef<Y.Text | null>(null);
  const providerRef = useRef<WebrtcProvider | null>(null);

  const clearBinding = useCallback(() => {
    bindingRef.current?.destroy();
    bindingRef.current = null;
  }, []);

  const attachBinding = useCallback(async () => {
    const editor = editorRef.current;
    const text = ytextRef.current;
    const prov = providerRef.current;
    if (!editor || !text || !prov || !shareCodeRef.current) return;

    const model = editor.getModel();
    if (!model) return;

    clearBinding();

    if (text.length === 0) {
      const seed = model.getValue() || initialContentRef.current;
      if (seed) {
        seedYTextIfEmpty(text, seed);
      }
    }

    const { MonacoBinding } = await import("@/lib/collab/monaco-binding");
    if (editorRef.current !== editor) return;
    if (ytextRef.current !== text) return;
    if (!shareCodeRef.current) return;
    if (editor.getModel() !== model) {
      void attachBinding();
      return;
    }

    bindingRef.current = new MonacoBinding(
      text,
      model,
      new Set([editor]),
      prov.awareness,
    );
  }, [clearBinding]);

  const destroy = useCallback(() => {
    clearBinding();
    editorRef.current = null;

    const code = shareCodeRef.current;
    if (code) {
      destroyRoom(code);
    }

    ytextRef.current = null;
    providerRef.current = null;
    setYtext(null);
    setProvider(null);
    setAwareness(null);
    setHttpPeers([]);
    setReady(false);
  }, [clearBinding]);

  useEffect(() => {
    if (!shareCode) {
      clearBinding();
      editorRef.current = null;
      ytextRef.current = null;
      providerRef.current = null;
      setYtext(null);
      setProvider(null);
      setAwareness(null);
      setHttpPeers([]);
      setReady(false);
      return;
    }

    let cancelled = false;
    let stopHttp: (() => void) | null = null;
    const seedSnapshot = initialContentRef.current;
    const localPeer = peerRef.current ?? {
      id: "guest",
      name: "Guest",
      color: "#4ec9b0",
    };

    void (async () => {
      const room = await getOrCreateRoom(shareCode);
      if (cancelled) {
        destroyRoom(shareCode);
        return;
      }

      // Pull server state first so joiners get live code without WebRTC.
      try {
        const res = await fetch(
          `/api/rooms/${encodeURIComponent(shareCode)}/collab`,
          { cache: "no-store" },
        );
        if (res.ok) {
          const data = (await res.json()) as { state?: string };
          if (typeof data.state === "string" && data.state) {
            const Y = await import("yjs");
            const binary = atob(data.state);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            Y.applyUpdate(room.doc, bytes, "http-sync");
          }
        }
      } catch {
        // Fall through to seed / WebRTC
      }

      if (cancelled) {
        destroyRoom(shareCode);
        return;
      }

      await waitForProviderSynced(room.provider, SYNC_WAIT_MS);
      if (cancelled) {
        destroyRoom(shareCode);
        return;
      }

      seedYTextIfEmpty(room.ytext, seedSnapshot);

      stopHttp = startHttpYjsSync({
        shareCode,
        doc: room.doc,
        peer: localPeer,
        onPeers: setHttpPeers,
      });

      providerRef.current = room.provider;
      ytextRef.current = room.ytext;
      setProvider(room.provider);
      setAwareness(room.provider.awareness);
      setYtext(room.ytext);
      setReady(true);

      void attachBinding();
    })();

    return () => {
      cancelled = true;
      stopHttp?.();
      clearBinding();
      destroyRoom(shareCode);
      ytextRef.current = null;
      providerRef.current = null;
      setYtext(null);
      setProvider(null);
      setAwareness(null);
      setHttpPeers([]);
      setReady(false);
    };
  }, [shareCode, clearBinding, attachBinding]);

  const bindEditor = useCallback(
    (editor: MonacoEditorNS.IStandaloneCodeEditor) => {
      editorRef.current = editor;
      editor.onDidChangeModel(() => {
        void attachBinding();
      });
      void attachBinding();
    },
    [attachBinding],
  );

  return {
    ytext,
    provider,
    awareness,
    ready,
    httpPeers,
    destroy,
    bindEditor,
  };
}
