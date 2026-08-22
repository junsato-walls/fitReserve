import { ReservationCheck } from "@/views/reservation/ReservationCheck"
import { Suspense } from "react"

export default async function ReservationCheckPage() {
    return (
        <div className="container mx-auto py-8">
            <Suspense fallback={<div>Loading...</div>}>
                <ReservationCheck />
            </Suspense>
        </div>
    )
}
