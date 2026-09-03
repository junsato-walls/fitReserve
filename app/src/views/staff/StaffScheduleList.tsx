"use client"

import {
    createScheduleBlock,
    deleteScheduleBlock,
    getScheduleDays,
    updateSchedule,
    updateScheduleBlock,
} from "@/api/Schedule"
import { Button } from "@/components/base/buttons/Button"
import { Card } from "@/components/base/display/Card"
import { Table } from "@/components/base/display/Table"
import {
    Timetable,
    type TimetableItem,
    type TimetableRange,
} from "@/components/base/display/Timetable"
import { Alert } from "@/components/base/feedback/Alert"
import { Checkbox } from "@/components/base/forms/Checkbox"
import { Input } from "@/components/base/forms/Input"
import { Modal } from "@/components/base/overlays/Modal"
import type { Tone } from "@/components/base/tokens"
import { toTimeInput } from "@/lib/weekday"
import type { ScheduleBlock, ScheduleDay, ScheduleReservation } from "@/types/schedule"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

/**
 * タイムテーブル上でidの種類を分けるためのオフセット
 *
 * タイムテーブルは1つのid空間しか持てないが、予約と枠止めは別のテーブルの行で
 * idが衝突しうる。種類ごとに範囲をずらして混ざらないようにする。
 */
const BLOCK_ID_OFFSET = 1_000_000
const RESERVATION_ID_OFFSET = 2_000_000

/** 予約ステータスの表示（予約一覧と同じ語彙にそろえる） */
const STATUS_LABELS: Record<ScheduleReservation["status"], string> = {
    pending: "未確認",
    confirmed: "確定",
    completed: "完了",
    cancelled: "取消",
}

/** ステータスごとの色。取消はAPIから返らないが型のために持つ */
const STATUS_TONES: Record<ScheduleReservation["status"], Tone> = {
    pending: "warning",
    confirmed: "info",
    completed: "success",
    cancelled: "neutral",
}

/** 予約はこの画面からは動かせない。日時の変更は予約詳細で行う */
const RESERVATION_LOCKED_REASON =
    "予約はこの画面からは移動できません。日時を変える場合は予約詳細から変更してください"

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

/** "HH:MM:SS" を時（整数）にする。切り上げ指定で終了時刻に使う */
function toHour(time: string, roundUp = false): number {
    const [hour, minute] = time.split(":").map(Number)
    return roundUp && minute > 0 ? hour + 1 : hour
}

