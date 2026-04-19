"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CALCULATIONS_HUB_HREF, getCalculationPages } from "@/lib/calculation-pages";

const CALC_LINKS = [
  { label: "Genel Bakış", href: CALCULATIONS_HUB_HREF },
  ...getCalculationPages().map((page) => ({ label: page.navLabel, href: page.href })),
];

export function CalculationsSectionNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2">
      {CALC_LINKS.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300"
                : "border-transparent text-zinc-600 hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
