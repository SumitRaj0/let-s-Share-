"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getGuestId } from "@/lib/collab/guest";
import type { RoomRole, RoomSettings } from "@/lib/types";

type JoinResponse = {
  role: RoomRole;
  interviewMode: boolean;
  settings: RoomSettings;
};

export type UseRoomRoleResult = {
  role: RoomRole | null;
  interviewMode: boolean;
  settings: RoomSettings | null;
  loading: boolean;
  error: string | null;
  clientId: string | null;
  refresh: () => Promise<void>;
};

function errorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "error" in data) {
    const err = (data as { error: unknown }).error;
    if (typeof err === "string" && err.trim()) return err;
  }
  return fallback;
}

/**
 * Fetches join role for the current shareCode via POST /api/rooms/.../join.
 * Sends a stable clientId so kick enforcement works.
 */
export function useRoomRole(
  shareCode: string | null | undefined,
): UseRoomRoleResult {
  const { user } = useAuth();
  const [role, setRole] = useState<RoomRole | null>(null);
  const [interviewMode, setInterviewMode] = useState(false);
  const [settings, setSettings] = useState<RoomSettings | null>(null);
  const [loading, setLoading] = useState(Boolean(shareCode));
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!shareCode) {
      setRole(null);
      setInterviewMode(false);
      setSettings(null);
      setLoading(false);
      setError(null);
      setClientId(null);
      return;
    }

    const id = user?.id ?? getGuestId();
    setClientId(id);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/rooms/${encodeURIComponent(shareCode)}/join`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId: id }),
        },
      );
      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(errorMessage(data, `Join failed (${res.status})`));
      }
      const payload = data as JoinResponse;
      setRole(payload.role);
      setInterviewMode(Boolean(payload.interviewMode));
      setSettings(payload.settings ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to resolve room role");
      setRole(null);
      setInterviewMode(false);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, [shareCode, user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { role, interviewMode, settings, loading, error, clientId, refresh };
}
