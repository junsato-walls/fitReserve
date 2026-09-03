"use client"

import { getReservationByNumber } from "@/api/Reservation"
import { Alert } from "@/components/base/feedback/Alert"
import { Button } from "@/components/base/buttons/Button"
import { Badge } from "@/components/base/display/Badge"
import type { Tone } from "@/components/base/tokens"
import { Card } from "@/components/base/display/Card"
import { Input } from "@/components/base/forms/Input"
import type { Reservation } from "@/types/reservation"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

export const ReservationCheck = () => {
    const searchParams = useSearchParams()
    const numberParam = searchParams.get("number") || ""

    const [reservationNumber, setReservationNumber] = useState(numberParam)
    const [reservation, setReservation] = useState<Reservation | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSearch = async () => {
        if (!reservationNumber) {
            setError("予約番号を入力してください")
            return
        }

        setLoading(true)
        setError(null)
        setReservation(null)

        const result = await getReservationByNumber(reservationNumber)
        setLoading(false)

        if (result.success && result.data) {
            setReservation(result.data)
        } else {
            setError(result.error || "予約が見つかりませんでした")
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
    const getStatusTone = (status: string): Tone => {
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

    return (
        <Card maxWidth="2xl" center title="予約内容の確認">
            <div className="space-y-6">
                <div className="flex items-end gap-2">
                    <div className="flex-1">
                        <Input
                            label="予約番号"
                            fullWidth
                            value={reservationNumber}
                            onChange={(e) => setReservationNumber(e.target.value)}
                            placeholder="RES-2026-08-001"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSearch()
                            }}
                        />
                    </div>
                    <Button
                        onClick={handleSearch}
                        disabled={loading}
                        label="検索"
                        loadingLabel="検索中..."
                        isLoading={loading}
                    />
                </div>

                {error && <Alert tone="danger" message={error} />}

                {reservation && (
                    <div className="border rounded p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold">予約詳細</h3>
                            <Badge tone={getStatusTone(reservation.status)}>
                                {getStatusLabel(reservation.status)}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                                <p className="text-gray-500 dark:text-gray-400">予約番号</p>
                                <p className="font-medium">{reservation.reservation_number}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-gray-500 dark:text-gray-400">予約日時</p>
                                <p className="font-medium">
                                    {reservation.reservation_date} {reservation.reservation_time}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-gray-500 dark:text-gray-400">お名前</p>
                                <p className="font-medium">{reservation.customer_name}</p>
                            </div>

                            {reservation.customer_name_kana && (
                                <div className="space-y-1">
                                    <p className="text-gray-500 dark:text-gray-400">
                                        お名前（カナ）
                                    </p>
                                    <p className="font-medium">{reservation.customer_name_kana}</p>
                                </div>
                            )}

                            <div className="space-y-1">
                                <p className="text-gray-500 dark:text-gray-400">性別</p>
                                <p className="font-medium">
                                    {reservation.gender === "male"
                                        ? "男性"
                                        : reservation.gender === "female"
                                          ? "女性"
                                          : "その他"}
                                </p>
                            </div>

                            {reservation.grade && (
                                <div className="space-y-1">
                                    <p className="text-gray-500 dark:text-gray-400">学年</p>
                                    <p className="font-medium">{reservation.grade}</p>
                                </div>
                            )}

                            <div className="space-y-1">
                                <p className="text-gray-500 dark:text-gray-400">電話番号</p>
                                <p className="font-medium">{reservation.phone}</p>
                            </div>

                            {reservation.email && (
                                <div className="space-y-1">
                                    <p className="text-gray-500 dark:text-gray-400">
                                        メールアドレス
                                    </p>
                                    <p className="font-medium">{reservation.email}</p>
                                </div>
                            )}

                            {reservation.guardian_name && (
                                <div className="space-y-1">
                                    <p className="text-gray-500 dark:text-gray-400">保護者氏名</p>
                                    <p className="font-medium">{reservation.guardian_name}</p>
                                </div>
                            )}
                        </div>

                        {(reservation.height || reservation.weight || reservation.foot_size) && (
                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-2">採寸情報</h4>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    {reservation.height && (
                                        <div className="space-y-1">
                                            <p className="text-gray-500 dark:text-gray-400">身長</p>
                                            <p className="font-medium">{reservation.height} cm</p>
                                        </div>
                                    )}
                                    {reservation.weight && (
                                        <div className="space-y-1">
                                            <p className="text-gray-500 dark:text-gray-400">体重</p>
                                            <p className="font-medium">{reservation.weight} kg</p>
                                        </div>
                                    )}
                                    {reservation.foot_size && (
                                        <div className="space-y-1">
                                            <p className="text-gray-500 dark:text-gray-400">
                                                足のサイズ
                                            </p>
                                            <p className="font-medium">
                                                {reservation.foot_size} cm
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {reservation.memo && (
                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-2">備考</h4>
                                <p className="text-sm">{reservation.memo}</p>
                            </div>
                        )}

                        <div className="text-xs text-gray-500 dark:text-gray-400 border-t pt-4">
                            <p>
                                予約日時: {new Date(reservation.created_at).toLocaleString("ja-JP")}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    )
}
