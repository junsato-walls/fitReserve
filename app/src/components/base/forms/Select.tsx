"use client"

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import type { Size } from "@/components/base/tokens"
import { cn } from "@/lib/utils"

export interface SelectOption<T extends string | number = string> {
    value: T
    label: string
    disabled?: boolean
}

export interface SelectProps<T extends string | number = string> {
    // 値
    options: SelectOption<T>[]
    value?: T
    onChange?: (value: T, option: SelectOption<T>) => void

    // 表示
    label?: string
    placeholder?: string
    error?: string
    helperText?: string

    // スタイル
    size?: Size
    fullWidth?: boolean

    // 状態
    disabled?: boolean
    required?: boolean

    // その他
    id?: string
    name?: string
    "aria-label"?: string
}

/** 選択肢のラベルからタイプアヘッド検索する際の入力リセット時間（ms） */
const TYPEAHEAD_RESET_MS = 500

/**
 * 値を選択するためのセレクトボックス
 *
 * WAI-ARIA Authoring Practices の Listbox パターンに準拠する。
 * 「編集」「削除」などの操作を並べる用途には Menu パターンの Dropdown を使うこと
 * （ARIA上、値の選択と操作の実行は別パターンとして区別されている）。
 */
export const Select = <T extends string | number>({
    options,
    value,
    onChange,
    label,
    placeholder = "選択してください",
    error,
    helperText,
    size = "md",
    fullWidth = false,
    disabled = false,
    required = false,
    id,
    name,
    "aria-label": ariaLabel,
}: SelectProps<T>) => {
    const reactId = useId()
    const baseId = id || `select-${reactId}`
    const listboxId = `${baseId}-listbox`
    const labelId = `${baseId}-label`
    const errorId = `${baseId}-error`
    const helperId = `${baseId}-helper`

    const [isOpen, setIsOpen] = useState(false)
    // キーボードで現在ハイライトしている選択肢の位置（-1はハイライト無し）
    const [activeIndex, setActiveIndex] = useState(-1)

    const containerRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const listboxRef = useRef<HTMLUListElement>(null)
    // タイプアヘッド（文字を打って選択肢を絞る）用のバッファ
    const typeaheadRef = useRef<{ query: string; timer: number | null }>({ query: "", timer: null })

    const selectedIndex = useMemo(
        () => options.findIndex((option) => option.value === value),
        [options, value],
    )
    const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined

    /** 指定位置から探して、最初に見つかる選択可能な選択肢の位置を返す */
    const findEnabledIndex = useCallback(
        (start: number, direction: 1 | -1): number => {
            const count = options.length
            if (count === 0) return -1

            for (let i = 0; i < count; i++) {
                // 端に到達したら反対側へ回り込む
                const index = (start + direction * i + count * count) % count
                if (!options[index]?.disabled) return index
            }
            return -1
        },
        [options],
    )

    const openListbox = useCallback(
        (initialIndex?: number) => {
            if (disabled) return
            setIsOpen(true)
            // 選択済みがあればそこから、無ければ先頭の選択可能な項目をハイライトする
            const start = initialIndex ?? (selectedIndex >= 0 ? selectedIndex : 0)
            setActiveIndex(options[start]?.disabled ? findEnabledIndex(start, 1) : start)
        },
        [disabled, selectedIndex, options, findEnabledIndex],
    )

    const closeListbox = useCallback((returnFocus = true) => {
        setIsOpen(false)
        setActiveIndex(-1)
        if (returnFocus) {
            triggerRef.current?.focus()
        }
    }, [])

    const selectOption = useCallback(
        (index: number) => {
            const option = options[index]
            if (!option || option.disabled) return

            onChange?.(option.value, option)
            closeListbox()
        },
        [options, onChange, closeListbox],
    )

    /**
     * 打鍵した文字で始まる選択肢へ移動する（ネイティブのselectと同じ挙動）
     *
     * 注意: IME（日本語入力）経由で確定した文字は keydown を発火しないため、
     * 日本語ラベルに対するタイプアヘッドは動作しない。英数字ラベルのみ有効。
     * これは keydown ベースの実装全般に共通する制約。
     */
    const handleTypeahead = useCallback(
        (char: string) => {
            const state = typeaheadRef.current
            state.query += char.toLowerCase()

            if (state.timer !== null) window.clearTimeout(state.timer)
            state.timer = window.setTimeout(() => {
                state.query = ""
                state.timer = null
            }, TYPEAHEAD_RESET_MS)

            const matched = options.findIndex(
                (option) => !option.disabled && option.label.toLowerCase().startsWith(state.query),
            )
            if (matched >= 0) {
                setActiveIndex(matched)
                if (!isOpen) selectOption(matched)
            }
        },
        [options, isOpen, selectOption],
    )

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (disabled) return

        switch (event.key) {
            case "Enter":
            case " ":
                event.preventDefault()
                if (isOpen) {
                    if (activeIndex >= 0) selectOption(activeIndex)
                } else {
                    openListbox()
                }
                break

            case "ArrowDown":
                event.preventDefault()
                if (!isOpen) {
                    openListbox()
                } else {
                    setActiveIndex((prev) => findEnabledIndex(prev + 1, 1))
                }
                break

            case "ArrowUp":
                event.preventDefault()
                if (!isOpen) {
                    openListbox()
                } else {
                    setActiveIndex((prev) => findEnabledIndex(prev - 1, -1))
                }
                break

            case "Home":
                if (isOpen) {
                    event.preventDefault()
                    setActiveIndex(findEnabledIndex(0, 1))
                }
                break

            case "End":
                if (isOpen) {
                    event.preventDefault()
                    setActiveIndex(findEnabledIndex(options.length - 1, -1))
                }
                break

            case "Escape":
                if (isOpen) {
                    event.preventDefault()
                    closeListbox()
                }
                break

            case "Tab":
                // Tabは移動を止めない。開いていれば閉じるだけ（フォーカスは奪わない）
                if (isOpen) closeListbox(false)
                break

            default:
                // 表示可能な1文字のみタイプアヘッドの対象にする
                if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
                    event.preventDefault()
                    handleTypeahead(event.key)
                }
                break
        }
    }

    // 外側クリックで閉じる（トリガーへフォーカスは戻さない）
    useEffect(() => {
        if (!isOpen) return

        const handlePointerDown = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                closeListbox(false)
            }
        }

        document.addEventListener("mousedown", handlePointerDown)
        return () => document.removeEventListener("mousedown", handlePointerDown)
    }, [isOpen, closeListbox])

    // ハイライト中の選択肢が見えるようにスクロールする
    useEffect(() => {
        if (!isOpen || activeIndex < 0) return
        const activeEl = listboxRef.current?.querySelector<HTMLElement>(
            `#${CSS.escape(`${baseId}-option-${activeIndex}`)}`,
        )
        activeEl?.scrollIntoView({ block: "nearest" })
    }, [isOpen, activeIndex, baseId])

    // アンマウント時にタイプアヘッドのタイマーを片付ける
    useEffect(() => {
        // cleanup時点でrefの参照先が変わっている可能性があるため、
        // effect実行時のオブジェクトをローカルに束縛しておく
        const typeaheadState = typeaheadRef.current
        return () => {
            if (typeaheadState.timer !== null) window.clearTimeout(typeaheadState.timer)
        }
    }, [])

    const sizeClasses = {
        sm: "text-xs px-3 py-1.5",
        md: "text-sm px-4 py-2.5",
        lg: "text-base px-5 py-3",
    }

    const describedBy = [error ? errorId : null, helperText ? helperId : null]
        .filter(Boolean)
        .join(" ")

    return (
        <div className={cn(fullWidth ? "w-full" : "inline-block")}>
            {label && (
                <label
                    id={labelId}
                    htmlFor={baseId}
                    className="block mb-1.5 text-sm font-medium text-gray-900 dark:text-white"
                >
                    {label}
                    {required && (
                        <span className="ml-1 text-red-600 dark:text-red-400" aria-hidden="true">
                            *
                        </span>
                    )}
                </label>
            )}

            <div ref={containerRef} className="relative">
                <button
                    ref={triggerRef}
                    type="button"
                    id={baseId}
                    disabled={disabled}
                    onClick={() => (isOpen ? closeListbox(false) : openListbox())}
                    onKeyDown={handleKeyDown}
                    // Listboxパターンでは、トリガーにcomboboxロールを与えて
                    // 展開先のリストをaria-controlsで結び付ける
                    role="combobox"
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    aria-controls={isOpen ? listboxId : undefined}
                    // ハイライト中の選択肢をスクリーンリーダーへ伝える（DOMフォーカスは移さない）
                    aria-activedescendant={
                        isOpen && activeIndex >= 0 ? `${baseId}-option-${activeIndex}` : undefined
                    }
                    aria-labelledby={label ? labelId : undefined}
                    aria-label={!label ? ariaLabel : undefined}
                    aria-required={required || undefined}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy || undefined}
                    className={cn(
                        "flex items-center justify-between gap-2 w-full bg-white dark:bg-gray-800 border rounded-lg text-left focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:focus:ring-blue-800",
                        error
                            ? "border-red-500 dark:border-red-500"
                            : "border-gray-300 dark:border-gray-600",
                        sizeClasses[size],
                    )}
                >
                    <span className={selectedOption ? "" : "text-gray-400 dark:text-gray-400"}>
                        {selectedOption?.label ?? placeholder}
                    </span>
                    <svg
                        className="w-2.5 h-2.5 flex-shrink-0"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 10 6"
                    >
                        <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="m1 1 4 4 4-4"
                        />
                    </svg>
                </button>

                {/* フォーム送信で値を送れるようにする */}
                {name && (
                    <input type="hidden" name={name} value={value != null ? String(value) : ""} />
                )}

                {isOpen && (
                    <ul
                        ref={listboxRef}
                        id={listboxId}
                        role="listbox"
                        aria-labelledby={label ? labelId : undefined}
                        aria-label={!label ? ariaLabel : undefined}
                        // フォーカスはトリガーに残したままaria-activedescendantで操作するため
                        // リスト自体はタブ移動の対象にしない
                        tabIndex={-1}
                        className={cn(
                            "absolute z-50 mt-1 w-full max-h-60 overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 dark:bg-gray-700 dark:border-gray-600",
                        )}
                    >
                        {options.length === 0 && (
                            <li className="px-4 py-2 text-sm text-gray-400 dark:text-gray-500">
                                選択肢がありません
                            </li>
                        )}

                        {options.map((option, index) => {
                            const isSelected = index === selectedIndex
                            const isActive = index === activeIndex

                            return (
                                <li
                                    key={String(option.value)}
                                    id={`${baseId}-option-${index}`}
                                    role="option"
                                    aria-selected={isSelected}
                                    aria-disabled={option.disabled || undefined}
                                    // クリックでトリガーからフォーカスが外れるのを防ぐ
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => selectOption(index)}
                                    onMouseEnter={() => !option.disabled && setActiveIndex(index)}
                                    className={cn(
                                        "flex items-center justify-between px-4 py-2 text-sm",
                                        option.disabled
                                            ? "opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-500"
                                            : "cursor-pointer text-gray-700 dark:text-gray-200",
                                        isActive && !option.disabled
                                            ? "bg-gray-100 dark:bg-gray-600"
                                            : "",
                                        isSelected ? "font-semibold" : "",
                                    )}
                                >
                                    <span>{option.label}</span>
                                    {isSelected && (
                                        <svg
                                            className="w-3 h-3 flex-shrink-0"
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
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>

            {error && (
                <p
                    id={errorId}
                    role="alert"
                    className="mt-1.5 text-sm text-red-600 dark:text-red-500"
                >
                    {error}
                </p>
            )}
            {!error && helperText && (
                <p id={helperId} className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                    {helperText}
                </p>
            )}
        </div>
    )
}

Select.displayName = "Select"
