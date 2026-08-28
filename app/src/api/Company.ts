"use server"

import { api } from "@/lib/httpClient"
import type { Company } from "@/types/admin"

/** APIエラーからメッセージを取り出す（lib/httpClient.ts がdetailをErrorに詰めている） */
function toErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback
}

/**
 * 会社一覧を取得（管理者向け）
 *
 * プロジェクトの所属会社の選択と、予約URL（/[company_slug]/...）の
 * 組み立てに使う。
 */
export async function getCompanies(): Promise<{
    success: boolean
    data: Company[] | null
    error?: string
}> {
    try {
        const response = await api.get<Company[]>("/admin/companies")
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to fetch companies:", error)
        const errorMessage = toErrorMessage(error, "会社一覧の取得に失敗しました")
        return { success: false, data: null, error: errorMessage }
    }
}
