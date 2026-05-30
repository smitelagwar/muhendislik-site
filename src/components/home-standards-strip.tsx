"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckSquare, GitBranch } from "lucide-react";
import { AnimatedSection } from "@/components/animated-section";
import type { HomePhasePreview, HomeStandardCard } from "@/components/home-types";
import { Button } from "@/components/ui/button";

interface HomeStandardsStripProps {
  standards: HomeStandardCard[];
  phasePreviews: HomePhasePreview[];
}

// Her inşaat aşaması için kritik mühendislik kontrolleri listesi (TS 500 / Şantiye pratikleri)
const PHASE_CHECKS: Record<string, string[]> = {
  "temel-fore-kazik": ["Zemin Etüt Kontrolü", "Kazı Kotu Muayenesi", "Grobeton & Pas Payı", "Radye Donatı Sıklığı"],
  "kaba-insaat": ["Beton Kırım Testi (Kür)", "Kalıp Söküm Süresi Takibi", "Kolon Düşeylik Toleransı", "Kiriş Sarılma Bölgesi"],
  "ince-isler": ["Tuğla Duvar Örgü & Hatıl", "Cephe Yalıtım (TS 825)", "Islak Hacim İzolasyonu", "Kaba Sıva Terazi Kontrolü"],
  "teslim": ["Taşıyıcı Çatlak Kontrolü", "İş Bitirme Belgeleri", "Nihai Statik Kabul", "Deprem Güvenlik Tescili"]
};

// Standartlar için kritik madde referansları
const STANDARD_CLAUSES: Record<string, string> = {
  "TS 500": "Md. 7.4 (Minimum Donatı Oranları)",
  "TBDY 2018": "Tablo 4.1 (Deprem Tasarım Sınıfları)",
  "TS EN 1992-1-1": "Md. 4.4 (Korozyon ve Pas Payı)",
  "TS EN 206": "Tablo F.1 (Çevresel Etki Sınıfları)"
};

