import { getCurrentUser } from "@/api/Auth"
import { StaffLayout } from "@/components/layouts/StaffLayout"
import { StoreManagement } from "@/views/admin/StoreManagement"

export default async function AdminStoresPage() {
    // middlewareでトークンを検証済みのため、ここでは表示用に中身を読むだけ
    const user = await getCurrentUser()

    return (
        <StaffLayout user={user}>
            <StoreManagement />
        </StaffLayout>
    )
}
