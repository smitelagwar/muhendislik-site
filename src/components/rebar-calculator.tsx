"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Info,
  Minus,
  Plus,
  RotateCcw,
  Scale,
  TableProperties,
} from "lucide-react";
import { PageContextNavigation } from "@/components/page-context-navigation";
import { RebarReferenceDialog } from "@/components/rebar-reference-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ToolScopeBadge,
  ToolSourceStamp,
  ToolLimitations,
  EngineeringDiagramFrame,
} from "@/components/engineering-primitives";
import {
  REBAR_DIAMETERS,
  buildEquivalentRebarRows,
  calculateBarArea,
  calculateLinearWeight,
  calculateRebarResult,
  formatAreaCm2,
  formatAreaMm2,
  formatDecimal,
  formatInteger,
  formatWeight,
  parseRebarQuantity,
  type EquivalentRebarRow,
  type RebarDiameter,
} from "@/lib/rebar-calculations";
import { cn } from "@/lib/utils";

const QUICK_INCREMENTS = [1, 2, 5, 10];
const COMMERCIAL_BAR_LENGTH_M = 12;

export function RebarCalculator() {
  const [diameter, setDiameter] = useState<RebarDiameter>(14);
  const [quantityInput, setQuantityInput] = useState("5");
  const [copied, setCopied] = useState(false);
  const [beamWidth, setBeamWidth] = useState(300); // mm

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState<"weights" | "areas">("weights");

  const quantityValidation = useMemo(() => parseRebarQuantity(quantityInput), [quantityInput]);

  const result = useMemo(
    () =>
      quantityValidation.quantity === null
        ? null
        : calculateRebarResult(diameter, quantityValidation.quantity),
    [diameter, quantityValidation.quantity],
  );

  // Yerleşebilirlik (Constructability) Ön Tahkiki
  const constructability = useMemo(() => {
    const qty = result?.quantity ?? 1;
    const cover = 30; // mm (net pas payı)
    const tieDia = 8; // mm (etriye çapı)
    const usableWidth = beamWidth - 2 * cover - 2 * tieDia;
    const minSpacing = Math.max(20, diameter); // TS 500 Madde 7.1

    if (qty <= 1) {
      const clearSpacing = usableWidth - diameter;
      return {
        fits: clearSpacing >= 0,
        clearSpacing: Math.max(0, clearSpacing),
        minSpacing,
        usableWidth,
        qty,
      };
    }

    const clearSpacing = (usableWidth - qty * diameter) / (qty - 1);
    return {
      fits: clearSpacing >= minSpacing,
      clearSpacing,
      minSpacing,
      usableWidth,
      qty,
    };
  }, [beamWidth, diameter, result?.quantity]);

  const equivalentRows = useMemo(
    () => (result ? buildEquivalentRebarRows(result.totalAreaMm2) : []),
    [result],
  );

  const singleBarArea = useMemo(() => calculateBarArea(diameter), [diameter]);
  const linearWeight = useMemo(() => calculateLinearWeight(diameter), [diameter]);
  const totalWeightPerMeter = useMemo(
    () => (result ? linearWeight * result.quantity : 0),
    [linearWeight, result],
  );
  const totalWeightPerBar12m = useMemo(
    () => (result ? linearWeight * result.quantity * COMMERCIAL_BAR_LENGTH_M : 0),
    [linearWeight, result],
  );

  function incrementQuantity(step = 1) {
    const current = quantityValidation.quantity ?? 0;
    if (current + step <= Number.MAX_SAFE_INTEGER) {
      setQuantityInput(String(current + step));
    }
  }

  function decrementQuantity(step = 1) {
    const current = quantityValidation.quantity ?? 1;
    if (current - step >= 1) {
      setQuantityInput(String(current - step));
    } else {
      setQuantityInput("1");
    }
  }

  function selectAlternative(row: EquivalentRebarRow) {
    setDiameter(row.diameter);
    setQuantityInput(String(row.quantity));
  }

  function openReferenceTable(tab: "weights" | "areas") {
    setDialogTab(tab);
    setDialogOpen(true);
  }

  async function handleCopyResult() {
    if (!result) return;
    const text = `${formatInteger(result.quantity)}Ø${diameter}: As = ${formatAreaCm2(result.totalAreaMm2)} cm² (${formatAreaMm2(result.totalAreaMm2)} mm²) | Metraj: ~${formatWeight(totalWeightPerMeter)} kg/m (~${formatWeight(totalWeightPerBar12m)} kg / 12m boy)`;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // clipboard fallback
    }
  }

  return (
    <main className="relative min-h-screen py-6 text-foreground sm:py-10 lg:py-12 pb-24 sm:pb-20 overflow-hidden">
      {/* Vortasky AI Cosmic Atmospheric Background Glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[550px] w-[950px] rounded-full bg-gradient-to-b from-purple-600/20 via-indigo-600/10 to-transparent blur-[120px] dark:from-purple-600/30 dark:via-indigo-500/18" />
        <div className="absolute top-[25%] right-[-10%] h-[420px] w-[520px] rounded-full bg-violet-600/12 blur-[140px] dark:bg-violet-600/20" />
        <div className="absolute top-[45%] left-[-10%] h-[420px] w-[520px] rounded-full bg-indigo-600/12 blur-[140px] dark:bg-indigo-600/20" />
        {/* Tech Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 dark:opacity-30" />
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        {/* Top Action Header / Breadcrumbs */}
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <PageContextNavigation
            showBreadcrumbs={false}
            backLinkClassName="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border/80 dark:border-white/15 bg-card/80 dark:bg-[#120f28]/90 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-200 backdrop-blur-xl transition-all hover:border-purple-500/50 hover:bg-card dark:hover:bg-[#1b173b] hover:text-foreground dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          />

          {/* Quick Pop-up Reference Table Buttons with Ambient Pulsing Glow */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => openReferenceTable("weights")}
              className="animate-glow-pulse relative inline-flex min-h-11 items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-purple-500/50 bg-[#120f28]/90 px-2.5 sm:px-4 text-[11px] sm:text-xs font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] backdrop-blur-xl transition-all hover:scale-[1.02] hover:border-purple-400 hover:bg-[#1c1740] active:scale-95"
            >
              <Scale className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-400 shrink-0" />
              <span className="truncate font-bold text-white">Birim Ağırlık Tablosu</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => openReferenceTable("areas")}
              className="animate-glow-pulse relative inline-flex min-h-11 items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-purple-500/50 bg-[#120f28]/90 px-2.5 sm:px-4 text-[11px] sm:text-xs font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] backdrop-blur-xl transition-all hover:scale-[1.02] hover:border-purple-400 hover:bg-[#1c1740] active:scale-95"
            >
              <TableProperties className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-400 shrink-0" />
              <span className="truncate font-bold text-white">Donatı Alan Tablosu</span>
            </Button>
          </div>
        </div>

        {/* Hero Header */}
        <header className="relative mb-8 sm:mb-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <ToolScopeBadge kind="preliminary" />
            <ToolSourceStamp sources={["TS 500", "TS 708"]} tier="B" />
          </div>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground dark:text-white sm:text-5xl lg:text-6xl">
            Donatı Alanı{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-400">
              Hesabı
            </span>
          </h1>
          <p className="mt-3.5 max-w-2xl text-sm leading-relaxed text-muted-foreground dark:text-zinc-300 sm:text-base font-normal">
            Donatı çapı ve adedine göre toplam kesit alanını (<strong className="font-bold text-foreground dark:text-white">As</strong>), metretül ağırlığını ve hedef alanı karşılayan eşdeğer donatı kombinasyonlarını yüksek hassasiyetle anlık olarak hesaplayın.
          </p>
        </header>

        {/* Main Grid: Parameters + HUD Result Terminal */}
        <div className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
          {/* Left Column: Interactive Parameters (7 Cols) */}
          <section
            aria-labelledby="input-section-title"
            className="relative flex flex-col justify-between rounded-[28px] border border-border/80 dark:border-purple-500/20 bg-card/90 dark:bg-[#0f0d22]/85 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)] lg:col-span-7"
          >
            <div className="space-y-6">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-border/70 dark:border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-bold text-xs shadow-[0_0_12px_rgba(139,92,246,0.5)]">
                    1
                  </div>
                  <h2 id="input-section-title" className="text-base font-bold tracking-tight text-foreground dark:text-white sm:text-lg">
                    Donatı Seçimi
                  </h2>
                </div>
                <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-300">
                  {formatInteger(result?.quantity ?? 1)}Ø{diameter}
                </span>
              </div>

              {/* 1. Tactical Diameter Segmented Dock */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="rebar-diameter-group" className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                    Donatı Çapı (Ø mm)
                  </label>
                  <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-300">
                    A₁ = {formatAreaCm2(singleBarArea)} cm²
                  </span>
                </div>

                {/* 7-Segment Unified Dock */}
                <div
                  id="rebar-diameter-group"
                  role="group"
                  aria-label="Donatı Çapı Seçenekleri"
                  className="grid grid-cols-7 gap-1.5 sm:gap-2"
                >
                  {REBAR_DIAMETERS.map((d) => {
                    const isSelected = diameter === d;
                    const barArea = calculateBarArea(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDiameter(d)}
                        aria-pressed={isSelected}
                        className={cn(
                          "group relative flex min-h-[56px] flex-col items-center justify-center rounded-xl sm:rounded-2xl border px-0.5 py-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 active:scale-95",
                          isSelected
                            ? "border-purple-400 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 text-white shadow-[0_0_25px_rgba(147,51,234,0.5)] font-black"
                            : "border-border/80 dark:border-white/10 bg-card/80 dark:bg-[#16132e]/90 text-foreground dark:text-zinc-100 hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-foreground dark:hover:text-white",
                        )}
                      >
                        <span className="font-mono text-xs sm:text-base font-black tracking-tight">
                          Ø{d}
                        </span>
                        <span
                          className={cn(
                            "font-mono text-[9px] sm:text-[10px] tracking-tight tabular-nums transition-colors mt-0.5",
                            isSelected
                              ? "text-purple-100 font-bold"
                              : "text-muted-foreground dark:text-zinc-400 group-hover:text-foreground dark:group-hover:text-white",
                          )}
                        >
                          {formatAreaCm2(barArea)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Single Bar Telemetry Strip */}
                <div
                  id="single-bar-area"
                  className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 px-4 py-3 text-xs text-foreground dark:text-zinc-200"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-purple-500" />
                    <span className="text-muted-foreground dark:text-zinc-400">Tek Çubuk:</span>
                    <strong className="font-mono font-bold text-foreground dark:text-white">{formatAreaCm2(singleBarArea)} cm²</strong>
                    <span className="font-mono text-[11px] text-muted-foreground dark:text-zinc-400">({formatAreaMm2(singleBarArea)} mm²)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground dark:text-zinc-400">Birim Ağırlık:</span>
                    <strong className="font-mono font-bold text-foreground dark:text-white">{formatWeight(linearWeight)} kg/m</strong>
                  </div>
                </div>
              </div>

              {/* 2. Integrated Quantity Stepper & Presets */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="rebar-quantity" className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                    Donatı Adedi (n)
                  </label>
                </div>

                {/* Main Stepper Box */}
                <div className="grid grid-cols-[54px_minmax(0,1fr)_54px] items-center gap-2 rounded-2xl border border-border/80 dark:border-white/15 bg-card/80 dark:bg-[#16132e]/90 p-2 shadow-inner">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => decrementQuantity(1)}
                    disabled={quantityValidation.quantity === 1}
                    className="h-12 w-12 rounded-xl bg-card dark:bg-[#1f1a3f] border border-border/60 dark:border-white/15 text-foreground dark:text-white hover:border-purple-500/50 hover:bg-purple-500/20 active:scale-90 disabled:opacity-30"
                    aria-label="Donatı adedini bir azalt"
                  >
                    <Minus className="h-5 w-5" aria-hidden="true" />
                  </Button>

                  <div className="flex flex-col items-center justify-center py-1">
                    <Input
                      id="rebar-quantity"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={quantityInput}
                      onChange={(event) => setQuantityInput(event.target.value)}
                      aria-invalid={Boolean(quantityValidation.error)}
                      aria-describedby="rebar-quantity-message"
                      className="border-0 bg-transparent text-center font-mono text-2xl sm:text-3xl font-black tracking-tight text-foreground dark:text-white shadow-none focus-visible:ring-0 focus-visible:outline-none tabular-nums h-auto py-0"
                    />
                    <span className="text-[10px] font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-widest mt-0.5">
                      Adet Çubuk
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => incrementQuantity(1)}
                    className="h-12 w-12 rounded-xl bg-card dark:bg-[#1f1a3f] border border-border/60 dark:border-white/15 text-foreground dark:text-white hover:border-purple-500/50 hover:bg-purple-500/20 active:scale-90"
                    aria-label="Donatı adedini bir artır"
                  >
                    <Plus className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </div>

                {/* Quick Add Presets Bar in 5 Equal Columns */}
                <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                  {QUICK_INCREMENTS.map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => incrementQuantity(step)}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border/80 dark:border-white/15 bg-card/80 dark:bg-[#16132e]/80 font-mono text-xs font-bold text-foreground dark:text-zinc-100 transition-all hover:border-purple-500/60 hover:bg-purple-500/20 hover:text-foreground dark:hover:text-white active:scale-95"
                    >
                      +{step}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setQuantityInput("1")}
                    className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-border/60 dark:border-white/15 bg-card/60 dark:bg-[#16132e]/60 text-xs font-bold text-muted-foreground dark:text-zinc-400 transition-all hover:border-border dark:hover:border-white/30 hover:bg-muted dark:hover:bg-[#1f1a3f] hover:text-foreground dark:hover:text-white active:scale-95"
                    title="Adedi 1 olarak sıfırla"
                  >
                    <RotateCcw className="h-3 w-3" />
                    1
                  </button>
                </div>

                {/* Error Message if invalid */}
                {quantityValidation.error && (
                  <p
                    id="rebar-quantity-message"
                    role="alert"
                    className="min-h-5 text-xs font-medium text-red-500 dark:text-red-400"
                  >
                    {quantityValidation.error}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Right Column: HUD Engineering Result Terminal (5 Cols) */}
          <section
            aria-labelledby="result-section-title"
            className="relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-purple-500/30 dark:border-purple-500/40 bg-gradient-to-b from-[#181338] via-[#120e2c] to-[#0a0818] p-6 sm:p-8 text-white shadow-[0_25px_70px_rgba(139,92,246,0.25)] backdrop-blur-2xl lg:col-span-5"
            aria-live="polite"
            data-testid="rebar-result"
          >
            {/* Ambient Lighting FX */}
            <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-purple-500/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />

            <div className="relative z-10 space-y-5">
              {/* Header Status Bar */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-purple-400 animate-ping" />
                  <h2 id="result-section-title" className="text-xs font-bold tracking-[0.18em] text-purple-200 uppercase">
                    Toplam Donatı Alanı
                  </h2>
                </div>
                {result && (
                  <span className="rounded-xl border border-purple-400/40 bg-purple-500/20 px-3 py-1 font-mono text-xs font-black tracking-wide text-purple-200 shadow-sm">
                    {formatInteger(result.quantity)}Ø{diameter}
                  </span>
                )}
              </div>

              {/* Main Metric Hero Display */}
              {result ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/15 bg-white/[0.05] p-5 backdrop-blur-md shadow-inner">
                    <span className="text-xs font-bold tracking-wider text-purple-300/90 uppercase">
                      Sağlanan Donatı Alanı (As)
                    </span>
                    <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-mono text-5xl font-black tracking-tight text-white drop-shadow-[0_0_25px_rgba(192,132,252,0.45)] tabular-nums sm:text-6xl">
                        {formatAreaCm2(result.totalAreaMm2)}
                      </span>
                      <span className="text-2xl font-bold text-purple-300">cm²</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5 font-mono text-sm text-zinc-300">
                      <span>Milimetrekare Cinsinden:</span>
                      <span className="font-bold text-white tabular-nums">{formatAreaMm2(result.totalAreaMm2)} mm²</span>
                    </div>
                  </div>

                  {/* 2-Point Telemetry Strip */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-sm">
                      <span className="text-[11px] font-medium text-zinc-400">Metretül Ağırlığı:</span>
                      <p className="mt-1 font-mono text-sm font-bold text-white tabular-nums">
                        ~{formatWeight(totalWeightPerMeter)} kg/m
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-sm">
                      <span className="text-[11px] font-medium text-zinc-400">12m Standart Boy:</span>
                      <p className="mt-1 font-mono text-sm font-bold text-purple-200 tabular-nums">
                        ~{formatWeight(totalWeightPerBar12m)} kg
                      </p>
                    </div>
                  </div>

                  {/* Copy Action Button */}
                  <Button
                    type="button"
                    onClick={handleCopyResult}
                    className="min-h-12 w-full rounded-2xl border border-purple-400/40 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500 text-sm font-bold text-white shadow-[0_0_25px_rgba(139,92,246,0.4)] backdrop-blur-sm transition-all hover:scale-[1.01] active:scale-98"
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4 text-emerald-300" />
                        Hesap Özeti Kopyalandı! ({formatInteger(result.quantity)}Ø{diameter})
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4 text-purple-200" />
                        Hesap Özetini Kopyala
                      </>
                    )}
                  </Button>

                  {/* Yerleşebilirlik & Kesit Şeması (Constructability) */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                        Kiriş Kesiti & Yerleşebilirlik (Ön Tahkik)
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-mono">
                        {[250, 300, 350].map((w) => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => setBeamWidth(w)}
                            className={cn(
                              "inline-flex min-h-[44px] min-w-[48px] items-center justify-center rounded-xl border px-3 py-2 text-xs font-bold transition-all",
                              beamWidth === w
                                ? "border-purple-400 bg-purple-500/30 text-white font-black shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                                : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                            )}
                          >
                            b={w}
                          </button>
                        ))}
                      </div>
                    </div>

                    <EngineeringDiagramFrame
                      title={`Kiriş Kesiti (b = ${beamWidth} mm, c = 30 mm, etriye = Ø8)`}
                      subtitle={`${constructability.qty} adet Ø${diameter} alt sıra yerleşimi`}
                      accessibleFallbackText={`Kiriş genişliği ${beamWidth} mm. Net aralık ${constructability.clearSpacing.toFixed(1)} mm, gerekli minimum aralık ${constructability.minSpacing} mm.`}
                    >
                      <svg viewBox="0 0 320 130" className="w-full max-w-[320px] h-auto select-none">
                        {/* Kiriş Dış Hatları */}
                        <rect x="20" y="10" width="280" height="110" rx="6" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2" />
                        {/* Etriye */}
                        <rect x="36" y="22" width="248" height="86" rx="4" fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="4 2" />
                        {/* Pas Payı Ölçüsü */}
                        <text x="26" y="122" fill="#94a3b8" fontSize="8" fontFamily="monospace">c=30mm</text>
                        {/* Donatılar (Alt Sıra) */}
                        {Array.from({ length: Math.min(constructability.qty, 12) }).map((_, i) => {
                          const barCount = Math.min(constructability.qty, 12);
                          const usablePx = 224; // 248 - 24
                          const startX = 48;
                          const cx = barCount === 1 ? 160 : startX + (usablePx / (barCount - 1)) * i;
                          const cy = 92;
                          const r = Math.max(3.5, Math.min(7, diameter / 3));
                          return (
                            <g key={i}>
                              <circle cx={cx} cy={cy} r={r} fill="#ec4899" stroke="#fff" strokeWidth="1.2" />
                              <circle cx={cx} cy={cy} r={r * 0.4} fill="#fff" />
                            </g>
                          );
                        })}
                        {/* Kiriş Genişlik Ölçü Çizgisi */}
                        <line x1="20" y1="126" x2="300" y2="126" stroke="#94a3b8" strokeWidth="1" />
                        <text x="160" y="126" fill="#c084fc" fontSize="9" fontWeight="bold" textAnchor="middle" dy="-2">
                          b = {beamWidth} mm
                        </text>
                      </svg>
                    </EngineeringDiagramFrame>

                    {/* Yerleşebilirlik Durum Bildirimi */}
                    <div
                      className={cn(
                        "rounded-xl border p-3 text-xs leading-relaxed transition-all",
                        constructability.fits
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                      )}
                    >
                      <div className="flex items-center justify-between font-bold mb-1">
                        <span>{constructability.fits ? "✓ Tek Sırada Yerleşebilir" : "⚠ Sıkışık Donatı / Çift Sıra Gerekebilir"}</span>
                        <span className="font-mono text-[11px]">
                          s_net = {constructability.clearSpacing.toFixed(1)} mm
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-300 font-normal">
                        TS 500 Madde 7.1 uyarınca minimum net aralık s_min = max(20 mm, Ø{diameter}) = {constructability.minSpacing} mm olmalıdır.
                        {!constructability.fits && " Mevcut aralık yetersizdir; betonun agrega geçişi için çift sıra yerleşim veya daha kalın çap ile adet azaltımı değerlendirilmelidir."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-white/20 bg-white/5">
                  <p className="text-base font-bold text-white">Geçerli Değer Bekleniyor</p>
                  <p className="mt-2 max-w-xs text-xs leading-relaxed text-zinc-300">
                    Sonuç ve eşdeğer alternatifleri görüntülemek için lütfen geçerli bir donatı adedi girin.
                  </p>
                </div>
              )}
            </div>

            {/* Formula Accordion */}
            {result && (
              <details
                className="group relative z-10 mt-5 border-t border-white/10 pt-3"
                data-testid="rebar-formula-details"
              >
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-xl px-2 text-xs font-bold text-zinc-300 transition-colors hover:text-purple-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-purple-400" />
                    Formül ve Matematiksel Adımlar
                  </span>
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="mt-2.5 space-y-2 rounded-2xl border border-white/10 bg-black/60 p-4 font-mono text-xs leading-relaxed text-zinc-200">
                  <div className="text-zinc-400">
                    A₁ = π × Ø² / 4 = π × {diameter}² / 4 = <span className="text-white font-bold">{formatAreaMm2(result.barAreaMm2)} mm²</span>
                  </div>
                  <div>
                    As = n × A₁ = {formatInteger(result.quantity)} × {formatAreaMm2(result.barAreaMm2)} ={" "}
                    <span className="font-bold text-purple-300">{formatAreaMm2(result.totalAreaMm2)} mm²</span>
                  </div>
                  <div className="border-t border-white/10 pt-1 text-[11px] text-zinc-400">
                    As (cm²) = As (mm²) / 100 = <strong className="text-purple-300">{formatAreaCm2(result.totalAreaMm2)} cm²</strong>
                  </div>
                </div>
              </details>
            )}
          </section>
        </div>

        {/* Equivalent Rebar Options Section */}
        <section
          aria-labelledby="equivalents-title"
          className="relative mt-6 rounded-[28px] border border-border/80 dark:border-purple-500/20 bg-card/90 dark:bg-[#0f0d22]/85 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 dark:border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-bold text-xs shadow-[0_0_12px_rgba(139,92,246,0.5)]">
                  2
                </div>
                <h2 id="equivalents-title" className="text-lg font-bold tracking-tight text-foreground dark:text-white sm:text-xl">
                  Eşdeğer Donatı Alternatifleri
                </h2>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground dark:text-zinc-300 sm:text-sm">
                Hedef donatı alanını (<strong className="font-mono text-foreground dark:text-white">{result ? `${formatAreaCm2(result.totalAreaMm2)} cm²` : "-"}</strong>) eksiksiz sağlayan en yakın standart donatı çap kombinasyonları.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-xl border-border/80 dark:border-white/15 bg-card/60 dark:bg-[#16132e]/80 px-3 py-1 font-mono text-xs text-foreground dark:text-zinc-200">
                {equivalentRows.length} Çap Karşılaştırması
              </Badge>
            </div>
          </div>

          {result ? (
            <>
              {/* Mobile Interactive Cards (md:hidden) */}
              <div className="mt-5 space-y-3 md:hidden" data-testid="mobile-equivalent-list">
                {equivalentRows.map((row) => {
                  const isActive = row.diameter === diameter && row.quantity === result.quantity;
                  const rowLinearWeight = calculateLinearWeight(row.diameter) * row.quantity;
                  const isExactMatch = row.surplusAreaMm2 < 1;

                  return (
                    <button
                      key={row.diameter}
                      type="button"
                      onClick={() => selectAlternative(row)}
                      aria-pressed={isActive}
                      className={cn(
                        "group relative flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 active:scale-[0.98]",
                        isActive
                          ? "border-purple-400 bg-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.3)] ring-1 ring-purple-400/50"
                          : "border-border/80 dark:border-white/10 bg-card/80 dark:bg-[#16132e]/80 hover:border-purple-500/50 hover:bg-card dark:hover:bg-[#1d183d]",
                      )}
                    >
                      {/* Left: Diameter Badge */}
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl font-mono text-sm font-black transition-colors",
                            isActive
                              ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.5)]"
                              : "border border-border/80 dark:border-white/15 bg-muted/60 dark:bg-[#201a42] text-foreground dark:text-white group-hover:border-purple-500/40",
                          )}
                        >
                          <span>Ø{row.diameter}</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-base font-black text-foreground dark:text-white">
                              {formatInteger(row.quantity)} adet
                            </span>
                            {isActive ? (
                              <span className="rounded-md bg-purple-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-purple-700 dark:text-purple-200">
                                Seçili
                              </span>
                            ) : isExactMatch ? (
                              <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                Tam Eşdeğer
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-0.5 font-mono text-xs text-muted-foreground dark:text-zinc-400">
                            ~{formatWeight(rowLinearWeight)} kg/m
                          </p>
                        </div>
                      </div>

                      {/* Right: As & Surplus */}
                      <div className="text-right">
                        <div className="font-mono text-base font-black text-foreground dark:text-white tabular-nums">
                          {formatAreaCm2(row.providedAreaMm2)} cm²
                        </div>
                        <div className="mt-0.5 font-mono text-xs font-bold text-purple-600 dark:text-purple-300 tabular-nums">
                          +{formatAreaCm2(row.surplusAreaMm2)} cm²
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Desktop High-Precision Table (hidden md:block) */}
              <div className="mt-5 hidden md:block" data-testid="desktop-equivalent-table">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/80 dark:border-white/15 hover:bg-transparent">
                      <TableHead className="font-bold text-foreground dark:text-zinc-200">Donatı Çapı</TableHead>
                      <TableHead className="font-bold text-foreground dark:text-zinc-200">Adet</TableHead>
                      <TableHead className="font-bold text-foreground dark:text-zinc-200">Sağlanan As</TableHead>
                      <TableHead className="font-bold text-foreground dark:text-zinc-200">Fark (+ΔAs)</TableHead>
                      <TableHead className="font-bold text-foreground dark:text-zinc-200">Metraj Ağırlığı</TableHead>
                      <TableHead className="text-right font-bold text-foreground dark:text-zinc-200">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equivalentRows.map((row) => {
                      const isActive = row.diameter === diameter && row.quantity === result.quantity;
                      const rowLinearWeight = calculateLinearWeight(row.diameter) * row.quantity;
                      const isExactMatch = row.surplusAreaMm2 < 1;

                      return (
                        <TableRow
                          key={row.diameter}
                          className={cn(
                            "transition-colors border-b border-border/60 dark:border-white/10",
                            isActive
                              ? "bg-purple-500/15 dark:bg-purple-500/20"
                              : "hover:bg-muted/40 dark:hover:bg-white/[0.04]",
                          )}
                        >
                          <TableCell className="py-3">
                            <div className="inline-flex items-center gap-2">
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-card dark:bg-[#1e193d] border border-border dark:border-white/15 font-mono text-xs font-black text-foreground dark:text-white">
                                Ø{row.diameter}
                              </span>
                              {isActive && (
                                <Badge className="border-purple-500/40 bg-purple-500/25 text-[10px] font-bold text-purple-700 dark:text-purple-200">
                                  Aktif
                                </Badge>
                              )}
                              {isExactMatch && !isActive && (
                                <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/15 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                  Tam Eşdeğer
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono font-bold text-foreground dark:text-white text-sm tabular-nums py-3">
                            {formatInteger(row.quantity)} adet
                          </TableCell>
                          <TableCell className="font-mono font-black text-foreground dark:text-white text-sm tabular-nums py-3 whitespace-nowrap">
                            {formatAreaCm2(row.providedAreaMm2)} cm²
                            <span className="ml-1.5 text-xs font-normal text-muted-foreground dark:text-zinc-400">
                              ({formatAreaMm2(row.providedAreaMm2)} mm²)
                            </span>
                          </TableCell>
                          <TableCell className="font-mono font-bold text-purple-600 dark:text-purple-300 text-sm tabular-nums py-3 whitespace-nowrap">
                            +{formatAreaCm2(row.surplusAreaMm2)} cm²
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground dark:text-zinc-300 tabular-nums py-3 whitespace-nowrap">
                            ~{formatWeight(rowLinearWeight)} kg/m
                          </TableCell>
                          <TableCell className="text-right py-3">
                            <Button
                              type="button"
                              size="sm"
                              variant={isActive ? "default" : "outline"}
                              onClick={() => selectAlternative(row)}
                              className={cn(
                                "min-h-11 rounded-xl px-4 text-xs font-bold transition-all active:scale-95 whitespace-nowrap",
                                isActive
                                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                                  : "border-border dark:border-white/15 hover:border-purple-500/60 hover:text-foreground dark:hover:text-white hover:bg-purple-500/15 text-foreground dark:text-zinc-100",
                              )}
                            >
                              {isActive ? "Seçili" : "Seç"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="mt-5 flex min-h-[140px] items-center justify-center rounded-2xl border border-dashed border-border dark:border-white/20 p-6 text-center text-sm text-muted-foreground dark:text-zinc-300">
              Eşdeğer donatı kombinasyonlarını görmek için geçerli bir donatı adedi girin.
            </div>
          )}
        </section>

        {/* Tool Limitations & Normative Bounds */}
        <div className="mt-8">
          <ToolLimitations
            scope={[
              "Donatı çubuk kesit alanı (As) ve çap-adet ilişkisi",
              "Eşdeğer alan sağlayan alternatif donatı kombinasyonları",
              "Metretül ağırlığı ve 12 metrelik standart ticari boy ağırlığı",
              "Kiriş genişliğine göre tek sıra donatı yerleşebilirlik ve net aralık (s_net) ön tahkiki"
            ]}
            limitations={[
              "Nihai statik betonarme proje çizimi ve pursantaj oranları yerine geçmez",
              "Çift sıra donatı gereksiniminde faydalı yükseklik (d) kaybı ayrıca modellenmelidir",
              "TS 500 çatlak kontrolü (w_k) ve yorulma tahkiklerini içermez"
            ]}
            inputProvenance="TS 500 Betonarme Yapıların Tasarım ve Yapım Kuralları Madde 7.1 ve TS 708 Standart Çubuk Ağırlıkları"
            defaultOpen={false}
          />
        </div>

        {/* Reference Tables Dialog Modal */}
        <RebarReferenceDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          defaultTab={dialogTab}
          currentDiameter={diameter}
          currentQuantity={result?.quantity ?? 1}
          onSelectCombination={(newDiameter, newQuantity) => {
            setDiameter(newDiameter);
            setQuantityInput(String(newQuantity));
          }}
        />
      </div>
    </main>
  );
}
