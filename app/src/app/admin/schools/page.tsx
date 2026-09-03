import { getCurrentUser } from "@/api/Auth"
import { StaffLayout } from "@/components/layouts/StaffLayout"
import { SchoolManagement } from "@/views/admin/SchoolManagement"

export default async function AdminSchoolsPage() {
    // middlewareでトークンを検証済みのため、ここでは表示用に中身を読むだけ
    const user = await getCurrentUser()

    return (
        <StaffLayout user={user}>
            <SchoolManagement />
        </StaffLayout>
    )
}
