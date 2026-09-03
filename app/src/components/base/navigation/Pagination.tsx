"use client"

import { ReactNode } from "react"
import type { Size } from "@/components/base/tokens"
import { cn } from "@/lib/utils"

export interface PaginationProps {
    // ページ設定
    currentPage: number
    totalPages: number

    // 表示設定
    size?: Size
    showPrevNext?: boolean
    showFirstLast?: boolean
    siblingCount?: number // 現在ページの前後に表示するページ数
    boundaryCount?: number // 最初と最後に表示するページ数

    // テキスト設定
    previousText?: string
    nextText?: string
    firstText?: string
    lastText?: string

    // アイコン設定
    previousIcon?: ReactNode
    nextIcon?: ReactNode
    firstIcon?: ReactNode
    lastIcon?: ReactNode

    // イベント
    onPageChange?: (page: number) => void

    // URL生成（Next.js等で使用）
    href?: (page: number) => string

    // その他
    disabled?: boolean
}

export const Pagination = ({
    currentPage,
    totalPages,
    size = "md",
    showPrevNext = true,
    showFirstLast = false,
    siblingCount = 1,
    boundaryCount = 1,
    previousText = "Previous",
    nextText = "Next",
    firstText = "First",
    lastText = "Last",
    previousIcon,
    nextIcon,
    firstIcon,
    lastIcon,
    onPageChange,
    href,
    disabled = false,
}: PaginationProps) => {
    // サイズ別スタイル
    const sizeClasses = {
        sm: {
            container: "text-sm",
            item: "px-3 h-8",
            text: "text-sm",
        },
        md: {
            container: "text-sm",
            item: "px-3 h-8",
            text: "text-sm",
        },
        lg: {
            container: "text-base h-10",
            item: "px-4 h-10",
            text: "text-base",
        },
    }

    // ページ番号の配列を生成
    const generatePageNumbers = (): (number | "ellipsis")[] => {
        const pages: (number | "ellipsis")[] = []

        // 最初のページ群
        for (let i = 1; i <= Math.min(boundaryCount, totalPages); i++) {
            pages.push(i)
        }

        // 現在ページ周辺の計算
        const startPage = Math.max(currentPage - siblingCount, boundaryCount + 1)
        const endPage = Math.min(currentPage + siblingCount, totalPages - boundaryCount)

        // 最初のページ群と現在ページ群の間に省略記号が必要か
        if (startPage > boundaryCount + 1) {
            if (startPage > boundaryCount + 2) {
                pages.push("ellipsis")
            }
        }

        // 現在ページ周辺のページ群
        for (let i = startPage; i <= endPage; i++) {
            if (i > boundaryCount && i <= totalPages - boundaryCount) {
                pages.push(i)
            }
        }

        // 現在ページ群と最後のページ群の間に省略記号が必要か
        if (endPage < totalPages - boundaryCount) {
            if (endPage < totalPages - boundaryCount - 1) {
                pages.push("ellipsis")
            }
        }

        // 最後のページ群
        for (
            let i = Math.max(totalPages - boundaryCount + 1, boundaryCount + 1);
            i <= totalPages;
            i++
        ) {
            if (!pages.includes(i)) {
                pages.push(i)
            }
        }

        return pages.filter(
            (page, index, array) => array.indexOf(page) === index, // 重複除去
        )
    }

    // ページクリック処理
    const handlePageClick = (page: number) => {
        if (disabled || page === currentPage || page < 1 || page > totalPages) return
        onPageChange?.(page)
    }

    // ページアイテムのレンダリング
    const renderPageItem = (
        page: number | "ellipsis" | "prev" | "next" | "first" | "last",
        content: ReactNode,
        isActive = false,
        isDisabled = false,
        position?: "first" | "last" | "middle",
    ) => {
        const baseClasses = `
      flex items-center justify-center leading-tight transition-colors
      ${sizeClasses[size].item}
    `

        const positionClasses = {
            first: "ms-0 border border-e-0 border-gray-300 dark:border-gray-600 rounded-s-lg",
            last: "border border-gray-300 dark:border-gray-600 rounded-e-lg",
            middle: "border border-gray-300 dark:border-gray-600",
        }

        const stateClasses = isActive
            ? "text-blue-600 border-gray-300 bg-blue-50 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-400 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
            : isDisabled
              ? "text-gray-300 bg-gray-100 border-gray-300 cursor-not-allowed dark:bg-gray-600 dark:border-gray-700 dark:text-gray-500"
              : "text-gray-500 bg-white border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"

        const finalClasses = `
      ${baseClasses}
      ${position ? positionClasses[position] : positionClasses.middle}
      ${stateClasses}
    `

        if (page === "ellipsis") {
            return (
                <li key={`ellipsis-${Math.random()}`}>
                    <span className={finalClasses}>...</span>
                </li>
            )
        }

        const pageNumber =
            typeof page === "number"
                ? page
                : page === "prev"
                  ? currentPage - 1
                  : page === "next"
                    ? currentPage + 1
                    : page === "first"
                      ? 1
                      : page === "last"
                        ? totalPages
                        : currentPage

        const itemHref = href ? href(pageNumber) : "#"

        return (
            <li key={page}>
                <a
                    href={itemHref}
                    onClick={(e) => {
                        if (!href) e.preventDefault()
                        handlePageClick(pageNumber)
                    }}
                    className={finalClasses}
                    aria-current={isActive ? "page" : undefined}
                    aria-disabled={isDisabled}
                >
                    {content}
                </a>
            </li>
        )
    }

    if (totalPages <= 1) return null

    const pages = generatePageNumbers()
    const isFirstPage = currentPage === 1
    const isLastPage = currentPage === totalPages

    return (
        <nav aria-label="Page navigation">
            <ul className={cn("inline-flex -space-x-px", sizeClasses[size].container)}>
                {/* First ボタン */}
                {showFirstLast &&
                    renderPageItem(
                        "first",
                        firstIcon || firstText,
                        false,
                        disabled || isFirstPage,
                        "first",
                    )}

                {/* Previous ボタン */}
                {showPrevNext &&
                    renderPageItem(
                        "prev",
                        previousIcon || previousText,
                        false,
                        disabled || isFirstPage,
                        showFirstLast ? "middle" : "first",
                    )}

                {/* ページ番号 */}
                {pages.map((page) => {
                    if (page === "ellipsis") {
                        return renderPageItem(page, "...", false, true)
                    }

                    const pageNum = page as number
                    const isActive = pageNum === currentPage

                    return renderPageItem(pageNum, pageNum.toString(), isActive, disabled)
                })}

                {/* Next ボタン */}
                {showPrevNext &&
                    renderPageItem(
                        "next",
                        nextIcon || nextText,
                        false,
                        disabled || isLastPage,
                        showFirstLast ? "middle" : "last",
                    )}

                {/* Last ボタン */}
                {showFirstLast &&
                    renderPageItem(
                        "last",
                        lastIcon || lastText,
                        false,
                        disabled || isLastPage,
                        "last",
                    )}
            </ul>
        </nav>
    )
}
