import { redirect } from "next/navigation";
import { isShareCodeFormat, sharePath } from "@/lib/share/snippets";

type LegacySharePageProps = {
  params: Promise<{ shareCode: string }>;
};

/** Legacy `/s/{code}` → short `/{code}`. */
export default async function LegacyShareRedirect({
  params,
}: LegacySharePageProps) {
  const { shareCode } = await params;
  if (!isShareCodeFormat(shareCode)) {
    redirect("/");
  }
  redirect(sharePath(shareCode));
}
