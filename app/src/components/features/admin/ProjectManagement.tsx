"use client"

import Table from "@/components/base/layouts/Table"
import Select from "@/components/base/forms/Select"
import Modal from "@/components/base/overlays/Modal"
import { projectSchema, validate } from "@/lib/validation"
import {
    createProject,
    deleteProject,
    getProjectsAdmin,
    updateProject,
} from "@/actions/Project"
import { getSchoolsAdmin } from "@/actions/School"
import { getStoresAdmin } from "@/actions/Store"
import Alert from "@/components/base/feedback/Alert"
import Button from "@/components/base/buttons/Button"
import Card from "@/components/base/layouts/Card"
import Checkbox from "@/components/base/forms/Checkbox"
import CheckboxGroup from "@/components/base/forms/CheckboxGroup"
import Input from "@/components/base/forms/Input"
import type { Project, School, Store } from "@/types/admin"
import { useEffect, useState } from "react"

export const ProjectManagement = () => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [projects, setProjects] = useState<Project[]>([])
    const [stores, setStores] = useState<Store[]>([])
    const [schools, setSchools] = useState<School[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingProject, setEditingProject] = useState<Project | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)

    const [formData, setFormData] = useState({
        project_code: "",
        name: "",
        description: "",
        start_date: "",
        end_date: "",
        reservation_interval: 30,
        is_enabled: true,
        store_ids: [] as number[],
        school_ids: [] as number[],
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        setError(null)

        const [projectsResult, storesResult, schoolsResult] = await Promise.all([
            getProjectsAdmin(),
            getStoresAdmin(),
            getSchoolsAdmin(),
        ])

        setLoading(false)

        if (projectsResult.success && projectsResult.data) {
            setProjects(projectsResult.data)
        } else {
            setError(projectsResult.error || "プロジェクト一覧の取得に失敗しました")
        }

        if (storesResult.success && storesResult.data) {
            setStores(storesResult.data)
        }

        if (schoolsResult.success && schoolsResult.data) {
            setSchools(schoolsResult.data)
        }
    }

    const handleCreate = () => {
        setEditingProject(null)
        setFormData({
            project_code: "",
            name: "",
            description: "",
            start_date: "",
            end_date: "",
            reservation_interval: 30,
            is_enabled: true,
            store_ids: [],
            school_ids: [],
        })
        setIsDialogOpen(true)
    }

    const handleEdit = (project: Project) => {
        setEditingProject(project)
        setFormData({
            project_code: project.project_code,
            name: project.name,
            description: project.description || "",
            start_date: project.start_date || "",
            end_date: project.end_date || "",
            reservation_interval: project.reservation_interval || 30,
            is_enabled: project.is_enabled,
            store_ids: project.store_ids || [],
            school_ids: project.school_ids || [],
        })
        setIsDialogOpen(true)
    }

    const handleSubmit = async () => {
        setError(null)
        setSuccess(null)

        const data = {
            project_code: formData.project_code,
            name: formData.name,
            description: formData.description || undefined,
            start_date: formData.start_date,
            end_date: formData.end_date,
            reservation_interval: formData.reservation_interval,
            is_enabled: formData.is_enabled,
            store_ids: formData.store_ids.length > 0 ? formData.store_ids : undefined,
            school_ids: formData.school_ids.length > 0 ? formData.school_ids : undefined,
        }

        const validationError = validate(projectSchema, {
            project_code: data.project_code,
            name: data.name,
            description: data.description,
            start_date: data.start_date,
            end_date: data.end_date,
            reservation_interval: data.reservation_interval,
            is_enabled: data.is_enabled,
        })
        if (validationError) {
            setError(validationError)
            return
        }

        let result
        if (editingProject) {
            result = await updateProject(editingProject.id, data)
        } else {
            result = await createProject(data)
        }

        if (result.success) {
            setSuccess(
                editingProject ? "プロジェクトを更新しました" : "プロジェクトを作成しました"
            )
            setIsDialogOpen(false)
            fetchData()
        } else {
            setError(result.error || "プロジェクトの保存に失敗しました")
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return

        const result = await deleteProject(deleteTarget.id)

        if (result.success) {
            setSuccess("プロジェクトを削除しました")
            setDeleteTarget(null)
            fetchData()
        } else {
            setError(result.error || "プロジェクトの削除に失敗しました")
            setDeleteTarget(null)
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

    const toggleSchoolId = (schoolId: number) => {
        setFormData((prev) => ({
            ...prev,
            school_ids: prev.school_ids.includes(schoolId)
                ? prev.school_ids.filter((id) => id !== schoolId)
                : [...prev.school_ids, schoolId],
        }))
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">プロジェクト管理</h1>
                <Button onClick={handleCreate} label="新規作成" />
            </div>

            {success && (
                <Alert type="success" message={success} />
            )}

            {error && (
                <Alert type="error" message={error} />
            )}

            <Card title={`プロジェクト一覧（${projects.length}件）`}>
                <Table
                    data={projects}
                    loading={loading}
                    emptyMessage="プロジェクトが見つかりません"
                    getRowId={(project) => project.id}
                    columns={[
                        { id: "project_code", header: "プロジェクトコード", accessor: "project_code" },
                        { id: "name", header: "プロジェクト名", accessor: "name" },
                        { id: "start_date", header: "開始日", accessor: "start_date" },
                        { id: "end_date", header: "終了日", accessor: "end_date" },
                        {
                            id: "store_ids",
                            header: "店舗数",
                            accessor: "store_ids",
                            format: (value) => `${(value as number[] | undefined)?.length ?? 0}件`,
                        },
                        {
                            id: "school_ids",
                            header: "学校数",
                            accessor: "school_ids",
                            format: (value) => `${(value as number[] | undefined)?.length ?? 0}件`,
                        },
                        { id: "is_enabled", header: "状態", accessor: "is_enabled", type: "boolean" },
                    ]}
                    actions={[
                        { id: "edit", label: "編集", onClick: (project) => handleEdit(project) },
                        { id: "delete", label: "削除", destructive: true, onClick: (project) => setDeleteTarget(project) },
                    ]}
                />
            </Card>

            {/* 作成・編集ダイアログ */}
            <Modal
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                title={editingProject ? "プロジェクト編集" : "プロジェクト新規作成"}
                size="lg"
                contentClassName="max-h-[90vh] overflow-y-auto"
                actions={[
                    { id: "cancel", label: "キャンセル", variant: "secondary", onClick: () => setIsDialogOpen(false) },
                    { id: "submit", label: editingProject ? "更新" : "作成", variant: "primary", onClick: handleSubmit },
                ]}
            >
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="プロジェクトコード"
                                required
                                fullWidth
                                value={formData.project_code}
                                onChange={(e) =>
                                    setFormData({ ...formData, project_code: e.target.value })
                                }
                                placeholder="PJ001"
                            />
                            <Input
                                label="プロジェクト名"
                                required
                                fullWidth
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                placeholder="○○プロジェクト"
                            />
                        </div>

                        <Input
                            label="プロジェクト説明"
                            fullWidth
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            placeholder="プロジェクトの説明"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="開始日"
                                fullWidth
                                type="date"
                                value={formData.start_date}
                                onChange={(e) =>
                                    setFormData({ ...formData, start_date: e.target.value })
                                }
                            />
                            <Input
                                label="終了日"
                                fullWidth
                                type="date"
                                value={formData.end_date}
                                onChange={(e) =>
                                    setFormData({ ...formData, end_date: e.target.value })
                                }
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Select
                                label="予約時間間隔"
                                fullWidth
                                value={formData.reservation_interval.toString()}
                                onChange={(value) =>
                                    setFormData({
                                        ...formData,
                                        reservation_interval: Number(value),
                                    })
                                }
                                options={[
                                { value: "20", label: "20分" },
                                { value: "30", label: "30分" },
                                { value: "60", label: "60分" },
                                ]}
                            />
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

                        <div className="grid grid-cols-2 gap-4">
                            <CheckboxGroup
                                label="対象店舗"
                                className="border rounded-md p-4 max-h-40 overflow-y-auto"
                            >
                                {stores.map((store) => (
                                    <Checkbox
                                        key={store.id}
                                        id={`store-${store.id}`}
                                        label={store.name}
                                        checked={formData.store_ids.includes(store.id)}
                                        onCheckedChange={() => toggleStoreId(store.id)}
                                    />
                                ))}
                            </CheckboxGroup>

                            <CheckboxGroup
                                label="対象学校"
                                className="border rounded-md p-4 max-h-40 overflow-y-auto"
                            >
                                {schools.map((school) => (
                                    <Checkbox
                                        key={school.id}
                                        id={`school-${school.id}`}
                                        label={school.name}
                                        checked={formData.school_ids.includes(school.id)}
                                        onCheckedChange={() => toggleSchoolId(school.id)}
                                    />
                                ))}
                            </CheckboxGroup>
                        </div>
                    </div>
            </Modal>

            {/* 削除確認ダイアログ */}
            <Modal
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="プロジェクトを削除しますか？"
                size="sm"
                actions={[
                    { id: "cancel", label: "キャンセル", variant: "secondary", onClick: () => !open && setDeleteTarget(null) },
                    { id: "action", label: "削除する", variant: "danger", onClick: handleDelete },
                ]}
            >
                <p className="text-sm text-gray-600 dark:text-gray-300">
                            この操作は取り消せません。プロジェクト「{deleteTarget?.name}」を削除してもよろしいですか？
                </p>
            </Modal>
        </div>
    )
}
