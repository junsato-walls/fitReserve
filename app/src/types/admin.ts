// 管理者向け機能の型定義

export interface Store {
    id: number
    store_code: string
    name: string
    name_kana: string | null
    postal_code: string | null
    address: string | null
    phone: string | null
    email: string | null
    capacity: number
    business_hours_start: string | null
    business_hours_end: string | null
    regular_holiday: string | null
    description: string | null
    image_url: string | null
    is_enabled: boolean
    created_at: string
    updated_at: string
    deleted_at: string | null
}

export interface StoreCreate {
    store_code: string
    name: string
    name_kana?: string
    postal_code?: string
    address?: string
    phone?: string
    email?: string
    capacity?: number
    business_hours_start?: string
    business_hours_end?: string
    regular_holiday?: string
    description?: string
    image_url?: string
    is_enabled?: boolean
}

export interface StoreUpdate {
    store_code?: string
    name?: string
    name_kana?: string
    postal_code?: string
    address?: string
    phone?: string
    email?: string
    capacity?: number
    business_hours_start?: string
    business_hours_end?: string
    regular_holiday?: string
    description?: string
    image_url?: string
    is_enabled?: boolean
}

export interface School {
    id: number
    school_code: string
    name: string
    name_kana: string | null
    school_type: string
    postal_code: string | null
    address: string | null
    phone: string | null
    email: string | null
    is_enabled: boolean
    created_at: string
    updated_at: string
    deleted_at: string | null
}

export interface SchoolCreate {
    school_code: string
    name: string
    name_kana?: string
    school_type: string
    postal_code?: string
    address?: string
    phone?: string
    email?: string
    is_enabled?: boolean
}

export interface SchoolUpdate {
    school_code?: string
    name?: string
    name_kana?: string
    school_type?: string
    postal_code?: string
    address?: string
    phone?: string
    email?: string
    is_enabled?: boolean
}

export interface Project {
    id: number
    project_code: string
    name: string
    description: string | null
    start_date: string
    end_date: string
    reservation_interval: number
    is_enabled: boolean
    created_by: number
    updated_by: number
    created_at: string
    updated_at: string
    deleted_at: string | null
    /** 対象店舗IDリスト（バックエンドのProjectResponseが返す） */
    store_ids: number[]
    /** 対象学校IDリスト（バックエンドのProjectResponseが返す） */
    school_ids: number[]
}

export interface ProjectCreate {
    project_code: string
    name: string
    description?: string
    start_date: string
    end_date: string
    /** 予約時間間隔（分）。未指定時はバックエンド側で30分になる */
    reservation_interval?: number
    is_enabled?: boolean
    created_by: number
    updated_by: number
    /** 対象店舗IDリスト（未指定は全店舗） */
    store_ids?: number[]
    /** 対象学校IDリスト（未指定は全学校） */
    school_ids?: number[]
}

export interface ProjectUpdate {
    project_code?: string
    name?: string
    description?: string
    start_date?: string
    end_date?: string
    reservation_interval?: number
    is_enabled?: boolean
    updated_by?: number
    /** 対象店舗IDリスト（指定時は全置換） */
    store_ids?: number[]
    /** 対象学校IDリスト（指定時は全置換） */
    school_ids?: number[]
}

export interface User {
    id: number
    personal_id: string
    user_name: string
    name_kana: string | null
    email: string | null
    role: "admin" | "staff" | "readonly"
    store_id: number | null
    is_active: boolean
    icon: string | null
    memo: string | null
    created_at: string
    updated_at: string
    deleted_at: string | null
}

export interface UserCreate {
    personal_id: string
    user_name: string
    password: string
    name_kana?: string
    email?: string
    role?: "admin" | "staff" | "readonly"
    store_id?: number
    is_active?: boolean
    icon?: string
    memo?: string
}

export interface UserUpdate {
    personal_id?: string
    user_name?: string
    password?: string
    name_kana?: string
    email?: string
    role?: "admin" | "staff" | "readonly"
    store_id?: number
    is_active?: boolean
    icon?: string
    memo?: string
}
