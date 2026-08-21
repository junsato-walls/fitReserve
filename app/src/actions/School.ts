"use server"

import { api } from "@/lib/api"
import type { School, SchoolCreate, SchoolUpdate } from "@/types/admin"

/** APIエラーからメッセージを取り出す（lib/api.ts がdetailをErrorに詰めている） */
function toErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback
}


/**
 * 学校一覧を取得（管理者向け）
 */
export async function getSchoolsAdmin(params?: {
    skip?: number
    limit?: number
    is_enabled?: boolean
}): Promise<{
    success: boolean
    data: School[] | null
    error?: string
}> {
    try {
        const response = await api.get<School[]>("/admin/schools", { params })
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to fetch schools:", error)
        const errorMessage = toErrorMessage(error, "学校一覧の取得に失敗しました")
        return { success: false, data: null, error: errorMessage }
    }
}

/**
 * 学校詳細を取得
 */
export async function getSchoolDetail(
    schoolId: number
): Promise<{
    success: boolean
    data: School | null
    error?: string
}> {
    try {
        const response = await api.get<School>(`/admin/schools/${schoolId}`)
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to fetch school detail:", error)
        const errorMessage = toErrorMessage(error, "学校詳細の取得に失敗しました")
        return { success: false, data: null, error: errorMessage }
    }
}

/**
 * 学校を作成
 */
export async function createSchool(
    data: SchoolCreate
): Promise<{
    success: boolean
    data: School | null
    error?: string
}> {
    try {
        const response = await api.post<School>("/admin/schools", data)
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to create school:", error)
        const errorMessage = toErrorMessage(error, "学校の作成に失敗しました")
        return { success: false, data: null, error: errorMessage }
    }
}

/**
 * 学校を更新
 */
export async function updateSchool(
    schoolId: number,
    data: SchoolUpdate
): Promise<{
    success: boolean
    data: School | null
    error?: string
}> {
    try {
        const response = await api.put<School>(`/admin/schools/${schoolId}`, data)
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to update school:", error)
        const errorMessage = toErrorMessage(error, "学校の更新に失敗しました")
        return { success: false, data: null, error: errorMessage }
    }
}

/**
 * 学校を削除（論理削除）
 */
export async function deleteSchool(
    schoolId: number
): Promise<{
    success: boolean
    error?: string
}> {
    try {
        await api.delete(`/admin/schools/${schoolId}`)
        return { success: true }
    } catch (error: unknown) {
        console.error("Failed to delete school:", error)
        const errorMessage = toErrorMessage(error, "学校の削除に失敗しました")
        return { success: false, error: errorMessage }
    }
}
