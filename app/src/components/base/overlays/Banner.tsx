"use client"

import { forwardRef, ReactNode, useCallback, useState } from "react"
import { BUTTON_PRESS, buttonToneClasses } from "@/components/base/buttons/styles"
import type { Tone, Variant } from "@/components/base/tokens"
import { cn } from "@/lib/utils"

export interface BannerAction {
    id: string
    label: ReactNode
    onClick?: () => void
    href?: string
    /** 用途を表す色 */
    tone?: Tone
    /** 見た目の型 */
    variant?: Variant
}

export interface BannerProps {
    // コンテンツ設定
    children?: ReactNode
    message?: ReactNode
    icon?: ReactNode
    actions?: BannerAction[]

    // 表示設定
    /** 用途を表す色 */
    tone?: Tone
    position?: "top" | "bottom" | "relative"
    dismissible?: boolean
    sticky?: boolean
    visible?: boolean
    onVisibilityChange?: (visible: boolean) => void

    // スタイル設定

    // その他
    id?: string
    "aria-label"?: string
    autoHide?: boolean
    autoHideDelay?: number
}

export const Banner = forwardRef<HTMLDivElement, BannerProps>(
    (
        {
            children,
            message,
            icon,
            actions = [],
            tone = "info",
            position = "top",
            dismissible = true,
            sticky = false,
            visible: controlledVisible,
            onVisibilityChange,
            id = "banner",
            "aria-label": ariaLabel,
            autoHide = false,
            autoHideDelay = 5000,
        },
        ref,
    ) => {
        // 内部表示状態管理
        const [internalVisible, setInternalVisible] = useState(true)

        // 現在の表示状態を決定
        const isVisible = controlledVisible !== undefined ? controlledVisible : internalVisible

        // 非表示ハンドラー
        const handleDismiss = useCallback(() => {
            if (controlledVisible !== undefined) {
                onVisibilityChange?.(false)
            } else {
                setInternalVisible(false)
                onVisibilityChange?.(false)
            }
        }, [controlledVisible, onVisibilityChange])

        // 自動非表示の設定
        useState(() => {
            if (autoHide && isVisible) {
                const timer = setTimeout(() => {
                    handleDismiss()
                }, autoHideDelay)

                return () => clearTimeout(timer)
            }
        })

        // tone 別のスタイル
        const getToneStyles = () => {
            switch (tone) {
                case "success":
                    return {
                        banner: "bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-700",
                        text: "text-green-800 dark:text-green-200",
                        icon: "bg-green-200 text-green-600 dark:bg-green-700 dark:text-green-300",
                        button: "text-green-400 hover:bg-green-200 hover:text-green-900 dark:hover:bg-green-800 dark:hover:text-green-100",
                    }
                case "warning":
                    return {
                        banner: "bg-yellow-50 border-yellow-200 dark:bg-yellow-900 dark:border-yellow-700",
                        text: "text-yellow-800 dark:text-yellow-200",
                        icon: "bg-yellow-200 text-yellow-600 dark:bg-yellow-700 dark:text-yellow-300",
                        button: "text-yellow-400 hover:bg-yellow-200 hover:text-yellow-900 dark:hover:bg-yellow-800 dark:hover:text-yellow-100",
                    }
                case "danger":
                    return {
                        banner: "bg-red-50 border-red-200 dark:bg-red-900 dark:border-red-700",
                        text: "text-red-800 dark:text-red-200",
                        icon: "bg-red-200 text-red-600 dark:bg-red-700 dark:text-red-300",
                        button: "text-red-400 hover:bg-red-200 hover:text-red-900 dark:hover:bg-red-800 dark:hover:text-red-100",
                    }
                case "neutral":
                    return {
                        banner: "bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600",
                        text: "text-gray-800 dark:text-gray-200",
                        icon: "bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300",
                        button: "text-gray-400 dark:text-gray-500 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white",
                    }
                default: // 'info'
                    return {
                        banner: "bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-700",
                        text: "text-blue-800 dark:text-blue-200",
                        icon: "bg-blue-200 text-blue-600 dark:bg-blue-700 dark:text-blue-300",
                        button: "text-blue-400 hover:bg-blue-200 hover:text-blue-900 dark:hover:bg-blue-800 dark:hover:text-blue-100",
                    }
            }
        }

        // ポジション別のスタイル
        const getPositionStyles = () => {
            const baseClasses = "w-full border-b"

            switch (position) {
                case "bottom":
                    return `${baseClasses} ${sticky ? "fixed bottom-0" : ""} border-t border-b-0`
                case "relative":
                    return baseClasses
                default: // 'top'
                    return `${baseClasses} ${sticky ? "fixed top-0" : ""}`
            }
        }

        // デフォルトアイコン
        const getDefaultIcon = () => {
            switch (tone) {
                case "success":
                    return (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                    )
                case "warning":
                    return (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                    )
                case "danger":
                    return (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                    )
                default: // 'info', 'neutral'
                    return (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 18 19">
                            <path d="M15 1.943v12.114a1 1 0 0 1-1.581.814L8 11V5l5.419-3.871A1 1 0 0 1 15 1.943ZM7 4H2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2v5a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V4ZM4 17v-5h1v5H4ZM16 5.183v5.634a2.984 2.984 0 0 0 0-5.634Z" />
                        </svg>
                    )
            }
        }

        const toneStyles = getToneStyles()
        const positionStyles = getPositionStyles()

        // 非表示の場合は何もレンダリングしない
        if (!isVisible) {
            return null
        }

        return (
            <div
                ref={ref}
                id={id}
                tabIndex={-1}
                className={cn(
                    positionStyles,
                    toneStyles.banner,
                    sticky ? "z-50" : "",
                    "flex justify-between p-4",
                )}
                role="banner"
                aria-label={ariaLabel}
            >
                {/* メインコンテンツ */}
                <div className={cn("flex items-center mx-auto")}>
                    <div className={cn("flex items-center text-sm font-normal", toneStyles.text)}>
                        {/* アイコン */}
                        {icon !== null && (
                            <span
                                className={cn(
                                    "inline-flex p-1 me-3 rounded-full w-6 h-6 items-center justify-center shrink-0",
                                    toneStyles.icon,
                                )}
                            >
                                {icon || getDefaultIcon()}
                                <span className="sr-only">Banner icon</span>
                            </span>
                        )}

                        {/* メッセージ */}
                        <span>{children || message}</span>
                    </div>
                </div>

                {/* アクション＆クローズボタン */}
                <div className={cn("flex items-center space-x-2")}>
                    {/* カスタムアクション */}
                    {actions.map((action) => {
                        // 配色はボタン系と同じ表を使う（同じ tone で色が変わらないように）
                        const actionClasses = cn(
                            "text-sm font-medium rounded-lg px-3 py-1.5",
                            buttonToneClasses(action.tone ?? "info", action.variant ?? "filled"),
                            BUTTON_PRESS,
                        )

                        return action.href ? (
                            <a
                                key={action.id}
                                href={action.href}
                                className={actionClasses}
                                onClick={action.onClick}
                            >
                                {action.label}
                            </a>
                        ) : (
                            <button
                                key={action.id}
                                type="button"
                                className={actionClasses}
                                onClick={action.onClick}
                            >
                                {action.label}
                            </button>
                        )
                    })}

                    {/* クローズボタン */}
                    {dismissible && (
                        <button
                            type="button"
                            className={cn(
                                "shrink-0 inline-flex justify-center w-7 h-7 items-center rounded-lg text-sm p-1.5",
                                toneStyles.button,
                            )}
                            onClick={handleDismiss}
                            aria-label="Close banner"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 14 14">
                                <path
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                                />
                            </svg>
                            <span className="sr-only">Close banner</span>
                        </button>
                    )}
                </div>
            </div>
        )
    },
)

Banner.displayName = "Banner"
