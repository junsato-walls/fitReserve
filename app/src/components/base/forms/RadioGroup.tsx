"use client"

import { ReactNode, useId } from "react"
import { cn } from "@/lib/utils"

export interface RadioGroupProps {
    children: ReactNode
    label?: string
    error?: string
    direction?: "horizontal" | "vertical"
    /** 枠線と内側余白を付ける。選択肢が多いときに領域を区切る用途 */
    bordered?: boolean
    /** 高さを制限してスクロールさせる。選択肢が多いときに使う */
    scrollable?: boolean
    required?: boolean
    /** labelを表示しない場合に、グループ名を支援技術へ伝えるために使う */
    "aria-label"?: string
}

export const RadioGroup = ({
    children,
    label,
    error,
    direction = "vertical",
    bordered = false,
    scrollable = false,
    required = false,
    "aria-label": ariaLabel,
}: RadioGroupProps) => {
    const reactId = useId()
    const errorId = `radiogroup-${reactId}-error`

    const containerClasses = direction === "horizontal" ? "flex flex-wrap gap-4" : "space-y-2"

    // 枠線・スクロールの見た目は画面側にclassNameで書かせず、ここで一元管理する
    const boxClasses = [
        bordered ? "border border-gray-300 dark:border-gray-700 rounded-md p-4" : "",
        scrollable ? "max-h-40 overflow-y-auto" : "",
    ]
        .filter(Boolean)
        .join(" ")

    return (
        <div className={`${boxClasses}`.trim()}>
            {/*
              fieldset/legend でグループ名を伝える。
              role="radiogroup" を明示することで、支援技術に「単一選択のグループ」であることを示す。
            */}
            <fieldset
                role="radiogroup"
                aria-required={required || undefined}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                aria-label={!label ? ariaLabel : undefined}
            >
                {label && (
                    <legend
                        className={cn(
                            "text-sm font-medium mb-2",
                            error
                                ? "text-red-700 dark:text-red-400"
                                : "text-gray-700 dark:text-gray-200",
                            required
                                ? "after:content-['*'] after:text-red-500 dark:after:text-red-400 after:ml-1"
                                : "",
                        )}
                    >
                        {label}
                    </legend>
                )}

                {/* ラジオボタンのコンテナ */}
                <div className={containerClasses}>{children}</div>
            </fieldset>

            {/* エラーメッセージ */}
            {error && (
                <p
                    id={errorId}
                    role="alert"
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                >
                    {error}
                </p>
            )}
        </div>
    )
}
