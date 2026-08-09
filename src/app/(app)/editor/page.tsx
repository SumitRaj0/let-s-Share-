import { Suspense } from "react";
import { redirect } from "next/navigation";
import { CodeWorkspace } from "@/components/editor/CodeWorkspace";
import { isShareCodeFormat, sharePath } from "@/lib/share/codes";

type EditorPageProps = {
  searchParams: Promise<{ code?: string }>;
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

/** Blank editor at `/editor`. Legacy `?code=` redirects to short `/{code}`. */
export default async function EditorPage({ searchParams }: EditorPageProps) {
  const sp = await searchParams;
  const code = typeof sp.code === "string" ? sp.code.trim() : "";
  if (code && isShareCodeFormat(code)) {
    redirect(sharePath(code));
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#1e1e1e]">
      <Suspense fallback={<EditorFallback />}>
        <CodeWorkspace />
      </Suspense>
    </div>
  );
}
