"use client"

import { getRoleLabel, hasMinRole } from "@/lib/roles"
import type { UserRole } from "@/types/admin"
import { ADMIN_LINKS, STAFF_LINKS } from "./navLinks"
import { NavLinkGroup } from "./NavLinkGroup"

interface SidebarProps {
    role?: UserRole
}

export const Sidebar = ({ role = "readonly" }: SidebarProps) => {
    // lg未満ではヘッダーのハンバーガーメニュー（MobileNavMenu）が代わりを務めるため隠す
    return (
        <div className="hidden lg:flex flex-col h-full w-64 border-r bg-white dark:bg-gray-900 dark:border-gray-700">
            <div className="p-6 border-b dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">fitReserve</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {getRoleLabel(role)}
                </p>
            </div>

            <nav className="flex-1 p-4 space-y-4">
                <NavLinkGroup title="スタッフ機能" links={STAFF_LINKS} />
                {/* super_admin も管理者機能を使うため、一致比較ではなく階層で判定する */}
                {hasMinRole(role, "admin") && (
                    <NavLinkGroup title="管理者機能" links={ADMIN_LINKS} />
                )}
            </nav>
        </div>
    )
}
