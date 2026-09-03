"use client"

import {
    KeyboardEvent,
    MouseEvent,
    ReactNode,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from "react"
import type { Size } from "@/components/base/tokens"
import { cn } from "@/lib/utils"

export interface DropdownItem<T extends string | number = string> {
    id: string | number
    label: string
    value?: T
    href?: string
    icon?: ReactNode
    disabled?: boolean
    divider?: boolean
}

export interface DropdownProps<T extends string | number = string> {
    // 基本設定
    items: DropdownItem<T>[]
    trigger?: ReactNode
    placeholder?: string

    // スタイル設定
    variant?: "default" | "outline" | "ghost"
    size?: Size
    width?: string

    // 動作設定
    closeOnSelect?: boolean
    disabled?: boolean

    // アイコン設定
    showIcon?: boolean
    icon?: ReactNode

    // イベント
    onSelect?: (item: DropdownItem<T>) => void
    onToggle?: (isOpen: boolean) => void

    // その他
    "aria-label"?: string
}

export const Dropdown = <T extends string | number>({
    items,
    trigger,
    placeholder = "Dropdown button",
    variant = "default",
    size = "md",
    width = "w-44",
    closeOnSelect = true,
    disabled = false,
    showIcon = true,
    icon,
    onSelect,
    onToggle,
    "aria-label": ariaLabel,
}: DropdownProps<T>) => {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    // キーボードでハイライト中のアイテム位置（-1はハイライト無し）
    const [focusedIndex, setFocusedIndex] = useState(-1)

    const reactId = useId()
    const menuId = `dropdown-${reactId}`

    // サイズ別スタイル
    const sizeClasses = {
        sm: {
            button: "text-xs px-3 py-1.5",
            iconSize: "w-2 h-2",
            menu: "text-xs",
        },
        md: {
            button: "text-sm px-5 py-2.5",
            iconSize: "w-2.5 h-2.5",
            menu: "text-sm",
        },
        lg: {
            button: "text-base px-6 py-3",
            iconSize: "w-3 h-3",
            menu: "text-base",
        },
    }

    // バリアント別スタイル
    const variantClasses = {
        default:
            "text-white bg-blue-700 hover:bg-blue-800 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800",
        outline:
            "text-blue-700 border border-blue-700 hover:bg-blue-50 focus:ring-blue-300 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-900 dark:focus:ring-blue-800",
        ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-300 dark:text-gray-300 dark:hover:bg-gray-600 dark:focus:ring-gray-800",
    }

    // デフォルトアイコン
    const defaultIcon = (
        <svg
            className={cn(sizeClasses[size].iconSize, "ms-3")}
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
    )

    // 区切り線を除いた、実際に選択対象となるアイテム
    const validItems = useMemo(() => items.filter((item) => !item.divider), [items])

    /**
     * 指定位置から探して、最初に見つかる選択可能なアイテムの位置を返す
     * （disabledのアイテムを飛ばし、端に到達したら反対側へ回り込む）
     */
    const findEnabledIndex = useCallback(
        (start: number, direction: 1 | -1): number => {
            const count = validItems.length
            if (count === 0) return -1

            for (let i = 0; i < count; i++) {
                const index = (start + direction * i + count * count) % count
                if (!validItems[index]?.disabled) return index
            }
            return -1
        },
        [validItems],
    )

    const closeDropdown = useCallback(
        (returnFocus = true) => {
            setIsOpen(false)
            onToggle?.(false)
            setFocusedIndex(-1)
            if (returnFocus) {
                triggerRef.current?.focus()
            }
        },
        [onToggle],
    )

    // ドロップダウンの開閉
    const toggleDropdown = () => {
        if (disabled) return

        if (isOpen) {
            closeDropdown(false)
        } else {
            setIsOpen(true)
            onToggle?.(true)
            setFocusedIndex(-1)
        }
    }

    // アイテム選択
    const handleItemSelect = (item: DropdownItem<T>, event?: MouseEvent<HTMLAnchorElement>) => {
        if (item.disabled) {
            // 無効アイテムはリンク遷移も含めて一切の動作を止める
            event?.preventDefault()
            return
        }

        if (item.href) {
            // リンクアイテムの場合はデフォルトのページ遷移を許可する
            return
        }

        event?.preventDefault()
        onSelect?.(item)

        if (closeOnSelect) {
            closeDropdown()
        }
    }

    /** ハイライト中のアイテムを実行する（キーボード操作用） */
    const activateFocusedItem = () => {
        const item = validItems[focusedIndex]
        if (!item || item.disabled) return

        if (item.href) {
            // リンクアイテムはキーボードからも遷移させる
            window.location.href = item.href
            return
        }

        onSelect?.(item)
        if (closeOnSelect) {
            closeDropdown()
        }
    }

    // キーボード操作（トリガーにフォーカスを保持したままメニューを操作する）
    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
        if (disabled) return

        switch (event.key) {
            case "Enter":
            case " ":
                event.preventDefault()
                if (isOpen && focusedIndex >= 0) {
                    activateFocusedItem()
                } else {
                    toggleDropdown()
                }
                break
            case "ArrowDown":
                event.preventDefault()
                if (!isOpen) {
                    setIsOpen(true)
                    onToggle?.(true)
                    setFocusedIndex(findEnabledIndex(0, 1))
                } else {
                    setFocusedIndex((prev) => findEnabledIndex(prev + 1, 1))
                }
                break
            case "ArrowUp":
                event.preventDefault()
                if (!isOpen) {
                    setIsOpen(true)
                    onToggle?.(true)
                    setFocusedIndex(findEnabledIndex(validItems.length - 1, -1))
                } else {
                    setFocusedIndex((prev) => findEnabledIndex(prev - 1, -1))
                }
                break
            case "Escape":
                if (isOpen) {
                    event.preventDefault()
                    closeDropdown()
                }
                break
            case "Home":
                if (isOpen) {
                    event.preventDefault()
                    setFocusedIndex(findEnabledIndex(0, 1))
                }
                break
            case "End":
                if (isOpen) {
                    event.preventDefault()
                    setFocusedIndex(findEnabledIndex(validItems.length - 1, -1))
                }
                break
            case "Tab":
                // Tabでの移動は妨げず、開いていれば閉じるだけにする
                if (isOpen) closeDropdown(false)
                break
        }
    }

    // 外部クリック検知
    useEffect(() => {
        const handleClickOutside = (event: Event) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                // クリック先の操作を妨げないためフォーカスは戻さない
                closeDropdown(false)
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isOpen, closeDropdown])

    // Escapeはメニュー内のどこにフォーカスがあっても効くようにする
    // （マウス操作等でトリガー以外へフォーカスが移った場合の保険）
    useEffect(() => {
        if (!isOpen) return

        const handleEscape = (event: globalThis.KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault()
                closeDropdown()
            }
        }

        document.addEventListener("keydown", handleEscape)
        return () => document.removeEventListener("keydown", handleEscape)
    }, [isOpen, closeDropdown])

    // ハイライト中のアイテムが見えるようにスクロールする
    useEffect(() => {
        if (!isOpen || focusedIndex < 0) return

        // dividerを含むDOM順とvalidItemsの並びはズレるため、
        // インデックスではなくIDで対象を特定する
        const targetId = validItems[focusedIndex]?.id
        if (targetId == null) return

        const focusedItem = menuRef.current?.querySelector<HTMLElement>(
            `#${CSS.escape(`${menuId}-item-${targetId}`)}`,
        )
        focusedItem?.scrollIntoView({ block: "nearest" })
    }, [focusedIndex, isOpen, validItems, menuId])

    return (
        <div ref={containerRef} className="relative inline-block text-left">
            {/* トリガーボタン */}
            {trigger ? (
                // カスタムトリガーもキーボードで操作できるようbuttonで包む
                <button
                    ref={triggerRef}
                    type="button"
                    onClick={toggleDropdown}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    aria-label={ariaLabel}
                    aria-expanded={isOpen}
                    aria-haspopup="menu"
                    aria-controls={isOpen ? menuId : undefined}
                    aria-activedescendant={
                        isOpen && focusedIndex >= 0 && validItems[focusedIndex]
                            ? `${menuId}-item-${validItems[focusedIndex].id}`
                            : undefined
                    }
                    className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {trigger}
                </button>
            ) : (
                <button
                    ref={triggerRef}
                    type="button"
                    onClick={toggleDropdown}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    aria-label={ariaLabel}
                    aria-expanded={isOpen}
                    aria-haspopup="menu"
                    aria-controls={isOpen ? menuId : undefined}
                    // ハイライト中の項目をスクリーンリーダーへ伝える（DOMフォーカスは移さない）
                    aria-activedescendant={
                        isOpen && focusedIndex >= 0 && validItems[focusedIndex]
                            ? `${menuId}-item-${validItems[focusedIndex].id}`
                            : undefined
                    }
                    className={cn(
                        "font-medium rounded-lg focus:ring-4 focus:outline-none text-center inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed",
                        variantClasses[variant],
                        sizeClasses[size].button,
                    )}
                >
                    {placeholder}
                    {showIcon && (icon || defaultIcon)}
                </button>
            )}

            {/* ドロップダウンメニュー */}
            {isOpen && (
                <div
                    ref={menuRef}
                    id={menuId}
                    role="menu"
                    aria-label={ariaLabel}
                    className={cn(
                        "absolute z-50 mt-2 bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700 rounded-lg shadow-lg dark:bg-gray-700 border border-gray-200 dark:border-gray-600",
                        width,
                    )}
                >
                    <ul
                        className={cn(
                            "py-2",
                            sizeClasses[size].menu,
                            "text-gray-700 dark:text-gray-200",
                        )}
                    >
                        {items.map((item, index) => {
                            if (item.divider) {
                                // 区切り線は操作対象ではないのでroleを打ち消す
                                return (
                                    <li key={item.id || `divider-${index}`} role="none">
                                        <hr className="my-1 border-gray-200 dark:border-gray-600" />
                                    </li>
                                )
                            }

                            const validIndex = validItems.findIndex(
                                (validItem) => validItem.id === item.id,
                            )
                            const isFocused = focusedIndex === validIndex

                            return (
                                // ulの直下の子はrole="none"にして、menuitemを直接の子として扱わせる
                                <li key={item.id} role="none">
                                    <a
                                        id={`${menuId}-item-${item.id}`}
                                        // 無効時はリンクとして機能させない（href無しのaはフォーカス不可になる）
                                        href={item.disabled ? undefined : item.href || "#"}
                                        role="menuitem"
                                        aria-disabled={item.disabled || undefined}
                                        onClick={(event) => handleItemSelect(item, event)}
                                        onMouseEnter={() =>
                                            !item.disabled && setFocusedIndex(validIndex)
                                        }
                                        // クリックでトリガーからフォーカスが外れるのを防ぐ
                                        // （キーボード操作の起点をトリガーに保つため）
                                        onMouseDown={(event) => event.preventDefault()}
                                        className={cn(
                                            "flex items-center px-4 py-2 transition-colors",
                                            item.disabled
                                                ? "opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-500"
                                                : "hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white cursor-pointer",
                                            isFocused ? "bg-gray-100 dark:bg-gray-600" : "",
                                        )}
                                        tabIndex={-1}
                                    >
                                        {item.icon && (
                                            <span className="mr-2 flex-shrink-0">{item.icon}</span>
                                        )}
                                        <span className="flex-1">{item.label}</span>
                                    </a>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            )}
        </div>
    )
}

Dropdown.displayName = "Dropdown"
