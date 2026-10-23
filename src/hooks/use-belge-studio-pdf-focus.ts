/**
 * Belge Stüdyosu — Masaüstü PDF Odak Modu Kancası (ASAMA_07)
 *
 * Kurallar:
 * 1. Yalnızca masaüstü (lg >= 1024px) ekranlarda aktifleşebilir.
 * 2. Ekran boyutu < 1024px'e düştüğünde odak modu otomatik sıfırlanır (form tekrar görünür).
 * 3. Ekran tekrar 1024px üzerine çıktığında (1280 -> 900 -> 1280) kullanıcı onayı olmadan
 *    yeniden gizlenmez (kapalı kalır).
 * 4. Odak moduna geçerken ve çıkarken form unmount EDİLMEZ (CSS görünürlüğü).
 * 5. Odak moduna geçerken odaklı input varsa ID'si ve form scrollTop saklanır;
 *    çıkışta güvenle restore edilir.
 * 6. İlk SSR render'ında layout mismatch olmaması için varsayılan durum isPdfFocus = false'dur.
 * 7. Escape için yeni listener eklenmez; mevcut klavye dinleyicileri korunur.
 */

"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getDesktopSnapshot(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(DESKTOP_QUERY).matches
  );
}

function getServerSnapshot(): boolean {
  return false;
}

export interface UseBelgeStudioPdfFocusOptions {
  /** Form scroll kabı ref'i (scrollTop saklama ve geri yükleme için) */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  /** İsteğe bağlı modal modu */
  isModal?: boolean;
}

export interface UseBelgeStudioPdfFocusReturn {
  isPdfFocus: boolean;
  isDesktop: boolean;
  togglePdfFocus: () => void;
  onTogglePdfFocus: () => void;
  exitPdfFocus: () => void;
}

export function useBelgeStudioPdfFocus({
  scrollContainerRef,
}: UseBelgeStudioPdfFocusOptions = {}): UseBelgeStudioPdfFocusReturn {
  const isDesktop = useSyncExternalStore(subscribe, getDesktopSnapshot, getServerSnapshot);
  const [userPdfFocus, setUserPdfFocus] = useState(false);

  const savedScrollTopRef = useRef<number>(0);
  const lastFocusedInputIdRef = useRef<string | null>(null);

  // 1024px altına düşüldüğünde odak modunu sıfırla (1280 -> 900 -> 1280 geçişinde kapalı kalmasını sağlar)
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(DESKTOP_QUERY);
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (!e.matches) {
        setUserPdfFocus(false);
      }
    };
    mql.addEventListener("change", handleMediaChange);
    return () => mql.removeEventListener("change", handleMediaChange);
  }, []);

  // Form container içindeki son odaklanan alanı document focusin ile izle
  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target;
      const container = scrollContainerRef?.current;
      if (
        container &&
        target instanceof HTMLElement &&
        container.contains(target) &&
        target.id &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        lastFocusedInputIdRef.current = target.id;
      }
    };

    document.addEventListener("focusin", handleFocusIn);
    return () => document.removeEventListener("focusin", handleFocusIn);
  }, [scrollContainerRef]);

  const restoreFocusAndScroll = useCallback(() => {
    const targetScrollTop = savedScrollTopRef.current;
    const targetInputId = lastFocusedInputIdRef.current;
    lastFocusedInputIdRef.current = null;

    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        if (scrollContainerRef?.current) {
          scrollContainerRef.current.scrollTop = targetScrollTop;
        }
        if (targetInputId) {
          const el = document.getElementById(targetInputId);
          if (
            el &&
            el instanceof HTMLElement &&
            el.getClientRects().length > 0 &&
            !el.closest("[hidden]")
          ) {
            el.focus();
          }
        }
      }, 50);
    }
  }, [scrollContainerRef]);

  const togglePdfFocus = useCallback(() => {
    setUserPdfFocus((prev) => {
      const willEnable = !prev;
      if (willEnable) {
        // Form scrollTop'ı kaydet
        if (scrollContainerRef?.current) {
          savedScrollTopRef.current = scrollContainerRef.current.scrollTop;
        }
        if (typeof document !== "undefined" && document.activeElement) {
          const activeEl = document.activeElement;
          if (
            scrollContainerRef?.current?.contains(activeEl) &&
            activeEl.id &&
            activeEl instanceof HTMLElement
          ) {
            lastFocusedInputIdRef.current = activeEl.id;
          }
        }
        // Odaklı girdi gizlenmeden önce görünen toggle düğmesine odak taşı
        if (typeof window !== "undefined") {
          window.requestAnimationFrame(() => {
            const toggleBtn = document.querySelector<HTMLElement>(
              '[data-testid="belge-pdf-focus-toggle"]'
            );
            if (toggleBtn && document.activeElement !== toggleBtn) {
              toggleBtn.focus();
            }
          });
        }
      } else {
        // Çıkış yaparken scrollTop ve odağı restore et
        restoreFocusAndScroll();
      }
      return willEnable;
    });
  }, [scrollContainerRef, restoreFocusAndScroll]);

  const exitPdfFocus = useCallback(() => {
    setUserPdfFocus(false);
    restoreFocusAndScroll();
  }, [restoreFocusAndScroll]);

  const isPdfFocus = isDesktop && userPdfFocus;

  return {
    isPdfFocus,
    isDesktop,
    togglePdfFocus,
    onTogglePdfFocus: togglePdfFocus,
    exitPdfFocus,
  };
}
