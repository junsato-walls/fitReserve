"use client"

import { Table } from "@/components/base/display/Table"
import { Select } from "@/components/base/forms/Select"
import { Modal } from "@/components/base/overlays/Modal"
import { projectSchema, validate } from "@/lib/validation"
import { createProject, deleteProject, getProjectsAdmin, updateProject } from "@/api/Project"
import { getCompanies } from "@/api/Company"
import { getSchoolDivisions } from "@/api/School"
import { getStoresAdmin } from "@/api/Store"
import { Alert } from "@/components/base/feedback/Alert"
import { Button } from "@/components/base/buttons/Button"
import { Card } from "@/components/base/display/Card"
import { Checkbox } from "@/components/base/forms/Checkbox"
import { CheckboxGroup } from "@/components/base/forms/CheckboxGroup"
import { CopyButton } from "@/components/base/buttons/CopyButton"
import { Input } from "@/components/base/forms/Input"
import type { Company, Project, SchoolDivision, SchoolDivisionPeriod, Store } from "@/types/admin"
import { useEffect, useState } from "react"

/** 学校区分ごとの受付期間の入力状態。チェックが外れている区分は送信しない */
interface DivisionPeriodInput {
    checked: boolean
    start_date: string
    end_date: string
}

export const ProjectManagement = () => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [projects, setProjects] = useState<Project[]>([])
    const [stores, setStores] = useState<Store[]>([])
    const [companies, setCompanies] = useState<Company[]>([])
    const [divisions, setDivisions] = useState<SchoolDivision[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingProject, setEditingProject] = useState<Project | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
    const [urlTarget, setUrlTarget] = useState<Project | null>(null)

    const [formData, setFormData] = useState({
        company_id: 0,
        project_code: "",
        name: "",
        description: "",
        reservation_interval: 30,
        is_enabled: true,
        store_ids: [] as number[],
    })

    // 区分IDをキーにした受付期間の入力状態
    const [periods, setPeriods] = useState<Record<number, DivisionPeriodInput>>({})

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        setError(null)

        // 互いに依存しないので並列で取得する
        const [projectsResult, storesResult, companiesResult, divisionsResult] = await Promise.all([
            getProjectsAdmin(),
            getStoresAdmin(),
            getCompanies(),
            getSchoolDivisions(),
        ])

        setLoading(false)

        if (projectsResult.success && projectsResult.data) {
            setProjects(projectsResult.data)
        } else {
            setError(projectsResult.error || "プロジェクト一覧の取得に失敗しました")
        }

        if (storesResult.success && storesResult.data) setStores(storesResult.data)
        if (companiesResult.success && companiesResult.data) {
            setCompanies(companiesResult.data)
        }
        if (divisionsResult.success && divisionsResult.data) {
            setDivisions(divisionsResult.data)
        }
    }

    /** 保存済みの受付期間を入力状態に展開する（未設定の区分はチェック無し） */
    const toPeriodInputs = (saved: SchoolDivisionPeriod[]) => {
        const next: Record<number, DivisionPeriodInput> = {}
        for (const division of divisions) {
            const hit = saved.find((p) => p.school_divisions_id === division.id)
            next[division.id] = {
                checked: Boolean(hit),
                start_date: hit?.start_date ?? "",
                end_date: hit?.end_date ?? "",
            }
        }
        return next
    }

    const handleCreate = () => {
        setEditingProject(null)
        setFormData({
            company_id: companies[0]?.id ?? 0,
            project_code: "",
            name: "",
            description: "",
            reservation_interval: 30,
            is_enabled: true,
            store_ids: [],
        })
        setPeriods(toPeriodInputs([]))
        setIsDialogOpen(true)
    }

    const handleEdit = (project: Project) => {
        setEditingProject(project)
        setFormData({
            company_id: project.company_id,
            project_code: project.project_code,
            name: project.name,
            description: project.description || "",
            reservation_interval: project.reservation_interval || 30,
            is_enabled: project.is_enabled,
            store_ids: project.store_ids || [],
        })
        setPeriods(toPeriodInputs(project.school_divisions || []))
        setIsDialogOpen(true)
    }

    const handleSubmit = async () => {
        setError(null)
        setSuccess(null)

        // チェックされた区分だけを受付期間として送る
        const schoolDivisions: SchoolDivisionPeriod[] = divisions
            .filter((d) => periods[d.id]?.checked)
            .map((d) => ({
                school_divisions_id: d.id,
                start_date: periods[d.id].start_date,
                end_date: periods[d.id].end_date,
            }))

        const data = {
            company_id: formData.company_id,
            project_code: formData.project_code,
            name: formData.name,
            description: formData.description || undefined,
            reservation_interval: formData.reservation_interval,
            is_enabled: formData.is_enabled,
            store_ids: formData.store_ids.length > 0 ? formData.store_ids : undefined,
            school_divisions: schoolDivisions,
        }

        const validationError = validate(projectSchema, {
            project_code: data.project_code,
            name: data.name,
            description: data.description,
            reservation_interval: data.reservation_interval,
            is_enabled: data.is_enabled,
            school_divisions: schoolDivisions,
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
            setSuccess(editingProject ? "プロジェクトを更新しました" : "プロジェクトを作成しました")
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

    const updatePeriod = (divisionId: number, patch: Partial<DivisionPeriodInput>) => {
        setPeriods((prev) => ({
            ...prev,
            [divisionId]: {
                ...(prev[divisionId] ?? {
                    checked: false,
                    start_date: "",
                    end_date: "",
                }),
                ...patch,
            },
        }))
    }

    /**
     * 予約受付URLを組み立てる
     *
     * ホームページに掲載してもらうためのURL。店舗ごとに1本になる。
     * 対象店舗が未指定のプロジェクトは全店舗が対象という仕様。
     */
    const buildReservationUrls = (project: Project) => {
        const slug = companies.find((c) => c.id === project.company_id)?.slug
        if (!slug) return []

        const targets =
            project.store_ids.length > 0
                ? stores.filter((s) => project.store_ids.includes(s.id))
                : stores

        const origin = typeof window === "undefined" ? "" : window.location.origin
        return targets.map((store) => ({
            store,
            url: `${origin}/${slug}/${project.id}/${store.id}`,
        }))
    }

    const getCompanyName = (companyId: number) =>
        companies.find((c) => c.id === companyId)?.name ?? String(companyId)

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">プロジェクト管理</h1>
                <Button onClick={handleCreate} label="新規作成" />
            </div>

            {success && <Alert tone="success" message={success} />}
            {error && <Alert tone="danger" message={error} />}

            <Card title={`プロジェクト一覧（${projects.length}件）`}>
                <Table
                    data={projects}
                    loading={loading}
                    emptyMessage="プロジェクトが見つかりません"
                    getRowId={(project) => project.id}
                    columns={[
                        {
                            id: "project_code",
                            header: "プロジェクトコード",
                            accessor: "project_code",
                        },
                        { id: "name", header: "プロジェクト名", accessor: "name" },
                        {
                            id: "company_id",
                            header: "会社",
                            accessor: "company_id",
                            format: (value) => getCompanyName(Number(value)),
                        },
                        {
                            id: "period",
                            header: "受付期間",
                            accessor: "start_date",
                            // 期間は学校区分ごとに持つため、一覧では全区分の最早〜最遅を出す
                            format: (_value, row) =>
                                row.start_date ? `${row.start_date} 〜 ${row.end_date}` : "未設定",
                        },
                        {
                            id: "is_accepting",
                            header: "受付",
                            accessor: "is_accepting",
                            format: (value) => (value ? "受付中" : "受付外"),
                        },
                        {
                            id: "store_ids",
                            header: "対象店舗",
                            accessor: "store_ids",
                            format: (value) => {
                                const ids = value as number[] | undefined
                                return ids && ids.length > 0 ? `${ids.length}件` : "全店舗"
                            },
                        },
                        {
                            id: "school_divisions",
                            header: "区分数",
                            accessor: "school_divisions",
                            format: (value) =>
                                `${(value as SchoolDivisionPeriod[] | undefined)?.length ?? 0}件`,
                        },
                        {
                            id: "is_enabled",
                            header: "状態",
                            accessor: "is_enabled",
                            type: "boolean",
                        },
                    ]}
                    actions={[
                        {
                            id: "url",
                            label: "予約URL",
                            onClick: (project) => setUrlTarget(project),
                        },
                        { id: "edit", label: "編集", onClick: (project) => handleEdit(project) },
                        {
                            id: "delete",
                            label: "削除",
                            destructive: true,
                            onClick: (project) => setDeleteTarget(project),
                        },
                    ]}
                />
            </Card>

            {/* 作成・編集ダイアログ */}
            <Modal
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                title={editingProject ? "プロジェクト編集" : "プロジェクト新規作成"}
                size="lg"
                scrollableBody
                actions={[
                    {
                        id: "cancel",
                        label: "キャンセル",
                        tone: "neutral" as const,
                        variant: "outlined" as const,
                        onClick: () => setIsDialogOpen(false),
                    },
                    {
                        id: "submit",
                        label: editingProject ? "更新" : "作成",
                        tone: "info" as const,
                        variant: "filled" as const,
                        onClick: handleSubmit,
                    },
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
                            placeholder="PRJ-001"
                        />
                        <Select
                            label="会社 *"
                            fullWidth
                            value={formData.company_id}
                            onChange={(value) =>
                                setFormData({ ...formData, company_id: Number(value) })
                            }
                            options={companies.map((c) => ({
                                value: c.id,
                                label: `${c.name}（${c.slug}）`,
                            }))}
                        />
                    </div>

                    <Input
                        label="プロジェクト名"
                        required
                        fullWidth
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="2026年度 新入生制服採寸"
                    />

                    <Input
                        label="説明"
                        fullWidth
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="プロジェクトの説明"
                    />

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

                    <CheckboxGroup label="対象店舗" bordered scrollable>
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
                    <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
                        取り扱う学校は店舗ごとに設定します（店舗管理から登録）。
                        未選択の場合は全店舗が対象になります。
                    </p>

                    {/* 予約受付期間は学校区分ごとに異なるため、区分単位で設定する */}
                    <div className="border rounded-md p-4 space-y-3 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            予約受付期間（学校区分ごと）*
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            チェックした区分だけが受付対象になります。
                            チェックを外した区分の学校は予約できません。
                        </p>
                        {divisions.map((division) => {
                            const period = periods[division.id]
                            return (
                                <div
                                    key={division.id}
                                    className="grid grid-cols-[10rem_1fr_1fr] gap-3 items-end"
                                >
                                    <Checkbox
                                        id={`division-${division.id}`}
                                        label={division.name}
                                        checked={period?.checked ?? false}
                                        onCheckedChange={(checked) =>
                                            updatePeriod(division.id, { checked })
                                        }
                                    />
                                    <Input
                                        label="受付開始日"
                                        type="date"
                                        fullWidth
                                        disabled={!period?.checked}
                                        value={period?.start_date ?? ""}
                                        onChange={(e) =>
                                            updatePeriod(division.id, {
                                                start_date: e.target.value,
                                            })
                                        }
                                    />
                                    <Input
                                        label="受付終了日"
                                        type="date"
                                        fullWidth
                                        disabled={!period?.checked}
                                        value={period?.end_date ?? ""}
                                        onChange={(e) =>
                                            updatePeriod(division.id, {
                                                end_date: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            )
                        })}
                    </div>
                </div>
            </Modal>

            {/* 予約受付URL */}
            <Modal
                open={urlTarget !== null}
                onOpenChange={(open) => !open && setUrlTarget(null)}
                title="予約受付URL"
                size="lg"
                actions={[
                    {
                        id: "close",
                        label: "閉じる",
                        tone: "neutral" as const,
                        variant: "outlined" as const,
                        onClick: () => setUrlTarget(null),
                    },
                ]}
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        店舗ごとの予約受付URLです。ホームページに掲載してください。
                    </p>
                    {urlTarget && !urlTarget.is_accepting && (
                        <Alert
                            tone="warning"
                            message="このプロジェクトは現在受付期間外です。URLを開いても予約できません。"
                        />
                    )}
                    <div className="space-y-2">
                        {urlTarget &&
                            buildReservationUrls(urlTarget).map(({ store, url }) => (
                                <div
                                    key={store.id}
                                    className="flex items-center gap-3 border rounded-md p-3 dark:border-gray-700"
                                >
                                    <span className="w-32 shrink-0 text-sm font-medium text-gray-900 dark:text-white">
                                        {store.name}
                                    </span>
                                    <code className="flex-1 text-xs break-all text-gray-600 dark:text-gray-300">
                                        {url}
                                    </code>
                                    <CopyButton text={url} size="sm" variant="outlined" />
                                </div>
                            ))}
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
                    {
                        id: "cancel",
                        label: "キャンセル",
                        tone: "neutral" as const,
                        variant: "outlined" as const,
                        onClick: () => setDeleteTarget(null),
                    },
                    {
                        id: "action",
                        label: "削除する",
                        tone: "danger" as const,
                        variant: "filled" as const,
                        onClick: handleDelete,
                    },
                ]}
            >
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    この操作は取り消せません。プロジェクト「{deleteTarget?.name}
                    」を削除してもよろしいですか？
                </p>
            </Modal>
        </div>
    )
}
