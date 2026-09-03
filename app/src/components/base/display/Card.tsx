"use client"

import Image from "next/image"
import { forwardRef, ReactNode } from "react"
import type { Size } from "@/components/base/tokens"
import { cn } from "@/lib/utils"

export interface CardProps {
    // 基本設定
    children: ReactNode
    title?: string
    description?: string

    // ヘッダー設定
    /** タイトル左に置くアイコン */
    titleIcon?: ReactNode
    /** タイトルの大きさ。統計値を見せるカードは 'sm' を使う */
    titleSize?: "sm" | "md" | "lg"
    /** タイトルの寄せ。中央寄せはログイン画面などの単独カードで使う */
    titleAlign?: "left" | "center"
    /** タイトル右端に置く操作（ボタンやステータス表示） */
    headerActions?: ReactNode

    // リンク設定
    href?: string
    clickable?: boolean

    // スタイル設定
    variant?: "default" | "outlined" | "elevated" | "filled"
    size?: Size
    rounded?: "sm" | "md" | "lg" | "xl"

    // レイアウト設定
    padding?: "none" | "sm" | "md" | "lg"
    maxWidth?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "4xl"
    /** 最大幅を指定したときに左右中央へ寄せる */
    center?: boolean
    /** 親の高さいっぱいに広げる（カードを横並びにして高さを揃える用途） */
    fullHeight?: boolean

    // 画像設定
    image?: string
    imageAlt?: string
    imagePosition?: "top" | "bottom" | "left" | "right"
    imageWidth?: number
    imageHeight?: number

    // Next.js Image props
    priority?: boolean
    quality?: number
    placeholder?: "blur" | "empty"
    blurDataURL?: string
    fill?: boolean

    // イベント
    onClick?: () => void
    onMouseEnter?: () => void
    onMouseLeave?: () => void

    // その他
    as?: "div" | "a" | "article" | "section"
    target?: "_blank" | "_self" | "_parent" | "_top"
}

