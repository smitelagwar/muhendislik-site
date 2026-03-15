"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Home, Search, User, Wrench } from "lucide-react";

type BottomAction =
  | { name: string; href: string; icon: ReactNode; action?: never }
  | { name: string; href?: never; icon: ReactNode; action: "search" };

export function BottomNav() {
  const pathname = usePathname();

  const navItems: BottomAction[] = [
    { name: "Ana Sayfa", href: "/", icon: <Home className="h-5 w-5" /> },
    { name: "Ara", action: "search", icon: <Search className="h-5 w-5" /> },
    { name: "Kaydedilenler", href: "/kaydedilenler", icon: <Bookmark className="h-5 w-5" /> },
    { name: "Araçlar", href: "/kategori/araclar", icon: <Wrench className="h-5 w-5" /> },
    { name: "Profil", href: "/giris", icon: <User className="h-5 w-5" /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/80 pb-safe shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.1)] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80 dark:shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.5)] md:hidden">
      <nav className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          if ("action" in item && item.action === "search") {
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
                className="flex min-w-[4rem] flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 font-medium text-zinc-500 transition-all hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                {item.icon}
                <span className="text-center text-[10px] leading-none">{item.name}</span>
              </button>
            );
          }

          const href = item.href;
          const isActive =
            pathname === href ||
            (href === "/kategori/araclar" && (pathname.startsWith("/kategori/araclar") || pathname.startsWith("/araclar")));

          return (
            <Link
              key={item.name}
              href={href}
              className={`flex min-w-[4rem] flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 transition-all ${
                isActive
                  ? "scale-110 font-bold text-blue-600 dark:text-blue-500"
                  : "font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {item.icon}
              <span className="text-center text-[10px] leading-none">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
