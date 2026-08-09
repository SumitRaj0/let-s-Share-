import { NextResponse } from "next/server";
import { listExplore } from "@/lib/share/snippets";
import type { SnippetLanguage } from "@/lib/types";

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

function isLanguage(value: string): value is SnippetLanguage {
  return LANGUAGES.includes(value as SnippetLanguage);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const tag = searchParams.get("tag") ?? undefined;
  const languageParam = searchParams.get("language");
  const language =
    languageParam && isLanguage(languageParam) ? languageParam : undefined;
  const rawLimit = searchParams.get("limit");
  const limit = rawLimit
    ? Math.min(Math.max(Number(rawLimit) || 24, 1), 50)
    : 24;

  const snippets = listExplore({ q, tag, language, limit });
  return NextResponse.json({ snippets });
}
