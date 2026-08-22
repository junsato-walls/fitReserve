import { StaffLayout } from "@/components/layouts/StaffLayout"
import { StaffScheduleList } from "@/views/staff/StaffScheduleList"

export default async function StaffSchedulesPage() {
    return (
        <StaffLayout>
            <StaffScheduleList />
        </StaffLayout>
    )
}
