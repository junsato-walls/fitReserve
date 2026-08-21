"use server"

import { api } from "@/lib/api"
import type {
    ProjectPublic,
    Reservation,
    ReservationCreate,
    ReservationUpdate,
    ReservationWithDetails,
    SchedulePublic,
    SchoolPublic,
    StorePublic,
} from "@/types/reservation"

/** APIエラーからメッセージを取り出す（lib/api.ts がdetailをErrorに詰めている） */
function toErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback
}

/**
 * 有効なプロジェクト一覧を取得
 */
export async function getProjects(): Promise<{
    success: boolean
    data: ProjectPublic[] | null
    error?: string
}> {
    try {
        const response = await api.get<ProjectPublic[]>("/public/projects")
        return { success: true, data: response.data }
    } catch (error) {
        console.error("Failed to fetch projects:", error)
        return { success: false, data: null, error: "プロジェクトの取得に失敗しました" }
    }
}

/**
 * 店舗一覧を取得
 * @param projectId プロジェクトID（指定した場合、そのプロジェクトに紐づく店舗のみ）
 */
export async function getStores(
    projectId?: number
): Promise<{
    success: boolean
    data: StorePublic[] | null
    error?: string
}> {
    try {
        const params = projectId ? { project_id: projectId } : {}
        const response = await api.get<StorePublic[]>("/public/stores", { params })
        return { success: true, data: response.data }
    } catch (error) {
        console.error("Failed to fetch stores:", error)
        return { success: false, data: null, error: "店舗の取得に失敗しました" }
    }
}

/**
 * 学校一覧を取得
 * @param projectId プロジェクトID（指定した場合、そのプロジェクトに紐づく学校のみ）
 */
export async function getSchools(
    projectId?: number
): Promise<{
    success: boolean
    data: SchoolPublic[] | null
    error?: string
}> {
    try {
        const params = projectId ? { project_id: projectId } : {}
        const response = await api.get<SchoolPublic[]>("/public/schools", { params })
        return { success: true, data: response.data }
    } catch (error) {
        console.error("Failed to fetch schools:", error)
        return { success: false, data: null, error: "学校の取得に失敗しました" }
    }
}

/**
 * スケジュール一覧を取得（空き状況確認）
 * @param storeId 店舗ID
 * @param startDate 検索開始日（YYYY-MM-DD）
 * @param endDate 検索終了日（YYYY-MM-DD）
 */
export async function getSchedules(
    storeId: number,
    startDate: string,
    endDate: string
): Promise<{
    success: boolean
    data: SchedulePublic[] | null
    error?: string
}> {
    try {
        const response = await api.get<SchedulePublic[]>("/public/schedules", {
            params: {
                store_id: storeId,
                start_date: startDate,
                end_date: endDate,
            },
        })
        return { success: true, data: response.data }
    } catch (error) {
        console.error("Failed to fetch schedules:", error)
        return { success: false, data: null, error: "スケジュールの取得に失敗しました" }
    }
}

/**
 * 予約を作成
 */
export async function createReservation(
    data: ReservationCreate
): Promise<{
    success: boolean
    data: Reservation | null
    error?: string
}> {
    try {
        const response = await api.post<Reservation>("/public/reservations", data)
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to create reservation:", error)
        const errorMessage = toErrorMessage(error, "予約の作成に失敗しました")
        return { success: false, data: null, error: errorMessage }
    }
}

/**
 * 予約番号で予約を検索
 */
export async function getReservationByNumber(
    reservationNumber: string
): Promise<{
    success: boolean
    data: Reservation | null
    error?: string
}> {
    try {
        const response = await api.get<Reservation>(
            `/public/reservations/${reservationNumber}`
        )
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to fetch reservation:", error)
        const errorMessage = toErrorMessage(error, "予約の取得に失敗しました")
        return { success: false, data: null, error: errorMessage }
    }
}

// ============================================
// スタッフ向けAPI（認証必要）
// ============================================

/**
 * 予約一覧を取得（スタッフ向け・フィルター機能付き）
 */
export async function getReservationsForStaff(params?: {
    skip?: number
    limit?: number
    store_id?: number
    school_id?: number
    status?: string
    date_from?: string
    date_to?: string
}): Promise<{
    success: boolean
    data: ReservationWithDetails[] | null
    error?: string
}> {
    try {
        const response = await api.get<ReservationWithDetails[]>("/reservations", { params })
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to fetch reservations:", error)
        const errorMessage = toErrorMessage(error, "予約一覧の取得に失敗しました")
        return { success: false, data: null, error: errorMessage }
    }
}

/**
 * 予約詳細を取得（スタッフ向け）
 */
export async function getReservationDetail(
    reservationId: number
): Promise<{
    success: boolean
    data: ReservationWithDetails | null
    error?: string
}> {
    try {
        const response = await api.get<ReservationWithDetails>(`/reservations/${reservationId}`)
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to fetch reservation detail:", error)
        const errorMessage = toErrorMessage(error, "予約詳細の取得に失敗しました")
        return { success: false, data: null, error: errorMessage }
    }
}

/**
 * 予約を更新（スタッフ向け）
 */
export async function updateReservation(
    reservationId: number,
    data: ReservationUpdate
): Promise<{
    success: boolean
    data: Reservation | null
    error?: string
}> {
    try {
        const response = await api.put<Reservation>(`/reservations/${reservationId}`, data)
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to update reservation:", error)
        const errorMessage = toErrorMessage(error, "予約の更新に失敗しました")
        return { success: false, data: null, error: errorMessage }
    }
}

/**
 * 予約をキャンセル（スタッフ向け）
 */
export async function cancelReservation(
    reservationId: number
): Promise<{
    success: boolean
    error?: string
}> {
    try {
        await api.delete(`/reservations/${reservationId}`)
        return { success: true }
    } catch (error: unknown) {
        console.error("Failed to cancel reservation:", error)
        const errorMessage = toErrorMessage(error, "予約のキャンセルに失敗しました")
        return { success: false, error: errorMessage }
    }
}
