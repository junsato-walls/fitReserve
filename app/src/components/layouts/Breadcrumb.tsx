"use client"

import { Breadcrumb as BaseBreadcrumb } from "@/components/base/navigation/Breadcrumb"
import type { BreadcrumbItem } from "@/components/base/navigation/Breadcrumb"
import { useRouter, usePathname } from "next/navigation"
import { useMemo } from "react"

/** URLの区切りと画面名の対応。ここに無いものはパスをそのまま出す */
const PATH_LABELS: Record<string, string> = {
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

/**
 * 現在のURLからパンくずを組み立てる
 *
 * 見た目は base/navigation/Breadcrumb に任せ、ここでは「何を出すか」だけを決める。
 */
export const Breadcrumb = () => {
    const pathname = usePathname()
    const router = useRouter()

    const items = useMemo<BreadcrumbItem[]>(() => {
        const segments = pathname.split("/").filter(Boolean)
        let current = ""

        return [
            { label: "ホーム", href: "/", onClick: () => router.push("/") },
            ...segments.map((segment) => {
                current += `/${segment}`
                const href = current
                return {
                    label: PATH_LABELS[segment] ?? segment,
                    href,
                    // base/ は Next.js に依存しないため <a> を描画する。
                    // 全体再読み込みを避けるためクリックはルーターに渡す。
                    onClick: () => router.push(href),
                }
            }),
        ]
    }, [pathname, router])

    if (pathname === "/") return null

    return (
        <div className="mb-4">
            <BaseBreadcrumb items={items} />
        </div>
    )
}
