import {
    Calendar,
    ClipboardList,
    Folder,
    LayoutDashboard,
    School,
    Store,
    Users,
    type LucideIcon,
} from "lucide-react"

export interface NavLink {
    href: string
    label: string
    icon: LucideIcon
}

/**
 * サイドバーとスマートフォン用メニューで共有するナビゲーション定義
 *
 * 2箇所に同じリンクを書くとメニューの追加漏れが起きるため、ここに集約する。
 */
export const STAFF_LINKS: NavLink[] = [
    { href: "/staff", label: "ダッシュボード", icon: LayoutDashboard },
    { href: "/staff/reservations", label: "予約一覧", icon: ClipboardList },
    { href: "/staff/schedules", label: "スケジュール管理", icon: Calendar },
]

export const ADMIN_LINKS: NavLink[] = [
    { href: "/admin/stores", label: "店舗管理", icon: Store },
    { href: "/admin/schools", label: "学校管理", icon: School },
    { href: "/admin/projects", label: "プロジェクト管理", icon: Folder },
    { href: "/admin/users", label: "ユーザー管理", icon: Users },
]
