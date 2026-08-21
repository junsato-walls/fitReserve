"use client"

import Table from "@/components/base/layouts/Table"
import Select from "@/components/base/forms/Select"
import Modal from "@/components/base/overlays/Modal"
import { scheduleSchema, validate } from "@/lib/validation"
import type { StorePublic } from "@/types/reservation"
import { getStores } from "@/actions/Reservation"
import {
    createSchedule,
    deleteSchedule,
    getSchedules,
    updateSchedule,
} from "@/actions/Schedule"
import Alert from "@/components/base/feedback/Alert"
import Button from "@/components/base/buttons/Button"
import Card from "@/components/base/layouts/Card"
import Input from "@/components/base/forms/Input"
import type { Schedule } from "@/types/schedule"
import { useEffect, useState } from "react"

/** Radix Select は空文字のvalueを許可しないため、「すべて」を表す値を用意する */
const ALL_FILTER = "all"

export const StaffScheduleList = () => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [schedules, setSchedules] = useState<Schedule[]>([])
    const [stores, setStores] = useState<StorePublic[]>([])
    const [storeMap, setStoreMap] = useState<{ [key: number]: string }>({})

    // フィルター
    const [storeFilter, setStoreFilter] = useState<string>(ALL_FILTER)
    const [dateFromFilter, setDateFromFilter] = useState<string>("")
    const [dateToFilter, setDateToFilter] = useState<string>("")
    const [availableFilter, setAvailableFilter] = useState<string>(ALL_FILTER)

    // フォーム
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null)

    const [formData, setFormData] = useState({
        store_id: "",
        schedule_date: "",
        start_time: "",
        end_time: "",
        capacity: "1",
        is_available: true,
        memo: "",
    })

    useEffect(() => {
        fetchData()
        // 初期表示時のみ実行する（以降は検索ボタンから明示的に再取得する）
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const fetchData = async () => {
        setLoading(true)
        setError(null)

        const [storesResult] = await Promise.all([getStores()])

        if (storesResult.success && storesResult.data) {
            setStores(storesResult.data)
            const map: { [key: number]: string } = {}
            storesResult.data.forEach((store) => {
                map[store.id] = store.name
            })
            setStoreMap(map)
        }

        await fetchSchedules()
    }

    const fetchSchedules = async () => {
        setLoading(true)

        const params: Record<string, string | number | boolean> = {}
        if (storeFilter !== ALL_FILTER) params.store_id = parseInt(storeFilter)
        if (dateFromFilter) params.date_from = dateFromFilter
        if (dateToFilter) params.date_to = dateToFilter
        if (availableFilter !== ALL_FILTER) params.is_available = availableFilter === "true"

        const result = await getSchedules(params)
        setLoading(false)

        if (result.success && result.data) {
            setSchedules(result.data)
        } else {
            setError(result.error || "スケジュール一覧の取得に失敗しました")
        }
    }

    const handleSearch = () => {
        fetchSchedules()
    }

    const handleReset = () => {
        setStoreFilter(ALL_FILTER)
        setDateFromFilter("")
        setDateToFilter("")
        setAvailableFilter(ALL_FILTER)
        setTimeout(() => fetchSchedules(), 100)
    }

    const handleCreate = () => {
        setEditingSchedule(null)
        setFormData({
            store_id: "",
            schedule_date: "",
            start_time: "",
            end_time: "",
            capacity: "1",
            is_available: true,
            memo: "",
        })
        setIsDialogOpen(true)
    }

    const handleEdit = (schedule: Schedule) => {
        setEditingSchedule(schedule)
        setFormData({
            store_id: schedule.store_id.toString(),
            schedule_date: schedule.schedule_date,
            start_time: schedule.start_time.substring(0, 5),
            end_time: schedule.end_time.substring(0, 5),
            capacity: schedule.capacity.toString(),
            is_available: schedule.is_available,
            memo: schedule.memo || "",
        })
        setIsDialogOpen(true)
    }

    const handleSubmit = async () => {
        setError(null)
        setSuccess(null)

        // created_by / updated_by はServer Action側でログインユーザーから補完される
        const data = {
            store_id: parseInt(formData.store_id),
            schedule_date: formData.schedule_date,
            start_time: formData.start_time + ":00",
            end_time: formData.end_time + ":00",
            capacity: parseInt(formData.capacity),
            is_available: formData.is_available,
            memo: formData.memo || undefined,
        }

        const validationError = validate(scheduleSchema, data)
        if (validationError) {
            setError(validationError)
            return
        }

        let result
        if (editingSchedule) {
            result = await updateSchedule(editingSchedule.id, data)
        } else {
            result = await createSchedule(data)
        }

        if (result.success) {
            setSuccess(
                editingSchedule
                    ? "スケジュールを更新しました"
                    : "スケジュールを作成しました"
            )
            setIsDialogOpen(false)
            fetchSchedules()
        } else {
            setError(result.error || "スケジュールの保存に失敗しました")
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return

        setError(null)
        setSuccess(null)

        const result = await deleteSchedule(deleteTarget.id)

        if (result.success) {
            setSuccess("スケジュールを削除しました")
            setDeleteTarget(null)
            fetchSchedules()
        } else {
            setError(result.error || "スケジュールの削除に失敗しました")
            setDeleteTarget(null)
        }
    }

    const getAvailableCount = (schedule: Schedule) => {
        return schedule.capacity - schedule.reserved_count
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">スケジュール管理</h1>
                <Button onClick={handleCreate} label="新規作成" />
            </div>

            {success && (
                <Alert type="success" message={success} />
            )}

            {error && (
                <Alert type="error" message={error} />
            )}

            <Card title="検索フィルター">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Select
                        label="店舗"
                        fullWidth
                        placeholder="すべて"
                        value={storeFilter}
                        onChange={setStoreFilter}
                        options={[{ value: ALL_FILTER, label: "すべて" }, ...stores.map((store) => ({ value: store.id.toString(), label: store.name }))]}
                    />

                    <Input
                        label="日付（開始）"
                        fullWidth
                        type="date"
                        value={dateFromFilter}
                        onChange={(e) => setDateFromFilter(e.target.value)}
                    />

                    <Input
                        label="日付（終了）"
                        fullWidth
                        type="date"
                        value={dateToFilter}
                        onChange={(e) => setDateToFilter(e.target.value)}
                    />

                    <Select
                        label="予約可否"
                        fullWidth
                        placeholder="すべて"
                        value={availableFilter}
                        onChange={setAvailableFilter}
                        options={[{ value: ALL_FILTER, label: "すべて" }, { value: "true", label: "予約可能" }, { value: "false", label: "予約不可" }]}
                    />
                </div>

                <div className="flex gap-2 mt-4">
                    <Button onClick={handleSearch} disabled={loading} label="検索" loadingLabel="検索中..." isLoading={loading} />
                    <Button variant="outline" onClick={handleReset} label="リセット" />
                </div>
            </Card>

            <Card title={`スケジュール一覧（${schedules.length}件）`}>
                <Table
                    data={schedules}
                    loading={loading}
                    emptyMessage="スケジュールが見つかりません"
                    getRowId={(schedule) => schedule.id}
                    columns={[
                        { id: "schedule_date", header: "日付", accessor: "schedule_date" },
                        {
                            id: "time",
                            header: "時間帯",
                            accessor: "start_time",
                            format: (value, row) =>
                                `${String(value).substring(0, 5)} - ${row.end_time.substring(0, 5)}`,
                        },
                        {
                            id: "store",
                            header: "店舗",
                            accessor: "store_id",
                            format: (value) => storeMap[value as number] ?? "-",
                        },
                        { id: "capacity", header: "受付可能数", accessor: "capacity" },
                        { id: "reserved_count", header: "予約済", accessor: "reserved_count" },
                        {
                            id: "available",
                            header: "残り",
                            accessor: "capacity",
                            type: "badge",
                            format: (_value, row) => String(getAvailableCount(row)),
                            badgeTone: (_value, row) => {
                                const remaining = getAvailableCount(row)
                                if (remaining <= 0) return "danger"
                                if (remaining <= 2) return "warning"
                                return "success"
                            },
                        },
                        {
                            id: "is_available",
                            header: "状態",
                            accessor: "is_available",
                            type: "boolean",
                            booleanLabels: { true: "予約可能", false: "予約不可" },
                        },
                        {
                            id: "memo",
                            header: "備考",
                            accessor: "memo",
                            format: (value) => (value ? String(value).substring(0, 20) : ""),
                        },
                    ]}
                    actions={[
                        { id: "edit", label: "編集", onClick: (schedule) => handleEdit(schedule) },
                        {
                            id: "delete",
                            label: "削除",
                            destructive: true,
                            // 予約が入っている枠は削除できない
                            disabled: (schedule) => schedule.reserved_count > 0,
                            onClick: (schedule) => setDeleteTarget(schedule),
                        },
                    ]}
                />
            </Card>

            {/* 作成・編集ダイアログ */}
            <Modal
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                title={editingSchedule ? "スケジュール編集" : "スケジュール新規作成"}
                size="md"
                actions={[
                    { id: "cancel", label: "キャンセル", variant: "secondary", onClick: () => setIsDialogOpen(false) },
                    { id: "submit", label: editingSchedule ? "更新" : "作成", variant: "primary", onClick: handleSubmit },
                ]}
            >
                    <div className="space-y-4">
                        <Select
                            label="店舗"
                            fullWidth
                            placeholder="店舗を選択"
                            value={formData.store_id}
                            onChange={(value) =>
                                setFormData({ ...formData, store_id: value })
                            }
                            options={stores.map((store) => ({ value: store.id.toString(), label: store.name }))}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="日付"
                                fullWidth
                                type="date"
                                value={formData.schedule_date}
                                onChange={(e) =>
                                    setFormData({ ...formData, schedule_date: e.target.value })
                                }
                            />
                            <Input
                                label="受付可能数"
                                fullWidth
                                type="number"
                                min="1"
                                value={formData.capacity}
                                onChange={(e) =>
                                    setFormData({ ...formData, capacity: e.target.value })
                                }
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="開始時刻"
                                fullWidth
                                type="time"
                                value={formData.start_time}
                                onChange={(e) =>
                                    setFormData({ ...formData, start_time: e.target.value })
                                }
                            />
                            <Input
                                label="終了時刻"
                                fullWidth
                                type="time"
                                value={formData.end_time}
                                onChange={(e) =>
                                    setFormData({ ...formData, end_time: e.target.value })
                                }
                            />
                        </div>

                        <Select
                            label="予約可否"
                            fullWidth
                            value={formData.is_available.toString()}
                            onChange={(value) =>
                                setFormData({ ...formData, is_available: value === "true" })
                            }
                            options={[
                            { value: "true", label: "予約可能" },
                            { value: "false", label: "予約不可" },
                            ]}
                        />

                        <Input
                            label="備考"
                            fullWidth
                            value={formData.memo}
                            onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                            placeholder="備考を入力"
                        />
                    </div>
            </Modal>

            {/* 削除確認ダイアログ */}
            <Modal
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="スケジュールを削除しますか？"
                size="sm"
                actions={[
                    { id: "cancel", label: "キャンセル", variant: "secondary", onClick: () => !open && setDeleteTarget(null) },
                    { id: "action", label: "削除する", variant: "danger", onClick: handleDelete },
                ]}
            >
                <p className="text-sm text-gray-600 dark:text-gray-300">
                            この操作は取り消せません。削除後は復元できません。
                </p>
            </Modal>
        </div>
    )
}
