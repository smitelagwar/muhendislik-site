"use client";

import { useEffect, useRef } from "react";
import { SiteLogo } from "@/components/site-logo";

const FLOAT_START_Y = 120;
const FLOAT_END_Y = 16;
const DESKTOP_QUERY = "(min-width: 1720px)";
const TRANSITION_DURATION = 380;
const CROSSFADE_DURATION = 160;
const TRANSITION_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

function getSourceLogo() {
  return document.querySelector<HTMLElement>("[data-home-navbar-logo]");
}

function setNavbarLogoHidden(source: HTMLElement | null, hidden: boolean) {
  if (hidden) {
    document.documentElement.dataset.homeLogoFloating = "true";
    if (source) {
      source.inert = true;
      source.setAttribute("aria-hidden", "true");
    }
    return;
  }

  delete document.documentElement.dataset.homeLogoFloating;
  if (source) {
    source.inert = false;
    source.removeAttribute("aria-hidden");
  }
}

export function HomeScrollLogo() {
  const floatingLogoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentLogo = floatingLogoRef.current;
    if (!currentLogo) return;
    const floatingLogo: HTMLDivElement = currentLogo;

    const desktopQuery = window.matchMedia(DESKTOP_QUERY);
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let floating = false;
    let initialized = false;
    let animation: Animation | null = null;
    let animationFrame = 0;

    function stopAnimation() {
      animation?.cancel();
      animation = null;
    }

    function resetImmediately() {
      stopAnimation();
      floating = false;
      floatingLogo.style.opacity = "0";
      floatingLogo.style.transform = "none";
      floatingLogo.dataset.inverse = "false";
      setNavbarLogoHidden(getSourceLogo(), false);
    }

    function syncLogoContrast() {
      const bounds = floatingLogo.getBoundingClientRect();
      const underlyingElement = document.elementFromPoint(
        bounds.left + Math.min(bounds.width / 2, 96),
        bounds.top + Math.min(bounds.height / 2, 44),
      );
      const needsInverseLogo = Boolean(underlyingElement?.closest(".home-process-shell, footer"));
      floatingLogo.dataset.inverse = needsInverseLogo ? "true" : "false";
    }

    function moveLogo(shouldFloat: boolean, animate: boolean) {
      if (floating === shouldFloat) return;

      const sourceLogo = getSourceLogo();
      if (!sourceLogo) return;

      stopAnimation();
      const sourceBounds = sourceLogo.getBoundingClientRect();
      const targetBounds = floatingLogo.getBoundingClientRect();
      const translateX = sourceBounds.left - targetBounds.left;
      const translateY = sourceBounds.top - targetBounds.top;
      const scale = Math.min(
        sourceBounds.width / Math.max(targetBounds.width, 1),
        sourceBounds.height / Math.max(targetBounds.height, 1),
      );
      const sourceTransform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
      const skipAnimation = !animate || reducedMotionQuery.matches;

      floating = shouldFloat;

      if (shouldFloat) {
        floatingLogo.style.opacity = "1";
        setNavbarLogoHidden(sourceLogo, true);
        syncLogoContrast();

        if (skipAnimation) {
          floatingLogo.style.transform = "none";
          return;
        }

        const activeAnimation = floatingLogo.animate(
          [
            { opacity: 1, transform: sourceTransform },
            { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
          ],
          {
            duration: TRANSITION_DURATION,
            easing: TRANSITION_EASING,
            fill: "both",
          },
        );
        animation = activeAnimation;
        activeAnimation.addEventListener("finish", () => {
          floatingLogo.style.opacity = "1";
          floatingLogo.style.transform = "none";
          activeAnimation.cancel();
          if (animation === activeAnimation) animation = null;
        }, { once: true });
        return;
      }

      if (skipAnimation) {
        floatingLogo.style.opacity = "0";
        floatingLogo.style.transform = "none";
        setNavbarLogoHidden(sourceLogo, false);
        return;
      }

      floatingLogo.dataset.inverse = document.documentElement.classList.contains("dark") ? "true" : "false";

      const activeAnimation = floatingLogo.animate(
        [
          { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
          { opacity: 1, transform: sourceTransform },
        ],
        {
          duration: TRANSITION_DURATION,
          easing: TRANSITION_EASING,
          fill: "both",
        },
      );
      animation = activeAnimation;
      activeAnimation.addEventListener("finish", () => {
        floatingLogo.style.opacity = "1";
        floatingLogo.style.transform = sourceTransform;
        activeAnimation.cancel();
        if (animation !== activeAnimation) return;

        setNavbarLogoHidden(sourceLogo, false);
        const crossfadeAnimation = floatingLogo.animate(
          [
            { opacity: 1, transform: sourceTransform },
            { opacity: 0, transform: sourceTransform },
          ],
          {
            duration: CROSSFADE_DURATION,
            easing: "ease-out",
            fill: "both",
          },
        );
        animation = crossfadeAnimation;
        crossfadeAnimation.addEventListener("finish", () => {
          floatingLogo.style.opacity = "0";
          floatingLogo.style.transform = "none";
          crossfadeAnimation.cancel();
          if (animation === crossfadeAnimation) animation = null;
        }, { once: true });
      }, { once: true });
    }

    function syncWithScroll(animate = true) {
      if (!desktopQuery.matches) {
        resetImmediately();
        initialized = true;
        return;
      }

      if (!initialized) {
        const shouldStartFloating = window.scrollY > FLOAT_START_Y;
        if (shouldStartFloating) {
          moveLogo(true, false);
        }
        initialized = true;
        return;
      }

      if (!floating && window.scrollY > FLOAT_START_Y) {
        moveLogo(true, animate);
      } else if (floating && window.scrollY <= FLOAT_END_Y) {
        moveLogo(false, animate);
      }
    }

    function handleScroll() {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        syncWithScroll();
        if (floating) syncLogoContrast();
      });
    }

    function handleViewportChange() {
      initialized = false;
      syncWithScroll(false);
    }

    syncWithScroll(false);
    window.addEventListener("scroll", handleScroll, { passive: true });
    desktopQuery.addEventListener("change", handleViewportChange);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      desktopQuery.removeEventListener("change", handleViewportChange);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      resetImmediately();
    };
  }, []);

  return (
    <div
      ref={floatingLogoRef}
      data-testid="home-scroll-logo"
      data-inverse="false"
      aria-hidden="true"
      className="home-scroll-logo pointer-events-none fixed z-[110] hidden min-[1720px]:block"
    >
      <SiteLogo
        href=""
        lightClassName="h-auto w-full object-contain"
        darkClassName="h-auto w-full object-contain"
        width={264}
        height={88}
      />
    </div>
  );
}
