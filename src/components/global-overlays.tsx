"use client";

import dynamic from "next/dynamic";
import { DeferredCommandPalette } from "@/components/deferred-command-palette";

const BackToTop = dynamic(() => import("@/components/back-to-top").then((module) => module.BackToTop), { ssr: false });
const BottomNav = dynamic(() => import("@/components/bottom-nav").then((module) => module.BottomNav), { ssr: false });

export function GlobalOverlays() {
  return (
    <>
      <BottomNav />
      <BackToTop />
      <DeferredCommandPalette />
    </>
  );
}
