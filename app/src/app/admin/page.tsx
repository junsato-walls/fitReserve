import { StaffLayout } from "@/components/layouts/StaffLayout"
import { AdminDashboard } from "@/views/admin/AdminDashboard"

export default async function AdminPage() {
    return (
        <StaffLayout role="admin">
            <AdminDashboard />
        </StaffLayout>
    )
}
