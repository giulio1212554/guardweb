import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GuardWeb – Sicurezza web preventiva per PMI",
  description:
    "Scopri leak di credenziali, audit di sicurezza e genera policy GDPR e security.txt. Micro-SaaS etico per imprese italiane.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GuardWeb",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className="dark">
      <body className={`${inter.className} antialiased min-h-dvh`}>
        {children}
      </body>
    </html>
  );
}
