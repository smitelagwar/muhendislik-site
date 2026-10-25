import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";
import { SIMULATIONS_HUB_HREF } from "@/lib/simulations/catalog";

export default function SimulationNotFound() {
  return (
    <div className="tool-page-shell py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div
          data-testid="simulation-not-found"
          className="rounded-3xl border border-border/80 dark:border-purple-500/25 bg-card/90 dark:bg-[#0f0d22]/90 p-8 text-center space-y-4"
        >
          <Compass className="mx-auto h-10 w-10 text-purple-400" />
          <h1 className="text-2xl font-black text-foreground dark:text-white">
            Simülasyon Sahnesi Bulunamadı (404)
          </h1>
          <p className="text-sm text-muted-foreground dark:text-zinc-300">
            Aradığınız betonarme simülasyon detayı mevcut değil veya henüz yayına
            açılmamış. Katalog üzerinden aktif eğitim sahnelerini açabilirsiniz.
          </p>
          <div className="pt-2">
            <Link
              href={SIMULATIONS_HUB_HREF}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white"
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
