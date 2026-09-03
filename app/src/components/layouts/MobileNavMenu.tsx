"use client"

import { LogOut, Settings } from "lucide-react"
import { logout } from "@/api/Auth"
import { Avatar } from "@/components/base/display/Avatar"
import { Modal } from "@/components/base/overlays/Modal"
import { hasMinRole } from "@/lib/roles"
import type { UserRole } from "@/types/admin"
import { ADMIN_LINKS, STAFF_LINKS } from "./navLinks"
import { NavLinkGroup } from "./NavLinkGroup"
import { ThemeToggle } from "./ThemeToggle"

interface MobileNavMenuProps {
    open: boolean
    onClose: () => void
    /** "admin" のときだけ管理者機能を出す（Sidebar と同じ条件） */
    role?: UserRole
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
    role = "readonly",
    userName = "ゲスト",
    personalId,
    avatarSrc,
}: MobileNavMenuProps) => {
    const accountItemClasses =
        "flex items-center gap-3 w-full px-4 py-3 text-base text-left text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-200 dark:focus:bg-gray-700"

    return (
        <Modal
            open={open}
            onOpenChange={(next) => !next && onClose()}
            fullScreen
            title="メニュー"
            id="mobile-nav"
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

            <NavLinkGroup
                title="スタッフ機能"
                links={STAFF_LINKS}
                density="comfortable"
                // 遷移先に移ったらメニューは用済みなので閉じる
                onNavigate={onClose}
            />
            {/* super_admin も管理者機能を使うため、一致比較ではなく階層で判定する */}
            {hasMinRole(role, "admin") && (
                <NavLinkGroup
                    title="管理者機能"
                    links={ADMIN_LINKS}
                    density="comfortable"
                    onNavigate={onClose}
                />
            )}

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
