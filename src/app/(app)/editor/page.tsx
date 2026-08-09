import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { isShareCodeFormat, sharePath } from "@/lib/share/codes";
import { createSnippet } from "@/lib/share/snippets";
import { starterFor } from "@/lib/snippets/starters";

type EditorPageProps = {
  searchParams: Promise<{ code?: string }>;
};

/**
 * `/editor` always lands on a short share URL `/{code}`.
 * - `?code=` → redirect to that share
 * - bare `/editor` (Start sharing) → create a new share, then redirect
 */
export default async function EditorPage({ searchParams }: EditorPageProps) {
  const sp = await searchParams;
  const code = typeof sp.code === "string" ? sp.code.trim() : "";
  if (code && isShareCodeFormat(code)) {
    redirect(sharePath(code));
  }

  const user = await getSessionUser();
  const snippet = await createSnippet({
    title: "Untitled snippet",
    language: "javascript",
    content: starterFor("javascript"),
    isPublic: true,
    ownerId: user?.id ?? null,
    ownerName: user?.name ?? null,
  });

  redirect(sharePath(snippet.shareCode));
}
