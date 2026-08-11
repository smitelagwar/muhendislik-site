"use client";

import { useEffect, useMemo, useState } from "react";
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
  if (!quantity) return null;
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
    return { diameter, barArea, quantity, providedArea, surplusArea: providedArea - totalArea };
  });
}

export function RebarCalculator() {
  const [diameter, setDiameter] = useState<Diameter>(14);
  const [quantity, setQuantity] = useState("5");

  // Gelişmiş Yerleşim Parametreleri
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [widthCm, setWidthCm] = useState<number | "">(30);
  const [coverMm, setCoverMm] = useState<number | "">(30);
  const [stirrupDiameterMm, setStirrupDiameterMm] = useState<number | "">(8);

  // Navbar yüksekliğini dinamik ölçerek dashboard'a doğru yükseklik ver
  const [navbarH, setNavbarH] = useState(91);

  useEffect(() => {
    const navbar = document.querySelector("header[data-scrolled]") as HTMLElement | null;
    if (navbar) setNavbarH(navbar.getBoundingClientRect().height);
  }, []);

  // Sayfa scroll'unu kilitle — dashboard tam ekran çalışır
  useEffect(() => {
    const prev = document.body.style.overflowY;
    document.body.style.overflowY = "hidden";
    return () => { document.body.style.overflowY = prev; };
  }, []);

  const activeWidthCm = widthCm === "" ? 30 : widthCm;
  const activeCoverMm = coverMm === "" ? 30 : coverMm;
  const activeStirrupDiameterMm = stirrupDiameterMm === "" ? 8 : stirrupDiameterMm;

  const result = useMemo(() => buildResult(diameter, quantity), [diameter, quantity]);
  const equivalentRows = useMemo(() => (result ? buildEquivalentRows(result.totalArea) : []), [result]);

  const handleIncrement = () => {
    const q = parsePositiveNumber(quantity) ?? 0;
    setQuantity(String(q + 1));
  };

  const handleDecrement = () => {
    const q = parsePositiveNumber(quantity) ?? 0;
    if (q > 1) setQuantity(String(q - 1));
  };

  // TS 500 Net Spacing Checker
  const ts500Check = useMemo(() => {
    if (!result) return null;
    const { firstRow } = getRowLayout(result.quantity);
    if (firstRow < 2) return null;
    const b = activeWidthCm * 10;
    const cover = activeCoverMm;
    const ds = activeStirrupDiameterMm;
    const d = diameter;
    const netSpacingMm = (b - 2 * cover - 2 * ds - firstRow * d) / (firstRow - 1);
    const minSpacingMm = Math.max(25, 1.5 * d);
    const isViolated = netSpacingMm < minSpacingMm;
    return { status: isViolated ? "violated" : "ok", netSpacingMm, minSpacingMm, firstRow };
  }, [result, activeWidthCm, activeCoverMm, activeStirrupDiameterMm, diameter]);

  return (
    /* Tam ekran sarmalayıcı — navbar hariç geri kalan yüksekliği doldurur */
    <div className="tool-page-shell flex flex-col text-slate-800 dark:text-slate-100" style={{ height: `calc(100dvh - ${navbarH}px)` }}>

      {/* ─── KOMPAKt ÜST ŞERIT ─── */}
      <div className="shrink-0 border-b border-slate-200 dark:border-white/5 bg-white/70 dark:bg-slate-950/60 backdrop-blur-md px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <PageContextNavigation
            showBreadcrumbs={false}
            backLinkClassName="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-400 transition-colors"
          />
          <div className="flex items-center gap-3 min-w-0">
            <Badge className="shrink-0 rounded-full bg-amber-500/10 px-3 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400 border border-amber-500/20">
              TS 500
            </Badge>
            <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white truncate">
              Donatı Alanı &amp; Eşdeğerlik Workbench
            </h1>
            <span className="hidden xl:block text-xs text-slate-400 dark:text-slate-500 truncate">
              Çap ve adedi değiştirin — CAD kroki ve eşdeğer tablo anında güncellenir
            </span>
          </div>
        </div>
      </div>

      {/* ─── 3-PANEL ANA DASHBOARD ─── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[360px_1fr_380px] xl:grid-cols-[380px_1fr_400px] 2xl:grid-cols-[400px_1fr_420px] divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-white/5 overflow-hidden">

        {/* ══ SOL PANEL: GİRDİLER ══ */}
        <div className="overflow-y-auto p-4 xl:p-5 space-y-4 bg-white/40 dark:bg-slate-950/20">

          {/* Panel başlığı */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Girdi Paneli</p>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Kesit Parametreleri</h2>
            </div>
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:text-amber-500 border border-amber-500/20">
              <Calculator className="h-4 w-4" />
            </div>
          </div>

          {/* Donatı Çapı */}
          <div className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-gradient-to-br from-slate-50 to-white/40 dark:from-slate-950/40 dark:to-slate-900/10 p-4 shadow-sm hover:shadow transition-all duration-300 hover:border-slate-300 dark:hover:border-white/10">
            <label className="mb-2.5 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              <CircleGauge className="h-3.5 w-3.5 text-amber-500" />
              Donatı Çapı (Ø)
            </label>
            <Select value={String(diameter)} onValueChange={(v) => setDiameter(Number(v) as Diameter)}>
              <SelectTrigger className="h-11 w-full rounded-xl font-bold border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200">
                <SelectValue placeholder="Çap seçin" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-white/10 shadow-xl rounded-xl">
                {DIAMETERS.map((item) => (
                  <SelectItem key={item} value={String(item)}>
                    Ø{item} mm (As1 = {formatNumber(calculateBarArea(item))} mm²)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-2.5 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Tek çubuk alanı (As₁):</span>
              <span className="font-mono font-black text-amber-600 dark:text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                {formatNumber(calculateBarArea(diameter))} mm²
              </span>
            </p>
          </div>

          {/* Donatı Adedi */}
          <div className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-gradient-to-br from-slate-50 to-white/40 dark:from-slate-950/40 dark:to-slate-900/10 p-4 shadow-sm hover:shadow transition-all duration-300 hover:border-slate-300 dark:hover:border-white/10">
            <label className="mb-2.5 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              <Layers3 className="h-3.5 w-3.5 text-amber-500" />
              Donatı Adedi (n)
            </label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleDecrement}
                className="h-11 w-11 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 hover:border-amber-500/40 dark:hover:border-amber-500/40 hover:text-amber-600 dark:hover:text-amber-400 text-slate-800 dark:text-slate-100 active:scale-95 transition-all duration-200 shadow-sm"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Örn. 5"
                className="h-11 flex-1 rounded-xl text-center text-base font-black bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-900 dark:text-slate-100 font-mono transition-all duration-200 shadow-inner"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleIncrement}
                className="h-11 w-11 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 hover:border-amber-500/40 dark:hover:border-amber-500/40 hover:text-amber-600 dark:hover:text-amber-400 text-slate-800 dark:text-slate-100 active:scale-95 transition-all duration-200 shadow-sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
              Kroki ve eşdeğer donatı alanı canlı güncellenir.
            </p>
          </div>

          {/* Gelişmiş Parametreler Akordiyonu */}
          <div className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-gradient-to-br from-slate-50 to-white/40 dark:from-slate-950/40 dark:to-slate-900/10 p-4 shadow-sm hover:shadow transition-all duration-300 hover:border-slate-300 dark:hover:border-white/10">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex w-full items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300"
            >
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-amber-500" />
                <span>Gelişmiş Kesit (TS 500)</span>
              </div>
              {showAdvanced ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
            </button>
            {showAdvanced && (
              <div className="mt-3 grid gap-3 grid-cols-3 border-t border-slate-200/50 dark:border-white/5 pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">b (cm)</label>
                  <Input
                    type="number" min="10" max="200" value={widthCm}
                    onChange={(e) => setWidthCm(e.target.value === "" ? "" : Math.max(1, Number(e.target.value)))}
                    className="h-9 rounded-lg text-xs font-mono font-bold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">c (mm)</label>
                  <Input
                    type="number" min="0" max="100" value={coverMm}
                    onChange={(e) => setCoverMm(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
                    className="h-9 rounded-lg text-xs font-mono font-bold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Øe (mm)</label>
                  <Input
                    type="number" min="4" max="20" value={stirrupDiameterMm}
                    onChange={(e) => setStirrupDiameterMm(e.target.value === "" ? "" : Math.max(1, Number(e.target.value)))}
                    className="h-9 rounded-lg text-xs font-mono font-bold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
              </div>
            )}
          </div>

          {/* TS 500 Aralık Uyarısı / Görsel Range Progress Bar */}
          {ts500Check && (() => {
            const isViolated = ts500Check.status === "violated";
            const maxVal = Math.max(ts500Check.netSpacingMm * 1.25, ts500Check.minSpacingMm * 1.6, 50);
            const limitPercent = (ts500Check.minSpacingMm / maxVal) * 100;
            const currentPercent = Math.min(100, Math.max(0, (ts500Check.netSpacingMm / maxVal) * 100));

            return (
              <div
                className={cn(
                  "rounded-2xl p-4 border transition-all duration-300 shadow-sm",
                  isViolated
                    ? "bg-red-500/5 border-red-200/60 dark:border-red-500/20 text-red-950 dark:text-red-200"
                    : "bg-emerald-500/5 border-emerald-200/60 dark:border-emerald-500/20 text-emerald-950 dark:text-emerald-200"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "rounded-lg p-1.5 shrink-0 border",
                    isViolated
                      ? "bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400"
                      : "bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  )}>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-black uppercase tracking-wider leading-none">
                        {isViolated ? "TS 500 Net Aralık İhlali" : "TS 500 Aralık Kriteri ✓"}
                      </h3>
                      <span className={cn(
                        "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border text-[8px] tracking-wide",
                        isViolated
                          ? "bg-red-500/20 border-red-500/20 text-red-700 dark:text-red-400"
                          : "bg-emerald-500/20 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                      )}>
                        {isViolated ? "Uyumsuz" : "Uyumlu"}
                      </span>
                    </div>

                    {/* Görsel Limit Progress Bar */}
                    <div className="relative pt-1">
                      <div className="relative h-2.5 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden shadow-inner">
                        {/* Safe / Violated Color Bar */}
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            isViolated
                              ? "bg-gradient-to-r from-red-500 to-rose-600 shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                              : "bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                          )}
                          style={{ width: `${currentPercent}%` }}
                        />
                        {/* Limit line marker in the track */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-slate-600 dark:bg-white/60 z-10"
                          style={{ left: `${limitPercent}%` }}
                        />
                      </div>
                      
                      <div className="mt-2 flex items-center justify-between text-[9px] font-mono text-slate-500 dark:text-slate-400">
                        <span className={cn("font-bold", isViolated ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")}>
                          Mevcut (s) = {ts500Check.netSpacingMm.toFixed(1)} mm
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 font-bold">
                          Min. Limit = {ts500Check.minSpacingMm.toFixed(1)} mm
                        </span>
                      </div>
                    </div>

                    {isViolated && (
                      <div className="mt-1 border-t border-red-500/10 pt-2 animate-in fade-in duration-200">
                        <p className="text-[9px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 mb-1">Düzeltmek İçin Öneriler:</p>
                        <ul className="list-disc pl-3.5 space-y-0.5 text-[9px] leading-3.5 text-slate-600 dark:text-slate-400">
                          <li>Çubuk sayısını azaltın ve daha büyük çaplı donatı seçin.</li>
                          <li>İkinci donatı sırasına geçiş yapın (çift sıra yerleşim).</li>
                          <li>Kiriş enkesit genişliğini (b) artırın.</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Formül özeti */}
          {result && (
            <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-white/40 dark:from-slate-950/40 dark:to-slate-900/10 border border-slate-200/60 dark:border-white/5 p-3 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Hesap Formülü (TS 500 Md. 7.1)</p>
              <p className="text-[10px] font-mono text-slate-600 dark:text-slate-400 leading-5">{result.formula}</p>
            </div>
          )}
        </div>

        {/* ══ ORTA PANEL: CAD WORKBENCH ══ */}
        <div className="overflow-y-auto flex flex-col bg-slate-950/5 dark:bg-slate-950/40">
          {/* Workbench başlık */}
          <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-white/5 bg-white/60 dark:bg-black/30">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Canlı Analiz Workbench</p>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">CAD Yerleşim Önizlemesi</h2>
            </div>
            <div className="flex items-center gap-3">
              {result && (
                <div className="text-right">
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Toplam As</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                      {formatNumber(result.totalArea)}
                    </span>
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">mm²</span>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/15">
                      {formatNumber(result.totalArea / 100)} cm²
                    </span>
                  </div>
                </div>
              )}
              <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:text-amber-500 border border-amber-500/20">
                <Sigma className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* CAD Viewport Status Bar / Toolbar */}
          <div className="shrink-0 flex items-center justify-between px-5 py-2 border-b border-slate-200 dark:border-white/5 bg-slate-100/50 dark:bg-black/20 text-[10px] font-mono text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ÖLÇEK: 1/10
              </span>
              <span className="text-slate-300 dark:text-slate-800">|</span>
              <span className="hidden sm:inline">GRID: 24px</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-300/30 dark:border-white/5 text-[9px] uppercase tracking-wider text-slate-400">
                Live Drafting
              </span>
            </div>
          </div>

          {/* CAD SVG alanı — kalan yüksekliği doldurur — Izgara desenli arka plan */}
          <div
            className="flex-1 flex items-center justify-center p-4 min-h-0 bg-slate-50 dark:bg-[#070a10] text-slate-200 dark:text-zinc-800/60"
            style={{
              backgroundImage: "radial-gradient(circle, currentColor 1.2px, transparent 1.2px)",
              backgroundSize: "24px 24px"
            }}
          >
            {result ? (
              <div className="w-full h-full flex flex-col">
                <RebarSectionSketch
                  diameterMm={diameter}
                  quantity={result.quantity}
                  widthCm={activeWidthCm}
                  coverMm={activeCoverMm}
                  stirrupDiameterMm={activeStirrupDiameterMm}
                  className="w-full h-full"
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/10 p-12 text-center bg-white/40 dark:bg-slate-900/10">
                <p className="text-base font-bold text-slate-500">Hesap bekleniyor</p>
                <p className="mt-2 text-xs text-slate-400">Adet alanına geçerli bir sayı girin.</p>
              </div>
            )}
          </div>
        </div>

        {/* ══ SAĞ PANEL: EŞDEĞER TABLO + REFERANSLAR ══ */}
        <div className="overflow-y-auto flex flex-col bg-white/40 dark:bg-slate-950/20">

          {/* Eşdeğer Tablo Başlığı */}
          <div className="shrink-0 flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-white/5 bg-white/60 dark:bg-black/20">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Alternatifler</p>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Eşdeğer Donatı Tablosu</h2>
            </div>
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:text-amber-500 border border-amber-500/20">
              <EqualApproximately className="h-4 w-4" />
            </div>
          </div>

          {/* Tablo */}
          <div className="flex-1 overflow-y-auto">
            {result ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-white/5 shadow-sm">
                    <TableRow className="border-b border-slate-200 dark:border-white/5 hover:bg-transparent">
                      <TableHead className="text-[10px] text-slate-700 dark:text-slate-300 font-black py-2.5">Çap</TableHead>
                      <TableHead className="text-[10px] text-slate-700 dark:text-slate-300 font-black py-2.5">Tek As₁</TableHead>
                      <TableHead className="text-[10px] text-slate-700 dark:text-slate-300 font-black py-2.5">Adet</TableHead>
                      <TableHead className="text-[10px] text-slate-700 dark:text-slate-300 font-black py-2.5">Toplam</TableHead>
                      <TableHead className="text-right text-[10px] text-slate-700 dark:text-slate-300 font-black py-2.5">Fazlalık (Fark)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equivalentRows.map((row) => {
                      const isActive = row.diameter === diameter;
                      const surplusPercent = result.totalArea > 0 ? (row.surplusArea / result.totalArea) * 100 : 0;
                      return (
                        <TableRow
                          key={row.diameter}
                          className={cn(
                            "border-b border-slate-100 dark:border-white/5 transition-colors cursor-pointer group",
                            isActive
                              ? "bg-amber-500/8 dark:bg-amber-500/10 hover:bg-amber-500/12 dark:hover:bg-amber-500/15"
                              : "hover:bg-slate-50 dark:hover:bg-white/5"
                          )}
                          onClick={() => {
                            if (!isActive) {
                              setDiameter(row.diameter);
                              setQuantity(String(row.quantity));
                            }
                          }}
                        >
                          <TableCell className="py-2 font-black text-sm text-slate-900 dark:text-white">
                            <div className="flex items-center gap-1.5">
                              <span>Ø{row.diameter}</span>
                              {isActive ? (
                                <Badge className="rounded-full bg-amber-500 hover:bg-amber-600 px-1.5 py-0 text-[8px] font-black text-slate-950">
                                  ✓
                                </Badge>
                              ) : (
                                <span className="text-[8px] text-slate-400 dark:text-slate-600 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors font-bold uppercase">
                                  seç
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2 font-mono text-[10px] tabular-nums text-slate-500 dark:text-slate-400">
                            {formatNumber(row.barArea)}
                          </TableCell>
                          <TableCell className="py-2 font-mono font-bold text-sm text-slate-800 dark:text-white tabular-nums">
                            {row.quantity}
                          </TableCell>
                          <TableCell className="py-2 font-mono text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                            {formatNumber(row.providedArea)}
                          </TableCell>
                          <TableCell className="py-2 text-right tabular-nums">
                            <div className="flex flex-col items-end gap-1.5">
                              <span className={cn(
                                "font-mono text-[10px] font-bold leading-none",
                                surplusPercent <= 12
                                  ? "text-emerald-600 dark:text-emerald-450"
                                  : surplusPercent <= 25
                                    ? "text-amber-650 dark:text-amber-450"
                                    : "text-rose-600 dark:text-rose-450"
                              )}>
                                +{formatNumber(row.surplusArea)} mm²
                              </span>
                              {/* Visual Efficiency Bar */}
                              <div className="w-14 h-1 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-300",
                                    surplusPercent <= 12
                                      ? "bg-emerald-500"
                                      : surplusPercent <= 25
                                        ? "bg-amber-500"
                                        : "bg-rose-500"
                                  )}
                                  style={{ width: `${Math.min(100, Math.max(10, surplusPercent))}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-6 text-sm text-slate-400 text-center">
                Tablo için geçerli adet girin.
              </div>
            )}
          </div>

          {/* Referanslar — sağ panelin altı */}
          <div className="shrink-0 border-t border-slate-200 dark:border-white/5 p-4 space-y-2.5 bg-white/40 dark:bg-slate-950/20">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Yönetmelik Notları</p>
              <BadgeCheck className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-white/3 border border-slate-200 dark:border-white/5 p-3">
              <p className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">TS 500 Md. 7.4.1</p>
              <p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                Net yatay aralık ≥ max(25 mm, 1.5Ø). Aksi hâlde agrega kilitlenmesi oluşur.
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-white/3 border border-slate-200 dark:border-white/5 p-3">
              <p className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">TS 500 Denklem 7.1</p>
              <p className="mt-1 text-[10px] font-mono text-slate-500 dark:text-slate-400">As = n × (π × Ø² / 4)</p>
            </div>
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-3">
              <p className="text-[9px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1">
                <Info className="h-3 w-3 shrink-0" />
                Şantiye Notu
              </p>
              <p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                Tablo adet sayılarını yukarı yuvarlar. Detaylandırmada pas payı toleranslarına dikkat.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
