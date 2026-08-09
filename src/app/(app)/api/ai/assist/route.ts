import { NextResponse } from "next/server";
import { runAiAssist } from "@/lib/ai/assist";
import type { AiAssistMode, AiAssistRequest, SnippetLanguage } from "@/lib/types";

const MAX_CONTENT_CHARS = 20_000;

const MODES: AiAssistMode[] = ["explain", "title", "readme", "interview"];

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

function isMode(value: unknown): value is AiAssistMode {
  return typeof value === "string" && MODES.includes(value as AiAssistMode);
}

function isLanguage(value: unknown): value is SnippetLanguage {
  return (
    typeof value === "string" && LANGUAGES.includes(value as SnippetLanguage)
  );
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

  if (!isMode(raw.mode)) {
    return NextResponse.json(
      { error: "mode must be explain | title | readme | interview" },
      { status: 400 },
    );
  }

  if (!isLanguage(raw.language)) {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  if (typeof raw.content !== "string") {
    return NextResponse.json(
      { error: "content must be a string" },
      { status: 400 },
    );
  }

  if (raw.content.length > MAX_CONTENT_CHARS) {
    return NextResponse.json(
      {
        error: `content exceeds max length of ${MAX_CONTENT_CHARS} characters`,
      },
      { status: 400 },
    );
  }

  if (raw.title !== undefined && typeof raw.title !== "string") {
    return NextResponse.json({ error: "title must be a string" }, { status: 400 });
  }

  const payload: AiAssistRequest = {
    mode: raw.mode,
    language: raw.language,
    content: raw.content,
    ...(typeof raw.title === "string" ? { title: raw.title } : {}),
  };

  try {
    const result = await runAiAssist(payload);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "AI assist failed",
      },
      { status: 502 },
    );
  }
}
