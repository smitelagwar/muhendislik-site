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
import { ModeToggle } from "./mode-toggle";
import { SiteLogo } from "./site-logo";
import { Button } from "./ui/button";
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
      <Button variant="ghost" size="icon" onClick={toggleMenu} aria-label="Menüyü aç">
        <Menu className="h-6 w-6" />
      </Button>

      {isOpen ? (
        <>
          <div onClick={toggleMenu} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" />

          <div className="fixed right-0 top-0 z-[101] flex h-full w-[80%] max-w-sm flex-col bg-white shadow-2xl dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
              <SiteLogo href="/" lightClassName="h-8 w-auto" darkClassName="h-8 w-auto" />
              <Button variant="ghost" size="icon" onClick={toggleMenu} aria-label="Menüyü kapat">
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
                    className="group flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-zinc-500 transition-colors group-hover:text-blue-600">
                        {MOBILE_ICONS[item.id]}
                      </div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{item.label}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Görünüm</span>
              <ModeToggle />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
