"use client"

import { Select } from "@/components/base/forms/Select";
import { Table, type BadgeTone } from "@/components/base/display/Table";
import type { ReservationWithDetails, SchoolPublic, StorePublic } from "@/types/reservation"
import { getReservationsForStaff, getSchools, getStores } from "@/api/Reservation"
import { Alert } from "@/components/base/feedback/Alert";
import { Button } from "@/components/base/buttons/Button";
import { Card } from "@/components/base/display/Card";
import { Input } from "@/components/base/forms/Input";
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

/** Radix Select は空文字のvalueを許可しないため、「すべて」を表す値を用意する */
const ALL_FILTER = "all"

export const StaffReservationList = () => {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [reservations, setReservations] = useState<ReservationWithDetails[]>([])
    const [stores, setStores] = useState<StorePublic[]>([])
    const [schools, setSchools] = useState<SchoolPublic[]>([])

    // フィルター
    const [storeFilter, setStoreFilter] = useState<string>(ALL_FILTER)
    const [schoolFilter, setSchoolFilter] = useState<string>(ALL_FILTER)
    const [statusFilter, setStatusFilter] = useState<string>(ALL_FILTER)
    const [dateFromFilter, setDateFromFilter] = useState<string>("")
    const [dateToFilter, setDateToFilter] = useState<string>("")

    useEffect(() => {
        fetchData()
        // 初期表示時のみ実行する（以降は検索ボタンから明示的に再取得する）
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const fetchData = async () => {
        setLoading(true)
        setError(null)

        // 店舗・学校のリストと予約一覧は互いに依存しないため並列に取得する。
        // ローディング表示は fetchData 側でまとめて管理する。
        const [storesResult, schoolsResult] = await Promise.all([
            getStores(),
            getSchools(),
            fetchReservations({ manageLoading: false }),
        ])

        if (storesResult.success && storesResult.data) {
            setStores(storesResult.data)
        }
        if (schoolsResult.success && schoolsResult.data) {
            setSchools(schoolsResult.data)
        }

        setLoading(false)
    }

    const fetchReservations = async ({ manageLoading = true } = {}) => {
        if (manageLoading) setLoading(true)

        const params: Record<string, string | number> = {}
        if (storeFilter !== ALL_FILTER) params.store_id = parseInt(storeFilter)
        if (schoolFilter !== ALL_FILTER) params.school_id = parseInt(schoolFilter)
        if (statusFilter !== ALL_FILTER) params.status = statusFilter
        if (dateFromFilter) params.date_from = dateFromFilter
        if (dateToFilter) params.date_to = dateToFilter

        const result = await getReservationsForStaff(params)
        if (manageLoading) setLoading(false)

        if (result.success && result.data) {
            setReservations(result.data)
        } else {
            setError(result.error || "予約一覧の取得に失敗しました")
        }
    }

    const handleSearch = () => {
        fetchReservations()
    }

    const handleReset = () => {
        setStoreFilter(ALL_FILTER)
        setSchoolFilter(ALL_FILTER)
        setStatusFilter(ALL_FILTER)
        setDateFromFilter("")
        setDateToFilter("")
        setTimeout(() => fetchReservations(), 100)
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

    return (
        <div className="space-y-6">
            <Card title="検索フィルター">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select
                        label="店舗"
                        fullWidth
                        placeholder="すべて"
                        value={storeFilter}
                        onChange={setStoreFilter}
                        options={[{ value: ALL_FILTER, label: "すべて" }, ...stores.map((store) => ({ value: store.id.toString(), label: store.name }))]}
                    />

                    <Select
                        label="学校"
                        fullWidth
                        placeholder="すべて"
                        value={schoolFilter}
                        onChange={setSchoolFilter}
                        options={[{ value: ALL_FILTER, label: "すべて" }, ...schools.map((school) => ({ value: school.id.toString(), label: school.name }))]}
                    />

                    <Select
                        label="ステータス"
                        fullWidth
                        placeholder="すべて"
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={[{ value: ALL_FILTER, label: "すべて" }, { value: "pending", label: "予約受付" }, { value: "confirmed", label: "予約確定" }, { value: "completed", label: "採寸完了" }, { value: "cancelled", label: "キャンセル" }]}
                    />

                    <Input
                        label="予約日（開始）"
                        fullWidth
                        type="date"
                        value={dateFromFilter}
                        onChange={(e) => setDateFromFilter(e.target.value)}
                    />

                    <Input
                        label="予約日（終了）"
                        fullWidth
                        type="date"
                        value={dateToFilter}
                        onChange={(e) => setDateToFilter(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 mt-4">
                    <Button onClick={handleSearch} disabled={loading} label="検索" loadingLabel="検索中..." isLoading={loading} />
                    <Button variant="outline" onClick={handleReset} label="リセット" />
                </div>
            </Card>

            {error && (
                <Alert type="error" message={error} />
            )}

            <Card title={`予約一覧（${reservations.length}件）`}>
                <Table
                    data={reservations}
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
