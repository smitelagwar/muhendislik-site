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
        lightClassName="h-10 object-contain object-left sm:h-11 lg:h-12"
        darkClassName="h-10 object-contain object-left sm:h-11 lg:h-12"
      />
    </div>
  );
}
