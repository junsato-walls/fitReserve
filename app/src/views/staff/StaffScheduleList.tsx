"use client"

import { Table } from "@/components/base/display/Table";
import {
    Timetable,
    type BadgeTone,
    type TimetableItem,
    type TimetableRange,
} from "@/components/base/display/Timetable";
import { Select } from "@/components/base/forms/Select";
import { Modal } from "@/components/base/overlays/Modal";
import { scheduleSchema, validate } from "@/lib/validation"
import type { StorePublic } from "@/types/reservation"
import { getCurrentUser } from "@/api/Auth"
import { getStores } from "@/api/Reservation"
import {
    createSchedule,
    deleteSchedule,
    getSchedules,
    updateSchedule,
} from "@/api/Schedule"
import { Alert } from "@/components/base/feedback/Alert";
import { Button } from "@/components/base/buttons/Button";
import { Card } from "@/components/base/display/Card";
import { Input } from "@/components/base/forms/Input";
import type { Schedule } from "@/types/schedule"
import { useCallback, useEffect, useMemo, useState } from "react"

/** Select は空文字のvalueを許可しないため、「すべて」を表す値を用意する */
const ALL_FILTER = "all"

/** 予約が入っている枠を動かすと、予約だけが元の日時に取り残されるため禁止する */
const LOCKED_REASON =
    "予約が入っている枠は移動できません。日時を変える場合は予約側で変更してください"

/** JSTの今日をYYYY-MM-DDで返す */
function todayInJst(): string {
    return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date())
}

/** YYYY-MM-DD を日数分ずらす */
function shiftDate(date: string, days: number): string {
    const shifted = new Date(`${date}T00:00:00`)
    shifted.setDate(shifted.getDate() + days)
    return new Intl.DateTimeFormat("sv-SE").format(shifted)
}

/** 曜日つきの見出し（例: 2026-03-15（日）） */
function formatDateLabel(date: string): string {
    const weekday = ["日", "月", "火", "水", "木", "金", "土"][
        new Date(`${date}T00:00:00`).getDay()
    ]
    return `${date}（${weekday}）`
}

