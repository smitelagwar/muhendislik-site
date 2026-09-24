"use client";

import type { RefObject } from "react";
import { useEffect } from "react";

const EDITABLE_SELECTOR = "input, textarea, select, [contenteditable='true']";
const VIEWPORT_CSS_VARIABLE = "--belge-studio-visual-height";

export function useBelgeStudioMobileViewport(
  studioRootRef: RefObject<HTMLElement | null>,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const root = studioRootRef.current;
    if (!root) return;

    const html = document.documentElement;
    const visualViewport = window.visualViewport;
    let animationFrame = 0;
    let focusTimer = 0;

    const keepFocusedEditorVisible = () => {
      const activeElement = document.activeElement;
      if (
        !(activeElement instanceof HTMLElement) ||
        !root.contains(activeElement) ||
        !activeElement.matches(EDITABLE_SELECTOR)
      ) {
        return;
      }

      const viewportTop = visualViewport?.offsetTop ?? 0;
      let viewportBottom =
        viewportTop + (visualViewport?.height ?? window.innerHeight);

      const mobileActions = root.querySelector<HTMLElement>(
        '[data-testid="belge-studio-mobile-actions"]'
      );
      if (
        mobileActions &&
        window.getComputedStyle(mobileActions).display !== "none"
      ) {
        viewportBottom = Math.min(
          viewportBottom,
          mobileActions.getBoundingClientRect().top - 8
        );
      }

      const rect = activeElement.getBoundingClientRect();
      const topGuard = viewportTop + 12;
      const bottomGuard = viewportBottom - 12;

      if (rect.top < topGuard || rect.bottom > bottomGuard) {
        activeElement.scrollIntoView({
          block: "nearest",
          inline: "nearest",
          behavior: "auto",
        });
      }
    };

    const syncViewport = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        const height = Math.max(
          1,
          Math.round(visualViewport?.height ?? window.innerHeight)
        );
        html.style.setProperty(VIEWPORT_CSS_VARIABLE, `${height}px`);

        // Sadece test/teşhis sinyali; layout kararı bu eşikten üretilmez.
        const keyboardInset = Math.max(0, window.innerHeight - height);
        root.dataset.mobileKeyboard = keyboardInset > 120 ? "open" : "closed";

        keepFocusedEditorVisible();
      });
    };

    const clearViewportState = () => {
      html.style.removeProperty(VIEWPORT_CSS_VARIABLE);
      delete root.dataset.mobileKeyboard;
    };

    const handlePageShow = () => {
      syncViewport();
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (
        !(event.target instanceof HTMLElement) ||
        !event.target.matches(EDITABLE_SELECTOR)
      ) {
        return;
      }

      window.clearTimeout(focusTimer);
      focusTimer = window.setTimeout(syncViewport, 50);
    };

    syncViewport();

    root.addEventListener("focusin", handleFocusIn);
    window.addEventListener("resize", syncViewport);
    window.addEventListener("orientationchange", syncViewport);
    window.addEventListener("pagehide", clearViewportState);
    window.addEventListener("pageshow", handlePageShow);
    visualViewport?.addEventListener("resize", syncViewport);
    visualViewport?.addEventListener("scroll", syncViewport);

    return () => {
      root.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("resize", syncViewport);
      window.removeEventListener("orientationchange", syncViewport);
      window.removeEventListener("pagehide", clearViewportState);
      window.removeEventListener("pageshow", handlePageShow);
      visualViewport?.removeEventListener("resize", syncViewport);
      visualViewport?.removeEventListener("scroll", syncViewport);
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(focusTimer);
      clearViewportState();
    };
  }, [enabled, studioRootRef]);
}
