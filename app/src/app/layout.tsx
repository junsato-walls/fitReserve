import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_JP } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Loading from "./loading";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "fitReserve",
  description: "制服採寸の予約管理システム",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${notoSans.variable} ${notoSansJP.variable} antialiased relative min-h-screen font-sans`}>
        <Suspense fallback={<Loading />}>
          {children}
        </Suspense>
      </body>
    </html>
  );
}