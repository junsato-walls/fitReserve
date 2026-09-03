"use server"

import { getCurrentUser } from "@/api/Auth"
import { api } from "@/lib/httpClient"
import type { Project, ProjectCreate, ProjectUpdate } from "@/types/admin"

/** 作成者・更新者IDはログインユーザーから補完するため、呼び出し側では指定しない */
export type ProjectCreateInput = Omit<ProjectCreate, "created_by" | "updated_by">
export type ProjectUpdateInput = Omit<ProjectUpdate, "updated_by">

/** APIエラーからメッセージを取り出す（lib/httpClient.ts がdetailをErrorに詰めている） */
function toErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback
}

/**
 * プロジェクト一覧を取得（管理者向け）
 */
export async function getProjectsAdmin(params?: {
    skip?: number
    limit?: number
    is_enabled?: boolean
}): Promise<{
    success: boolean
    data: Project[] | null
    error?: string
}> {
    try {
        const response = await api.get<Project[]>("/admin/projects", { params })
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to fetch projects:", error)
        return {
            success: false,
            data: null,
            error: toErrorMessage(error, "プロジェクト一覧の取得に失敗しました"),
        }
    }
}

/**
 * プロジェクト詳細を取得
 */
export async function getProjectDetail(projectId: number): Promise<{
    success: boolean
    data: Project | null
    error?: string
}> {
    try {
        const response = await api.get<Project>(`/admin/projects/${projectId}`)
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to fetch project detail:", error)
        return {
            success: false,
            data: null,
            error: toErrorMessage(error, "プロジェクト詳細の取得に失敗しました"),
        }
    }
}

/**
 * プロジェクトを作成
 */
export async function createProject(data: ProjectCreateInput): Promise<{
    success: boolean
    data: Project | null
    error?: string
}> {
    try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
            return { success: false, data: null, error: "ログインが必要です" }
        }

        const response = await api.post<Project>("/admin/projects", {
            ...data,
            created_by: currentUser.id,
            updated_by: currentUser.id,
        })
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to create project:", error)
        return {
            success: false,
            data: null,
            error: toErrorMessage(error, "プロジェクトの作成に失敗しました"),
        }
    }
}

/**
 * プロジェクトを更新
 */
export async function updateProject(
    projectId: number,
    data: ProjectUpdateInput,
): Promise<{
    success: boolean
    data: Project | null
    error?: string
}> {
    try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
            return { success: false, data: null, error: "ログインが必要です" }
        }

        const response = await api.put<Project>(`/admin/projects/${projectId}`, {
            ...data,
            updated_by: currentUser.id,
        })
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to update project:", error)
        return {
            success: false,
            data: null,
            error: toErrorMessage(error, "プロジェクトの更新に失敗しました"),
        }
    }
}

/**
 * プロジェクトを削除（論理削除）
 */
export async function deleteProject(projectId: number): Promise<{
    success: boolean
    error?: string
}> {
    try {
        await api.delete(`/admin/projects/${projectId}`)
        return { success: true }
    } catch (error: unknown) {
        console.error("Failed to delete project:", error)
        return {
            success: false,
            error: toErrorMessage(error, "プロジェクトの削除に失敗しました"),
        }
    }
}
