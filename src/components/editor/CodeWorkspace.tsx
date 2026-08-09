"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { OnMount } from "@monaco-editor/react";
import { colorFromSeed } from "@/lib/collab/colors";
import { getGuestDisplayName, getGuestId } from "@/lib/collab/guest";
import { useAuth } from "@/hooks/useAuth";
import { useAwareness } from "@/hooks/useAwareness";
import { useRoomRole } from "@/hooks/useRoomRole";
import { useSharedConsole } from "@/hooks/useSharedConsole";
import { useSnippetSession } from "@/hooks/useSnippetSession";
import { useYjsMonaco } from "@/hooks/useYjsMonaco";
import { ConsolePanel } from "@/components/editor/ConsolePanel";
import { EditorSettingsPanel } from "@/components/editor/EditorSettingsPanel";
import { SnippetLoadErrorDialog } from "@/components/editor/SnippetLoadErrorDialog";
import { ShareLinkBar } from "@/components/share/ShareLinkBar";
import { starterFor } from "@/lib/snippets/starters";
import type { ShareSnippet, SnippetLanguage } from "@/lib/types";

const MonacoCodeEditor = dynamic(
  () =>
    import("@/components/editor/MonacoCodeEditor").then(
      (m) => m.MonacoCodeEditor,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-[#1e1e1e] text-[15px] text-[#858585]">
        Loading editor…
      </div>
    ),
  },
);

const PERSIST_DEBOUNCE_MS = 2000;

/**
 * Focused workspace: editor + Share + Settings (language).
 */
