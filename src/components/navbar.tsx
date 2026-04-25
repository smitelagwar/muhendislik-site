"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Share2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { BookmarkButton } from "@/components/bookmark-button";
import { ContextBackLink } from "@/components/context-back-link";
import { LiveSearch } from "@/components/live-search";
import { MobileMenu } from "@/components/mobile-menu";
import { ModeToggle } from "@/components/mode-toggle";
import { SiteLogo } from "@/components/site-logo";
import { Button } from "@/components/ui/button";
import { PRIMARY_NAV_ITEMS, isNavigationItemActive } from "@/lib/navigation-config";
import { LAST_INTERNAL_PATH_KEY, resolveRouteMetadata } from "@/lib/route-metadata";

const SharePopup = dynamic(() => import("./share-popup").then((module) => module.SharePopup), {
  ssr: false,
});

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const previousPathRef = useRef<string | null>(pathname);
  const mountedRef = useRef(false);

  const routeMeta = resolveRouteMetadata(pathname);
  const isTool =
    pathname.startsWith("/kategori/araclar") ||
    pathname.startsWith("/araclar") ||
    pathname.startsWith("/hesaplamalar");
  const isCategory = pathname.startsWith("/kategori") && !isTool;
  const isArticle = pathname !== "/" && !isTool && !isCategory && pathname.length > 1;
  const showBack = Boolean(routeMeta);
  const pageSlug = pathname.replace(/^\//, "");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!mountedRef.current) {
      mountedRef.current = true;
      previousPathRef.current = pathname;
      window.sessionStorage.removeItem(LAST_INTERNAL_PATH_KEY);
      return;
    }

    const previousPath = previousPathRef.current;
    if (previousPath && previousPath !== pathname) {
      window.sessionStorage.setItem(LAST_INTERNAL_PATH_KEY, previousPath);
    }

    previousPathRef.current = pathname;
  }, [pathname]);

  return (
    <>
      <header
        suppressHydrationWarning
        className={`sticky top-0 z-[100] w-full transition-all duration-500 ${
          scrolled
            ? "border-b border-zinc-800/90 bg-zinc-950/92 shadow-[0_14px_50px_-30px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
            : "border-b border-zinc-900 bg-zinc-950/98"
        }`}
      >
        <div className="h-[3px] w-full bg-gradient-to-r from-amber-400 via-amber-500 to-blue-500" />

        <div className="mx-auto max-w-screen-2xl px-6 sm:px-10 lg:px-16">
          <div className={`flex items-center justify-between transition-all duration-500 ${scrolled ? "py-3" : "py-5"}`}>
            <div className="flex flex-shrink-0 items-center gap-8">
              {showBack ? (
                <ContextBackLink />
              ) : (
                <SiteLogo
                  href="/"
                  priority
                  className="group flex-shrink-0"
                  lightClassName={`object-contain object-left transition-all duration-500 ${scrolled ? "h-12" : "h-16"}`}
                  darkClassName={`object-contain object-left transition-all duration-500 ${scrolled ? "h-12" : "h-16"}`}
                />
              )}

              <nav className="hidden items-center gap-1 xl:flex">
                {PRIMARY_NAV_ITEMS.map((link) => {
                  const isActive = isNavigationItemActive(pathname, link);

                  return (
                    <Link
                      key={link.id}
                      href={link.href}
                      className={`rounded-full px-4 py-2 text-sm font-semibold tracking-wide transition-all duration-200 ${
                        isActive
                          ? "border border-amber-400/25 bg-amber-500/10 text-amber-200"
                          : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {!isArticle ? <LiveSearch /> : null}

              {isArticle ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="İçeriği paylaş"
                    onClick={() => setShareOpen(true)}
                    className="hidden gap-2 text-sm font-semibold text-zinc-400 hover:text-amber-200 sm:flex"
                  >
                    <Share2 className="h-4 w-4" />
                    Paylaş
                  </Button>
                  <BookmarkButton
                    slug={pageSlug}
                    className="rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2"
                  />
                </div>
              ) : null}

              <div className="hidden h-6 w-px bg-zinc-800 sm:block" />

              <div className="flex items-center gap-2.5">
                <ModeToggle />
                <div className="xl:hidden">
                  <MobileMenu />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <SharePopup open={shareOpen} onOpenChange={setShareOpen} />
    </>
  );
}
