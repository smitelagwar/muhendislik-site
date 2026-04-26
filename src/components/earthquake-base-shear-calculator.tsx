"use client";

import { useMemo, useState } from "react";
import { Activity, Info, Ruler, Zap } from "lucide-react";
import { ConcreteFieldLabel, ConcreteFormulaCard, ConcreteMetricCard, ConcreteResultRow } from "@/components/concrete-tool-primitives";
import { ConcreteToolShell } from "@/components/concrete-tool-shell";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateBaseShear } from "@/lib/concrete-tools/earthquake";
import { concreteDisplayFont, concreteMonoFont } from "@/lib/concrete-tools/fonts";
import { formatConcreteNumber, parsePositiveConcreteNumber } from "@/lib/concrete-tools/format";
import { cn } from "@/lib/utils";

const triggerClassName = "tool-input h-12 w-full font-semibold text-zinc-900 dark:text-zinc-100";

export function EarthquakeBaseShearCalculator() {
  const [totalWeightKn, setTotalWeightKn] = useState("10000");
  const [spectralAccelerationSa, setSpectralAccelerationSa] = useState("1.2");
  const [shortPeriodAccelerationSds, setShortPeriodAccelerationSds] = useState("1.0");
  const [behaviorFactorR, setBehaviorFactorR] = useState("8");
  const [importanceFactorI, setImportanceFactorI] = useState("1.0");

  const result = useMemo(() => {
    const parsedWeight = parsePositiveConcreteNumber(totalWeightKn);
    const parsedSa = parsePositiveConcreteNumber(spectralAccelerationSa);
    const parsedSds = parsePositiveConcreteNumber(shortPeriodAccelerationSds);
    const parsedR = parsePositiveConcreteNumber(behaviorFactorR);
    const parsedI = parsePositiveConcreteNumber(importanceFactorI);

    if (!parsedWeight || !parsedSa || !parsedSds || !parsedR || !parsedI) {
      return null;
    }

    return calculateBaseShear({
      totalWeightKn: parsedWeight,
      spectralAccelerationSa: parsedSa,
      shortPeriodAccelerationSds: parsedSds,
      behaviorFactorR: parsedR,
      importanceFactorI: parsedI,
    });
  }, [totalWeightKn, spectralAccelerationSa, shortPeriodAccelerationSds, behaviorFactorR, importanceFactorI]);

  return (
    <ConcreteToolShell
      toolId="taban-kesme-kuvveti"
      badgeLabel="Deprem Aracı"
      title="Eşdeğer Deprem Yükü Hesabı"
      description="TBDY 2018 kurallarına göre tasarım taban kesme kuvvetinin (Vt) hesaplanması. Minimum deprem yükü kontrolünü otomatik içerir."
    >
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="tool-panel rounded-[28px] p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className={cn(concreteMonoFont.className, "text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400")}>Veri Girişi</p>
              <h2 className={cn(concreteDisplayFont.className, "mt-2 text-3xl font-black tracking-tight text-zinc-950 dark:text-white")}>Bina ve Spektrum Değerleri</h2>
            </div>
            <div className="rounded-2xl bg-teal-100 p-3 text-teal-700 dark:bg-teal-950/30 dark:text-teal-500">
              <Activity className="h-5 w-5" />
            </div>
          </div>

          <ConcreteFormulaCard title="Hesap Mantığı">
            <div>Vt = W · Sa(T) / (R/I)</div>
            <div>Vt,min = 0.04 · W · I · Sds</div>
            <div>Tasarım Yükü = max(Vt, Vt,min)</div>
          </ConcreteFormulaCard>

          <div className="mt-5 space-y-4">
            <div>
              <ConcreteFieldLabel label="Toplam Bina Ağırlığı (W)" unit="kN" />
              <Input value={totalWeightKn} onChange={(event) => setTotalWeightKn(event.target.value)} inputMode="decimal" className={triggerClassName} />
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <ConcreteFieldLabel label="Sa(T) İvmesi" unit="g" />
                <Input value={spectralAccelerationSa} onChange={(event) => setSpectralAccelerationSa(event.target.value)} inputMode="decimal" className={triggerClassName} />
              </div>
              <div>
                <ConcreteFieldLabel label="Kısa Periyot İvmesi (Sds)" unit="g" />
                <Input value={shortPeriodAccelerationSds} onChange={(event) => setShortPeriodAccelerationSds(event.target.value)} inputMode="decimal" className={triggerClassName} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <ConcreteFieldLabel label="Davranış Katsayısı (R)" />
                <Select value={behaviorFactorR} onValueChange={setBehaviorFactorR}>
                  <SelectTrigger className={triggerClassName}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8">8 (Süneklik Düzeyi Yüksek Çerçeve)</SelectItem>
                    <SelectItem value="7">7 (Süneklik Düzeyi Yüksek Perde+Çerçeve)</SelectItem>
                    <SelectItem value="6">6 (Süneklik Düzeyi Yüksek Boşluksuz Perde)</SelectItem>
                    <SelectItem value="4">4 (Süneklik Düzeyi Sınırlı Çerçeve)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <ConcreteFieldLabel label="Bina Önem Katsayısı (I)" />
                <Select value={importanceFactorI} onValueChange={setImportanceFactorI}>
                  <SelectTrigger className={triggerClassName}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1.0">1.0 (Konut, İşyeri)</SelectItem>
                    <SelectItem value="1.2">1.2 (Okul, Müze, Tiyatro)</SelectItem>
                    <SelectItem value="1.5">1.5 (Hastane, İtfaiye, AFAD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="tool-note mt-6 rounded-2xl p-4">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-600 dark:text-teal-500" />
              <p className="text-sm leading-6 text-teal-900 dark:text-teal-100/80">TBDY 2018 Bölüm 4.7.1 gereğince tasarım taban kesme kuvveti, Denklem 4.22 ile tanımlanan minimum değerin altında olamaz.</p>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div className="tool-result-panel overflow-hidden rounded-[28px] p-6 text-white">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className={cn(concreteMonoFont.className, "text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-200/80")}>Canlı Sonuç</p>
                <h2 className={cn(concreteDisplayFont.className, "mt-2 text-3xl font-black tracking-tight text-white")}>Tasarım Taban Kesme Kuvveti</h2>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 text-teal-200">
                <Zap className="h-5 w-5" />
              </div>
            </div>

            {result ? (
              <>
                <div className="mt-2 flex flex-wrap items-end gap-3">
                  <span className={cn(concreteMonoFont.className, "text-4xl font-black text-white sm:text-5xl md:text-7xl")}>{formatConcreteNumber(result.designBaseShearKn)}</span>
                  <span className="mb-2 text-xl font-medium text-white/70 md:mb-3 md:text-2xl">kN</span>
                </div>
                <p className="mt-4 text-sm leading-7 text-zinc-300">
                  {result.isMinimumControlled 
                    ? "Hesaplanan değer minimum sınırın altında kaldığı için TBDY 2018 Denklem 4.22'deki minimum kuvvet geçerli olmuştur." 
                    : "Hesaplanan taban kesme kuvveti, minimum taban kesme kuvvetinden büyüktür ve aynen kullanılmıştır."}
                </p>

                <div className="tool-result-inner mt-6 rounded-2xl p-5">
                  <ConcreteResultRow label="Azaltılmış Deprem Yükü (Vt)" value={`${formatConcreteNumber(result.baseShearKn)} kN`} />
                  <ConcreteResultRow label="Minimum Deprem Yükü (Vt,min)" value={`${formatConcreteNumber(result.minBaseShearKn)} kN`} />
                  <ConcreteResultRow 
                    label="Tasarım Kesme Kuvveti" 
                    value={`${formatConcreteNumber(result.designBaseShearKn)} kN`} 
                    tone={result.isMinimumControlled ? "warn" : "ok"} 
                  />
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6">
                <p className={cn(concreteDisplayFont.className, "text-2xl font-black tracking-tight text-white")}>Geçerli veri bekleniyor</p>
                <p className="mt-3 text-sm leading-6 text-zinc-300">Kesme kuvveti hesabı için tüm alanlara sıfırdan büyük geçerli değer girin.</p>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ConcreteMetricCard label="Hesaplanan Vt" value={result ? formatConcreteNumber(result.baseShearKn) : "-"} unit="kN" />
            <ConcreteMetricCard label="Vt,min" value={result ? formatConcreteNumber(result.minBaseShearKn) : "-"} unit="kN" />
          </div>

          <div className="tool-panel rounded-[28px] p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className={cn(concreteMonoFont.className, "text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400")}>Hesap Özeti</p>
                <h2 className={cn(concreteDisplayFont.className, "mt-2 text-3xl font-black tracking-tight text-zinc-950 dark:text-white")}>TBDY 2018 Kuralları</h2>
              </div>
              <div className="rounded-2xl bg-teal-500/10 p-3 text-teal-700 dark:bg-teal-500/10 dark:text-teal-500">
                <Ruler className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-4 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
              <p><strong className="text-zinc-900 dark:text-white">1. Eşdeğer Yük:</strong> Vt, bina ağırlığının (W) spektral ivme Sa(T) ve azaltma katsayısı (R/I) ile çarpılmasıyla bulunur (Denklem 4.19).</p>
              <p><strong className="text-zinc-900 dark:text-white">2. Alt Sınır:</strong> Binadaki taban kesme kuvveti, hiçbir durumda TBDY 2018 Denklem 4.22 ile tanımlanan %4 W·I·Sds değerinden az olamaz.</p>
            </div>
          </div>
        </section>
      </div>
    </ConcreteToolShell>
  );
}
