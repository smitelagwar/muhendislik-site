"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CALCULATIONS_HUB_HREF, getCalculationPages } from "@/lib/calculation-pages";
import { cn } from "@/lib/utils";

const CALC_LINKS = [
  { label: "Dashboard", href: CALCULATIONS_HUB_HREF },
  ...getCalculationPages().map((page) => ({ label: page.navLabel, href: page.href })),
];

export function CalculationsSectionNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
      {CALC_LINKS.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-200 active:scale-95",
              isActive
                ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-[0_0_18px_rgba(37,99,235,0.45)] border border-blue-400/40"
                : "border border-border/80 bg-card/80 text-muted-foreground hover:border-blue-400 hover:bg-accent/60 hover:text-foreground dark:border-white/10 dark:bg-[#0c1029]/70 dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:bg-[#13193e] dark:hover:text-white",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
