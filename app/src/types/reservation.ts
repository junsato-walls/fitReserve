// 予約システムの型定義
//
// ここで定義するマスタ系の型は「公開API(/public/*)が返す顧客向けの絞り込み版」。
// 管理者向け(/admin/*)は項目が異なるため types/admin.ts、
// スタッフ向けスケジュール(/schedules)は types/schedule.ts を使うこと。

export interface ProjectPublic {
    id: number
    project_code: string
    name: string
    description: string | null
    start_date: string
    end_date: string
    reservation_interval: number
    is_enabled: boolean
}

export interface StorePublic {
    id: number
    store_code: string
    name: string
    postal_code: string | null
    address: string | null
    phone: string | null
    business_hours_start: string | null
    business_hours_end: string | null
    regular_holiday: string | null
    capacity: number
    image_url: string | null
    description: string | null
}

export interface SchoolPublic {
    id: number
    school_code: string
    name: string
    school_type: string
    postal_code: string | null
    address: string | null
}

/** 公開API用スケジュール。残り枠数(available_count)を含む */
export interface SchedulePublic {
    id: number
    store_id: number
    schedule_date: string
    start_time: string
    end_time: string
    capacity: number
    reserved_count: number
    available_count: number
    is_available: boolean
}

export interface Reservation {
    id: number
    reservation_number: string
    project_id: number | null
    store_id: number
    school_id: number
    reservation_date: string
    reservation_time: string
    customer_name: string
    customer_name_kana: string | null
    gender: string
    grade: number | null
    phone: string
    email: string | null
    guardian_name: string | null
    height: number | null
    weight: number | null
    foot_size: number | null
    memo: string | null
    status: "pending" | "confirmed" | "completed" | "cancelled"
    created_at: string
    updated_at: string
}

export interface ReservationWithDetails extends Reservation {
    store_name: string | null
    school_name: string | null
    project_name: string | null
}

export interface ReservationCreate {
    project_id: number | null
    store_id: number
    school_id: number
    reservation_date: string
    reservation_time: string
    customer_name: string
    customer_name_kana?: string
    gender: string
    grade?: number
    phone: string
    email?: string
    guardian_name?: string
    height?: number
    weight?: number
    foot_size?: number
    memo?: string
}

export interface ReservationUpdate {
    project_id?: number | null
    store_id?: number
    school_id?: number
    reservation_date?: string
    reservation_time?: string
    customer_name?: string
    customer_name_kana?: string
    gender?: string
    grade?: number
    phone?: string
    email?: string
    guardian_name?: string
    height?: number
    weight?: number
    foot_size?: number
    status?: "pending" | "confirmed" | "completed" | "cancelled"
    memo?: string
}