export const StaffScheduleList = () => {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const [days, setDays] = useState<ScheduleDay[]>([])
    const [targetDate, setTargetDate] = useState<string>(todayInJst())
    const [viewMode, setViewMode] = useState<"timetable" | "list">("timetable")

    // その日の受付設定を編集する
    const [editingDay, setEditingDay] = useState<ScheduleDay | null>(null)
    const [dayForm, setDayForm] = useState({
        capacity: "1",
        slot_minutes: "30",
        start_time: "",
        end_time: "",
        break_start: "",
        break_end: "",
        is_available: true,
        memo: "",
    })

    // 枠止めを作る・編集する
    const [blockRange, setBlockRange] = useState<TimetableRange | null>(null)
    const [blockTitle, setBlockTitle] = useState("")
    const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null)

    const fetchDays = useCallback(async (date: string) => {
        setLoading(true)
        setError(null)

        const result = await getScheduleDays({ date_from: date })
        setLoading(false)

        if (result.success && result.data) {
            setDays(result.data)
        } else {
            setError(result.error || "タイムテーブルの取得に失敗しました")
        }
    }, [])

    useEffect(() => {
        fetchDays(targetDate)
    }, [targetDate, fetchDays])

    /** 列は店舗ごと。受付しない日はその旨を見出しに出す */
    const columns = useMemo(
        () =>
            days.map((day) => ({
                id: day.store_id,
                label: day.store_name,
                description: day.is_holiday
                    ? "定休日"
                    : !day.is_available
                      ? "受付停止"
                      : `予約${day.reservations.length}件 / 同時${day.capacity}人`,
            })),
        [days],
    )

    /**
     * 表示する時間帯
     *
     * 店舗ごとに営業時間が違うため、その日に並ぶ店舗の営業時間をすべて含む幅にする。
     */
    const [startHour, endHour] = useMemo(() => {
        const open = days.map((day) => toHour(day.start_time))
        const close = days.map((day) => toHour(day.end_time, true))
        if (open.length === 0) return [9, 21]
        return [Math.min(...open), Math.max(...close)]
    }, [days])

    /** タイムテーブルの1マスは、その日で最も細かい刻みに合わせる */
    const slotMinutes = useMemo(() => {
        const values = days.filter((day) => day.is_available).map((day) => day.slot_minutes)
        return values.length > 0 ? Math.min(...values) : 30
    }, [days])

    /**
     * タイムテーブルに置くのは予約と枠止め
     *
     * 空いている枠はブロックにしない。営業時間から等間隔に作られるため、
     * 1つずつ描くと1日ぶんが敷き詰められて予約が埋もれる。
     * 枠の区切りは目盛り線で分かる。
     */
    const items = useMemo<TimetableItem[]>(
        () =>
            days.flatMap((day) => [
                ...day.reservations.map((reservation) => ({
                    id: reservation.id + RESERVATION_ID_OFFSET,
                    columnId: day.store_id,
                    start: reservation.start_time,
                    end: reservation.end_time,
                    title: reservation.customer_name,
                    subtitle: reservation.school_name ?? STATUS_LABELS[reservation.status],
                    tone: STATUS_TONES[reservation.status],
                    locked: true,
                    lockedReason: RESERVATION_LOCKED_REASON,
                })),
                ...day.blocks.map((block) => ({
                    id: block.id + BLOCK_ID_OFFSET,
                    columnId: day.store_id,
                    start: block.start_time,
                    end: block.end_time,
                    title: block.title,
                    subtitle: block.memo ?? undefined,
                    tone: "neutral" as const,
                })),
            ]),
        [days],
    )

    /** タイムテーブル上のidから枠止めを引く */
    const findBlock = useCallback(
        (itemId: number): ScheduleBlock | null => {
            if (itemId < BLOCK_ID_OFFSET || itemId >= RESERVATION_ID_OFFSET) return null
            const blockId = itemId - BLOCK_ID_OFFSET
            for (const day of days) {
                const found = day.blocks.find((block) => block.id === blockId)
                if (found) return found
            }
            return null
        },
        [days],
    )

    /** 枠止めのドラッグ移動 */
    const handleMove = async (itemId: number, next: TimetableRange) => {
        const block = findBlock(itemId)
        if (!block) return

        setError(null)
        setSuccess(null)

        const result = await updateScheduleBlock(block.id, {
            store_id: next.columnId,
            block_date: targetDate,
            start_time: next.start,
            end_time: next.end,
        })

        if (result.success) {
            setSuccess("枠止めを移動しました")
        } else {
            setError(result.error || "枠止めの移動に失敗しました")
        }
        fetchDays(targetDate)
    }

    /** 空き時間のドラッグから枠止めの作成ダイアログを開く */
    const handleCreateFromRange = (range: TimetableRange) => {
        setBlockRange(range)
        setBlockTitle("")
        setEditingBlock(null)
    }

    const handleSelectItem = (itemId: number) => {
        // 予約は詳細画面へ送る。ここで編集できるのは枠止めだけ
        if (itemId >= RESERVATION_ID_OFFSET) {
            router.push(`/staff/reservations/${itemId - RESERVATION_ID_OFFSET}`)
            return
        }

        const block = findBlock(itemId)
        if (block) {
            setEditingBlock(block)
            setBlockTitle(block.title)
            setBlockRange(null)
        }
    }

    const handleSubmitBlock = async () => {
        setError(null)
        setSuccess(null)

        if (editingBlock) {
            const result = await updateScheduleBlock(editingBlock.id, { title: blockTitle })
            if (!result.success) {
                setError(result.error || "枠止めの更新に失敗しました")
                return
            }
            setSuccess("枠止めを更新しました")
        } else if (blockRange) {
            const result = await createScheduleBlock({
                store_id: blockRange.columnId,
                block_date: targetDate,
                start_time: blockRange.start,
                end_time: blockRange.end,
                title: blockTitle || "枠止め",
            })
            if (!result.success) {
                setError(result.error || "枠止めの作成に失敗しました")
                return
            }
            setSuccess("枠止めを追加しました")
        }

        setBlockRange(null)
        setEditingBlock(null)
        fetchDays(targetDate)
    }

    const handleDeleteBlock = async () => {
        if (!editingBlock) return

        setError(null)
        const result = await deleteScheduleBlock(editingBlock.id)
        if (result.success) {
            setSuccess("枠止めを削除しました")
        } else {
            setError(result.error || "枠止めの削除に失敗しました")
        }

        setEditingBlock(null)
        fetchDays(targetDate)
    }

    const handleEditDay = (day: ScheduleDay) => {
        setEditingDay(day)
        setDayForm({
            capacity: String(day.capacity),
            slot_minutes: String(day.slot_minutes),
            start_time: toTimeInput(day.start_time),
            end_time: toTimeInput(day.end_time),
            break_start: toTimeInput(day.break_start),
            break_end: toTimeInput(day.break_end),
            is_available: day.is_available,
            memo: day.memo ?? "",
        })
    }

    const handleSubmitDay = async () => {
        if (!editingDay?.schedule_id) return

        setError(null)
        setSuccess(null)

        const result = await updateSchedule(editingDay.schedule_id, {
            capacity: parseInt(dayForm.capacity),
            slot_minutes: parseInt(dayForm.slot_minutes),
            start_time: dayForm.start_time ? `${dayForm.start_time}:00` : null,
            end_time: dayForm.end_time ? `${dayForm.end_time}:00` : null,
            break_start: dayForm.break_start ? `${dayForm.break_start}:00` : null,
            break_end: dayForm.break_end ? `${dayForm.break_end}:00` : null,
            is_available: dayForm.is_available,
            memo: dayForm.memo || null,
        })

        if (!result.success) {
            setError(result.error || "受付設定の更新に失敗しました")
            return
        }

        setSuccess("受付設定を更新しました")
        setEditingDay(null)
        fetchDays(targetDate)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        スケジュール管理
                    </h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        予約枠は店舗の営業時間から自動で作られます。
                        同時予約数・休憩・受付の可否は日ごとに変更できます。
                    </p>
                </div>

                <div className="flex flex-wrap items-end gap-2">
                    <Button
                        tone="neutral"
                        variant="outlined"
                        size="sm"
                        onClick={() => setTargetDate(shiftDate(targetDate, -1))}
                        label="前の日"
                    />
                    <Button
                        tone="neutral"
                        variant="outlined"
                        size="sm"
                        onClick={() => setTargetDate(todayInJst())}
                        label="今日"
                    />
                    <Button
                        tone="neutral"
                        variant="outlined"
                        size="sm"
                        onClick={() => setTargetDate(shiftDate(targetDate, 1))}
                        label="次の日"
                    />
                    <Input
                        label="日付"
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                    />
                </div>
            </div>

            {success && <Alert tone="success" message={success} />}
            {error && <Alert tone="danger" message={error} />}

            <div className="flex gap-2">
                <Button
                    selected={viewMode === "timetable"}
                    onClick={() => setViewMode("timetable")}
                    label="タイムテーブル"
                />
                <Button
                    selected={viewMode === "list"}
                    onClick={() => setViewMode("list")}
                    label="一覧"
                />
            </div>

            {viewMode === "timetable" ? (
                <Card title={formatDateLabel(targetDate)}>
                    <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
                        色付きのブロックが予約です（クリックで詳細へ）。
                        空いているところをドラッグすると予約以外の予定（枠止め）を追加でき、
                        その時間は予約を受け付けなくなります。
                        枠止めはドラッグで移動、クリックで編集できます。
                    </p>
                    <Timetable
                        columns={columns}
                        items={items}
                        startHour={startHour}
                        endHour={endHour}
                        slotMinutes={slotMinutes}
                        loading={loading}
                        onMove={handleMove}
                        onCreate={handleCreateFromRange}
                        onSelect={handleSelectItem}
                        emptyMessage="この日の予約・枠止めはありません"
                    />
                </Card>
            ) : (
                <Card title={`${formatDateLabel(targetDate)} の受付設定`}>
                    <Table
                        data={days}
                        loading={loading}
                        emptyMessage="受付設定がありません"
                        getRowId={(day) => day.store_id}
                        columns={[
                            { id: "store_name", header: "店舗", accessor: "store_name" },
                            {
                                id: "hours",
                                header: "受付時間",
                                accessor: "start_time",
                                format: (value, row) =>
                                    `${toTimeInput(String(value))}〜${toTimeInput(row.end_time)}`,
                            },
                            {
                                id: "break",
                                header: "休憩",
                                accessor: "break_start",
                                format: (value, row) =>
                                    value
                                        ? `${toTimeInput(String(value))}〜${toTimeInput(row.break_end)}`
                                        : "なし",
                            },
                            { id: "capacity", header: "同時予約数", accessor: "capacity" },
                            {
                                id: "slot_minutes",
                                header: "枠の刻み",
                                accessor: "slot_minutes",
                                format: (value) => `${value}分`,
                            },
                            {
                                id: "slots",
                                header: "枠数",
                                accessor: "slots",
                                format: (value) => `${(value as unknown[]).length}枠`,
                            },
                            {
                                id: "is_available",
                                header: "受付",
                                accessor: "is_available",
                                type: "badge",
                                format: (value, row) =>
                                    row.is_holiday ? "定休日" : value ? "受付中" : "受付停止",
                                badgeTone: (value, row) =>
                                    row.is_holiday ? "neutral" : value ? "success" : "warning",
                            },
                            { id: "memo", header: "備考", accessor: "memo" },
                        ]}
                        actions={[
                            {
                                id: "edit",
                                label: "編集",
                                onClick: (day) => handleEditDay(day),
                                // 設定が無い日はプロジェクト作成時に作られる
                                disabled: (day) => day.schedule_id === null,
                            },
                        ]}
                    />
                </Card>
            )}

            {/* 枠止めの追加・編集 */}
            <Modal
                open={blockRange !== null || editingBlock !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setBlockRange(null)
                        setEditingBlock(null)
                    }
                }}
                title={editingBlock ? "枠止めを編集" : "枠止めを追加"}
                actions={[
                    ...(editingBlock
                        ? [
                              {
                                  id: "delete",
                                  label: "削除",
                                  tone: "danger" as const,
                                  variant: "outlined" as const,
                                  onClick: handleDeleteBlock,
                              },
                          ]
                        : []),
                    {
                        id: "cancel",
                        label: "キャンセル",
                        tone: "neutral" as const,
                        variant: "outlined" as const,
                        onClick: () => {
                            setBlockRange(null)
                            setEditingBlock(null)
                        },
                    },
                    {
                        id: "submit",
                        label: editingBlock ? "更新" : "追加",
                        tone: "info" as const,
                        variant: "filled" as const,
                        onClick: handleSubmitBlock,
                    },
                ]}
            >
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    {editingBlock
                        ? `${toTimeInput(editingBlock.start_time)}〜${toTimeInput(editingBlock.end_time)}`
                        : blockRange
                          ? `${toTimeInput(blockRange.start)}〜${toTimeInput(blockRange.end)}`
                          : ""}
                    の予約を受け付けなくします。
                </p>
                <Input
                    label="用件"
                    fullWidth
                    required
                    value={blockTitle}
                    onChange={(e) => setBlockTitle(e.target.value)}
                    placeholder="昼休み、棚卸し、研修など"
                />
            </Modal>

            {/* その日の受付設定 */}
            <Modal
                open={editingDay !== null}
                onOpenChange={(open) => !open && setEditingDay(null)}
                title={`${editingDay?.store_name ?? ""} ${formatDateLabel(targetDate)}`}
                actions={[
                    {
                        id: "cancel",
                        label: "キャンセル",
                        tone: "neutral" as const,
                        variant: "outlined" as const,
                        onClick: () => setEditingDay(null),
                    },
                    {
                        id: "submit",
                        label: "更新",
                        tone: "info" as const,
                        variant: "filled" as const,
                        onClick: handleSubmitDay,
                    },
                ]}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="同時予約数"
                            type="number"
                            fullWidth
                            required
                            value={dayForm.capacity}
                            onChange={(e) => setDayForm({ ...dayForm, capacity: e.target.value })}
                        />
                        <Input
                            label="枠の刻み（分）"
                            type="number"
                            fullWidth
                            required
                            value={dayForm.slot_minutes}
                            onChange={(e) =>
                                setDayForm({ ...dayForm, slot_minutes: e.target.value })
                            }
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="受付開始"
                            type="time"
                            fullWidth
                            value={dayForm.start_time}
                            onChange={(e) => setDayForm({ ...dayForm, start_time: e.target.value })}
                        />
                        <Input
                            label="受付終了"
                            type="time"
                            fullWidth
                            value={dayForm.end_time}
                            onChange={(e) => setDayForm({ ...dayForm, end_time: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="休憩開始"
                            type="time"
                            fullWidth
                            value={dayForm.break_start}
                            onChange={(e) =>
                                setDayForm({ ...dayForm, break_start: e.target.value })
                            }
                        />
                        <Input
                            label="休憩終了"
                            type="time"
                            fullWidth
                            value={dayForm.break_end}
                            onChange={(e) => setDayForm({ ...dayForm, break_end: e.target.value })}
                        />
                    </div>

                    <Checkbox
                        label="この日は予約を受け付ける"
                        checked={dayForm.is_available}
                        onChange={(e) => setDayForm({ ...dayForm, is_available: e.target.checked })}
                    />

                    <Input
                        label="備考"
                        fullWidth
                        value={dayForm.memo}
                        onChange={(e) => setDayForm({ ...dayForm, memo: e.target.value })}
                        placeholder="臨時休業、増員など"
                    />
                </div>
            </Modal>
        </div>
    )
}
