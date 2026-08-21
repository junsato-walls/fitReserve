"use client"

import { schoolSchema, validate } from "@/lib/validation"
import {
    createSchool,
    deleteSchool,
    getSchoolsAdmin,
    updateSchool,
} from "@/actions/School"
import Table from "@/components/base/layouts/Table"
import Select from "@/components/base/forms/Select"
import Modal from "@/components/base/overlays/Modal"
import Alert from "@/components/base/feedback/Alert"
import Button from "@/components/base/buttons/Button"
import Card from "@/components/base/layouts/Card"
import Input from "@/components/base/forms/Input"
import type { School } from "@/types/admin"
import { useEffect, useState } from "react"

export const SchoolManagement = () => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [schools, setSchools] = useState<School[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingSchool, setEditingSchool] = useState<School | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<School | null>(null)

    const [formData, setFormData] = useState({
        school_code: "",
        name: "",
        name_kana: "",
        school_type: "elementary",
        postal_code: "",
        address: "",
        phone: "",
        email: "",
        is_enabled: true,
    })

    useEffect(() => {
        fetchSchools()
    }, [])

    const fetchSchools = async () => {
        setLoading(true)
        setError(null)

        const result = await getSchoolsAdmin()
        setLoading(false)

        if (result.success && result.data) {
            setSchools(result.data)
        } else {
            setError(result.error || "学校一覧の取得に失敗しました")
        }
    }

    const handleCreate = () => {
        setEditingSchool(null)
        setFormData({
            school_code: "",
            name: "",
            name_kana: "",
            school_type: "elementary",
            postal_code: "",
            address: "",
            phone: "",
            email: "",
            is_enabled: true,
        })
        setIsDialogOpen(true)
    }

    const handleEdit = (school: School) => {
        setEditingSchool(school)
        setFormData({
            school_code: school.school_code,
            name: school.name,
            name_kana: school.name_kana || "",
            school_type: school.school_type,
            postal_code: school.postal_code || "",
            address: school.address || "",
            phone: school.phone || "",
            email: school.email || "",
            is_enabled: school.is_enabled,
        })
        setIsDialogOpen(true)
    }

    const handleSubmit = async () => {
        setError(null)
        setSuccess(null)

        const data = {
            school_code: formData.school_code,
            name: formData.name,
            name_kana: formData.name_kana || undefined,
            school_type: formData.school_type,
            postal_code: formData.postal_code || undefined,
            address: formData.address || undefined,
            phone: formData.phone || undefined,
            email: formData.email || undefined,
            is_enabled: formData.is_enabled,
        }

        const validationError = validate(schoolSchema, data)
        if (validationError) {
            setError(validationError)
            return
        }

        let result
        if (editingSchool) {
            result = await updateSchool(editingSchool.id, data)
        } else {
            result = await createSchool(data)
        }

        if (result.success) {
            setSuccess(editingSchool ? "学校を更新しました" : "学校を作成しました")
            setIsDialogOpen(false)
            fetchSchools()
        } else {
            setError(result.error || "学校の保存に失敗しました")
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return

        const result = await deleteSchool(deleteTarget.id)

        if (result.success) {
            setSuccess("学校を削除しました")
            setDeleteTarget(null)
            fetchSchools()
        } else {
            setError(result.error || "学校の削除に失敗しました")
            setDeleteTarget(null)
        }
    }

    const getSchoolTypeLabel = (type: string) => {
        const labels: { [key: string]: string } = {
            elementary: "小学校",
            junior_high: "中学校",
            high: "高校",
            combined: "中高一貫",
            other: "その他",
        }
        return labels[type] || type
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">学校管理</h1>
                <Button onClick={handleCreate} label="新規作成" />
            </div>

            {success && (
                <Alert type="success" message={success} />
            )}

            {error && (
                <Alert type="error" message={error} />
            )}

            <Card title={`学校一覧（${schools.length}件）`}>
                <Table
                    data={schools}
                    loading={loading}
                    emptyMessage="学校が見つかりません"
                    getRowId={(school) => school.id}
                    columns={[
                        { id: "school_code", header: "学校コード", accessor: "school_code" },
                        { id: "name", header: "学校名", accessor: "name" },
                        {
                            id: "school_type",
                            header: "学校区分",
                            accessor: "school_type",
                            format: (value) => getSchoolTypeLabel(String(value)),
                        },
                        { id: "address", header: "住所", accessor: "address" },
                        { id: "phone", header: "電話番号", accessor: "phone" },
                        { id: "is_enabled", header: "状態", accessor: "is_enabled", type: "boolean" },
                    ]}
                    actions={[
                        { id: "edit", label: "編集", onClick: (school) => handleEdit(school) },
                        { id: "delete", label: "削除", destructive: true, onClick: (school) => setDeleteTarget(school) },
                    ]}
                />
            </Card>

            {/* 作成・編集ダイアログ */}
            <Modal
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                title={editingSchool ? "学校編集" : "学校新規作成"}
                size="md"
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
                        label: editingSchool ? "更新" : "作成",
                        variant: "primary",
                        onClick: handleSubmit,
                    },
                ]}
            >
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="学校コード"
                                required
                                fullWidth
                                value={formData.school_code}
                                onChange={(e) =>
                                    setFormData({ ...formData, school_code: e.target.value })
                                }
                                placeholder="SCH001"
                            />
                            <div>
                                {/* 選択肢はバックエンドのSchoolType（elementary/junior_high/high/other）に合わせる。
                                    以前あった"combined"（中高一貫）はバックエンドに存在せず、選ぶと必ず登録エラーになっていた */}
                                <Select
                                    label="学校区分 *"
                                    fullWidth
                                    value={formData.school_type}
                                    onChange={(value) =>
                                        setFormData({ ...formData, school_type: value })
                                    }
                                    options={[
                                        { value: "elementary", label: "小学校" },
                                        { value: "junior_high", label: "中学校" },
                                        { value: "high", label: "高校" },
                                        { value: "other", label: "その他" },
                                    ]}
                                />
                            </div>
                        </div>

                        <Input
                            label="学校名"
                            required
                            fullWidth
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="○○中学校"
                        />

                        <Input
                            label="学校名カナ"
                            fullWidth
                            value={formData.name_kana}
                            onChange={(e) =>
                                setFormData({ ...formData, name_kana: e.target.value })
                            }
                            placeholder="マルマルチュウガッコウ"
                        />

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
                                placeholder="info@school.example.com"
                            />
                        </div>

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
                title="学校を削除しますか？"
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
                    この操作は取り消せません。学校「{deleteTarget?.name}」を削除してもよろしいですか？
                </p>
            </Modal>
        </div>
    )
}
