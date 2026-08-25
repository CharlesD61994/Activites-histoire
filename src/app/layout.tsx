import type { Metadata } from "next";
import "./globals.css";
import "./reader-system.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Alinéa - Activités d’histoire",
  description: "Application de création, d’assignation et de présentation d’activités d’histoire.",
  icons: {
    icon: "/alinea-icon.svg",
    shortcut: "/alinea-icon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
