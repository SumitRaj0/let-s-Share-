import { NextResponse } from "next/server";
import {
  deleteSnippet,
  getById,
  updateSnippet,
} from "@/lib/share/snippets";
import type { SnippetLanguage, UpdateSnippetInput } from "@/lib/types";

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

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const snippet = getById(id);
  if (!snippet) {
    return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
  }
  return NextResponse.json({ snippet });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

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
  const input: UpdateSnippetInput = {};

  if (raw.title !== undefined) {
    if (typeof raw.title !== "string") {
      return NextResponse.json({ error: "title must be a string" }, { status: 400 });
    }
    input.title = raw.title;
  }

  if (raw.language !== undefined) {
    if (!isLanguage(raw.language)) {
      return NextResponse.json({ error: "Invalid language" }, { status: 400 });
    }
    input.language = raw.language;
  }

  if (raw.content !== undefined) {
    if (typeof raw.content !== "string") {
      return NextResponse.json(
        { error: "content must be a string" },
        { status: 400 },
      );
    }
    input.content = raw.content;
  }

  if (raw.isPublic !== undefined) {
    if (typeof raw.isPublic !== "boolean") {
      return NextResponse.json(
        { error: "isPublic must be a boolean" },
        { status: 400 },
      );
    }
    input.isPublic = raw.isPublic;
  }

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
    input.tags = raw.tags as string[];
  }

  const snippet = updateSnippet(id, input);
  if (!snippet) {
    return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
  }

  return NextResponse.json({ snippet });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const deleted = deleteSnippet(id);
  if (!deleted) {
    return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
