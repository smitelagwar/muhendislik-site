"use client";

import Link from "next/link";
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
    <div className={cn(concreteBodyFont.className, "tool-page-shell relative min-h-screen py-8 md:py-14 text-foreground")}>
      {/* Background ambient glow flares */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-b from-purple-600/20 via-indigo-600/10 to-transparent blur-[120px] dark:from-purple-600/25" />
        <div className="absolute top-[30%] right-[-10%] h-[400px] w-[500px] rounded-full bg-violet-600/10 blur-[130px] dark:bg-violet-600/18" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <PageContextNavigation
          showBreadcrumbs={false}
          className="mb-8"
          backLinkClassName={cn(
            concreteMonoFont.className,
            "inline-flex items-center gap-2 rounded-xl border border-border/80 dark:border-white/15 bg-card/80 dark:bg-[#120f28]/90 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-200 backdrop-blur-xl transition-all hover:border-purple-500/50 hover:bg-card dark:hover:bg-[#1b173b] hover:text-foreground dark:hover:text-white",
          )}
        />

        <div className="mb-8 max-w-4xl">
          <div
            className={cn(
              concreteMonoFont.className,
              "mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wide text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)] backdrop-blur-md",
            )}
          >
            <span className="flex h-2 w-2 rounded-full bg-purple-400 animate-ping" />
            <span>{badgeLabel}</span>
          </div>

          <h1
            className={cn(
              concreteDisplayFont.className,
              "text-3xl font-black tracking-tight text-foreground dark:text-white sm:text-4xl md:text-5xl lg:text-6xl",
            )}
          >
            {title}
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground dark:text-zinc-300 md:text-base font-normal">
            {description}
          </p>
        </div>

        <nav className="mb-8 overflow-x-auto pb-2 scrollbar-none">
          <div className="flex min-w-max gap-2.5">
            {CONCRETE_TOOL_NAV.map((item) => {
              const isActive = item.id === toolId;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    concreteMonoFont.className,
                    "min-h-[42px] rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 flex items-center",
                    isActive
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] font-black"
                      : "border border-border/80 dark:border-white/10 bg-card/80 dark:bg-[#120f28]/80 text-muted-foreground dark:text-zinc-300 hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-foreground dark:hover:text-white",
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
          className="mt-8"
          standards={CONCRETE_TOOL_STANDARDS}
          note={CONCRETE_TOOL_DISCLAIMER}
        />
      </div>
    </div>
  );
}
