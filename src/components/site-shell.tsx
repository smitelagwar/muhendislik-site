"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import type { ReactNode } from "react";
import { GlobalOverlays } from "@/components/global-overlays";
import { Navbar } from "@/components/navbar";

/** Layouts persist across navigation; the chrome decision must follow the current route. */
export function SiteShell({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/b/")) {
    return <main id="main-content" tabIndex={-1} className="min-h-screen focus:outline-none">{children}</main>;
  }

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-amber-500 focus:px-4 focus:py-2 focus:font-bold focus:text-black focus:shadow-lg">
          Ana içeriğe atla
        </a>
        <Navbar />
        <main id="main-content" tabIndex={-1} className="flex-grow focus:outline-none">{children}</main>
        {footer}
      </div>
      <GlobalOverlays />
      <Toaster position="top-center" richColors />
    </>
  );
}
