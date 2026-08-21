// スケジュール管理の型定義

export interface Schedule {
    id: number
    store_id: number
    schedule_date: string
    start_time: string
    end_time: string
    capacity: number
    reserved_count: number
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
    start_time: string
    end_time: string
    capacity: number
    is_available?: boolean
    memo?: string
    created_by: number
    updated_by: number
}

export interface ScheduleUpdate {
    store_id?: number
    schedule_date?: string
    start_time?: string
    end_time?: string
    capacity?: number
    is_available?: boolean
    memo?: string
    updated_by?: number
}
