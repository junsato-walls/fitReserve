import { StaffLayout } from "@/components/common/layout/StaffLayout"
import { UserManagement } from "@/components/features/admin/UserManagement"

export default async function AdminUsersPage() {
    return (
        <StaffLayout role="admin">
            <UserManagement />
        </StaffLayout>
    )
}
