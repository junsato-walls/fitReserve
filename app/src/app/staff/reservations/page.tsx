import { getCurrentUser } from "@/api/Auth"
import { StaffLayout } from "@/components/layouts/StaffLayout"
import { StaffReservationList } from "@/views/staff/StaffReservationList"

export default async function StaffReservationsPage() {
    // middlewareでトークンを検証済みのため、ここでは表示用に中身を読むだけ
    const user = await getCurrentUser()

    return (
        <StaffLayout user={user}>
            <StaffReservationList />
        </StaffLayout>
    )
}
