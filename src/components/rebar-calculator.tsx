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
  Plus,
  Minus,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Settings2,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageContextNavigation } from "@/components/page-context-navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RebarSectionSketch } from "@/components/section-sketch";
import { getRowLayout } from "@/components/section-sketch/sketch-utils";
import { cn } from "@/lib/utils";

const DIAMETERS = [8, 10, 12, 14, 16, 18, 20, 22, 24, 25, 26, 28, 30, 32] as const;

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

  // Gelişmiş Yerleşim Parametreleri
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [widthCm, setWidthCm] = useState(30);
  const [coverMm, setCoverMm] = useState(30);
  const [stirrupDiameterMm, setStirrupDiameterMm] = useState(8);

  const result = useMemo(() => buildResult(diameter, quantity), [diameter, quantity]);
  const equivalentRows = useMemo(() => (result ? buildEquivalentRows(result.totalArea) : []), [result]);
  const equivalentForEight = equivalentRows.find((row) => row.diameter === 8);

  // Miktar artırma/azaltma işleyicileri
  const handleIncrement = () => {
    const q = parsePositiveNumber(quantity) ?? 0;
    setQuantity(String(q + 1));
  };

  const handleDecrement = () => {
    const q = parsePositiveNumber(quantity) ?? 0;
    if (q > 1) {
      setQuantity(String(q - 1));
    }
  };

  // TS 500 Net Spacing Checker & Alert Box
  const ts500Check = useMemo(() => {
    if (!result) return null;
    const { firstRow } = getRowLayout(result.quantity);
    if (firstRow < 2) return null;

    const b = widthCm * 10; // mm
    const cover = coverMm; // mm
    const ds = stirrupDiameterMm; // mm
    const d = diameter; // mm

    const netSpacingMm = (b - 2 * cover - 2 * ds - firstRow * d) / (firstRow - 1);
    const minSpacingMm = Math.max(25, 1.5 * d);

    const isViolated = netSpacingMm < minSpacingMm;

    return {
      status: isViolated ? "violated" : "ok",
      netSpacingMm,
      minSpacingMm,
      firstRow,
    };
  }, [result, widthCm, coverMm, stirrupDiameterMm, diameter]);

  return (
    <div className="tool-page-shell py-8 md:py-14 bg-gradient-to-b from-[#06080d] via-[#05070c] to-[#06080d] min-h-screen text-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <PageContextNavigation
          showBreadcrumbs={false}
          className="mb-8"
          backLinkClassName="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-300 transition-colors"
        />

        {/* Premium Header */}
        <div className="mb-10 max-w-4xl">
          <Badge className="mb-4 rounded-full bg-amber-500/10 px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 hover:bg-amber-500/15 border border-amber-500/20">
            TS 500 • Betonarme Omurgası
          </Badge>
          <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
            Donatı Alanı ve Eşdeğerlik Workbench&apos;i
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 md:text-base">
            Gövde veya kiriş boyuna donatıları için canlı kesit yerleşim şemasını izleyin. Çap ve adetteki değişimlerin 
            <strong> TS 500 aralık sınırlarına</strong> uygunluğunu milimetrik CAD krokisiyle canlı analiz edin.
          </p>
        </div>

        {/* 2-Column Dashboard Layout */}
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
          
          {/* Sol Kolon: Parametreler & Girişler */}
          <div className="space-y-6">
            <section className="home-glass-panel rounded-[28px] border border-slate-200 dark:border-white/5 bg-slate-900/40 p-6 space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">GİRDİ PANELİ</p>
                  <h2 className="mt-1 text-2xl font-black text-white">Kesit Parametreleri</h2>
                </div>
                <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-500 border border-amber-500/20">
                  <Calculator className="h-5 w-5" />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {/* Donatı Çapı */}
                <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-950/20 p-4">
                  <label className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <CircleGauge className="h-3.5 w-3.5 text-amber-500" />
                    Donatı Çapı (Ø)
                  </label>
                  <Select
                    value={String(diameter)}
                    onValueChange={(value) => setDiameter(Number(value) as Diameter)}
                  >
                    <SelectTrigger className="h-12 w-full rounded-xl font-bold border-slate-200 dark:border-white/10 dark:bg-white/5 text-sm">
                      <SelectValue placeholder="Çap seçin" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 text-slate-100 border-white/10">
                      {DIAMETERS.map((item) => (
                        <SelectItem key={item} value={String(item)}>
                          Ø{item} mm (As1 = {formatNumber(calculateBarArea(item))} mm²)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-3 text-[11px] text-slate-500">
                    Tek çubuk alanı:{" "}
                    <span className="font-mono font-bold text-amber-400">
                      {formatNumber(calculateBarArea(diameter))} mm²
                    </span>
                  </p>
                </div>

                {/* Donatı Adedi with increment buttons */}
                <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-950/20 p-4">
                  <label className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <Layers3 className="h-3.5 w-3.5 text-amber-500" />
                    Donatı Adedi (n)
                  </label>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleDecrement}
                      className="h-12 w-12 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 active:scale-95 transition-transform"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      inputMode="decimal"
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value)}
                      placeholder="Örn. 5"
                      className="h-12 flex-1 rounded-xl text-center text-base font-black dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleIncrement}
                      className="h-12 w-12 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 active:scale-95 transition-transform"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <p className="mt-3 text-[11px] text-slate-500">
                    Krokide yerleşimi anında izlemek için butonları kullanın.
                  </p>
                </div>
              </div>

              {/* Gelişmiş Parametreler Akordiyonu */}
              <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-950/20 p-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex w-full items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-300"
                >
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-amber-500" />
                    <span>Gelişmiş Yerleşim Ayarları (TS 500)</span>
                  </div>
                  {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {showAdvanced && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-3 border-t border-white/5 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Eleman Genişliği (b, cm)</label>
                      <Input
                        type="number"
                        min="10"
                        max="200"
                        value={widthCm}
                        onChange={(e) => setWidthCm(Math.max(10, Number(e.target.value)))}
                        className="h-10 rounded-lg text-xs font-mono font-bold dark:bg-white/5 border border-white/10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Pas Payı (c, mm)</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={coverMm}
                        onChange={(e) => setCoverMm(Math.max(0, Number(e.target.value)))}
                        className="h-10 rounded-lg text-xs font-mono font-bold dark:bg-white/5 border border-white/10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Etriye Çapı (Øe, mm)</label>
                      <Input
                        type="number"
                        min="4"
                        max="20"
                        value={stirrupDiameterMm}
                        onChange={(e) => setStirrupDiameterMm(Math.max(0, Number(e.target.value)))}
                        className="h-10 rounded-lg text-xs font-mono font-bold dark:bg-white/5 border border-white/10"
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* TS 500 Net Spacing Checker & Alert Box */}
            {ts500Check && (
              <div
                className={cn(
                  "rounded-2xl p-5 border transition-all duration-300",
                  ts500Check.status === "violated"
                    ? "bg-red-500/5 border-red-500/20 text-red-200"
                    : "bg-emerald-500/5 border-emerald-500/20 text-emerald-200"
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "rounded-xl p-2 shrink-0 border",
                      ts500Check.status === "violated"
                        ? "bg-red-500/10 border-red-500/20 text-red-400"
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    )}
                  >
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider leading-none">
                      {ts500Check.status === "violated"
                        ? "TS 500 Md. 7.4.1 Net Aralık İhlali"
                        : "TS 500 Net Aralık Kriteri Sağlandı"}
                    </h3>
                    <p className="text-xs leading-5 text-slate-400">
                      {ts500Check.status === "violated" ? (
                        <>
                          Birinci sıradaki donatılar arasındaki net mesafe (
                          <strong className="text-red-400 font-mono">{ts500Check.netSpacingMm.toFixed(1)} mm</strong>
                          ), minimum limit sınırının (
                          <strong className="text-amber-400 font-mono">{ts500Check.minSpacingMm.toFixed(1)} mm</strong>
                          ) altındadır! Bu durum agrega kilitlenmesine ve boşluklu beton (bal peteği) oluşmasına yol açar.
                        </>
                      ) : (
                        <>
                          Yerleştirilen donatıların net aralığı (
                          <strong className="text-emerald-400 font-mono">{ts500Check.netSpacingMm.toFixed(1)} mm</strong>
                          ), TS 500 alt limiti olan (
                          <strong className="text-amber-400 font-mono">{ts500Check.minSpacingMm.toFixed(1)} mm</strong>
                          ) değerinin üzerindedir. Taze beton dökümü için güvenlidir.
                        </>
                      )}
                    </p>
                    {ts500Check.status === "violated" && (
                      <div className="border-t border-red-500/10 pt-3 mt-2 space-y-1.5 text-xs text-slate-300">
                        <span className="font-bold text-red-300 block">Yapısal Çözüm Önerileri:</span>
                        <ul className="list-disc pl-4 space-y-1 text-slate-400">
                          <li>Çubuk çapını büyüterek adet sayısını azaltın (Örn: 5Ø14 yerine 4Ø16).</li>
                          <li>İkinci yatay donatı sırasına geçerek tek sıradaki yoğunluğu düşürün.</li>
                          <li>Kiriş kesit genişliğini (b) artırın.</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sağ Kolon: Canlı Sonuç Raporu & CAD Kroki (Sticky) */}
          <div className="lg:sticky lg:top-6 space-y-6">
            <section className="home-glass-panel overflow-hidden rounded-[28px] border border-slate-200 dark:border-white/5 bg-slate-900/40 shadow-2xl">
              {/* Canlı Sonuç Header */}
              <div className="bg-slate-50 dark:bg-black/40 border-b border-slate-200 dark:border-white/5 p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">CANLI ANALİZ</p>
                  <h2 className="mt-1 text-xl font-black text-white">Toplam Donatı Alanı</h2>
                </div>
                <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-500 border border-amber-500/20">
                  <Sigma className="h-5 w-5" />
                </div>
              </div>

              {/* Canlı Sonuç Gövdesi */}
              <div className="p-6 space-y-5">
                {result ? (
                  <>
                    <div className="space-y-1 border-b border-white/5 pb-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Teorik Enkesit Alanı (As)</span>
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-5xl font-black text-white tracking-tight tabular-nums">
                          {formatNumber(result.totalArea)}
                        </span>
                        <span className="text-base font-bold text-slate-400">mm²</span>
                        <span className="text-sm font-bold text-amber-400 bg-amber-500/5 px-2 py-0.5 border border-amber-500/10 rounded ml-2">
                          {formatNumber(result.totalArea / 100)} cm²
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-slate-400 bg-white/5 p-2.5 rounded mt-3 leading-relaxed">
                        {result.formula}
                      </p>
                    </div>

                    {/* Donatı Düzeni Krokisi - CAD Blueprint */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">YERLEŞİM KROKİSİ</span>
                      <RebarSectionSketch
                        diameterMm={diameter}
                        quantity={result.quantity}
                        widthCm={widthCm}
                        coverMm={coverMm}
                        stirrupDiameterMm={stirrupDiameterMm}
                      />
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/5 p-8 text-center text-slate-400">
                    <p className="text-base font-bold">Hesap bekleniyor</p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Sonuç ve kroki analizi için adet alanına geçerli bir sayı girin.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

        </div>

        {/* 2. Bölüm: Eşdeğerlik Analizi & Pratik Standart Kılavuzları */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
          
          {/* Eşdeğer Donatı Tablosu */}
          <section className="home-glass-panel rounded-[28px] border border-slate-200 dark:border-white/5 bg-slate-900/40 p-6">
            <div className="mb-5 flex items-start justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">ALTERNATİFLER</p>
                <h2 className="mt-1 text-2xl font-black text-white font-sans">Eşdeğer Donatı Analiz Tablosu</h2>
              </div>
              <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-500 border border-amber-500/20">
                <EqualApproximately className="h-5 w-5" />
              </div>
            </div>

            {result ? (
              <div className="overflow-x-auto rounded-xl border border-white/5 bg-slate-950/40">
                <Table>
                  <TableHeader className="bg-slate-950">
                    <TableRow className="border-b border-white/5 hover:bg-transparent">
                      <TableHead className="text-slate-300 font-bold">Donatı Çapı</TableHead>
                      <TableHead className="text-slate-300 font-bold">Tek Çubuk</TableHead>
                      <TableHead className="text-slate-300 font-bold">Gerekli Adet</TableHead>
                      <TableHead className="text-slate-300 font-bold">Sağlanan Alan</TableHead>
                      <TableHead className="text-right text-slate-300 font-bold">Alan Fazlalığı</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equivalentRows.map((row) => {
                      const isActive = row.diameter === diameter;

                      return (
                        <TableRow
                          key={row.diameter}
                          className={cn(
                            "border-b border-white/5 transition-colors",
                            isActive
                              ? "bg-amber-500/10 hover:bg-amber-500/15"
                              : "hover:bg-white/5"
                          )}
                        >
                          <TableCell className="font-black text-white">
                            <div className="flex items-center gap-2">
                              <span>Ø{row.diameter}</span>
                              {isActive ? (
                                <Badge className="rounded-full bg-amber-500 hover:bg-amber-600 px-2 py-0.5 text-[9px] font-black text-slate-950">
                                  SEÇİLİ
                                </Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono tabular-nums text-slate-400">{formatNumber(row.barArea)} mm²</TableCell>
                          <TableCell className="font-mono font-bold text-white tabular-nums">{row.quantity} adet</TableCell>
                          <TableCell className="font-mono font-bold text-amber-400 tabular-nums">{formatNumber(row.providedArea)} mm²</TableCell>
                          <TableCell className="text-right font-mono font-semibold text-emerald-400 tabular-nums">
                            +{formatNumber(row.surplusArea)} mm²
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/5 p-6 text-sm text-slate-500">
                Lütfen alternatif donatı tablosunun listelenmesi için adet alanına geçerli bir sayı girin.
              </div>
            )}
          </section>

          {/* TS 500 ve EC2 Pratik Standart Kılavuzları */}
          <section className="home-glass-panel rounded-[28px] border border-slate-200 dark:border-white/5 bg-slate-900/40 p-6 space-y-6">
            <div className="mb-4 flex items-start justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">REFERANSLAR</p>
                <h2 className="mt-1 text-2xl font-black text-white">Yönetmelik Detay Notları</h2>
              </div>
              <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-500 border border-amber-500/20">
                <BadgeCheck className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
                <p className="text-xs font-black uppercase tracking-wider text-amber-400">TS 500 Madde 7.4.1 (Aralık Sınırı)</p>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Boyuna donatılar arasındaki net yatay mesafe, donatı anma çapının 1.5 katından ve 25 mm&apos;den az olamaz. Bu kural betonun yerleşim güvenliğini sağlar.
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
                <p className="text-xs font-black uppercase tracking-wider text-amber-400">TS 500 Denklem 7.1 (Çelik Alanı)</p>
                <p className="mt-2 text-xs leading-5 text-slate-400 font-mono">
                  As = n x (π x Ø² / 4)
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Toplam donatı alanı, tek bir çubuğun geometrik dairesel alanının yerleştirilen toplam adetle çarpımı ile bulunur.
                </p>
              </div>

              <div className="rounded-2xl bg-amber-500/5 p-4 border border-amber-500/10">
                <p className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  Pratik Şantiye Yorumu
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Eşdeğer tablomuz hedef alanın gerisinde kalmamak için gereken adet sayılarını otomatik olarak yukarı yuvarlar. Tasarım esnasında eleman detaylandırmasına ve pas payı toleranslarına kesinlikle dikkat edilmelidir.
                </p>
              </div>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
