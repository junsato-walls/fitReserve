// 管理者向け機能の型定義

/** 会社マスタ。予約URLの [company_slug] に対応する */
export interface Company {
    id: number
    slug: string
    company_code: string
    name: string
    name_kana: string | null
}

export interface Store {
    id: number
    store_code: string
    name: string
    name_kana: string | null
    postal_code: string | null
    address: string | null
    phone: string | null
    email: string | null
    /** 同時対応可能人数（日ごとの受付数の既定値） */
    capacity: number
    /** 営業開始時間（予約枠の生成範囲） */
    business_hours_start: string
    /** 営業終了時間（予約枠の生成範囲） */
    business_hours_end: string
    /** 定休日の曜日（0=日曜 〜 6=土曜） */
    regular_holidays: number[]
    description: string | null
    image_url: string | null
    is_enabled: boolean
    created_at: string
    updated_at: string
    deleted_at: string | null
    /** 取り扱う学校IDリスト（バックエンドのStoreResponseが返す） */
    school_ids: number[]
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
    business_hours_start: string
    business_hours_end: string
    /** 定休日の曜日（0=日曜 〜 6=土曜） */
    regular_holidays?: number[]
    description?: string
    image_url?: string
    is_enabled?: boolean
    /** 取り扱う学校IDリスト */
    school_ids?: number[]
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
    /** 定休日の曜日（0=日曜 〜 6=土曜）。指定時は全置換 */
    regular_holidays?: number[]
    description?: string
    image_url?: string
    is_enabled?: boolean
    /** 取り扱う学校IDリスト（指定時は全置換） */
    school_ids?: number[]
}

/** 学校区分マスタ（小学校 / 中学校 / 高等学校 / その他） */
export interface SchoolDivision {
    id: number
    name: string
}

export interface School {
    id: number
    school_code: string
    name: string
    name_kana: string | null
    school_divisions_id: number
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
    school_divisions_id: number
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
    school_divisions_id?: number
    postal_code?: string
    address?: string
    phone?: string
    email?: string
    is_enabled?: boolean
}

/** 学校区分ごとの予約受付期間。プロジェクト自体は期間を持たない */
export interface SchoolDivisionPeriod {
    school_divisions_id: number
    start_date: string
    end_date: string
}

export interface Project {
    id: number
    company_id: number
    project_code: string
    name: string
    description: string | null
    reservation_interval: number
    is_enabled: boolean
    created_by: number
    updated_by: number
    created_at: string
    updated_at: string
    deleted_at: string | null
    /** 対象店舗IDリスト（バックエンドのProjectResponseが返す） */
    store_ids: number[]
    /** 学校区分ごとの予約受付期間 */
    school_divisions: SchoolDivisionPeriod[]
    /** 全区分の最も早い開始日。区分が未設定ならnull */
    start_date: string | null
    /** 全区分の最も遅い終了日。区分が未設定ならnull */
    end_date: string | null
    /** 本日いずれかの区分が受付中か */
    is_accepting: boolean
}

export interface ProjectCreate {
    company_id: number
    project_code: string
    name: string
    description?: string
    /** 予約時間間隔（分）。未指定時はバックエンド側で30分になる */
    reservation_interval?: number
    is_enabled?: boolean
    created_by: number
    updated_by: number
    /** 対象店舗IDリスト（未指定は全店舗） */
    store_ids?: number[]
    /** 学校区分ごとの予約受付期間 */
    school_divisions?: SchoolDivisionPeriod[]
}

export interface ProjectUpdate {
    company_id?: number
    project_code?: string
    name?: string
    description?: string
    reservation_interval?: number
    is_enabled?: boolean
    updated_by?: number
    /** 対象店舗IDリスト（指定時は全置換） */
    store_ids?: number[]
    /** 学校区分ごとの予約受付期間（指定時は全置換） */
    school_divisions?: SchoolDivisionPeriod[]
}

/**
 * ユーザーのロール（api/system/permissions.py の ROLE_LEVELS と対応）
 *
 * 上下関係を持つ階層で、上位は下位の操作をすべて行える。
 * super_admin / admin は全店舗が対象、staff / readonly は担当店舗のみ。
 */
export type UserRole = "super_admin" | "admin" | "staff" | "readonly"

export interface User {
    id: number
    personal_id: string
    user_name: string
    name_kana: string | null
    email: string | null
    role: UserRole
    /** 所属店舗（表示用の主店舗） */
    store_id: number | null
    /** 所属店舗名（バックエンドのUserWithStoreが返す） */
    store_name?: string | null
    /** 担当店舗IDリスト。権限の対象はこちら（admin以上は空＝全店舗） */
    store_ids: number[]
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
    role?: UserRole
    store_id?: number
    /** 担当店舗IDリスト。staff/readonly は最低1件必要 */
    store_ids?: number[]
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
    role?: UserRole
    store_id?: number
    /** 担当店舗IDリスト（指定時は全置換。未指定なら変更しない） */
    store_ids?: number[]
    is_active?: boolean
    icon?: string
    memo?: string
}
