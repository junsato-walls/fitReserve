import { StaffLayout } from "@/components/layouts/StaffLayout"
import { StaffReservationList } from "@/views/staff/StaffReservationList"

export default async function StaffReservationsPage() {
    return (
        <StaffLayout>
            <StaffReservationList />
        </StaffLayout>
    )
}
