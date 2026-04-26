"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import {
  LAST_INTERNAL_PATH_KEY,
  resolveBackNavigationTarget,
  resolveRouteMetadata,
} from "@/lib/route-metadata";

interface ContextBackLinkProps {
  className?: string;
}

export function ContextBackLink({ className }: ContextBackLinkProps) {
  const pathname = usePathname();
  const router = useRouter();
  const metadata = resolveRouteMetadata(pathname);

  if (!metadata || pathname === "/") {
    return null;
  }

  const previousInternalPath =
    typeof window !== "undefined" ? window.sessionStorage.getItem(LAST_INTERNAL_PATH_KEY) : null;
  const target = resolveBackNavigationTarget(pathname, {
    previousInternalPath,
    referrer: typeof document !== "undefined" ? document.referrer : null,
  });

  if (!target) {
    return null;
  }

  return (
    <Link
      href={target.href}
      data-testid="header-context-back-link"
      onClick={(event) => {
        if (!target.useHistory || window.history.length <= 1) {
          return;
        }

        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }

        event.preventDefault();
        router.back();
      }}
      className={
        className ??
        "group flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
      }
      title={metadata.backLabel}
      aria-label={`${metadata.backLabel} sayfasına dön`}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card transition-colors group-hover:border-teal-400/30 group-hover:bg-teal-500/10">
        <ChevronLeft className="h-4 w-4" />
      </div>
      <span className="hidden text-sm font-bold tracking-wide sm:inline">Geri dön</span>
    </Link>
  );
}
