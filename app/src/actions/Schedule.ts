"use server"

import { getCurrentUser } from "@/actions/Auth"
import { api } from "@/lib/api"
import type { Schedule, ScheduleCreate, ScheduleUpdate } from "@/types/schedule"

/** 作成者・更新者IDはログインユーザーから補完するため、呼び出し側では指定しない */
export type ScheduleCreateInput = Omit<ScheduleCreate, "created_by" | "updated_by">
export type ScheduleUpdateInput = Omit<ScheduleUpdate, "updated_by">

/** APIエラーからメッセージを取り出す（lib/api.ts がdetailをErrorに詰めている） */
function toErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback
}

/**
 * スケジュール一覧を取得（スタッフ向け・フィルター機能付き）
 */
export async function getSchedules(params?: {
    skip?: number
    limit?: number
    store_id?: number
    date_from?: string
    date_to?: string
    is_available?: boolean
}): Promise<{
    success: boolean
    data: Schedule[] | null
    error?: string
}> {
    try {
        const response = await api.get<Schedule[]>("/schedules", { params })
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to fetch schedules:", error)
        return {
            success: false,
            data: null,
            error: toErrorMessage(error, "スケジュール一覧の取得に失敗しました"),
        }
    }
}

/**
 * スケジュール詳細を取得
 */
export async function getScheduleDetail(
    scheduleId: number
): Promise<{
    success: boolean
    data: Schedule | null
    error?: string
}> {
    try {
        const response = await api.get<Schedule>(`/schedules/${scheduleId}`)
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to fetch schedule detail:", error)
        return {
            success: false,
            data: null,
            error: toErrorMessage(error, "スケジュール詳細の取得に失敗しました"),
        }
    }
}

/**
 * スケジュールを作成
 */
export async function createSchedule(
    data: ScheduleCreateInput
): Promise<{
    success: boolean
    data: Schedule | null
    error?: string
}> {
    try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
            return { success: false, data: null, error: "ログインが必要です" }
        }

        const response = await api.post<Schedule>("/schedules", {
            ...data,
            created_by: currentUser.id,
            updated_by: currentUser.id,
        })
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to create schedule:", error)
        return {
            success: false,
            data: null,
            error: toErrorMessage(error, "スケジュールの作成に失敗しました"),
        }
    }
}

/**
 * スケジュールを更新
 */
export async function updateSchedule(
    scheduleId: number,
    data: ScheduleUpdateInput
): Promise<{
    success: boolean
    data: Schedule | null
    error?: string
}> {
    try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
            return { success: false, data: null, error: "ログインが必要です" }
        }

        const response = await api.put<Schedule>(`/schedules/${scheduleId}`, {
            ...data,
            updated_by: currentUser.id,
        })
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to update schedule:", error)
        return {
            success: false,
            data: null,
            error: toErrorMessage(error, "スケジュールの更新に失敗しました"),
        }
    }
}

/**
 * スケジュールを削除
 */
export async function deleteSchedule(
    scheduleId: number
): Promise<{
    success: boolean
    error?: string
}> {
    try {
        await api.delete(`/schedules/${scheduleId}`)
        return { success: true }
    } catch (error: unknown) {
        console.error("Failed to delete schedule:", error)
        return {
            success: false,
            error: toErrorMessage(error, "スケジュールの削除に失敗しました"),
        }
    }
}
