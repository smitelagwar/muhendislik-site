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
    <section className="box-border flex h-full min-h-0 w-full min-w-0 max-w-full flex-1 flex-col overflow-hidden pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)] lg:px-2 lg:pb-2">
      <nav
        aria-label="Belge stüdyosu gezinme"
        className="sr-only lg:not-sr-only lg:flex lg:min-h-[44px] shrink-0 items-center gap-2 lg:border-b lg:border-border/70 lg:bg-background/95 lg:px-2 lg:py-1"
      >
        <Link
          href="/belgeler"
          aria-label="Tüm belgelere dön"
          className="hidden lg:inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:hover:text-amber-400"
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

      <div className="flex min-h-0 min-w-0 w-full max-w-full flex-1 overflow-hidden lg:pt-1">
        {children}
      </div>
    </section>
  );
}
