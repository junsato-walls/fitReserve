import { StaffLayout } from "@/components/layouts/StaffLayout"
import { StoreManagement } from "@/views/admin/StoreManagement"

export default async function AdminStoresPage() {
    return (
        <StaffLayout role="admin">
            <StoreManagement />
        </StaffLayout>
    )
}
