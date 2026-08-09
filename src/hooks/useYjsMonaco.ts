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

const SEED_FALLBACK_MS = 600;

export type UseYjsMonacoResult = {
  ytext: Y.Text | null;
  provider: WebrtcProvider | null;
  /** Pass to Presence agent for live cursors / names. */
  awareness: Awareness | null;
  ready: boolean;
  destroy: () => void;
  /** Call from Monaco `onMount` to attach y-monaco. No-op when inactive. */
  bindEditor: (editor: MonacoEditorNS.IStandaloneCodeEditor) => void;
};

/**
 * Client-only Yjs + y-webrtc + y-monaco binding for a share room.
 * When `shareCode` is null, stays inactive (local Monaco only).
 */
export function useYjsMonaco(
  shareCode: string | null,
  initialContent: string,
): UseYjsMonacoResult {
  const [ready, setReady] = useState(false);
  const [ytext, setYtext] = useState<Y.Text | null>(null);
  const [provider, setProvider] = useState<WebrtcProvider | null>(null);
  const [awareness, setAwareness] = useState<Awareness | null>(null);

  const initialContentRef = useRef(initialContent);
  initialContentRef.current = initialContent;

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

    // Seed Y BEFORE MonacoBinding — the binding constructor does
    // `monacoModel.setValue(ytext)` and would wipe the editor if Y is empty.
    const monacoValue = model.getValue();
    if (text.length === 0) {
      const seed = monacoValue || initialContentRef.current;
      if (seed) {
        seedYTextIfEmpty(text, seed);
      }
    }

    const { MonacoBinding } = await import("@/lib/collab/monaco-binding");
    if (editorRef.current !== editor) return;
    if (ytextRef.current !== text) return;
    if (!shareCodeRef.current) return;
    // Model may have been swapped while we awaited the import.
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
      setReady(false);
      return;
    }

    let cancelled = false;
    let seedTimer: number | undefined;
    let providerForCleanup: WebrtcProvider | null = null;
    let onSynced: ((event: { synced: boolean }) => void) | null = null;

    void (async () => {
      const room = await getOrCreateRoom(shareCode);
      if (cancelled) {
        destroyRoom(shareCode);
        return;
      }

      providerForCleanup = room.provider;
      ytextRef.current = room.ytext;
      providerRef.current = room.provider;
      setYtext(room.ytext);
      setProvider(room.provider);
      setAwareness(room.provider.awareness);
      setReady(true);

      let seeded = false;
      const trySeed = () => {
        if (seeded) return;
        seeded = true;
        seedYTextIfEmpty(room.ytext, initialContentRef.current);
      };

      onSynced = ({ synced }: { synced: boolean }) => {
        if (synced) trySeed();
      };
      room.provider.on("synced", onSynced);
      seedTimer = window.setTimeout(trySeed, SEED_FALLBACK_MS);

      void attachBinding();
    })();

    return () => {
      cancelled = true;
      if (seedTimer != null) window.clearTimeout(seedTimer);
      if (providerForCleanup && onSynced) {
        providerForCleanup.off("synced", onSynced);
      }
      clearBinding();
      destroyRoom(shareCode);
      ytextRef.current = null;
      providerRef.current = null;
      setYtext(null);
      setProvider(null);
      setAwareness(null);
      setReady(false);
    };
  }, [shareCode, clearBinding, attachBinding]);

  const bindEditor = useCallback(
    (editor: MonacoEditorNS.IStandaloneCodeEditor) => {
      editorRef.current = editor;
      // If Monaco swaps models (language change), re-attach the binding.
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
    destroy,
    bindEditor,
  };
}
