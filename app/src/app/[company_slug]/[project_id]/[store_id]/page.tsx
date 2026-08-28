import { notFound } from "next/navigation"
import { ReservationForm } from "@/views/reservation/ReservationForm"

interface ReservationPageProps {
    params: Promise<{
        company_slug: string
        project_id: string
        store_id: string
    }>
}

/**
 * 採寸予約ページ（顧客向け・認証不要）
 *
 * ホームページに掲載する公開URL。
 * 管理画面のプロジェクト詳細から、店舗ごとのURLを取得して掲載する。
 *
 *   /[company_slug]/[project_id]/[store_id]
 *
 * 会社・プロジェクト・店舗の組み合わせが正しいかはAPI側で検証する。
 * ここではIDが数値かどうかだけを見る。
 */
export default async function ReservationPage({ params }: ReservationPageProps) {
    const { company_slug, project_id, store_id } = await params

    const projectId = Number(project_id)
    const storeId = Number(store_id)
    if (!Number.isInteger(projectId) || !Number.isInteger(storeId)) {
        notFound()
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <ReservationForm
                companySlug={company_slug}
                projectId={projectId}
                storeId={storeId}
            />
        </div>
    )
}
