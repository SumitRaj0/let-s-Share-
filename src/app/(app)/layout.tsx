import { AuthProvider } from "@/components/auth/AuthProvider";
import { IconFontLoader } from "@/components/IconFontLoader";

/**
 * App shell: auth + icon font only on product routes (not marketing home).
 * Announcement banner removed for a cleaner product UI.
 */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <IconFontLoader />
      {children}
    </AuthProvider>
  );
}
