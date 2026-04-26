"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import {
  Calculator,
  ChevronRight,
  FileText,
  GitBranchPlus,
  HardHat,
  Mail,
  Menu,
  X,
} from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { PortalOverlay } from "@/components/portal-overlay";
import { SiteLogo } from "@/components/site-logo";
import { Button } from "@/components/ui/button";
import { MOBILE_NAV_ITEMS } from "@/lib/navigation-config";

const MOBILE_ICONS: Record<string, ReactNode> = {
  home: <FileText className="h-5 w-5" />,
  "deprem-yonetmelik": <HardHat className="h-5 w-5" />,
  hesaplamalar: <Calculator className="h-5 w-5" />,
  araclar: <Calculator className="h-5 w-5" />,
  "bina-asamalari": <GitBranchPlus className="h-5 w-5" />,
  "yapi-tasarimi": <FileText className="h-5 w-5" />,
  santiye: <FileText className="h-5 w-5" />,
  "konu-haritasi": <FileText className="h-5 w-5" />,
  iletisim: <Mail className="h-5 w-5" />,
};

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

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
          className="fixed right-0 top-0 z-[1001] flex h-[100dvh] w-[84%] max-w-sm flex-col border-l border-border bg-zinc-950 shadow-2xl transition-transform duration-300"
        >
          <div className="flex items-center justify-between border-b border-border p-4">
            <SiteLogo href="/" lightClassName="h-8 w-auto" darkClassName="h-8 w-auto" />
            <Button variant="outline" size="icon" onClick={toggleMenu} aria-label="Menüyü kapat">
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="flex-grow overflow-y-auto px-4 py-6">
            <div className="space-y-2">
              {MOBILE_NAV_ITEMS.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={toggleMenu}
                  className="group flex items-center justify-between rounded-2xl border border-transparent bg-card/60 p-3 transition-colors hover:border-teal-400/25 hover:bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-muted-foreground transition-colors group-hover:text-primary">{MOBILE_ICONS[item.id]}</div>
                    <span className="font-medium text-foreground">{item.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border bg-zinc-950 p-6">
            <span className="text-sm font-medium text-muted-foreground">Görünüm</span>
            <ModeToggle />
          </div>
        </div>
      </PortalOverlay>
    </div>
  );
}
