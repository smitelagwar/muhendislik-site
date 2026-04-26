"use client";

import { useEffect, useState, type ReactNode } from "react";

interface NavbarChromeProps {
  children: ReactNode;
}

export function NavbarChrome({ children }: NavbarChromeProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      suppressHydrationWarning
      data-scrolled={scrolled ? "true" : "false"}
      className={`group/navbar sticky top-0 z-[100] w-full transition-all duration-500 ${
        scrolled
          ? "border-b border-border/80 bg-background/90 shadow-[0_14px_50px_-30px_rgba(0,0,0,0.8)] backdrop-blur-2xl dark:bg-background/92"
          : "border-b border-border bg-background/95 dark:bg-background/98"
      }`}
    >
      {children}
    </header>
  );
}
