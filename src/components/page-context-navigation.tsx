"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import {
  LAST_INTERNAL_PATH_KEY,
  type RouteBreadcrumb,
  resolveBackNavigationTarget,
  resolveRouteMetadata,
} from "@/lib/route-metadata";

interface PageContextNavigationProps {
  breadcrumbs?: RouteBreadcrumb[];
  backHref?: string;
  backLabel?: string;
  showBackLink?: boolean;
  showBreadcrumbs?: boolean;
  className?: string;
  backLinkClassName?: string;
  breadcrumbsClassName?: string;
}

export function PageContextNavigation({
  breadcrumbs,
  backHref,
  backLabel,
  showBackLink = true,
  showBreadcrumbs = true,
  className,
  backLinkClassName,
  breadcrumbsClassName,
}: PageContextNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const metadata = resolveRouteMetadata(pathname);

  const previousInternalPath =
    typeof window !== "undefined" ? window.sessionStorage.getItem(LAST_INTERNAL_PATH_KEY) : null;
  const resolvedBackTarget = backHref
    ? { href: backHref, useHistory: false }
    : resolveBackNavigationTarget(pathname, {
        previousInternalPath,
        referrer: typeof document !== "undefined" ? document.referrer : null,
      });
  const breadcrumbItems = breadcrumbs ?? metadata?.breadcrumbs ?? [];
  const resolvedBackLabel = backLabel ?? metadata?.backLabel ?? "Geri";

  if ((!showBackLink || !resolvedBackTarget) && (!showBreadcrumbs || breadcrumbItems.length === 0)) {
    return null;
  }

  return (
    <div className={className ?? "mb-8 flex flex-col gap-4"}>
      {showBackLink && resolvedBackTarget ? (
        <div>
          <Link
            href={resolvedBackTarget.href}
            data-testid="page-context-back-link"
            onClick={(event) => {
              if (!resolvedBackTarget.useHistory || window.history.length <= 1) {
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
              backLinkClassName ??
              "inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-bold text-zinc-300 transition-colors hover:border-amber-400/35 hover:text-amber-200"
            }
            aria-label={`${resolvedBackLabel} sayfasına dön`}
          >
            <ArrowLeft className="h-4 w-4" />
            {resolvedBackLabel}
          </Link>
        </div>
      ) : null}

      {showBreadcrumbs && breadcrumbItems.length > 0 ? (
        <nav
          aria-label="Sayfa konumu"
          className={
            breadcrumbsClassName ??
            "no-scrollbar flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-2 text-xs font-bold text-zinc-500"
          }
        >
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;

            return (
              <div key={`${item.href}-${index}`} className="flex items-center gap-2">
                {isLast ? (
                  <span className="max-w-[220px] truncate text-zinc-100 md:max-w-xs">{item.title}</span>
                ) : (
                  <Link href={item.href} className="transition-colors hover:text-amber-200">
                    {item.title}
                  </Link>
                )}
                {!isLast ? <ChevronRight className="h-3 w-3 flex-shrink-0" /> : null}
              </div>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
