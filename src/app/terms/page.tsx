import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { MarketingHeader } from "@/components/MarketingHeader";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for using Let'sShare.",
};

export default function TermsPage() {
  return (
    <>
      <MarketingHeader />
      <main className="mx-auto w-full max-w-3xl flex-grow px-margin-mobile py-16 md:px-margin-desktop">
        <h1 className="text-headline-xl text-primary">Terms of Service</h1>
        <p className="mt-4 text-body-md text-on-surface-variant">
          By using Let'sShare you agree not to abuse the service, upload harmful
          content, or attempt to disrupt other users. Shared code remains your
          responsibility. The service is provided as-is for collaboration and
          learning.
        </p>
        <a href="/" className="mt-8 inline-flex text-label-md text-primary">
          ← Back home
        </a>
      </main>
      <Footer />
    </>
  );
}
