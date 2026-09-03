import {
    ButtonHTMLAttributes,
    cloneElement,
    isValidElement,
    MouseEvent,
    ReactElement,
    ReactNode,
} from "react"
import { BUTTON_PRESS, buttonToneClasses } from "@/components/base/buttons/styles"
import type { Size, Tone, Variant } from "@/components/base/tokens"
import { cn } from "@/lib/utils"

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
    icon: ReactNode
    /** 用途を表す色 */
    tone?: Tone
    /** 見た目の型（塗り・枠線・透明） */
    variant?: Variant
    size?: Size
    shape?: "square" | "rounded"
    srLabel: string // アクセシビリティ用のラベル
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void
    onMouseEnter?: (event: MouseEvent<HTMLButtonElement>) => void
    onMouseLeave?: (event: MouseEvent<HTMLButtonElement>) => void
    onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void
    onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void
}

export const IconButton = ({
    icon,
    tone = "info",
    variant = "filled",
    size = "md",
    shape = "square",
    srLabel,
    disabled,
    onClick,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    ...props
}: IconButtonProps) => {
    // サイズ別のスタイル
    const sizeStyles = {
        sm: "p-2 text-sm",
        md: "p-2.5 text-sm",
        lg: "p-3 text-base",
    }

    // アイコンサイズ
    const iconSizeClasses = {
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-6 h-6",
    }

    // 形状別のスタイル
    const shapeStyles = {
        square: "rounded-lg",
        rounded: "rounded-full",
    }

    const finalClassName = cn(
        "font-medium text-center inline-flex items-center justify-center transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed me-2",
        buttonToneClasses(tone, variant),
        BUTTON_PRESS,
        sizeStyles[size],
        shapeStyles[shape],
    )

    // アイコンにサイズクラスを追加
    const renderIconWithSize = (iconElement: ReactNode) => {
        if (!iconElement) return null

        // ReactElementの場合、cloneElementを使用
        if (isValidElement(iconElement)) {
            // ReactElementとして型キャスト
            const element = iconElement as ReactElement<{ className?: string }>

            // アイコンの大きさはボタンの size に従わせる
            return cloneElement(element, {
                ...element.props,
                className: iconSizeClasses[size],
            })
        }

        // SVG要素を直接受け取った場合
        return (
            <span className={cn(iconSizeClasses[size], "inline-block")} aria-hidden="true">
                {iconElement}
            </span>
        )
    }

    return (
        <button
            type="button"
            className={finalClassName}
            disabled={disabled}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onFocus={onFocus}
            onBlur={onBlur}
            {...props}
        >
            {renderIconWithSize(icon)}
            <span className="sr-only">{srLabel}</span>
        </button>
    )
}
