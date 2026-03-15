"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Calculator, Info, Ruler, Sigma } from "lucide-react";
import { ConcreteFieldLabel, ConcreteFormulaCard, ConcreteMetricCard, ConcreteResultRow, ConcreteStatusBadge } from "@/components/concrete-tool-primitives";
import { ConcreteToolShell } from "@/components/concrete-tool-shell";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BEAM_CONCRETE_OPTIONS, BEAM_STEEL_OPTIONS, STIRRUP_DIAMETER_OPTIONS, STIRRUP_LEG_OPTIONS, calculateBeamFlexure, calculateBeamShear } from "@/lib/concrete-tools/beam";
import { formatConcreteNumber, formatMillimetersAsCentimeters, parsePositiveCentimetersToMillimeters, parsePositiveConcreteNumber } from "@/lib/concrete-tools/format";
import type { ConcreteStatusTone } from "@/lib/concrete-tools/types";
import { concreteDisplayFont, concreteMonoFont } from "@/lib/concrete-tools/fonts";
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

export function BeamSectionCalculator() {
  const [widthMm, setWidthMm] = useState("30");
  const [totalHeightMm, setTotalHeightMm] = useState("60");
  const [coverMm, setCoverMm] = useState("30");
  const [stirrupDiameterMm, setStirrupDiameterMm] = useState("10");
  const [designMomentKnM, setDesignMomentKnM] = useState("250");
  const [concreteDesignStrength, setConcreteDesignStrength] = useState("16.7");
  const [steelDesignStrength, setSteelDesignStrength] = useState("365");

  const [designShearKn, setDesignShearKn] = useState("180");
  const [shearWidthMm, setShearWidthMm] = useState("30");
  const [effectiveDepthMm, setEffectiveDepthMm] = useState("55");
  const [shearConcreteStrength, setShearConcreteStrength] = useState("25");
  const [shearStirrupDiameterMm, setShearStirrupDiameterMm] = useState("10");
  const [stirrupLegCount, setStirrupLegCount] = useState("2");
  const [stirrupSpacingMm, setStirrupSpacingMm] = useState("150");

  const flexure = useMemo(() => {
    const parsedWidth = parsePositiveCentimetersToMillimeters(widthMm);
    const parsedHeight = parsePositiveCentimetersToMillimeters(totalHeightMm);
    const parsedCover = parsePositiveConcreteNumber(coverMm);
    const parsedStirrup = parsePositiveConcreteNumber(stirrupDiameterMm);
    const parsedMoment = parsePositiveConcreteNumber(designMomentKnM);
    const parsedConcrete = parsePositiveConcreteNumber(concreteDesignStrength);
    const parsedSteel = parsePositiveConcreteNumber(steelDesignStrength);

    if (!parsedWidth || !parsedHeight || !parsedCover || !parsedStirrup || !parsedMoment || !parsedConcrete || !parsedSteel) {
      return null;
    }

    return calculateBeamFlexure({
      widthMm: parsedWidth,
      totalHeightMm: parsedHeight,
      coverMm: parsedCover,
      stirrupDiameterMm: parsedStirrup,
      designMomentKnM: parsedMoment,
      concreteDesignStrengthMpa: parsedConcrete,
      steelDesignStrengthMpa: parsedSteel,
    });
  }, [concreteDesignStrength, coverMm, designMomentKnM, steelDesignStrength, stirrupDiameterMm, totalHeightMm, widthMm]);

  const shear = useMemo(() => {
    const parsedShear = parsePositiveConcreteNumber(designShearKn);
    const parsedWidth = parsePositiveCentimetersToMillimeters(shearWidthMm);
    const parsedDepth = parsePositiveCentimetersToMillimeters(effectiveDepthMm);
    const parsedConcrete = parsePositiveConcreteNumber(shearConcreteStrength);
    const parsedStirrup = parsePositiveConcreteNumber(shearStirrupDiameterMm);
    const parsedLegs = parsePositiveConcreteNumber(stirrupLegCount);
    const parsedSpacing = parsePositiveConcreteNumber(stirrupSpacingMm);

    if (!parsedShear || !parsedWidth || !parsedDepth || !parsedConcrete || !parsedStirrup || !parsedLegs || !parsedSpacing) {
      return null;
    }

    return calculateBeamShear({
      designShearKn: parsedShear,
      widthMm: parsedWidth,
      effectiveDepthMm: parsedDepth,
      concreteStrengthMpa: parsedConcrete,
      stirrupDiameterMm: parsedStirrup,
      stirrupLegCount: parsedLegs,
      stirrupSpacingMm: parsedSpacing,
    });
  }, [designShearKn, effectiveDepthMm, shearConcreteStrength, shearStirrupDiameterMm, shearWidthMm, stirrupLegCount, stirrupSpacingMm]);

  return (
    <ConcreteToolShell
      toolId="kiris-kesiti"
      badgeLabel="Betonarme aracı"
      title="Kiriş kesiti"
      description="Kaynak dashboard formülleri korunarak tek donatılı eğilme ve kesme kontrolü aynı araç altında toplandı. Girdiler değiştikçe sonuç paneli anlık güncellenir."
    >
      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <section className="space-y-6">
          <div className="tool-panel rounded-[28px] p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className={cn(concreteMonoFont.className, "text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400")}>Eğilme kontrolü</p>
                <h2 className={cn(concreteDisplayFont.className, "mt-2 text-3xl font-black tracking-tight text-zinc-950 dark:text-white")}>Kesit verileri</h2>
              </div>
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                <Calculator className="h-5 w-5" />
              </div>
            </div>

            <ConcreteFormulaCard title="TS 500 — Eğilme">
              <div>K = Md / (b · d²)</div>
              <div>As,req = Md / (fyd · 0.9d)</div>
              <div>As,min = 0.26 · (fctm / fyk) · b · d</div>
            </ConcreteFormulaCard>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <ConcreteFieldLabel label="Kiriş genişliği b" unit="cm" />
                <Input value={widthMm} onChange={(event) => setWidthMm(event.target.value)} inputMode="decimal" className={triggerClassName} />
              </div>
              <div>
                <ConcreteFieldLabel label="Kiriş toplam yüksekliği h" unit="cm" />
                <Input value={totalHeightMm} onChange={(event) => setTotalHeightMm(event.target.value)} inputMode="decimal" className={triggerClassName} />
              </div>
              <div>
                <ConcreteFieldLabel label="Pas payı c" unit="mm" />
                <Input value={coverMm} onChange={(event) => setCoverMm(event.target.value)} inputMode="decimal" className={triggerClassName} />
              </div>
              <div>
                <ConcreteFieldLabel label="Etriye çapı" unit="mm" />
                <Input value={stirrupDiameterMm} onChange={(event) => setStirrupDiameterMm(event.target.value)} inputMode="decimal" className={triggerClassName} />
              </div>
              <div>
                <ConcreteFieldLabel label="Tasarım momenti Md" unit="kNm" />
                <Input value={designMomentKnM} onChange={(event) => setDesignMomentKnM(event.target.value)} inputMode="decimal" className={triggerClassName} />
              </div>
              <div>
                <ConcreteFieldLabel label="Beton sınıfı" />
                <Select value={concreteDesignStrength} onValueChange={setConcreteDesignStrength}>
                  <SelectTrigger className={triggerClassName}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BEAM_CONCRETE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <ConcreteFieldLabel label="Donatı sınıfı" />
                <Select value={steelDesignStrength} onValueChange={setSteelDesignStrength}>
                  <SelectTrigger className={triggerClassName}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BEAM_STEEL_OPTIONS.map((option) => (
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
                <p className={cn(concreteMonoFont.className, "text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400")}>Kesme kontrolü</p>
                <h2 className={cn(concreteDisplayFont.className, "mt-2 text-3xl font-black tracking-tight text-zinc-950 dark:text-white")}>Etriye kontrolü</h2>
              </div>
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300">
                <Ruler className="h-5 w-5" />
              </div>
            </div>

            <ConcreteFormulaCard title="TS 500 — Kesme">
              <div>τ = Vd / (b · d)</div>
              <div>τ,lim = 0.65 · √fck</div>
              <div>Vr ≈ (Asw / s) · fyd · d</div>
            </ConcreteFormulaCard>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <ConcreteFieldLabel label="Tasarım kesme kuvveti Vd" unit="kN" />
                <Input value={designShearKn} onChange={(event) => setDesignShearKn(event.target.value)} inputMode="decimal" className={triggerClassName} />
              </div>
              <div>
                <ConcreteFieldLabel label="Kiriş genişliği b" unit="cm" />
                <Input value={shearWidthMm} onChange={(event) => setShearWidthMm(event.target.value)} inputMode="decimal" className={triggerClassName} />
              </div>
              <div>
                <ConcreteFieldLabel label="Faydalı yükseklik d" unit="cm" />
                <Input value={effectiveDepthMm} onChange={(event) => setEffectiveDepthMm(event.target.value)} inputMode="decimal" className={triggerClassName} />
              </div>
              <div>
                <ConcreteFieldLabel label="Beton sınıfı" />
                <Select value={shearConcreteStrength} onValueChange={setShearConcreteStrength}>
                  <SelectTrigger className={triggerClassName}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["25", "30", "35", "40"].map((value) => (
                      <SelectItem key={value} value={value}>
                        C{value} → fck = {value} MPa
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <ConcreteFieldLabel label="Etriye çapı" unit="mm" />
                <Select value={shearStirrupDiameterMm} onValueChange={setShearStirrupDiameterMm}>
                  <SelectTrigger className={triggerClassName}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STIRRUP_DIAMETER_OPTIONS.map((value) => (
                      <SelectItem key={value} value={String(value)}>
                        Ø{value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <ConcreteFieldLabel label="Etriye kol sayısı" />
                <Select value={stirrupLegCount} onValueChange={setStirrupLegCount}>
                  <SelectTrigger className={triggerClassName}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STIRRUP_LEG_OPTIONS.map((value) => (
                      <SelectItem key={value} value={String(value)}>
                        {value} kollu
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <ConcreteFieldLabel label="Etriye aralığı s" unit="mm" />
                <Input value={stirrupSpacingMm} onChange={(event) => setStirrupSpacingMm(event.target.value)} inputMode="decimal" className={triggerClassName} />
              </div>
            </div>

            <div className="tool-note mt-6 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-300" />
                <p className="text-sm leading-6 text-blue-900 dark:text-blue-100">Bu araç kaynak dashboard mantığını korur. Nihai kesme hesabında eğik basınç ezilmesi, etriye detayları ve deprem bölgelerinde sıklaştırma kuralları ayrıca doğrulanmalıdır.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div className="tool-result-panel overflow-hidden rounded-[28px] p-6 text-white">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className={cn(concreteMonoFont.className, "text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-200/80")}>Canlı sonuç</p>
                <h2 className={cn(concreteDisplayFont.className, "mt-2 text-3xl font-black tracking-tight text-white")}>Eğilme donatısı</h2>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 text-sky-200">
                <Sigma className="h-5 w-5" />
              </div>
            </div>

            {flexure ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <ConcreteStatusBadge tone={flexure.status.tone} label={getStatusLabel(flexure.status.tone)} />
                  <p className="text-sm text-zinc-400">{flexure.status.label}</p>
                </div>
                <div className="mt-5 flex flex-wrap items-end gap-3">
                  <span className={cn(concreteMonoFont.className, "text-5xl font-black text-white md:text-7xl")}>
                    {formatConcreteNumber(flexure.designSteelAreaMm2)}
                  </span>
                  <span className={cn(concreteMonoFont.className, "pb-2 text-lg font-semibold text-sky-200")}>mm²</span>
                </div>
                <p className="mt-4 text-sm leading-7 text-zinc-300">
                  Tasarım alanı, As,req ile As,min karşılaştırılarak büyük olan değer üzerinden üretildi. Referans K sınırı yaklaşık {formatConcreteNumber(flexure.referenceKLimitMpa)} MPa seviyesinde.
                </p>

                <div className="tool-result-inner mt-6 rounded-2xl p-5">
                  <ConcreteResultRow label="Faydalı yükseklik d" value={`${formatMillimetersAsCentimeters(flexure.effectiveDepthMm)} cm`} />
                  <ConcreteResultRow label="Moment katsayısı K" value={`${formatConcreteNumber(flexure.kFactorMpa)} MPa`} tone={flexure.status.tone} />
                  <ConcreteResultRow label="Gerekli As,req" value={`${formatConcreteNumber(flexure.requiredSteelAreaMm2)} mm²`} />
                  <ConcreteResultRow label="Minimum As" value={`${formatConcreteNumber(flexure.minimumSteelAreaMm2)} mm²`} />
                  <ConcreteResultRow label="Tasarım As" value={`${formatConcreteNumber(flexure.designSteelAreaMm2)} mm²`} tone="ok" />
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6">
                <p className={cn(concreteDisplayFont.className, "text-2xl font-black tracking-tight text-white")}>Geçerli veri bekleniyor</p>
                <p className="mt-3 text-sm leading-6 text-zinc-300">Eğilme kontrolünün hesaplanması için tüm alanlara sıfırdan büyük geçerli değer girin.</p>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <ConcreteMetricCard label="Faydalı yükseklik" value={flexure ? formatMillimetersAsCentimeters(flexure.effectiveDepthMm) : "-"} unit="cm" />
            <ConcreteMetricCard label="K katsayısı" value={flexure ? formatConcreteNumber(flexure.kFactorMpa) : "-"} unit="MPa" />
            <ConcreteMetricCard label="Tasarım As" value={flexure ? formatConcreteNumber(flexure.designSteelAreaMm2) : "-"} unit="mm²" />
          </div>

          <div className="tool-panel rounded-[28px] p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className={cn(concreteMonoFont.className, "text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400")}>Kesme özeti</p>
                <h2 className={cn(concreteDisplayFont.className, "mt-2 text-3xl font-black tracking-tight text-zinc-950 dark:text-white")}>Etriye yeterliliği</h2>
              </div>
              <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>

            {shear ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <ConcreteStatusBadge tone={shear.status.tone} label={getStatusLabel(shear.status.tone)} />
                  <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{shear.status.label}</p>
                </div>
                <div className="mt-5 space-y-1">
                  <ConcreteResultRow label="Kesme gerilmesi τ" value={`${formatConcreteNumber(shear.shearStressMpa)} MPa`} tone={shear.status.tone === "fail" ? "fail" : "neutral"} />
                  <ConcreteResultRow label="Sınır gerilme τ,lim" value={`${formatConcreteNumber(shear.shearStressLimitMpa)} MPa`} />
                  <ConcreteResultRow label="Etriye kapasitesi Vr" value={`${formatConcreteNumber(shear.stirrupCapacityKn)} kN`} tone={shear.status.tone === "ok" ? "ok" : "warn"} />
                </div>
              </>
            ) : (
              <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">Kesme paneli, tüm alanlara geçerli değer girildiğinde otomatik olarak hesaplanır.</p>
            )}

            <div className="mt-6 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
              <p className={cn(concreteMonoFont.className, "text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500")}>Pratik not</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">Kaynak dashboard’daki iki ayrı hesap aynı sayfada tutuldu: soldaki moment girişi eğilme donatısını, alttaki kesme bloğu ise etriye yeterliliğini kontrol eder.</p>
            </div>
          </div>
        </section>
      </div>
    </ConcreteToolShell>
  );
}
