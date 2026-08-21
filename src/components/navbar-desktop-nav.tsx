"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV_ITEMS, isNavigationItemActive } from "@/lib/navigation-config";

export function NavbarDesktopNav() {
  const pathname = usePathname();
  const links = PRIMARY_NAV_ITEMS.filter((item) =>
    ["home", "deprem-yonetmelik", "hesaplamalar", "araclar", "bina-asamalari", "belgeler", "dokumantasyon"].includes(item.id),
  );

  return (
    <nav className="hidden items-center gap-1 xl:flex">
      {links.map((link) => {
        const isActive = isNavigationItemActive(pathname, link);

        return (
          <Link
            key={link.id}
            href={link.href}
            className={`rounded-md px-3 py-2 text-sm font-semibold tracking-wide transition-colors duration-200 ${
              isActive
                ? "border border-amber-500/35 bg-amber-500/10 text-foreground"
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
