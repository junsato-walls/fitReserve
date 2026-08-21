"use client"

import Select from "@/components/base/forms/Select"
import { reservationCustomerSchema, validate } from "@/lib/validation"
import { formatDateForApi } from "@/lib/formatDate"
import {
    createReservation,
    getProjects,
    getSchedules,
    getSchools,
    getStores,
} from "@/actions/Reservation"
import Alert from "@/components/base/feedback/Alert"
import Button from "@/components/base/buttons/Button"
import Datepicker from "@/components/base/forms/Datepicker"
import Card from "@/components/base/layouts/Card"
import Input from "@/components/base/forms/Input"
import Textarea from "@/components/base/forms/Textarea"
import type {
    ProjectPublic,
    ReservationCreate,
    SchedulePublic,
    SchoolPublic,
    StorePublic,
} from "@/types/reservation"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

/** スケジュールを先読みする月数（カレンダーで移動できる範囲になる） */
const SCHEDULE_FETCH_MONTHS = 6

export const ReservationForm = () => {
    const router = useRouter()
    const searchParams = useSearchParams()

    // キャンペーンURL（例: /reservations/new?id=1&store=2）で
    // プロジェクトと店舗を事前指定できるようにする
    const projectIdParam = searchParams.get("id")
    const storeIdParam = searchParams.get("store")

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const errorRef = useRef<HTMLDivElement>(null)

    // URLで指定された項目は選択済みとして扱い、変更させない
    const [lockedProject, setLockedProject] = useState(false)
    const [lockedStore, setLockedStore] = useState(false)

    // マスタデータ
    const [projects, setProjects] = useState<ProjectPublic[]>([])
    const [stores, setStores] = useState<StorePublic[]>([])
    const [schools, setSchools] = useState<SchoolPublic[]>([])
    const [schedules, setSchedules] = useState<SchedulePublic[]>([])

    // 選択された値
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
    const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null)
    const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>()
    const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null)

    // 顧客情報
    const [customerInfo, setCustomerInfo] = useState<ReservationCreate>({
        project_id: null,
        store_id: 0,
        school_id: 0,
        reservation_date: "",
        reservation_time: "",
        customer_name: "",
        customer_name_kana: "",
        gender: "male",
        grade: undefined,
        phone: "",
        email: "",
        guardian_name: "",
        height: undefined,
        weight: undefined,
        foot_size: undefined,
        memo: "",
    })

    // 予約完了後の予約番号（設定されたら完了画面を表示する）
    const [reservationNumber, setReservationNumber] = useState<string | null>(null)

    // プロジェクト一覧を取得
    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true)
            const result = await getProjects()
            if (result.success && result.data) {
                setProjects(result.data)

                // URLで指定されたプロジェクトが受付中なら選択済みにする
                const paramId = Number(projectIdParam)
                if (paramId && result.data.some((p) => p.id === paramId)) {
                    setSelectedProjectId(paramId)
                    setLockedProject(true)
                }
            } else {
                setError(result.error || "プロジェクトの取得に失敗しました")
            }
            setLoading(false)
        }
        fetchProjects()
        // URLパラメータは初期表示時のみ反映する
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // プロジェクト選択時に店舗・学校を取得
    useEffect(() => {
        if (!selectedProjectId) {
            setStores([])
            setSchools([])
            return
        }

        const fetchData = async () => {
            setLoading(true)
            const [storesResult, schoolsResult] = await Promise.all([
                getStores(selectedProjectId),
                getSchools(selectedProjectId),
            ])

            if (storesResult.success && storesResult.data) {
                setStores(storesResult.data)

                // URLで指定された店舗が対象に含まれていれば選択済みにする
                const paramStoreId = Number(storeIdParam)
                if (
                    paramStoreId &&
                    !lockedStore &&
                    storesResult.data.some((s) => s.id === paramStoreId)
                ) {
                    setSelectedStoreId(paramStoreId)
                    setLockedStore(true)
                }
            }
            if (schoolsResult.success && schoolsResult.data) {
                setSchools(schoolsResult.data)
            }
            setLoading(false)
        }
        fetchData()
        // URLパラメータは初期表示時のみ反映する
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProjectId])

    // 店舗が決まった時点で、受付期間ぶんのスケジュールをまとめて取得する
    //
    // 表示月ごとに取り直す作りにすると「次の月に空きがあるか」が分からず、
    // 空き枠の無い月へ移動できてしまうため、先に全期間を取得しておく。
    useEffect(() => {
        if (!selectedStoreId) {
            setSchedules([])
            return
        }

        const fetchSchedules = async () => {
            setLoading(true)

            const today = new Date()
            const until = new Date(
                today.getFullYear(),
                today.getMonth() + SCHEDULE_FETCH_MONTHS,
                0
            )

            const result = await getSchedules(
                selectedStoreId,
                formatDateForApi(today),
                formatDateForApi(until)
            )

            setSchedules(result.success && result.data ? result.data : [])
            setLoading(false)
        }
        fetchSchedules()
    }, [selectedStoreId])

    // エラーは画面上部に出るが、送信ボタンは最下部にある。
    // そのままだとエラーに気づけないため、表示位置までスクロールする。
    useEffect(() => {
        if (error) errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, [error])

    // 入力し直したら、直前のエラー表示は消す
    // （1画面フォームでは画面上部のエラーが残り続けると、直した後も未入力に見えるため）
    useEffect(() => {
        setError(null)
    }, [
        selectedProjectId,
        selectedStoreId,
        selectedSchoolId,
        selectedScheduleId,
        // どの項目を直してもエラーを消したいので、顧客情報はまとめて監視する
        customerInfo,
    ])

    /** 予約可能な枠が残っている日付（yyyy-MM-dd）の集合 */
    const availableDates = useMemo(() => {
        return new Set(
            schedules
                .filter((s) => s.is_available && s.available_count > 0)
                .map((s) => s.schedule_date)
        )
    }, [schedules])

    /** 予約可能な日付をDateの配列にしたもの（Datepickerへ渡す） */
    const selectableDates = useMemo(
        () => Array.from(availableDates).map((date) => {
            const [year, month, day] = date.split("-").map(Number)
            return new Date(year, month - 1, day)
        }),
        [availableDates]
    )

    const selectedProject = projects.find((p) => p.id === selectedProjectId)
    const selectedStore = stores.find((s) => s.id === selectedStoreId)
    const selectedSchool = schools.find((s) => s.id === selectedSchoolId)
    const selectedSchedule = schedules.find((s) => s.id === selectedScheduleId)

    /**
     * 予約できる日付の範囲
     *
     * SPECIFICATION.md BL-2「プロジェクトの開始日〜終了日の範囲内のみ予約可能」
     * かつ「過去の日時は予約不可」に従う。
     */
    const reservableFrom = useMemo(() => {
        const today = new Date()
        if (!selectedProject) return today
        const [year, month, day] = selectedProject.start_date.split("-").map(Number)
        const projectStart = new Date(year, month - 1, day)
        // 受付開始が過去なら今日から
        return projectStart > today ? projectStart : today
    }, [selectedProject])

    const reservableUntil = useMemo(() => {
        if (!selectedProject) return undefined
        const [year, month, day] = selectedProject.end_date.split("-").map(Number)
        return new Date(year, month - 1, day)
    }, [selectedProject])

    /** 選択された日付の時間帯 */
    const dateSchedules = selectedDate
        ? schedules.filter((s) => s.schedule_date === formatDateForApi(selectedDate))
        : []

    /** キャンペーンを変えると対象の店舗・学校が変わるため、以降の選択を解除する */
    const handleProjectChange = (value: string) => {
        setSelectedProjectId(Number(value))
        setSelectedStoreId(null)
        setSelectedSchoolId(null)
        setSelectedDate(undefined)
        setSelectedScheduleId(null)
    }

    /** 店舗を変えると空き状況が変わるため、日時の選択を解除する */
    const handleStoreChange = (value: string) => {
        setSelectedStoreId(Number(value))
        setSelectedDate(undefined)
        setSelectedScheduleId(null)
    }

    /** 日付を変更したら時間帯の選択は解除する */
    const handleDateSelect = (value: string) => {
        if (!value) {
            setSelectedDate(undefined)
        } else {
            const [year, month, day] = value.split("-").map(Number)
            setSelectedDate(new Date(year, month - 1, day))
        }
        setSelectedScheduleId(null)
    }

    const handleSubmit = async () => {
        // 1画面に全項目が並ぶため、未入力があれば何が足りないかを明示する
        if (!selectedProjectId) return setError("キャンペーンを選択してください")
        if (!selectedStoreId) return setError("店舗を選択してください")
        if (!selectedSchoolId) return setError("学校を選択してください")
        if (!selectedSchedule) return setError("予約日時を選択してください")

        const validationError = validate(reservationCustomerSchema, {
            customer_name: customerInfo.customer_name,
            customer_name_kana: customerInfo.customer_name_kana || undefined,
            gender: customerInfo.gender,
            grade: customerInfo.grade,
            height: customerInfo.height,
            weight: customerInfo.weight,
            foot_size: customerInfo.foot_size,
            phone: customerInfo.phone,
            email: customerInfo.email || undefined,
            guardian_name: customerInfo.guardian_name || undefined,
            memo: customerInfo.memo || undefined,
        })
        if (validationError) return setError(validationError)

        setLoading(true)
        setError(null)

        const data: ReservationCreate = {
            ...customerInfo,
            project_id: selectedProjectId,
            store_id: selectedStoreId,
            school_id: selectedSchoolId,
            reservation_date: selectedSchedule.schedule_date,
            reservation_time: selectedSchedule.start_time,
        }

        const result = await createReservation(data)
        setLoading(false)

        if (result.success && result.data) {
            setReservationNumber(result.data.reservation_number)
        } else {
            setError(result.error || "予約の作成に失敗しました")
        }
    }

    // ---------------------------------------------------------------- 完了画面
    if (reservationNumber) {
        return (
            <Card className="max-w-2xl mx-auto" title="予約完了">
                <div className="space-y-4">
                    <Alert type="success" message="予約が完了しました。以下の予約番号を控えてください。" />
                    <div className="text-center space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">予約番号</p>
                            <p className="text-3xl font-bold text-blue-600">{reservationNumber}</p>
                        </div>
                        <div className="space-y-2 text-sm">
                            <p>予約日時: {selectedSchedule?.schedule_date} {selectedSchedule?.start_time}</p>
                            <p>店舗: {selectedStore?.name}</p>
                            <p>学校: {selectedSchool?.name}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => router.push("/")} label="トップへ戻る" />
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/reservations/check?number=${reservationNumber}`)} label="予約内容を確認" />
                    </div>
                </div>
            </Card>
        )
    }

    // ---------------------------------------------------------------- 入力画面
    return (
        <Card
            className="max-w-4xl mx-auto"
            title="採寸予約フォーム"
            description="必要事項をご入力のうえ、最後に「予約を確定する」を押してください。"
        >
            <div className="space-y-8">
                <div ref={errorRef}>
                    {error && <Alert type="error" message={error} />}
                </div>

                {/* 予約対象 */}
                <section className="space-y-4">
                    <h3 className="text-base font-semibold text-gray-900">予約対象</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="キャンペーン"
                            required
                            fullWidth
                            placeholder="キャンペーンを選択"
                            disabled={lockedProject}
                            value={selectedProjectId?.toString() || ""}
                            onChange={handleProjectChange}
                            options={projects.map((project) => ({
                                value: project.id.toString(),
                                label: project.name,
                            }))}
                            helperText={selectedProject?.description || undefined}
                        />

                        <Select
                            label="店舗"
                            required
                            fullWidth
                            placeholder="店舗を選択"
                            disabled={lockedStore || !selectedProjectId}
                            value={selectedStoreId?.toString() || ""}
                            onChange={handleStoreChange}
                            options={stores.map((store) => ({
                                value: store.id.toString(),
                                label: `${store.name} - ${store.address}`,
                            }))}
                            helperText={!selectedProjectId ? "先にキャンペーンを選択してください" : undefined}
                        />

                        <Select
                            label="学校"
                            required
                            fullWidth
                            placeholder="学校を選択"
                            disabled={!selectedProjectId}
                            value={selectedSchoolId?.toString() || ""}
                            onChange={(value) => setSelectedSchoolId(Number(value))}
                            options={schools.map((school) => ({
                                value: school.id.toString(),
                                label: `${school.name} (${school.school_type})`,
                            }))}
                            helperText={!selectedProjectId ? "先にキャンペーンを選択してください" : undefined}
                        />
                    </div>
                </section>

                {/* 予約日時 */}
                <section className="space-y-4 border-t pt-6">
                    <h3 className="text-base font-semibold text-gray-900">予約日時</h3>

                    {!selectedStoreId ? (
                        <p className="text-sm text-gray-500">
                            店舗を選択すると、予約できる日が表示されます。
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Datepicker
                                inline
                                label="予約日"
                                helperText="空き枠のある日付のみ選択できます（グレー表示の日は予約できません）"
                                value={selectedDate ?? null}
                                // 過去日とプロジェクト受付期間外は選べない
                                minDate={reservableFrom}
                                maxDate={reservableUntil}
                                availableDates={selectableDates}
                                onChange={(event) => handleDateSelect(event.target.value)}
                            />

                            <div>
                                <p className="block text-sm font-medium text-gray-700 mb-1">
                                    時間帯
                                    <span className="text-red-500 ml-1">*</span>
                                </p>

                                {!selectedDate ? (
                                    <p className="text-sm text-gray-500">
                                        予約日を選択すると、空いている時間帯が表示されます。
                                    </p>
                                ) : dateSchedules.length === 0 ? (
                                    <Alert
                                        type="warning"
                                        message="選択した日付は予約可能な時間帯がありません。別の日付を選択してください。"
                                    />
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {dateSchedules.map((schedule) => (
                                            <Button
                                                key={schedule.id}
                                                type="button"
                                                label={schedule.start_time.substring(0, 5)}
                                                subLabel={schedule.available_count > 0 ? `残り${schedule.available_count}` : "満席"}
                                                selected={selectedScheduleId === schedule.id}
                                                onClick={() => setSelectedScheduleId(schedule.id)}
                                                disabled={schedule.available_count === 0}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </section>

                {/* お客様情報 */}
                <section className="space-y-4 border-t pt-6">
                    <h3 className="text-base font-semibold text-gray-900">お客様情報</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="お名前"
                            required
                            fullWidth
                            value={customerInfo.customer_name}
                            onChange={(e) =>
                                setCustomerInfo({ ...customerInfo, customer_name: e.target.value })
                            }
                            placeholder="山田太郎"
                        />
                        <Input
                            label="お名前（カナ）"
                            fullWidth
                            value={customerInfo.customer_name_kana}
                            onChange={(e) =>
                                setCustomerInfo({ ...customerInfo, customer_name_kana: e.target.value })
                            }
                            placeholder="ヤマダタロウ"
                        />
                        <Select
                            label="性別"
                            required
                            fullWidth
                            value={customerInfo.gender}
                            onChange={(value) =>
                                setCustomerInfo({ ...customerInfo, gender: value })
                            }
                            options={[
                                { value: "male", label: "男性" },
                                { value: "female", label: "女性" },
                                { value: "other", label: "その他" },
                            ]}
                        />
                        <Input
                            label="学年"
                            fullWidth
                            type="number"
                            min={1}
                            max={12}
                            value={customerInfo.grade ?? ""}
                            onChange={(e) =>
                                setCustomerInfo({
                                    ...customerInfo,
                                    grade: e.target.value ? Number(e.target.value) : undefined,
                                })
                            }
                            placeholder="1"
                        />
                        <Input
                            label="電話番号"
                            required
                            fullWidth
                            type="tel"
                            value={customerInfo.phone}
                            onChange={(e) =>
                                setCustomerInfo({ ...customerInfo, phone: e.target.value })
                            }
                            placeholder="090-1234-5678"
                        />
                        <Input
                            label="メールアドレス"
                            fullWidth
                            type="email"
                            value={customerInfo.email}
                            onChange={(e) =>
                                setCustomerInfo({ ...customerInfo, email: e.target.value })
                            }
                            placeholder="example@example.com"
                        />
                        <Input
                            label="保護者氏名"
                            fullWidth
                            value={customerInfo.guardian_name}
                            onChange={(e) =>
                                setCustomerInfo({ ...customerInfo, guardian_name: e.target.value })
                            }
                            placeholder="山田花子"
                        />
                    </div>
                </section>

                {/* 採寸情報 */}
                <section className="space-y-4 border-t pt-6">
                    <h3 className="text-base font-semibold text-gray-900">採寸情報（任意）</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                            label="身長（cm）"
                            fullWidth
                            type="number"
                            value={customerInfo.height || ""}
                            onChange={(e) =>
                                setCustomerInfo({
                                    ...customerInfo,
                                    height: e.target.value ? parseFloat(e.target.value) : undefined,
                                })
                            }
                            placeholder="165"
                        />
                        <Input
                            label="体重（kg）"
                            fullWidth
                            type="number"
                            value={customerInfo.weight || ""}
                            onChange={(e) =>
                                setCustomerInfo({
                                    ...customerInfo,
                                    weight: e.target.value ? parseFloat(e.target.value) : undefined,
                                })
                            }
                            placeholder="55"
                        />
                        <Input
                            label="足のサイズ（cm）"
                            fullWidth
                            type="number"
                            step="0.5"
                            value={customerInfo.foot_size || ""}
                            onChange={(e) =>
                                setCustomerInfo({
                                    ...customerInfo,
                                    foot_size: e.target.value ? parseFloat(e.target.value) : undefined,
                                })
                            }
                            placeholder="25.5"
                        />
                    </div>

                    <Textarea
                        label="備考"
                        fullWidth
                        value={customerInfo.memo}
                        onChange={(e) =>
                            setCustomerInfo({ ...customerInfo, memo: e.target.value })
                        }
                        placeholder="ご要望などがあればご記入ください"
                    />
                </section>

                {/* 確認して送信 */}
                <section className="space-y-4 border-t pt-6">
                    <h3 className="text-base font-semibold text-gray-900">予約内容の確認</h3>

                    <dl className="grid grid-cols-[8rem_1fr] gap-y-2 rounded border p-4 text-sm">
                        <dt className="text-gray-500">キャンペーン</dt>
                        <dd>{selectedProject?.name ?? "未選択"}</dd>
                        <dt className="text-gray-500">店舗</dt>
                        <dd>{selectedStore?.name ?? "未選択"}</dd>
                        <dt className="text-gray-500">学校</dt>
                        <dd>{selectedSchool?.name ?? "未選択"}</dd>
                        <dt className="text-gray-500">予約日時</dt>
                        <dd>
                            {selectedSchedule
                                ? `${selectedSchedule.schedule_date} ${selectedSchedule.start_time.substring(0, 5)}`
                                : "未選択"}
                        </dd>
                        <dt className="text-gray-500">お名前</dt>
                        <dd>{customerInfo.customer_name || "未入力"}</dd>
                        <dt className="text-gray-500">電話番号</dt>
                        <dd>{customerInfo.phone || "未入力"}</dd>
                    </dl>

                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        label="予約を確定する"
                        loadingLabel="予約中..."
                        isLoading={loading}
                    />
                </section>
            </div>
        </Card>
    )
}
