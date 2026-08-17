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
                : "border border-white/10 bg-[#0c1029]/70 text-slate-300 hover:border-blue-500/40 hover:bg-[#13193e] hover:text-white",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
