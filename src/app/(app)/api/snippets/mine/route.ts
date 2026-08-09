import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listByOwner } from "@/lib/share/snippets";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const snippets = listByOwner(session.userId);
  return NextResponse.json({ snippets });
}