export const StaffScheduleList = () => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [schedules, setSchedules] = useState<Schedule[]>([])
    const [stores, setStores] = useState<StorePublic[]>([])
    const [storeMap, setStoreMap] = useState<{ [key: number]: string }>({})

    // 表示形式。タイムテーブルは1日分、一覧は期間で絞り込む
    const [viewMode, setViewMode] = useState<"timetable" | "list">("timetable")
    const [timetableDate, setTimetableDate] = useState<string>(todayInJst())
    const [daySchedules, setDaySchedules] = useState<Schedule[]>([])
    const [dayLoading, setDayLoading] = useState(false)
    // 担当店舗。null は全店舗（admin以上）
    const [myStoreIds, setMyStoreIds] = useState<number[] | null>(null)

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

        // 店舗リストとスケジュール一覧は互いに依存しないため並列に取得する。
        // ローディング表示は fetchData 側でまとめて管理する。
        const [storesResult] = await Promise.all([
            getStores(),
            fetchSchedules({ manageLoading: false }),
        ])

        if (storesResult.success && storesResult.data) {
            setStores(storesResult.data)
            const map: { [key: number]: string } = {}
            storesResult.data.forEach((store) => {
                map[store.id] = store.name
            })
            setStoreMap(map)
        }

        // タイムテーブルの列は担当店舗に絞る（admin以上はnull＝全店舗）
        const user = await getCurrentUser()
        setMyStoreIds(user?.store_ids ?? null)

        setLoading(false)
    }

    const fetchSchedules = async ({ manageLoading = true } = {}) => {
        if (manageLoading) setLoading(true)

        const params: Record<string, string | number | boolean> = {}
        if (storeFilter !== ALL_FILTER) params.store_id = parseInt(storeFilter)
        if (dateFromFilter) params.date_from = dateFromFilter
        if (dateToFilter) params.date_to = dateToFilter
        if (availableFilter !== ALL_FILTER) params.is_available = availableFilter === "true"

        const result = await getSchedules(params)
        if (manageLoading) setLoading(false)

        if (result.success && result.data) {
            setSchedules(result.data)
        } else {
            setError(result.error || "スケジュール一覧の取得に失敗しました")
        }
    }

    /** タイムテーブル用に1日分だけ取得する（一覧の絞り込みとは独立させる） */
    const fetchDaySchedules = useCallback(async (date: string) => {
        setDayLoading(true)
        // 1日分でも「店舗数 × 枠数」になるため、既定の100件では足りない。
        // バックエンドの上限（MAX_LIMIT）まで引く
        const result = await getSchedules({ date_from: date, date_to: date, limit: 500 })
        setDayLoading(false)

        if (result.success && result.data) {
            setDaySchedules(result.data)
        } else {
            setError(result.error || "スケジュールの取得に失敗しました")
        }
    }, [])

    useEffect(() => {
        if (viewMode === "timetable") fetchDaySchedules(timetableDate)
    }, [viewMode, timetableDate, fetchDaySchedules])

    /** タイムテーブルの列。担当店舗のみを並べる */
    const timetableColumns = useMemo(() => {
        const visible = myStoreIds
            ? stores.filter((store) => myStoreIds.includes(store.id))
            : stores
        return visible.map((store) => ({
            id: store.id,
            label: store.name,
            description: `${daySchedules.filter((s) => s.store_id === store.id).length}件`,
        }))
    }, [stores, myStoreIds, daySchedules])

    const timetableItems = useMemo<TimetableItem[]>(
        () =>
            daySchedules.map((schedule) => {
                const remaining = schedule.capacity - schedule.reserved_count
                let tone: BadgeTone = "success"
                let label = `空き${remaining}／${schedule.capacity}`

                if (!schedule.is_available) {
                    tone = "neutral"
                    label = "受付停止"
                } else if (remaining <= 0) {
                    tone = "danger"
                    label = "満席"
                } else if (remaining <= 2) {
                    tone = "warning"
                }

                return {
                    id: schedule.id,
                    columnId: schedule.store_id,
                    start: schedule.start_time,
                    end: schedule.end_time,
                    title: label,
                    subtitle: schedule.memo ?? undefined,
                    tone,
                    // 予約済みの枠は動かせない
                    locked: schedule.reserved_count > 0,
                    lockedReason: LOCKED_REASON,
                }
            }),
        [daySchedules]
    )

    /**
     * ドラッグでの移動を確定する
     *
     * 先に画面を動かしてからAPIを呼ぶ。失敗したら元の位置へ戻す。
     * 保存を待ってから描画すると、掴んだ枠が一瞬元に戻って見えるため。
     */
    const handleMove = async (scheduleId: number, next: TimetableRange) => {
        const target = daySchedules.find((schedule) => schedule.id === scheduleId)
        if (!target) return

        setError(null)
        setSuccess(null)

        const moved: Schedule = {
            ...target,
            store_id: next.columnId,
            start_time: next.start,
            end_time: next.end,
        }
        setDaySchedules((prev) =>
            prev.map((schedule) => (schedule.id === scheduleId ? moved : schedule))
        )

        const result = await updateSchedule(scheduleId, {
            store_id: next.columnId,
            schedule_date: timetableDate,
            start_time: next.start,
            end_time: next.end,
        })

        if (result.success) {
            setSuccess("スケジュールを移動しました")
            fetchDaySchedules(timetableDate)
        } else {
            // 元の位置へ戻す
            setDaySchedules((prev) =>
                prev.map((schedule) => (schedule.id === scheduleId ? target : schedule))
            )
            setError(result.error || "スケジュールの移動に失敗しました")
        }
    }

    /** 空き時間のドラッグから新規作成ダイアログを開く */
    const handleCreateFromRange = (range: TimetableRange) => {
        setEditingSchedule(null)
        setFormData({
            store_id: range.columnId.toString(),
            schedule_date: timetableDate,
            start_time: range.start.substring(0, 5),
            end_time: range.end.substring(0, 5),
            capacity: "1",
            is_available: true,
            memo: "",
        })
        setIsDialogOpen(true)
    }

    const handleSelectItem = (scheduleId: number) => {
        const target = daySchedules.find((schedule) => schedule.id === scheduleId)
        if (target) handleEdit(target)
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
            if (viewMode === "timetable") {
                fetchDaySchedules(timetableDate)
            } else {
                fetchSchedules()
            }
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
            if (viewMode === "timetable") {
                fetchDaySchedules(timetableDate)
            } else {
                fetchSchedules()
            }
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

            <div className="flex gap-2">
                <Button
                    variant={viewMode === "timetable" ? "primary" : "outline"}
                    onClick={() => setViewMode("timetable")}
                    label="タイムテーブル"
                />
                <Button
                    variant={viewMode === "list" ? "primary" : "outline"}
                    onClick={() => setViewMode("list")}
                    label="一覧"
                />
            </div>

            {viewMode === "timetable" ? (
                <Card title={formatDateLabel(timetableDate)}>
                    <div className="flex flex-wrap items-end gap-2 mb-4">
                        <Button
                            variant="outline"
                            onClick={() => setTimetableDate(shiftDate(timetableDate, -1))}
                            label="前の日"
                        />
                        <Button
                            variant="outline"
                            onClick={() => setTimetableDate(todayInJst())}
                            label="今日"
                        />
                        <Button
                            variant="outline"
                            onClick={() => setTimetableDate(shiftDate(timetableDate, 1))}
                            label="次の日"
                        />
                        <Input
                            label="日付"
                            type="date"
                            value={timetableDate}
                            onChange={(e) => setTimetableDate(e.target.value)}
                        />
                    </div>

                    <Timetable
                        columns={timetableColumns}
                        items={timetableItems}
                        loading={dayLoading}
                        emptyMessage="この日のスケジュールはありません"
                        onMove={handleMove}
                        onCreate={handleCreateFromRange}
                        onSelect={handleSelectItem}
                    />
                </Card>
            ) : (
            <>
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
            </>
            )}

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
