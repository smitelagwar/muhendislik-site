"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";
import { SIMULATIONS_HUB_HREF } from "@/lib/simulations/catalog";

export default function SimulationError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="tool-page-shell py-10">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="rounded-3xl border border-amber-500/40 bg-card/90 dark:bg-[#0f0d22]/90 p-8 text-center space-y-4">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-400" />
          <h1 className="text-xl font-black text-foreground dark:text-white">
            Simülasyon Sahnesi Yüklenirken Bir Sorun Oluştu
          </h1>
          <p className="text-sm text-muted-foreground dark:text-zinc-300">
            Sahne verisi veya görüntüleyici başlatılırken beklenmeyen bir durumla
            karşılaşıldı. Sahneyi yeniden yükleyebilir veya simülasyon kataloğuna
            dönebilirsiniz.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={reset}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-purple-500"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Tekrar Dene</span>
            </button>
            <Link
              href={SIMULATIONS_HUB_HREF}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-border/80 dark:border-white/15 px-5 py-2.5 text-xs font-bold text-foreground dark:text-zinc-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Simülasyon Kataloğuna Dön</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
