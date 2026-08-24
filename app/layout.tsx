import type { Metadata, Viewport } from "next";
import { BottomNav } from "@/components/layout/BottomNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "CarMeet",
  description: "Find and organize local car meets.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0c0e" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <div className="flex-1 pb-20">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
