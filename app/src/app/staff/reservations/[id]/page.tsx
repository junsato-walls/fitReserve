import { getCurrentUser } from "@/api/Auth"
import { StaffLayout } from "@/components/layouts/StaffLayout"
import { StaffReservationDetail } from "@/views/staff/StaffReservationDetail"

export default async function StaffReservationDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    // middlewareでトークンを検証済みのため、ここでは表示用に中身を読むだけ
    const user = await getCurrentUser()

    return (
        <StaffLayout user={user}>
            <StaffReservationDetail reservationId={parseInt(id)} />
        </StaffLayout>
    )
}
