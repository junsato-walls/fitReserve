import { StaffLayout } from "@/components/common/layout/StaffLayout"
import { StoreManagement } from "@/components/features/admin/StoreManagement"

export default async function AdminStoresPage() {
    return (
        <StaffLayout role="admin">
            <StoreManagement />
        </StaffLayout>
    )
}
