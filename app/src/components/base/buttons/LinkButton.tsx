"use client"

import { AnchorHTMLAttributes, forwardRef, ReactNode } from "react"
import {
    BUTTON_PRESS,
    buttonTextClasses,
    buttonToneClasses,
} from "@/components/base/buttons/styles"
import type { Size, Tone, Variant } from "@/components/base/tokens"
import { cn } from "@/lib/utils"

export interface LinkButtonProps extends Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    "className"
> {
    // 表示内容
    children: ReactNode

    // スタイル
    /** 用途を表す色 */
    tone?: Tone
    /** 見た目の型（塗り・枠線・透明） */
    variant?: Variant
    size?: Size
    /** 下線付きのテキストリンクとして表示する（ボタンの見た目にしない） */
    underline?: boolean
    fullWidth?: boolean

    // 状態
    disabled?: boolean

    // リンク設定
    href: string
    target?: "_blank" | "_self" | "_parent" | "_top"
    external?: boolean // 外部リンクの場合、自動的にtarget="_blank"とrel="noopener noreferrer"を設定

    // その他
}

export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
    (
        {
            children,
            tone = "info",
            variant = "filled",
            size = "md",
            underline = false,
            fullWidth = false,
            disabled = false,
            href,
            target,
            external = false,
            ...props
        },
        ref,
    ) => {
        // サイズ別スタイル
        const sizeClasses = {
            sm: underline ? "text-xs" : "text-xs px-3 py-1.5",
            md: underline ? "text-sm" : "text-sm px-5 py-2.5",
            lg: underline ? "text-base" : "text-base px-6 py-3",
        }

        // 外部リンクの場合の設定
        const linkTarget = external ? "_blank" : target
        const linkRel = external ? "noopener noreferrer" : props.rel

        // 無効化時のスタイル
        const disabledClasses = disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""

        const finalClassName = cn(
            "font-medium transition-colors",
            underline
                ? "hover:underline"
                : "rounded-lg focus:outline-none inline-block text-center",
            // 下線リンクでは背景を持たせない
            underline ? buttonTextClasses(tone) : buttonToneClasses(tone, variant),
            !underline && BUTTON_PRESS,
            sizeClasses[size],
            fullWidth && "w-full",
            disabledClasses,
        )

        return (
            <a
                ref={ref}
                href={disabled ? undefined : href}
                target={linkTarget}
                rel={linkRel}
                className={finalClassName}
                aria-disabled={disabled}
                {...props}
            >
                {children}
            </a>
        )
    },
)

LinkButton.displayName = "LinkButton"
