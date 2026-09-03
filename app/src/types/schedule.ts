// スケジュール管理の型定義
//
// スケジュールは「店舗 × 日」の受付設定。時間枠そのものは持たず、
// 受付時間（未指定なら店舗の営業時間）を slot_minutes で割って導出する。

/** 店舗×日の受付設定 */
export interface Schedule {
    id: number
    store_id: number
    schedule_date: string
    /** その日の同時予約数 */
    capacity: number
    /** 予約枠の刻み（分） */
    slot_minutes: number
    /** 受付開始時刻。null なら店舗の営業開始時間 */
    start_time: string | null
    /** 受付終了時刻。null なら店舗の営業終了時間 */
    end_time: string | null
    /** 休憩開始時刻（任意）。この間は枠を作らない */
    break_start: string | null
    break_end: string | null
    /** その日に受付するか（定休日・臨時休業は false） */
    is_available: boolean
    memo: string | null
    created_by: number
    updated_by: number
    created_at: string
    updated_at: string
    deleted_at: string | null
}

export interface ScheduleCreate {
    store_id: number
    schedule_date: string
    capacity: number
    slot_minutes?: number
    start_time?: string | null
    end_time?: string | null
    break_start?: string | null
    break_end?: string | null
    is_available?: boolean
    memo?: string | null
    created_by: number
    updated_by: number
}

/** 店舗・日付は変更できない（別の日の設定は別の行として作る） */
export interface ScheduleUpdate {
    capacity?: number
    slot_minutes?: number
    start_time?: string | null
    end_time?: string | null
    break_start?: string | null
    break_end?: string | null
    is_available?: boolean
    memo?: string | null
    updated_by?: number
}

/** 予約以外の用途で時間を埋めるもの（休憩・棚卸し・研修など） */
export interface ScheduleBlock {
    id: number
    store_id: number
    block_date: string
    start_time: string
    end_time: string
    title: string
    memo: string | null
    created_by: number
    updated_by: number
    created_at: string
    updated_at: string
}

export interface ScheduleBlockCreate {
    store_id: number
    block_date: string
    start_time: string
    end_time: string
    title: string
    memo?: string | null
    created_by: number
    updated_by: number
}

export interface ScheduleBlockUpdate {
    store_id?: number
    block_date?: string
    start_time?: string
    end_time?: string
    title?: string
    memo?: string | null
    updated_by?: number
}

/** 受付時間から導出した予約枠1つ分 */
export interface ScheduleSlot {
    start_time: string
    end_time: string
    capacity: number
    reserved_count: number
    available_count: number
}

/** タイムテーブルに出す予約1件分 */
export interface ScheduleReservation {
    id: number
    reservation_number: string
    start_time: string
    /** 予約時刻＋その日の枠の刻み（予約自体は終了時刻を持たない） */
    end_time: string
    customer_name: string
    school_name: string | null
    status: "pending" | "confirmed" | "completed" | "cancelled"
}

/** タイムテーブル1日分（店舗ごと） */
export interface ScheduleDay {
    store_id: number
    store_name: string
    schedule_date: string
    /** 設定が未登録の日は null */
    schedule_id: number | null
    is_available: boolean
    /** 店舗の定休日か */
    is_holiday: boolean
    capacity: number
    slot_minutes: number
    /** 店舗の営業時間を反映済みの受付時間 */
    start_time: string
    end_time: string
    break_start: string | null
    break_end: string | null
    memo: string | null
    slots: ScheduleSlot[]
    blocks: ScheduleBlock[]
    /** その日の予約（取り消し分を除く） */
    reservations: ScheduleReservation[]
}
