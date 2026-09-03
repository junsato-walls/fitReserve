export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="relative w-16 h-16 mx-auto">
                    <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
                <div className="mt-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        読み込み中...
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        しばらくお待ちください
                    </p>
                </div>
            </div>
        </div>
    )
}
