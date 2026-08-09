import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getSessionUser } from "@/lib/auth/session";
import { listByOwner } from "@/lib/share/snippets";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const snippets = await listByOwner(user.id);

  return (
    <>
      <Header active="none" />
      <main className="relative mx-auto flex w-full max-w-[1100px] flex-grow flex-col px-margin-mobile py-10 md:px-margin-desktop md:py-16">
        <div className="pointer-events-none absolute -right-16 -top-10 h-56 w-56 rounded-full bg-secondary-container/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-10 h-48 w-48 rounded-full bg-primary-container/5 blur-3xl" />
        <div className="relative z-10">
          <DashboardShell initialSnippets={snippets} />
        </div>
      </main>
      <Footer />
    </>
  );
}
