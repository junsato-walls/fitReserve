"use server"

import { api } from "@/lib/httpClient"
import type { User, UserCreate, UserUpdate } from "@/types/admin"

/** APIエラーからメッセージを取り出す（lib/httpClient.ts がdetailをErrorに詰めている） */
function toErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback
}


/**
 * ユーザー一覧を取得（管理者向け）
 */
export async function getUsersAdmin(params?: {
    skip?: number
    limit?: number
    is_active?: boolean
}): Promise<{
    success: boolean
    data: User[] | null
    error?: string
}> {
    try {
        const response = await api.get<User[]>("/admin/users", { params })
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to fetch users:", error)
        const errorMessage = toErrorMessage(error, "ユーザー一覧の取得に失敗しました")
        return { success: false, data: null, error: errorMessage }
    }
}

/**
 * ユーザー詳細を取得
 */
export async function getUserDetail(
    userId: number
): Promise<{
    success: boolean
    data: User | null
    error?: string
}> {
    try {
        const response = await api.get<User>(`/admin/users/${userId}`)
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to fetch user detail:", error)
        const errorMessage = toErrorMessage(error, "ユーザー詳細の取得に失敗しました")
        return { success: false, data: null, error: errorMessage }
    }
}

/**
 * ユーザーを作成
 */
export async function createUser(
    data: UserCreate
): Promise<{
    success: boolean
    data: User | null
    error?: string
}> {
    try {
        const response = await api.post<User>("/admin/users", data)
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to create user:", error)
        const errorMessage = toErrorMessage(error, "ユーザーの作成に失敗しました")
        return { success: false, data: null, error: errorMessage }
    }
}

/**
 * ユーザーを更新
 */
export async function updateUser(
    userId: number,
    data: UserUpdate
): Promise<{
    success: boolean
    data: User | null
    error?: string
}> {
    try {
        const response = await api.put<User>(`/admin/users/${userId}`, data)
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to update user:", error)
        const errorMessage = toErrorMessage(error, "ユーザーの更新に失敗しました")
        return { success: false, data: null, error: errorMessage }
    }
}

/**
 * ユーザーを削除（論理削除）
 */
export async function deleteUser(
    userId: number
): Promise<{
    success: boolean
    error?: string
}> {
    try {
        await api.delete(`/admin/users/${userId}`)
        return { success: true }
    } catch (error: unknown) {
        console.error("Failed to delete user:", error)
        const errorMessage = toErrorMessage(error, "ユーザーの削除に失敗しました")
        return { success: false, error: errorMessage }
    }
}
