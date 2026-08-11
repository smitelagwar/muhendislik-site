import { NavbarActions } from "@/components/navbar-actions";
import { NavbarChrome } from "@/components/navbar-chrome";
import { NavbarDesktopNav } from "@/components/navbar-desktop-nav";
import { NavbarLeading } from "@/components/navbar-leading";
import { NavbarRouteTracker } from "@/components/navbar-route-tracker";

export function Navbar() {
  return (
    <>
      <NavbarRouteTracker />
      <NavbarChrome>
        <div className="h-[3px] w-full bg-gradient-to-r from-amber-400 via-amber-500 to-blue-500" />

        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-16">
          <div className="flex items-center justify-between py-5 transition-all duration-500 group-data-[scrolled=true]/navbar:py-3">
            <div className="flex flex-shrink-0 items-center gap-8">
              <NavbarLeading />
              <NavbarDesktopNav />
            </div>

            <NavbarActions />
          </div>
        </div>
      </NavbarChrome>
    </>
  );
}
