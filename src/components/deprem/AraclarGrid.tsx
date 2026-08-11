import Link from "next/link";
import { ArrowRight, Calculator, CheckSquare2, Compass, type LucideIcon } from "lucide-react";

type Tool = {
  title: string;
  description: string;
  href: string;
  label: string;
  reference: string;
  icon: LucideIcon;
};

const TOOLS: Tool[] = [
  {
    title: "Eşdeğer Deprem Yükü",
    description: "Toplam taban kesme kuvvetini ve katlara dağılan yatay yükleri adım adım hesaplayın.",
    href: "/deprem-yonetmelik/araclar/esit-deprem-yuku",
    label: "Deprem hesabı",
    reference: "TBDY §4.7",
    icon: Calculator,
  },
  {
    title: "Düzensizlik Kontrolü",
    description: "A1–A3 plan ve B1–B3 düşey düzensizliklerini proje verileri üzerinden kontrol edin.",
    href: "/deprem-yonetmelik/araclar/duzensizlik-kontrolu",
    label: "Taşıyıcı sistem",
    reference: "TBDY §3.6",
    icon: CheckSquare2,
  },
  {
    title: "Yerel Zemin Sınıfı",
    description: "Vs30, SPT-N60 veya cu verileriyle ZA–ZF yerel zemin sınıfını belirleyin.",
    href: "/deprem-yonetmelik/araclar/zemin-sinifi",
    label: "Geoteknik",
    reference: "TBDY Tablo 16.1",
    icon: Compass,
  },
];

export default function AraclarGrid() {
  return (
    <section id="araclar" aria-labelledby="deprem-tools-title" className="scroll-mt-24 bg-[var(--home-surface-raised)] px-5 py-12 sm:px-8 lg:px-12 lg:py-16 xl:px-16">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col gap-3 border-b border-[var(--home-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="deprem-tools-title" className="text-2xl font-black tracking-[-0.025em] text-[var(--home-fg)] sm:text-3xl">Deprem hesap araçları</h2>
            <p className="mt-2 text-sm text-[var(--home-muted)]">TBDY 2018 için hazırlanmış hesap ve kontrol araçları.</p>
          </div>
          <Link href="/kategori/araclar" className="home-inline-link">Tüm araçlar <ArrowRight className="h-4 w-4" aria-hidden /></Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-12">
          {TOOLS.map((tool, index) => (
            <article key={tool.href} className={index === 0 ? "min-h-[22rem] lg:col-span-6" : "min-h-[22rem] lg:col-span-3"}>
              <Link href={tool.href} className={`home-resource-card group relative flex h-full overflow-hidden rounded-xl border border-[var(--home-border)] p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent)] ${index === 0 ? "home-resource-card-featured sm:p-8" : ""}`}>
                <tool.icon className="pointer-events-none absolute -bottom-8 -right-8 h-40 w-40 text-[var(--home-fg)] opacity-[0.045] transition-transform duration-300 group-hover:-translate-y-2 group-hover:scale-105" aria-hidden />
                <div className="relative z-10 flex w-full flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <span className="home-resource-icon flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--home-border)] bg-[var(--home-surface-raised)] text-[var(--home-accent)]">
                      <tool.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="border border-[var(--home-border)] bg-[var(--home-surface)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--home-muted)]">{tool.reference}</span>
                  </div>
                  <div className="mt-auto pt-14">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--home-info)]">{tool.label}</p>
                    <h3 className={`${index === 0 ? "text-3xl" : "text-2xl"} mt-3 font-black leading-tight tracking-[-0.025em] text-[var(--home-fg)]`}>{tool.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[var(--home-muted)]">{tool.description}</p>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--home-fg)] transition-colors group-hover:text-[var(--home-accent)]">
                      Aracı aç <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                    </span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
