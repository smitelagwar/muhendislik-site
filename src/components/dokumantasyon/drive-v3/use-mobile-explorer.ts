"use client";

import { useSyncExternalStore } from "react";
import { MOBILE_EXPLORER_QUERY } from "./explorer-activation";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(MOBILE_EXPLORER_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export function useMobileExplorer() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(MOBILE_EXPLORER_QUERY).matches,
    () => false,
  );
}
