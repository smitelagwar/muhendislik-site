"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Calculator,
  CircleGauge,
  EqualApproximately,
  Info,
  Layers3,
  Sigma,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageContextNavigation } from "@/components/page-context-navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RebarSectionSketch } from "@/components/section-sketch";

const DIAMETERS = [8, 10, 12, 14, 16, 18, 20] as const;

type Diameter = (typeof DIAMETERS)[number];

interface CalculationResult {
  barArea: number;
  totalArea: number;
  quantity: number;
  formula: string;
  label: string;
}

interface EquivalentRow {
  diameter: Diameter;
  barArea: number;
  quantity: number;
  providedArea: number;
  surplusArea: number;
}

const numberFormatter = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function parsePositiveNumber(value: string) {
  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function calculateBarArea(diameter: Diameter) {
  return (Math.PI * diameter * diameter) / 4;
}

function buildResult(diameter: Diameter, quantityValue: string): CalculationResult | null {
  const quantity = parsePositiveNumber(quantityValue);

  if (!quantity) {
    return null;
  }

  const barArea = calculateBarArea(diameter);
  const totalArea = barArea * quantity;

  return {
    barArea,
    totalArea,
    quantity,
    label: `Ø${diameter} x ${formatNumber(quantity)} adet`,
    formula: `As = (π x Ø² / 4) x n = ${formatNumber(barArea)} x ${formatNumber(quantity)}`,
  };
}

function buildEquivalentRows(totalArea: number): EquivalentRow[] {
  return DIAMETERS.map((diameter) => {
    const barArea = calculateBarArea(diameter);
    const quantity = Math.max(1, Math.ceil(totalArea / barArea));
    const providedArea = quantity * barArea;

    return {
      diameter,
      barArea,
      quantity,
      providedArea,
      surplusArea: providedArea - totalArea,
    };
  });
}

export function RebarCalculator() {
  const [diameter, setDiameter] = useState<Diameter>(14);
  const [quantity, setQuantity] = useState("5");

  const result = useMemo(() => buildResult(diameter, quantity), [diameter, quantity]);
  const equivalentRows = useMemo(() => (result ? buildEquivalentRows(result.totalArea) : []), [result]);
  const equivalentForEight = equivalentRows.find((row) => row.diameter === 8);

  return (
    <div className="tool-page-shell py-8 md:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <PageContextNavigation
          showBreadcrumbs={false}
          className="mb-8"
          backLinkClassName="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/85 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-600 transition-colors hover:border-blue-200 hover:text-blue-600 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-300 dark:hover:border-blue-900"
        />

        <div className="mb-10 max-w-3xl">
          <Badge className="mb-4 rounded-full bg-blue-100 px-4 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300">
            Betonarme Aracı
          </Badge>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white md:text-5xl">
            Donatı hesabını hızlıca yapın
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400 md:text-base">
            Donatı çapını ve adetini girin. Tek çubuk alanını, toplam donatı alanını ve diğer çaplar için gereken
            eşdeğer adetleri aynı ekranda görün.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="tool-panel rounded-[28px] p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Girdi bilgileri</p>
                <h2 className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">Çap ve adet seçin</h2>
              </div>
              <div className="rounded-2xl bg-blue-600/10 p-3 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                <Calculator className="h-5 w-5" />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                <label className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
                  <CircleGauge className="h-3.5 w-3.5" />
                  Donatı çapı
                </label>
                <Select value={String(diameter)} onValueChange={(value) => setDiameter(Number(value) as Diameter)}>
                  <SelectTrigger className="tool-input h-12 w-full rounded-xl font-bold">
                    <SelectValue placeholder="Çap seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAMETERS.map((item) => (
                      <SelectItem key={item} value={String(item)}>
                        Ø{item} mm
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                  Tek çubuk alanı:{" "}
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {formatNumber(calculateBarArea(diameter))} mm²
                  </span>
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                <label className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
                  <Layers3 className="h-3.5 w-3.5" />
                  Donatı adedi
                </label>
                <Input
                  inputMode="decimal"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  placeholder="Örn. 5"
                  className="tool-input h-12 rounded-xl text-base font-bold"
                />
                <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                  Sonuç toplam donatı alanını <span className="font-bold">mm²</span> olarak verir.
                </p>
              </div>
            </div>

            <div className="tool-note mt-6 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-300" />
                <p className="text-sm leading-6 text-blue-900 dark:text-blue-100">
                  Hesapta tek çubuk alanı <span className="font-mono font-bold tabular-nums">π x Ø² / 4</span> formülüyle bulunur. Eşdeğer
                  tablo, hedef alandan düşük kalmamak için adetleri yukarı yuvarlayarak verir.
                </p>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-6">
            <div className="tool-result-panel overflow-hidden rounded-[28px] p-6 text-white">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-200/80">Canlı sonuç</p>
                  <h2 className="mt-2 text-2xl font-black">Toplam donatı alanı</h2>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 text-sky-200">
                  <Sigma className="h-5 w-5" />
                </div>
              </div>

              {result ? (
                <>
                  <p className="text-sm font-medium text-sky-100/80">{result.label}</p>
                  <div className="mt-4 flex flex-wrap items-end gap-3">
                    <span className="font-mono text-4xl font-black tracking-tight tabular-nums md:text-6xl">{formatNumber(result.totalArea)}</span>
                    <span className="pb-2 text-lg font-semibold text-sky-200">mm²</span>
                  </div>
                  <p className="mt-4 max-w-xl font-mono text-sm leading-6 tabular-nums text-zinc-200">{result.formula}</p>
                </>
              ) : (
                <div className="tool-result-inner rounded-2xl border border-dashed border-white/15 p-6">
                  <p className="text-lg font-bold text-white">Geçerli bir değer girin</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    Hesaplama için adet alanına sıfırdan büyük bir değer yazmanız gerekiyor.
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="tool-panel rounded-3xl p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Tek çubuk</p>
                <p className="mt-3 font-mono text-3xl font-black tabular-nums text-zinc-950 dark:text-white">
                  {formatNumber(calculateBarArea(diameter))}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">mm² alan</p>
              </div>
              <div className="tool-panel rounded-3xl p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Toplam adet</p>
                <p className="mt-3 font-mono text-3xl font-black tabular-nums text-zinc-950 dark:text-white">
                  {result ? formatNumber(result.quantity) : "-"}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Girilen çubuk sayısı</p>
              </div>
              <div className="tool-panel rounded-3xl p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Ø8 eşdeğeri</p>
                <p className="mt-3 font-mono text-3xl font-black tabular-nums text-zinc-950 dark:text-white">
                  {equivalentForEight ? equivalentForEight.quantity : "-"}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {result ? "Aynı alan için gereken minimum adet" : "Geçerli sonuçla hesaplanır"}
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="tool-panel rounded-[28px] p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Alternatifler</p>
                <h2 className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">Eşdeğer donatı tablosu</h2>
              </div>
              <div className="rounded-2xl bg-blue-600/10 p-3 text-blue-600 dark:text-blue-300">
                <EqualApproximately className="h-5 w-5" />
              </div>
            </div>

            {result ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Çap</TableHead>
                    <TableHead>1 çubuk</TableHead>
                    <TableHead>Gerekli adet</TableHead>
                    <TableHead>Sağlanan alan</TableHead>
                    <TableHead className="text-right">Fazlalık</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equivalentRows.map((row) => {
                    const isActive = row.diameter === diameter;

                    return (
                      <TableRow key={row.diameter} className={isActive ? "ring-1 ring-inset ring-blue-500/30" : undefined}>
                        <TableCell className="font-bold">
                          <div className="flex items-center gap-2">
                            <span>Ø{row.diameter}</span>
                            {isActive ? (
                              <Badge className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-black text-white hover:bg-blue-600">
                                Seçili
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono tabular-nums">{formatNumber(row.barArea)} mm²</TableCell>
                        <TableCell className="font-mono tabular-nums">{row.quantity}</TableCell>
                        <TableCell className="font-mono tabular-nums">{formatNumber(row.providedArea)} mm²</TableCell>
                        <TableCell className="text-right font-mono font-medium tabular-nums">
                          +{formatNumber(row.surplusArea)} mm²
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                Geçerli bir hesap sonucu oluştuğunda eşdeğer donatı tablosu burada listelenir.
              </div>
            )}
          </section>

          <section className="tool-panel rounded-[28px] p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Notlar</p>
                <h2 className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">Hızlı kontrol özeti</h2>
              </div>
              <div className="rounded-2xl bg-blue-600/10 p-3 text-blue-600 dark:text-blue-300">
                <BadgeCheck className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="tool-formula-card rounded-2xl p-4">
                <p className="text-sm font-bold text-zinc-950 dark:text-white">Kontrol formülü</p>
                <p className="mt-2 font-mono text-sm leading-6 tabular-nums text-zinc-600 dark:text-zinc-300">
                  {result ? result.formula : "Formül, geçerli girdi oluştuğunda burada görünür."}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                <p className="text-sm font-bold text-zinc-950 dark:text-white">Pratik yorum</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  <li>Bu araç, toplam donatı alanını hızlıca kontrol etmek için adet bazlı hesap yapar.</li>
                  <li>Eşdeğer tabloda adetler yukarı yuvarlanır; hedef alandan düşük kalan seçenek gösterilmez.</li>
                  <li>Kesin projelendirme öncesinde sonuçları yönetmelik ve detay çözümleriyle birlikte kontrol edin.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-blue-200/70 bg-blue-50/70 p-4 dark:border-blue-900/60 dark:bg-blue-950/30">
                <p className="text-sm font-bold text-blue-950 dark:text-blue-100">Örnek senaryo</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-blue-900/80 dark:text-blue-100/80">
                  <li>
                    Ø14 ve 5 adet için sonuç yaklaşık <span className="font-bold">769,69 mm²</span> olur.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* ── Donatı Düzeni Krokisi Kartı ── */}
          {result && (
            <section className="tool-panel rounded-[28px] p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Görsel kontrol</p>
                  <h2 className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">Donatı düzeni krokisi</h2>
                </div>
                <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
                  <Sigma className="h-5 w-5" />
                </div>
              </div>
              <RebarSectionSketch
                diameterMm={diameter}
                quantity={result.quantity}
              />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
