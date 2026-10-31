"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import type { ReactNode } from "react";
import { GlobalOverlays } from "@/components/global-overlays";
import { Navbar } from "@/components/navbar";
import { BelgeAccountProvider } from "@/components/belge-hesap/account-provider";
import styles from "@/components/hsyncad/immersive-shell.module.css";

/** Layouts persist across navigation; the chrome decision must follow the current route. */
export function SiteShell({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/b/")) {
    return <main id="main-content" tabIndex={-1} className="min-h-screen focus:outline-none">{children}</main>;
  }

  if (pathname === "/kategori/araclar/duzensizlik-simulatoru") {
    return (
      <>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-cyan-400 focus:px-4 focus:py-2 focus:font-bold focus:text-black">Ana içeriğe atla</a>
        <main id="main-content" tabIndex={-1} data-testid="irregularity-app-shell" className="h-[100dvh] overflow-hidden focus:outline-none">{children}</main>
        <GlobalOverlays />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  if (pathname === "/kategori/araclar/hsyncad") {
    return (
      <>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-amber-500 focus:px-4 focus:py-2 focus:font-bold focus:text-black focus:shadow-lg">
          Ana içeriğe atla
        </a>
        <main id="main-content" tabIndex={-1} data-testid="hsyncad-app-shell" className={`${styles.viewport} focus:outline-none`}>
          {children}
        </main>
        <GlobalOverlays />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  const shell = (
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
  return pathname.startsWith("/belgeler") ? <BelgeAccountProvider>{shell}</BelgeAccountProvider> : shell;
}
