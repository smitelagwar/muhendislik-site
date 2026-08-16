import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const WIDTH_CLASSES = {
  content: "max-w-4xl",
  wide: "max-w-7xl",
  full: "max-w-[1440px]",
  ultra: "max-w-none w-full",
} as const;

interface SitePageShellProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  tone?: "default" | "dark";
  width?: keyof typeof WIDTH_CLASSES;
}

export function SitePageShell({
  children,
  className,
  contentClassName,
  tone = "default",
  width = "wide",
}: SitePageShellProps) {
  return (
    <div className={cn("site-page-shell", tone === "dark" && "site-page-shell-dark", className)}>
      <div
        className={cn(
          "relative mx-auto w-full px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16",
          WIDTH_CLASSES[width],
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}

interface SitePageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  icon?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
  inverse?: boolean;
}

export function SitePageHeader({
  eyebrow,
  title,
  description,
  icon,
  meta,
  actions,
  className,
  inverse = false,
}: SitePageHeaderProps) {
  return (
    <header
      className={cn(
        "site-page-header grid gap-8 border-b pb-9 lg:grid-cols-12 lg:items-end",
        inverse ? "border-white/10" : "border-border",
        className,
      )}
    >
      <div className="lg:col-span-8">
        <div className="flex items-center gap-4">
          {icon ? (
            <span
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-md border",
                inverse
                  ? "border-white/10 bg-white/5 text-amber-400"
                  : "border-border bg-card text-amber-700 dark:text-amber-400",
              )}
            >
              {icon}
            </span>
          ) : null}
          <p className={cn("site-kicker", inverse && "site-kicker-inverse")}>{eyebrow}</p>
        </div>
        <h1
          className={cn(
            "mt-6 max-w-5xl text-4xl font-black leading-[0.98] tracking-[-0.045em] sm:text-5xl lg:text-6xl",
            inverse ? "text-white" : "text-foreground",
          )}
        >
          {title}
        </h1>
      </div>
      <div className="lg:col-span-4 lg:justify-self-end">
        <p className={cn("max-w-xl text-sm leading-7 sm:text-base", inverse ? "text-zinc-400" : "text-muted-foreground")}>{description}</p>
        {meta ? <div className="mt-5">{meta}</div> : null}
        {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </header>
  );
}
