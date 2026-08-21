"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    router.replace("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="fixed bottom-4 left-4 bg-red-600 text-white px-4 py-2 rounded shadow"
    >
      ログアウト
    </button>
  );
}
