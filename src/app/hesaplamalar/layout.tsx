import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, Home, Activity, Sparkles } from "lucide-react";
import { CalculationsSectionNav } from "@/components/calculations-section-nav";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "İnşaat Hesaplamaları & Maliyet Portalı",
  description: "Tahmini inşaat alanı, detaylı inşaat maliyeti, hızlı metraj ve 2026 resmî birim maliyet analiz konsolu.",
  pathname: "/hesaplamalar",
});

export default function HesaplamalarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-blue-500/30 selection:text-foreground dark:selection:text-white">
      {/* NeuroBank Atmospheric Cobalt & Purple Glow Layers */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[650px] w-[1200px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.08)_0%,rgba(99,102,241,0.05)_40%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.18)_0%,rgba(99,102,241,0.12)_40%,transparent_70%)] blur-[120px]" />
        <div className="absolute top-[450px] -right-40 h-[500px] w-[600px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.06)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.12)_0%,transparent_70%)] blur-[130px]" />
        <div className="absolute top-[800px] -left-40 h-[500px] w-[600px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.04)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.08)_0%,transparent_70%)] blur-[130px]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70" />
      </div>

      {/* NeuroBank Top Sticky Nav Bar */}
      <header className="sticky top-14 z-30 border-b border-border/80 bg-background/85 backdrop-blur-2xl transition-all dark:border-blue-500/15 dark:bg-[#050816]/85">
        <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8 lg:px-12">
          {/* Quick Hub Navigation */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              aria-label="Ana Sayfa"
              className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card/80 px-3.5 py-1.5 text-xs font-bold text-muted-foreground transition-all hover:border-blue-500/40 hover:bg-card hover:text-foreground dark:border-white/10 dark:bg-[#0c1029]/80 dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:bg-[#12173b] dark:hover:text-white"
            >
              <Home className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
              <span className="hidden sm:inline">Ana Sayfa</span>
            </Link>

            <div className="hidden h-5 w-px bg-border sm:block dark:bg-white/10" />

            <Link
              href="/kategori/araclar"
              aria-label="Mühendislik Araçları"
              className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card/80 px-3.5 py-1.5 text-xs font-bold text-muted-foreground transition-all hover:border-purple-500/40 hover:bg-card hover:text-foreground dark:border-white/10 dark:bg-[#0c1029]/80 dark:text-slate-300 dark:hover:border-purple-500/40 dark:hover:bg-[#12173b] dark:hover:text-white"
            >
              <Calculator className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400" />
              <span className="hidden md:inline">Mühendislik Araçları</span>
              <span className="md:hidden">Araçlar</span>
            </Link>

            {/* Live Data Status Indicator */}
            <div className="hidden lg:inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse dark:bg-emerald-400" />
              <span>2026 Resmî Tebliğ & Motoru Aktif</span>
            </div>
          </div>

          {/* Calculations Sub-Section Tabs */}
          <CalculationsSectionNav />
        </div>
      </header>

      <main className="relative z-10">{children}</main>
    </div>
  );
}
