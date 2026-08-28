"use client"

import {
    createReservation,
    getReservationProject,
    getSchedules,
    getSchools,
    getStore,
} from "@/api/Reservation"
import { Button } from "@/components/base/buttons/Button";
import { Card } from "@/components/base/display/Card";
import { Alert } from "@/components/base/feedback/Alert";
import { Datepicker } from "@/components/base/forms/Datepicker";
import { Input } from "@/components/base/forms/Input";
import { Select } from "@/components/base/forms/Select";
import { Textarea } from "@/components/base/forms/Textarea";
import { formatDateForApi } from "@/lib/formatDate"
import { reservationCustomerSchema, validate } from "@/lib/validation"
import type {
    ProjectPublic,
    ReservationCreate,
    SchedulePublic,
    SchoolPublic,
    StorePublic,
} from "@/types/reservation"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

/** スケジュールを先読みする月数（カレンダーで移動できる範囲になる） */
const SCHEDULE_FETCH_MONTHS = 6

interface ReservationFormProps {
    /** 予約URL /[company_slug]/[project_id]/[store_id] の会社スラッグ */
    companySlug: string
    projectId: number
    storeId: number
}

/**
 * 採寸予約フォーム
 *
 * プロジェクトと店舗はURLで決まるため、お客様が選ぶのは
 * 「学校 → 予約日時 → お客様情報」の3つだけになる。
 *
 * 選べる学校は次の2つを満たすものに限られる。
 *   - その店舗が制服を取り扱っている（store_schools）
 *   - 学校の区分が本日受付中である（project_school_divisions）
 */
