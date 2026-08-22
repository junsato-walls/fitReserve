"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
    DEFAULT_THEME,
    THEME_COOKIE,
    THEME_MAX_AGE,
    THEME_OPTIONS,
    parseThemePreference,
    type ThemePreference,
} from "@/lib/theme"

const ICONS = {
    light: Sun,
    dark: Moon,
    system: Monitor,
} as const

/** Cookieから現在の設定値を読む（サーバー側では呼ばれない） */
function readPreference(): ThemePreference {
    const match = document.cookie.match(new RegExp(`(?:^|; )${THEME_COOKIE}=([^;]*)`))
    return parseThemePreference(match ? decodeURIComponent(match[1]) : undefined)
}

/** 設定値を実際の配色に解決して <html> に反映する */
function applyTheme(preference: ThemePreference) {
    const isDark =
        preference === "dark" ||
        (preference === "system" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches)
    document.documentElement.classList.toggle("dark", isDark)
}

/**
 * テーマ切替（ライト / ダーク / システム追従）
 *
 * 設定値はCookieに保存し、次回アクセス時は layout.tsx がサーバー側で読んで
 * 初回描画からテーマを確定させる。httpOnlyにはしない（クライアントから読むため）。
 */
export const ThemeToggle = () => {
    // サーバーとクライアントで初期値がずれるため、マウント後に確定させる
    const [preference, setPreference] = useState<ThemePreference>(DEFAULT_THEME)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setPreference(readPreference())
        setMounted(true)
    }, [])

    // システム追従を選んでいる間は、OS側の変更に追従する
    useEffect(() => {
        if (preference !== "system") return

        const media = window.matchMedia("(prefers-color-scheme: dark)")
        const onChange = () => applyTheme("system")
        media.addEventListener("change", onChange)
        return () => media.removeEventListener("change", onChange)
    }, [preference])

    const handleSelect = (value: ThemePreference) => {
        setPreference(value)
        document.cookie = `${THEME_COOKIE}=${value}; path=/; max-age=${THEME_MAX_AGE}; samesite=lax`
        applyTheme(value)
    }

    return (
        <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                表示テーマ
            </p>
            <div
                role="radiogroup"
                aria-label="表示テーマ"
                className="flex gap-1 p-1 rounded-md bg-gray-200 dark:bg-gray-700"
            >
                {THEME_OPTIONS.map((option) => {
                    const Icon = ICONS[option.value]
                    // マウント前は選択状態を描画しない（サーバー出力と食い違うため）
                    const isSelected = mounted && preference === option.value
                    return (
                        <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => handleSelect(option.value)}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-colors",
                                "focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-800",
                                isSelected
                                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                            )}
                        >
                            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                            {option.label}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
