"use client"

import { forwardRef, ReactNode, useCallback, useEffect, useImperativeHandle, useRef } from "react"
import { createPortal } from "react-dom"
import { useOverlayA11y } from "./useOverlayA11y"
import { BUTTON_PRESS, buttonToneClasses } from "@/components/base/buttons/styles"
import { Z_INDEX, type Tone, type Variant } from "@/components/base/tokens"
import { cn } from "@/lib/utils"

export interface ModalAction {
    id: string
    label: ReactNode
    onClick?: () => void
    /** 用途を表す色 */
    tone?: Tone
    /** 見た目の型 */
    variant?: Variant
    disabled?: boolean
    loading?: boolean
}

export interface ModalProps {
    // 表示制御
    open?: boolean
    /** 開閉状態の変更通知。閉じるときは false が渡る（Drawer と同じ形） */
    onOpenChange?: (open: boolean) => void

    // コンテンツ設定
    title?: ReactNode
    children?: ReactNode
    actions?: ModalAction[]

    // サイズ設定
    size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full"
    maxHeight?: string
    /**
     * 画面いっぱいに表示する（余白・角丸・最大幅を無くす）
     * スマートフォンのメニューなど、画面を占有するUIで使う。size より優先される。
     */
    fullScreen?: boolean

    // 動作設定
    closeOnOverlayClick?: boolean
    closeOnEscape?: boolean
    preventBodyScroll?: boolean
    destroyOnClose?: boolean
    showCloseButton?: boolean

    // スタイル設定
    /** 内容が長いときに本文だけをスクロールさせる（画面の高さを超えないようにする） */
    scrollableBody?: boolean
    backdropBlur?: boolean

