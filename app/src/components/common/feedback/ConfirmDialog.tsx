"use client"

import Modal from "@/components/base/overlays/Modal"
import { AlertTriangle, Check, Info, Trash2 } from "lucide-react"
import { useState } from "react"

interface ConfirmDialogProps {
    /** ダイアログの表示状態 */
    open: boolean
    /** ダイアログを閉じる関数 */
    onClose: () => void
    /** 確認ボタンクリック時の処理 */
    onConfirm: () => void | Promise<void>
    /** ダイアログのタイトル */
    title?: string
    /** ダイアログの説明文 */
    description?: string
    /** 確認ダイアログの種類 */
    variant?: "default" | "destructive" | "warning" | "info"
    /** 確認ボタンのテキスト */
    confirmText?: string
    /** キャンセルボタンのテキスト */
    cancelText?: string
    /** 確認処理中の状態 */
    loading?: boolean
    /** 追加のカスタマイズ用クラス */
    className?: string
}

export default function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    description,
    variant = "default",
    confirmText,
    cancelText = "キャンセル",
    loading = false,
    className
}: ConfirmDialogProps) {
    // バリアントごとの設定
    const variantConfig = {
        default: {
            icon: Check,
            iconClass: "text-blue-600",
            confirmText: confirmText || "確認",
            confirmVariant: "primary" as const
        },
        destructive: {
            icon: Trash2,
            iconClass: "text-red-600",
            confirmText: confirmText || "削除",
            confirmVariant: "danger" as const
        },
        warning: {
            icon: AlertTriangle,
            iconClass: "text-yellow-600",
            confirmText: confirmText || "続行",
            confirmVariant: "primary" as const
        },
        info: {
            icon: Info,
            iconClass: "text-blue-600",
            confirmText: confirmText || "OK",
            confirmVariant: "primary" as const
        }
    }

    const config = variantConfig[variant]
    const IconComponent = config.icon

    const handleConfirm = async () => {
        try {
            await onConfirm()
            onClose()
        } catch (error) {
            console.error("Confirm action failed:", error)
            // エラーハンドリングは呼び出し側で行う
        }
    }

    return (
        <Modal
            open={open}
            onOpenChange={(next) => !next && onClose()}
            size="md"
            contentClassName={className}
            // タイトルはアイコンと並べて表示する
            title={
                <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                        <IconComponent size={20} className={config.iconClass} />
                    </span>
                    {title || "確認"}
                </span>
            }
            actions={[
                {
                    id: "cancel",
                    label: cancelText,
                    variant: "secondary",
                    disabled: loading,
                    onClick: onClose,
                },
                {
                    id: "confirm",
                    label: config.confirmText,
                    variant: config.confirmVariant,
                    loading,
                    onClick: handleConfirm,
                },
            ]}
        >
            {description && (
                <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
            )}
        </Modal>
    )
}

// カスタムフック：確認ダイアログの状態管理
export function useConfirmDialog() {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const openDialog = () => setIsOpen(true)
    const closeDialog = () => {
        setIsOpen(false)
        setLoading(false)
    }

    const confirm = async (action: () => void | Promise<void>) => {
        setLoading(true)
        try {
            await action()
            closeDialog()
        } catch (error) {
            setLoading(false)
            throw error
        }
    }

    return {
        isOpen,
        loading,
        openDialog,
        closeDialog,
        confirm
    }
}

// 削除確認専用コンポーネント
export function DeleteConfirmDialog({
    open,
    onClose,
    onConfirm,
    itemName,
    loading = false
}: {
    open: boolean
    onClose: () => void
    onConfirm: () => void | Promise<void>
    itemName?: string
    loading?: boolean
}) {
    return (
        <ConfirmDialog
            open={open}
            onClose={onClose}
            onConfirm={onConfirm}
            variant="destructive"
            title="削除の確認"
            description={
                itemName
                    ? `「${itemName}」を削除しますか？この操作は取り消せません。`
                    : "このアイテムを削除しますか？この操作は取り消せません。"
            }
            confirmText="削除"
            loading={loading}
        />
    )
}

// ログアウト確認専用コンポーネント  
export function LogoutConfirmDialog({
    open,
    onClose,
    onConfirm,
    loading = false
}: {
    open: boolean
    onClose: () => void
    onConfirm: () => void | Promise<void>
    loading?: boolean
}) {
    return (
        <ConfirmDialog
            open={open}
            onClose={onClose}
            onConfirm={onConfirm}
            variant="warning"
            title="ログアウト"
            description="ログアウトしますか？保存されていない変更は失われます。"
            confirmText="ログアウト"
            loading={loading}
        />
    )
}