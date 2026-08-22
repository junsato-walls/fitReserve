import { StaffLayout } from "@/components/layouts/StaffLayout"
import { UserManagement } from "@/views/admin/UserManagement"

export default async function AdminUsersPage() {
    return (
        <StaffLayout role="admin">
            <UserManagement />
        </StaffLayout>
    )
}
