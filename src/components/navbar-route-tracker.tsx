"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { LAST_INTERNAL_PATH_KEY } from "@/lib/route-metadata";

export function NavbarRouteTracker() {
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(pathname);
  const mountedRef = useRef(false);

  useEffect(() => {
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

  return null;
}
