"use client";

import { useEffect, useState } from "react";
import type { RoomRole, RoomSettings } from "@/lib/types";

type RoomSettingsPanelProps = {
  shareCode: string;
  open: boolean;
  onClose: () => void;
  /** When true, owner can edit interview mode / default join role */
  canEdit: boolean;
  initialSettings?: RoomSettings | null;
  onUpdated?: (settings: RoomSettings) => void;
  /** Online collaborators (for soft kick). Uses presence `id`. */
  participants?: { id: string; name: string; isSelf?: boolean }[];
};

type JoinRoleOption = Exclude<RoomRole, "owner">;

const JOIN_ROLE_OPTIONS: { value: JoinRoleOption; label: string }[] = [
  { value: "editor", label: "Editor — can edit code" },
  { value: "viewer", label: "Viewer — read only" },
];

export function RoomSettingsPanel({
  shareCode,
  open,
  onClose,
  canEdit,
  initialSettings = null,
  onUpdated,
  participants = [],
}: RoomSettingsPanelProps) {
  const [interviewMode, setInterviewMode] = useState(
    initialSettings?.interviewMode ?? false,
  );
  const [defaultJoinRole, setDefaultJoinRole] = useState<JoinRoleOption>(
    initialSettings?.defaultJoinRole === "viewer" ? "viewer" : "editor",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);

    if (initialSettings) {
      setInterviewMode(initialSettings.interviewMode);
      setDefaultJoinRole(
        initialSettings.defaultJoinRole === "viewer" ? "viewer" : "editor",
      );
      return;
    }

    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/rooms/${encodeURIComponent(shareCode)}`,
        );
        const data: unknown = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg =
            data && typeof data === "object" && "error" in data
              ? String((data as { error: unknown }).error)
              : "Failed to load room settings";
          throw new Error(msg);
        }
        const settings = (data as { settings: RoomSettings }).settings;
        if (cancelled || !settings) return;
        setInterviewMode(settings.interviewMode);
        setDefaultJoinRole(
          settings.defaultJoinRole === "viewer" ? "viewer" : "editor",
        );
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Failed to load room settings",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, shareCode, initialSettings]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function patchSettings(body: {
    interviewMode?: boolean;
    defaultJoinRole?: JoinRoleOption;
    kickClientId?: string;
  }) {
    if (!canEdit) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/rooms/${encodeURIComponent(shareCode)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          data && typeof data === "object" && "error" in data
            ? String((data as { error: unknown }).error)
            : "Failed to update settings";
        throw new Error(msg);
      }
      const settings = (data as { settings: RoomSettings }).settings;
      if (settings) {
        setInterviewMode(settings.interviewMode);
        setDefaultJoinRole(
          settings.defaultJoinRole === "viewer" ? "viewer" : "editor",
        );
        onUpdated?.(settings);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update settings");
    } finally {
      setSaving(false);
    }
  }

  const kickable = participants.filter((p) => !p.isSelf && p.id);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-settings-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-on-surface/30 backdrop-blur-sm"
        aria-label="Close room settings"
        onClick={onClose}
      />

      <div className="glass-panel relative z-10 m-4 flex w-full max-w-md flex-col gap-6 rounded-2xl p-6 shadow-[0_30px_60px_rgba(29,29,31,0.12)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="room-settings-title"
              className="text-headline-lg text-primary"
            >
              Room settings
            </h2>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Roles, interview mode, and join defaults.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {interviewMode ? (
          <div
            className="rounded-lg bg-secondary-container/60 px-4 py-3 text-caption text-on-secondary-container"
            role="status"
          >
            Interview mode on — candidate edits, interviewer observes. Joiners
            default to editor unless set to viewer.
          </div>
        ) : null}

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 rounded-xl bg-surface-container-low/80 px-4 py-3">
            <div className="min-w-0">
              <p className="text-label-md text-on-surface">Interview mode</p>
              <p className="text-caption text-on-surface-variant">
                Candidate edits, interviewer observes
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={interviewMode}
              disabled={!canEdit || saving || loading}
              onClick={() => void patchSettings({ interviewMode: !interviewMode })}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                interviewMode ? "bg-primary" : "bg-surface-container-high"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  interviewMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-label-md text-on-surface">
              Default join role
            </span>
            <select
              value={defaultJoinRole}
              disabled={!canEdit || saving || loading}
              onChange={(e) => {
                const next = e.target.value as JoinRoleOption;
                setDefaultJoinRole(next);
                void patchSettings({ defaultJoinRole: next });
              }}
              className="rounded-lg border-none bg-surface-container-low px-4 py-3 text-body-md text-on-surface outline-none transition-shadow focus:ring-1 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {JOIN_ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-xl bg-surface-container-low/60 px-4 py-3">
            <p className="text-label-md text-on-surface">Roles</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-caption text-on-surface-variant">
              <li>
                <span className="text-on-surface">Owner</span> — full control,
                room settings, always editable for themselves
              </li>
              <li>
                <span className="text-on-surface">Editor</span> — can change
                code (interview candidates)
              </li>
              <li>
                <span className="text-on-surface">Viewer</span> — read-only in
                the editor
              </li>
            </ul>
            {!canEdit ? (
              <p className="mt-3 text-caption text-on-surface-variant">
                Viewing status only — only the snippet owner can change these
                settings.
              </p>
            ) : null}
          </div>

          {canEdit ? (
            <div className="rounded-xl bg-surface-container-low/60 px-4 py-3">
              <p className="text-label-md text-on-surface">Participants</p>
              <p className="mt-1 text-caption text-on-surface-variant">
                Soft-kick removes them on next join.
              </p>
              {kickable.length === 0 ? (
                <p className="mt-3 text-caption text-on-surface-variant">
                  No other collaborators online.
                </p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {kickable.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-lowest/80 px-3 py-2"
                    >
                      <span className="truncate text-caption text-on-surface">
                        {p.name}
                      </span>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Remove ${p.name} from this room?`,
                            )
                          ) {
                            void patchSettings({ kickClientId: p.id });
                          }
                        }}
                        className="shrink-0 rounded-full bg-error-container px-3 py-1 text-caption text-on-error-container transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        Kick
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>

        {error ? (
          <p
            className="rounded-lg bg-error-container px-4 py-3 text-caption text-on-error-container"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {saving || loading ? (
          <p className="text-center text-caption text-on-surface-variant">
            {loading ? "Loading…" : "Saving…"}
          </p>
        ) : null}
      </div>
    </div>
  );
}
