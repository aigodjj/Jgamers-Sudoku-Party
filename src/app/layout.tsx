
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { LocaleProvider } from "@/i18n";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { MusicProvider } from "@/components/audio/MusicProvider";

export const metadata: Metadata = {
  title: "Jgamers Sudoku Party",
  description: "Solve cute Sudoku puzzles, collect outfits, and race your friends.",
  applicationName: "Jgamers Sudoku Party",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-TW">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen antialiased">
        <LocaleProvider>
          <MusicProvider>
            <SiteLayout>{children}</SiteLayout>
          </MusicProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
