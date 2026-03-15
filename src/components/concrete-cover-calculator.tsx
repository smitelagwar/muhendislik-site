"use client";

import { useMemo, useState } from "react";
import { Calculator, Info, Shield, Sigma } from "lucide-react";
import { ConcreteFieldLabel, ConcreteFormulaCard, ConcreteMetricCard, ConcreteResultRow, ConcreteStatusBadge } from "@/components/concrete-tool-primitives";
import { ConcreteToolShell } from "@/components/concrete-tool-shell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { concreteDisplayFont, concreteMonoFont } from "@/lib/concrete-tools/fonts";
import { formatConcreteNumber, parsePositiveConcreteNumber } from "@/lib/concrete-tools/format";
import { COVER_ELEMENT_OPTIONS, COVER_EXPOSURE_OPTIONS, COVER_REBAR_DIAMETER_OPTIONS, COVER_SAFETY_CLASS_OPTIONS, COVER_SERVICE_LIFE_OPTIONS, COVER_STIRRUP_DIAMETER_OPTIONS, calculateConcreteCover } from "@/lib/concrete-tools/cover";
import { cn } from "@/lib/utils";

const triggerClassName =
  "h-12 w-full rounded-none border-zinc-200 bg-zinc-50 font-semibold dark:border-zinc-800 dark:bg-zinc-900 focus-visible:border-amber-500 focus-visible:ring-amber-500/20";

