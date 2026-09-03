"use client"

import type { UserRole } from "@/types/admin"
import { Menu } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { MobileNavMenu } from "./MobileNavMenu"
import { UserMenu } from "./UserMenu"

interface HeaderProps {
    /** 表示名。未取得のときは UserMenu 側の既定値を使う */
    userName?: string
    /** 社員ID */
    personalId?: string
    /** アバター画像のURL */
    avatarSrc?: string
    /** ロール。管理者機能を出すかの判定に使う */
    role?: UserRole
}

/**
 * アプリケーション共通のヘッダー
 *
 * 左に企業ロゴ、右に操作の入口を置く。
 * 右側は画面幅で入れ替える:
 *   - lg以上（PC）      : ユーザーアイコン（UserMenu）
 *   - lg未満（スマホ/タブレット）: ハンバーガーボタン（MobileNavMenu）
 * サイドバーが出せない幅ではメニューを1箇所にまとめるため、
 * スタッフ機能の一覧もアカウント操作もハンバーガー側に集約する。
 */
export const Header = ({ userName, personalId, avatarSrc, role = "readonly" }: HeaderProps) => {
    const [isNavOpen, setIsNavOpen] = useState(false)

    return (
        <header className="z-40 shrink-0 flex items-center justify-between h-14 px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <Link
                href="/"
                className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-800 rounded"
            >
                {/* 元画像は 96x50。高さ32pxに合わせて縮小する */}
                <Image
                    src="/nonoyama.png"
                    alt="ノノヤマ"
                    width={96}
                    height={50}
                    priority
                    className="h-8 w-auto"
                />
            </Link>

            {/* スマホ・タブレット: ハンバーガー */}
            <button
                type="button"
                onClick={() => setIsNavOpen(true)}
                aria-label="メニューを開く"
                aria-expanded={isNavOpen}
                className="lg:hidden -mr-1 p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-800"
            >
                <Menu className="w-6 h-6" aria-hidden="true" />
            </button>

            {/* PC: ユーザーアイコン */}
            <div className="hidden lg:block">
                <UserMenu userName={userName} personalId={personalId} avatarSrc={avatarSrc} />
            </div>

            <MobileNavMenu
                open={isNavOpen}
                onClose={() => setIsNavOpen(false)}
                role={role}
                userName={userName}
                personalId={personalId}
                avatarSrc={avatarSrc}
            />
        </header>
    )
}
