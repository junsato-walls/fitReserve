import { getCurrentUser } from "@/api/Auth"
import { StaffLayout } from "@/components/layouts/StaffLayout"
import { UserManagement } from "@/views/admin/UserManagement"

export default async function AdminUsersPage() {
    // middlewareでトークンを検証済みのため、ここでは表示用に中身を読むだけ
    const user = await getCurrentUser()

    return (
        <StaffLayout user={user}>
            <UserManagement />
        </StaffLayout>
    )
}
