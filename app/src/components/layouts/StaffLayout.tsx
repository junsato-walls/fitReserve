"use client"

import type { CurrentUser } from "@/api/Auth"
import { ReactNode } from "react"
import { Breadcrumb } from "./Breadcrumb"
import { Header } from "./Header"
import { Sidebar } from "./Sidebar"

interface StaffLayoutProps {
    children: ReactNode
    /** ログイン中のユーザー（middlewareで検証済みの表示用データ） */
    user?: CurrentUser | null
}

/**
 * 社内向け画面（staff / admin）の共通レイアウト
 *
 * ヘッダー・サイドバー・パンくずをまとめて持つ。
 * ヘッダーをページ側に置くとログアウトやテーマ切替が無い画面が生まれるため、
 * ここに内蔵して選べないようにしている。
 */
export const StaffLayout = ({ children, user }: StaffLayoutProps) => {
    // 未取得時は最小権限に倒す（管理者メニューを出さない）
    const role = user?.role ?? "readonly"

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <Header userName={user?.user_name} personalId={user?.personal_id} role={role} />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar role={role} />
                <div className="flex-1 overflow-y-auto">
                    <div className="p-8">
                        <Breadcrumb />
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}
