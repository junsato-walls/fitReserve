"use client"

import { cn } from "@/lib/utils";
import { getRoleLabel, hasMinRole } from "@/lib/roles";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_LINKS, STAFF_LINKS } from "./navLinks";

interface SidebarProps {
    role?: string
}

export const Sidebar = ({ role = "staff" }: SidebarProps) => {
    const pathname = usePathname()
    // lg未満ではヘッダーのハンバーガーメニュー（MobileNavMenu）が代わりを務めるため隠す
    return (
        <div className="hidden lg:flex flex-col h-full w-64 border-r bg-white dark:bg-gray-900 dark:border-gray-700">
            <div className="p-6 border-b dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">fitReserve</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {getRoleLabel(role)}
                </p>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                        スタッフ機能
                    </p>
                    {STAFF_LINKS.map((link) => {
                        const Icon = link.icon
                        const isActive = pathname === link.href
                        return (
                            <Link key={link.href} href={link.href}>
                                <div
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-primary text-primary-foreground"
                                            : "text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    {link.label}
                                </div>
                            </Link>
                        )
                    })}
                </div>

                {/* super_admin も管理者機能を使うため、一致比較ではなく階層で判定する */}
                {hasMinRole(role, "admin") && (
                    <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                            管理者機能
                        </p>
                        {ADMIN_LINKS.map((link) => {
                            const Icon = link.icon
                            const isActive = pathname === link.href
                            return (
                                <Link key={link.href} href={link.href}>
                                    <div
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-primary text-primary-foreground"
                                                : "text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                                        )}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {link.label}
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </nav>
        </div>
    )
}
