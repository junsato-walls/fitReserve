import { format } from "date-fns"

/**
 * Date をバックエンドに渡す日付文字列（yyyy-MM-dd）に変換する
 *
 * `toISOString()` はUTCに変換されるため、JST環境では日本時間の0:00〜8:59が
 * 前日の日付になってしまう。バックエンドは `ZoneInfo("Asia/Tokyo")` 前提のため、
 * ローカルタイムのまま整形する date-fns の `format` を使う。
 */
export function formatDateForApi(date: Date): string {
    return format(date, "yyyy-MM-dd")
}
