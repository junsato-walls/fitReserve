'use server'

import { api } from '@/lib/httpClient'
import type { UserRole } from '@/types/admin'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export interface LoginResponse {
    success: boolean
    error?: string
}

interface BackendLoginResponse {
    access_token: string
}

/** JWTのペイロードに含まれるログインユーザー情報 */
export interface CurrentUser {
    id: number
    personal_id: string
    user_name: string
    role: UserRole
    /** 所属店舗（表示用の主店舗）。権限の対象は store_ids */
    store_id: number | null
    /** 担当店舗。null は全店舗（super_admin / admin） */
    store_ids: number[] | null
    is_active: boolean
}

export async function login(
    personal_id: string,
    password: string
): Promise<LoginResponse> {
    try {
        // バックエンド(routers/custom/auth.py)はBody(...)でJSONを要求するため
        // クエリ文字列ではなくリクエストボディで送信する
        const response = await api.post<BackendLoginResponse>('/auth/login', {
            personal_id,
            password,
        });

        const token = response.data.access_token;
        if (!token) {
            console.error("❌ [Auth Action] トークン取得に失敗");
            return {
                success: false,
                error: "トークン取得に失敗しました"
            };
        }

        // クッキーにトークンを設定
        const cookieStore = await cookies();
        cookieStore.set("token", token, {
            httpOnly: true,
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7日間
            sameSite: "lax",
            // ローカル開発はhttpのため、本番(https)でのみsecureを有効にする
            secure: process.env.NODE_ENV === "production",
        });
        return { success: true };

    } catch (error: unknown) {
        console.error("❌ [Auth Action] ログインエラー:", error);

        const message = error instanceof Error ? error.message : '';
        // 認証失敗（401）と無効アカウント（403）はバックエンドの文言をそのまま見せる。
        // 原因が利用者に伝わる文言のため、ここで丸めない。
        if (message.includes('正しくありません') || message.includes('無効化')) {
            return { success: false, error: message };
        }

        return {
            success: false,
            error: "サーバーエラーが発生しました"
        };
    }
}

export async function logout(): Promise<void> {
    try {
        const cookieStore = await cookies();
        cookieStore.delete("token");
        console.log("✅ [Auth Action] ログアウト成功");
    } catch (error: unknown) {
        console.error("❌ [Auth Action] ログアウトエラー:", error);
    }
    redirect('/login');
}

export async function getAuthToken(): Promise<string | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        return token || null;
    } catch (error: unknown) {
        console.error("❌ [Auth Action] トークン取得エラー:", error);
        return null;
    }
}

/**
 * JWTのペイロード部分を取り出す（署名検証は行わない）
 *
 * サーバー側で自身が発行・保存したCookieを読むだけであり、
 * 実際の署名検証はリクエストを受けたバックエンドが行うため、
 * ここでは表示・入力補完用に中身を参照するにとどめる。
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    try {
        // JWTはbase64url形式のため、標準base64に変換してからデコードする
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
        return JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'))
    } catch (error: unknown) {
        console.error("❌ [Auth Action] JWTデコードエラー:", error)
        return null
    }
}

/**
 * ログイン中のユーザー情報を取得する
 * 未ログイン・トークン不正の場合はnullを返す
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
    const token = await getAuthToken()
    if (!token) return null

    const payload = decodeJwtPayload(token)
    if (!payload || typeof payload.id !== 'number') return null

    return {
        id: payload.id,
        personal_id: String(payload.personal_id ?? ''),
        user_name: String(payload.user_name ?? ''),
        role: (payload.role as CurrentUser['role']) ?? 'readonly',
        store_id: typeof payload.store_id === 'number' ? payload.store_id : null,
        // null は全店舗。admin以上は担当店舗を持たない
        store_ids: Array.isArray(payload.store_ids)
            ? (payload.store_ids as number[])
            : null,
        is_active: payload.is_active !== false,
    }
}
