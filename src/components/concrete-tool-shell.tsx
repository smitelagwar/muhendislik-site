"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ConcreteStandardsNote } from "@/components/concrete-tool-primitives";
import { PageContextNavigation } from "@/components/page-context-navigation";
import {
  CONCRETE_TOOL_DISCLAIMER,
  CONCRETE_TOOL_NAV,
  CONCRETE_TOOL_STANDARDS,
} from "@/lib/concrete-tools/copy";
import {
  concreteBodyFont,
  concreteDisplayFont,
  concreteMonoFont,
} from "@/lib/concrete-tools/fonts";
import type { ConcreteToolId } from "@/lib/concrete-tools/types";
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
    <div className={cn(concreteBodyFont.className, "tool-page-shell py-8 md:py-14")}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <PageContextNavigation
          showBreadcrumbs={false}
          className="mb-8"
          backLinkClassName={cn(
            concreteMonoFont.className,
            "inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:border-amber-500/40 hover:text-amber-700 dark:hover:text-amber-300",
          )}
        />

        <div className="mb-8 max-w-4xl">
          <Badge
            className={cn(
              concreteMonoFont.className,
              "mb-4 bg-amber-500/10 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-800 hover:bg-amber-500/15 dark:text-amber-300",
            )}
          >
            {badgeLabel}
          </Badge>
          <h1
            className={cn(
              concreteDisplayFont.className,
              "text-3xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-4xl md:text-6xl",
            )}
          >
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-600 dark:text-zinc-400 md:text-base">
            {description}
          </p>
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
                    "min-h-[44px] rounded-md border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors",
                    isActive
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                      : "border-border bg-card text-muted-foreground hover:border-blue-500/35 hover:text-blue-700 dark:hover:text-blue-300",
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
