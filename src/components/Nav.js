"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/", label: "Assistant" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/orders", label: "My Orders" },
];

export default function Nav({ username }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between bg-plum px-6 py-4 shadow-sm">
      <div className="flex items-center gap-8">
        <span className="text-lg font-semibold tracking-tight text-white">
          Furniture<span className="text-tomato">.</span>
        </span>
        {username && (
          <nav className="flex items-center gap-5 text-sm font-medium">
            {LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    isActive
                      ? "text-tomato"
                      : "text-white/70 transition hover:text-white"
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
      {username && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-white/80">{username}</span>
          <button
            onClick={handleLogout}
            className="rounded-full border border-white/25 px-3 py-1 text-white/90 transition hover:border-white/50 hover:bg-white/10"
          >
            Log out
          </button>
        </div>
      )}
    </header>
  );
}
