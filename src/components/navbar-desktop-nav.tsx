"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV_ITEMS, isNavigationItemActive } from "@/lib/navigation-config";

export function NavbarDesktopNav() {
  const pathname = usePathname();

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
                ? "border border-amber-400/25 bg-amber-500/10 text-amber-200"
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
