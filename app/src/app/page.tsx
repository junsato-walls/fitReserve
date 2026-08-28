import { Button } from "@/components/base/buttons/Button";
import { Card } from "@/components/base/display/Card";
import Link from "next/link"

export default async function Home() {
  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">fitReserve</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">制服採寸予約管理システム</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* 採寸予約は各店舗の予約URL（/[company_slug]/[project_id]/[store_id]）
            から行うため、ここには導線を置かない。URLはホームページに掲載する。 */}
        <Card title="予約確認" description="予約番号から予約内容を確認できます">
          <Link href="/reservations/check">
            <Button variant="outline" className="w-full" size="lg" label="予約を確認" />
          </Link>
        </Card>

        <Card title="スタッフログイン" description="スタッフの方はこちらからログインしてください">
          <Link href="/login">
            <Button variant="outline" className="w-full" size="lg" label="ログイン" />
          </Link>
        </Card>
      </div>
    </div>
  )
}