export function CodeWorkspace({
  initialShareCode,
  initialSnippet = null,
}: {
  initialShareCode?: string;
  initialSnippet?: ShareSnippet | null;
} = {}) {
  const session = useSnippetSession(initialShareCode, initialSnippet);
  const { user, loading: authLoading, logout } = useAuth();
  const room = useRoomRole(session.shareCode);
  const [saving, setSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [shareBannerOpen, setShareBannerOpen] = useState(false);
  /** Output pane width as % of the workspace row (user-resizable). */
  const [outputWidthPct, setOutputWidthPct] = useState(42);
  const [isResizing, setIsResizing] = useState(false);
  const splitRowRef = useRef<HTMLDivElement>(null);
  const [guestIdentity] = useState(() => ({
    id: typeof window === "undefined" ? "guest_ssr" : getGuestId(),
    name: typeof window === "undefined" ? "Guest" : getGuestDisplayName(),
  }));

  const presenceId = user?.id ?? guestIdentity.id;
  const displayName = user?.name?.trim() || guestIdentity.name;
  const presenceColor = useMemo(
    () => colorFromSeed(presenceId),
    [presenceId],
  );

  const collabEnabled = Boolean(session.shareCode);
  const collab = useYjsMonaco(session.shareCode, session.content, {
    id: presenceId,
    name: displayName,
    color: presenceColor,
  });
  const consoleDoc =
    collabEnabled && collab.ready ? (collab.ytext?.doc ?? null) : null;
  const sharedConsole = useSharedConsole(consoleDoc);
  const awarenessPresence = useAwareness(collab.awareness, {
    id: presenceId,
    name: displayName,
    color: presenceColor,
    role: room.role ?? undefined,
  });

  // Prefer WebRTC awareness peers; fall back to HTTP presence (cross-network).
  const livePeers =
    awarenessPresence.remotes.length > 0
      ? awarenessPresence.remotes.map((u) => ({
          id: u.id,
          name: u.name,
          color: u.color,
        }))
      : collab.httpPeers.map((p) => ({
          id: p.id,
          name: p.name,
          color: p.color,
        }));
  const onlineCount = 1 + livePeers.length;

  const persistInFlight = useRef(false);
  const dirtyRef = useRef(session.dirty);
  dirtyRef.current = session.dirty;
  const contentRef = useRef(session.content);
  const contentSyncTimer = useRef<number | null>(null);

  // Keep contentRef in sync for external loads / language changes only —
  // never rewrite it during a render (that stomps in-progress typing).
  useEffect(() => {
    contentRef.current = session.content;
  }, [session.content]);

  const flushContentToSession = useCallback(() => {
    if (contentSyncTimer.current != null) {
      window.clearTimeout(contentSyncTimer.current);
      contentSyncTimer.current = null;
    }
    session.setContent(contentRef.current);
  }, [session.setContent]);

  // Keep React content state off the hot path — update immediately in a ref,
  // debounce the session store so the workspace does not re-render every key.
  const handleEditorChange = useCallback(
    (next: string) => {
      contentRef.current = next;
      if (contentSyncTimer.current != null) {
        window.clearTimeout(contentSyncTimer.current);
      }
      contentSyncTimer.current = window.setTimeout(() => {
        contentSyncTimer.current = null;
        session.setContent(contentRef.current);
      }, 200);
    },
    [session.setContent],
  );

  useEffect(() => {
    return () => {
      if (contentSyncTimer.current != null) {
        window.clearTimeout(contentSyncTimer.current);
      }
    };
  }, []);

  const isBusy = session.status === "loading";
  const isOwner =
    room.role === "owner" ||
    Boolean(
      user?.id &&
        session.snippet?.ownerId &&
        user.id === session.snippet.ownerId,
    );
  // View-only when role is viewer, or when locked for non-owners.
  // Guest-created shares often have no ownerId — don't lock editors out of
  // their own link (viewers are still blocked via role === "viewer").
  const readOnly =
    isBusy ||
    room.role === "viewer" ||
    Boolean(
      session.snippet?.isLocked &&
        !isOwner &&
        Boolean(session.snippet.ownerId),
    );

  const canPersist =
    collabEnabled &&
    Boolean(session.snippet?.id) &&
    !readOnly &&
    room.role !== "viewer";

  useEffect(() => {
    // Wait until seed/sync finished — exposing empty Y early used to wipe the
    // API snapshot and leave scan devices with a blank Monaco.
    if (!collabEnabled || !collab.ready || !collab.ytext) return;
    const ytext = collab.ytext;
    let timer: number | null = null;

    const syncFromYjs = () => {
      const next = ytext.toString();
      // Never clobber a loaded snippet with an empty Y doc.
      if (next.length === 0 && contentRef.current.length > 0) return;
      contentRef.current = next;
      if (timer != null) window.clearTimeout(timer);
      // Debounce React updates — Yjs already drives Monaco via MonacoBinding.
      timer = window.setTimeout(() => {
        timer = null;
        session.setContent(contentRef.current);
      }, 250);
    };

    syncFromYjs();
    ytext.observe(syncFromYjs);
    return () => {
      ytext.unobserve(syncFromYjs);
      if (timer != null) window.clearTimeout(timer);
    };
  }, [collabEnabled, collab.ready, collab.ytext, session.setContent]);

  const persistContent = useCallback(async () => {
    if (!canPersist) return;
    if (persistInFlight.current) return;
    if (!dirtyRef.current) return;

    const contentToSave = collab.ytext?.toString() ?? contentRef.current;

    persistInFlight.current = true;
    setSaving(true);
    try {
      if (contentToSave !== contentRef.current) {
        session.setContent(contentToSave);
      }
      await session.saveShare({ content: contentToSave });
    } catch {
      // error surfaced via session hook
    } finally {
      persistInFlight.current = false;
      setSaving(false);
    }
  }, [canPersist, collab.ytext, session.setContent, session.saveShare]);

  useEffect(() => {
    if (!canPersist) return;
    if (!session.dirty) return;
    if (session.status === "saving" || session.status === "loading") return;

    const timer = window.setTimeout(() => {
      void persistContent();
    }, PERSIST_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [
    canPersist,
    session.dirty,
    session.content,
    session.status,
    persistContent,
  ]);

  async function handleShare() {
    setSaving(true);
    try {
      flushContentToSession();
      const fromYjs = collab.ytext?.toString();
      const contentToShare = fromYjs ?? contentRef.current;
      contentRef.current = contentToShare;
      if (session.snippet?.id) {
        await session.saveShare({ content: contentToShare });
      } else {
        await session.createShare({ content: contentToShare });
      }
      setShareBannerOpen(true);
    } catch {
      // error surfaced via session hook
    } finally {
      setSaving(false);
    }
  }

  async function handleRun() {
    setConsoleOpen(true);
    setRunning(true);
    const source =
      collab.ready && collab.ytext
        ? collab.ytext.toString()
        : contentRef.current;
    try {
      await sharedConsole.run(source, session.language);
    } finally {
      setRunning(false);
    }
  }

  function handleCloseOutput() {
    setConsoleOpen(false);
    setRunning(false);
  }

  const clampOutputWidth = useCallback((pct: number) => {
    return Math.min(70, Math.max(22, pct));
  }, []);

  const onSplitPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const row = splitRowRef.current;
      if (!row) return;

      const startX = e.clientX;
      const startPct = outputWidthPct;
      const rowWidth = row.getBoundingClientRect().width;
      if (rowWidth <= 0) return;

      setIsResizing(true);
      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);

      const onMove = (ev: PointerEvent) => {
        const deltaPct = ((startX - ev.clientX) / rowWidth) * 100;
        setOutputWidthPct(clampOutputWidth(startPct + deltaPct));
      };

      const onUp = (ev: PointerEvent) => {
        setIsResizing(false);
        try {
          target.releasePointerCapture(ev.pointerId);
        } catch {
          // already released
        }
        target.removeEventListener("pointermove", onMove);
        target.removeEventListener("pointerup", onUp);
        target.removeEventListener("pointercancel", onUp);
      };

      target.addEventListener("pointermove", onMove);
      target.addEventListener("pointerup", onUp);
      target.addEventListener("pointercancel", onUp);
    },
    [clampOutputWidth, outputWidthPct],
  );

  const handleEditorMount: OnMount = useCallback(
    (editor) => {
      if (collabEnabled) {
        collab.bindEditor(editor);
      }
    },
    [collabEnabled, collab.bindEditor],
  );

  function handleLanguageChange(language: SnippetLanguage) {
    session.setLanguage(language);
    const ytext = collab.ytext;
    if (ytext && collabEnabled) {
      const next = starterFor(language);
      ytext.doc?.transact(() => {
        ytext.delete(0, ytext.length);
        ytext.insert(0, next);
      });
    }
  }

  return (
    <main className="relative flex min-h-0 flex-1 flex-col bg-[#1e1e1e]">
      {/* One chrome row: brand + nav + actions + account */}
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-[#2f2f2f] bg-[#252526] px-3 sm:gap-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Link
            href="/"
            className="shrink-0 font-display text-[15px] font-bold tracking-tight text-[#e8e8e8] transition-colors hover:text-white sm:text-[16px]"
          >
            Let&apos;sShare
          </Link>
          <Link
            href="/editor"
            className="hidden shrink-0 text-[13px] font-semibold text-[#cccccc] sm:inline"
            aria-current="page"
          >
            ShareCode
          </Link>
          {collabEnabled && collab.ready ? (
            <div
              className="hidden items-center gap-1.5 sm:flex"
              title={
                livePeers.length > 0
                  ? `Live with ${livePeers.map((p) => p.name).join(", ")}`
                  : "Live session — waiting for others"
              }
            >
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  livePeers.length > 0
                    ? "bg-[#4ec9b0]"
                    : "bg-[#858585]"
                }`}
                aria-hidden
              />
              <span className="text-[12px] font-medium text-[#858585]">
                {livePeers.length > 0
                  ? `Live · ${onlineCount}`
                  : "Live"}
              </span>
              {livePeers.slice(0, 3).map((p) => (
                <span
                  key={p.id}
                  className="inline-flex h-5 max-w-[4.5rem] items-center truncate rounded px-1.5 text-[10px] font-semibold text-[#1e1e1e]"
                  style={{ backgroundColor: p.color }}
                >
                  {p.name}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleRun}
            disabled={session.status === "loading"}
            className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-[13px] font-medium text-[#cccccc] transition-colors hover:bg-[#3c3c3c] disabled:opacity-50 sm:px-2.5"
            title="Run code"
          >
            <span className="material-symbols-outlined text-[18px]">
              play_arrow
            </span>
            <span className="hidden sm:inline">Run</span>
          </button>

          <button
            type="button"
            onClick={() => void handleShare()}
            disabled={saving || isBusy || readOnly}
            className="inline-flex h-8 items-center gap-1 rounded-md bg-[#0e639c] px-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3"
          >
            <span className="material-symbols-outlined text-[17px]">share</span>
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-[#3c3c3c] px-2 text-[13px] font-medium text-[#cccccc] transition-colors hover:bg-[#3c3c3c] sm:px-2.5"
            title="Settings"
          >
            <span className="material-symbols-outlined text-[17px]">
              settings
            </span>
            <span className="hidden sm:inline">Settings</span>
          </button>

          <span
            className="mx-0.5 hidden h-5 w-px bg-[#3c3c3c] sm:block"
            aria-hidden
          />

          {authLoading ? (
            <span className="px-2 text-[12px] text-[#858585]">…</span>
          ) : user ? (
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex h-8 items-center rounded-md px-2 text-[12px] font-medium text-[#858585] transition-colors hover:bg-[#3c3c3c] hover:text-[#cccccc] sm:px-2.5 sm:text-[13px]"
            >
              Log out
            </button>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-8 items-center rounded-md px-2 text-[12px] font-medium text-[#cccccc] transition-colors hover:bg-[#3c3c3c] sm:px-2.5 sm:text-[13px]"
            >
              Login
            </Link>
          )}
        </div>
      </header>

      {session.shareCode && shareBannerOpen ? (
        <div className="pointer-events-none absolute inset-x-0 top-14 z-40 flex justify-end px-3 sm:px-4">
          <div className="pointer-events-auto w-full max-w-sm origin-top-right animate-[share-banner-in_320ms_cubic-bezier(0.16,1,0.3,1)]">
            <ShareLinkBar
              shareCode={session.shareCode}
              shareUrl={session.shareUrl ?? undefined}
              snippetId={session.snippet?.id}
              isLocked={session.snippet?.isLocked}
              expiresAt={session.snippet?.expiresAt}
              isRevoked={session.snippet?.isRevoked}
              variant="dark"
              onDismiss={() => setShareBannerOpen(false)}
            />
          </div>
        </div>
      ) : null}

      {session.loadError ? (
        <SnippetLoadErrorDialog
          message={session.loadError}
          onCancel={session.dismissLoadError}
        />
      ) : null}

      {session.error && !session.loadError ? (
        <div
          role="alert"
          className="border-b border-red-900/50 bg-red-950/40 px-4 py-2 text-[13px] text-red-200"
        >
          {session.error}
        </div>
      ) : null}

      {/* Editor + resizable output — drag the splitter to control widths */}
      <div
        ref={splitRowRef}
        className={`flex min-h-0 flex-1 overflow-hidden ${
          isResizing ? "select-none" : ""
        }`}
      >
        <div
          className="flex min-h-0 min-w-0 flex-col"
          style={{
            flexGrow: consoleOpen ? 100 - outputWidthPct : 1,
            flexShrink: 1,
            flexBasis: 0,
          }}
        >
          {session.status === "loading" ? (
            <div className="flex flex-1 items-center justify-center text-[15px] text-[#858585]">
              Loading shared snippet…
            </div>
          ) : (
            <MonacoCodeEditor
              key={
                session.shareCode
                  ? `share-${session.shareCode}-${collab.ready ? "live" : "boot"}`
                  : "local-editor"
              }
              language={session.language}
              value={session.content}
              onChange={handleEditorChange}
              readOnly={readOnly}
              collaborative={collabEnabled && collab.ready}
              onEditorMount={
                collabEnabled && collab.ready ? handleEditorMount : undefined
              }
              onBlur={
                canPersist
                  ? () => {
                      flushContentToSession();
                      void persistContent();
                    }
                  : undefined
              }
            />
          )}
        </div>

        {consoleOpen ? (
          <>
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize output panel"
              aria-valuemin={22}
              aria-valuemax={70}
              aria-valuenow={Math.round(outputWidthPct)}
              tabIndex={0}
              onPointerDown={onSplitPointerDown}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  setOutputWidthPct((p) => clampOutputWidth(p + 2));
                } else if (e.key === "ArrowRight") {
                  e.preventDefault();
                  setOutputWidthPct((p) => clampOutputWidth(p - 2));
                }
              }}
              className="group relative z-10 w-1.5 shrink-0 cursor-col-resize bg-[#2f2f2f] transition-colors hover:bg-[#0e639c] focus-visible:bg-[#0e639c] focus-visible:outline-none"
            >
              <span className="pointer-events-none absolute inset-y-0 -left-1 -right-1" />
            </div>

            <aside
              className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-[#181818]"
              style={{
                flexGrow: outputWidthPct,
                flexShrink: 1,
                flexBasis: 0,
              }}
            >
              <ConsolePanel
                logs={sharedConsole.logs}
                onClear={sharedConsole.clear}
                onClose={handleCloseOutput}
                shared={sharedConsole.shared}
                running={running}
              />
            </aside>
          </>
        ) : null}
      </div>

      <EditorSettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        language={session.language}
        onLanguageChange={handleLanguageChange}
        disabled={isBusy || readOnly}
      />
    </main>
  );
}
