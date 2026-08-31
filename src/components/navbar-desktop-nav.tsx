"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Calculator,
  FileDown,
  FolderArchive,
  HardHat,
  Home,
  Scale,
  Wrench,
} from "lucide-react";
import { PRIMARY_NAV_ITEMS, isNavigationItemActive } from "@/lib/navigation-config";
import { cn } from "@/lib/utils";

/* Map iconKey strings to Lucide components */
function NavIcon({ iconKey, className }: { iconKey?: string; className?: string }) {
  const cls = cn("h-3.5 w-3.5 shrink-0", className);
  switch (iconKey) {
    case "home": return <Home className={cls} />;
    case "scale": return <Scale className={cls} />;
    case "calculator": return <Calculator className={cls} />;
    case "wrench": return <Wrench className={cls} />;
    case "building2": return <Building2 className={cls} />;
    case "file-down": return <FileDown className={cls} />;
    case "folder-archive": return <FolderArchive className={cls} />;
    case "hard-hat": return <HardHat className={cls} />;
    default: return null;
  }
}

export function NavbarDesktopNav() {
  const pathname = usePathname();
  const links = PRIMARY_NAV_ITEMS.filter((item) =>
    ["home", "deprem-yonetmelik", "hesaplamalar", "araclar", "bina-asamalari", "belgeler", "dokumantasyon"].includes(item.id),
  );

  return (
    <nav className="hidden items-center gap-0.5 xl:flex">
      {links.map((link) => {
        const isActive = isNavigationItemActive(pathname, link);

        return (
          <Link
            key={link.id}
            href={link.href}
            className={cn(
              "group relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold tracking-wide transition-all duration-200 2xl:px-3 2xl:text-xs",
              isActive
                ? "text-foreground dark:text-white"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200",
            )}
          >
            <NavIcon
              iconKey={link.iconKey}
              className={cn(
                isActive
                  ? "text-amber-500 dark:text-amber-400"
                  : "text-muted-foreground/60 group-hover:text-foreground/60 dark:text-zinc-600 dark:group-hover:text-zinc-400",
              )}
            />
            <span>{link.label}</span>

            {/* Active bottom indicator */}
            {isActive && (
              <span className="absolute inset-x-1 -bottom-[7px] h-[2px] rounded-full bg-gradient-to-r from-amber-400 to-amber-500" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
