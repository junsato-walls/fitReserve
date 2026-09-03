import { getCurrentUser } from "@/api/Auth"
import { StaffLayout } from "@/components/layouts/StaffLayout"
import { AdminDashboard } from "@/views/admin/AdminDashboard"

export default async function AdminPage() {
    // middlewareでトークンを検証済みのため、ここでは表示用に中身を読むだけ
    const user = await getCurrentUser()

    return (
        <StaffLayout user={user}>
            <AdminDashboard />
        </StaffLayout>
    )
}