export function HomeStandardsStrip({ standards, phasePreviews }: HomeStandardsStripProps) {
  return (
    <section className="border-y border-slate-200 dark:border-white/5 bg-slate-50/20 dark:bg-[#05070c]/40 py-16 lg:py-20">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-16 space-y-16">
        
        {/* Üst Bölüm: Standart Omurgası */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="home-section-kicker">Standart omurgası</span>
              <span className="rounded bg-amber-500/10 dark:bg-amber-400/10 px-2 py-0.5 font-mono text-[10px] text-amber-600 dark:text-amber-300 font-bold border border-amber-500/20">
                Resmi Mevzuat
              </span>
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Kararları taşıyan teknik referans çerçeve
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500 dark:text-slate-400">
              Hesap araçları ve teknik yazılar, Türkiye ve Avrupa'daki resmi yapı standartlarına yaslanır. 
              Mühendislik hesaplarında bu standartların dışına çıkılması yönetmelik gereği yasaktır.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {standards.map((standard, index) => {
                const clause = STANDARD_CLAUSES[standard.code] || "";

                return (
                  <AnimatedSection key={standard.code} animation="fade-up" delay={index * 60}>
                    <Link
                      href={standard.href}
                      className="group flex h-full flex-col justify-between rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#070b12] p-5 hover:border-amber-400/60 dark:hover:border-amber-400/30 transition-all duration-300"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="rounded border border-amber-500/20 dark:border-amber-400/25 bg-amber-500/10 dark:bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-300">
                            {standard.code}
                          </span>
                          <ArrowRight className="h-4 w-4 text-slate-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-slate-900 dark:group-hover:text-white" />
                        </div>
                        <h3 className="mt-4 text-lg font-black text-slate-800 dark:text-white tracking-tight">
                          {standard.title}
                        </h3>
                        <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                          {standard.description}
                        </p>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-400">{standard.note}</span>
                        {clause && (
                          <span className="font-mono text-amber-600 dark:text-amber-300 font-bold bg-amber-500/5 px-2 py-0.5 rounded">
                            {clause}
                          </span>
                        )}
                      </div>
                    </Link>
                  </AnimatedSection>
                );
              })}
            </div>
          </div>

          {/* Standartlar Sağ Kısım Yan Bilgi Kartı */}
          <div className="relative overflow-hidden rounded-xl border border-cyan-500/20 dark:border-cyan-400/15 bg-white dark:bg-[#070b12] p-6 shadow-sm">
            {/* Üst accent bar - cyan */}
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-cyan-500 to-cyan-400/50 rounded-t-xl" />
            {/* Dekoratif arka plan */}
            <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] pointer-events-none"
                 style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.5) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <h3 className="relative text-lg font-black text-slate-800 dark:text-white tracking-tight border-b border-slate-100 dark:border-white/5 pb-3">
              Mevzuat Sınırları ve Kontroller
            </h3>
            <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">
              Türkiye Bina Deprem Yönetmeliği (TBDY 2018) gereğince, tasarlanan tüm binalarda süneklik düzeyine 
              göre donatı oranları ve kesit sınırları TS 500 kurallarına uyumlu olmak zorundadır. Portalımızdaki 
              formüller bu sınır değerleri aşan durumlarda uyarı vermektedir.
            </p>
            <ul className="mt-4 space-y-3 text-xs">
              <li className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"></span>
                <span>Minimum döşeme kalınlığı: h<sub>f</sub> &ge; l<sub>n</sub> / 30 veya 8 cm (TS 500)</span>
              </li>
              <li className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"></span>
                <span>Kiriş minimum boyuna donatı oranı: &rho;<sub>min</sub> &ge; 0.8 / f<sub>yd</sub></span>
              </li>
              <li className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"></span>
                <span>Minimum pas payı: Kuru çevre koşullarında 20 mm (EC2)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Alt Bölüm: Bina Yolculuğu Timeline */}
        <div className="pt-8 border-t border-slate-200 dark:border-white/5">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-6">
            <div>
              <p className="home-section-kicker">Bina yolculuğu</p>
              <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Kazıdan Teslime Adım Adım Yapım Süreci
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Her inşaat fazının şantiyedeki kritik kabullerini ve akışını gösteren interaktif zaman çizgisi.
              </p>
            </div>
            <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20">
              <GitBranch className="h-5 w-5" />
            </div>
          </div>

          {/* Lineer Zaman Tüneli Grid Layout */}
          <div className="mt-10 grid gap-6 md:grid-cols-4 relative before:absolute before:left-4 md:before:left-0 before:top-2 md:before:top-1/2 before:h-full md:before:h-0.5 before:w-0.5 md:before:w-full before:bg-slate-200 dark:before:bg-white/5 pointer-events-none">
            {phasePreviews.map((phase, index) => {
              const checks = PHASE_CHECKS[phase.id] || [];

              return (
                <AnimatedSection 
                  key={phase.id} 
                  animation="fade-up" 
                  delay={index * 85}
                  className="relative pointer-events-auto pl-8 md:pl-0"
                >
                  {/* Timeline Düğümü */}
                  <div className="absolute left-1.5 md:left-1/2 top-0.5 md:top-0 -translate-x-1/2 -translate-y-1/2 h-6 w-6 rounded-full border-4 border-slate-50 dark:border-[#0c1222] bg-cyan-500 flex items-center justify-center shadow-sm">
                    <span className="text-[10px] font-black text-white">{index + 1}</span>
                  </div>

                  <Link
                    href={phase.href}
                    className="group block rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#070b12] p-5 shadow-sm hover:border-cyan-400/60 dark:hover:border-cyan-400/30 transition-all duration-300 md:mt-6"
                    style={{ borderTop: `4px solid ${phase.accentColor}` }}
                  >
                    <div className="flex gap-4 items-center">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                        <Image src={phase.image} alt={phase.title} fill className="object-cover" sizes="48px" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-base font-black text-slate-800 dark:text-white transition-colors group-hover:text-cyan-600 dark:text-cyan-200 leading-tight">
                          {phase.title}
                        </h4>
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      {phase.summary}
                    </p>

                    {/* Kritik Şantiye Kontrolleri */}
                    {checks.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          <CheckSquare className="h-3 w-3" />
                          Kritik Kontroller
                        </div>
                        <ul className="space-y-1">
                          {checks.map((check) => (
                            <li key={check} className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                              <span className="h-1 w-1 rounded-full bg-cyan-500 shrink-0"></span>
                              <span className="line-clamp-1">{check}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Link>
                </AnimatedSection>
              );
            })}
          </div>

          <div className="mt-10 flex justify-end">
            <Button asChild variant="outline" className="home-button-secondary">
              <Link href="/kategori/bina-asamalari">İnşaat Aşamaları Akışını Aç (D3.js Mindmap) →</Link>
            </Button>
          </div>
        </div>

      </div>
    </section>
  );
}
