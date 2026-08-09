import { NextResponse } from "next/server";
import { getRoomCollab, mergeRoomCollab } from "@/lib/db/collab";
import { getByShareCode as getSnippetByShareCode } from "@/lib/db/snippets";
import { isShareCodeFormat } from "@/lib/share/codes";

type RouteContext = { params: Promise<{ shareCode: string }> };

/**
 * GET /api/rooms/[shareCode]/collab
 * Returns merged Yjs state + recent peers for HTTP live sync.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { shareCode } = await context.params;
  if (!shareCode?.trim() || !isShareCodeFormat(shareCode)) {
    return NextResponse.json({ error: "Invalid share code" }, { status: 400 });
  }

  const snippet = await getSnippetByShareCode(shareCode);
  if (!snippet || snippet.isRevoked) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  try {
    const collab = await getRoomCollab(shareCode);
    return NextResponse.json(collab);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Collab unavailable";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

/**
 * PUT /api/rooms/[shareCode]/collab
 * Merge a Yjs update + optional peer heartbeat into the shared room.
 */
export async function PUT(request: Request, context: RouteContext) {
  const { shareCode } = await context.params;
  if (!shareCode?.trim() || !isShareCodeFormat(shareCode)) {
    return NextResponse.json({ error: "Invalid share code" }, { status: 400 });
  }

  const snippet = await getSnippetByShareCode(shareCode);
  if (!snippet || snippet.isRevoked) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

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
  const state =
    typeof raw.state === "string" && raw.state.length > 0 ? raw.state : undefined;

  let peer: { id: string; name: string; color: string } | undefined;
  if (raw.peer && typeof raw.peer === "object") {
    const p = raw.peer as Record<string, unknown>;
    if (
      typeof p.id === "string" &&
      p.id.trim() &&
      typeof p.name === "string" &&
      typeof p.color === "string"
    ) {
      peer = {
        id: p.id.trim(),
        name: p.name.trim() || "Guest",
        color: p.color.trim() || "#4ec9b0",
      };
    }
  }

  try {
    const collab = await mergeRoomCollab(shareCode, { state, peer });
    return NextResponse.json(collab);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Collab unavailable";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
