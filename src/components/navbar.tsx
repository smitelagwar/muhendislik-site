"use client";

import { usePathname } from "next/navigation";
import { NavbarActions } from "@/components/navbar-actions";
import { NavbarChrome } from "@/components/navbar-chrome";
import { NavbarDesktopNav } from "@/components/navbar-desktop-nav";
import { NavbarLeading } from "@/components/navbar-leading";
import { NavbarRouteTracker } from "@/components/navbar-route-tracker";
import { isBelgeStudioRoute } from "@/lib/belge-studio-routes";

export function Navbar() {
  const pathname = usePathname();
  const hideSiteHeader =
    pathname?.startsWith("/dokumantasyon/dosya/") || isBelgeStudioRoute(pathname);

  return (
    <>
      <NavbarRouteTracker />
      {hideSiteHeader ? null : (
        <NavbarChrome documentWorkspace={pathname === "/dokumantasyon"}>
          <div className="h-[3px] w-full bg-gradient-to-r from-amber-400 via-amber-500 to-blue-500" />

          <div className="mx-auto max-w-screen-2xl px-2 sm:px-6 lg:px-8 xl:px-10 2xl:px-16">
            <div className="flex items-center justify-between py-3.5 sm:py-4">
              <div className="flex flex-shrink-0 items-center gap-2 sm:gap-4 xl:gap-6 2xl:gap-8">
                <NavbarLeading />
                <NavbarDesktopNav />
              </div>

              <NavbarActions />
            </div>
          </div>
        </NavbarChrome>
      )}
    </>
  );
}
