"use client"

import { Alert } from "@/components/base/feedback/Alert";
import { Button } from "@/components/base/buttons/Button";
import { Card } from "@/components/base/display/Card";
import { Input } from "@/components/base/forms/Input";
import { login } from "@/api/Auth"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const router = useRouter()
  const [personalId, setPersonalId] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Route Handlerを経由せず Server Action を直接呼ぶ。
    // Cookieの発行は login() 内でサーバー側が行う。
    const result = await login(personalId, password)
    setLoading(false)

    if (!result.success) {
      setError(result.error || "ログインに失敗しました。")
      return
    }

    // ログイン成功後、スタッフダッシュボードへリダイレクト
    router.replace("/staff")
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md" title="スタッフログイン" titleSize="lg" titleAlign="center">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="personalId"
            label="社員ID"
            type="text"
            value={personalId}
            onChange={(e) => setPersonalId(e.target.value)}
            required
            fullWidth
            placeholder="社員IDを入力"
          />

          <Input
            id="password"
            label="パスワード"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            placeholder="パスワードを入力"
          />

          {error && <Alert type="error" message={error} />}

          <Button type="submit" className="w-full" disabled={loading} label="ログイン" loadingLabel="ログイン中..." isLoading={loading} />

          <p className="text-center text-sm text-gray-600 dark:text-gray-300 mt-4">
            アカウントは管理者が発行します。お持ちでない場合は管理者へお問い合わせください。
          </p>
        </form>
      </Card>
    </div>
  )
}
