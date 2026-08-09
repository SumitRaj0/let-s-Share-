import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  getOrCreateByShareCode,
  kickClient,
  updateSettings,
} from "@/lib/db/rooms";
import { getByShareCode as getSnippetByShareCode } from "@/lib/db/snippets";
import type { RoomRole } from "@/lib/types";

type RouteContext = { params: Promise<{ shareCode: string }> };

function isJoinRole(value: unknown): value is Exclude<RoomRole, "owner"> {
  return value === "editor" || value === "viewer";
}

export async function GET(_request: Request, context: RouteContext) {
  const { shareCode } = await context.params;
  if (!shareCode?.trim()) {
    return NextResponse.json({ error: "shareCode required" }, { status: 400 });
  }

  const snippet = getSnippetByShareCode(shareCode);
  if (!snippet) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const settings = getOrCreateByShareCode(shareCode);
  if (!settings) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json({ settings });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { shareCode } = await context.params;
  if (!shareCode?.trim()) {
    return NextResponse.json({ error: "shareCode required" }, { status: 400 });
  }

  const snippet = getSnippetByShareCode(shareCode);
  if (!snippet) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const session = await getSession();
  if (!session || !snippet.ownerId || session.userId !== snippet.ownerId) {
    return NextResponse.json(
      { error: "Only the snippet owner can update room settings" },
      { status: 403 },
    );
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

  if (typeof raw.kickClientId === "string" && raw.kickClientId.trim()) {
    const settings = kickClient(shareCode, raw.kickClientId.trim());
    if (!settings) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    return NextResponse.json({ settings, kicked: raw.kickClientId.trim() });
  }

  const patch: {
    interviewMode?: boolean;
    defaultJoinRole?: Exclude<RoomRole, "owner">;
  } = {};

  if (raw.interviewMode !== undefined) {
    if (typeof raw.interviewMode !== "boolean") {
      return NextResponse.json(
        { error: "interviewMode must be a boolean" },
        { status: 400 },
      );
    }
    patch.interviewMode = raw.interviewMode;
  }

  if (raw.defaultJoinRole !== undefined) {
    if (!isJoinRole(raw.defaultJoinRole)) {
      return NextResponse.json(
        { error: "defaultJoinRole must be editor or viewer" },
        { status: 400 },
      );
    }
    patch.defaultJoinRole = raw.defaultJoinRole;
  }

  if (
    patch.interviewMode === undefined &&
    patch.defaultJoinRole === undefined
  ) {
    return NextResponse.json(
      {
        error:
          "Provide interviewMode, defaultJoinRole, and/or kickClientId",
      },
      { status: 400 },
    );
  }

  const settings = updateSettings(shareCode, patch);
  if (!settings) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json({ settings });
}
