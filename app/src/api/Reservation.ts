"use server"

import { api } from "@/lib/httpClient"
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

/** APIエラーからメッセージを取り出す（lib/httpClient.ts がdetailをErrorに詰めている） */
function toErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback
}

/**
 * 予約受付用のプロジェクト情報を取得
 *
 * 予約URL /[company_slug]/[project_id]/[store_id] の妥当性検証を兼ねる。
 * 会社・プロジェクト・店舗の組み合わせが正しくない場合はエラーになる。
 */
export async function getReservationProject(
    companySlug: string,
    projectId: number,
    storeId: number,
): Promise<{
    success: boolean
    data: ProjectPublic | null
    error?: string
}> {
    try {
        const response = await api.get<ProjectPublic>(`/public/projects/${projectId}`, {
            params: { company_slug: companySlug, store_id: storeId },
        })
        return { success: true, data: response.data }
    } catch (error) {
        console.error("Failed to fetch project:", error)
        const message = toErrorMessage(error, "予約ページの情報を取得できませんでした")
        return { success: false, data: null, error: message }
    }
}

/**
 * 店舗詳細を取得
 */
export async function getStore(storeId: number): Promise<{
    success: boolean
    data: StorePublic | null
    error?: string
}> {
    try {
        const response = await api.get<StorePublic>(`/public/stores/${storeId}`)
        return { success: true, data: response.data }
    } catch (error) {
        console.error("Failed to fetch store:", error)
        return { success: false, data: null, error: "店舗の取得に失敗しました" }
    }
}

/**
 * 店舗一覧を取得
 * @param projectId プロジェクトID（指定した場合、そのプロジェクトの対象店舗のみ）
 */
export async function getStores(projectId?: number): Promise<{
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
 * 予約可能な学校一覧を取得
 *
 * 取り扱い学校は店舗ごとに決まり（store_schools）、さらに
 * 受付期間は学校区分ごとに決まる（project_school_divisions）。
 * 指定した条件を満たす学校だけが返る。両方省略すると全ての有効な学校を返す。
 */
export async function getSchools(
    storeId?: number,
    projectId?: number,
): Promise<{
    success: boolean
    data: SchoolPublic[] | null
    error?: string
}> {
    try {
        const params: Record<string, number> = {}
        if (storeId) params.store_id = storeId
        if (projectId) params.project_id = projectId
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
    endDate: string,
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
export async function createReservation(data: ReservationCreate): Promise<{
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
export async function getReservationByNumber(reservationNumber: string): Promise<{
    success: boolean
    data: Reservation | null
    error?: string
}> {
    try {
        const response = await api.get<Reservation>(`/public/reservations/${reservationNumber}`)
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
export async function getReservationDetail(reservationId: number): Promise<{
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
    data: ReservationUpdate,
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
export async function cancelReservation(reservationId: number): Promise<{
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
