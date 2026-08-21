import { StaffLayout } from "@/components/common/layout/StaffLayout"
import { StaffDashboard } from "@/components/features/staff/StaffDashboard"

export default async function StaffPage() {
    return (
        <StaffLayout>
            <StaffDashboard />
        </StaffLayout>
    )
}
