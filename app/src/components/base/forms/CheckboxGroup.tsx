"use client"

import { ReactNode, useId } from "react"
import { cn } from "@/lib/utils"

export interface CheckboxGroupProps {
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

export const CheckboxGroup = ({
    children,
    label,
    error,
    direction = "vertical",
    bordered = false,
    scrollable = false,
    required = false,
    "aria-label": ariaLabel,
}: CheckboxGroupProps) => {
    const reactId = useId()
    const errorId = `checkboxgroup-${reactId}-error`

    const containerClasses = direction === "horizontal" ? "flex flex-wrap gap-4" : "space-y-3"

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
              複数選択可のため role="group" を使う（単一選択のRadioGroupはradiogroup）。
            */}
            {/* role="group" は aria-invalid / aria-required をサポートしないため、
                必須はlegendの視覚表現、エラーは aria-describedby で伝える
                （個々のcheckboxのrequired属性はCheckbox側で扱う） */}
            <fieldset
                role="group"
                aria-describedby={error ? errorId : undefined}
                aria-label={!label ? ariaLabel : undefined}
            >
                {label && (
                    <legend
                        className={cn(
                            "text-sm font-medium mb-3",
                            error
                                ? "text-red-700 dark:text-red-400"
                                : "text-gray-700 dark:text-gray-300",
                            required
                                ? "after:content-['*'] after:text-red-500 dark:after:text-red-400 after:ml-1"
                                : "",
                        )}
                    >
                        {label}
                    </legend>
                )}

                {/* チェックボックスのコンテナ */}
                <div className={containerClasses}>{children}</div>
            </fieldset>

            {/* エラーメッセージ */}
            {error && (
                <p
                    id={errorId}
                    role="alert"
                    className="mt-2 text-sm text-red-600 dark:text-red-400"
                >
                    {error}
                </p>
            )}
        </div>
    )
}
