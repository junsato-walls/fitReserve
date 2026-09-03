"use client"

import { ChangeEvent, forwardRef, useId } from "react"
import type { Size } from "@/components/base/tokens"
import { cn } from "@/lib/utils"

export interface RadioProps {
    // コンポーネント固有のプロパティ
    label?: string
    error?: string
    size?: Size

    // よく使うHTML属性
    value: string | number
    checked?: boolean
    disabled?: boolean
    required?: boolean
    name?: string

    // イベントハンドラー
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void

    // その他
    id?: string
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
    (
        {
            // コンポーネント固有
            label,
            error,
            size = "md",

            // HTML属性
            value,
            // デフォルト値を持たせると、利用側がcheckedを渡していなくても
            // 常に制御コンポーネント扱いになり「onChangeの無い読み取り専用フィールド」警告が出る。
            // undefinedのまま渡して非制御コンポーネントとして動作させる。
            checked,
            disabled = false,
            required = false,
            name,

            // イベント
            onChange,

            // その他
            id,
        },
        ref,
    ) => {
        // IDの生成
        // Math.random()だとSSRとクライアントで値がずれてハイドレーション不整合を起こすためuseIdを使う
        const reactId = useId()
        const radioId = id || `radio-${reactId}`
        const errorId = `${radioId}-error`

        // サイズのスタイル
        const sizeClasses = {
            sm: "w-3 h-3",
            md: "w-4 h-4",
            lg: "w-5 h-5",
        }

        const labelSizeClasses = {
            sm: "text-xs",
            md: "text-sm",
            lg: "text-base",
        }

        // 基本スタイル
        const baseClasses = `
    text-blue-600 dark:text-blue-400 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 
    focus:ring-blue-500 dark:focus:ring-blue-800 focus:ring-2 
    disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:cursor-not-allowed
    transition-colors
    ${error ? "border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-800" : ""}
    ${sizeClasses[size]}
  `.trim()

        return (
            <div className="flex items-center">
                {/* ラジオボタン */}
                <input
                    ref={ref}
                    id={radioId}
                    type="radio"
                    name={name}
                    value={value}
                    checked={checked}
                    disabled={disabled}
                    required={required}
                    className={baseClasses}
                    onChange={onChange}
                    // ラジオボタン単体は aria-invalid をサポートしない（グループ単位で扱う値のため）。
                    // エラー内容は aria-describedby で結び付ける
                    aria-describedby={error ? errorId : undefined}
                />

                {/* ラベル */}
                {label && (
                    <label
                        htmlFor={radioId}
                        className={cn(
                            "ml-2 font-medium cursor-pointer",
                            error
                                ? "text-red-700 dark:text-red-400"
                                : "text-gray-900 dark:text-gray-50",
                            disabled ? "text-gray-400 dark:text-gray-500 cursor-not-allowed" : "",
                            labelSizeClasses[size],
                            required
                                ? "after:content-['*'] after:text-red-500 dark:after:text-red-400 after:ml-1"
                                : "",
                        )}
                    >
                        {label}
                    </label>
                )}

                {/* エラーメッセージ（errorを受け取っていながら表示していなかったため追加） */}
                {error && (
                    <span
                        id={errorId}
                        role="alert"
                        className="ml-2 text-sm text-red-600 dark:text-red-400"
                    >
                        {error}
                    </span>
                )}
            </div>
        )
    },
)

Radio.displayName = "Radio"
