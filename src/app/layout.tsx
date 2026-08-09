import type { Metadata } from "next";
import { IBM_Plex_Mono, Noto_Sans, Poppins } from "next/font/google";
import "./globals.css";

/** Familiar on Indian product UIs (fintech / edtech / consumer apps). */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

/** Clear body type; strong Latin + ready path for Indic later. */
const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-mono",
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Let'sShare — Sharing, made Easy & instant.",
    template: "%s · Let'sShare",
  },
  description:
    "Share and run code together in realtime. Instant links, collaborative editing, and more ways to share coming soon.",
  applicationName: "Let'sShare",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: "Let'sShare",
    title: "Let'sShare — Sharing, made Easy & instant.",
    description:
      "Share and run code together in realtime. Instant links, collaborative editing, and more ways to share coming soon.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Let'sShare — Sharing, made Easy & instant.",
    description:
      "Share and run code together in realtime. Instant links, collaborative editing, and more ways to share coming soon.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`light h-full antialiased ${poppins.variable} ${notoSans.variable} ${ibmPlexMono.variable}`}
    >
      <body className="flex min-h-full flex-col bg-white font-sans text-body-md text-on-background selection:bg-primary-container selection:text-on-primary">
        {children}
      </body>
    </html>
  );
}
