"use client"

import { Button } from "@/components/base/buttons/Button";
import { ArrowLeft, Home, Search } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                {/* 404 イラスト */}
                <div className="mb-8">
                    <div className="text-9xl font-bold text-gray-200 dark:text-gray-700 select-none">
                        404
                    </div>
                    <div className="relative -mt-8">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Search size={48} className="text-gray-400 dark:text-gray-500" />
                        </div>
                    </div>
                </div>

                {/* メッセージ */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        ページが見つかりません
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        お探しのページは存在しないか、移動された可能性があります。
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        URLを確認してもう一度お試しください。
                    </p>
                </div>

                {/* アクションボタン */}
                <div className="space-y-3">
                    {/* ホームに戻る */}
                    <Link href="/" className="block">
                        <Button
                            className="w-full"
                            size="lg"
                            label="ホームに戻る"
                            leftIcon={<Home size={20} />}
                        />
                    </Link>

                    {/* 前のページに戻る */}
                    <Button
                        variant="outline"
                        size="lg"
                        className="w-full"
                        onClick={() => window.history.back()}
                        label="前のページに戻る"
                        leftIcon={<ArrowLeft size={20} />}
                    />
                </div>

                {/* 便利なリンク */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        よく利用されるページ
                    </p>
                    <div className="space-y-2">
                        <Link
                            href="/reservations/check"
                            className="block text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm hover:underline"
                        >
                            予約内容の確認
                        </Link>
                        <Link
                            href="/login"
                            className="block text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm hover:underline"
                        >
                            スタッフログイン
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}