export const ReservationForm = ({
    companySlug,
    projectId,
    storeId,
}: ReservationFormProps) => {
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    /** URL自体が不正な場合のエラー。フォームを出さずにこれだけを表示する */
    const [fatalError, setFatalError] = useState<string | null>(null)
    const errorRef = useRef<HTMLDivElement>(null)

    // URLから確定するデータ
    const [project, setProject] = useState<ProjectPublic | null>(null)
    const [store, setStore] = useState<StorePublic | null>(null)
    const [schools, setSchools] = useState<SchoolPublic[]>([])
    const [schedules, setSchedules] = useState<SchedulePublic[]>([])

    // 選択された値
    const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>()
    const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null)

    // 顧客情報
    const [customerInfo, setCustomerInfo] = useState<ReservationCreate>({
        project_id: projectId,
        store_id: storeId,
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

    // URLの妥当性検証と、必要なデータの取得
    //
    // プロジェクト・店舗・学校・空き枠は互いに依存しないため並列で取得する。
    // 会社とプロジェクトと店舗の組み合わせが不正な場合はAPI側が404を返す。
    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true)

            const today = new Date()
            const until = new Date(
                today.getFullYear(),
                today.getMonth() + SCHEDULE_FETCH_MONTHS,
                0
            )

            const [projectResult, storeResult, schoolsResult, schedulesResult] =
                await Promise.all([
                    getReservationProject(companySlug, projectId, storeId),
                    getStore(storeId),
                    getSchools(storeId, projectId),
                    getSchedules(
                        storeId,
                        formatDateForApi(today),
                        formatDateForApi(until)
                    ),
                ])

            setLoading(false)

            if (!projectResult.success || !projectResult.data) {
                setFatalError(
                    projectResult.error || "この予約URLは無効です。URLをご確認ください。"
                )
                return
            }
            setProject(projectResult.data)

            if (storeResult.success && storeResult.data) setStore(storeResult.data)
            if (schoolsResult.success && schoolsResult.data) {
                setSchools(schoolsResult.data)
            }
            setSchedules(
                schedulesResult.success && schedulesResult.data
                    ? schedulesResult.data
                    : []
            )
        }
        fetchAll()
    }, [companySlug, projectId, storeId])

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

    const selectedSchool = schools.find((s) => s.id === selectedSchoolId)
    const selectedSchedule = schedules.find((s) => s.id === selectedScheduleId)

    /** 選択中の学校の区分に対応する受付期間 */
    const acceptingPeriod = useMemo(() => {
        if (!project || !selectedSchool) return undefined
        return project.accepting_divisions.find(
            (d) => d.school_divisions_id === selectedSchool.school_divisions_id
        )
    }, [project, selectedSchool])

    /** 区分IDから区分名を引く（学校の選択肢に添える） */
    const divisionName = (divisionId: number) =>
        project?.accepting_divisions.find((d) => d.school_divisions_id === divisionId)
            ?.name ?? ""

    /**
     * 予約できる日付の範囲
     *
     * 受付期間は学校区分ごとに異なるため、選択された学校の区分の期間を使う。
     * SPECIFICATION.md BL-2「受付期間の範囲内のみ予約可能」かつ
     * 「過去の日時は予約不可」に従う。
     */
    const reservableFrom = useMemo(() => {
        const today = new Date()
        if (!acceptingPeriod) return today
        const [year, month, day] = acceptingPeriod.start_date.split("-").map(Number)
        const periodStart = new Date(year, month - 1, day)
        // 受付開始が過去なら今日から
        return periodStart > today ? periodStart : today
    }, [acceptingPeriod])

    const reservableUntil = useMemo(() => {
        if (!acceptingPeriod) return undefined
        const [year, month, day] = acceptingPeriod.end_date.split("-").map(Number)
        return new Date(year, month - 1, day)
    }, [acceptingPeriod])

    /** 選択された日付の時間帯 */
    const dateSchedules = selectedDate
        ? schedules.filter((s) => s.schedule_date === formatDateForApi(selectedDate))
        : []

    /** 学校を変えると受付期間が変わるため、日時の選択を解除する */
    const handleSchoolChange = (value: string) => {
        setSelectedSchoolId(Number(value))
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
            project_id: projectId,
            store_id: storeId,
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
                            <p className="text-sm text-gray-500 dark:text-gray-400">予約番号</p>
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{reservationNumber}</p>
                        </div>
                        <div className="space-y-2 text-sm">
                            <p>予約日時: {selectedSchedule?.schedule_date} {selectedSchedule?.start_time}</p>
                            <p>店舗: {store?.name}</p>
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

    // ------------------------------------------------------------ URLが不正
    if (fatalError) {
        return (
            <Card className="max-w-2xl mx-auto" title="予約ページを表示できません">
                <div className="space-y-4">
                    <Alert type="error" message={fatalError} />
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        お手数ですが、掲載元のホームページからもう一度お進みください。
                    </p>
                </div>
            </Card>
        )
    }

    // 受付中の区分が1つも無ければ、選べる日も学校も存在しない
    const isAccepting = (project?.accepting_divisions.length ?? 0) > 0

    // ---------------------------------------------------------------- 入力画面
    return (
        <Card
            className="max-w-4xl mx-auto"
            title={project ? `${project.name}｜採寸予約` : "採寸予約フォーム"}
            description={
                store
                    ? `${store.name}での採寸予約です。必要事項をご入力のうえ、最後に「予約を確定する」を押してください。`
                    : "必要事項をご入力のうえ、最後に「予約を確定する」を押してください。"
            }
        >
            <div className="space-y-8">
                <div ref={errorRef}>
                    {error && <Alert type="error" message={error} />}
                </div>

                {!loading && !isAccepting && (
                    <Alert
                        type="warning"
                        message="現在は予約受付期間外です。受付開始までお待ちください。"
                    />
                )}

                {/* 予約対象 */}
                <section className="space-y-4">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">予約対象</h3>

                    {/* プロジェクトと店舗はURLで確定しているため、変更させない */}
                    <dl className="grid grid-cols-[8rem_1fr] gap-y-2 rounded border p-4 text-sm dark:border-gray-700">
                        <dt className="text-gray-500 dark:text-gray-400">キャンペーン</dt>
                        <dd>{project?.name ?? "-"}</dd>
                        <dt className="text-gray-500 dark:text-gray-400">店舗</dt>
                        <dd>{store?.name ?? "-"}</dd>
                    </dl>

                    <Select
                        label="学校"
                        required
                        fullWidth
                        placeholder="学校を選択"
                        disabled={!isAccepting || schools.length === 0}
                        value={selectedSchoolId?.toString() || ""}
                        onChange={handleSchoolChange}
                        options={schools.map((school) => ({
                            value: school.id.toString(),
                            label: divisionName(school.school_divisions_id)
                                ? `${school.name}（${divisionName(school.school_divisions_id)}）`
                                : school.name,
                        }))}
                        helperText={
                            isAccepting && schools.length === 0
                                ? "この店舗で予約できる学校がありません。"
                                : "この店舗で制服を取り扱っている学校のみ表示されます。"
                        }
                    />

                    {acceptingPeriod && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {acceptingPeriod.name}の受付期間：
                            {acceptingPeriod.start_date} 〜 {acceptingPeriod.end_date}
                        </p>
                    )}
                </section>

                {/* 予約日時 */}
                <section className="space-y-4 border-t pt-6">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">予約日時</h3>

                    {!selectedSchoolId ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            学校を選択すると、予約できる日が表示されます。
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
                                <p className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                    時間帯
                                    <span className="text-red-500 dark:text-red-400 ml-1">*</span>
                                </p>

                                {!selectedDate ? (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
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
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">お客様情報</h3>

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
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">採寸情報（任意）</h3>

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
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">予約内容の確認</h3>

                    <dl className="grid grid-cols-[8rem_1fr] gap-y-2 rounded border p-4 text-sm">
                        <dt className="text-gray-500 dark:text-gray-400">キャンペーン</dt>
                        <dd>{project?.name ?? "-"}</dd>
                        <dt className="text-gray-500 dark:text-gray-400">店舗</dt>
                        <dd>{store?.name ?? "-"}</dd>
                        <dt className="text-gray-500 dark:text-gray-400">学校</dt>
                        <dd>{selectedSchool?.name ?? "未選択"}</dd>
                        <dt className="text-gray-500 dark:text-gray-400">予約日時</dt>
                        <dd>
                            {selectedSchedule
                                ? `${selectedSchedule.schedule_date} ${selectedSchedule.start_time.substring(0, 5)}`
                                : "未選択"}
                        </dd>
                        <dt className="text-gray-500 dark:text-gray-400">お名前</dt>
                        <dd>{customerInfo.customer_name || "未入力"}</dd>
                        <dt className="text-gray-500 dark:text-gray-400">電話番号</dt>
                        <dd>{customerInfo.phone || "未入力"}</dd>
                    </dl>

                    <Button
                        onClick={handleSubmit}
                        disabled={loading || !isAccepting}
                        label="予約を確定する"
                        loadingLabel="予約中..."
                        isLoading={loading}
                    />
                </section>
            </div>
        </Card>
    )
}
