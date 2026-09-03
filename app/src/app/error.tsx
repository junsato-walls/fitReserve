"use client"
import { useEffect } from "react"

interface ErrorProps {
    error: Error & { digest?: string }
    reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
    useEffect(() => {
        console.error("Error occurred:", error)
    }, [error])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
                <div className="text-center">
                    {/* エラーアイコン */}
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                        <svg
                            className="h-6 w-6 text-red-600 dark:text-red-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.73 0L3.084 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    </div>

                    {/* エラータイトル */}
                    <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                        エラーが発生しました
                    </h3>

                    {/* エラーメッセージ */}
                    <div className="mt-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {error.message.includes("fetch") || error.message.includes("API")
                                ? "データの取得に失敗しました。ネットワーク接続を確認してください。"
                                : error.message.includes("token") || error.message.includes("auth")
                                  ? "認証エラーが発生しました。再度ログインしてください。"
                                  : "システムエラーが発生しました。しばらくしてから再度お試しください。"}
                        </p>

                        {/* 開発環境でのみエラー詳細を表示 */}
                        {process.env.NODE_ENV === "development" && (
                            <details className="mt-4 text-left">
                                <summary className="cursor-pointer text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                                    エラー詳細 (開発環境)
                                </summary>
                                <pre className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900 p-2 rounded overflow-x-auto">
                                    {error.stack}
                                </pre>
                            </details>
                        )}
                    </div>

                    {/* アクションボタン */}
                    <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            type="button"
                            onClick={reset}
                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-800 dark:ring-offset-gray-800"
                        >
                            再試行
                        </button>

                        <button
                            type="button"
                            onClick={() => (window.location.href = "/")}
                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-800 dark:ring-offset-gray-800"
                        >
                            ホームに戻る
                        </button>
                    </div>

                    {/* 追加情報 */}
                    <div className="mt-4">
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            問題が続く場合は、管理者にお問い合わせください。
                        </p>
                        {error.digest && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                エラーID: {error.digest}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
