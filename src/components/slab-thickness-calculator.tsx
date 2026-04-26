"use client";

import { useMemo, useState } from "react";
import { Calculator, Info, Layers3, Sigma } from "lucide-react";
import { ConcreteFieldLabel, ConcreteFormulaCard, ConcreteMetricCard, ConcreteResultRow, ConcreteStatusBadge } from "@/components/concrete-tool-primitives";
import { ConcreteToolShell } from "@/components/concrete-tool-shell";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { concreteDisplayFont, concreteMonoFont } from "@/lib/concrete-tools/fonts";
import { formatConcreteNumber, formatMillimetersAsCentimeters, parsePositiveCentimetersToMillimeters, parsePositiveConcreteNumber } from "@/lib/concrete-tools/format";
import { SLAB_BAR_DIAMETER_OPTIONS, SLAB_LOAD_OPTIONS, SLAB_STEEL_OPTIONS, SLAB_TYPE_OPTIONS, calculateSlabMinimumRebar, calculateSlabThickness } from "@/lib/concrete-tools/slab";
import type { ConcreteStatusTone } from "@/lib/concrete-tools/types";
import { cn } from "@/lib/utils";

function getStatusLabel(tone: ConcreteStatusTone) {
  switch (tone) {
    case "ok":
      return "Yeterli";
    case "warn":
      return "Kontrol";
    default:
      return "Yetersiz";
  }
}

const triggerClassName = "tool-input h-12 w-full font-semibold text-zinc-900 dark:text-zinc-100";

