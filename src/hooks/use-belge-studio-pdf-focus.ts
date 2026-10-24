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
import { BELGE_UX_FLAGS } from "@/lib/belge-ux-config";

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
  /** Feature flag kontrolü (varsayılan: BELGE_UX_FLAGS.FOCUS_MODE) */
  enabled?: boolean;
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
  enabled = BELGE_UX_FLAGS.FOCUS_MODE,
}: UseBelgeStudioPdfFocusOptions = {}): UseBelgeStudioPdfFocusReturn {
  const isDesktop = useSyncExternalStore(subscribe, getDesktopSnapshot, getServerSnapshot);
  const [userPdfFocus, setUserPdfFocus] = useState(false);

  const restoreTimerRef = useRef<number | null>(null);
  useEffect(() => () => { if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current); }, []);

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
      if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current);
      restoreTimerRef.current = window.setTimeout(() => {
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
            if (scrollContainerRef?.current?.contains(el)) el.focus({ preventScroll: true });
          }
        }
      }, 50);
    }
  }, [scrollContainerRef]);

  const togglePdfFocus = useCallback(() => {
    if (!enabled || !isDesktop) return;
    if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current);
    if (userPdfFocus) {
      setUserPdfFocus(false);
      restoreFocusAndScroll();
      return;
    }
    const container = scrollContainerRef?.current;
    if (container) {
      savedScrollTopRef.current = container.scrollTop;
      const active = document.activeElement;
      if (active instanceof HTMLElement && container.contains(active) && active.id) {
        lastFocusedInputIdRef.current = active.id;
      }
      const root = container.closest<HTMLElement>('[data-studio-locked="true"]') || container.parentElement?.parentElement || document;
      root.querySelector<HTMLElement>('[data-testid="belge-pdf-focus-toggle"]')?.focus({ preventScroll: true });
    }
    setUserPdfFocus(true);
  }, [enabled, isDesktop, userPdfFocus, scrollContainerRef, restoreFocusAndScroll]);

  const exitPdfFocus = useCallback(() => {
    setUserPdfFocus(false);
    restoreFocusAndScroll();
  }, [restoreFocusAndScroll]);

  const isPdfFocus = enabled && isDesktop && userPdfFocus;

  return {
    isPdfFocus,
    isDesktop,
    togglePdfFocus,
    onTogglePdfFocus: togglePdfFocus,
    exitPdfFocus,
  };
}
