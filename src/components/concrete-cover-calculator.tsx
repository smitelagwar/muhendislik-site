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
import {
  ToolScopeBadge,
  ToolSourceStamp,
  ToolLimitations,
  GoverningCheckCard,
} from "@/components/engineering-primitives";

const triggerClassName = "tool-input h-12 w-full font-semibold text-zinc-900 dark:text-zinc-100";

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
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <ToolScopeBadge kind="classification" />
        <ToolSourceStamp sources={["TS 500 Madde 12.1.2"]} tier="A" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <section className="tool-panel rounded-[28px] p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className={cn(concreteMonoFont.className, "text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400")}>Beton örtü kontrolü</p>
              <h2 className={cn(concreteDisplayFont.className, "mt-2 text-3xl font-black tracking-tight text-zinc-950 dark:text-white")}>Çevre ve donatı verileri</h2>
            </div>
            <div className="rounded-2xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
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

          <div className="tool-note mt-6 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-300" />
              <p className="text-sm leading-6 text-blue-900 dark:text-blue-100">Kaynak HTML’de eleman türü ve güvenlik sınıfı doğrudan sayısal hesabı etkilemiyordu. Burada da aynı davranış korunur; bu iki alan sonuç yorumunda bilgi amaçlı kullanılır.</p>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div className="tool-result-panel overflow-hidden rounded-[28px] p-6 text-white">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className={cn(concreteMonoFont.className, "text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-200/80")}>Canlı sonuç</p>
                <h2 className={cn(concreteDisplayFont.className, "mt-2 text-3xl font-black tracking-tight text-white")}>Nominal örtü</h2>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 text-sky-200">
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
                  <span className={cn(concreteMonoFont.className, "text-4xl font-black text-white sm:text-5xl md:text-7xl")}>
                    {formatConcreteNumber(result.nominalCoverMm)}
                  </span>
                  <span className={cn(concreteMonoFont.className, "pb-2 text-lg font-semibold text-sky-200")}>mm</span>
                </div>
                <p className="mt-4 text-sm leading-7 text-zinc-300">{result.narrative}</p>

                <div className="tool-result-inner mt-6 rounded-2xl p-5">
                  <ConcreteResultRow label="c,min,b" value={`${formatConcreteNumber(result.bondMinimumMm)} mm`} />
                  <ConcreteResultRow label="c,min,dur" value={`${formatConcreteNumber(result.durabilityMinimumMm)} mm`} />
                  <ConcreteResultRow label="c,min" value={`${formatConcreteNumber(result.minimumCoverMm)} mm`} />
                  <ConcreteResultRow label="Δc,dev" value={`${formatConcreteNumber(result.deviationMm)} mm`} />
                  <ConcreteResultRow label="c,nom" value={`${formatConcreteNumber(result.nominalCoverMm)} mm`} tone="ok" />
                  <ConcreteResultRow label="Pratik pas payı" value={`${formatConcreteNumber(result.practicalCoverMm)} mm`} tone="ok" />
                </div>

                <div className="mt-4">
                  <GoverningCheckCard
                    label="TS 500 Nominal Beton Örtüsü Tahkiki"
                    demand={Number(result.minimumCoverMm)}
                    capacity={Number(result.nominalCoverMm)}
                    unit="mm"
                    status="ok"
                    explanation={`Minimum örtü c,min = ${result.minimumCoverMm} mm (Bağ min: ${result.bondMinimumMm} mm, Dürabilite min: ${result.durabilityMinimumMm} mm). Uygulama toleransı Delta-c,dev = ${result.deviationMm} mm eklenerek nominal pas payı c,nom = ${result.nominalCoverMm} mm (Pratik: ${result.practicalCoverMm} mm) belirlendi.`}
                  />
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6">
                <p className={cn(concreteDisplayFont.className, "text-2xl font-black tracking-tight text-white")}>Geçerli veri bekleniyor</p>
                <p className="mt-3 text-sm leading-6 text-zinc-300">Pas payı hesabı için tüm seçim alanları geçerli bir kombinasyon üretmelidir.</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ConcreteMetricCard label="Bağ koşulu" value={result ? formatConcreteNumber(result.bondMinimumMm) : "-"} unit="mm" />
            <ConcreteMetricCard label="Dayanıklılık" value={result ? formatConcreteNumber(result.durabilityMinimumMm) : "-"} unit="mm" />
            <ConcreteMetricCard label="Pratik uygulama" value={result ? formatConcreteNumber(result.practicalCoverMm) : "-"} unit="mm" />
          </div>

          <div className="tool-panel rounded-[28px] p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className={cn(concreteMonoFont.className, "text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400")}>Hesap özeti</p>
                <h2 className={cn(concreteDisplayFont.className, "mt-2 text-3xl font-black tracking-tight text-zinc-950 dark:text-white")}>Örtü bileşenleri</h2>
              </div>
              <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                <Shield className="h-5 w-5" />
              </div>
            </div>

            <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-400">Bu araç nominal örtüyü dayanıklılık + bağ koşulu + tolerans yaklaşımıyla verir. Sahada kalıp işçiliği, eleman maruziyeti ve uygulama kontrol seviyesi bu sonucun üzerinde doğrudan etkilidir.</p>
          </div>
        </section>
      </div>

      {/* Tool Limitations & Normative Bounds */}
      <div className="mt-8">
        <ToolLimitations
          scope={[
            "TS 500 Madde 12.1.2 ve TS EN 1992-1-1 çevresel etki sınıflarına göre (XC, XD, XS) minimum beton örtüsü hesabı",
            "Donatı aderansı (c,min,b) ve durabilite (c,min,dur) koşullarından elverişsiz olanın seçimi",
            "Şantiye sapma toleransı (Delta-c,dev) ile nominal ve pratik pas payı tayini"
          ]}
          limitations={[
            "Yangın dayanımı (R30, R60, R120) için gereken ilave özel beton örtüsü artışını içermez",
            "Agresif kimyasal zemin temaslarında (XA sınıfları) özel sülfata dayanıklı çimento ve kaplama gerekir",
            "Prefabrik elemanların fabrika içi hassas tolerans indirimleri haricen değerlendirilmelidir"
          ]}
          inputProvenance="TS 500 Betonarme Yapıların Tasarım ve Yapım Kuralları Madde 12.1.2 ve TS EN 206 Çevresel Etki Sınıfları"
          defaultOpen={false}
        />
      </div>
    </ConcreteToolShell>
  );
}
