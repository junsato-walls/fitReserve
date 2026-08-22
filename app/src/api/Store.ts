"use server"

import { api } from "@/lib/httpClient"
import type { Store, StoreCreate, StoreUpdate } from "@/types/admin"

/** APIエラーからメッセージを取り出す（lib/httpClient.ts がdetailをErrorに詰めている） */
function toErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback
}


/**
 * 店舗一覧を取得（管理者向け）
 */
export async function getStoresAdmin(params?: {
    skip?: number
    limit?: number
    is_enabled?: boolean
}): Promise<{
    success: boolean
    data: Store[] | null
    error?: string
}> {
    try {
        const response = await api.get<Store[]>("/admin/stores", { params })
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to fetch stores:", error)
        const errorMessage = toErrorMessage(error, "店舗一覧の取得に失敗しました")
        return { success: false, data: null, error: errorMessage }
    }
}

/**
 * 店舗詳細を取得
 */
export async function getStoreDetail(
    storeId: number
): Promise<{
    success: boolean
    data: Store | null
    error?: string
}> {
    try {
        const response = await api.get<Store>(`/admin/stores/${storeId}`)
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to fetch store detail:", error)
        const errorMessage = toErrorMessage(error, "店舗詳細の取得に失敗しました")
        return { success: false, data: null, error: errorMessage }
    }
}

/**
 * 店舗を作成
 */
export async function createStore(
    data: StoreCreate
): Promise<{
    success: boolean
    data: Store | null
    error?: string
}> {
    try {
        const response = await api.post<Store>("/admin/stores", data)
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to create store:", error)
        const errorMessage = toErrorMessage(error, "店舗の作成に失敗しました")
        return { success: false, data: null, error: errorMessage }
    }
}

/**
 * 店舗を更新
 */
export async function updateStore(
    storeId: number,
    data: StoreUpdate
): Promise<{
    success: boolean
    data: Store | null
    error?: string
}> {
    try {
        const response = await api.put<Store>(`/admin/stores/${storeId}`, data)
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to update store:", error)
        const errorMessage = toErrorMessage(error, "店舗の更新に失敗しました")
        return { success: false, data: null, error: errorMessage }
    }
}

/**
 * 店舗を削除（論理削除）
 */
export async function deleteStore(
    storeId: number
): Promise<{
    success: boolean
    error?: string
}> {
    try {
        await api.delete(`/admin/stores/${storeId}`)
        return { success: true }
    } catch (error: unknown) {
        console.error("Failed to delete store:", error)
        const errorMessage = toErrorMessage(error, "店舗の削除に失敗しました")
        return { success: false, error: errorMessage }
    }
}
