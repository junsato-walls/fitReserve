import { StaffLayout } from "@/components/layouts/StaffLayout"
import { ProjectManagement } from "@/views/admin/ProjectManagement"

export default async function AdminProjectsPage() {
    return (
        <StaffLayout role="admin">
            <ProjectManagement />
        </StaffLayout>
    )
}
