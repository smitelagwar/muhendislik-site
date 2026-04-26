"use client";

import { useMemo, useState } from "react";
import { Calculator, Info, Ruler, Sigma } from "lucide-react";
import { ConcreteFieldLabel, ConcreteFormulaCard, ConcreteMetricCard, ConcreteResultRow } from "@/components/concrete-tool-primitives";
import { ConcreteToolShell } from "@/components/concrete-tool-shell";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COLUMN_PRELIMINARY_CONCRETE_OPTIONS, calculateColumnPreliminarySizing } from "@/lib/concrete-tools/column";
import { concreteDisplayFont, concreteMonoFont } from "@/lib/concrete-tools/fonts";
import { formatConcreteNumber, parsePositiveConcreteNumber } from "@/lib/concrete-tools/format";
import { cn } from "@/lib/utils";
import { ColumnSectionSketch } from "@/components/section-sketch";

const triggerClassName = "tool-input h-12 w-full font-semibold text-foreground";

export function ColumnPreliminarySizingCalculator() {
  const [floorCount, setFloorCount] = useState("5");
  const [tributaryAreaM2, setTributaryAreaM2] = useState("20");
  const [deadLoadKnM2, setDeadLoadKnM2] = useState("10");
  const [liveLoadKnM2, setLiveLoadKnM2] = useState("3.5");
  const [concreteStrengthMpa, setConcreteStrengthMpa] = useState("30");

  const result = useMemo(() => {
    const parsedFloorCount = parsePositiveConcreteNumber(floorCount);
    const parsedTributaryArea = parsePositiveConcreteNumber(tributaryAreaM2);
    const parsedDeadLoad = parsePositiveConcreteNumber(deadLoadKnM2);
    const parsedLiveLoad = parsePositiveConcreteNumber(liveLoadKnM2);
    const parsedConcreteStrength = parsePositiveConcreteNumber(concreteStrengthMpa);

    if (!parsedFloorCount || !parsedTributaryArea || !parsedDeadLoad || !parsedLiveLoad || !parsedConcreteStrength) {
      return null;
    }

    return calculateColumnPreliminarySizing({
      floorCount: parsedFloorCount,
      tributaryAreaM2: parsedTributaryArea,
      deadLoadKnM2: parsedDeadLoad,
      liveLoadKnM2: parsedLiveLoad,
      concreteStrengthMpa: parsedConcreteStrength,
    });
  }, [concreteStrengthMpa, deadLoadKnM2, floorCount, liveLoadKnM2, tributaryAreaM2]);

  return (
    <ConcreteToolShell
      toolId="kolon-on-boyutlandirma"
      badgeLabel="Betonarme aracı"
      title="Kolon ön boyutlandırma"
      description="Mevcut kolon aracı betonarme aile shell’ine taşındı. İlk kesit önerisi, eksenel tasarım yükü ve minimum kesit alanı aynı ekranda hızlı ön değerlendirme için korunur."
    >
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="tool-panel rounded-[28px] p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className={cn(concreteMonoFont.className, "text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400")}>Veri girişi</p>
              <h2 className={cn(concreteDisplayFont.className, "mt-2 text-3xl font-black tracking-tight text-foreground")}>Yük ve beton sınıfı</h2>
            </div>
            <div className="rounded-2xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
              <Calculator className="h-5 w-5" />
            </div>
          </div>

          <ConcreteFormulaCard title="Ön boyut mantığı">
            <div>Pd = 1.4G + 1.6Q</div>
            <div>Nd = Pd · etki alanı · kat sayısı</div>
            <div>Ac,min ≈ Nd / (0.40 · fck)</div>
          </ConcreteFormulaCard>

          <div className="mt-5 space-y-4">
            <div>
              <ConcreteFieldLabel label="Kat sayısı" />
              <Input value={floorCount} onChange={(event) => setFloorCount(event.target.value)} inputMode="decimal" className={triggerClassName} />
            </div>
            <div>
              <ConcreteFieldLabel label="Kolon etki alanı" unit="m²" />
              <Input value={tributaryAreaM2} onChange={(event) => setTributaryAreaM2(event.target.value)} inputMode="decimal" className={triggerClassName} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <ConcreteFieldLabel label="Sabit yük G" unit="kN/m²" />
                <Input value={deadLoadKnM2} onChange={(event) => setDeadLoadKnM2(event.target.value)} inputMode="decimal" className={triggerClassName} />
              </div>
              <div>
                <ConcreteFieldLabel label="Hareketli yük Q" unit="kN/m²" />
                <Input value={liveLoadKnM2} onChange={(event) => setLiveLoadKnM2(event.target.value)} inputMode="decimal" className={triggerClassName} />
              </div>
            </div>
            <div>
              <ConcreteFieldLabel label="Beton sınıfı" />
              <Select value={concreteStrengthMpa} onValueChange={setConcreteStrengthMpa}>
                <SelectTrigger className={triggerClassName}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLUMN_PRELIMINARY_CONCRETE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="tool-note mt-6 rounded-2xl p-4">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-300" />
              <p className="text-sm leading-6 text-blue-900 dark:text-blue-100">Bu araç ilk kesit seçiminde hız kazandırır. Moment etkileri, süneklik kuralları ve detaylandırma kontrolleri sonraki tasarım adımında ayrıca yapılmalıdır.</p>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div className="tool-result-panel overflow-hidden rounded-[28px] p-6 text-white">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className={cn(concreteMonoFont.className, "text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-200/80")}>Canlı sonuç</p>
                <h2 className={cn(concreteDisplayFont.className, "mt-2 text-3xl font-black tracking-tight text-white")}>Önerilen başlangıç kesiti</h2>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 text-sky-200">
                <Sigma className="h-5 w-5" />
              </div>
            </div>

            {result ? (
              <>
                <div className="mt-2 flex flex-wrap items-end gap-3">
                  <span className={cn(concreteMonoFont.className, "text-4xl font-black text-white sm:text-5xl md:text-7xl")}>{result.recommendedSection}</span>
                </div>
                <p className="mt-4 text-sm leading-7 text-zinc-300">En küçük kenar 30 cm kabul edilerek ilk kesit önerisi oluşturuldu. Bu kesit, kolon kontrol bloklarının ekleneceği ikinci tur için referans başlangıç noktasıdır.</p>

                <div className="tool-result-inner mt-6 rounded-2xl p-5">
                  <ConcreteResultRow label="Birim alan yükü Pd" value={`${formatConcreteNumber(result.designAreaLoadKnM2)} kN/m²`} />
                  <ConcreteResultRow label="Eksenel tasarım yükü Nd" value={`${formatConcreteNumber(result.designAxialLoadKn)} kN`} />
                  <ConcreteResultRow label="Minimum kesit alanı" value={`${formatConcreteNumber(result.minimumAreaCm2)} cm²`} />
                  <ConcreteResultRow label="Önerilen kısa kenar" value={`${formatConcreteNumber(result.shortEdgeCm)} cm`} />
                  <ConcreteResultRow label="Önerilen uzun kenar" value={`${formatConcreteNumber(result.longEdgeCm)} cm`} tone="ok" />
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6">
                <p className={cn(concreteDisplayFont.className, "text-2xl font-black tracking-tight text-white")}>Geçerli veri bekleniyor</p>
                <p className="mt-3 text-sm leading-6 text-zinc-300">Kolon başlangıç kesiti için tüm alanlara sıfırdan büyük geçerli değer girin.</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ConcreteMetricCard label="Birim alan yükü" value={result ? formatConcreteNumber(result.designAreaLoadKnM2) : "-"} unit="kN/m²" />
            <ConcreteMetricCard label="Eksenel yük" value={result ? formatConcreteNumber(result.designAxialLoadKn) : "-"} unit="kN" />
            <ConcreteMetricCard label="Min. alan" value={result ? formatConcreteNumber(result.minimumAreaCm2) : "-"} unit="cm²" />
          </div>

          <div className="tool-panel rounded-[28px] p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className={cn(concreteMonoFont.className, "text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400")}>Hesap özeti</p>
                <h2 className={cn(concreteDisplayFont.className, "mt-2 text-3xl font-black tracking-tight text-foreground")}>Kullanılan yaklaşım</h2>
              </div>
              <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                <Ruler className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-4 text-sm leading-7 text-muted-foreground">
              <p><strong className="text-foreground">1.</strong> Tasarım yükü: Pd = 1.4G + 1.6Q</p>
              <p><strong className="text-foreground">2.</strong> Eksenel yük: Nd = Pd × etki alanı × kat sayısı</p>
              <p><strong className="text-foreground">3.</strong> Sınır kontrolü: Nd ≤ 0.40 × Ac × fck</p>
              <p><strong className="text-foreground">4.</strong> İlk kesit önerisi için minimum alan 30 cm kısa kenar varsayımıyla yuvarlanır.</p>
            </div>
          </div>

          {/* ── Enkesit Krokisi Kartı ── */}
          <div className="tool-panel rounded-[28px] p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className={cn(concreteMonoFont.className, "text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400")}>Görsel kontrol</p>
                <h2 className={cn(concreteDisplayFont.className, "mt-2 text-2xl font-black tracking-tight text-foreground")}>Enkesit krokisi</h2>
              </div>
              <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
                <Ruler className="h-5 w-5" />
              </div>
            </div>
            {result ? (
              <ColumnSectionSketch
                shortEdgeCm={result.shortEdgeCm}
                longEdgeCm={result.longEdgeCm}
                coverMm={30}
              />
            ) : (
              <div className="flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40">
                <p className="text-xs font-semibold text-zinc-500">Hesap tamamlandığında kesit görünecek</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </ConcreteToolShell>
  );
}
