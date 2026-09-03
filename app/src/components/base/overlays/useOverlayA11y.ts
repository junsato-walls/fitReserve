"use client"

import { RefObject, useEffect, useRef } from "react"

/** フォーカストラップの対象とする、キーボード操作可能な要素のセレクタ */
const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
].join(", ")

/** 画面に描画されない要素（隠しても意味が無いので背景隠蔽の対象外にする） */
const NON_VISUAL_TAGS = ["SCRIPT", "STYLE", "LINK", "META", "TITLE", "NOSCRIPT"]

/**
 * コンテナ内の実際に操作可能な要素だけを、DOM順で取得する
 * （disabled・非表示（display:none / visibility:hidden）・aria-hidden の要素は除外する）
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
    const candidates = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))

    return candidates.filter((el) => {
        if (el.hasAttribute("disabled")) return false
        if (el.getAttribute("aria-hidden") === "true") return false

        const style = window.getComputedStyle(el)
        if (style.visibility === "hidden" || style.display === "none") return false
        // offsetParentがnullなのはdisplay:noneの祖先を持つ場合。
        // position:fixedの要素はoffsetParentが常にnullになるため個別に許可する。
        if (el.offsetParent === null && style.position !== "fixed") return false

        return true
    })
}

interface UseOverlayA11yOptions {
    /** オーバーレイが開いているか */
    open: boolean
    /** フォーカストラップ・初期フォーカスの対象となるコンテナ */
    contentRef: RefObject<HTMLElement | null>
    /** 背景を隠す際に「自分自身」を判別するための最外周要素 */
    rootRef: RefObject<HTMLElement | null>
}

/**
 * モーダル・ドロワーなど「画面に重なるUI」に共通のアクセシビリティ処理
 *
 * - 開いた時に直前のフォーカス位置を保存し、閉じた時に戻す
 * - 開いている間はフォーカスをコンテナ内に閉じ込める（Tabキー・プログラム的focus両方）
 * - 背景コンテンツを inert / aria-hidden で支援技術から隠す
 *
 * フォーカストラップだけではスクリーンリーダーの仮想カーソルが背景を読めてしまうため、
 * 背景の隠蔽まで含めて1つの責務として扱う。
 */
export function useOverlayA11y({ open, contentRef, rootRef }: UseOverlayA11yOptions) {
    // 開く直前にフォーカスされていた要素（閉じた時にここへフォーカスを戻す）
    const previousActiveElementRef = useRef<HTMLElement | null>(null)

    // 背景コンテンツを支援技術から隠す
    useEffect(() => {
        if (!open) return

        const overlayRoot = rootRef.current
        if (!overlayRoot) return

        const parent = overlayRoot.parentElement
        if (!parent) return

        // 元の属性値を控えておき、閉じる時に正確に復元する
        const changed: {
            el: HTMLElement
            hadInert: boolean
            prevAriaHidden: string | null
        }[] = []

        Array.from(parent.children).forEach((child) => {
            if (child === overlayRoot) return
            if (!(child instanceof HTMLElement)) return
            if (NON_VISUAL_TAGS.includes(child.tagName)) return
            // 既に他のオーバーレイが隠している要素は触らない（多重表示時の復元崩れを防ぐ）
            if (child.hasAttribute("data-overlay-hidden")) return

            changed.push({
                el: child,
                hadInert: child.hasAttribute("inert"),
                prevAriaHidden: child.getAttribute("aria-hidden"),
            })

            child.setAttribute("data-overlay-hidden", "")
            child.setAttribute("inert", "")
            // inert未対応ブラウザ向けのフォールバック
            child.setAttribute("aria-hidden", "true")
        })

        return () => {
            changed.forEach(({ el, hadInert, prevAriaHidden }) => {
                el.removeAttribute("data-overlay-hidden")
                if (!hadInert) el.removeAttribute("inert")
                if (prevAriaHidden === null) {
                    el.removeAttribute("aria-hidden")
                } else {
                    el.setAttribute("aria-hidden", prevAriaHidden)
                }
            })
        }
    }, [open, rootRef])

    // フォーカスの保存・初期フォーカス・復帰
    useEffect(() => {
        if (!open) return

        previousActiveElementRef.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null

        // createPortalでの描画がコミットされた後にフォーカスするため次のタスクまで待つ
        const focusTimer = window.setTimeout(() => {
            const container = contentRef.current
            if (!container) return
            const [first] = getFocusableElements(container)
            ;(first ?? container).focus()
        }, 0)

        return () => {
            window.clearTimeout(focusTimer)
            const previous = previousActiveElementRef.current
            if (previous && document.contains(previous)) {
                previous.focus()
            }
        }
    }, [open, contentRef])

    // フォーカストラップ: 開いている間はTabキーで外に出さない
    useEffect(() => {
        if (!open) return

        const handleKeyDown = (event: globalThis.KeyboardEvent) => {
            if (event.key !== "Tab") return

            const container = contentRef.current
            if (!container) return

            const focusable = getFocusableElements(container)
            if (focusable.length === 0) {
                event.preventDefault()
                container.focus()
                return
            }

            const first = focusable[0]
            const last = focusable[focusable.length - 1]
            const active = document.activeElement

            if (event.shiftKey) {
                if (active === first || !container.contains(active)) {
                    event.preventDefault()
                    last.focus()
                }
            } else {
                if (active === last || !container.contains(active)) {
                    event.preventDefault()
                    first.focus()
                }
            }
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [open, contentRef])

    // フォーカストラップの保険: Tabキー以外の経路（プログラム的なfocus()等）で
    // フォーカスが外に出た場合、コンテナ内へ引き戻す
    useEffect(() => {
        if (!open) return

        const handleFocusIn = (event: FocusEvent) => {
            const container = contentRef.current
            if (!container) return

            const target = event.target
            if (target instanceof Node && !container.contains(target)) {
                const [first] = getFocusableElements(container)
                ;(first ?? container).focus()
            }
        }

        document.addEventListener("focusin", handleFocusIn)
        return () => document.removeEventListener("focusin", handleFocusIn)
    }, [open, contentRef])
}
