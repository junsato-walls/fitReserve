import { StaffLayout } from "@/components/common/layout/StaffLayout"
import { AdminDashboard } from "@/components/features/admin/AdminDashboard"

export default async function AdminPage() {
    return (
        <StaffLayout role="admin">
            <AdminDashboard />
        </StaffLayout>
    )
}
