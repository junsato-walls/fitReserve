"use client"

import { LogOut, Settings } from "lucide-react"
import { logout } from "@/api/Auth"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Avatar } from "@/components/base/display/Avatar"
import { Modal } from "@/components/base/overlays/Modal"
import { cn } from "@/lib/utils"
import { ADMIN_LINKS, STAFF_LINKS, type NavLink } from "./navLinks"
import { ThemeToggle } from "./ThemeToggle"

interface MobileNavMenuProps {
    open: boolean
    onClose: () => void
    /** "admin" のときだけ管理者機能を出す（Sidebar と同じ条件） */
    role?: string
    userName?: string
    personalId?: string
    avatarSrc?: string
}

/**
 * スマートフォン・タブレット用のメニュー（全画面モーダル）
 *
 * この幅では UserMenu（ヘッダー右上のアバター）を出さないため、
 * スタッフ機能の一覧に加えてアカウント操作もここに含める。
 * ログアウト以外の項目の処理は UserMenu と同じく未実装。
 * リンク定義は `navLinks.ts` でサイドバーと共有する。
 */
export const MobileNavMenu = ({
    open,
    onClose,
    role = "staff",
    userName = "ゲスト",
    personalId,
    avatarSrc,
}: MobileNavMenuProps) => {
    const pathname = usePathname()

    const accountItemClasses =
        "flex items-center gap-3 w-full px-4 py-3 text-base text-left text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-200 dark:focus:bg-gray-700"

    const renderGroup = (title: string, links: NavLink[]) => (
        <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                {title}
            </p>
            <div className="space-y-1">
                {links.map((link) => {
                    const Icon = link.icon
                    const isActive = pathname === link.href
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            // 遷移先に移ったらメニューは用済みなので閉じる
                            onClick={onClose}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                            )}
                        >
                            <Icon className="w-5 h-5" aria-hidden="true" />
                            {link.label}
                        </Link>
                    )
                })}
            </div>
        </div>
    )

    return (
        <Modal
            open={open}
            onClose={onClose}
            fullScreen
            title="メニュー"
            id="mobile-nav"
            bodyClassName="space-y-6"
        >
            {/* ユーザー情報 */}
            <div className="flex items-center gap-3">
                <Avatar src={avatarSrc} name={userName} size="lg" shape="circle" />
                <div className="min-w-0">
                    <p className="text-base font-medium text-gray-900 dark:text-white truncate">
                        {userName}
                    </p>
                    {personalId && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            @{personalId}
                        </p>
                    )}
                </div>
            </div>

            {renderGroup("スタッフ機能", STAFF_LINKS)}
            {role === "admin" && renderGroup("管理者機能", ADMIN_LINKS)}

            {/* アカウント操作（PCでは UserMenu 側にある） */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                <ThemeToggle />

                <div className="space-y-1">
                    <button type="button" className={accountItemClasses}>
                        <Settings className="w-5 h-5" aria-hidden="true" />
                        設定
                    </button>
                    <button
                        type="button"
                        className={accountItemClasses}
                        // Cookieはサーバー側(httpOnly)にあるため、Server Actionで削除する
                        onClick={() => logout()}
                    >
                        <LogOut className="w-5 h-5" aria-hidden="true" />
                        ログアウト
                    </button>
                </div>
            </div>
        </Modal>
    )
}
