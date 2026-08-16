import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Calculator,
  FileCheck2,
  FileDown,
  GitBranchPlus,
  HardHat,
  Layers3,
  MousePointer2,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { BelgelerHub } from "@/components/belgeler-hub";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Belgeler ve İndirilebilir Şablonlar | Şantiye Şefi Taahhütname & Tutanaklar",
  description:
    "Mühendis ve mimarlar için şantiye şefliği taahhütnamesi, beton döküm tutanağı ve istifa dilekçesi gibi düzenlenebilir PDF şablonları, form doldurucu ve resmi evrak arşivi.",
  pathname: "/belgeler",
});

const CAPABILITIES = [
  { icon: FileCheck2, value: "3", label: "hazır şablon" },
  { icon: MousePointer2, value: "3", label: "canlı stüdyo" },
  { icon: ShieldCheck, value: "PDF", label: "A4 çıktı" },
];

const RELATED_SECTIONS = [
  {
    icon: HardHat,
    title: "Mevzuat ve Yönetmelikler",
    description: "TBDY 2018, İmar Kanunu ve saha uygulamalarına ilişkin teknik kaynaklar.",
    href: "/kategori/deprem-yonetmelik",
  },
  {
    icon: GitBranchPlus,
    title: "Bina Aşamaları",
    description: "Ruhsattan iskâna kadar şantiye kontrol adımlarını takip edin.",
    href: "/kategori/bina-asamalari",
  },
  {
    icon: Calculator,
    title: "İnşaat Hesaplamaları",
    description: "Alan, metraj ve resmî birim maliyet araçlarına ulaşın.",
    href: "/hesaplamalar",
  },
  {
    icon: Wrench,
    title: "Mühendislik Araçları",
    description: "Sahada ihtiyaç duyulan hızlı teknik yardımcıları kullanın.",
    href: "/kategori/araclar",
  },
];

function DocumentStackVisual() {
  return (
    <div className="relative mx-auto h-[360px] w-full max-w-[470px]" aria-hidden="true">
      <div className="absolute left-14 top-12 h-[275px] w-[210px] -rotate-6 rounded-md border border-border bg-[var(--site-surface-raised)] shadow-[0_28px_70px_-48px_rgba(23,26,25,0.6)] dark:shadow-none" />
      <div className="absolute right-9 top-4 h-[290px] w-[220px] rotate-6 rounded-md border border-blue-500/20 bg-[var(--site-surface)] shadow-[0_32px_80px_-48px_rgba(37,99,235,0.42)] dark:shadow-none" />

      <div className="absolute left-1/2 top-7 h-[300px] w-[230px] -translate-x-1/2 overflow-hidden rounded-md border border-border bg-[var(--site-surface)] shadow-[0_32px_90px_-48px_rgba(23,26,25,0.72)] dark:shadow-none">
        <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-amber-400 to-blue-500" />
        <div className="p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <FileDown className="h-5 w-5" />
            </div>
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              PDF / A4
            </span>
          </div>
          <div className="mt-7 h-2 w-3/4 rounded-full bg-foreground/85" />
          <div className="mt-3 h-1.5 w-1/2 rounded-full bg-muted-foreground/30" />
          <div className="mt-8 space-y-3">
            <div className="h-1.5 rounded-full bg-muted-foreground/18" />
            <div className="h-1.5 rounded-full bg-muted-foreground/18" />
            <div className="h-1.5 w-5/6 rounded-full bg-muted-foreground/18" />
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="h-12 rounded-sm border border-border bg-secondary/50" />
            <div className="h-12 rounded-sm border border-border bg-secondary/50" />
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-dashed border-border pt-4">
            <div className="h-1.5 w-16 rounded-full bg-muted-foreground/20" />
            <div className="h-7 w-7 rounded-full border-2 border-amber-500/45" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 rounded-md border border-border bg-[var(--site-surface)] px-4 py-3 shadow-sm">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Arşiv durumu</p>
        <p className="mt-1 text-sm font-black text-foreground">Kullanıma hazır</p>
      </div>
      <div className="absolute bottom-3 right-0 flex items-center gap-2 rounded-md border border-blue-500/25 bg-blue-500/10 px-4 py-3 text-blue-700 dark:text-blue-300">
        <MousePointer2 className="h-4 w-4" />
        <span className="text-xs font-black">Tarayıcıda doldur</span>
      </div>
    </div>
  );
}

export default function BelgelerPage() {
  return (
    <main className="site-page-shell">
      <section className="border-b border-border/80">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-14 sm:px-8 sm:py-18 lg:grid-cols-12 lg:items-center lg:px-12 lg:py-24 xl:px-16">
          <div className="lg:col-span-7">
            <p className="site-kicker">Resmî şablonlar ve saha evrakları</p>
            <h1 className="mt-7 max-w-4xl text-4xl font-black leading-[0.96] tracking-[-0.05em] text-foreground sm:text-5xl lg:text-7xl">
              Evrak işini hızlandıran
              <span className="block text-amber-700 dark:text-amber-400">teknik belge arşivi.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              Şantiye şefleri, mühendisler ve mimarlar için hazırlanmış belge şablonlarını bulun;
              tarayıcıda doldurun, kontrol edin ve PDF olarak indirin.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#belge-arsivi"
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-amber-500 bg-amber-500 px-5 py-3 text-sm font-black text-zinc-950 transition hover:-translate-y-0.5 hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 motion-reduce:transform-none"
              >
                Belgeleri incele
                <ArrowDown className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-11 grid max-w-2xl grid-cols-3 divide-x divide-border border-y border-border">
              {CAPABILITIES.map(({ icon: Icon, value, label }) => (
                <div key={label} className="py-4 first:pr-4 not-first:px-4">
                  <div className="flex items-center gap-2 text-foreground">
                    <Icon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-lg font-black">{value}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:col-span-5 lg:block">
            <DocumentStackVisual />
          </div>
        </div>
      </section>

      <BelgelerHub />

      <section className="border-t border-border/80 bg-[var(--site-surface)]/45">
        <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20 xl:px-16">
          <div className="flex flex-col gap-3 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Layers3 className="h-4 w-4" />
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]">Portal bağlantıları</p>
              </div>
              <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-foreground sm:text-3xl">
                Çalışmanıza buradan devam edin
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              Belgenin dayandığı teknik bilgiye, saha adımlarına ve hesap araçlarına aynı sistem içinde ulaşın.
            </p>
          </div>

          <div className="grid divide-y divide-border border-b border-border md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
            {RELATED_SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <Link
                  key={section.href}
                  href={section.href}
                  className="group flex min-h-48 flex-col px-1 py-7 transition-colors hover:bg-secondary/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 md:px-6 xl:first:pl-1 xl:last:pr-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-amber-700 transition-colors group-hover:border-amber-500/45 dark:text-amber-400">
                      <Icon className="h-5 w-5" />
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue-600 motion-reduce:transform-none dark:group-hover:text-blue-400" />
                  </div>
                  <h3 className="mt-5 text-base font-black text-foreground">{section.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{section.description}</p>
                </Link>
              );
            })}
          </div>

          <div className="flex justify-end pt-6">
            <p className="inline-flex items-center gap-2.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
              <span>Hazırlayan</span>
              <span className="font-bold text-foreground">İnşaat Müh. Hüseyin GÜNAYDIN</span>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
