import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, Home } from "lucide-react";
import { CalculationsSectionNav } from "@/components/calculations-section-nav";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "İnşaat Hesaplamaları",
  description: "Tahmini inşaat alanı, inşaat maliyeti ve resmî birim maliyet araçları.",
  pathname: "/hesaplamalar",
});

export default function HesaplamalarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-zinc-200/80 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center gap-3 px-6 py-3 sm:px-10 lg:px-16">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-amber-500/40 hover:text-amber-700 dark:hover:text-amber-300"
          >
            <Home className="h-4 w-4" />
            Ana Sayfa
          </Link>

          <div className="mx-1 hidden h-5 w-px bg-zinc-200 dark:bg-zinc-800 sm:block" />

          <CalculationsSectionNav />
        </div>
      </div>

      <div className="border-b border-border bg-[linear-gradient(90deg,rgba(245,158,11,0.1),transparent_45%,rgba(37,99,235,0.08))]">
        <div className="mx-auto flex max-w-screen-2xl items-center gap-3 px-6 py-4 sm:px-10 lg:px-16">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
              Hesaplama araçları
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Alan fizibilitesi | maliyet | resmî referans | metraj odaklı karar desteği
            </p>
          </div>
        </div>
      </div>

      <main>{children}</main>
    </div>
  );
}
