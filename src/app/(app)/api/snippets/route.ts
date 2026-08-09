import { NextResponse } from "next/server";
import {
  createSnippet,
  listPublic,
  sharePath,
} from "@/lib/share/snippets";
import type { CreateSnippetInput, SnippetLanguage } from "@/lib/types";

const LANGUAGES: SnippetLanguage[] = [
  "javascript",
  "typescript",
  "python",
  "html",
  "css",
  "json",
  "markdown",
  "plaintext",
];

function isLanguage(value: unknown): value is SnippetLanguage {
  return typeof value === "string" && LANGUAGES.includes(value as SnippetLanguage);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawLimit = searchParams.get("limit");
  const limit = rawLimit ? Math.min(Math.max(Number(rawLimit) || 20, 1), 50) : 20;
  try {
    const snippets = await listPublic(limit);
    return NextResponse.json({ snippets });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Database unavailable";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;

  if (raw.content !== undefined && typeof raw.content !== "string") {
    return NextResponse.json(
      { error: "content must be a string" },
      { status: 400 },
    );
  }

  if (raw.language !== undefined && !isLanguage(raw.language)) {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  if (raw.title !== undefined && typeof raw.title !== "string") {
    return NextResponse.json({ error: "title must be a string" }, { status: 400 });
  }

  if (raw.isPublic !== undefined && typeof raw.isPublic !== "boolean") {
    return NextResponse.json(
      { error: "isPublic must be a boolean" },
      { status: 400 },
    );
  }

  if (raw.isLocked !== undefined && typeof raw.isLocked !== "boolean") {
    return NextResponse.json(
      { error: "isLocked must be a boolean" },
      { status: 400 },
    );
  }

  if (
    raw.expiresAt !== undefined &&
    raw.expiresAt !== null &&
    typeof raw.expiresAt !== "string"
  ) {
    return NextResponse.json(
      { error: "expiresAt must be an ISO string or null" },
      { status: 400 },
    );
  }

  let expiresAt: string | null | undefined;
  if (raw.expiresAt === null) {
    expiresAt = null;
  } else if (typeof raw.expiresAt === "string") {
    const parsed = Date.parse(raw.expiresAt);
    if (Number.isNaN(parsed)) {
      return NextResponse.json(
        { error: "expiresAt must be a valid ISO timestamp" },
        { status: 400 },
      );
    }
    expiresAt = new Date(parsed).toISOString();
  }

  let tags: string[] | undefined;
  if (raw.tags !== undefined) {
    if (
      !Array.isArray(raw.tags) ||
      raw.tags.some((t) => typeof t !== "string")
    ) {
      return NextResponse.json(
        { error: "tags must be an array of strings" },
        { status: 400 },
      );
    }
    tags = raw.tags as string[];
  }

  const input: CreateSnippetInput = {
    content: typeof raw.content === "string" ? raw.content : "",
    title: typeof raw.title === "string" ? raw.title : undefined,
    language: isLanguage(raw.language) ? raw.language : undefined,
    isPublic: typeof raw.isPublic === "boolean" ? raw.isPublic : undefined,
    ownerId:
      raw.ownerId === null || typeof raw.ownerId === "string"
        ? (raw.ownerId as string | null)
        : undefined,
    ownerName:
      raw.ownerName === null || typeof raw.ownerName === "string"
        ? (raw.ownerName as string | null)
        : undefined,
    isLocked: typeof raw.isLocked === "boolean" ? raw.isLocked : undefined,
    expiresAt,
    tags,
  };

  let snippet;
  try {
    snippet = await createSnippet(input);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Database unavailable";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const shareUrl = sharePath(snippet.shareCode);

  return NextResponse.json({ snippet, shareUrl }, { status: 201 });
}
