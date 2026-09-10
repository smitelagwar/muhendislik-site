"use client";

import { useEffect, useState, type ReactNode } from "react";

interface NavbarChromeProps {
  children: ReactNode;
  documentWorkspace?: boolean;
}

export function NavbarChrome({ children, documentWorkspace }: NavbarChromeProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        setScrolled((prev) => {
          // Histerezis aralığı: tek eşik yerine çift eşik kullanılarak
          // sınırda (boundary) ileri-geri titreme ve scroll-anchoring döngüsü engellenir.
          if (!prev && scrollY > 40) return true;
          if (prev && scrollY <= 10) return false;
          return prev;
        });
        ticking = false;
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      data-site-header
      data-document-workspace={documentWorkspace || undefined}
      suppressHydrationWarning
      data-scrolled={scrolled ? "true" : "false"}
      className={`group/navbar sticky top-0 z-[100] w-full border-b border-border/75 bg-background/88 backdrop-blur-xl [overflow-anchor:none] transition-[box-shadow,background-color,border-color] duration-300 ${
        scrolled ? "shadow-[0_18px_55px_-34px_rgba(0,0,0,0.72)]" : ""
      }`}
    >
      {children}
    </header>
  );
}
