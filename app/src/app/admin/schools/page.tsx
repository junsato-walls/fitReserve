import { StaffLayout } from "@/components/layouts/StaffLayout"
import { SchoolManagement } from "@/views/admin/SchoolManagement"

export default async function AdminSchoolsPage() {
    return (
        <StaffLayout role="admin">
            <SchoolManagement />
        </StaffLayout>
    )
}
