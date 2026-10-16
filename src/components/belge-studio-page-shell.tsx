import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type BelgeStudioPageShellProps = {
  children: ReactNode;
  title: string;
};

export function BelgeStudioPageShell({
  children,
  title,
}: BelgeStudioPageShellProps) {
  return (
    <section className="box-border flex h-full min-h-0 w-full min-w-0 max-w-full flex-1 flex-col overflow-hidden pl-[max(0.25rem,env(safe-area-inset-left))] pr-[max(0.25rem,env(safe-area-inset-right))] pt-[env(safe-area-inset-top)] sm:px-2 sm:pb-2">
      <nav
        aria-label="Belge stüdyosu gezinme"
        className="flex min-h-[44px] shrink-0 items-center gap-2 border-b border-border/70 bg-background/95 px-1 py-1 sm:px-2"
      >
        <Link
          href="/belgeler"
          aria-label="Tüm belgelere dön"
          className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:hover:text-amber-400"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span className="hidden min-[360px]:inline">Belgelere dön</span>
        </Link>
        <h1
          className="min-w-0 flex-1 truncate text-sm font-semibold leading-none text-foreground"
          title={title}
        >
          {title}
        </h1>
      </nav>

      <div className="flex min-h-0 min-w-0 w-full max-w-full flex-1 overflow-hidden pt-1">
        {children}
      </div>
    </section>
  );
}
