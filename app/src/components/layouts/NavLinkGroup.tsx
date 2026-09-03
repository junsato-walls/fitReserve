"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { NavLink } from "./navLinks"

interface NavLinkGroupProps {
    /** 見出し（「スタッフ機能」など） */
    title: string
    links: NavLink[]
    /** サイドバーは compact、スマートフォンのメニューは指で押せる comfortable */
    density?: "compact" | "comfortable"
    /** リンクを押したときの追加処理（メニューを閉じるなど） */
    onNavigate?: () => void
}

/**
 * ナビゲーションリンクのひとかたまり
 *
 * サイドバーとスマートフォン用メニューで見た目を揃えるため、
 * 描画はここに集約する（リンクの定義は navLinks.ts）。
 */
export const NavLinkGroup = ({
    title,
    links,
    density = "compact",
    onNavigate,
}: NavLinkGroupProps) => {
    const pathname = usePathname()
    const isComfortable = density === "comfortable"

    return (
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
                            onClick={onNavigate}
                            className={cn(
                                "flex items-center gap-3 rounded-md font-medium transition-colors",
                                isComfortable ? "px-4 py-3 text-base" : "px-4 py-2 text-sm",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700",
                            )}
                        >
                            <Icon
                                className={isComfortable ? "w-5 h-5" : "w-4 h-4"}
                                aria-hidden="true"
                            />
                            {link.label}
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
