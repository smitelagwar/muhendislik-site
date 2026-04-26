"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Home, Mail, Search, Wrench } from "lucide-react";
import { BOTTOM_NAV_ITEMS, isNavigationItemActive } from "@/lib/navigation-config";

type BottomAction =
  | { id: string; label: string; href: string; icon: ReactNode; action?: never }
  | { id: string; label: string; href?: never; icon: ReactNode; action: "search" };

const BOTTOM_ICONS: Record<string, ReactNode> = {
  home: <Home className="h-5 w-5" />,
  araclar: <Wrench className="h-5 w-5" />,
  kaydedilenler: <Bookmark className="h-5 w-5" />,
  iletisim: <Mail className="h-5 w-5" />,
};

export function BottomNav() {
  const pathname = usePathname();

  const navItems: BottomAction[] = [
    { id: "home", label: "Ana Sayfa", href: "/", icon: BOTTOM_ICONS.home },
    { id: "search", label: "Ara", action: "search", icon: <Search className="h-5 w-5" /> },
    ...BOTTOM_NAV_ITEMS.slice(1).map((item) => ({
      id: item.id,
      label: item.label,
      href: item.href,
      icon: BOTTOM_ICONS[item.id],
    })),
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/80 pb-safe shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.1)] backdrop-blur-xl dark:border-border dark:bg-background/80 dark:shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.5)] md:hidden">
      <nav className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          if ("action" in item && item.action === "search") {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
                aria-haspopup="dialog"
                aria-controls="command-palette-dialog"
                className="flex min-w-[4rem] flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 font-medium text-zinc-500 transition-all hover:text-zinc-900 dark:text-muted-foreground dark:hover:text-zinc-100"
              >
                {item.icon}
                <span className="text-center text-[10px] leading-none">{item.label}</span>
              </button>
            );
          }

          const isActive = isNavigationItemActive(
            pathname,
            BOTTOM_NAV_ITEMS.find((candidate) => candidate.id === item.id) ?? BOTTOM_NAV_ITEMS[0]
          );

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex min-w-[4rem] flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 transition-all ${
                isActive
                  ? "scale-110 font-bold text-blue-600 dark:text-blue-500"
                  : "font-medium text-zinc-500 hover:text-zinc-900 dark:text-muted-foreground dark:hover:text-zinc-100"
              }`}
            >
              {item.icon}
              <span className="text-center text-[10px] leading-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
