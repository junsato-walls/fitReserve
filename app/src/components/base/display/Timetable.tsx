"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import type { Tone } from "@/components/base/tokens"
import { cn } from "@/lib/utils"

// 用途の語彙は base/Badge が一元管理する。
// 利用側が Badge を直接importせずに済むよう再エクスポートする。

/**
 * 縦軸1マスの高さ(px)。時間軸の目盛りと項目の高さはこの倍数になる。
 *
 * 1マスの中に「時間」と「見出し」の2行を収める必要がある。
 * 行の高さ(15px)×2 + 上下の余白(8px) + 枠線(2px) = 40px が最低限で、
 * それを下回ると文字が枠からはみ出すため余裕を持たせている。
 */
const SLOT_HEIGHT = 52

/** クリックとドラッグを区別する移動量(px) */
const DRAG_THRESHOLD = 4

export interface TimetableColumn {
    id: number
    label: string
    /** 列ヘッダーの補足（例: 「3件」） */
    description?: string
}

export interface TimetableItem {
    id: number
    /** 属する列のid */
    columnId: number
    /** 開始時刻。"HH:MM" または "HH:MM:SS" */
    start: string
    /** 終了時刻。"HH:MM" または "HH:MM:SS" */
    end: string
    title: string
    subtitle?: string
    /** 用途で色を決める（既定は info） */
    tone?: Tone
    /**
     * 移動できない項目
     *
     * 「予約が入っている枠は動かせない」のような業務ルールは
     * 利用側にしか判断できないため、結果だけを受け取る。
     */
    locked?: boolean
    /** 移動できない理由。掴もうとしたときに表示・読み上げる */
    lockedReason?: string
}

/** 列と時間帯の組。作成・移動の結果として返す */
export interface TimetableRange {
    columnId: number
    /** "HH:MM:SS" */
    start: string
    /** "HH:MM:SS" */
    end: string
}

export interface TimetableProps {
    columns: TimetableColumn[]
    items: TimetableItem[]
    /** 表示する時間帯（時）。既定は9時〜21時。範囲外の項目があれば自動で広がる */
    startHour?: number
    endHour?: number
    /** 1マスの分数。既定は30分 */
    slotMinutes?: number
    /** 項目の移動。省略すると移動できない（表示専用になる） */
    onMove?: (itemId: number, next: TimetableRange) => void
    /** 空き時間のドラッグによる新規作成。省略すると作成できない */
    onCreate?: (range: TimetableRange) => void
    /** 項目のクリック／Enter */
    onSelect?: (itemId: number) => void
    loading?: boolean
    emptyMessage?: string
}

/** 項目のブロックの配色。用途語彙ごとに一元管理する */
const TONE_CLASSES: Record<Tone, string> = {
    neutral:
        "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200",
    info: "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100",
    success:
        "bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700 text-green-900 dark:text-green-100",
    warning:
        "bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100",
    danger: "bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700 text-red-900 dark:text-red-100",
}

/** "HH:MM" / "HH:MM:SS" を0時からの分に変換する */
function toMinutes(time: string): number {
    const [hour, minute] = time.split(":")
    return Number(hour) * 60 + Number(minute)
}

