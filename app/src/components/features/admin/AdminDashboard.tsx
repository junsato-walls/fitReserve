"use client"

import { getProjectsAdmin } from "@/actions/Project"
import { getSchoolsAdmin } from "@/actions/School"
import { getStoresAdmin } from "@/actions/Store"
import { getUsersAdmin } from "@/actions/User"
import Alert from "@/components/base/feedback/Alert"
import Card from "@/components/base/layouts/Card"
import { Building2, GraduationCap, FolderKanban, Users } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface MasterSummary {
    stores: number
    schools: number
    projects: number
    users: number
}

const MASTER_LINKS = [
    {
        key: "stores" as const,
        label: "店舗管理",
        href: "/admin/stores",
        description: "店舗マスタの登録・編集",
        Icon: Building2,
    },
    {
        key: "schools" as const,
        label: "学校管理",
        href: "/admin/schools",
        description: "学校マスタの登録・編集",
        Icon: GraduationCap,
    },
    {
        key: "projects" as const,
        label: "プロジェクト管理",
        href: "/admin/projects",
        description: "予約受付期間の設定",
        Icon: FolderKanban,
    },
    {
        key: "users" as const,
        label: "ユーザー管理",
        href: "/admin/users",
        description: "スタッフアカウントの管理",
        Icon: Users,
    },
]

export const AdminDashboard = () => {
    const [summary, setSummary] = useState<MasterSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchSummary = async () => {
            setLoading(true)
            setError(null)

            const [storesResult, schoolsResult, projectsResult, usersResult] =
                await Promise.all([
                    getStoresAdmin(),
                    getSchoolsAdmin(),
                    getProjectsAdmin(),
                    getUsersAdmin(),
                ])

            const failed = [storesResult, schoolsResult, projectsResult, usersResult].find(
                (result) => !result.success
            )
            if (failed) {
                setError(failed.error || "マスタ情報の取得に失敗しました")
            }

            setSummary({
                stores: storesResult.data?.length ?? 0,
                schools: schoolsResult.data?.length ?? 0,
                projects: projectsResult.data?.length ?? 0,
                users: usersResult.data?.length ?? 0,
            })
            setLoading(false)
        }

        fetchSummary()
    }, [])

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">管理者ダッシュボード</h1>
                <p className="text-sm text-gray-500 mt-1">
                    マスタデータの登録状況と各管理画面へのリンク
                </p>
            </div>

            {error && (
                <Alert type="error" message={error} />
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {MASTER_LINKS.map(({ key, label, href, description, Icon }) => (
                    <Link key={key} href={href} className="block">
                        <Card
                            className="h-full"
                            clickable
                            title={label}
                            titleSize="sm"
                            titleIcon={<Icon className="h-5 w-5 text-gray-500" aria-hidden="true" />}
                        >
                            <p className="text-3xl font-bold">
                                {loading ? "-" : (summary?.[key] ?? 0)}
                                <span className="ml-1 text-sm font-normal text-gray-500">件</span>
                            </p>
                            <p className="mt-2 text-sm text-gray-500">{description}</p>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}
