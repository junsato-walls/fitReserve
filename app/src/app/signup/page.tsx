"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/base/buttons/Button";
import { Card } from "@/components/base/display/Card";
import { Input } from "@/components/base/forms/Input";
import { Alert } from "@/components/base/feedback/Alert";

export default function SignupPage() {
    const router = useRouter()
    const [personalId, setPersonalId] = useState("")
    const [userName, setUserName] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password !== confirmPassword) {
            setError("パスワードが一致しません")
            return
        }

        if (password.length < 4) {
            setError("パスワードは4文字以上にしてください")
            return
        }

        setIsLoading(true)
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/auth/signup`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        personal_id: personalId,
                        user_name: userName,
                        password: password,
                    }),
                }
            )

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                setError(data.detail || "アカウント作成に失敗しました")
                return
            }

            // 成功したらログインページへ
            router.push("/login")
        } catch (err) {
            console.error("Signup error:", err)
            setError("サーバーエラーが発生しました")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md" title="アカウント作成" titleSize="lg" titleAlign="center">
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
                        id="userName"
                        label="ユーザー名"
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        required
                        fullWidth
                        placeholder="ユーザー名を入力"
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

                    <Input
                        id="confirmPassword"
                        label="パスワード確認"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        fullWidth
                        placeholder="パスワードを再入力"
                    />

                    {error && <Alert type="error" message={error} />}

                    <Button type="submit" className="w-full" disabled={isLoading} label="アカウント作成" loadingLabel="作成中..." isLoading={isLoading} />

                    <p className="text-center text-sm text-gray-600 mt-4">
                        既にアカウントをお持ちですか？{" "}
                        <Link href="/login" className="text-blue-600 hover:underline">
                            ログイン
                        </Link>
                    </p>
                </form>
            </Card>
        </div>
    )
}
