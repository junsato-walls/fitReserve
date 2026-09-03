import type { UserRole } from "@/types/admin"

/**
 * ロールの定義（api/system/permissions.py の ROLE_LEVELS と対応）
 *
 * バックエンドと同じく上下関係のある階層として扱う。
 * 画面側で `role === "admin"` のような一致比較をすると、
 * 上位ロール（super_admin）が管理画面に入れなくなるため、
 * 判定は必ず hasMinRole を使うこと。
 */
export const USER_ROLES = ["super_admin", "admin", "staff", "readonly"] as const

/** ロールの強さ。数値は後からロールを差し込めるよう10刻み */
export const ROLE_LEVELS: Record<string, number> = {
    readonly: 10,
    staff: 20,
    admin: 30,
    super_admin: 40,
}

/** 画面表示用のロール名 */
export const ROLE_LABELS: Record<string, string> = {
    super_admin: "システム管理者",
    admin: "管理者",
    staff: "スタッフ",
    readonly: "閲覧のみ",
}

/**
 * 担当店舗（store_ids）の指定が必要なロール
 *
 * admin以上は全店舗が対象のため担当店舗を持たない。
 */
export const SCOPED_ROLES: readonly string[] = ["staff", "readonly"]

/** 指定ロール以上かどうか */
export function hasMinRole(role: string | undefined | null, minimum: UserRole): boolean {
    return (ROLE_LEVELS[role ?? ""] ?? 0) >= ROLE_LEVELS[minimum]
}

/** ロールの表示名を返す（未知の値はそのまま返す） */
export function getRoleLabel(role: string): string {
    return ROLE_LABELS[role] ?? role
}
