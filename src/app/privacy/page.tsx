import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { MarketingHeader } from "@/components/MarketingHeader";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Let'sShare handles your data and shared code.",
};

export default function PrivacyPage() {
  return (
    <>
      <MarketingHeader />
      <main className="mx-auto w-full max-w-3xl flex-grow px-margin-mobile py-16 md:px-margin-desktop">
        <h1 className="text-headline-xl text-primary">Privacy Policy</h1>
        <p className="mt-4 text-body-md text-on-surface-variant">
          Let'sShare stores account credentials (hashed), sessions, and the code
          snippets you choose to share. Public shares are visible to anyone with
          the link. You can revoke or expire shares at any time.
        </p>
        <p className="mt-4 text-body-md text-on-surface-variant">
          We do not sell personal data. Contact support if you need an account
          or snippet deleted.
        </p>
        <a href="/" className="mt-8 inline-flex text-label-md text-primary">
          ← Back home
        </a>
      </main>
      <Footer />
    </>
  );
}
