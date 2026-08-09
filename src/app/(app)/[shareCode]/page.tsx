import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CodeWorkspace } from "@/components/editor/CodeWorkspace";
import { getByShareCode, isShareCodeFormat } from "@/lib/share/snippets";

type ShareEditorPageProps = {
  params: Promise<{ shareCode: string }>;
};

function EditorFallback() {
  return (
    <main className="flex min-h-0 grow flex-col bg-[#1e1e1e]">
      <div className="flex h-12 shrink-0 items-center border-b border-[#2f2f2f] bg-[#252526] px-4">
        <span className="font-display text-[15px] font-bold text-[#e8e8e8]">
          Let&apos;sShare
        </span>
      </div>
      <div className="flex flex-1 items-center justify-center text-[15px] text-[#858585]">
        Loading editor…
      </div>
    </main>
  );
}

/**
 * Short share URL — `/{code}` opens the live editor (e.g. /0845).
 * Snippet is loaded on the server so the client can paint without a second fetch.
 */
export default async function ShortShareEditorPage({
  params,
}: ShareEditorPageProps) {
  const { shareCode } = await params;
  if (!isShareCodeFormat(shareCode)) notFound();

  const found = await getByShareCode(shareCode);
  if (!found) notFound();

  return (
    <div className="flex min-h-dvh flex-col bg-[#1e1e1e]">
      <Suspense fallback={<EditorFallback />}>
        <CodeWorkspace
          initialShareCode={found.shareCode}
          initialSnippet={found}
        />
      </Suspense>
    </div>
  );
}
