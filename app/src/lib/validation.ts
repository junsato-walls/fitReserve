import { z } from "zod"
import { SCOPED_ROLES, USER_ROLES } from "./roles"

/**
 * 入力バリデーションスキーマ
 *
 * バックエンド(api/schemas/*.py)のPydantic制約と対応させること。
 * ここでの検証はUX向上のための事前チェックであり、
 * 正となる検証はバックエンド側で行われる。
 */

// ---- 共通のプリミティブ ----

// エラーは画面上部に1行だけ表示するため、
// メッセージには必ず項目名を含めること（どの項目が問題なのか分からなくなるため）。

/** 空文字を undefined として扱う任意入力の文字列 */
const optionalText = (max: number, label: string) =>
    z
        .string()
        .max(max, `${label}は${max}文字以内で入力してください`)
        .optional()
        .or(z.literal("").transform(() => undefined))

const requiredText = (max: number, label: string) =>
    z
        .string()
        .min(1, `${label}を入力してください`)
        .max(max, `${label}は${max}文字以内で入力してください`)

/** 任意入力の整数 */
const optionalInt = (label: string, min: number, max: number) =>
    z
        .number()
        .int(`${label}は整数で入力してください`)
        .min(min, `${label}は${min}〜${max}で入力してください`)
        .max(max, `${label}は${min}〜${max}で入力してください`)
        .optional()

/** 任意入力の小数（身長・体重など） */
const optionalDecimal = (label: string, min: number, max: number, unit: string) =>
    z
        .number({ message: `${label}は数値で入力してください` })
        .min(min, `${label}は${min}${unit}以上で入力してください`)
        .max(max, `${label}は${max}${unit}以下で入力してください`)
        .optional()

/** yyyy-MM-dd 形式 */
const dateString = (label: string) =>
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `${label}はYYYY-MM-DD形式で入力してください`)

// ---- 店舗（api/schemas/stores.py）----

export const storeSchema = z.object({
    store_code: requiredText(20, "店舗コード"),
    name: requiredText(100, "店舗名"),
    name_kana: optionalText(100, "店舗名カナ"),
    postal_code: optionalText(10, "郵便番号"),
    address: optionalText(200, "住所"),
    phone: optionalText(20, "電話番号"),
    email: optionalText(100, "メールアドレス"),
    capacity: z
        .number()
        .int("対応可能人数は整数で入力してください")
        .min(1, "対応可能人数は1以上で入力してください"),
    business_hours_start: z.string().min(1, "営業開始時間を入力してください"),
    business_hours_end: z.string().min(1, "営業終了時間を入力してください"),
    regular_holidays: z.array(z.number().int().min(0).max(6)),
    description: optionalText(500, "店舗説明"),
    is_enabled: z.boolean(),
})

// ---- 学校（api/schemas/schools.py）----

export const schoolSchema = z.object({
    school_code: requiredText(20, "学校コード"),
    name: requiredText(100, "学校名"),
    name_kana: optionalText(100, "学校名カナ"),
    // 学校区分は固定のEnumではなくマスタ参照（school_divisions）
    school_divisions_id: z
        .number({ message: "学校区分を選択してください" })
        .int()
        .min(1, "学校区分を選択してください"),
    postal_code: optionalText(10, "郵便番号"),
    address: optionalText(200, "住所"),
    phone: optionalText(20, "電話番号"),
    description: optionalText(500, "学校説明"),
    is_enabled: z.boolean(),
})

// ---- プロジェクト（api/schemas/projects.py）----

/**
 * 学校区分ごとの予約受付期間
 *
 * 予約受付期間は学校区分によって異なるため、プロジェクト自体は期間を持たない。
 */
export const schoolDivisionPeriodSchema = z
    .object({
        school_divisions_id: z.number().int().min(1),
        start_date: dateString("受付開始日"),
        end_date: dateString("受付終了日"),
    })
    .refine((v) => v.start_date <= v.end_date, {
        message: "受付終了日は受付開始日以降の日付を指定してください",
        path: ["end_date"],
    })

export const projectSchema = z.object({
    project_code: requiredText(20, "プロジェクトコード"),
    name: requiredText(100, "プロジェクト名"),
    description: optionalText(500, "プロジェクト説明"),
    reservation_interval: z
        .number()
        .int("予約時間間隔は整数で入力してください")
        .min(1, "予約時間間隔を選択してください"),
    is_enabled: z.boolean(),
    school_divisions: z
        .array(schoolDivisionPeriodSchema)
        .min(1, "予約受付期間を1つ以上設定してください"),
})

