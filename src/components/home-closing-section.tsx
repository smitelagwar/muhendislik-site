import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HomeCounts } from "@/lib/home-content";

export function HomeClosingSection({ counts }: { counts: HomeCounts }) {
  return (
    <section
      data-testid="home-closing"
      aria-labelledby="home-closing-title"
      className="border-t border-white/10 bg-[#080808] text-white"
    >
      <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-14 sm:px-8 lg:grid-cols-12 lg:items-center lg:px-12 xl:px-16">
        <div className="lg:col-span-6">
          <p className="home-section-kicker home-section-kicker-inverse">Sonraki adım</p>
          <h2 id="home-closing-title" className="mt-4 text-2xl font-bold tracking-[-0.03em] sm:text-3xl">
            Aradığınız karar yolunu buradan açın.
          </h2>
        </div>
        <div className="grid gap-px overflow-hidden rounded-md border border-white/10 bg-white/10 sm:grid-cols-2 lg:col-span-6">
          <Link href="/konu-haritasi" className="group flex min-h-24 items-center justify-between gap-4 bg-[#0d0d0d] px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
            <span>
              <strong className="block text-sm font-bold text-white">Konu haritası</strong>
              <span className="mt-2 block font-mono text-[10px] uppercase tracking-[0.1em] text-slate-400">
                {counts.articles} teknik içerik
              </span>
            </span>
            <ArrowRight className="h-4 w-4 text-slate-500 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-amber-300" aria-hidden />
          </Link>
          <Link href="/kategori/araclar" className="group flex min-h-24 items-center justify-between gap-4 bg-[#0d0d0d] px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
            <span>
              <strong className="block text-sm font-bold text-white">Araç ve hesaplamalar</strong>
              <span className="mt-2 block font-mono text-[10px] uppercase tracking-[0.1em] text-slate-400">
                {counts.tools + counts.calculations} çalışma modülü
              </span>
            </span>
            <ArrowRight className="h-4 w-4 text-slate-500 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-blue-300" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
