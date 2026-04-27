"use client";

import { usePathname } from "next/navigation";
import { ContextBackLink } from "@/components/context-back-link";
import { SiteLogo } from "@/components/site-logo";
import { resolveRouteMetadata } from "@/lib/route-metadata";

export function NavbarLeading() {
  const pathname = usePathname();
  const showBack = Boolean(resolveRouteMetadata(pathname));

  if (showBack) {
    return <ContextBackLink />;
  }

  return (
    <SiteLogo
      href="/"
      priority
      className="group flex-shrink-0"
      lightClassName="h-12 object-contain object-left transition-all duration-500 sm:h-14 lg:h-16 group-data-[scrolled=true]/navbar:h-10 sm:group-data-[scrolled=true]/navbar:h-12"
      darkClassName="h-12 object-contain object-left transition-all duration-500 sm:h-14 lg:h-16 group-data-[scrolled=true]/navbar:h-10 sm:group-data-[scrolled=true]/navbar:h-12"
    />
  );
}
