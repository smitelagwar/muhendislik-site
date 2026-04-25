"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Share2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { BookmarkButton } from "./bookmark-button";
import { ContextBackLink } from "./context-back-link";
import { LiveSearch } from "./live-search";
import { MobileMenu } from "./mobile-menu";
import { ModeToggle } from "./mode-toggle";
import { SiteLogo } from "./site-logo";
import { Button } from "./ui/button";
import { PRIMARY_NAV_ITEMS, isNavigationItemActive } from "@/lib/navigation-config";
import { LAST_INTERNAL_PATH_KEY, resolveRouteMetadata } from "@/lib/route-metadata";
import Link from "next/link";

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
            ? "border-b border-zinc-200/70 bg-white/92 shadow-sm backdrop-blur-2xl dark:border-zinc-800/70 dark:bg-zinc-950/92"
            : "border-b border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950"
        }`}
      >
        <div className="h-[3px] w-full bg-gradient-to-r from-blue-700 via-cyan-500 to-blue-500" />

        <div className="mx-auto max-w-screen-2xl px-6 sm:px-10 lg:px-16">
          <div
            className={`flex items-center justify-between transition-all duration-500 ${
              scrolled ? "py-3" : "py-5"
            }`}
          >
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
                      className={`rounded-lg px-4 py-2 text-sm font-semibold tracking-wide transition-all duration-200 ${
                        isActive
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
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
                    onClick={() => setShareOpen(true)}
                    className="hidden gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 sm:flex"
                  >
                    <Share2 className="h-4 w-4" />
                    Paylaş
                  </Button>
                  <BookmarkButton
                    slug={pageSlug}
                    className="rounded-full border border-zinc-200 px-4 py-2 dark:border-zinc-700"
                  />
                </div>
              ) : null}

              <div className="hidden h-6 w-px bg-zinc-200 dark:bg-zinc-700 sm:block" />

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
