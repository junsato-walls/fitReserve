import { StaffLayout } from "@/components/common/layout/StaffLayout"
import { SchoolManagement } from "@/components/features/admin/SchoolManagement"

export default async function AdminSchoolsPage() {
    return (
        <StaffLayout role="admin">
            <SchoolManagement />
        </StaffLayout>
    )
}
