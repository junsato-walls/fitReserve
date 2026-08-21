import { StaffLayout } from "@/components/common/layout/StaffLayout"
import { StaffScheduleList } from "@/components/features/staff/StaffScheduleList"

export default async function StaffSchedulesPage() {
    return (
        <StaffLayout>
            <StaffScheduleList />
        </StaffLayout>
    )
}
