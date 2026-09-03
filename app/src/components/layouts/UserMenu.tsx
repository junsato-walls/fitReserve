"use client"

import { LogOut, Settings } from "lucide-react"
import { logout } from "@/api/Auth"
import { useCallback, useEffect, useRef, useState } from "react"
import { Avatar } from "@/components/base/display/Avatar"
import { getFocusableElements } from "@/components/base/overlays/useOverlayA11y"
import { ThemeToggle } from "./ThemeToggle"

interface UserMenuProps {
    /** 表示名。未取得のときは既定値を出す */
    userName?: string
    /** 社員ID。ユーザー名の下に補助表示する */
    personalId?: string
    /** アバター画像のURL。無ければ名前のイニシャルを表示する */
    avatarSrc?: string
}

/**
 * ヘッダー右上のユーザーメニュー
 *
 * アバターボタンを押すとメニューが開く。
 * ログアウト以外の項目の処理は未実装。
 */
export const UserMenu = ({ userName = "ゲスト", personalId, avatarSrc }: UserMenuProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)

    /** 閉じる。キーボード操作のためトリガーへフォーカスを戻す */
    const close = useCallback((returnFocus = true) => {
        setIsOpen(false)
        if (returnFocus) triggerRef.current?.focus()
    }, [])

    // 外側クリックで閉じる
    useEffect(() => {
        if (!isOpen) return

        const onPointerDown = (event: PointerEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                close(false)
            }
        }
        document.addEventListener("pointerdown", onPointerDown)
        return () => document.removeEventListener("pointerdown", onPointerDown)
    }, [isOpen, close])

    // Escapeで閉じ、上下キーでメニュー内を移動する
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Escape") {
            event.stopPropagation()
            close()
            return
        }

        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
        if (!panelRef.current) return

        event.preventDefault()
        const items = getFocusableElements(panelRef.current)
        if (items.length === 0) return

        const current = items.indexOf(document.activeElement as HTMLElement)
        const step = event.key === "ArrowDown" ? 1 : -1
        // 端で折り返す。current が -1（メニュー外）のときは先頭/末尾から始める
        const next = (current + step + items.length) % items.length
        items[next].focus()
    }

    // 開いた直後は先頭の項目にフォーカスを移す
    useEffect(() => {
        if (!isOpen || !panelRef.current) return
        getFocusableElements(panelRef.current)[0]?.focus()
    }, [isOpen])

    const itemClasses =
        "flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"

    return (
        <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-haspopup="true"
                aria-expanded={isOpen}
                aria-label="アカウントメニュー"
                className="rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-800"
            >
                <Avatar src={avatarSrc} name={userName} size="sm" shape="circle" />
            </button>

            {isOpen && (
                <div
                    ref={panelRef}
                    aria-label="アカウントメニュー"
                    className="absolute right-0 mt-2 w-72 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-50"
                >
                    {/* ユーザー情報 */}
                    <div className="flex items-center gap-3 px-4 py-3">
                        <Avatar src={avatarSrc} name={userName} size="lg" shape="circle" />
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {userName}
                            </p>
                            {personalId && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    @{personalId}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* 設定 */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                        <button type="button" className={itemClasses}>
                            <Settings className="w-5 h-5" aria-hidden="true" />
                            設定
                        </button>
                    </div>

                    {/* 表示テーマ */}
                    <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-3 px-4 pb-1">
                        <ThemeToggle />
                    </div>

                    {/* ログアウト */}
                    <div className="border-t border-gray-200 dark:border-gray-700 mt-3 pt-2">
                        <button
                            type="button"
                            className={itemClasses}
                            // Cookieはサーバー側(httpOnly)にあるため、Server Actionで削除する
                            onClick={() => logout()}
                        >
                            <LogOut className="w-5 h-5" aria-hidden="true" />
                            ログアウト
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
