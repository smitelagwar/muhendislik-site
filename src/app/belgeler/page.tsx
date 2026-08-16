import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  FileCheck2,
  FileDown,
  GitBranchPlus,
  HardHat,
  Layers,
  Wrench,
} from "lucide-react";
import { BelgelerHub } from "@/components/belgeler-hub";
import { SitePageHeader, SitePageShell } from "@/components/site-page";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Belgeler ve İndirilebilir Şablonlar | Şantiye Şefi Taahhütname & Tutanaklar",
  description:
    "Mühendis ve mimarlar için şantiye şefliği taahhütnamesi, beton döküm tutanağı ve istifa dilekçesi gibi düzenlenebilir PDF şablonları, form doldurucu ve resmi evrak arşivi.",
  pathname: "/belgeler",
});

const RELATED_SECTIONS = [
  {
    icon: HardHat,
    title: "Mevzuat ve Yönetmelikler",
    description: "TBDY 2018, İmar Kanunu ve Şantiye Şefleri Yönetmeliği maddeleri.",
    href: "/kategori/deprem-yonetmelik",
  },
  {
    icon: GitBranchPlus,
    title: "Bina Aşamaları Rehberi",
    description: "Ruhsattan iskana kadar tüm şantiye ve inşaat kontrol adımları.",
    href: "/kategori/bina-asamalari",
  },
  {
    icon: Calculator,
    title: "İnşaat Hesaplamaları",
    description: "Tahmini alan, metraj ve 2026 resmî birim maliyet araçları.",
    href: "/hesaplamalar",
  },
  {
    icon: Wrench,
    title: "Mühendislik Araçları",
    description: "Paspayı, donatı alanı, beton sınıfı ve hızlı saha yardımcıları.",
    href: "/kategori/araclar",
  },
];

export default function BelgelerPage() {
  return (
    <SitePageShell className="tool-page-shell" width="full">
      <div className="mx-auto max-w-screen-2xl px-6 py-12 sm:px-10 lg:px-16">
        <SitePageHeader
          eyebrow="Resmi Şablonlar ve Saha Evrakları"
          title="Belgeler ve Şablonlar"
          description="Şantiye şefleri, proje müellifleri ve yapı denetim uzmanları için düzenlenebilir PDF formları, tutanaklar, taahhütnameler ve yasal dilekçe şablonları. Belgeleri indirebilir, tarayıcıda inceleyebilir veya interaktif form üzerinden anında doldurabilirsiniz."
          icon={<FileDown className="h-5 w-5" />}
          className="mb-12"
        />

        {/* Interactive Hub */}
        <BelgelerHub />

        {/* Related Hubs Section */}
        <section className="mt-16 pt-12 border-t border-border/80">
          <div className="flex items-center gap-2 mb-6">
            <Layers className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
              İlgili Portalı Keşfedin
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {RELATED_SECTIONS.map((sec) => {
              const Icon = sec.icon;
              return (
                <Link
                  key={sec.href}
                  href={sec.href}
                  className="group relative flex flex-col justify-between rounded-xl border border-border/70 bg-card/50 p-5 backdrop-blur-sm transition-all hover:border-amber-500/40 hover:bg-secondary hover:shadow-md"
                >
                  <div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-3 font-bold text-foreground text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400">
                      {sec.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {sec.description}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <span>İncele</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </SitePageShell>
  );
}
