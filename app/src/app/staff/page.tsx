import { getCurrentUser } from "@/api/Auth"
import { Header } from "@/components/layouts/Header"
import { StaffLayout } from "@/components/layouts/StaffLayout"
import { StaffDashboard } from "@/views/staff/StaffDashboard"

export default async function StaffPage() {
    // middlewareでトークンを検証済みのため、ここでは表示用に中身を読むだけ
    const user = await getCurrentUser()

    return (
        <>
            <Header
                userName={user?.user_name}
                personalId={user?.personal_id}
                role={user?.role}
            />
            <StaffLayout role={user?.role}>
                <StaffDashboard />
            </StaffLayout>
        </>
    )
}
