import { ReservationForm } from "@/components/features/reservation/ReservationForm"
import { Suspense } from "react"

export default async function ReservationNewPage() {
    return (
        <div className="container mx-auto py-8">
            {/* ReservationForm は useSearchParams（キャンペーンURLのid/store）を使うためSuspenseが必要 */}
            <Suspense fallback={<div>Loading...</div>}>
                <ReservationForm />
            </Suspense>
        </div>
    )
}
