"use client";
import { useSyncExternalStore } from "react";
export const PHONE_PRESENTATION_QUERY = "(max-width: 639px), (pointer: coarse) and (max-width: 1023px) and (max-height: 500px)";
function subscribe(callback: () => void) {
  const media = window.matchMedia(PHONE_PRESENTATION_QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
export function usePhonePresentation() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(PHONE_PRESENTATION_QUERY).matches, () => false);
}
