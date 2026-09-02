"use client"

import { Table } from "@/components/base/display/Table";
import { Select } from "@/components/base/forms/Select";
import { Modal } from "@/components/base/overlays/Modal";
import { userCreateSchema, userUpdateSchema, validate } from "@/lib/validation"
import { ROLE_LABELS, SCOPED_ROLES, getRoleLabel } from "@/lib/roles"
import {
    createUser,
    deleteUser,
    getUsersAdmin,
    updateUser,
} from "@/api/User"
import { getCurrentUser } from "@/api/Auth"
import { getStoresAdmin } from "@/api/Store"
import { Alert } from "@/components/base/feedback/Alert";
import { Button } from "@/components/base/buttons/Button";
import { Card } from "@/components/base/display/Card";
import { Checkbox } from "@/components/base/forms/Checkbox";
import { CheckboxGroup } from "@/components/base/forms/CheckboxGroup";
import { Input } from "@/components/base/forms/Input";
import type { Store, User, UserRole } from "@/types/admin"
import { useEffect, useState } from "react"

export const UserManagement = () => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [users, setUsers] = useState<User[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
    const [stores, setStores] = useState<Store[]>([])
    // ログイン中の自分のロール。付与できるロールの判定に使う
    const [myRole, setMyRole] = useState<UserRole | null>(null)

    const [formData, setFormData] = useState<{
        personal_id: string
        password: string
        user_name: string
        name_kana: string
        email: string
        role: UserRole
        store_ids: number[]
        is_active: boolean
    }>({
        personal_id: "",
        password: "",
        user_name: "",
        name_kana: "",
        email: "",
        role: "staff",
        store_ids: [],
        is_active: true,
    })

    // 担当店舗が必要なのは staff / readonly のみ（admin以上は全店舗が対象）
    const needsStores = SCOPED_ROLES.includes(formData.role)

    useEffect(() => {
        fetchUsers()
        fetchStores()
        getCurrentUser().then((user) => setMyRole(user?.role ?? null))
    }, [])

    const fetchUsers = async () => {
        setLoading(true)
        setError(null)

        const result = await getUsersAdmin()
        setLoading(false)

        if (result.success && result.data) {
            setUsers(result.data)
        } else {
            setError(result.error || "ユーザー一覧の取得に失敗しました")
        }
    }

    const fetchStores = async () => {
        const result = await getStoresAdmin()
        if (result.success && result.data) {
            setStores(result.data)
        }
    }

    const toggleStoreId = (storeId: number) => {
        setFormData((prev) => ({
            ...prev,
            store_ids: prev.store_ids.includes(storeId)
                ? prev.store_ids.filter((id) => id !== storeId)
                : [...prev.store_ids, storeId],
        }))
    }

    const handleCreate = () => {
        setEditingUser(null)
        setFormData({
            personal_id: "",
            password: "",
            user_name: "",
            name_kana: "",
            email: "",
            role: "staff",
            store_ids: [],
            is_active: true,
        })
        setIsDialogOpen(true)
    }

    const handleEdit = (user: User) => {
        setEditingUser(user)
        setFormData({
            personal_id: user.personal_id,
            password: "",
            user_name: user.user_name,
            name_kana: user.name_kana || "",
            email: user.email || "",
            role: user.role,
            store_ids: user.store_ids ?? [],
            is_active: user.is_active,
        })
        setIsDialogOpen(true)
    }

    const handleSubmit = async () => {
        setError(null)
        setSuccess(null)

        // 新規作成はパスワード必須、更新は未入力なら変更しないためスキーマを分ける
        const validationError = validate(
            editingUser ? userUpdateSchema : userCreateSchema,
            {
                personal_id: formData.personal_id,
                user_name: formData.user_name,
                name_kana: formData.name_kana || undefined,
                email: formData.email || undefined,
                role: formData.role,
                // admin以上は全店舗が対象のため、担当店舗は持たせない
                store_ids: needsStores ? formData.store_ids : [],
                is_active: formData.is_active,
                password: formData.password,
            }
        )
        if (validationError) {
            setError(validationError)
            return
        }

        let result
        if (editingUser) {
            // 更新時のパスワードは入力があった場合のみ送信する
            result = await updateUser(editingUser.id, {
                personal_id: formData.personal_id,
                user_name: formData.user_name,
                name_kana: formData.name_kana || undefined,
                email: formData.email || undefined,
                role: formData.role,
                store_ids: needsStores ? formData.store_ids : [],
                is_active: formData.is_active,
                ...(formData.password ? { password: formData.password } : {}),
            })
        } else {
            result = await createUser({
                personal_id: formData.personal_id,
                user_name: formData.user_name,
                password: formData.password,
                name_kana: formData.name_kana || undefined,
                email: formData.email || undefined,
                role: formData.role,
                store_ids: needsStores ? formData.store_ids : [],
                is_active: formData.is_active,
            })
        }

        if (result.success) {
            setSuccess(
                editingUser ? "ユーザーを更新しました" : "ユーザーを作成しました"
            )
            setIsDialogOpen(false)
            fetchUsers()
        } else {
            setError(result.error || "ユーザーの保存に失敗しました")
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return

        const result = await deleteUser(deleteTarget.id)

        if (result.success) {
            setSuccess("ユーザーを削除しました")
            setDeleteTarget(null)
            fetchUsers()
        } else {
            setError(result.error || "ユーザーの削除に失敗しました")
            setDeleteTarget(null)
        }
    }

    /**
     * 選択できるロールの一覧
     *
     * admin以上を付与できるのは super_admin だけ（バックエンドも同じ制限）。
     * 選べてしまうと保存時に403になるため、ここで選択肢から外す。
     */
    const roleOptions = (
        myRole === "super_admin"
            ? (["super_admin", "admin", "staff", "readonly"] as const)
            : (["staff", "readonly"] as const)
    ).map((role) => ({ value: role, label: ROLE_LABELS[role] }))

    /** 担当店舗を「渋谷店、新宿店」のように表示する */
    const getStoreNames = (storeIds: number[] | undefined) => {
        if (!storeIds || storeIds.length === 0) return "全店舗"
        return storeIds
            .map((id) => stores.find((s) => s.id === id)?.name ?? String(id))
            .join("、")
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">ユーザー管理</h1>
                <Button onClick={handleCreate} label="新規作成" />
            </div>

            {success && (
                <Alert type="success" message={success} />
            )}

            {error && (
                <Alert type="error" message={error} />
            )}

            <Card title={`ユーザー一覧（${users.length}件）`}>
                <Table
                    data={users}
                    loading={loading}
                    emptyMessage="ユーザーが見つかりません"
                    getRowId={(user) => user.id}
                    columns={[
                        { id: "personal_id", header: "社員ID", accessor: "personal_id" },
                        { id: "user_name", header: "氏名", accessor: "user_name" },
                        { id: "name_kana", header: "フリガナ", accessor: "name_kana" },
                        { id: "email", header: "メールアドレス", accessor: "email" },
                        {
                            id: "role",
                            header: "ロール",
                            accessor: "role",
                            format: (value) => getRoleLabel(String(value)),
                        },
                        {
                            id: "store_ids",
                            header: "担当店舗",
                            accessor: "store_ids",
                            format: (value) => getStoreNames(value as number[] | undefined),
                        },
                        { id: "is_active", header: "状態", accessor: "is_active", type: "boolean" },
                    ]}
                    actions={[
                        { id: "edit", label: "編集", onClick: (user) => handleEdit(user) },
                        { id: "delete", label: "削除", destructive: true, onClick: (user) => setDeleteTarget(user) },
                    ]}
                />
            </Card>

            {/* 作成・編集ダイアログ */}
            <Modal
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                title={editingUser ? "ユーザー編集" : "ユーザー新規作成"}
                size="md"
                contentClassName="max-h-[90vh] overflow-y-auto"
                actions={[
                    { id: "cancel", label: "キャンセル", variant: "secondary", onClick: () => setIsDialogOpen(false) },
                    { id: "submit", label: editingUser ? "更新" : "作成", variant: "primary", onClick: handleSubmit },
                ]}
            >
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="社員ID"
                                required
                                fullWidth
                                value={formData.personal_id}
                                onChange={(e) =>
                                    setFormData({ ...formData, personal_id: e.target.value })
                                }
                                placeholder="EMP001"
                                disabled={!!editingUser}
                            />
                            <Select
                                label="ロール"
                                required
                                fullWidth
                                value={formData.role}
                                onChange={(value) =>
                                    setFormData({
                                        ...formData,
                                        role: value as UserRole,
                                    })
                                }
                                options={roleOptions}
                            />
                        </div>

                        {/*
                          担当店舗は staff / readonly のときだけ設定する。
                          admin以上は全店舗が対象のため、選ばせると誤解を生む。
                        */}
                        {needsStores ? (
                            <div>
                                <CheckboxGroup
                                    label="担当店舗 *"
                                    className="border rounded-md p-4 max-h-40 overflow-y-auto dark:border-gray-700"
                                >
                                    {stores.map((store) => (
                                        <Checkbox
                                            key={store.id}
                                            id={"user-store-" + store.id}
                                            label={store.name}
                                            checked={formData.store_ids.includes(store.id)}
                                            onCheckedChange={() => toggleStoreId(store.id)}
                                        />
                                    ))}
                                </CheckboxGroup>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    選択した店舗の予約・スケジュールのみ参照・更新できます。
                                    最低1店舗を選択してください。
                                </p>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                管理者以上は全店舗が対象のため、担当店舗の設定は不要です。
                            </p>
                        )}

                        <Input
                            label={`パスワード ${editingUser ? "(変更する場合のみ入力)" : "*"}`}
                            fullWidth
                            type="password"
                            value={formData.password}
                            onChange={(e) =>
                                setFormData({ ...formData, password: e.target.value })
                            }
                            placeholder="パスワード"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="氏名"
                                required
                                fullWidth
                                value={formData.user_name}
                                onChange={(e) =>
                                    setFormData({ ...formData, user_name: e.target.value })
                                }
                                placeholder="山田太郎"
                            />
                            <Input
                                label="氏名カナ"
                                fullWidth
                                value={formData.name_kana}
                                onChange={(e) =>
                                    setFormData({ ...formData, name_kana: e.target.value })
                                }
                                placeholder="ヤマダタロウ"
                            />
                        </div>

                        <Input
                            label="メールアドレス"
                            fullWidth
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                            }
                            placeholder="user@example.com"
                        />

                        <Select
                            label="有効フラグ"
                            fullWidth
                            value={formData.is_active.toString()}
                            onChange={(value) =>
                                setFormData({ ...formData, is_active: value === "true" })
                            }
                            options={[
                            { value: "true", label: "有効" },
                            { value: "false", label: "無効" },
                            ]}
                        />
                    </div>
            </Modal>

            {/* 削除確認ダイアログ */}
            <Modal
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="ユーザーを削除しますか？"
                size="sm"
                actions={[
                    { id: "cancel", label: "キャンセル", variant: "secondary", onClick: () => !open && setDeleteTarget(null) },
                    { id: "action", label: "削除する", variant: "danger", onClick: handleDelete },
                ]}
            >
                <p className="text-sm text-gray-600 dark:text-gray-300">
                            この操作は取り消せません。ユーザー「{deleteTarget?.user_name}」を削除してもよろしいですか？
                </p>
            </Modal>
        </div>
    )
}
