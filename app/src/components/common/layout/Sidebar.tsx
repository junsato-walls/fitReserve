"use client"

import Button from "@/components/base/buttons/Button"
import { cn } from "@/lib/utils"
import {
    Calendar,
    ClipboardList,
    Folder,
    LayoutDashboard,
    LogOut,
    School,
    Store,
    Users,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface SidebarProps {
    role?: string
}

export const Sidebar = ({ role = "staff" }: SidebarProps) => {
    const pathname = usePathname()

    const staffLinks = [
        {
            href: "/staff",
            label: "ダッシュボード",
            icon: LayoutDashboard,
        },
        {
            href: "/staff/reservations",
            label: "予約一覧",
            icon: ClipboardList,
        },
        {
            href: "/staff/schedules",
            label: "スケジュール管理",
            icon: Calendar,
        },
    ]

    const adminLinks = [
        {
            href: "/admin/stores",
            label: "店舗管理",
            icon: Store,
        },
        {
            href: "/admin/schools",
            label: "学校管理",
            icon: School,
        },
        {
            href: "/admin/projects",
            label: "プロジェクト管理",
            icon: Folder,
        },
        {
            href: "/admin/users",
            label: "ユーザー管理",
            icon: Users,
        },
    ]

    const handleLogout = () => {
        localStorage.removeItem("token")
        window.location.href = "/login"
    }

    return (
        <div className="flex flex-col h-full w-64 border-r bg-gray-50">
            <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">fitReserve</h2>
                <p className="text-sm text-gray-600 mt-1">
                    {role === "admin" ? "管理者" : "スタッフ"}
                </p>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                        スタッフ機能
                    </p>
                    {staffLinks.map((link) => {
                        const Icon = link.icon
                        const isActive = pathname === link.href
                        return (
                            <Link key={link.href} href={link.href}>
                                <div
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-primary text-primary-foreground"
                                            : "text-gray-700 hover:bg-gray-200"
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    {link.label}
                                </div>
                            </Link>
                        )
                    })}
                </div>

                {role === "admin" && (
                    <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                            管理者機能
                        </p>
                        {adminLinks.map((link) => {
                            const Icon = link.icon
                            const isActive = pathname === link.href
                            return (
                                <Link key={link.href} href={link.href}>
                                    <div
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-primary text-primary-foreground"
                                                : "text-gray-700 hover:bg-gray-200"
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

                <div className="pt-4 border-t">
                    <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={handleLogout}
                        label="ログアウト"
                        leftIcon={<LogOut className="w-4 h-4" />}
                    />
                </div>
            </nav>
        </div>
    )
}
