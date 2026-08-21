"use client"

/**
 * ルートレイアウト自体でエラーが発生した場合のフォールバック
 *
 * global-error.tsx は layout.tsx を置き換えて描画されるため、
 * html / body タグを自前で出力する必要がある。
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html lang="ja">
            <body>
                <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                    <div className="max-w-md w-full text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            エラーが発生しました
                        </h1>
                        <p className="text-gray-600 mb-6">
                            申し訳ありません。予期しない問題が発生しました。
                        </p>
                        {error.digest && (
                            <p className="text-xs text-gray-400 mb-6">
                                エラーID: {error.digest}
                            </p>
                        )}
                        <button
                            onClick={reset}
                            className="w-full rounded-md bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-700"
                        >
                            再読み込み
                        </button>
                    </div>
                </div>
            </body>
        </html>
    )
}