/** 分を "HH:MM:SS" に変換する（APIへ渡す形式） */
function toTimeString(minutes: number): string {
    const hour = Math.floor(minutes / 60)
    const minute = minutes % 60
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`
}

/** 分を "HH:MM" に変換する（画面表示用） */
function toTimeLabel(minutes: number): string {
    const hour = Math.floor(minutes / 60)
    const minute = minutes % 60
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
}

/** 位置とサイズをマス単位で表した項目 */
interface Placed {
    item: TimetableItem
    columnIndex: number
    startSlot: number
    slots: number
    /** 重なりを横に並べるための位置 */
    lane: number
    laneCount: number
}

/** 操作中の項目の仮位置 */
interface Preview {
    mode: "move" | "create"
    /** 移動中の項目。新規作成中はnull */
    itemId: number | null
    columnIndex: number
    startSlot: number
    slots: number
    /** 他の項目と重なっていて確定できない状態 */
    invalid: boolean
    /** キーボード操作による移動中か（見た目と案内文を変える） */
    byKeyboard: boolean
}

/**
 * タイムテーブル
 *
 * 縦軸を時間、横軸を任意の列（店舗・会場など）にして予定を並べる。
 * ドラッグでの移動・新規作成に対応し、同じ操作をキーボードでも行える。
 */
export const Timetable = ({
    columns,
    items,
    startHour = 9,
    endHour = 21,
    slotMinutes = 30,
    onMove,
    onCreate,
    onSelect,
    loading = false,
    emptyMessage = "予定がありません",
}: TimetableProps) => {
    const gridRef = useRef<HTMLDivElement>(null)
    const [preview, setPreview] = useState<Preview | null>(null)
    const [announcement, setAnnouncement] = useState("")
    // ドラッグ直後のクリックで詳細が開いてしまうのを防ぐ
    const draggedRef = useRef(false)
    const pointerRef = useRef<{
        id: number
        startX: number
        startY: number
        offsetSlots: number
    } | null>(null)

    // 表示する時間帯。範囲外の項目があると描画できないため、項目に合わせて広げる
    const { dayStart, totalSlots } = useMemo(() => {
        let first = startHour * 60
        let last = endHour * 60
        for (const item of items) {
            first = Math.min(first, Math.floor(toMinutes(item.start) / 60) * 60)
            last = Math.max(last, Math.ceil(toMinutes(item.end) / 60) * 60)
        }
        return {
            dayStart: first,
            totalSlots: Math.max(1, (last - first) / slotMinutes),
        }
    }, [items, startHour, endHour, slotMinutes])

    /** 項目をマス単位に変換し、重なりを横に並べる位置を決める */
    const placed = useMemo(() => {
        const result: Placed[] = []

        for (const [columnIndex, column] of columns.entries()) {
            const inColumn = items
                .filter((item) => item.columnId === column.id)
                .map((item) => {
                    const start = toMinutes(item.start)
                    const end = Math.max(toMinutes(item.end), start + slotMinutes)
                    return {
                        item,
                        startSlot: Math.round((start - dayStart) / slotMinutes),
                        slots: Math.round((end - start) / slotMinutes),
                    }
                })
                .sort((a, b) => a.startSlot - b.startSlot || a.slots - b.slots)

            // 重なり合う項目のかたまりごとに、必要なレーン数を数える
            let cluster: Placed[] = []
            let clusterEnd = -1
            const laneEnds: number[] = []

            const flush = () => {
                for (const entry of cluster) entry.laneCount = laneEnds.length || 1
                result.push(...cluster)
                cluster = []
                laneEnds.length = 0
                clusterEnd = -1
            }

            for (const entry of inColumn) {
                if (entry.startSlot >= clusterEnd && cluster.length > 0) flush()

                let lane = laneEnds.findIndex((end) => end <= entry.startSlot)
                if (lane === -1) {
                    lane = laneEnds.length
                    laneEnds.push(0)
                }
                laneEnds[lane] = entry.startSlot + entry.slots

                cluster.push({ ...entry, columnIndex, lane, laneCount: 1 })
                clusterEnd = Math.max(clusterEnd, entry.startSlot + entry.slots)
            }
            if (cluster.length > 0) flush()
        }

        return result
    }, [columns, items, dayStart, slotMinutes])

    /** 同じ列の他の項目と重なるか */
    const hasConflict = useCallback(
        (columnIndex: number, startSlot: number, slots: number, excludeId: number | null) =>
            placed.some(
                (entry) =>
                    entry.columnIndex === columnIndex &&
                    entry.item.id !== excludeId &&
                    startSlot < entry.startSlot + entry.slots &&
                    entry.startSlot < startSlot + slots,
            ),
        [placed],
    )

    /** ポインタ位置を列と行に読み替える */
    const locate = useCallback(
        (clientX: number, clientY: number) => {
            const grid = gridRef.current
            if (!grid) return null

            const rect = grid.getBoundingClientRect()
            const columnWidth = rect.width / Math.max(1, columns.length)
            return {
                columnIndex: clamp(
                    Math.floor((clientX - rect.left) / columnWidth),
                    0,
                    columns.length - 1,
                ),
                // 端数は四捨五入せず切り捨てる。掴んだ位置から自然にずれるのを防ぐ
                slot: Math.floor((clientY - rect.top) / SLOT_HEIGHT),
            }
        },
        [columns.length],
    )

    const buildRange = useCallback(
        (columnIndex: number, startSlot: number, slots: number): TimetableRange => ({
            columnId: columns[columnIndex].id,
            start: toTimeString(dayStart + startSlot * slotMinutes),
            end: toTimeString(dayStart + (startSlot + slots) * slotMinutes),
        }),
        [columns, dayStart, slotMinutes],
    )

    const describe = useCallback(
        (columnIndex: number, startSlot: number, slots: number) => {
            const start = dayStart + startSlot * slotMinutes
            const end = start + slots * slotMinutes
            return `${columns[columnIndex].label} ${toTimeLabel(start)}から${toTimeLabel(end)}`
        },
        [columns, dayStart, slotMinutes],
    )

    // ---- ドラッグ（ポインタ操作）----

    const handleItemPointerDown = (event: React.PointerEvent<HTMLButtonElement>, entry: Placed) => {
        if (!onMove) return
        if (entry.item.locked) {
            setAnnouncement(entry.item.lockedReason ?? "この予定は移動できません")
            return
        }
        // 左ボタン以外（右クリック等）では始めない
        if (event.button !== 0) return

        const position = locate(event.clientX, event.clientY)
        if (!position) return

        draggedRef.current = false
        pointerRef.current = {
            id: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            // 掴んだ位置と項目の先頭のずれを保持し、掴んだ場所を基準に動かす
            offsetSlots: position.slot - entry.startSlot,
        }
        event.currentTarget.setPointerCapture(event.pointerId)

        setPreview({
            mode: "move",
            itemId: entry.item.id,
            columnIndex: entry.columnIndex,
            startSlot: entry.startSlot,
            slots: entry.slots,
            invalid: false,
            byKeyboard: false,
        })
    }

    const handleColumnPointerDown = (
        event: React.PointerEvent<HTMLDivElement>,
        columnIndex: number,
    ) => {
        if (!onCreate) return
        if (event.button !== 0) return
        // 項目の上から始まったドラッグは移動として扱う
        if (event.target !== event.currentTarget) return

        const position = locate(event.clientX, event.clientY)
        if (!position) return

        const startSlot = clamp(position.slot, 0, totalSlots - 1)
        draggedRef.current = false
        pointerRef.current = {
            id: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            offsetSlots: 0,
        }
        event.currentTarget.setPointerCapture(event.pointerId)

        setPreview({
            mode: "create",
            itemId: null,
            columnIndex,
            startSlot,
            slots: 1,
            invalid: hasConflict(columnIndex, startSlot, 1, null),
            byKeyboard: false,
        })
    }

    const handlePointerMove = (event: React.PointerEvent) => {
        const pointer = pointerRef.current
        if (!pointer || pointer.id !== event.pointerId || !preview) return

        if (
            Math.abs(event.clientX - pointer.startX) > DRAG_THRESHOLD ||
            Math.abs(event.clientY - pointer.startY) > DRAG_THRESHOLD
        ) {
            draggedRef.current = true
        }

        const position = locate(event.clientX, event.clientY)
        if (!position) return

        if (preview.mode === "move") {
            const startSlot = clamp(
                position.slot - pointer.offsetSlots,
                0,
                totalSlots - preview.slots,
            )
            setPreview({
                ...preview,
                columnIndex: position.columnIndex,
                startSlot,
                invalid: hasConflict(
                    position.columnIndex,
                    startSlot,
                    preview.slots,
                    preview.itemId,
                ),
            })
            return
        }

        // 新規作成は掴んだマスを起点に、上下どちらへ伸ばしてもよい
        const anchor = pointer.offsetSlots === 0 ? preview : preview
        const current = clamp(position.slot, 0, totalSlots - 1)
        const startSlot = Math.min(anchor.startSlot, current)
        const slots = Math.abs(current - anchor.startSlot) + 1
        setPreview({
            ...preview,
            startSlot: preview.startSlot,
            slots,
            invalid: hasConflict(preview.columnIndex, startSlot, slots, null),
        })
    }

    const handlePointerUp = (event: React.PointerEvent) => {
        const pointer = pointerRef.current
        if (!pointer || pointer.id !== event.pointerId) return
        pointerRef.current = null

        const current = preview
        setPreview(null)
        if (!current || current.byKeyboard) return

        if (current.mode === "create") {
            if (!draggedRef.current || current.invalid || !onCreate) return
            onCreate(buildRange(current.columnIndex, current.startSlot, current.slots))
            return
        }

        if (!draggedRef.current || !onMove || current.itemId === null) return
        if (current.invalid) {
            setAnnouncement("他の予定と重なるため移動できません")
            return
        }
        onMove(current.itemId, buildRange(current.columnIndex, current.startSlot, current.slots))
        setAnnouncement(
            `${describe(current.columnIndex, current.startSlot, current.slots)} へ移動しました`,
        )
    }

    // ---- キーボード操作 ----
    //
    // Space で掴み、矢印キーで動かし、Enter で確定する（Escで取り消し）。
    // ドラッグと同じことをポインタなしで行えるようにするため。

    const handleItemKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, entry: Placed) => {
        const grabbed = preview?.byKeyboard && preview.itemId === entry.item.id

        if (event.key === " ") {
            event.preventDefault()
            if (!onMove) return
            if (entry.item.locked) {
                setAnnouncement(entry.item.lockedReason ?? "この予定は移動できません")
                return
            }
            if (grabbed) {
                commitKeyboardMove()
                return
            }
            setPreview({
                mode: "move",
                itemId: entry.item.id,
                columnIndex: entry.columnIndex,
                startSlot: entry.startSlot,
                slots: entry.slots,
                invalid: false,
                byKeyboard: true,
            })
            setAnnouncement("移動を開始しました。矢印キーで動かし、Enterで確定、Escで取り消します")
            return
        }

        if (event.key === "Escape" && grabbed) {
            event.preventDefault()
            setPreview(null)
            setAnnouncement("移動を取り消しました")
            return
        }

        if (event.key === "Enter") {
            event.preventDefault()
            if (grabbed) {
                commitKeyboardMove()
                return
            }
            onSelect?.(entry.item.id)
            return
        }

        if (!grabbed || !preview) return

        const step: Record<string, [number, number]> = {
            ArrowUp: [0, -1],
            ArrowDown: [0, 1],
            ArrowLeft: [-1, 0],
            ArrowRight: [1, 0],
        }
        const delta = step[event.key]
        if (!delta) return

        event.preventDefault()
        const columnIndex = clamp(preview.columnIndex + delta[0], 0, columns.length - 1)
        const startSlot = clamp(preview.startSlot + delta[1], 0, totalSlots - preview.slots)
        setPreview({
            ...preview,
            columnIndex,
            startSlot,
            invalid: hasConflict(columnIndex, startSlot, preview.slots, preview.itemId),
        })
        setAnnouncement(describe(columnIndex, startSlot, preview.slots))
    }

    const commitKeyboardMove = () => {
        if (!preview || preview.itemId === null) return
        if (preview.invalid) {
            setAnnouncement("他の予定と重なるため移動できません")
            return
        }
        onMove?.(preview.itemId, buildRange(preview.columnIndex, preview.startSlot, preview.slots))
        setAnnouncement(
            `${describe(preview.columnIndex, preview.startSlot, preview.slots)} へ移動しました`,
        )
        setPreview(null)
    }

    // ---- 描画 ----

    const bodyHeight = totalSlots * SLOT_HEIGHT

    const hourMarks = useMemo(() => {
        const marks: number[] = []
        for (let slot = 0; slot <= totalSlots; slot += 60 / slotMinutes) {
            marks.push(slot)
        }
        return marks
    }, [totalSlots, slotMinutes])

    if (columns.length === 0) {
        return (
            <p className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                {emptyMessage}
            </p>
        )
    }

    return (
        <div className="relative">
            {loading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 dark:bg-gray-900/70">
                    <span className="text-sm text-gray-600 dark:text-gray-300">読み込み中...</span>
                </div>
            )}

            {/*
              スクロールは親（画面）に任せ、ここでは持たない。
              独自にスクロール領域を作ると画面と二重にスクロールバーが出る。
              列と重なりは幅の割合で配置しているため、常に親の幅に収まる。
            */}
            <div>
                {/* 列見出し */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <div className="w-14 shrink-0" />
                    <div className="flex flex-1">
                        {columns.map((column) => (
                            <div
                                key={column.id}
                                className="flex-1 px-2 py-2 text-center border-l border-gray-200 dark:border-gray-700"
                            >
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {column.label}
                                </p>
                                {column.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {column.description}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex">
                    {/* 時間軸 */}
                    <div
                        className="relative w-14 shrink-0"
                        style={{ height: bodyHeight }}
                        aria-hidden="true"
                    >
                        {hourMarks.map((slot) => (
                            <span
                                key={slot}
                                className="absolute right-2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400"
                                style={{ top: slot * SLOT_HEIGHT }}
                            >
                                {toTimeLabel(dayStart + slot * slotMinutes)}
                            </span>
                        ))}
                    </div>

                    {/* 予定の領域 */}
                    <div
                        ref={gridRef}
                        className="relative flex flex-1 select-none"
                        style={{ height: bodyHeight }}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                    >
                        {columns.map((column, columnIndex) => (
                            <div
                                key={column.id}
                                className="relative flex-1 border-l border-gray-200 dark:border-gray-700 touch-none"
                                style={{ touchAction: "none" }}
                                onPointerDown={(event) =>
                                    handleColumnPointerDown(event, columnIndex)
                                }
                            >
                                {/* 目盛り線 */}
                                {Array.from({ length: totalSlots }, (_, slot) => (
                                    <div
                                        key={slot}
                                        className={cn(
                                            "absolute inset-x-0 border-t pointer-events-none",
                                            (slot * slotMinutes) % 60 === 0
                                                ? "border-gray-200 dark:border-gray-700"
                                                : "border-gray-100 dark:border-gray-800",
                                        )}
                                        style={{ top: slot * SLOT_HEIGHT }}
                                    />
                                ))}

                                {/* 新規作成中の範囲 */}
                                {preview?.mode === "create" &&
                                    preview.columnIndex === columnIndex && (
                                        <div
                                            className={cn(
                                                "absolute inset-x-1 z-10 rounded-md border-2 border-dashed pointer-events-none flex items-center justify-center text-xs",
                                                preview.invalid
                                                    ? "border-red-400 text-red-600 dark:text-red-400"
                                                    : "border-blue-400 text-blue-600 dark:text-blue-400",
                                            )}
                                            style={{
                                                top: preview.startSlot * SLOT_HEIGHT,
                                                height: preview.slots * SLOT_HEIGHT,
                                            }}
                                        >
                                            {toTimeLabel(
                                                dayStart + preview.startSlot * slotMinutes,
                                            )}
                                            {" - "}
                                            {toTimeLabel(
                                                dayStart +
                                                    (preview.startSlot + preview.slots) *
                                                        slotMinutes,
                                            )}
                                        </div>
                                    )}
                            </div>
                        ))}

                        {/* 予定のブロック。列をまたいで動かすため、列の外側に重ねて置く */}
                        {placed.map((entry) => {
                            const moving =
                                preview?.mode === "move" && preview.itemId === entry.item.id
                            const columnIndex = moving ? preview.columnIndex : entry.columnIndex
                            const startSlot = moving ? preview.startSlot : entry.startSlot
                            const columnWidth = 100 / columns.length
                            const laneWidth = columnWidth / entry.laneCount
                            const start = dayStart + startSlot * slotMinutes
                            const end = start + entry.slots * slotMinutes

                            return (
                                <button
                                    key={entry.item.id}
                                    type="button"
                                    className={cn(
                                        "absolute z-10 flex flex-col justify-center gap-0.5 overflow-hidden",
                                        "rounded-md border px-2 py-1 text-left text-xs leading-tight transition-shadow touch-none",
                                        TONE_CLASSES[entry.item.tone ?? "info"],
                                        moving
                                            ? preview.invalid
                                                ? "ring-2 ring-red-500 opacity-90 cursor-not-allowed"
                                                : "ring-2 ring-blue-500 opacity-90 shadow-lg"
                                            : "",
                                        onMove && !entry.item.locked
                                            ? "cursor-grab"
                                            : "cursor-pointer",
                                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                                    )}
                                    style={{
                                        top: startSlot * SLOT_HEIGHT + 1,
                                        height: entry.slots * SLOT_HEIGHT - 2,
                                        left: `calc(${
                                            columnIndex * columnWidth + entry.lane * laneWidth
                                        }% + 2px)`,
                                        width: `calc(${laneWidth}% - 4px)`,
                                        touchAction: "none",
                                    }}
                                    aria-label={`${entry.item.title} ${toTimeLabel(
                                        start,
                                    )}から${toTimeLabel(end)} ${
                                        columns[columnIndex].label
                                    }${entry.item.locked ? "（移動不可）" : ""}`}
                                    onPointerDown={(event) => handleItemPointerDown(event, entry)}
                                    onKeyDown={(event) => handleItemKeyDown(event, entry)}
                                    onClick={() => {
                                        // ドラッグで指を離した直後は詳細を開かない
                                        if (draggedRef.current) {
                                            draggedRef.current = false
                                            return
                                        }
                                        onSelect?.(entry.item.id)
                                    }}
                                >
                                    <span className="block font-medium truncate">
                                        {toTimeLabel(start)} - {toTimeLabel(end)}
                                    </span>
                                    <span className="block truncate">{entry.item.title}</span>
                                    {/* 3行目以降は2マス以上のときだけ。1マスに詰め込むと文字が欠ける */}
                                    {entry.item.subtitle && entry.slots > 1 && (
                                        <span className="block truncate opacity-80">
                                            {entry.item.subtitle}
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {items.length === 0 && !loading && (
                <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    {emptyMessage}
                </p>
            )}

            {/* 操作方法の案内。ドラッグできることは見ただけでは分からない */}
            {(onMove || onCreate) && (
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    {onMove &&
                        "予定はドラッグで移動できます（キーボードはSpaceで掴み、矢印キーで移動、Enterで確定）。"}
                    {onCreate && "空いている時間帯を縦にドラッグすると新規作成できます。"}
                </p>
            )}

            {/* 操作結果を読み上げる */}
            <p aria-live="polite" className="sr-only">
                {announcement}
            </p>
        </div>
    )
}