export function ConcreteCoverCalculator() {
  const [elementType, setElementType] = useState("kiris");
  const [exposureClass, setExposureClass] = useState("XC3");
  const [rebarDiameterMm, setRebarDiameterMm] = useState("20");
  const [stirrupDiameterMm, setStirrupDiameterMm] = useState("10");
  const [safetyClass, setSafetyClass] = useState("S2");
  const [serviceLifeYears, setServiceLifeYears] = useState("50");

  const result = useMemo(() => {
    const parsedRebarDiameter = parsePositiveConcreteNumber(rebarDiameterMm);
    const parsedStirrupDiameter = parsePositiveConcreteNumber(stirrupDiameterMm);
    const parsedServiceLife = parsePositiveConcreteNumber(serviceLifeYears);

    if (!parsedRebarDiameter || !parsedStirrupDiameter || !parsedServiceLife) {
      return null;
    }

    return calculateConcreteCover({
      elementType,
      exposureClass: exposureClass as "XC1" | "XC2" | "XC3" | "XC4" | "XS1" | "XS2",
      rebarDiameterMm: parsedRebarDiameter,
      stirrupDiameterMm: parsedStirrupDiameter,
      safetyClass,
      serviceLifeYears: parsedServiceLife,
    });
  }, [elementType, exposureClass, rebarDiameterMm, safetyClass, serviceLifeYears, stirrupDiameterMm]);

  return (
    <ConcreteToolShell
      toolId="pas-payi"
      badgeLabel="Betonarme aracı"
      title="Pas payı"
      description="Nominal beton örtüsü, dayanıklılık ve uygulama toleransı mantığıyla hızlıca hesaplanır. Kaynak dashboard’daki pas payı paneli form yapısı korunarak ayrı route’a taşındı."
    >
      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className={cn(concreteMonoFont.className, "text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400")}>Beton örtü kontrolü</p>
              <h2 className={cn(concreteDisplayFont.className, "mt-2 text-3xl font-black uppercase tracking-[0.08em] text-zinc-950 dark:text-white")}>Çevre ve donatı verileri</h2>
            </div>
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              <Calculator className="h-5 w-5" />
            </div>
          </div>

          <ConcreteFormulaCard title="TS 500 — Pas payı">
            <div>c,min,b = max(Ødonatı, Øetriye, 10)</div>
            <div>c,min = max(c,min,b, c,min,dur)</div>
            <div>c,nom = c,min + Δc,dev</div>
          </ConcreteFormulaCard>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <ConcreteFieldLabel label="Eleman türü" />
              <Select value={elementType} onValueChange={setElementType}>
                <SelectTrigger className={triggerClassName}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COVER_ELEMENT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <ConcreteFieldLabel label="Çevre koşulu" />
              <Select value={exposureClass} onValueChange={setExposureClass}>
                <SelectTrigger className={triggerClassName}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COVER_EXPOSURE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <ConcreteFieldLabel label="Donatı çapı" unit="mm" />
              <Select value={rebarDiameterMm} onValueChange={setRebarDiameterMm}>
                <SelectTrigger className={triggerClassName}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COVER_REBAR_DIAMETER_OPTIONS.map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      Ø{value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <ConcreteFieldLabel label="Etriye / bağ tel çapı" unit="mm" />
              <Select value={stirrupDiameterMm} onValueChange={setStirrupDiameterMm}>
                <SelectTrigger className={triggerClassName}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COVER_STIRRUP_DIAMETER_OPTIONS.map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      Ø{value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <ConcreteFieldLabel label="Yapı güvenlik sınıfı" />
              <Select value={safetyClass} onValueChange={setSafetyClass}>
                <SelectTrigger className={triggerClassName}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COVER_SAFETY_CLASS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <ConcreteFieldLabel label="Yapı servis ömrü" />
              <Select value={serviceLifeYears} onValueChange={setServiceLifeYears}>
                <SelectTrigger className={triggerClassName}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COVER_SERVICE_LIFE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-blue-200/70 bg-blue-50/70 p-4 dark:border-blue-900/60 dark:bg-blue-950/30">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-300" />
              <p className="text-sm leading-6 text-blue-900 dark:text-blue-100">Kaynak HTML’de eleman türü ve güvenlik sınıfı doğrudan sayısal hesabı etkilemiyordu. Burada da aynı davranış korunur; bu iki alan sonuç yorumunda bilgi amaçlı kullanılır.</p>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div className="overflow-hidden rounded-[28px] border border-zinc-200/80 bg-zinc-950 p-6 text-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.55)] dark:border-zinc-800">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className={cn(concreteMonoFont.className, "text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200/70")}>Canlı sonuç</p>
                <h2 className={cn(concreteDisplayFont.className, "mt-2 text-3xl font-black uppercase tracking-[0.08em] text-white")}>Nominal örtü</h2>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 text-amber-200">
                <Sigma className="h-5 w-5" />
              </div>
            </div>

            {result ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <ConcreteStatusBadge tone={result.status.tone} label="Uygun" />
                  <p className="text-sm text-zinc-400">{result.status.label}</p>
                </div>
                <div className="mt-5 flex flex-wrap items-end gap-3">
                  <span className={cn(concreteDisplayFont.className, "text-5xl font-black uppercase tracking-[0.08em] text-white md:text-7xl")}>
                    {formatConcreteNumber(result.nominalCoverMm)}
                  </span>
                  <span className={cn(concreteMonoFont.className, "pb-2 text-lg font-semibold text-amber-200")}>mm</span>
                </div>
                <p className="mt-4 text-sm leading-7 text-zinc-300">{result.narrative}</p>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <ConcreteResultRow label="c,min,b" value={`${formatConcreteNumber(result.bondMinimumMm)} mm`} />
                  <ConcreteResultRow label="c,min,dur" value={`${formatConcreteNumber(result.durabilityMinimumMm)} mm`} />
                  <ConcreteResultRow label="c,min" value={`${formatConcreteNumber(result.minimumCoverMm)} mm`} />
                  <ConcreteResultRow label="Δc,dev" value={`${formatConcreteNumber(result.deviationMm)} mm`} />
                  <ConcreteResultRow label="c,nom" value={`${formatConcreteNumber(result.nominalCoverMm)} mm`} tone="ok" />
                  <ConcreteResultRow label="Pratik pas payı" value={`${formatConcreteNumber(result.practicalCoverMm)} mm`} tone="ok" />
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6">
                <p className={cn(concreteDisplayFont.className, "text-2xl font-black uppercase tracking-[0.08em] text-white")}>Geçerli veri bekleniyor</p>
                <p className="mt-3 text-sm leading-6 text-zinc-300">Pas payı hesabı için tüm seçim alanları geçerli bir kombinasyon üretmelidir.</p>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <ConcreteMetricCard label="Bağ koşulu" value={result ? formatConcreteNumber(result.bondMinimumMm) : "-"} unit="mm" />
            <ConcreteMetricCard label="Dayanıklılık" value={result ? formatConcreteNumber(result.durabilityMinimumMm) : "-"} unit="mm" />
            <ConcreteMetricCard label="Pratik uygulama" value={result ? formatConcreteNumber(result.practicalCoverMm) : "-"} unit="mm" />
          </div>

          <div className="rounded-[28px] border border-zinc-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/70">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className={cn(concreteMonoFont.className, "text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400")}>Hesap özeti</p>
                <h2 className={cn(concreteDisplayFont.className, "mt-2 text-3xl font-black uppercase tracking-[0.08em] text-zinc-950 dark:text-white")}>Örtü bileşenleri</h2>
              </div>
              <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                <Shield className="h-5 w-5" />
              </div>
            </div>

            <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-400">Bu araç nominal örtüyü dayanıklılık + bağ koşulu + tolerans yaklaşımıyla verir. Sahada kalıp işçiliği, eleman maruziyeti ve uygulama kontrol seviyesi bu sonucun üzerinde doğrudan etkilidir.</p>
          </div>
        </section>
      </div>
    </ConcreteToolShell>
  );
}
