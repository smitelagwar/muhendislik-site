"use client";
import { useEffect } from "react";
import { registerBelgelerOffline, clearBelgelerOfflineFiles } from "@/lib/belgeler-offline-client";

/** No visible wrapper, no changes to the existing zero-scroll document studio. */
export function BelgelerOfflineRuntime() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NEXT_PUBLIC_BELGELER_OFFLINE_PWA === "0") {
      void navigator.serviceWorker.getRegistrations().then(async (registrations) => {
        for (const registration of registrations) {
          if (registration.active?.scriptURL.endsWith("/belgeler-sw.js") ||
              registration.scope.endsWith("/belgeler")) await registration.unregister();
        }
        await clearBelgelerOfflineFiles();
      }).catch(() => {});
      return;
    }
    if (process.env.NODE_ENV !== "production") return;
    let cancelled = false;
    const start = () => {
      const invoke = () => { if (!cancelled) void registerBelgelerOffline().catch(() => {}); };
      if ("requestIdleCallback" in window) window.requestIdleCallback(invoke, { timeout: 3000 });
      else window.setTimeout(invoke, 350);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    const redirectOfflineLinks = (event: MouseEvent) => {
      if (navigator.onLine || event.defaultPrevented || event.button !== 0 ||
          event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const target = event.target as Element | null;
      const link = target?.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin ||
          !(url.pathname === "/belgeler" || url.pathname.startsWith("/belgeler/"))) return;
      event.preventDefault();
      window.location.assign(url.href); // Full document navigation is SW-cached; Next RSC is not.
    };
    document.addEventListener("click", redirectOfflineLinks, true);
    return () => {
      cancelled = true;
      window.removeEventListener("load", start);
      document.removeEventListener("click", redirectOfflineLinks, true);
    };
  }, []);
  return null;
}