    // その他
    id?: string
    "aria-labelledby"?: string
    "aria-describedby"?: string
    portal?: boolean
    portalContainer?: Element
    zIndex?: number
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
    (
        {
            open = false,
            onOpenChange,
            title,
            children,
            actions = [],
            size = "md",
            maxHeight = "max-h-full",
            fullScreen = false,
            closeOnOverlayClick = true,
            closeOnEscape = true,
            preventBodyScroll = true,
            destroyOnClose = false,
            showCloseButton = true,
            scrollableBody = false,
            backdropBlur = false,
            id = "modal",
            "aria-labelledby": ariaLabelledby,
            "aria-describedby": ariaDescribedby,
            portal = true,
            portalContainer,
            zIndex = Z_INDEX.overlay,
        },
        ref,
    ) => {
        // モーダル本体（フォーカストラップ・初期フォーカスの対象）への内部ref。
        // 外部からのref（forwardRef）はuseImperativeHandleでこれと同期させる。
        const contentRef = useRef<HTMLDivElement>(null)
        useImperativeHandle(ref, () => contentRef.current as HTMLDivElement, [])

        // 最外周のオーバーレイ（背景を隠す際に「モーダル自身」を判別するために使う）
        const overlayRef = useRef<HTMLDivElement>(null)

        // クローズハンドラー
        const handleClose = useCallback(() => {
            onOpenChange?.(false)
        }, [onOpenChange])

        // ESCキーでクローズ
        useEffect(() => {
            if (!open || !closeOnEscape) return

            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.key === "Escape") {
                    handleClose()
                }
            }

            document.addEventListener("keydown", handleKeyDown)
            return () => document.removeEventListener("keydown", handleKeyDown)
        }, [open, closeOnEscape, handleClose])

        // フォーカストラップ・フォーカス復帰・背景の隠蔽（Drawerと共通）
        useOverlayA11y({ open, contentRef, rootRef: overlayRef })

        // ボディスクロール制御
        useEffect(() => {
            if (!preventBodyScroll) return

            if (open) {
                document.body.style.overflow = "hidden"
            } else {
                document.body.style.overflow = ""
            }

            return () => {
                document.body.style.overflow = ""
            }
        }, [open, preventBodyScroll])

        // オーバーレイクリックハンドラー
        const handleOverlayClick = useCallback(
            (event: React.MouseEvent) => {
                if (closeOnOverlayClick && event.target === event.currentTarget) {
                    handleClose()
                }
            },
            [closeOnOverlayClick, handleClose],
        )

        // サイズ別のスタイル
        const getSizeStyles = () => {
            switch (size) {
                case "xs":
                    return "max-w-xs"
                case "sm":
                    return "max-w-sm"
                case "lg":
                    return "max-w-4xl"
                case "xl":
                    return "max-w-5xl"
                case "2xl":
                    return "max-w-6xl"
                case "3xl":
                    return "max-w-7xl"
                case "4xl":
                    return "max-w-screen-xl"
                case "5xl":
                    return "max-w-screen-2xl"
                case "full":
                    return "max-w-full mx-4"
                default: // 'md'
                    return "max-w-2xl"
            }
        }

        const sizeStyles = getSizeStyles()

        // 非表示時かつdestroyOnCloseがtrueの場合は何もレンダリングしない
        if (!open && destroyOnClose) {
            return null
        }

        // 非表示時は何もレンダリングしない
        if (!open) {
            return null
        }

        const modalContent = (
            <div
                ref={overlayRef}
                className={cn(
                    "fixed top-0 right-0 left-0",
                    "flex justify-center items-center w-full md:inset-0",
                    fullScreen ? "bottom-0 h-full" : "h-[calc(100%-1rem)]",
                    "overflow-y-auto overflow-x-hidden bg-black bg-opacity-50",
                    backdropBlur ? "backdrop-blur-sm" : "",
                    "transition-opacity duration-200",
                )}
                // 重なり順はクラス名ではなくstyleで指定する。
                // Tailwindは `z-${zIndex}` のような動的なクラス名を生成できないため、
                // クラスで書くと重なり順が丸ごと効かなくなる
                style={{ zIndex }}
                onClick={handleOverlayClick}
                aria-hidden="false"
                role="dialog"
                aria-modal="true"
            >
                <div
                    className={
                        fullScreen
                            ? "relative w-full h-full max-w-full"
                            : `relative p-4 w-full ${sizeStyles} ${maxHeight}`
                    }
                >
                    {/* モーダルコンテンツ */}
                    <div
                        ref={contentRef}
                        id={id}
                        // 中に操作可能な要素が無い場合でもcontainer.focus()できるようにする
                        // （tabIndexに含めない値なのでTab移動の対象にはならない）
                        tabIndex={-1}
                        className={cn(
                            "relative bg-white shadow-sm dark:bg-gray-700",
                            fullScreen ? "flex flex-col h-full rounded-none" : "rounded-lg",
                            "transform transition-all duration-200",
                        )}
                        onClick={(e) => e.stopPropagation()}
                        aria-labelledby={ariaLabelledby || (title ? `${id}-title` : undefined)}
                        aria-describedby={ariaDescribedby}
                    >
                        {/* モーダルヘッダー */}
                        {(title || showCloseButton) && (
                            <div
                                className={cn(
                                    "flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200",
                                )}
                            >
                                {title && (
                                    <h3
                                        id={ariaLabelledby || `${id}-title`}
                                        className="text-xl font-semibold text-gray-900 dark:text-white"
                                    >
                                        {title}
                                    </h3>
                                )}

                                {showCloseButton && (
                                    <button
                                        type="button"
                                        className="text-gray-400 dark:text-gray-500 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                                        onClick={handleClose}
                                        aria-label="Close modal"
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
                                        <span className="sr-only">Close modal</span>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* モーダルボディ */}
                        <div
                            className={cn(
                                "p-4 md:p-5 space-y-4",
                                fullScreen ? "flex-1 overflow-y-auto" : "",
                                scrollableBody ? "max-h-[70vh] overflow-y-auto" : "",
                            )}
                        >
                            {children}
                        </div>

                        {/* モーダルフッター */}
                        {actions.length > 0 && (
                            <div
                                className={cn(
                                    "flex items-center p-4 md:p-5 border-t border-gray-200 dark:border-gray-700 rounded-b dark:border-gray-600",
                                )}
                            >
                                {actions.map((action, index) => {
                                    // 配色はボタン系と同じ表を使う（同じ tone で色が変わらないように）
                                    const actionClasses = cn(
                                        "inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-lg focus:outline-none transition-colors",
                                        index > 0 && "ms-3",
                                        buttonToneClasses(
                                            action.tone ?? "neutral",
                                            action.variant ?? "outlined",
                                        ),
                                        BUTTON_PRESS,
                                    )

                                    return (
                                        <button
                                            key={action.id}
                                            type="button"
                                            className={cn(
                                                actionClasses,
                                                (action.disabled || action.loading) &&
                                                    "opacity-50 cursor-not-allowed",
                                            )}
                                            onClick={action.onClick}
                                            disabled={action.disabled || action.loading}
                                        >
                                            {action.loading && (
                                                <svg
                                                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                    ></circle>
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    ></path>
                                                </svg>
                                            )}
                                            {action.label}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )

        // ポータルを使用する場合
        if (portal && typeof document !== "undefined") {
            const container = portalContainer || document.body
            return createPortal(modalContent, container)
        }

        // 通常のレンダリング
        return modalContent
    },
)

Modal.displayName = "Modal"
