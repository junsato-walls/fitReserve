import { StaffLayout } from "@/components/common/layout/StaffLayout"
import { ProjectManagement } from "@/components/features/admin/ProjectManagement"

export default async function AdminProjectsPage() {
    return (
        <StaffLayout role="admin">
            <ProjectManagement />
        </StaffLayout>
    )
}
