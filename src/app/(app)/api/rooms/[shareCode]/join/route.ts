import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  getOrCreateByShareCode,
  isClientKicked,
  resolveJoinRole,
} from "@/lib/db/rooms";
import { getByShareCode as getSnippetByShareCode } from "@/lib/db/snippets";

type RouteContext = { params: Promise<{ shareCode: string }> };

/**
 * POST /api/rooms/[shareCode]/join
 * Guests may join without an account. Returns resolved role + settings.
 */
export async function POST(request: Request, context: RouteContext) {
  const { shareCode } = await context.params;
  if (!shareCode?.trim()) {
    return NextResponse.json({ error: "shareCode required" }, { status: 400 });
  }

  const snippet = await getSnippetByShareCode(shareCode);
  if (!snippet) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const settings = await getOrCreateByShareCode(shareCode);
  if (!settings) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  let clientId: string | null = null;
  try {
    const body: unknown = await request.json();
    if (body && typeof body === "object") {
      const raw = body as Record<string, unknown>;
      if (typeof raw.clientId === "string" && raw.clientId.trim()) {
        clientId = raw.clientId.trim();
      }
    }
  } catch {
    // Empty / missing body is fine for guests
  }

  if (clientId && (await isClientKicked(shareCode, clientId))) {
    return NextResponse.json(
      { error: "You have been removed from this room" },
      { status: 403 },
    );
  }

  const session = await getSession();
  const role = resolveJoinRole({
    settings,
    snippetOwnerId: snippet.ownerId,
    userId: session?.userId ?? null,
  });

  return NextResponse.json({
    role,
    interviewMode: settings.interviewMode,
    settings,
  });
}
