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
    <div data-home-navbar-logo className="flex shrink-0 items-center max-[360px]:hidden">
      <SiteLogo
        href="/"
        priority
        className="home-navbar-logo-visual group flex-shrink-0"
        lightClassName="h-10 object-contain object-left transition-all duration-500 sm:h-12 lg:h-14 group-data-[scrolled=true]/navbar:h-8 sm:group-data-[scrolled=true]/navbar:h-10"
        darkClassName="h-10 object-contain object-left transition-all duration-500 sm:h-12 lg:h-14 group-data-[scrolled=true]/navbar:h-8 sm:group-data-[scrolled=true]/navbar:h-10"
      />
    </div>
  );
}
