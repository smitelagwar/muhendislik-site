"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConcreteStandardsNote } from "@/components/concrete-tool-primitives";
import { CONCRETE_TOOL_DISCLAIMER, CONCRETE_TOOL_NAV, CONCRETE_TOOL_STANDARDS } from "@/lib/concrete-tools/copy";
import { concreteBodyFont, concreteDisplayFont, concreteMonoFont } from "@/lib/concrete-tools/fonts";
import type { ConcreteToolId } from "@/lib/concrete-tools/types";
import { TOOLS_HUB_HREF } from "@/lib/tools-data";
import { cn } from "@/lib/utils";

interface ConcreteToolShellProps {
  toolId: ConcreteToolId;
  badgeLabel: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function ConcreteToolShell({
  toolId,
  badgeLabel,
  title,
  description,
  children,
}: ConcreteToolShellProps) {
  return (
    <div
      className={cn(
        concreteBodyFont.className,
        "min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,166,35,0.14),_transparent_34%),radial-gradient(circle_at_right,_rgba(79,195,247,0.12),_transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef4f7_52%,#f8fafc_100%)] py-8 dark:bg-[radial-gradient(circle_at_top,_rgba(245,166,35,0.18),_transparent_28%),radial-gradient(circle_at_right,_rgba(79,195,247,0.18),_transparent_32%),linear-gradient(180deg,#090c10_0%,#111827_52%,#090c10_100%)] md:py-14",
      )}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8">
          <Link
            href={TOOLS_HUB_HREF}
            className={cn(
              concreteMonoFont.className,
              "inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/85 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-600 transition-colors hover:border-amber-200 hover:text-amber-700 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-300 dark:hover:border-amber-900 dark:hover:text-amber-300",
            )}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Tüm araçlar
          </Link>
        </div>

        <div className="mb-8 max-w-4xl">
          <Badge className={cn(concreteMonoFont.className, "mb-4 rounded-full bg-amber-100 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300")}>
            {badgeLabel}
          </Badge>
          <h1 className={cn(concreteDisplayFont.className, "text-4xl font-black uppercase tracking-[0.08em] text-zinc-950 dark:text-white md:text-6xl")}>
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-600 dark:text-zinc-400 md:text-base">{description}</p>
        </div>

        <nav className="mb-6 overflow-x-auto pb-2">
          <div className="flex min-w-max gap-3">
            {CONCRETE_TOOL_NAV.map((item) => {
              const isActive = item.id === toolId;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    concreteMonoFont.className,
                    "rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors",
                    isActive
                      ? "border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-500 dark:bg-amber-950/30 dark:text-amber-300"
                      : "border-zinc-200 bg-white/80 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-white",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {children}

        <ConcreteStandardsNote
          className="mt-6"
          standards={CONCRETE_TOOL_STANDARDS}
          note={CONCRETE_TOOL_DISCLAIMER}
        />
      </div>
    </div>
  );
}
