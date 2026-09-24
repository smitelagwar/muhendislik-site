"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileDown, FolderArchive, Home, Search, Wrench } from "lucide-react";
import { BOTTOM_NAV_ITEMS, isNavigationItemActive } from "@/lib/navigation-config";

type BottomAction =
  | { id: string; label: string; href: string; icon: ReactNode; action?: never }
  | { id: string; label: string; href?: never; icon: ReactNode; action: "search" };

const BOTTOM_ICONS: Record<string, ReactNode> = {
  home: <Home className="h-5 w-5" />,
  araclar: <Wrench className="h-5 w-5" />,
  belgeler: <FileDown className="h-5 w-5" />,
  dokumantasyon: <FolderArchive className="h-5 w-5" />,
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
    <>
      <div
        data-testid="global-bottom-nav-spacer"
        aria-hidden
        className="h-[calc(4.5rem+env(safe-area-inset-bottom))] md:hidden"
      />
      <div
        data-testid="global-bottom-nav"
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/92 pb-safe shadow-[0_-10px_35px_-24px_rgba(0,0,0,0.35)] backdrop-blur-xl md:hidden"
      >
        <nav aria-label="Mobil ana navigasyon" className="grid grid-cols-5 items-stretch px-1 py-2">
          {navItems.map((item) => {
            if ("action" in item && item.action === "search") {
              return (
                <button
                  key={item.id}
                  type="button"
                  data-bottom-nav-item={item.id}
                  onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
                  aria-label="Ara"
                  aria-haspopup="dialog"
                  aria-controls="command-palette-dialog"
                  className="relative flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-0.5 py-1 font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/55"
                >
                  {item.icon}
                  <span
                    data-bottom-nav-label
                    className="block max-w-full whitespace-nowrap text-center text-[9px] leading-none tracking-[-0.04em] min-[360px]:text-[10px]"
                  >
                    {item.label}
                  </span>
                </button>
              );
            }

            const navigationItem = BOTTOM_NAV_ITEMS.find((candidate) => candidate.id === item.id);
            const isActive = navigationItem ? isNavigationItemActive(pathname, navigationItem) : false;

            return (
              <Link
                key={item.id}
                href={item.href}
                data-bottom-nav-item={item.id}
                data-active={isActive ? "true" : "false"}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-0.5 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/55 ${
                  isActive
                    ? "bg-amber-500/10 font-bold text-amber-700 dark:text-amber-300"
                    : "font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                {isActive ? (
                  <span
                    aria-hidden
                    className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-amber-500"
                  />
                ) : null}
                {item.icon}
                <span
                  data-bottom-nav-label
                  className="block max-w-full whitespace-nowrap text-center text-[9px] leading-none tracking-[-0.04em] min-[360px]:text-[10px]"
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
