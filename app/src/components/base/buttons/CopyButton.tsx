"use client"

import { ReactNode, useEffect, useRef, useState } from "react"
import { BUTTON_PRESS, buttonToneClasses } from "@/components/base/buttons/styles"
import type { Size, Tone, Variant } from "@/components/base/tokens"
import { cn } from "@/lib/utils"

export interface CopyButtonProps {
    // コピー対象
    text?: string
    targetInputId?: string

    // 表示テキスト
    defaultText?: string
    successText?: string
    successIcon?: ReactNode

    // スタイル
    /** 用途を表す色 */
    tone?: Tone
    /** 見た目の型（塗り・枠線・透明） */
    variant?: Variant
    size?: Size
    fullWidth?: boolean

    // 動作設定
    resetDelay?: number
    disabled?: boolean

    // イベント
    onCopy?: (text: string) => void
    onCopySuccess?: () => void
    onCopyError?: (error: Error) => void
}

export const CopyButton = ({
    text,
    targetInputId,
    defaultText = "Copy",
    successText = "Copied!",
    successIcon,
    tone = "info",
    variant = "filled",
    size = "md",
    fullWidth = false,
    resetDelay = 2000,
    disabled = false,
    onCopy,
    onCopySuccess,
    onCopyError,
}: CopyButtonProps) => {
    const [isCopied, setIsCopied] = useState(false)
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // デフォルトの成功アイコン
    const defaultSuccessIcon = (
        <svg
            className="w-3 h-3 text-current me-1.5"
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
    )

    // サイズ別スタイル
    const sizeClasses = {
        sm: "text-xs py-1.5 px-2",
        md: "text-sm py-2.5 px-3",
        lg: "text-base py-3 px-4",
    }

    // コピー処理
    const handleCopy = async () => {
        if (disabled || isCopied) return

        let textToCopy = text

        // ターゲット要素からテキストを取得
        if (targetInputId && !textToCopy) {
            const targetElement = document.getElementById(targetInputId) as HTMLInputElement
            if (targetElement) {
                textToCopy = targetElement.value
            }
        }

        if (!textToCopy) {
            console.warn("CopyButton: No text to copy")
            return
        }

        try {
            // Clipboard API を使用
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(textToCopy)
            } else {
                // フォールバック: execCommand を使用
                const textarea = document.createElement("textarea")
                textarea.value = textToCopy
                textarea.style.position = "fixed"
                textarea.style.left = "-999999px"
                textarea.style.top = "-999999px"
                document.body.appendChild(textarea)
                textarea.focus()
                textarea.select()

                if (!document.execCommand("copy")) {
                    throw new Error("execCommand failed")
                }

                document.body.removeChild(textarea)
            }

            // 成功時の処理
            setIsCopied(true)
            onCopy?.(textToCopy)
            onCopySuccess?.()

            // 一定時間後にリセット
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }

            timeoutRef.current = setTimeout(() => {
                setIsCopied(false)
            }, resetDelay)
        } catch (error) {
            console.error("Copy failed:", error)
            onCopyError?.(error as Error)
        }
    }

    // クリーンアップ
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    return (
        <button
            type="button"
            onClick={handleCopy}
            disabled={disabled}
            className={cn(
                "font-medium rounded-lg focus:outline-none items-center inline-flex justify-center",
                "transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
                buttonToneClasses(tone, variant),
                BUTTON_PRESS,
                sizeClasses[size],
                fullWidth ? "w-full" : "w-auto",
            )}
            aria-label={isCopied ? successText : defaultText}
        >
            {isCopied ? (
                <span className="inline-flex items-center">
                    {successIcon || defaultSuccessIcon}
                    {successText}
                </span>
            ) : (
                <span>{defaultText}</span>
            )}
        </button>
    )
}
