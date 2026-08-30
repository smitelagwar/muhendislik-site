"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, Calculator, CheckCircle2, Clock3, Info, TestTube2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageContextNavigation } from "@/components/page-context-navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  CEMENT_FACTORS,
  STRUCTURAL_ELEMENTS,
  calculateFormworkStripping,
  type CementType,
  type StructuralElementType,
} from "@/lib/concrete-tools/stripping";

export default function KalipSokumHesapPage() {
  const [betonSinifi, setBetonSinifi] = useState("25");
  const [cimentoTipi, setCimentoTipi] = useState<CementType>("cem1r");
  const [sicaklik, setSicaklik] = useState("20");
  const [elemanTipi, setElemanTipi] = useState<StructuralElementType>("dosemeKucuk");

  const result = useMemo(() => {
    const fck = Number(betonSinifi);
    const temperature = Number(sicaklik);

    if (![fck, temperature].every((value) => Number.isFinite(value))) {
      return null;
    }

    return calculateFormworkStripping({
      concreteClassMpa: fck,
      cementType: cimentoTipi,
      elementType: elemanTipi,
      temperatureC: temperature,
    });
  }, [betonSinifi, cimentoTipi, elemanTipi, sicaklik]);

  return (
    <div className="tool-page-shell relative min-h-screen py-8 md:py-14 text-foreground">
      {/* Cosmic Atmospheric Background Glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-b from-purple-600/20 via-indigo-600/10 to-transparent blur-[120px] dark:from-purple-600/25" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <PageContextNavigation
          showBreadcrumbs={false}
          className="mb-8"
          backLinkClassName="inline-flex items-center gap-2 rounded-xl border border-border/80 dark:border-white/15 bg-card/80 dark:bg-[#120f28]/90 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-200 backdrop-blur-xl transition-all hover:border-purple-500/50 hover:bg-card dark:hover:bg-[#1b173b] hover:text-foreground dark:hover:text-white"
        />

        {/* Hero Header */}
        <div className="mb-10 max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wide text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)] backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-purple-400 animate-ping" />
            <span>Şantiye & Saha Yönetimi</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground dark:text-white sm:text-4xl md:text-5xl">
            Kalıp Söküm{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-400">
              Süresi Hesabı
            </span>
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground dark:text-zinc-300 md:text-base font-normal">
            Çimento tipi, ortam sıcaklığı ve yapı elemanına göre güvenli söküm gününü tahmini olarak görün. Saha kararını hızlandırmak için anlık ön değerlendirme sunar.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          {/* Inputs Section */}
          <section className="tool-panel rounded-[32px] p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3 border-b border-border/70 dark:border-white/10 pb-4">
              <div className="rounded-2xl bg-purple-500/15 border border-purple-500/30 p-3 text-purple-400">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground dark:text-zinc-400">Girdi Bilgileri</p>
                <h2 className="text-xl font-black text-foreground dark:text-white">Senaryoyu Tanımlayın</h2>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">Beton Sınıfı</label>
                <Select value={betonSinifi} onValueChange={setBetonSinifi}>
                  <SelectTrigger className="tool-input h-12 text-foreground dark:text-white font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card dark:bg-[#16132e] border-border dark:border-white/15 text-foreground dark:text-white">
                    <SelectItem value="25">C25/30</SelectItem>
                    <SelectItem value="30">C30/37</SelectItem>
                    <SelectItem value="35">C35/45</SelectItem>
                    <SelectItem value="40">C40/50</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">Çimento Tipi</label>
                <Select value={cimentoTipi} onValueChange={(value) => setCimentoTipi(value as keyof typeof CEMENT_FACTORS)}>
                  <SelectTrigger className="tool-input h-12 text-foreground dark:text-white font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card dark:bg-[#16132e] border-border dark:border-white/15 text-foreground dark:text-white">
                    {Object.entries(CEMENT_FACTORS).map(([key, cement]) => (
                      <SelectItem key={key} value={key}>
                        {cement.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">Yapı Elemanı</label>
                <Select value={elemanTipi} onValueChange={(value) => setElemanTipi(value as StructuralElementType)}>
                  <SelectTrigger className="tool-input h-12 text-foreground dark:text-white font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card dark:bg-[#16132e] border-border dark:border-white/15 text-foreground dark:text-white">
                    {Object.entries(STRUCTURAL_ELEMENTS).map(([key, element]) => (
                      <SelectItem key={key} value={key}>
                        {element.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">Ortalama Sıcaklık (°C)</label>
                <Input
                  value={sicaklik}
                  onChange={(event) => setSicaklik(event.target.value)}
                  inputMode="decimal"
                  className="tool-input h-12 text-foreground dark:text-white font-mono font-bold"
                />
              </div>
            </div>

            <div className="tool-note mt-6 rounded-2xl p-4">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" />
                <p className="text-xs leading-relaxed text-zinc-200">
                  Bu araç ön tahmin üretir. Kalıp sökümünde numune sonucu, kür şartı ve üst kat yükleme planı birlikte değerlendirilmelidir.
                </p>
              </div>
            </div>
          </section>

          {/* Results Section */}
          <section className="flex flex-col gap-6">
            <div className="tool-result-panel overflow-hidden rounded-[32px] p-6 sm:p-8 text-white">
              <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="rounded-2xl bg-white/10 p-3 text-purple-300">
                  <Clock3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-purple-200">Tahmini Sonuç</p>
                  <h2 className="text-xl sm:text-2xl font-black text-white">Bekleme Süresi</h2>
                </div>
              </div>

              {result?.critical ? (
                <>
                  <p className="text-4xl font-black tracking-tight text-rose-400 md:text-5xl">Söküm Önerilmez</p>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-300">5 °C altındaki koşullarda don riski nedeniyle takvim bazlı söküm kararı alınmamalıdır.</p>
                </>
              ) : (
                <>
                  <p className="text-5xl font-black tracking-tight text-white drop-shadow-[0_0_25px_rgba(192,132,252,0.45)] font-mono md:text-6xl">
                    {result?.minimumDays} gün
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                    Minimum söküm eşiği. Daha güvenli program için <strong className="text-purple-300">{result?.safeDays} gün</strong> bekleme önerilir.
                  </p>
                </>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="tool-panel rounded-2xl p-5">
                <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground dark:text-zinc-400">Hedef Dayanım</p>
                <p className="mt-2 text-2xl font-black text-foreground dark:text-white font-mono">{result ? result.targetStrengthMpa.toFixed(1) : "-"}</p>
                <p className="mt-0.5 text-xs text-purple-400 font-bold">MPa</p>
              </div>
              <div className="tool-panel rounded-2xl p-5">
                <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground dark:text-zinc-400">Eşik Oranı</p>
                <p className="mt-2 text-2xl font-black text-foreground dark:text-white font-mono">{result?.ratioLabel ?? "-"}</p>
                <p className="mt-0.5 text-xs text-purple-400 font-bold">fck seviyesi</p>
              </div>
              <div className="tool-panel rounded-2xl p-5">
                <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground dark:text-zinc-400">Sıcaklık Etkisi</p>
                <p className="mt-2 text-2xl font-black text-foreground dark:text-white font-mono">{Number(sicaklik)}°C</p>
                <p className="mt-0.5 text-xs text-purple-400 font-bold">ortalama ortam</p>
              </div>
            </div>

            <div className="tool-panel rounded-[32px] p-6 sm:p-8">
              <div className="mb-5 flex items-center gap-3 border-b border-border/70 dark:border-white/10 pb-4">
                <div className="rounded-2xl bg-purple-500/15 border border-purple-500/30 p-2.5 text-purple-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground dark:text-zinc-400">Notlar</p>
                  <h2 className="text-xl font-black text-foreground dark:text-white">Saha Kontrol Özeti</h2>
                </div>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm leading-relaxed text-muted-foreground dark:text-zinc-300">
                {result?.notes.map((note) => (
                  <li key={note} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground dark:text-white">
                  <TestTube2 className="h-4 w-4 text-purple-400" />
                  Kritik Karar Notu
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-300">
                  Numune yoksa kalıp söküm kararı da yok. Bu araç yalnızca ilk programı kurmak için kullanılmalıdır.
                </p>
              </div>

              <Button asChild className="mt-6 h-11 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(139,92,246,0.4)]">
                <Link href="/kalip-sokumu-rehberi" className="flex items-center justify-center gap-2">
                  Kalıp Sökümü Rehberini Aç
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
