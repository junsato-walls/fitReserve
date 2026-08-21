"use client"

import Modal from "@/components/base/overlays/Modal"
import type { ReservationWithDetails } from "@/types/reservation"
import {
    cancelReservation,
    getReservationDetail,
    updateReservation,
} from "@/actions/Reservation"
import Alert from "@/components/base/feedback/Alert"
import Button from "@/components/base/buttons/Button"
import Badge, { type BadgeTone } from "@/components/base/layouts/Badge"
import Card from "@/components/base/layouts/Card"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type StaffReservationDetailProps = {
    reservationId: number
}

export const StaffReservationDetail = ({
    reservationId,
}: StaffReservationDetailProps) => {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [reservation, setReservation] = useState<ReservationWithDetails | null>(null)
    // キャンセル確認モーダルの開閉（旧AlertDialogTriggerによる内部管理を明示的なstateに置き換え）
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)

    useEffect(() => {
        fetchReservation()
        // fetchReservationはreservationIdのみに依存するため、対象IDの変更時だけ再取得する
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reservationId])

    const fetchReservation = async () => {
        setLoading(true)
        setError(null)

        const result = await getReservationDetail(reservationId)
        setLoading(false)

        if (result.success && result.data) {
            setReservation(result.data)
        } else {
            setError(result.error || "予約詳細の取得に失敗しました")
        }
    }

    const handleStatusChange = async (newStatus: ReservationWithDetails["status"]) => {
        setLoading(true)
        setError(null)
        setSuccess(null)

        const result = await updateReservation(reservationId, { status: newStatus })
        setLoading(false)

        if (result.success) {
            setSuccess(`ステータスを「${getStatusLabel(newStatus)}」に変更しました`)
            fetchReservation()
        } else {
            setError(result.error || "ステータスの変更に失敗しました")
        }
    }

    const handleCancel = async () => {
        setLoading(true)
        setError(null)

        const result = await cancelReservation(reservationId)
        setLoading(false)

        if (result.success) {
            setSuccess("予約をキャンセルしました")
            fetchReservation()
        } else {
            setError(result.error || "予約のキャンセルに失敗しました")
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "pending":
                return "予約受付"
            case "confirmed":
                return "予約確定"
            case "completed":
                return "採寸完了"
            case "cancelled":
                return "キャンセル"
            default:
                return status
        }
    }

    // 色そのものではなく用途を返す。実際の配色は base/Badge が持つ
    const getStatusTone = (status: string): BadgeTone => {
        switch (status) {
            case "pending":
                return "warning"
            case "confirmed":
                return "info"
            case "completed":
                return "success"
            case "cancelled":
                return "neutral"
            default:
                return "neutral"
        }
    }

    if (loading && !reservation) {
        return (
            <div className="container mx-auto py-8">
                <div className="text-center">読み込み中...</div>
            </div>
        )
    }

    if (error && !reservation) {
        return (
            <div className="container mx-auto py-8">
                <Alert type="error" message={error} />
                <Button className="mt-4" onClick={() => router.back()} label="戻る" />
            </div>
        )
    }

    if (!reservation) {
        return null
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => router.back()} label="戻る" />
            </div>

            {success && (
                <Alert type="success" message={success} />
            )}

            {error && (
                <Alert type="error" message={error} />
            )}

            <Card
                title="予約詳細"
                headerActions={
                    <Badge tone={getStatusTone(reservation.status)}>
                        {getStatusLabel(reservation.status)}
                    </Badge>
                }
            >
                <div className="space-y-6">
                    {/* 基本情報 */}
                    <div>
                        <h3 className="font-bold text-lg mb-4">基本情報</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">予約番号</p>
                                <p className="font-medium">{reservation.reservation_number}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">予約日時</p>
                                <p className="font-medium">
                                    {reservation.reservation_date}{" "}
                                    {reservation.reservation_time?.substring(0, 5)}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500">店舗</p>
                                <p className="font-medium">{reservation.store_name || "-"}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">学校</p>
                                <p className="font-medium">{reservation.school_name || "-"}</p>
                            </div>
                            {reservation.project_name && (
                                <div className="col-span-2">
                                    <p className="text-gray-500">プロジェクト</p>
                                    <p className="font-medium">{reservation.project_name}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 顧客情報 */}
                    <div className="border-t pt-6">
                        <h3 className="font-bold text-lg mb-4">顧客情報</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">お名前</p>
                                <p className="font-medium">{reservation.customer_name}</p>
                            </div>
                            {reservation.customer_name_kana && (
                                <div>
                                    <p className="text-gray-500">お名前（カナ）</p>
                                    <p className="font-medium">{reservation.customer_name_kana}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-gray-500">性別</p>
                                <p className="font-medium">
                                    {reservation.gender === "male"
                                        ? "男性"
                                        : reservation.gender === "female"
                                            ? "女性"
                                            : "その他"}
                                </p>
                            </div>
                            {reservation.grade && (
                                <div>
                                    <p className="text-gray-500">学年</p>
                                    <p className="font-medium">{reservation.grade}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-gray-500">電話番号</p>
                                <p className="font-medium">{reservation.phone}</p>
                            </div>
                            {reservation.email && (
                                <div>
                                    <p className="text-gray-500">メールアドレス</p>
                                    <p className="font-medium">{reservation.email}</p>
                                </div>
                            )}
                            {reservation.guardian_name && (
                                <div>
                                    <p className="text-gray-500">保護者氏名</p>
                                    <p className="font-medium">{reservation.guardian_name}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 採寸情報 */}
                    {(reservation.height || reservation.weight || reservation.foot_size) && (
                        <div className="border-t pt-6">
                            <h3 className="font-bold text-lg mb-4">採寸情報</h3>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                {reservation.height && (
                                    <div>
                                        <p className="text-gray-500">身長</p>
                                        <p className="font-medium">{reservation.height} cm</p>
                                    </div>
                                )}
                                {reservation.weight && (
                                    <div>
                                        <p className="text-gray-500">体重</p>
                                        <p className="font-medium">{reservation.weight} kg</p>
                                    </div>
                                )}
                                {reservation.foot_size && (
                                    <div>
                                        <p className="text-gray-500">足のサイズ</p>
                                        <p className="font-medium">{reservation.foot_size} cm</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 備考 */}
                    {reservation.memo && (
                        <div className="border-t pt-6">
                            <h3 className="font-bold text-lg mb-4">備考</h3>
                            <p className="text-sm">{reservation.memo}</p>
                        </div>
                    )}

                    {/* 操作ボタン */}
                    <div className="border-t pt-6">
                        <h3 className="font-bold text-lg mb-4">操作</h3>
                        <div className="flex flex-wrap gap-2">
                            {reservation.status === "pending" && (
                                <Button
                                    onClick={() => handleStatusChange("confirmed")}
                                    disabled={loading} label="予約を確定する" />
                            )}
                            {reservation.status === "confirmed" && (
                                <Button
                                    onClick={() => handleStatusChange("completed")}
                                    disabled={loading}
                                    variant="primary" label="採寸完了にする" />
                            )}
                            {reservation.status !== "cancelled" &&
                                reservation.status !== "completed" && (
                                    <Button
                                        variant="danger"
                                        disabled={loading}
                                        onClick={() => setIsCancelDialogOpen(true)} label="キャンセル" />
                                )}
                        </div>
                    </div>

                    {/* メタ情報 */}
                    <div className="text-xs text-gray-500 border-t pt-4 space-y-1">
                        <p>
                            予約日時: {new Date(reservation.created_at).toLocaleString("ja-JP")}
                        </p>
                        <p>
                            更新日時: {new Date(reservation.updated_at).toLocaleString("ja-JP")}
                        </p>
                    </div>
                </div>
            </Card>

            {/* キャンセル確認 */}
            <Modal
                open={isCancelDialogOpen}
                onOpenChange={setIsCancelDialogOpen}
                title="予約をキャンセルしますか？"
                size="sm"
                actions={[
                    {
                        id: "back",
                        label: "戻る",
                        variant: "secondary",
                        onClick: () => setIsCancelDialogOpen(false),
                    },
                    {
                        id: "cancel",
                        label: "キャンセルする",
                        variant: "danger",
                        onClick: () => {
                            setIsCancelDialogOpen(false)
                            handleCancel()
                        },
                    },
                ]}
            >
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    この操作は取り消せません。予約をキャンセルすると、スケジュールの空き枠が増えます。
                </p>
            </Modal>
        </div>
    )
}
