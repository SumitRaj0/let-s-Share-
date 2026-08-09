import { NextResponse } from "next/server";
import { getByShareCode, incrementViews } from "@/lib/share/snippets";

type RouteContext = { params: Promise<{ shareCode: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { shareCode } = await context.params;
  const found = await getByShareCode(shareCode);
  if (!found) {
    return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
  }

  const snippet = (await incrementViews(found.id)) ?? found;
  return NextResponse.json({ snippet });
}