export const Card = forwardRef<HTMLElement, CardProps>(
    (
        {
            children,
            title,
            description,
            titleIcon,
            titleSize = "md",
            titleAlign = "left",
            headerActions,
            href,
            clickable = false,
            variant = "default",
            size = "md",
            rounded = "lg",
            padding = "md",
            // 既定は幅を制限しない。ページ内のセクションとして使うのが最も多いため
            maxWidth = "none",
            center = false,
            fullHeight = false,
            image,
            imageAlt,
            imagePosition = "top",
            imageWidth = 400,
            imageHeight = 200,
            priority = false,
            quality = 75,
            placeholder = "empty",
            blurDataURL,
            fill = false,
            onClick,
            onMouseEnter,
            onMouseLeave,
            as = "div",
            target = "_self",
        },
        ref,
    ) => {
        // バリアント別スタイル
        const getVariantClasses = () => {
            const variants = {
                default:
                    "bg-white border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700",
                outlined: "bg-white border-2 border-gray-300 dark:bg-gray-800 dark:border-gray-600",
                elevated:
                    "bg-white shadow-md dark:bg-gray-800 border border-gray-100 dark:border-gray-700",
                filled: "bg-gray-50 dark:bg-gray-700",
            } as const

            // ホバー効果はクリックできるカードにだけ付ける
            // （押せないカードが反応すると押せるように見えてしまうため）
            const hoverVariants = {
                default: "hover:bg-gray-100 dark:hover:bg-gray-700",
                outlined: "hover:border-gray-400 dark:hover:border-gray-500",
                elevated: "hover:shadow-lg",
                filled: "hover:bg-gray-100 dark:hover:bg-gray-600",
            } as const

            return isClickable
                ? `${variants[variant]} ${hoverVariants[variant]}`
                : variants[variant]
        }

        // サイズ別スタイル
        const getSizeClasses = () => {
            if (padding === "none") return ""

            const sizes = {
                sm: {
                    none: "",
                    sm: "p-3",
                    md: "p-4",
                    lg: "p-5",
                },
                md: {
                    none: "",
                    sm: "p-4",
                    md: "p-6",
                    lg: "p-8",
                },
                lg: {
                    none: "",
                    sm: "p-6",
                    md: "p-8",
                    lg: "p-10",
                },
            } as const

            return sizes[size][padding]
        }

        // タイトルの大きさ
        const titleSizeClasses = {
            sm: "text-sm font-medium text-gray-500 dark:text-gray-400",
            md: "text-lg font-semibold text-gray-900 dark:text-white",
            lg: "text-2xl font-bold text-gray-900 dark:text-white",
        } as const

        // 角丸クラス
        const getRoundedClasses = () => {
            const roundedClasses = {
                sm: "rounded-sm",
                md: "rounded-md",
                lg: "rounded-lg",
                xl: "rounded-xl",
            } as const

            return roundedClasses[rounded]
        }

        // 最大幅クラス
        const getMaxWidthClasses = () => {
            if (maxWidth === "none") return ""

            const maxWidthClasses = {
                xs: "max-w-xs",
                sm: "max-w-sm",
                md: "max-w-md",
                lg: "max-w-lg",
                xl: "max-w-xl",
                "2xl": "max-w-2xl",
                "4xl": "max-w-4xl",
            } as const

            return maxWidthClasses[maxWidth]
        }

        // クリック可能かどうか
        const isClickable = href || onClick || clickable
        const isLink = href && as === "div"

        // 基本クラス
        const baseClasses = cn(
            "block",
            getVariantClasses(),
            getRoundedClasses(),
            getMaxWidthClasses(),
            center && "mx-auto",
            fullHeight && "h-full",
            isClickable && "transition-all duration-200 cursor-pointer",
        )

        // 画像要素
        const imageElement = image && (
            <div
                className={`
            overflow-hidden relative
            ${imagePosition === "top" ? `${getRoundedClasses()} rounded-b-none` : ""}
            ${imagePosition === "bottom" ? `${getRoundedClasses()} rounded-t-none` : ""}
            ${imagePosition === "left" ? `${getRoundedClasses()} rounded-r-none` : ""}
            ${imagePosition === "right" ? `${getRoundedClasses()} rounded-l-none` : ""}
            ${imagePosition === "top" || imagePosition === "bottom" ? "h-48" : ""}
            ${imagePosition === "left" || imagePosition === "right" ? "w-48 min-w-[12rem]" : ""}
        `}
            >
                {fill ? (
                    <Image
                        src={image}
                        alt={imageAlt || ""}
                        fill
                        priority={priority}
                        quality={quality}
                        placeholder={placeholder}
                        blurDataURL={blurDataURL}
                        className="object-cover"
                    />
                ) : (
                    <Image
                        src={image}
                        alt={imageAlt || ""}
                        width={imageWidth}
                        height={imageHeight}
                        priority={priority}
                        quality={quality}
                        placeholder={placeholder}
                        blurDataURL={blurDataURL}
                        className="w-full h-full object-cover"
                    />
                )}
            </div>
        )

        // コンテンツ要素
        const contentElement = (
            <div
                className={cn(
                    getSizeClasses(),
                    imagePosition === "left" || imagePosition === "right" ? "flex-1" : "",
                )}
            >
                {(title || headerActions) && (
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div
                            className={cn(
                                "min-w-0",
                                titleAlign === "center" ? "flex-1 text-center" : "",
                            )}
                        >
                            {title && (
                                <h5
                                    className={cn(
                                        "flex items-center gap-2 tracking-tight",
                                        titleAlign === "center" ? "justify-center" : "",
                                        titleSizeClasses[titleSize],
                                    )}
                                >
                                    {titleIcon}
                                    {title}
                                </h5>
                            )}
                            {description && (
                                <p className="mt-1 font-normal text-gray-700 dark:text-gray-400">
                                    {description}
                                </p>
                            )}
                        </div>
                        {headerActions && (
                            <div className="flex shrink-0 items-center gap-2">{headerActions}</div>
                        )}
                    </div>
                )}
                {/* タイトルが無く説明だけ渡された場合 */}
                {!title && !headerActions && description && (
                    <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                        {description}
                    </p>
                )}
                {children}
            </div>
        )

        // レイアウト調整
        const cardContent = (
            <>
                {imagePosition === "top" && imageElement}
                {(imagePosition === "left" || imagePosition === "right") && (
                    <div
                        className={cn(
                            "flex",
                            imagePosition === "left" ? "flex-row" : "flex-row-reverse",
                        )}
                    >
                        {imageElement}
                        {contentElement}
                    </div>
                )}
                {(imagePosition === "top" || imagePosition === "bottom" || !image) &&
                    imagePosition !== "left" &&
                    imagePosition !== "right" &&
                    contentElement}
                {imagePosition === "bottom" && imageElement}
            </>
        )

        // aタグとして使用する場合
        if (isLink || as === "a") {
            return (
                <a
                    ref={ref as React.Ref<HTMLAnchorElement>}
                    href={href}
                    target={target}
                    onClick={onClick}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    className={baseClasses}
                >
                    {cardContent}
                </a>
            )
        }

        // articleとして使用する場合
        if (as === "article") {
            return (
                <article
                    ref={ref as React.Ref<HTMLElement>}
                    onClick={onClick}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    className={baseClasses}
                >
                    {cardContent}
                </article>
            )
        }

        // sectionとして使用する場合
        if (as === "section") {
            return (
                <section
                    ref={ref as React.Ref<HTMLElement>}
                    onClick={onClick}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    className={baseClasses}
                >
                    {cardContent}
                </section>
            )
        }

        // デフォルトはdiv
        return (
            <div
                ref={ref as React.Ref<HTMLDivElement>}
                onClick={onClick}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                className={baseClasses}
            >
                {cardContent}
            </div>
        )
    },
)

Card.displayName = "Card"
