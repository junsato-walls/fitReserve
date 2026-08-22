"use client"

import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export const Breadcrumb = () => {
    const pathname = usePathname()
    const [breadcrumbs, setBreadcrumbs] = useState<{ label: string; href: string }[]>([])

    useEffect(() => {
        const paths = pathname.split("/").filter((p) => p)
        const items: { label: string; href: string }[] = [
            { label: "ホーム", href: "/" },
        ]

        const pathMapping: { [key: string]: string } = {
            staff: "スタッフ",
            reservations: "予約一覧",
            schedules: "スケジュール",
            admin: "管理者",
            stores: "店舗管理",
            schools: "学校管理",
            projects: "プロジェクト管理",
            users: "ユーザー管理",
            new: "新規作成",
            check: "確認",
        }

        let currentPath = ""
        paths.forEach((path) => {
            currentPath += `/${path}`
            const label = pathMapping[path] || path
            items.push({ label, href: currentPath })
        })

        setBreadcrumbs(items)
    }, [pathname])

    if (pathname === "/") return null

    return (
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
            {breadcrumbs.map((item, index) => (
                <div key={item.href} className="flex items-center">
                    {index > 0 && <ChevronRight className="w-4 h-4 mx-2 text-gray-400 dark:text-gray-500" />}
                    {index === 0 ? (
                        <Link href={item.href}>
                            <div className="flex items-center hover:text-gray-900 dark:hover:text-white">
                                <Home className="w-4 h-4 mr-1" />
                                {item.label}
                            </div>
                        </Link>
                    ) : index === breadcrumbs.length - 1 ? (
                        <span className="font-medium text-gray-900 dark:text-white">{item.label}</span>
                    ) : (
                        <Link href={item.href}>
                            <span className="hover:text-gray-900 dark:hover:text-white">{item.label}</span>
                        </Link>
                    )}
                </div>
            ))}
        </div>
    )
}
