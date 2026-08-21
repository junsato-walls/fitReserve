import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg" | "xl"
    variant?: "primary" | "secondary" | "muted"
    showText?: boolean
    text?: string
    className?: string
}

export default function LoadingSpinner({
    size = "md",
    variant = "primary",
    showText = false,
    text = "読み込み中...",
    className
}: LoadingSpinnerProps) {
    // サイズの設定
    const sizeClasses = {
        sm: "w-4 h-4 border-2",
        md: "w-8 h-8 border-4",
        lg: "w-12 h-12 border-4",
        xl: "w-16 h-16 border-4"
    }

    // カラーバリアントの設定
    const variantClasses = {
        primary: "border-gray-200 border-t-blue-600",
        secondary: "border-gray-200 border-t-gray-600",
        muted: "border-gray-100 border-t-gray-400"
    }

    // テキストサイズの設定
    const textSizeClasses = {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
        xl: "text-xl"
    }

    return (
        <div className={cn("flex flex-col items-center justify-center", className)}>
            {/* スピナー */}
            <div
                className={cn(
                    "rounded-full animate-spin",
                    sizeClasses[size],
                    variantClasses[variant]
                )}
                role="status"
                aria-label="読み込み中"
            />

            {/* テキスト表示 */}
            {showText && (
                <p className={cn(
                    "mt-3 text-gray-600 font-medium",
                    textSizeClasses[size]
                )}>
                    {text}
                </p>
            )}
        </div>
    )
}

// フルスクリーン表示用のコンポーネント
export function FullScreenLoader({
    text = "読み込み中...",
    showText = true
}: {
    text?: string
    showText?: boolean
}) {
    return (
        <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
            <LoadingSpinner
                size="lg"
                variant="primary"
                showText={showText}
                text={text}
            />
        </div>
    )
}

// インライン表示用（小さめ）
export function InlineLoader({
    text,
    className
}: {
    text?: string
    className?: string
}) {
    return (
        <div className={cn("flex items-center space-x-2", className)}>
            <LoadingSpinner size="sm" variant="primary" />
            {text && <span className="text-sm text-gray-600">{text}</span>}
        </div>
    )
}

// ボタン内で使用する用
export function ButtonLoader() {
    return (
        <LoadingSpinner
            size="sm"
            variant="secondary"
            className="text-white"
        />
    )
}