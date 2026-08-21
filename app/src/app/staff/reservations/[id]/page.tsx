import { StaffLayout } from "@/components/common/layout/StaffLayout"
import { StaffReservationDetail } from "@/components/features/staff/StaffReservationDetail"

export default async function StaffReservationDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    return (
        <StaffLayout>
            <StaffReservationDetail reservationId={parseInt(id)} />
        </StaffLayout>
    )
}
