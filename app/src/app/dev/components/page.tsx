import { notFound } from "next/navigation"
import { ComponentCatalog } from "@/views/dev/ComponentCatalog"

/**
 * base コンポーネントのカタログ（開発用）
 *
 * ライト／ダーク両方の見え方を一画面で確認するための画面。
 * 本番ビルドでは公開しない。
 */
export default async function ComponentCatalogPage() {
    if (process.env.NODE_ENV === "production") {
        notFound()
    }

    return <ComponentCatalog />
}
