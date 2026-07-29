"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Nav({ username }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
      <div className="flex items-center gap-6">
        <span className="font-semibold text-gray-900">Furniture Buyer</span>
        {username && (
          <nav className="flex items-center gap-4 text-sm text-gray-600">
            <Link href="/" className="hover:text-gray-900">
              Catalogue
            </Link>
            <Link href="/orders" className="hover:text-gray-900">
              My Orders
            </Link>
          </nav>
        )}
      </div>
      {username && (
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span>{username}</span>
          <button
            onClick={handleLogout}
            className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50"
          >
            Log out
          </button>
        </div>
      )}
    </header>
  );
}
