"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV_ITEMS, isNavigationItemActive } from "@/lib/navigation-config";

export function NavbarDesktopNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <nav className="hidden items-center gap-1 lg:flex">
      {PRIMARY_NAV_ITEMS.map((link) => {
        const isActive = isNavigationItemActive(pathname, link);

        return (
          <Link
            key={link.id}
            href={link.href}
            className={`rounded-full px-4 py-2 text-sm font-semibold tracking-wide transition-all duration-200 ${
              isActive
                ? isHome
                  ? "border border-amber-400/30 bg-amber-400/10 text-white"
                  : "border border-teal-400/25 bg-teal-500/10 text-teal-200"
                : isHome
                  ? "text-slate-300 hover:bg-white/5 hover:text-white"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
