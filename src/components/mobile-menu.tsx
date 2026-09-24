"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calculator,
  ChevronRight,
  FileDown,
  FolderArchive,
  Home,
  Mail,
  Menu,
  Scale,
  Wrench,
  X,
} from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { PortalOverlay } from "@/components/portal-overlay";
import { SiteLogo } from "@/components/site-logo";
import { Button } from "@/components/ui/button";
import { MOBILE_NAV_ITEMS, isNavigationItemActive } from "@/lib/navigation-config";

const MOBILE_ICONS: Record<string, ReactNode> = {
  home: <Home className="h-5 w-5" />,
  "deprem-yonetmelik": <Scale className="h-5 w-5" />,
  hesaplamalar: <Calculator className="h-5 w-5" />,
  araclar: <Wrench className="h-5 w-5" />,
  belgeler: <FileDown className="h-5 w-5" />,
  dokumantasyon: <FolderArchive className="h-5 w-5" />,
  iletisim: <Mail className="h-5 w-5" />,
};

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => setIsOpen((current) => !current);

  return (
    <div>
      <Button
        variant="outline"
        size="icon"
        onClick={toggleMenu}
        aria-label={isOpen ? "Menüyü kapat" : "Menüyü aç"}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-drawer"
      >
        <Menu className="h-6 w-6" />
      </Button>

      <PortalOverlay isOpen={isOpen} onClose={toggleMenu}>
        <div
          onClick={toggleMenu}
          className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md transition-opacity duration-300"
        />

        <div
          id="mobile-navigation-drawer"
          className="fixed right-0 top-0 z-[1001] flex h-[100dvh] w-[84%] max-w-sm flex-col border-l border-border bg-background shadow-2xl transition-transform duration-300"
        >
          <div className="flex items-center justify-between border-b border-border p-4">
            <SiteLogo href="/" lightClassName="h-8 w-auto" darkClassName="h-8 w-auto" />
            <Button variant="outline" size="icon" onClick={toggleMenu} aria-label="Menüyü kapat">
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="flex-grow overflow-y-auto px-4 py-6">
            <nav aria-label="Mobil menü" className="space-y-2">
              {MOBILE_NAV_ITEMS.map((item) => {
                const isActive = isNavigationItemActive(pathname, item);

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    data-testid="mobile-menu-item"
                    data-nav-id={item.id}
                    data-active={isActive ? "true" : "false"}
                    aria-current={isActive ? "page" : undefined}
                    onClick={toggleMenu}
                    className={`group flex min-h-12 items-center justify-between rounded-md border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/55 ${
                      isActive
                        ? "border-amber-500/45 bg-amber-500/10 text-foreground"
                        : "border-border bg-card/75 hover:border-amber-500/35 hover:bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`transition-colors ${
                          isActive ? "text-amber-600 dark:text-amber-300" : "text-muted-foreground group-hover:text-primary"
                        }`}
                      >
                        {MOBILE_ICONS[item.id]}
                      </div>
                      <span className={isActive ? "font-semibold text-foreground" : "font-medium text-foreground"}>
                        {item.label}
                      </span>
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 transition-colors ${
                        isActive ? "text-amber-600 dark:text-amber-300" : "text-muted-foreground group-hover:text-primary"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center justify-between border-t border-border bg-background p-6">
            <span className="text-sm font-medium text-muted-foreground">Görünüm</span>
            <ModeToggle />
          </div>
        </div>
      </PortalOverlay>
    </div>
  );
}
