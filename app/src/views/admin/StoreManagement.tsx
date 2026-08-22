"use client"

import { storeSchema, validate } from "@/lib/validation"
import {
    createStore,
    deleteStore,
    getStoresAdmin,
    updateStore,
} from "@/api/Store"
import { Table } from "@/components/base/display/Table";
import { Select } from "@/components/base/forms/Select";
import { Modal } from "@/components/base/overlays/Modal";
import { Alert } from "@/components/base/feedback/Alert";
import { Button } from "@/components/base/buttons/Button";
import { Card } from "@/components/base/display/Card";
import { Input } from "@/components/base/forms/Input";
import type { Store } from "@/types/admin"
import { useEffect, useState } from "react"

export const StoreManagement = () => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [stores, setStores] = useState<Store[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingStore, setEditingStore] = useState<Store | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Store | null>(null)

    const [formData, setFormData] = useState({
        store_code: "",
        name: "",
        name_kana: "",
        postal_code: "",
        address: "",
        phone: "",
        email: "",
        capacity: "1",
        business_hours_start: "",
        business_hours_end: "",
        regular_holiday: "",
        description: "",
        is_enabled: true,
    })

    useEffect(() => {
        fetchStores()
    }, [])

    const fetchStores = async () => {
        setLoading(true)
        setError(null)

        const result = await getStoresAdmin()
        setLoading(false)

        if (result.success && result.data) {
            setStores(result.data)
        } else {
            setError(result.error || "店舗一覧の取得に失敗しました")
        }
    }

    const handleCreate = () => {
        setEditingStore(null)
        setFormData({
            store_code: "",
            name: "",
            name_kana: "",
            postal_code: "",
            address: "",
            phone: "",
            email: "",
            capacity: "1",
            business_hours_start: "",
            business_hours_end: "",
            regular_holiday: "",
            description: "",
            is_enabled: true,
        })
        setIsDialogOpen(true)
    }

    const handleEdit = (store: Store) => {
        setEditingStore(store)
        setFormData({
            store_code: store.store_code,
            name: store.name,
            name_kana: store.name_kana || "",
            postal_code: store.postal_code || "",
            address: store.address || "",
            phone: store.phone || "",
            email: store.email || "",
            capacity: store.capacity.toString(),
            business_hours_start: store.business_hours_start || "",
            business_hours_end: store.business_hours_end || "",
            regular_holiday: store.regular_holiday || "",
            description: store.description || "",
            is_enabled: store.is_enabled,
        })
        setIsDialogOpen(true)
    }

    const handleSubmit = async () => {
        setError(null)
        setSuccess(null)

        const data = {
            store_code: formData.store_code,
            name: formData.name,
            name_kana: formData.name_kana || undefined,
            postal_code: formData.postal_code || undefined,
            address: formData.address || undefined,
            phone: formData.phone || undefined,
            email: formData.email || undefined,
            capacity: parseInt(formData.capacity),
            business_hours_start: formData.business_hours_start || undefined,
            business_hours_end: formData.business_hours_end || undefined,
            regular_holiday: formData.regular_holiday || undefined,
            description: formData.description || undefined,
            is_enabled: formData.is_enabled,
        }

        const validationError = validate(storeSchema, data)
        if (validationError) {
            setError(validationError)
            return
        }

        let result
        if (editingStore) {
            result = await updateStore(editingStore.id, data)
        } else {
            result = await createStore(data)
        }

        if (result.success) {
            setSuccess(
                editingStore ? "店舗を更新しました" : "店舗を作成しました"
            )
            setIsDialogOpen(false)
            fetchStores()
        } else {
            setError(result.error || "店舗の保存に失敗しました")
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return

        const result = await deleteStore(deleteTarget.id)

        if (result.success) {
            setSuccess("店舗を削除しました")
            setDeleteTarget(null)
            fetchStores()
        } else {
            setError(result.error || "店舗の削除に失敗しました")
            setDeleteTarget(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">店舗管理</h1>
                <Button onClick={handleCreate} label="新規作成" />
            </div>

            {success && (
                <Alert type="success" message={success} />
            )}

            {error && (
                <Alert type="error" message={error} />
            )}

            <Card title={`店舗一覧（${stores.length}件）`}>
                <Table
                    data={stores}
                    loading={loading}
                    emptyMessage="店舗が見つかりません"
                    getRowId={(store) => store.id}
                    columns={[
                        { id: "store_code", header: "店舗コード", accessor: "store_code" },
                        { id: "name", header: "店舗名", accessor: "name" },
                        { id: "address", header: "住所", accessor: "address" },
                        { id: "phone", header: "電話番号", accessor: "phone" },
                        { id: "capacity", header: "対応可能人数", accessor: "capacity" },
                        { id: "is_enabled", header: "状態", accessor: "is_enabled", type: "boolean" },
                    ]}
                    actions={[
                        { id: "edit", label: "編集", onClick: (store) => handleEdit(store) },
                        { id: "delete", label: "削除", destructive: true, onClick: (store) => setDeleteTarget(store) },
                    ]}
                />
            </Card>

            {/* 作成・編集ダイアログ */}
            <Modal
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                title={editingStore ? "店舗編集" : "店舗新規作成"}
                size="lg"
                contentClassName="max-h-[90vh] overflow-y-auto"
                actions={[
                    {
                        id: "cancel",
                        label: "キャンセル",
                        variant: "secondary",
                        onClick: () => setIsDialogOpen(false),
                    },
                    {
                        id: "submit",
                        label: editingStore ? "更新" : "作成",
                        variant: "primary",
                        onClick: handleSubmit,
                    },
                ]}
            >
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="店舗コード"
                                required
                                fullWidth
                                value={formData.store_code}
                                onChange={(e) =>
                                    setFormData({ ...formData, store_code: e.target.value })
                                }
                                placeholder="S001"
                            />
                            <Input
                                label="店舗名"
                                required
                                fullWidth
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                placeholder="○○店"
                            />
                        </div>

                        <Input
                            label="店舗名カナ"
                            fullWidth
                            value={formData.name_kana}
                            onChange={(e) =>
                                setFormData({ ...formData, name_kana: e.target.value })
                            }
                            placeholder="マルマルテン"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="郵便番号"
                                fullWidth
                                value={formData.postal_code}
                                onChange={(e) =>
                                    setFormData({ ...formData, postal_code: e.target.value })
                                }
                                placeholder="123-4567"
                            />
                            <Input
                                label="対応可能人数"
                                fullWidth
                                type="number"
                                min="1"
                                value={formData.capacity}
                                onChange={(e) =>
                                    setFormData({ ...formData, capacity: e.target.value })
                                }
                            />
                        </div>

                        <Input
                            label="住所"
                            fullWidth
                            value={formData.address}
                            onChange={(e) =>
                                setFormData({ ...formData, address: e.target.value })
                            }
                            placeholder="東京都○○区○○..."
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="電話番号"
                                fullWidth
                                value={formData.phone}
                                onChange={(e) =>
                                    setFormData({ ...formData, phone: e.target.value })
                                }
                                placeholder="03-1234-5678"
                            />
                            <Input
                                label="メールアドレス"
                                fullWidth
                                type="email"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                }
                                placeholder="store@example.com"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="営業開始時間"
                                fullWidth
                                type="time"
                                value={formData.business_hours_start}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        business_hours_start: e.target.value,
                                    })
                                }
                            />
                            <Input
                                label="営業終了時間"
                                fullWidth
                                type="time"
                                value={formData.business_hours_end}
                                onChange={(e) =>
                                    setFormData({ ...formData, business_hours_end: e.target.value })
                                }
                            />
                        </div>

                        <Input
                            label="定休日"
                            fullWidth
                            value={formData.regular_holiday}
                            onChange={(e) =>
                                setFormData({ ...formData, regular_holiday: e.target.value })
                            }
                            placeholder="月曜日、第3火曜日"
                        />

                        <Input
                            label="店舗説明"
                            fullWidth
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            placeholder="店舗の説明文"
                        />

                        <div>
                            <Select
                                label="有効フラグ"
                                fullWidth
                                value={formData.is_enabled.toString()}
                                onChange={(value) =>
                                    setFormData({ ...formData, is_enabled: value === "true" })
                                }
                                options={[
                                    { value: "true", label: "有効" },
                                    { value: "false", label: "無効" },
                                ]}
                            />
                        </div>
                    </div>
            </Modal>

            {/* 削除確認ダイアログ */}
            <Modal
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="店舗を削除しますか？"
                size="sm"
                actions={[
                    {
                        id: "cancel",
                        label: "キャンセル",
                        variant: "secondary",
                        onClick: () => setDeleteTarget(null),
                    },
                    {
                        id: "delete",
                        label: "削除する",
                        variant: "danger",
                        onClick: handleDelete,
                    },
                ]}
            >
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    この操作は取り消せません。店舗「{deleteTarget?.name}」を削除してもよろしいですか？
                </p>
            </Modal>
        </div>
    )
}
