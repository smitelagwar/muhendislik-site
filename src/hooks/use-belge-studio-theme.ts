"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export interface UseBelgeStudioThemeReturn {
  isDark: boolean;
  mounted: boolean;
  toggle: () => void;
  setTheme: (theme: string) => void;
  resolvedTheme: string | undefined;
}

/**
 * Belge Stüdyosu — Ortak Tema Yönetim Kancası
 * Hem üst bar masaüstü switch hem mobil çekmecedeki Görünüm kartı aynı kaynağı kullanır.
 */
export function useBelgeStudioTheme(): UseBelgeStudioThemeReturn {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const toggle = () => {
    const currentlyDark = mounted
      ? resolvedTheme === "dark"
      : typeof document !== "undefined" && document.documentElement.classList.contains("dark");
    setTheme(currentlyDark ? "light" : "dark");
  };

  return {
    isDark,
    mounted,
    toggle,
    setTheme,
    resolvedTheme,
  };
}
