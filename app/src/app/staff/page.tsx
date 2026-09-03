import { getCurrentUser } from "@/api/Auth"
import { StaffLayout } from "@/components/layouts/StaffLayout"
import { StaffDashboard } from "@/views/staff/StaffDashboard"

export default async function StaffPage() {
    // middlewareでトークンを検証済みのため、ここでは表示用に中身を読むだけ
    const user = await getCurrentUser()

    return (
        <StaffLayout user={user}>
            <StaffDashboard />
        </StaffLayout>
    )
}
