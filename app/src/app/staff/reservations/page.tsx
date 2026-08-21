import { StaffLayout } from "@/components/common/layout/StaffLayout"
import { StaffReservationList } from "@/components/features/staff/StaffReservationList"

export default async function StaffReservationsPage() {
    return (
        <StaffLayout>
            <StaffReservationList />
        </StaffLayout>
    )
}
