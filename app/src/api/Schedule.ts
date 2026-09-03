"use server"

import { getCurrentUser } from "@/api/Auth"
import { api } from "@/lib/httpClient"
import type {
    Schedule,
    ScheduleBlock,
    ScheduleBlockCreate,
    ScheduleBlockUpdate,
    ScheduleCreate,
    ScheduleDay,
    ScheduleUpdate,
} from "@/types/schedule"

/** 作成者・更新者IDはログインユーザーから補完するため、呼び出し側では指定しない */
export type ScheduleCreateInput = Omit<ScheduleCreate, "created_by" | "updated_by">
export type ScheduleUpdateInput = Omit<ScheduleUpdate, "updated_by">
export type ScheduleBlockCreateInput = Omit<ScheduleBlockCreate, "created_by" | "updated_by">
export type ScheduleBlockUpdateInput = Omit<ScheduleBlockUpdate, "updated_by">

/** APIエラーからメッセージを取り出す（lib/httpClient.ts がdetailをErrorに詰めている） */
function toErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback
}

/**
 * タイムテーブル（店舗×日）を取得
 *
 * 予約枠・枠止め・空き数まで組み立てられたものが返る。
 * 画面側で営業時間や休憩から枠を計算しないこと（APIと二重管理になる）。
 */
export async function getScheduleDays(params: {
    date_from: string
    date_to?: string
    store_id?: number
}): Promise<{ success: boolean; data: ScheduleDay[] | null; error?: string }> {
    try {
        const response = await api.get<ScheduleDay[]>("/schedules/days", { params })
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to fetch schedule days:", error)
        return {
            success: false,
            data: null,
            error: toErrorMessage(error, "タイムテーブルの取得に失敗しました"),
        }
    }
}

/**
 * 受付設定の一覧を取得（店舗×日）
 */
export async function getSchedules(params?: {
    skip?: number
    limit?: number
    store_id?: number
    date_from?: string
    date_to?: string
    is_available?: boolean
}): Promise<{ success: boolean; data: Schedule[] | null; error?: string }> {
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
 * 受付設定の詳細を取得
 */
export async function getScheduleDetail(
    scheduleId: number,
): Promise<{ success: boolean; data: Schedule | null; error?: string }> {
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
 * 受付設定を作成（1日分）
 */
export async function createSchedule(
    data: ScheduleCreateInput,
): Promise<{ success: boolean; data: Schedule | null; error?: string }> {
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
 * 受付設定を更新（同時予約数・受付時間・休憩など）
 */
export async function updateSchedule(
    scheduleId: number,
    data: ScheduleUpdateInput,
): Promise<{ success: boolean; data: Schedule | null; error?: string }> {
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
 * 受付設定を削除
 */
export async function deleteSchedule(
    scheduleId: number,
): Promise<{ success: boolean; error?: string }> {
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

/**
 * 枠止めを作成（予約以外で時間を埋める）
 */
export async function createScheduleBlock(
    data: ScheduleBlockCreateInput,
): Promise<{ success: boolean; data: ScheduleBlock | null; error?: string }> {
    try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
            return { success: false, data: null, error: "ログインが必要です" }
        }

        const response = await api.post<ScheduleBlock>("/schedule-blocks", {
            ...data,
            created_by: currentUser.id,
            updated_by: currentUser.id,
        })
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to create schedule block:", error)
        return {
            success: false,
            data: null,
            error: toErrorMessage(error, "枠止めの作成に失敗しました"),
        }
    }
}

/**
 * 枠止めを更新（タイムテーブルのドラッグ移動でも使う）
 */
export async function updateScheduleBlock(
    blockId: number,
    data: ScheduleBlockUpdateInput,
): Promise<{ success: boolean; data: ScheduleBlock | null; error?: string }> {
    try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
            return { success: false, data: null, error: "ログインが必要です" }
        }

        const response = await api.put<ScheduleBlock>(`/schedule-blocks/${blockId}`, {
            ...data,
            updated_by: currentUser.id,
        })
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to update schedule block:", error)
        return {
            success: false,
            data: null,
            error: toErrorMessage(error, "枠止めの更新に失敗しました"),
        }
    }
}

/**
 * 枠止めを削除
 */
export async function deleteScheduleBlock(
    blockId: number,
): Promise<{ success: boolean; error?: string }> {
    try {
        await api.delete(`/schedule-blocks/${blockId}`)
        return { success: true }
    } catch (error: unknown) {
        console.error("Failed to delete schedule block:", error)
        return {
            success: false,
            error: toErrorMessage(error, "枠止めの削除に失敗しました"),
        }
    }
}
