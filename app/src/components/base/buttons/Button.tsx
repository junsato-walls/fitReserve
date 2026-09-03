import { ButtonHTMLAttributes, cloneElement, isValidElement, ReactElement, ReactNode } from "react"
import { BUTTON_PRESS, buttonToneClasses } from "@/components/base/buttons/styles"
import type { Size, Tone, Variant } from "@/components/base/tokens"
import { cn } from "@/lib/utils"

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
    label: string
    /** ラベルの下に小さく添える補足（残数など）。指定すると2行表示になる */
    subLabel?: string
    /**
     * 選択状態。指定すると選択トグルとして振る舞い、tone / variant より優先される
     * （時間帯選択のように、複数の候補から1つ選ばせる用途で使う）
     */
    selected?: boolean
    /** 用途を表す色 */
    tone?: Tone
    /** 見た目の型（塗り・枠線・透明） */
    variant?: Variant
    size?: Size
    isDisabled?: boolean
    isLoading?: boolean
    /** ローディング中に表示するテキスト（未指定時はlabelのまま） */
    loadingLabel?: string
    fullWidth?: boolean
    leftIcon?: ReactNode
    rightIcon?: ReactNode
}

const SIZE_STYLES: Record<Size, string> = {
    sm: "px-3 py-2 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
}

// アイコンは size に数値を期待するものがあるため、文字列を渡してはいけない
const ICON_SIZE: Record<Size, number> = {
    sm: 14,
    md: 16,
    lg: 20,
}

export const Button = ({
    label,
    subLabel,
    selected,
    tone = "info",
    variant = "filled",
    size = "md",
    isDisabled = false,
    isLoading = false,
    loadingLabel,
    fullWidth = false,
    leftIcon,
    rightIcon,
    disabled,
    type = "button",
    ...props
}: ButtonProps) => {
    // 選択トグルとして使う場合は、見た目を選択状態から決める
    const effective =
        selected === undefined
            ? { tone, variant }
            : selected
              ? { tone: "info" as Tone, variant: "filled" as Variant }
              : { tone: "neutral" as Tone, variant: "outlined" as Variant }

    /** アイコンに size を補完する。呼び出し側が指定済みならそれを尊重する */
    const renderIconWithSize = (icon: ReactNode) => {
        if (!icon) return null
        if (!isValidElement(icon)) return icon

        const element = icon as ReactElement<{ size?: number | string; className?: string }>
        const alreadySized =
            element.props.size !== undefined || /(w|h|size)-/.test(element.props.className ?? "")
        if (alreadySized) return element

        return cloneElement(element, { size: ICON_SIZE[size] } as Partial<{ size?: number }>)
    }

    return (
        <button
            // フォーム内での暗黙の submit を防ぐ。送信ボタンは type="submit" を明示すること
            type={type}
            className={cn(
                "inline-flex items-center justify-center font-medium rounded-lg transition-colors",
                "focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
                // 補足付きは2行になるため、縦並び＋高さ自動にする
                subLabel && "flex-col h-auto py-3",
                buttonToneClasses(effective.tone, effective.variant),
                BUTTON_PRESS,
                SIZE_STYLES[size],
                fullWidth && "w-full",
            )}
            disabled={disabled || isDisabled || isLoading}
            // 選択トグルとして使う場合は状態を支援技術へ伝える
            aria-pressed={selected}
            {...props}
        >
            {/* ローディングアイコン（最優先） */}
            {isLoading && (
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            )}

            {/* 左アイコン（ローディング中でない場合のみ） */}
            {!isLoading && leftIcon && (
                <span className="mr-2 flex-shrink-0 flex items-center justify-center">
                    {renderIconWithSize(leftIcon)}
                </span>
            )}

            <span>{isLoading && loadingLabel ? loadingLabel : label}</span>

            {subLabel && <span className="text-xs font-normal">{subLabel}</span>}

            {rightIcon && (
                <span className="ml-2 flex-shrink-0 flex items-center justify-center">
                    {renderIconWithSize(rightIcon)}
                </span>
            )}
        </button>
    )
}
