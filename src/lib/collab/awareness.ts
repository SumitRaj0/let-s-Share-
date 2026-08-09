import type { Awareness } from "y-protocols/awareness";
import type { RoomRole } from "@/lib/types";
import { contrastTextColor } from "@/lib/collab/colors";

/**
 * Awareness field schema (local + remote state on each client):
 *
 * ```
 * {
 *   id: string;           // stable user/guest id
 *   name: string;         // display name
 *   color: string;        // hex from colorFromSeed
 *   role?: RoomRole;      // "owner" | "editor" | "viewer" — Rooms agent sets this
 *   // y-monaco also writes:
 *   // selection?: { anchor: RelativePosition; head: RelativePosition } | null;
 * }
 * ```
 *
 * Rooms agent: after resolving join role, set awareness local `role`:
 *   `awareness.setLocalStateField("role", role)`
 * or pass `role` into `setLocalPresence` / `useAwareness` (Presence already
 * pipes `useRoomRole().role` into local awareness from CodeWorkspace).
 */

export type AwarenessPresence = {
  id: string;
  name: string;
  color: string;
  role?: RoomRole | string;
};

export type AwarenessUser = AwarenessPresence & {
  clientId: number;
  isSelf: boolean;
};

export type SetLocalPresenceInput = {
  id?: string;
  name: string;
  color: string;
  role?: RoomRole | string;
};

const CURSOR_STYLE_ID = "letsshare-remote-cursors";

function asPresence(
  state: Record<string, unknown> | null | undefined,
): AwarenessPresence | null {
  if (!state) return null;
  const id = typeof state.id === "string" ? state.id : null;
  const name = typeof state.name === "string" ? state.name : null;
  const color = typeof state.color === "string" ? state.color : null;
  if (!id || !name || !color) return null;
  const role =
    typeof state.role === "string" && state.role.length > 0
      ? state.role
      : undefined;
  return { id, name, color, role };
}

function cssEscapeContent(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, " ");
}

/**
 * Merge presence fields into local awareness state without wiping
 * other fields (e.g. selection) that y-monaco may set.
 */
export function setLocalPresence(
  awareness: Awareness | null | undefined,
  fields: SetLocalPresenceInput,
): void {
  if (!awareness) return;

  const prev = awareness.getLocalState() ?? {};
  const next: Record<string, unknown> = { ...prev };

  if (fields.id !== undefined) next.id = fields.id;
  next.name = fields.name;
  next.color = fields.color;
  if (fields.role !== undefined) {
    next.role = fields.role;
  }

  // Prefer field updates so we don't clobber concurrent cursor writes.
  for (const [key, value] of Object.entries(next)) {
    if (prev[key] !== value) {
      awareness.setLocalStateField(key, value);
    }
  }
}

/** Remote collaborators only (excludes local clientID). */
export function listRemoteUsers(
  awareness: Awareness | null | undefined,
): AwarenessUser[] {
  if (!awareness) return [];

  const selfId = awareness.clientID;
  const users: AwarenessUser[] = [];

  awareness.getStates().forEach((raw, clientId) => {
    if (clientId === selfId) return;
    const presence = asPresence(raw as Record<string, unknown>);
    if (!presence) return;
    users.push({ ...presence, clientId, isSelf: false });
  });

  users.sort((a, b) => a.name.localeCompare(b.name));
  return users;
}

/** Local presence snapshot, or null if unset / incomplete. */
export function getLocalUser(
  awareness: Awareness | null | undefined,
): AwarenessUser | null {
  if (!awareness) return null;
  const presence = asPresence(
    awareness.getLocalState() as Record<string, unknown> | null,
  );
  if (!presence) return null;
  return { ...presence, clientId: awareness.clientID, isSelf: true };
}

/**
 * Inject per-client CSS for y-monaco remote selection + named cursor labels.
 * Safe no-op when awareness is null or document is unavailable.
 */
export function applyRemoteCursorStyles(
  awareness: Awareness | null | undefined,
): void {
  if (typeof document === "undefined") return;

  let el = document.getElementById(
    CURSOR_STYLE_ID,
  ) as HTMLStyleElement | null;

  if (!awareness) {
    el?.remove();
    return;
  }

  if (!el) {
    el = document.createElement("style");
    el.id = CURSOR_STYLE_ID;
    document.head.appendChild(el);
  }

  const rules: string[] = [
    `.yRemoteSelectionHead {
      position: relative;
      border-left-width: 2px;
      border-left-style: solid;
      margin-left: -1px;
      box-sizing: border-box;
    }`,
    `.yRemoteSelectionHead::after {
      position: absolute;
      top: -1.4em;
      left: -2px;
      padding: 1px 5px;
      border-radius: 3px 3px 3px 0;
      font-size: 10px;
      font-family: var(--font-sans, ui-sans-serif, system-ui, sans-serif);
      font-weight: 600;
      line-height: 1.3;
      white-space: nowrap;
      pointer-events: none;
      z-index: 10;
    }`,
  ];

  awareness.getStates().forEach((raw, clientId) => {
    if (clientId === awareness.clientID) return;
    const presence = asPresence(raw as Record<string, unknown>);
    if (!presence) return;

    const { color, name } = presence;
    const fg = contrastTextColor(color);
    const label = cssEscapeContent(name);

    rules.push(`
.yRemoteSelection-${clientId} {
  background-color: ${color}40;
}
.yRemoteSelectionHead-${clientId} {
  border-left-color: ${color};
}
.yRemoteSelectionHead-${clientId}::after {
  content: "${label}";
  background-color: ${color};
  color: ${fg};
}`);
  });

  el.textContent = rules.join("\n");
}
