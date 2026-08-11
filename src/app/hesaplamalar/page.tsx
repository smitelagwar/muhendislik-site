import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Calculator,
  FileText,
  Hammer,
  Layers,
  LandPlot,
  Layers3,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { getCalculationPages, type CalculationPageIconKey } from "@/lib/calculation-pages";
import { buildSeoMetadata } from "@/lib/seo";
import { SitePageHeader, SitePageShell } from "@/components/site-page";

export const metadata: Metadata = buildSeoMetadata({
  title: "İnşaat Hesaplamaları",
  description:
    "Hızlı metraj, tahmini inşaat alanı, detaylı inşaat maliyeti ve 2026 resmî birim maliyet araçları.",
  pathname: "/hesaplamalar",
});

const CALCULATION_ICONS: Record<CalculationPageIconKey, LucideIcon> = {
  building: Building2,
  plot: LandPlot,
  file: FileText,
  layers: Layers3,
};

const TOOLS = getCalculationPages();

const COMING_SOON = [
  {
    icon: Hammer,
    label: "Duvar Hesabı",
    description: "Tuğla, gazbeton ve işçilik maliyetini aynı tabloda hesaplar.",
  },
  {
    icon: BarChart3,
    label: "Şap ve Kaplama",
    description: "Şap kalınlığı, alan ve malzeme giderini hızlıca öngörür.",
  },
  {
    icon: Layers,
    label: "Perde Metraj Dağılımı",
    description: "Perde alanı, beton hacmi ve donatı yoğunluğunu kat bandına göre kıyaslar.",
  },
  {
    icon: Wrench,
    label: "Kazı ve Dolgu",
    description: "Temel kotu, iksa varsayımı ve zemin sınıfına göre ilk hacim tahmini üretir.",
  },
];

export default function HesaplamalarPage() {
  return (
    <SitePageShell className="tool-page-shell" width="full">
      <div className="mx-auto max-w-screen-2xl px-6 py-12 sm:px-10 lg:px-16">
        <SitePageHeader
          eyebrow="Mühendislik hesap araçları"
          title="İnşaat hesaplamaları"
          description="Hızlı metraj, tahmini alan, detaylı maliyet ve 2026 resmî birim maliyet araçlarını aynı akışta topluyoruz. Amaç, hızlı ama savunulabilir bir ön değerlendirme sunmak."
          icon={<Calculator className="h-5 w-5" />}
          className="mb-12"
        />

        <section className="mb-12">
          <h2 className="mb-4 text-sm font-black uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
            Aktif araçlar
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {TOOLS.map((tool) => {
              const ToolIcon = CALCULATION_ICONS[tool.iconKey];

              return (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="group tool-panel site-link-card relative overflow-hidden rounded-xl p-6"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.14),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(37,99,235,0.12),_transparent_34%)] opacity-80" />
                  <div className="relative flex h-full flex-col gap-5">
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300">
                        <ToolIcon className="h-5 w-5" />
                      </div>
                      <span className="rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-1 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-amber-800 dark:text-amber-300">
                        {tool.badge}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-zinc-950 transition-colors group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
                        {tool.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                        {tool.description}
                      </p>
                    </div>
                    <div className="mt-auto inline-flex items-center gap-2 text-sm font-black text-amber-700 dark:text-amber-300">
                      Aracı aç
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-black uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
            Sıradaki modüller
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {COMING_SOON.map((item) => (
              <div
                key={item.label}
                className="site-panel rounded-xl p-5 opacity-80"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300">
                  <item.icon className="h-4 w-4" />
                </div>
                <h3 className="mt-4 text-sm font-black text-zinc-900 dark:text-zinc-100">
                  {item.label}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </SitePageShell>
  );
}




