"use client";

import React, { useMemo, useState } from "react";
import { ChevronDown, FlaskConical, RotateCcw } from "lucide-react";
import {
  DEFAULT_EBIS_CHIP_UNIT_PRICE_NET,
  LABORATUVAR_EFFECTIVE_YEAR,
  tryCalculateLaboratuvarFee,
  type LaboratuvarConcreteGrade,
  type LaboratuvarSampleType,
} from "@/lib/calculations/modules/laboratuvar-ucreti";
import { formatSayi, formatTL } from "@/lib/calculations/core";

const AREA_PRESETS = [250, 500, 1200, 3500] as const;

function parseOptionalPositive(raw: string, allowZero = false): number | undefined {
  const clean = raw.trim().replace(/\s+/g, "").replace(",", ".");
  if (!clean) return undefined;
  const num = Number.parseFloat(clean);
  if (!Number.isFinite(num)) return undefined;
  if (allowZero ? num < 0 : num <= 0) return undefined;
  return num;
}

function parseOptionalInt(raw: string, min: number): number | undefined {
  const clean = raw.trim();
  if (!clean) return undefined;
  const num = Number.parseInt(clean, 10);
  if (!Number.isFinite(num) || num < min) return undefined;
  return num;
}

export function LaboratuvarUcretiClient() {
  const [areaInput, setAreaInput] = useState("1200");
  const [floorsInput, setFloorsInput] = useState("5");
  const [concreteGrade, setConcreteGrade] = useState<LaboratuvarConcreteGrade>("standard");
  const [sampleType, setSampleType] = useState<LaboratuvarSampleType>("cube");

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [concreteM3Input, setConcreteM3Input] = useState("");
  const [rebarTonsInput, setRebarTonsInput] = useState("");
  const [pourCountInput, setPourCountInput] = useState("");
  const [karotCountInput, setKarotCountInput] = useState("");
  const [chipPriceInput, setChipPriceInput] = useState("");

  const parsedArea = useMemo(() => parseOptionalPositive(areaInput), [areaInput]);
  const parsedFloors = useMemo(() => parseOptionalInt(floorsInput, 1), [floorsInput]);

  const result = useMemo(() => {
    if (parsedArea === undefined || parsedFloors === undefined) return null;

    return tryCalculateLaboratuvarFee({
      area: parsedArea,
      floors: parsedFloors,
      concreteGrade,
      sampleType,
      concreteM3: parseOptionalPositive(concreteM3Input),
      rebarTons: parseOptionalPositive(rebarTonsInput, true),
      pourCount: parseOptionalInt(pourCountInput, 1),
      karotCount: parseOptionalInt(karotCountInput, 0),
      chipUnitPrice: parseOptionalPositive(chipPriceInput, true),
    });
  }, [
    parsedArea,
    parsedFloors,
    concreteGrade,
    sampleType,
    concreteM3Input,
    rebarTonsInput,
    pourCountInput,
    karotCountInput,
    chipPriceInput,
  ]);

  const hasCustomOverrides =
    Boolean(concreteM3Input.trim()) ||
    Boolean(rebarTonsInput.trim()) ||
    Boolean(pourCountInput.trim()) ||
    Boolean(karotCountInput.trim()) ||
    Boolean(chipPriceInput.trim());

  const resetOverrides = () => {
    setConcreteM3Input("");
    setRebarTonsInput("");
    setPourCountInput("");
    setKarotCountInput("");
    setChipPriceInput("");
  };

  return (
    <div className="tool-page-shell min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 md:py-12">
        <header className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-bold text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-500/15 dark:text-cyan-300">
            <FlaskConical className="h-3.5 w-3.5" />
            <span>{LABORATUVAR_EFFECTIVE_YEAR} · Ek-9 · EBİS · TS 708</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl dark:text-white">
            Tahmini Laboratuvar Ücreti
          </h1>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          {/* SOL PANEL: SADE GİRDİLER */}
          <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm dark:border-white/10 dark:bg-[#090c1e]/90">
            <div className="space-y-5">
              {/* 1. İnşaat Alanı */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="lab-area-input"
                    className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-slate-200"
                  >
                    Toplam İnşaat Alanı (m²)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {AREA_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAreaInput(String(preset))}
                        className={`rounded-lg px-2 py-0.5 text-[11px] font-mono font-bold transition-colors ${
                          parsedArea === preset
                            ? "bg-cyan-500 text-white"
                            : "bg-muted text-muted-foreground hover:text-foreground dark:bg-white/5 dark:text-slate-400"
                        }`}
                      >
                        {formatSayi(preset)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative mt-2 rounded-2xl border border-border bg-background focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 dark:border-white/15 dark:bg-black/30">
                  <input
                    id="lab-area-input"
                    data-testid="lab-area-input"
                    type="text"
                    inputMode="decimal"
                    value={areaInput}
                    onChange={(e) => setAreaInput(e.target.value)}
                    placeholder="Örn: 1200"
                    className="w-full bg-transparent px-4 py-3 pr-12 font-mono text-base font-bold text-foreground outline-none dark:text-white"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-mono text-xs font-bold text-muted-foreground">
                    m²
                  </span>
                </div>
              </div>

              {/* 2. Kat Sayısı */}
              <div>
                <label
                  htmlFor="lab-floors-input"
                  className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-slate-200"
                >
                  Kat Sayısı
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Kat sayısını azalt"
                    onClick={() =>
                      setFloorsInput(String(Math.max(1, (parsedFloors ?? 1) - 1)))
                    }
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40 font-mono text-base font-bold text-foreground transition-colors hover:bg-muted dark:border-white/15 dark:bg-white/5 dark:text-white"
                  >
                    −
                  </button>
                  <input
                    id="lab-floors-input"
                    data-testid="lab-floors-input"
                    type="text"
                    inputMode="numeric"
                    value={floorsInput}
                    onChange={(e) => setFloorsInput(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-background px-4 text-center font-mono text-base font-bold text-foreground outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-white/15 dark:bg-black/30 dark:text-white"
                  />
                  <button
                    type="button"
                    aria-label="Kat sayısını artır"
                    onClick={() =>
                      setFloorsInput(String(Math.min(60, (parsedFloors ?? 1) + 1)))
                    }
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40 font-mono text-base font-bold text-foreground transition-colors hover:bg-muted dark:border-white/15 dark:bg-white/5 dark:text-white"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 3. Beton Sınıfı & Numune Tipi */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-slate-200">
                    Beton Sınıfı
                  </span>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {[
                      { id: "standard", label: "C25–C50" },
                      { id: "high", label: "C55+" },
                    ].map((item) => {
                      const active = concreteGrade === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          data-testid={`grade-btn-${item.id}`}
                          aria-pressed={active}
                          onClick={() =>
                            setConcreteGrade(item.id as LaboratuvarConcreteGrade)
                          }
                          className={`rounded-xl border py-2.5 font-mono text-xs font-bold transition-all ${
                            active
                              ? "border-cyan-500 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300"
                              : "border-border/80 bg-muted/30 text-muted-foreground hover:text-foreground dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400"
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-slate-200">
                    Numune Tipi
                  </span>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {[
                      { id: "cube", label: "Küp" },
                      { id: "cylinder", label: "Silindir" },
                    ].map((item) => {
                      const active = sampleType === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          data-testid={`sample-btn-${item.id}`}
                          aria-pressed={active}
                          onClick={() =>
                            setSampleType(item.id as LaboratuvarSampleType)
                          }
                          className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${
                            active
                              ? "border-cyan-500 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300"
                              : "border-border/80 bg-muted/30 text-muted-foreground hover:text-foreground dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400"
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 4. İsteğe Bağlı Özelleştirme (Varsayılan Kapalı) */}
              <div className="border-t border-border/60 pt-4 dark:border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    data-testid="toggle-advanced-btn"
                    onClick={() => setShowAdvanced((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground dark:text-slate-400 dark:hover:text-white"
                  >
                    <span>Metraj / Birim Fiyat Özelleştir</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${
                        showAdvanced ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {hasCustomOverrides && (
                    <button
                      type="button"
                      onClick={resetOverrides}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-600 hover:underline dark:text-cyan-400"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Sıfırla
                    </button>
                  )}
                </div>

                {showAdvanced && (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div>
                      <label
                        htmlFor="lab-concrete-m3"
                        className="text-[11px] font-bold text-muted-foreground"
                      >
                        Beton (m³)
                      </label>
                      <input
                        id="lab-concrete-m3"
                        data-testid="lab-concrete-m3"
                        type="text"
                        inputMode="decimal"
                        value={concreteM3Input}
                        onChange={(e) => setConcreteM3Input(e.target.value)}
                        placeholder={result ? String(result.estimatedConcreteM3) : "Oto"}
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs font-bold text-foreground outline-none focus:border-cyan-500 dark:border-white/15 dark:bg-black/30 dark:text-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="lab-rebar-tons"
                        className="text-[11px] font-bold text-muted-foreground"
                      >
                        Demir (ton)
                      </label>
                      <input
                        id="lab-rebar-tons"
                        data-testid="lab-rebar-tons"
                        type="text"
                        inputMode="decimal"
                        value={rebarTonsInput}
                        onChange={(e) => setRebarTonsInput(e.target.value)}
                        placeholder={result ? String(result.estimatedRebarTons) : "Oto"}
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs font-bold text-foreground outline-none focus:border-cyan-500 dark:border-white/15 dark:bg-black/30 dark:text-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="lab-pour-count"
                        className="text-[11px] font-bold text-muted-foreground"
                      >
                        Döküm (gün)
                      </label>
                      <input
                        id="lab-pour-count"
                        data-testid="lab-pour-count"
                        type="text"
                        inputMode="numeric"
                        value={pourCountInput}
                        onChange={(e) => setPourCountInput(e.target.value)}
                        placeholder={result ? String(result.pourCount) : "Oto"}
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs font-bold text-foreground outline-none focus:border-cyan-500 dark:border-white/15 dark:bg-black/30 dark:text-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="lab-karot-count"
                        className="text-[11px] font-bold text-muted-foreground"
                      >
                        Ek Karot (adet)
                      </label>
                      <input
                        id="lab-karot-count"
                        data-testid="lab-karot-count"
                        type="text"
                        inputMode="numeric"
                        value={karotCountInput}
                        onChange={(e) => setKarotCountInput(e.target.value)}
                        placeholder="0"
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs font-bold text-foreground outline-none focus:border-cyan-500 dark:border-white/15 dark:bg-black/30 dark:text-white"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-2">
                      <label
                        htmlFor="lab-chip-price"
                        className="text-[11px] font-bold text-muted-foreground"
                      >
                        EBİS Çip Birim (KDV Hariç TL)
                      </label>
                      <input
                        id="lab-chip-price"
                        data-testid="lab-chip-price"
                        type="text"
                        inputMode="decimal"
                        value={chipPriceInput}
                        onChange={(e) => setChipPriceInput(e.target.value)}
                        placeholder={String(DEFAULT_EBIS_CHIP_UNIT_PRICE_NET)}
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs font-bold text-foreground outline-none focus:border-cyan-500 dark:border-white/15 dark:bg-black/30 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* SAĞ PANEL: DOĞRUDAN SONUÇ */}
          <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm dark:border-cyan-500/20 dark:bg-[#0c0d12]/95">
            {result ? (
              <div className="space-y-5">
                {/* Ana Rakam */}
                <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-cyan-500/[0.08] via-transparent to-transparent p-5 dark:border-cyan-500/25 dark:from-cyan-500/10">
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                    Tahmini Laboratuvar Ücreti (KDV Dahil)
                  </div>
                  <div
                    data-testid="lab-total-gross"
                    className="mt-2 font-mono text-4xl font-black tracking-tight text-foreground sm:text-5xl dark:text-white"
                  >
                    {formatTL(result.totalGross)}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-cyan-500/15 pt-4 text-xs">
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                        KDV Hariç
                      </span>
                      <span
                        data-testid="lab-subtotal-net"
                        className="font-mono font-bold text-foreground dark:text-slate-200"
                      >
                        {formatTL(result.subtotalNet)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                        m² Başına
                      </span>
                      <span className="font-mono font-bold text-foreground dark:text-slate-200">
                        {formatSayi(result.perSquareMeterGross, 1)} TL/m²
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                        Ek-9 Aralığı
                      </span>
                      <span className="font-mono font-bold text-foreground dark:text-slate-200">
                        {formatTL(result.minGross).replace(" TL", "")}–{formatTL(result.maxGross)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Kalem Dökümü */}
                <div className="overflow-hidden rounded-2xl border border-border/70 dark:border-white/10">
                  <table className="w-full border-collapse text-xs">
                    <tbody className="divide-y divide-border/60 dark:divide-white/5">
                      {result.breakdown.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 font-semibold text-foreground dark:text-slate-200">
                            {item.label}
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-muted-foreground">
                            {item.quantityText}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-foreground dark:text-white">
                            {formatTL(item.amountNet)}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td className="px-4 py-3 font-semibold text-muted-foreground">
                          KDV (%20)
                        </td>
                        <td className="px-3 py-3" />
                        <td className="px-4 py-3 text-right font-mono font-bold text-foreground dark:text-slate-200">
                          {formatTL(result.vatAmount)}
                        </td>
                      </tr>
                      <tr className="bg-muted/50 dark:bg-white/5">
                        <td className="px-4 py-3 font-extrabold text-foreground dark:text-white">
                          Toplam
                        </td>
                        <td className="px-3 py-3" />
                        <td className="px-4 py-3 text-right font-mono text-sm font-black text-cyan-700 dark:text-cyan-300">
                          {formatTL(result.totalGross)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Kısa Teknik Özet Şeridi */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5 font-mono text-[11px] text-muted-foreground dark:border-white/5 dark:bg-white/[0.02]">
                  <span>Döküm: {result.pourCount} gün</span>
                  <span>Beton: ~{formatSayi(result.estimatedConcreteM3)} m³</span>
                  <span>Demir: ~{formatSayi(result.estimatedRebarTons, 1)} ton</span>
                </div>
              </div>
            ) : (
              <div
                data-testid="lab-empty-state"
                className="flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-border/70 p-6 text-center text-sm font-semibold text-muted-foreground dark:border-white/10"
              >
                Geçerli alan (m²) ve kat sayısı girin.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
