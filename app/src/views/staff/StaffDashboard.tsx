"use client"

import { Table, type BadgeTone } from "@/components/base/display/Table";
import type { ReservationWithDetails } from "@/types/reservation"
import { formatDateForApi } from "@/lib/formatDate"
import { getReservationsForStaff } from "@/api/Reservation"
import { Alert } from "@/components/base/feedback/Alert";
import { Button } from "@/components/base/buttons/Button";
import { Card } from "@/components/base/display/Card";
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export const StaffDashboard = () => {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [stats, setStats] = useState({
        todayCount: 0,
        weekCount: 0,
        pendingCount: 0,
        confirmedCount: 0,
    })
    const [recentReservations, setRecentReservations] = useState<ReservationWithDetails[]>([])

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        setLoading(true)
        setError(null)

        const today = new Date()
        const todayStr = formatDateForApi(today)

        // 7日後の日付
        const weekLater = new Date(today)
        weekLater.setDate(weekLater.getDate() + 7)
        const weekLaterStr = formatDateForApi(weekLater)

        // 5件の取得は互いに依存しないため並列に実行する。
        // 直列にすると Server Action の往復コストがそのまま5倍積み上がる。
        const [
            todayResult,      // 今日の予約
            weekResult,       // 今週の予約
            recentResult,     // 最近の予約（全体）
            pendingResult,    // 未確認の予約
            confirmedResult,  // 確定済みの予約
        ] = await Promise.all([
            getReservationsForStaff({ date_from: todayStr, date_to: todayStr }),
            getReservationsForStaff({ date_from: todayStr, date_to: weekLaterStr }),
            getReservationsForStaff({ limit: 5 }),
            getReservationsForStaff({ status: "pending" }),
            getReservationsForStaff({ status: "confirmed" }),
        ])

        setLoading(false)

        if (
            todayResult.success &&
            weekResult.success &&
            recentResult.success &&
            pendingResult.success &&
            confirmedResult.success
        ) {
            setStats({
                todayCount: todayResult.data?.length || 0,
                weekCount: weekResult.data?.length || 0,
                pendingCount: pendingResult.data?.length || 0,
                confirmedCount: confirmedResult.data?.length || 0,
            })
            setRecentReservations(recentResult.data || [])
        } else {
            setError("ダッシュボードの読み込みに失敗しました")
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "pending":
                return "予約受付"
            case "confirmed":
                return "予約確定"
            case "completed":
                return "採寸完了"
            case "cancelled":
                return "キャンセル"
            default:
                return status
        }
    }

    // 色そのものではなく用途を返す。実際の配色は base/Table が持つ
    const getStatusTone = (status: string): BadgeTone => {
        switch (status) {
            case "pending":
                return "warning"
            case "confirmed":
                return "info"
            case "completed":
                return "success"
            case "cancelled":
                return "neutral"
            default:
                return "neutral"
        }
    }

    if (error) {
        return (
            <Alert type="error" message={error} />
        )
    }

    return (
        <div className="space-y-6">
            {/* 統計カード */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card title="本日の予約">
                    <div className="text-3xl font-bold">
                        {loading ? "-" : stats.todayCount}
                    </div>
                </Card>

                <Card title="今週の予約">
                    <div className="text-3xl font-bold">
                        {loading ? "-" : stats.weekCount}
                    </div>
                </Card>

                <Card title="未確認">
                    <div className="text-3xl font-bold text-yellow-600">
                        {loading ? "-" : stats.pendingCount}
                    </div>
                </Card>

                <Card title="確定済み">
                    <div className="text-3xl font-bold text-blue-600">
                        {loading ? "-" : stats.confirmedCount}
                    </div>
                </Card>
            </div>

            {/* 最近の予約 */}
            <Card
                title="最近の予約"
                headerActions={
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/staff/reservations")}
                        label="すべて見る"
                    />
                }
            >
                    <Table
                        data={recentReservations}
                        loading={loading}
                        emptyMessage="予約が見つかりません"
                        getRowId={(reservation) => reservation.id}
                        columns={[
                            { id: "reservation_number", header: "予約番号", accessor: "reservation_number" },
                            {
                                id: "reservation_date",
                                header: "予約日時",
                                accessor: "reservation_date",
                                format: (value, row) =>
                                    `${value ?? ""} ${row.reservation_time?.substring(0, 5) ?? ""}`.trim(),
                            },
                            { id: "customer_name", header: "顧客名", accessor: "customer_name" },
                            { id: "store_name", header: "店舗", accessor: "store_name" },
                            { id: "school_name", header: "学校", accessor: "school_name" },
                            {
                                id: "status",
                                header: "ステータス",
                                accessor: "status",
                                type: "badge",
                                format: (value) => getStatusLabel(String(value)),
                                badgeTone: (value) => getStatusTone(String(value)),
                            },
                        ]}
                        actions={[
                            {
                                id: "detail",
                                label: "詳細",
                                onClick: (reservation) => router.push(`/staff/reservations/${reservation.id}`),
                            },
                        ]}
                    />
            </Card>
        </div>
    )
}