// ---- ユーザー（api/schemas/generic/users.py）----

export { SCOPED_ROLES, USER_ROLES } from "./roles"

const userBaseShape = {
    personal_id: z
        .string()
        .min(6, "ユーザーIDは6文字以上で入力してください")
        .max(50, "ユーザーIDは50文字以内で入力してください"),
    user_name: z
        .string()
        .min(2, "ユーザー名は2文字以上で入力してください")
        .max(50, "ユーザー名は50文字以内で入力してください"),
    name_kana: optionalText(100, "フリガナ"),
    email: optionalText(100, "メールアドレス"),
    role: z.enum(USER_ROLES, { message: "ロールを選択してください" }),
    store_ids: z.array(z.number().int().positive()),
    is_active: z.boolean(),
}

/**
 * staff / readonly は担当店舗が最低1件必要
 *
 * 担当が0件だと、ログインできるのに何も参照できないユーザーができてしまう。
 * （バックエンドの api/routers/admin/users.py も同じ検証をしている）
 */
const requireStores = <T extends { role: string; store_ids: number[] }>(schema: z.ZodType<T>) =>
    schema.refine((v) => !SCOPED_ROLES.includes(v.role) || v.store_ids.length > 0, {
        message: "スタッフと閲覧専用ユーザーには担当店舗が必要です",
        path: ["store_ids"],
    })

const passwordRule = z
    .string()
    .min(8, "パスワードは8文字以上で入力してください")
    .max(100, "パスワードは100文字以内で入力してください")

/** 新規作成時はパスワード必須 */
export const userCreateSchema = requireStores(
    z.object({
        ...userBaseShape,
        password: passwordRule,
    }),
)

/** 更新時は未入力なら変更しない */
export const userUpdateSchema = requireStores(
    z.object({
        ...userBaseShape,
        password: passwordRule.optional().or(z.literal("").transform(() => undefined)),
    }),
)

// ---- スケジュール（api/schemas/schedules.py）----

export const scheduleSchema = z
    .object({
        store_id: z.number().int().positive("店舗を選択してください"),
        schedule_date: dateString("日付"),
        start_time: z.string().min(1, "開始時刻を入力してください"),
        end_time: z.string().min(1, "終了時刻を入力してください"),
        capacity: z
            .number()
            .int("受付可能数は整数で入力してください")
            .min(1, "受付可能数は1以上で入力してください"),
        is_available: z.boolean(),
        memo: optionalText(500, "備考"),
    })
    .refine((v) => v.start_time < v.end_time, {
        message: "終了時刻は開始時刻より後を指定してください",
        path: ["end_time"],
    })

// ---- 予約（api/schemas/reservations.py）----

export const GENDERS = ["male", "female", "other"] as const

export const reservationCustomerSchema = z.object({
    customer_name: requiredText(100, "お名前"),
    customer_name_kana: optionalText(100, "お名前（カナ）"),
    gender: z.enum(GENDERS, { message: "性別を選択してください" }),
    grade: optionalInt("学年", 1, 12),
    height: optionalDecimal("身長", 0, 999.99, "cm"),
    weight: optionalDecimal("体重", 0, 999.99, "kg"),
    foot_size: optionalDecimal("足のサイズ", 0, 99.9, "cm"),
    phone: requiredText(20, "電話番号"),
    email: optionalText(100, "メールアドレス"),
    guardian_name: optionalText(100, "保護者氏名"),
    memo: optionalText(800, "備考"),
})

// ---- ヘルパー ----

/**
 * 検証結果を「最初のエラーメッセージ」に変換する
 * 既存フォームはエラーを1行で表示しているため、それに合わせる
 */
export function getFirstError(error: z.ZodError): string {
    return error.issues[0]?.message ?? "入力内容を確認してください"
}

/**
 * スキーマで検証し、成功なら null、失敗ならエラーメッセージを返す
 */
export function validate<T>(schema: z.ZodType<T>, value: unknown): string | null {
    const result = schema.safeParse(value)
    return result.success ? null : getFirstError(result.error)
}
