import { StaffLayout } from "@/components/layouts/StaffLayout"
import { StaffReservationDetail } from "@/views/staff/StaffReservationDetail"

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
