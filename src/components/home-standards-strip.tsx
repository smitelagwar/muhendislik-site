import Image from "next/image";
import Link from "next/link";
import { ArrowRight, GitBranchPlus } from "lucide-react";
import { AnimatedSection } from "@/components/animated-section";
import type { HomePhasePreview, HomeStandardCard } from "@/components/home-types";
import { Button } from "@/components/ui/button";

interface HomeStandardsStripProps {
  standards: HomeStandardCard[];
  phasePreviews: HomePhasePreview[];
}

export function HomeStandardsStrip({ standards, phasePreviews }: HomeStandardsStripProps) {
  return (
    <section className="border-y border-slate-200 dark:border-white/10 bg-transparent dark:bg-[#05070c]">
      <div className="mx-auto grid max-w-screen-2xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:px-16 lg:py-20">
        <div>
          <p className="home-section-kicker">Standart omurgası</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Kararları taşıyan teknik referans çerçeve
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">
            Her ana yüzey, hangi standart grubuna yaslandığını açıkça göstermeli. Bu alan, portaldaki çekirdek karar
            omurgasını görünür hale getirir.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {standards.map((standard, index) => (
              <AnimatedSection key={standard.code} animation="fade-up" delay={index * 80}>
                <Link
                  href={standard.href}
                  className="group flex h-full flex-col justify-between rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.68),rgba(7,11,18,0.92))] p-5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-md border border-amber-500/20 dark:border-amber-400/25 bg-amber-500/10 dark:bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-200">
                        {standard.code}
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-500 dark:text-slate-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-slate-900 dark:group-hover:text-white" />
                    </div>
                    <h3 className="mt-5 text-xl font-black text-slate-900 dark:text-white">{standard.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{standard.description}</p>
                  </div>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{standard.note}</p>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="home-section-kicker">Bina yolculuğu</p>
              <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white">Kazıdan teslime tek bakış</h3>
            </div>
            <GitBranchPlus className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
          </div>
          <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
            D3 haritasını ağırlaştırmadan, ana fazların kapısını ilk ekranda açıyoruz. Her kart gerçek rota girişidir.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {phasePreviews.map((phase, index) => (
              <AnimatedSection key={phase.id} animation="fade-up" delay={index * 70}>
                <Link
                  href={phase.href}
                  className="group flex h-full gap-4 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.66),rgba(7,11,18,0.92))] p-4"
                  style={{ boxShadow: `inset 3px 0 0 ${phase.accentColor}` }}
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5">
                    <Image src={phase.image} alt={phase.title} fill className="object-cover" sizes="64px" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-base font-black text-slate-900 dark:text-white transition-colors group-hover:text-cyan-600 dark:text-cyan-200">
                      {phase.title}
                    </h4>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{phase.summary}</p>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>

          <Button asChild variant="outline" className="home-button-secondary mt-8">
            <Link href="/kategori/bina-asamalari">Tüm bina aşamalarını aç</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
