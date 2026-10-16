"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

const DESKTOP_QUERY = "(min-width: 768px) and (hover: hover) and (pointer: fine)";
const WhaleScene = dynamic(() => import("./ambient-whale-scene").then(module => module.AmbientWhaleScene), { ssr: false });

function subscribeViewport(listener: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}
const getDesktopSnapshot = () => window.matchMedia(DESKTOP_QUERY).matches;
const getServerSnapshot = () => false;

interface AmbientWhaleCanvasProps { enabled?: boolean; className?: string }

/** Mobilde sahne ve çizim motoru yüklenmez; SSR sırasında da dekorasyon üretilmez. */
export function AmbientWhaleCanvas(props: AmbientWhaleCanvasProps) {
  const isDesktop = useSyncExternalStore(subscribeViewport, getDesktopSnapshot, getServerSnapshot);
  return isDesktop ? <WhaleScene {...props} /> : null;
}
