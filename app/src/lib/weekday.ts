/**
 * 曜日と時刻の表記
 *
 * 曜日は PostgreSQL の EXTRACT(DOW) に合わせて 0=日曜 〜 6=土曜。
 * JavaScript の `Date.getDay()` と同じ並びなので、そのまま添字に使える。
 * （Python 側は `date.weekday()` が月曜始まりのため、
 *   API では `system/clock.py` の `to_dow` で揃えている）
 */
export const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const

/** 定休日の曜日リストを「水・日」のような表示にする */
export function formatWeekdays(weekdays: number[]): string {
    if (weekdays.length === 0) return "なし"
    return [...weekdays]
        .sort((a, b) => a - b)
        .map((day) => WEEKDAY_LABELS[day] ?? String(day))
        .join("・")
}

/**
 * APIの時刻（"10:00:00"）を `<input type="time">` が扱う "10:00" にする
 *
 * 秒まで渡すとブラウザによっては値が反映されないため、必ず通すこと。
 */
export function toTimeInput(time: string | null | undefined): string {
    return time ? time.slice(0, 5) : ""
}

/** 時刻の表示用（"10:00:00" → "10:00"）。未設定は空文字 */
export function toTimeLabel(time: string | null | undefined): string {
    return toTimeInput(time)
}