export function SlabThicknessCalculator() {
  const [shortSpanMeters, setShortSpanMeters] = useState("5.0");
  const [longSpanMeters, setLongSpanMeters] = useState("6.0");
  const [slabType, setSlabType] = useState("sur_cift");
  const [steelStrength, setSteelStrength] = useState("500");
  const [serviceLoad, setServiceLoad] = useState("2.0");
  const [thicknessMm, setThicknessMm] = useState("18");
  const [barDiameterMm, setBarDiameterMm] = useState("10");

  const thicknessResult = useMemo(() => {
    const parsedShortSpan = parsePositiveConcreteNumber(shortSpanMeters);
    const parsedLongSpan = parsePositiveConcreteNumber(longSpanMeters);
    const parsedSteel = parsePositiveConcreteNumber(steelStrength);

    if (!parsedShortSpan || !parsedLongSpan || !parsedSteel) {
      return null;
    }

    return calculateSlabThickness({
      shortSpanMeters: parsedShortSpan,
      longSpanMeters: parsedLongSpan,
      slabType,
      steelStrengthMpa: parsedSteel,
    });
  }, [longSpanMeters, shortSpanMeters, slabType, steelStrength]);

  const rebarResult = useMemo(() => {
    const parsedThickness = parsePositiveCentimetersToMillimeters(thicknessMm);
    const parsedBarDiameter = parsePositiveConcreteNumber(barDiameterMm);

    if (!parsedThickness || !parsedBarDiameter) {
      return null;
    }

    return calculateSlabMinimumRebar({
      thicknessMm: parsedThickness,
      barDiameterMm: parsedBarDiameter,
    });
  }, [barDiameterMm, thicknessMm]);

  const selectedLoadLabel = SLAB_LOAD_OPTIONS.find((option) => option.value === serviceLoad)?.label ?? "Yük sınıfı";

  return (
    <ConcreteToolShell
      toolId="doseme-kalinligi"
      badgeLabel="Betonarme aracı"
      title="Döşeme kalınlığı"
      description="Açıklık-kalınlık oranı, minimum döşeme kalınlığı ve 1 metre şerit için minimum donatı hesabı tek ekranda yer alır. Kaynak dashboard’daki iki blok birlikte taşındı."
    >
      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <section className="space-y-6">
          <div className="tool-panel rounded-[28px] p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className={cn(concreteMonoFont.className, "text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400")}>Ön boyutlandırma</p>
                <h2 className={cn(concreteDisplayFont.className, "mt-2 text-3xl font-black tracking-tight text-zinc-950 dark:text-white")}>Açıklık ve tip</h2>
              </div>
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                <Calculator className="h-5 w-5" />
              </div>
            </div>

            <ConcreteFormulaCard title="TS 500 — Açıklık / kalınlık">
              <div>hmin = L / oran / (0.4 + fyk / 700)</div>
              <div>Öneri = üst 1 cm yuvarlama + minimum kalınlık kontrolü</div>
            </ConcreteFormulaCard>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <ConcreteFieldLabel label="Kısa açıklık Lx" unit="m" />
                <Input value={shortSpanMeters} onChange={(event) => setShortSpanMeters(event.target.value)} inputMode="decimal" className={triggerClassName} />
              </div>
              <div>
                <ConcreteFieldLabel label="Uzun açıklık Ly" unit="m" />
                <Input value={longSpanMeters} onChange={(event) => setLongSpanMeters(event.target.value)} inputMode="decimal" className={triggerClassName} />
              </div>
              <div>
                <ConcreteFieldLabel label="Döşeme tipi" />
                <Select value={slabType} onValueChange={setSlabType}>
                  <SelectTrigger className={triggerClassName}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SLAB_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <ConcreteFieldLabel label="Donatı sınıfı" />
                <Select value={steelStrength} onValueChange={setSteelStrength}>
                  <SelectTrigger className={triggerClassName}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SLAB_STEEL_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <ConcreteFieldLabel label="Kullanım yükü qk" unit="kN/m²" />
                <Select value={serviceLoad} onValueChange={setServiceLoad}>
                  <SelectTrigger className={triggerClassName}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SLAB_LOAD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="tool-panel rounded-[28px] p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className={cn(concreteMonoFont.className, "text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400")}>Minimum donatı</p>
                <h2 className={cn(concreteDisplayFont.className, "mt-2 text-3xl font-black tracking-tight text-zinc-950 dark:text-white")}>1 metre şerit</h2>
              </div>
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300">
                <Layers3 className="h-5 w-5" />
              </div>
            </div>

            <ConcreteFormulaCard title="TS 500 — As,min">
              <div>As,min = 0.002 · b · h</div>
              <div>Aralık,max = min(2h, 250 mm)</div>
              <div>Öneri aralığı 25 mm modülüne aşağı yuvarlanır.</div>
            </ConcreteFormulaCard>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <ConcreteFieldLabel label="Döşeme kalınlığı h" unit="cm" />
                <Input value={thicknessMm} onChange={(event) => setThicknessMm(event.target.value)} inputMode="decimal" className={triggerClassName} />
              </div>
              <div>
                <ConcreteFieldLabel label="Donatı çapı" unit="mm" />
                <Select value={barDiameterMm} onValueChange={setBarDiameterMm}>
                  <SelectTrigger className={triggerClassName}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SLAB_BAR_DIAMETER_OPTIONS.map((value) => (
                      <SelectItem key={value} value={String(value)}>
                        Ø{value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="tool-note mt-6 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-300" />
                <p className="text-sm leading-6 text-blue-900 dark:text-blue-100">Kaynak HTML’de seçilen kullanım yükü qk sayısal kalınlık hesabına girmiyordu. Burada da aynı davranış korunur; yük sınıfı sonuç özetinde bilgi olarak gösterilir.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div className="tool-result-panel overflow-hidden rounded-[28px] p-6 text-white">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className={cn(concreteMonoFont.className, "text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-200/80")}>Canlı sonuç</p>
                <h2 className={cn(concreteDisplayFont.className, "mt-2 text-3xl font-black tracking-tight text-white")}>Önerilen kalınlık</h2>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 text-sky-200">
                <Sigma className="h-5 w-5" />
              </div>
            </div>

            {thicknessResult ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <ConcreteStatusBadge tone={thicknessResult.status.tone} label={getStatusLabel(thicknessResult.status.tone)} />
                  <p className="text-sm text-zinc-400">{thicknessResult.status.label}</p>
                </div>
                <div className="mt-5 flex flex-wrap items-end gap-3">
                  <span className={cn(concreteMonoFont.className, "text-4xl font-black text-white sm:text-5xl md:text-7xl")}>
                    {formatMillimetersAsCentimeters(thicknessResult.recommendedThicknessMm)}
                  </span>
                  <span className={cn(concreteMonoFont.className, "pb-2 text-lg font-semibold text-sky-200")}>cm</span>
                </div>
                <p className="mt-4 text-sm leading-7 text-zinc-300">
                  {thicknessResult.slabTypeLabel} için açıklık oranı {formatConcreteNumber(thicknessResult.aspectRatio)} bulundu. Seçili yük sınıfı: {selectedLoadLabel}.
                </p>

                <div className="tool-result-inner mt-6 rounded-2xl p-5">
                  <ConcreteResultRow label="Açıklık oranı Ly/Lx" value={formatConcreteNumber(thicknessResult.aspectRatio)} tone={thicknessResult.status.tone === "warn" ? "warn" : "neutral"} />
                  <ConcreteResultRow label="Hesap açıklığı" value={`${formatConcreteNumber(thicknessResult.governingSpanMeters)} m (Lx)`} />
                  <ConcreteResultRow label="Teorik minimum" value={`${formatMillimetersAsCentimeters(thicknessResult.minimumThicknessMm)} cm`} />
                  <ConcreteResultRow label="1 cm yuvarlama" value={`${formatMillimetersAsCentimeters(thicknessResult.roundedThicknessMm)} cm`} />
                  <ConcreteResultRow label="Önerilen kalınlık" value={`${formatMillimetersAsCentimeters(thicknessResult.recommendedThicknessMm)} cm`} tone="ok" />
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6">
                <p className={cn(concreteDisplayFont.className, "text-2xl font-black tracking-tight text-white")}>Geçerli veri bekleniyor</p>
                <p className="mt-3 text-sm leading-6 text-zinc-300">Ön boyut sonucu için açıklık, tip ve donatı sınıfı alanlarına sıfırdan büyük değerler girin.</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ConcreteMetricCard label="Açıklık oranı" value={thicknessResult ? formatConcreteNumber(thicknessResult.aspectRatio) : "-"} unit="Ly/Lx" />
            <ConcreteMetricCard label="Teorik minimum" value={thicknessResult ? formatMillimetersAsCentimeters(thicknessResult.minimumThicknessMm) : "-"} unit="cm" />
            <ConcreteMetricCard label="Önerilen kalınlık" value={thicknessResult ? formatMillimetersAsCentimeters(thicknessResult.recommendedThicknessMm) : "-"} unit="cm" />
          </div>

          <div className="tool-panel rounded-[28px] p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className={cn(concreteMonoFont.className, "text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400")}>Minimum donatı özeti</p>
                <h2 className={cn(concreteDisplayFont.className, "mt-2 text-3xl font-black tracking-tight text-zinc-950 dark:text-white")}>Donatı aralığı</h2>
              </div>
              <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                <Layers3 className="h-5 w-5" />
              </div>
            </div>

            {rebarResult ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <ConcreteStatusBadge tone={rebarResult.status.tone} label={getStatusLabel(rebarResult.status.tone)} />
                  <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{rebarResult.status.label}</p>
                </div>
                <div className="mt-5 space-y-1">
                  <ConcreteResultRow label="As,min" value={`${formatConcreteNumber(rebarResult.minimumSteelAreaPerMeterMm2)} mm²/m`} />
                  <ConcreteResultRow label="Seçilen çap alanı" value={`${formatConcreteNumber(rebarResult.selectedBarAreaMm2)} mm²`} />
                  <ConcreteResultRow label="Maksimum aralık" value={`${formatConcreteNumber(rebarResult.maximumSpacingMm)} mm`} />
                  <ConcreteResultRow label="Önerilen aralık" value={`${formatConcreteNumber(rebarResult.recommendedSpacingMm)} mm`} tone="ok" />
                </div>
              </>
            ) : (
              <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">Kalınlık ve donatı çapı alanları geçerli olduğunda minimum donatı özeti burada görünür.</p>
            )}
          </div>
        </section>
      </div>
    </ConcreteToolShell>
  );
}
