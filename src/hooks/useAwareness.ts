"use client";

import { useEffect, useState } from "react";
import type { Awareness } from "y-protocols/awareness";
import {
  applyRemoteCursorStyles,
  getLocalUser,
  listRemoteUsers,
  setLocalPresence,
  type AwarenessUser,
  type SetLocalPresenceInput,
} from "@/lib/collab/awareness";

export type UseAwarenessResult = {
  /** Remote collaborators (excludes self). */
  remotes: AwarenessUser[];
  /** Local user presence, or null when awareness is missing / incomplete. */
  self: AwarenessUser | null;
  /** Self + remotes (self first). */
  users: AwarenessUser[];
  /** Total online count including self when present. */
  onlineCount: number;
};

const EMPTY: UseAwarenessResult = {
  remotes: [],
  self: null,
  users: [],
  onlineCount: 0,
};

function snapshot(
  awareness: Awareness | null | undefined,
  fallbackSelf: AwarenessUser | null,
): UseAwarenessResult {
  if (!awareness) {
    if (!fallbackSelf) return EMPTY;
    return {
      remotes: [],
      self: fallbackSelf,
      users: [fallbackSelf],
      onlineCount: 1,
    };
  }

  const remotes = listRemoteUsers(awareness);
  const self = getLocalUser(awareness) ?? fallbackSelf;
  const users = self ? [self, ...remotes] : remotes;
  return {
    remotes,
    self,
    users,
    onlineCount: users.length,
  };
}

/**
 * Subscribe to Yjs awareness changes and keep local presence fields in sync.
 * Tolerates `awareness === null` (Realtime provider not ready) without crashing.
 */
export function useAwareness(
  awareness: Awareness | null | undefined,
  local: SetLocalPresenceInput & { id: string },
): UseAwarenessResult {
  const [state, setState] = useState<UseAwarenessResult>(() =>
    snapshot(awareness, {
      id: local.id,
      name: local.name,
      color: local.color,
      role: local.role,
      clientId: -1,
      isSelf: true,
    }),
  );

  useEffect(() => {
    const fallbackSelf: AwarenessUser = {
      id: local.id,
      name: local.name,
      color: local.color,
      role: local.role,
      clientId: -1,
      isSelf: true,
    };

    if (!awareness) {
      applyRemoteCursorStyles(null);
      setState(snapshot(null, fallbackSelf));
      return;
    }

    setLocalPresence(awareness, {
      id: local.id,
      name: local.name,
      color: local.color,
      role: local.role,
    });

    const refresh = () => {
      applyRemoteCursorStyles(awareness);
      setState(snapshot(awareness, fallbackSelf));
    };

    refresh();
    awareness.on("change", refresh);
    return () => {
      awareness.off("change", refresh);
      applyRemoteCursorStyles(null);
    };
  }, [awareness, local.id, local.name, local.color, local.role]);

  return state;
}
