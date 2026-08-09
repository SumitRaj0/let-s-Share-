import { NextResponse } from "next/server";
import { updateSnippet } from "@/lib/share/snippets";
import { normalizeShareCode } from "@/lib/share/codes";
import type { UpdateSnippetInput } from "@/lib/types";

type RouteContext = { params: Promise<{ id: string }> };

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

  if (raw.isLocked !== undefined) {
    if (typeof raw.isLocked !== "boolean") {
      return NextResponse.json(
        { error: "isLocked must be a boolean" },
        { status: 400 },
      );
    }
    input.isLocked = raw.isLocked;
  }

  if (raw.expiresAt !== undefined) {
    if (raw.expiresAt !== null && typeof raw.expiresAt !== "string") {
      return NextResponse.json(
        { error: "expiresAt must be an ISO string or null" },
        { status: 400 },
      );
    }
    if (typeof raw.expiresAt === "string") {
      const parsed = Date.parse(raw.expiresAt);
      if (Number.isNaN(parsed)) {
        return NextResponse.json(
          { error: "expiresAt must be a valid ISO timestamp" },
          { status: 400 },
        );
      }
      input.expiresAt = new Date(parsed).toISOString();
    } else {
      input.expiresAt = null;
    }
  }

  if (raw.isRevoked !== undefined) {
    if (typeof raw.isRevoked !== "boolean") {
      return NextResponse.json(
        { error: "isRevoked must be a boolean" },
        { status: 400 },
      );
    }
    input.isRevoked = raw.isRevoked;
  }

  if (raw.shareCode !== undefined) {
    if (typeof raw.shareCode !== "string") {
      return NextResponse.json(
        { error: "shareCode must be a string" },
        { status: 400 },
      );
    }
    input.shareCode = normalizeShareCode(raw.shareCode);
  }

  if (
    input.isLocked === undefined &&
    input.expiresAt === undefined &&
    input.isRevoked === undefined &&
    input.shareCode === undefined
  ) {
    return NextResponse.json(
      { error: "Provide isLocked, expiresAt, isRevoked, and/or shareCode" },
      { status: 400 },
    );
  }

  try {
    const snippet = await updateSnippet(id, input);
    if (!snippet) {
      return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
    }
    return NextResponse.json({ snippet });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not update share controls";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
