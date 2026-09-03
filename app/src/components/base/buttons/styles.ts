import type { Tone, Variant } from "@/components/base/tokens"

/**
 * ボタン系（Button / IconButton / CopyButton / LinkButton）で共有する配色
 *
 * 同じ tone なのに部品ごとに色が違う状態を避けるため、
 * 配色はここ1箇所だけで定義する。
 */

const FILLED: Record<Tone, string> = {
    info: "text-white bg-blue-700 dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-700 active:bg-blue-900",
    neutral:
        "text-white bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 active:bg-black",
    success:
        "text-white bg-green-700 dark:bg-green-600 hover:bg-green-800 dark:hover:bg-green-700 active:bg-green-900",
    warning:
        "text-white bg-yellow-500 dark:bg-yellow-600 hover:bg-yellow-600 dark:hover:bg-yellow-700 active:bg-yellow-700",
    danger: "text-white bg-red-700 dark:bg-red-600 hover:bg-red-800 dark:hover:bg-red-700 active:bg-red-900",
}

const OUTLINED: Record<Tone, string> = {
    info: "text-blue-700 dark:text-blue-400 border border-blue-700 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 active:bg-blue-100 dark:active:bg-blue-900",
    neutral:
        "text-gray-900 dark:text-gray-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600",
    success:
        "text-green-700 dark:text-green-400 border border-green-700 dark:border-green-600 hover:bg-green-50 dark:hover:bg-green-950 active:bg-green-100 dark:active:bg-green-900",
    warning:
        "text-yellow-700 dark:text-yellow-400 border border-yellow-600 dark:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950 active:bg-yellow-100 dark:active:bg-yellow-900",
    danger: "text-red-700 dark:text-red-400 border border-red-700 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-950 active:bg-red-100 dark:active:bg-red-900",
}

const SOFT: Record<Tone, string> = {
    neutral:
        "text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500",
    info: "text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-950 hover:bg-blue-200 dark:hover:bg-blue-900 active:bg-blue-300 dark:active:bg-blue-800",
    success:
        "text-green-800 dark:text-green-300 bg-green-100 dark:bg-green-950 hover:bg-green-200 dark:hover:bg-green-900 active:bg-green-300 dark:active:bg-green-800",
    warning:
        "text-yellow-800 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-950 hover:bg-yellow-200 dark:hover:bg-yellow-900 active:bg-yellow-300 dark:active:bg-yellow-800",
    danger: "text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-950 hover:bg-red-200 dark:hover:bg-red-900 active:bg-red-300 dark:active:bg-red-800",
}

const GHOST: Record<Tone, string> = {
    info: "text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 active:bg-blue-100 dark:active:bg-blue-900",
    neutral:
        "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600",
    success:
        "text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950 active:bg-green-100 dark:active:bg-green-900",
    warning:
        "text-yellow-700 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-950 active:bg-yellow-100 dark:active:bg-yellow-900",
    danger: "text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 active:bg-red-100 dark:active:bg-red-900",
}

const BY_VARIANT: Record<Variant, Record<Tone, string>> = {
    filled: FILLED,
    outlined: OUTLINED,
    soft: SOFT,
    ghost: GHOST,
}

/** tone と variant からボタンの配色クラスを返す */
export const buttonToneClasses = (tone: Tone, variant: Variant): string => BY_VARIANT[variant][tone]

const TEXT: Record<Tone, string> = {
    info: "text-blue-600 dark:text-blue-400",
    neutral: "text-gray-600 dark:text-gray-300",
    success: "text-green-600 dark:text-green-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    danger: "text-red-600 dark:text-red-400",
}

/** 下線付きテキストリンク用の文字色（背景を持たない） */
export const buttonTextClasses = (tone: Tone): string => TEXT[tone]

/** 押している間の縮小。ボタン系で共通の触感 */
export const BUTTON_PRESS = "active:scale-95"
