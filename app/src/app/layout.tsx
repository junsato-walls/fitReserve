import type { Metadata } from "next"
import { Noto_Sans, Noto_Sans_JP } from "next/font/google"
import { Suspense } from "react"
import { cookies } from "next/headers"
import "./globals.css"
import Loading from "./loading"
import { THEME_COOKIE, THEME_INIT_SCRIPT, parseThemePreference } from "@/lib/theme"

const notoSans = Noto_Sans({
    variable: "--font-noto-sans",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
})

const notoSansJP = Noto_Sans_JP({
    variable: "--font-noto-sans-jp",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
    title: "fitReserve",
    description: "制服採寸の予約管理システム",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    // ライト/ダークを明示選択している場合は、ここでクラスを確定させて
    // 初回描画時のちらつきを防ぐ。system の場合はスクリプト側で解決する。
    const cookieStore = await cookies()
    const preference = parseThemePreference(cookieStore.get(THEME_COOKIE)?.value)
    const htmlClass = preference === "dark" ? "dark" : undefined

    return (
        <html lang="ja" className={htmlClass} suppressHydrationWarning>
            <head>
                {/* system 設定時にOSの配色を反映する。描画前に同期実行する必要がある */}
                <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
            </head>
            <body
                className={`${notoSans.variable} ${notoSansJP.variable} antialiased relative min-h-screen font-sans`}
            >
                <Suspense fallback={<Loading />}>{children}</Suspense>
            </body>
        </html>
    )
}
