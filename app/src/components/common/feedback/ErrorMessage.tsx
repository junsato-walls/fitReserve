"use client"

import Button from "@/components/base/buttons/Button"
import { cn } from "@/lib/utils"
import { AlertCircle, RefreshCw, X } from "lucide-react"

interface ErrorMessageProps {
    /** エラーメッセージ */
    message: string
    /** エラーの詳細情報（開発環境でのみ表示） */
    details?: string
    /** エラーの種類 */
    variant?: "error" | "warning" | "info"
    /** サイズ */
    size?: "sm" | "md" | "lg"
    /** 閉じるボタンを表示するか */
    closable?: boolean
    /** 再試行ボタンを表示するか */
    retryable?: boolean
    /** 閉じるボタンクリック時のコールバック */
    onClose?: () => void
    /** 再試行ボタンクリック時のコールバック */
    onRetry?: () => void
    /** カスタムクラス */
    className?: string
}

export default function ErrorMessage({
    message,
    details,
    variant = "error",
    size = "md",
    closable = false,
    retryable = false,
    onClose,
    onRetry,
    className
}: ErrorMessageProps) {
    // バリアントごとのスタイル
    const variantClasses = {
        error: "bg-red-50 border-red-200 text-red-800",
        warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
        info: "bg-blue-50 border-blue-200 text-blue-800"
    }

    // アイコンの色
    const iconClasses = {
        error: "text-red-500",
        warning: "text-yellow-500",
        info: "text-blue-500"
    }

    // サイズごとのスタイル
    const sizeClasses = {
        sm: "p-3 text-sm",
        md: "p-4 text-base",
        lg: "p-6 text-lg"
    }

    const iconSizes = {
        sm: 16,
        md: 20,
        lg: 24
    }

    return (
        <div
            className={cn(
                "border rounded-lg flex items-start space-x-3",
                variantClasses[variant],
                sizeClasses[size],
                className
            )}
            role="alert"
            aria-live="polite"
        >
            {/* エラーアイコン */}
            <AlertCircle
                size={iconSizes[size]}
                className={cn("flex-shrink-0 mt-0.5", iconClasses[variant])}
            />

            {/* メッセージ部分 */}
            <div className="flex-1 min-w-0">
                <p className="font-medium">{message}</p>

                {/* 詳細情報（開発環境のみ） */}
                {details && process.env.NODE_ENV === 'development' && (
                    <details className="mt-2">
                        <summary className="cursor-pointer text-sm opacity-75 hover:opacity-100">
                            詳細情報を表示
                        </summary>
                        <pre className="mt-2 text-xs bg-black bg-opacity-10 p-2 rounded overflow-x-auto">
                            {details}
                        </pre>
                    </details>
                )}

                {/* アクションボタン */}
                {(retryable || closable) && (
                    <div className="mt-3 flex space-x-2">
                        {retryable && onRetry && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRetry}
                                className="h-8 px-3 text-xs"
                                label="再試行"
                                leftIcon={<RefreshCw size={14} />}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* 閉じるボタン */}
            {closable && onClose && (
                <button
                    onClick={onClose}
                    className={cn(
                        "flex-shrink-0 p-1 rounded hover:bg-black hover:bg-opacity-10",
                        iconClasses[variant]
                    )}
                    aria-label="エラーメッセージを閉じる"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    )
}

// API エラー専用コンポーネント
export function ApiErrorMessage({
    error,
    onRetry,
    className
}: {
    error: Error | string
    onRetry?: () => void
    className?: string
}) {
    const errorMessage = error instanceof Error ? error.message : error

    // よくあるエラーメッセージの日本語化
    const getLocalizedMessage = (message: string) => {
        if (message.includes('fetch')) {
            return 'ネットワークエラーが発生しました。接続を確認してください。'
        }
        if (message.includes('401') || message.includes('Unauthorized')) {
            return '認証エラーです。再度ログインしてください。'
        }
        if (message.includes('403') || message.includes('Forbidden')) {
            return 'アクセス権限がありません。'
        }
        if (message.includes('404') || message.includes('Not Found')) {
            return 'データが見つかりませんでした。'
        }
        if (message.includes('500') || message.includes('Internal Server Error')) {
            return 'サーバーエラーが発生しました。しばらくしてから再度お試しください。'
        }
        return message
    }

    return (
        <ErrorMessage
            message={getLocalizedMessage(errorMessage)}
            details={error instanceof Error ? error.stack : undefined}
            variant="error"
            retryable={!!onRetry}
            onRetry={onRetry}
            className={className}
        />
    )
}

// フォームエラー専用コンポーネント
export function FormErrorMessage({
    errors,
    className
}: {
    errors: string | string[]
    className?: string
}) {
    const errorList = Array.isArray(errors) ? errors : [errors]

    return (
        <ErrorMessage
            message={errorList[0]}
            variant="warning"
            size="sm"
            className={className}
        />
    )
}

// 空状態エラー
export function EmptyStateError({
    title = "データが見つかりません",
    description = "条件を変更して再度お試しください",
    onRetry,
    className
}: {
    title?: string
    description?: string
    onRetry?: () => void
    className?: string
}) {
    return (
        <div className={cn("text-center py-12", className)}>
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 mb-6">{description}</p>
            {onRetry && (
                <Button
                    variant="outline"
                    onClick={onRetry}
                    label="再読み込み"
                    leftIcon={<RefreshCw size={16} />}
                />
            )}
        </div>
    )
}