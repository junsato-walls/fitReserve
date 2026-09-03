"use client"

import { forwardRef, ReactNode, useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export interface ToastProps {
    // 基本設定
    id?: string
    message: string
    type?: "default" | "success" | "error" | "warning" | "info"

    // 表示設定
    visible?: boolean
    duration?: number // ミリ秒、0で自動非表示なし

    // スタイル設定
    showIcon?: boolean
    showCloseButton?: boolean
    closable?: boolean
    icon?: ReactNode

    // イベント
    onClose?: () => void
    onShow?: () => void

    // その他
    role?: string
}

export const Toast = forwardRef<HTMLDivElement, ToastProps>(
    (
        {
            id,
            message,
            type = "default",
            visible = true,
            duration = 5000,
            showIcon = true,
            showCloseButton = true,
            closable = true,
            icon,
            onClose,
            onShow,
            role = "alert",
        },
        ref,
    ) => {
        const [isVisible, setIsVisible] = useState(visible)
        const [isAnimating, setIsAnimating] = useState(false)

        // タイプ別スタイル
        const getTypeStyles = () => {
            const styles = {
                default: {
                    container: "text-gray-500 bg-white dark:text-gray-400 dark:bg-gray-800",
                    icon: "text-blue-500 bg-blue-100 dark:bg-blue-800 dark:text-blue-200",
                    defaultIcon: (
                        <svg
                            className="w-4 h-4"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 18 20"
                        >
                            <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15.147 15.085a7.159 7.159 0 0 1-6.189 3.307A6.713 6.713 0 0 1 3.1 15.444c-2.679-4.513.287-8.737.888-9.548A4.373 4.373 0 0 0 5 1.608c1.287.953 6.445 3.218 5.537 10.5 1.5-1.122 2.706-3.01 2.853-6.14 1.433 1.049 3.993 5.395 1.757 9.117Z"
                            />
                        </svg>
                    ),
                },
                success: {
                    container: "text-green-500 bg-white dark:text-green-400 dark:bg-gray-800",
                    icon: "text-green-500 bg-green-100 dark:bg-green-800 dark:text-green-200",
                    defaultIcon: (
                        <svg
                            className="w-4 h-4"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 16 12"
                        >
                            <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M1 5.917 5.724 10.5 15 1.5"
                            />
                        </svg>
                    ),
                },
                error: {
                    container: "text-red-500 bg-white dark:text-red-400 dark:bg-gray-800",
                    icon: "text-red-500 bg-red-100 dark:bg-red-800 dark:text-red-200",
                    defaultIcon: (
                        <svg
                            className="w-4 h-4"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 14 14"
                        >
                            <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                            />
                        </svg>
                    ),
                },
                warning: {
                    container: "text-yellow-500 bg-white dark:text-yellow-400 dark:bg-gray-800",
                    icon: "text-yellow-500 bg-yellow-100 dark:bg-yellow-800 dark:text-yellow-200",
                    defaultIcon: (
                        <svg
                            className="w-4 h-4"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 20 20"
                        >
                            <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                            />
                        </svg>
                    ),
                },
                info: {
                    container: "text-blue-500 bg-white dark:text-blue-400 dark:bg-gray-800",
                    icon: "text-blue-500 bg-blue-100 dark:bg-blue-800 dark:text-blue-200",
                    defaultIcon: (
                        <svg
                            className="w-4 h-4"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 20 20"
                        >
                            <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M8 9h2v5m-2 0h4M9.408 5.5h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                            />
                        </svg>
                    ),
                },
            } as const

            return styles[type]
        }

        // 閉じる処理をuseCallbackでメモ化
        const handleClose = useCallback(() => {
            if (!closable) return

            setIsAnimating(true)
            setTimeout(() => {
                setIsVisible(false)
                onClose?.()
            }, 150) // アニメーション時間
        }, [closable, onClose])

        // 自動非表示
        useEffect(() => {
            if (visible && duration > 0) {
                const timer = setTimeout(() => {
                    handleClose()
                }, duration)

                return () => clearTimeout(timer)
            }
        }, [visible, duration, handleClose])

        // 表示状態の同期
        useEffect(() => {
            if (visible !== isVisible) {
                setIsVisible(visible)
                if (visible) {
                    setIsAnimating(false)
                    onShow?.()
                }
            }
        }, [visible, isVisible, onShow])

        // 非表示の場合は何も表示しない
        if (!isVisible) return null

        const typeStyles = getTypeStyles()

        return (
            <div
                ref={ref}
                id={id}
                role={role}
                className={cn(
                    "flex items-center w-full max-w-xs p-4 rounded-lg shadow-sm transition-all duration-150 ease-in-out",
                    typeStyles.container,
                    isAnimating ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0",
                )}
            >
                {/* アイコン */}
                {showIcon && (
                    <div
                        className={cn(
                            "inline-flex items-center justify-center shrink-0 w-8 h-8 rounded-lg",
                            typeStyles.icon,
                        )}
                    >
                        {icon || typeStyles.defaultIcon}
                        <span className="sr-only">{type} icon</span>
                    </div>
                )}

                {/* メッセージ */}
                <div
                    className={cn(
                        "text-sm font-normal",
                        showIcon ? "ms-3" : "",
                        showCloseButton ? "me-3" : "",
                        "flex-1",
                    )}
                >
                    {message}
                </div>

                {/* 閉じるボタン */}
                {showCloseButton && closable && (
                    <button
                        type="button"
                        onClick={handleClose}
                        className="
                        ms-auto -mx-1.5 -my-1.5 bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-50 
                        rounded-lg focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-800 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 
                        inline-flex items-center justify-center h-8 w-8
                        dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700
                        transition-colors duration-150
                    "
                        aria-label="Close"
                    >
                        <span className="sr-only">Close</span>
                        <svg
                            className="w-3 h-3"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 14 14"
                        >
                            <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                            />
                        </svg>
                    </button>
                )}
            </div>
        )
    },
)

Toast.displayName = "Toast"
