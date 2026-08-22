import { StaffLayout } from "@/components/layouts/StaffLayout"
import { StaffDashboard } from "@/views/staff/StaffDashboard"

export default async function StaffPage() {
    return (
        <StaffLayout>
            <StaffDashboard />
        </StaffLayout>
    )
}
