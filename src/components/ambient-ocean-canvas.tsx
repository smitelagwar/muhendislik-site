"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

const DESKTOP_QUERY = "(min-width: 768px) and (hover: hover) and (pointer: fine)";
const OceanScene = dynamic(
  () => import("./ambient-ocean-scene").then(module => module.AmbientOceanScene),
  { ssr: false }
);

function subscribeViewport(listener: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}
const getDesktopSnapshot = () => window.matchMedia(DESKTOP_QUERY).matches;
const getServerSnapshot = () => false;

interface AmbientOceanCanvasProps {
  enabled?: boolean;
  className?: string;
}

/** Mobilde okyanus ekosistemi tuvali yüklenmez; yalnız masaüstünde devreye girer. */
export function AmbientOceanCanvas(props: AmbientOceanCanvasProps) {
  const isDesktop = useSyncExternalStore(subscribeViewport, getDesktopSnapshot, getServerSnapshot);
  return isDesktop ? <OceanScene {...props} /> : null;
}
