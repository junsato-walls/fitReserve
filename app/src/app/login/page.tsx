"use client"

import Alert from "@/components/base/feedback/Alert"
import Button from "@/components/base/buttons/Button"
import Card from "@/components/base/layouts/Card"
import Input from "@/components/base/forms/Input"
import Link from "next/link"
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

    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personal_id: personalId,
        password,
      }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || "ログインに失敗しました。")
      return
    }

    // ログイン成功後、スタッフダッシュボードへリダイレクト
    router.replace("/staff")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
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

          <p className="text-center text-sm text-gray-600 mt-4">
            アカウントをお持ちでないですか？{" "}
            <Link href="/signup" className="text-blue-600 hover:underline">
              新規登録
            </Link>
          </p>
        </form>
      </Card>
    </div>
  )
}
