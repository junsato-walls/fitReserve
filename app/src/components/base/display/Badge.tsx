"use client"

import { forwardRef, ReactNode } from "react"
import type { Size, Tone, Variant } from "@/components/base/tokens"
import { cn } from "@/lib/utils"

/** 用途バッジの共通スタイル */
export const BADGE_BASE_CLASS =
    "inline-block px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap"

/**
 * 用途ごとの配色（淡い塗り）
 *
 * Table のバッジ列・Timetable の予定ブロックとも共有する。
 * 生のカラークラスを画面側に書かせないため、色はここで一元管理する。
 */
export const BADGE_TONE_CLASSES: Record<Tone, string> = {
    neutral: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100",
    info: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-400",
    success: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-400",
    warning: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-400",
    danger: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-400",
}

const OUTLINED_TONE_CLASSES: Record<Tone, string> = {
    neutral: "text-gray-800 dark:text-gray-300 border border-gray-400 dark:border-gray-500",
    info: "text-blue-800 dark:text-blue-400 border border-blue-400",
    success: "text-green-800 dark:text-green-400 border border-green-400",
    warning: "text-yellow-800 dark:text-yellow-300 border border-yellow-400",
    danger: "text-red-800 dark:text-red-400 border border-red-400",
}

const FILLED_TONE_CLASSES: Record<Tone, string> = {
    neutral: "bg-gray-800 dark:bg-gray-600 text-white",
    info: "bg-blue-500 dark:bg-blue-600 text-white",
    success: "bg-green-500 dark:bg-green-600 text-white",
    warning: "bg-yellow-500 dark:bg-yellow-600 text-white",
    danger: "bg-red-500 dark:bg-red-600 text-white",
}

const GHOST_TONE_CLASSES: Record<Tone, string> = {
    neutral: "text-gray-800 dark:text-gray-300",
    info: "text-blue-800 dark:text-blue-400",
    success: "text-green-800 dark:text-green-400",
    warning: "text-yellow-800 dark:text-yellow-300",
    danger: "text-red-800 dark:text-red-400",
}

const TONE_BY_VARIANT: Record<Variant, Record<Tone, string>> = {
    soft: BADGE_TONE_CLASSES,
    outlined: OUTLINED_TONE_CLASSES,
    filled: FILLED_TONE_CLASSES,
    ghost: GHOST_TONE_CLASSES,
}

const SIZE_CLASSES: Record<Size, string> = {
    sm: "text-xs px-2.5 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
}

const ROUNDED_CLASSES = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
} as const

export interface BadgeProps {
    // 基本設定
    children: ReactNode
    /** 用途を表す色 */
    tone?: Tone

    // スタイル設定
    /** 見た目の型 */
    variant?: Variant
    size?: Size
    rounded?: keyof typeof ROUNDED_CLASSES

    // 追加機能
    removable?: boolean
    icon?: ReactNode
    dot?: boolean

    // イベント
    onRemove?: () => void
    onClick?: () => void

    // その他
    as?: "span" | "div" | "button"
}

export const Badge = forwardRef<HTMLElement, BadgeProps>(
    (
        {
            children,
            tone = "neutral",
            variant = "soft",
            size = "sm",
            rounded = "full",
            removable = false,
            icon,
            dot = false,
            onRemove,
            onClick,
            as = "span",
        },
        ref,
    ) => {
        // クリック可能かどうか
        const isClickable = onClick || as === "button"

        const baseClasses = cn(
            "inline-flex items-center font-medium",
            SIZE_CLASSES[size],
            TONE_BY_VARIANT[variant][tone],
            ROUNDED_CLASSES[rounded],
            isClickable && "cursor-pointer hover:opacity-80 transition-opacity duration-150",
        )

        // コンテンツ
        const content = (
            <>
                {/* ドット */}
                {dot && <span className="w-2 h-2 rounded-full bg-current me-1 opacity-60" />}

                {/* アイコン */}
                {icon && <span className="me-1">{icon}</span>}

                {/* テキスト */}
                <span>{children}</span>

                {/* 削除ボタン */}
                {removable && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            onRemove?.()
                        }}
                        className="ms-1 -me-1 p-0.5 rounded-full hover:bg-current hover:bg-opacity-20 transition-colors duration-150"
                        aria-label="Remove"
                    >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                )}
            </>
        )

        // 要素タイプに応じてレンダリング
        if (as === "button") {
            return (
                <button
                    ref={ref as React.Ref<HTMLButtonElement>}
                    onClick={onClick}
                    className={baseClasses}
                    type="button"
                >
                    {content}
                </button>
            )
        }

        if (as === "div") {
            return (
                <div
                    ref={ref as React.Ref<HTMLDivElement>}
                    onClick={onClick}
                    className={baseClasses}
                >
                    {content}
                </div>
            )
        }

        // デフォルトは span
        return (
            <span ref={ref as React.Ref<HTMLSpanElement>} onClick={onClick} className={baseClasses}>
                {content}
            </span>
        )
    },
)

Badge.displayName = "Badge"
