"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import type {
  CreateSnippetInput,
  ShareSnippet,
  SnippetLanguage,
  UpdateSnippetInput,
} from "@/lib/types";
import { sharePath } from "@/lib/share/codes";
import { starterFor } from "@/lib/snippets/starters";

export type SnippetSessionStatus =
  | "idle"
  | "loading"
  | "ready"
  | "saving"
  | "error";

const DEFAULT_TITLE = "Untitled snippet";
const DEFAULT_LANGUAGE: SnippetLanguage = "javascript";
const DEFAULT_CONTENT = starterFor(DEFAULT_LANGUAGE);

function parseSnippetPayload(data: unknown): ShareSnippet {
  if (data && typeof data === "object" && "snippet" in data) {
    return (data as { snippet: ShareSnippet }).snippet;
  }
  return data as ShareSnippet;
}

function errorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "error" in data) {
    const err = (data as { error: unknown }).error;
    if (typeof err === "string" && err.trim()) return err;
  }
  return fallback;
}

export function useSnippetSession(initialShareCode?: string | null) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeFromQuery = searchParams.get("code");
  const codeFromUrl = (initialShareCode?.trim() || codeFromQuery || "").trim();
  const { user } = useAuth();

  const [snippet, setSnippet] = useState<ShareSnippet | null>(null);
  const [content, setContentState] = useState(DEFAULT_CONTENT);
  const [title, setTitleState] = useState(DEFAULT_TITLE);
  const [language, setLanguageState] =
    useState<SnippetLanguage>(DEFAULT_LANGUAGE);
  const [status, setStatus] = useState<SnippetSessionStatus>(
    codeFromUrl ? "loading" : "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!codeFromUrl) return;
    const shareKey = codeFromUrl;

    let cancelled = false;

    async function load() {
      setStatus("loading");
      setError(null);
      setLoadError(null);
      try {
        const res = await fetch(
          `/api/snippets/code/${encodeURIComponent(shareKey)}`,
        );
        const data: unknown = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            errorMessage(data, `Failed to load snippet (${res.status})`),
          );
        }
        const snip = parseSnippetPayload(data);
        if (cancelled) return;
        setSnippet(snip);
        setContentState(snip.content);
        setTitleState(snip.title);
        setLanguageState(snip.language);
        setDirty(false);
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        setLoadError(
          e instanceof Error ? e.message : "Failed to load snippet",
        );
        setStatus("error");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [codeFromUrl]);

  const shareCode = snippet?.shareCode ?? null;

  /** Short public path (`/{shareCode}`). */
  const shareUrl = useMemo(() => {
    if (!shareCode) return null;
    return sharePath(shareCode);
  }, [shareCode]);

  const setContent = useCallback((value: string) => {
    setContentState(value);
    setDirty(true);
    setStatus((prev) => (prev === "error" ? "idle" : prev));
  }, []);

  const setTitle = useCallback((value: string) => {
    setTitleState(value);
    setDirty(true);
  }, []);

  const setLanguage = useCallback((value: SnippetLanguage) => {
    setLanguageState(value);
    setContentState(starterFor(value));
    setDirty(true);
    setStatus((prev) => (prev === "error" ? "idle" : prev));
  }, []);

  const createShare = useCallback(
    async (overrides?: { content?: string }) => {
      setStatus("saving");
      setError(null);
      try {
        const body: CreateSnippetInput = {
          title: title.trim() || DEFAULT_TITLE,
          language,
          content: overrides?.content ?? content,
          isPublic: true,
          ownerId: user?.id ?? null,
          ownerName: user?.name ?? null,
        };
        const res = await fetch("/api/snippets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data: unknown = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(errorMessage(data, "Failed to create share"));
        }
        const snip = parseSnippetPayload(data);
        setSnippet(snip);
        setTitleState(snip.title);
        setLanguageState(snip.language);
        setContentState(snip.content);
        setDirty(false);
        setStatus("ready");

        if (snip.shareCode) {
          router.replace(sharePath(snip.shareCode));
        }

        return snip;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create share");
        setStatus("error");
        throw e;
      }
    },
    [title, language, content, user, router],
  );

  const saveShare = useCallback(
    async (overrides?: { content?: string }) => {
      if (!snippet?.id) {
        return createShare(overrides);
      }

      const contentToSave = overrides?.content ?? content;

      setStatus("saving");
      setError(null);
      try {
        const body: UpdateSnippetInput = {
          title: title.trim() || DEFAULT_TITLE,
          language,
          content: contentToSave,
        };
        const res = await fetch(
          `/api/snippets/${encodeURIComponent(snippet.id)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
        );
        const data: unknown = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(errorMessage(data, "Failed to save share"));
        }
        const snip = parseSnippetPayload(data);
        setSnippet(snip);
        setTitleState(snip.title);
        setLanguageState(snip.language);
        setContentState(snip.content);
        setDirty(false);
        setStatus("ready");
        return snip;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save share");
        setStatus("error");
        throw e;
      }
    },
    [snippet, title, language, content, createShare],
  );

  const copyShareLink = useCallback(async () => {
    if (!shareCode) return false;
    const path = shareUrl ?? sharePath(shareCode);
    const absolute =
      typeof window !== "undefined"
        ? `${window.location.origin}${path}`
        : path;
    await navigator.clipboard.writeText(absolute);
    return true;
  }, [shareCode, shareUrl]);

  const applySnippetUpdate = useCallback(
    (snip: ShareSnippet) => {
      const prevCode = snippet?.shareCode;
      setSnippet(snip);
      setTitleState(snip.title);
      setLanguageState(snip.language);
      setContentState(snip.content);
      setDirty(false);
      if (prevCode && snip.shareCode && prevCode !== snip.shareCode) {
        router.replace(sharePath(snip.shareCode));
      }
    },
    [router, snippet?.shareCode],
  );

  const dismissLoadError = useCallback(() => {
    setLoadError(null);
    setError(null);
    setSnippet(null);
    setContentState(DEFAULT_CONTENT);
    setTitleState(DEFAULT_TITLE);
    setLanguageState(DEFAULT_LANGUAGE);
    setDirty(false);
    setStatus("idle");
    router.replace("/editor");
  }, [router]);

  return {
    snippet,
    content,
    setContent,
    title,
    setTitle,
    language,
    setLanguage,
    shareCode,
    shareUrl,
    status,
    error,
    loadError,
    dirty,
    createShare,
    saveShare,
    copyShareLink,
    dismissLoadError,
    applySnippetUpdate,
    codeFromUrl: codeFromUrl || null,
  };
}
