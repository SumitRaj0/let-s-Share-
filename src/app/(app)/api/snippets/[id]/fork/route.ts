import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import {
  createSnippet,
  getById,
  sharePath,
} from "@/lib/share/snippets";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const source = getById(id);

  if (!source) {
    return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
  }

  if (source.isRevoked) {
    return NextResponse.json({ error: "Snippet is revoked" }, { status: 410 });
  }

  if (
    source.expiresAt &&
    new Date(source.expiresAt).getTime() <= Date.now()
  ) {
    return NextResponse.json({ error: "Snippet has expired" }, { status: 410 });
  }

  if (!source.isPublic) {
    return NextResponse.json(
      { error: "Only public snippets can be forked" },
      { status: 403 },
    );
  }

  const user = await getSessionUser();
  const forkTitle = source.title.startsWith("Fork of ")
    ? source.title
    : `Fork of ${source.title}`;

  const snippet = createSnippet({
    title: forkTitle,
    language: source.language,
    content: source.content,
    tags: source.tags,
    isPublic: true,
    isLocked: false,
    expiresAt: null,
    ownerId: user?.id ?? null,
    ownerName: user?.name ?? null,
  });

  const shareUrl = sharePath(snippet.shareCode);
  const editorUrl = `/editor?code=${encodeURIComponent(snippet.shareCode)}`;

  return NextResponse.json(
    { snippet, shareUrl, editorUrl, shareCode: snippet.shareCode },
    { status: 201 },
  );
}
