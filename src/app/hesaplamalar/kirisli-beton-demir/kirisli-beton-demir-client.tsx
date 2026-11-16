"use client";

import React, { useMemo, useState } from "react";
import { Layers3 } from "lucide-react";
import { formatSayi, formatTL } from "@/lib/calculations/core";
import {
  tryCalculateKirisliBetonDemir,
  type KirisliBasementCount,
  type KirisliFoundationType,
  type KirisliInputMode,
  type KirisliStructuralSystem,
} from "@/lib/calculations/modules/kirisli-beton-demir";

const AREA_PRESETS = [250, 600, 1200, 2500] as const;
const PARCEL_PRESETS = [300, 500, 1000, 2000] as const;

function parsePositiveDecimal(raw: string): number | null {
  const clean = raw.trim().replace(/\s+/g, "").replace(",", ".");
  if (!clean) return null;
  const num = Number.parseFloat(clean);
  if (!Number.isFinite(num) || num <= 0) return null;
  return num;
}

function parsePositiveInt(raw: string): number | null {
  const clean = raw.trim();
  if (!clean) return null;
  const num = Number.parseInt(clean, 10);
  if (!Number.isFinite(num) || num < 1) return null;
  return num;
}

export function KirisliBetonDemirClient() {
  const [mode, setMode] = useState<KirisliInputMode>("alan");

  // Mod 1: İnşaat Alanı
  const [areaInput, setAreaInput] = useState("1200");
  const [normalFloorsInput, setNormalFloorsInput] = useState("5");

  // Mod 2: Parsel (TAKS / KAKS)
  const [parcelInput, setParcelInput] = useState("500");
  const [taksInput, setTaksInput] = useState("0.30");
  const [kaksInput, setKaksInput] = useState("1.50");

  // Ortak Yapısal Seçimler
  const [structuralSystem, setStructuralSystem] = useState<KirisliStructuralSystem>("kolonPerde");
  const [foundationType, setFoundationType] = useState<KirisliFoundationType>("radye");
  const [basementFloors, setBasementFloors] = useState<KirisliBasementCount>(1);

  const parsedArea = useMemo(() => parsePositiveDecimal(areaInput), [areaInput]);
  const parsedNormalFloors = useMemo(() => parsePositiveInt(normalFloorsInput), [normalFloorsInput]);
  const parsedParcel = useMemo(() => parsePositiveDecimal(parcelInput), [parcelInput]);
  const parsedTaks = useMemo(() => parsePositiveDecimal(taksInput), [taksInput]);
  const parsedKaks = useMemo(() => parsePositiveDecimal(kaksInput), [kaksInput]);

  const result = useMemo(() => {
    if (mode === "parsel") {
      if (parsedParcel === null || parsedTaks === null || parsedKaks === null) return null;
      return tryCalculateKirisliBetonDemir({
        mode: "parsel",
        parcelAreaM2: parsedParcel,
        taks: parsedTaks,
        kaks: parsedKaks,
        basementFloors,
        structuralSystem,
        foundationType,
      });
    }

    if (parsedArea === null || parsedNormalFloors === null) return null;
    return tryCalculateKirisliBetonDemir({
      mode: "alan",
      areaM2: parsedArea,
      normalFloors: parsedNormalFloors,
      basementFloors,
      structuralSystem,
      foundationType,
    });
  }, [
    mode,
    parsedArea,
    parsedNormalFloors,
    parsedParcel,
    parsedTaks,
    parsedKaks,
    basementFloors,
    structuralSystem,
    foundationType,
  ]);

  return (
    <div className="tool-page-shell min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 md:py-12">
        <header className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-300">
            <Layers3 className="h-3.5 w-3.5" />
            <span>Kirişli Döşeme · 2026</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl dark:text-white">
            Kirişli Döşeme Beton &amp; Demir
          </h1>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          {/* SOL PANEL: SADE GİRDİLER */}
          <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm dark:border-white/10 dark:bg-[#090c1e]/90">
            <div className="space-y-5">
              {/* Giriş Modu Sekmesi */}
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border/70 bg-muted/40 p-1 dark:border-white/10 dark:bg-black/30">
                {[
                  { id: "alan", label: "İnşaat Alanı" },
                  { id: "parsel", label: "Parsel (TAKS / KAKS)" },
                ].map((tab) => {
                  const active = mode === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      data-testid={`mode-btn-${tab.id}`}
                      aria-pressed={active}
                      onClick={() => setMode(tab.id as KirisliInputMode)}
                      className={`rounded-xl py-2.5 text-xs font-bold transition-all ${
                        active
                          ? "bg-amber-500 text-black shadow-sm"
                          : "text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {mode === "alan" ? (
                <>
                  {/* Mod 1: Toplam İnşaat Alanı */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label
                        htmlFor="kirisli-area-input"
                        className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-slate-200"
                      >
                        {basementFloors > 0 ? "Toplam İnşaat Alanı (Bodrum Dahil)" : "Toplam İnşaat Alanı"}
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {AREA_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setAreaInput(String(preset))}
                            className={`rounded-lg px-2 py-0.5 font-mono text-[11px] font-bold transition-colors ${
                              parsedArea === preset
                                ? "bg-amber-500 text-black"
                                : "bg-muted text-muted-foreground hover:text-foreground dark:bg-white/5 dark:text-slate-400"
                            }`}
                          >
                            {formatSayi(preset)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="relative mt-2 rounded-2xl border border-border bg-background focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 dark:border-white/15 dark:bg-black/30">
                      <input
                        id="kirisli-area-input"
                        data-testid="kirisli-area-input"
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

                  {/* Normal Kat Sayısı */}
                  <div>
                    <label
                      htmlFor="kirisli-floors-input"
                      className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-slate-200"
                    >
                      Normal Kat Sayısı
                    </label>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Kat sayısını azalt"
                        onClick={() =>
                          setNormalFloorsInput(String(Math.max(1, (parsedNormalFloors ?? 1) - 1)))
                        }
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40 font-mono text-base font-bold text-foreground transition-colors hover:bg-muted dark:border-white/15 dark:bg-white/5 dark:text-white"
                      >
                        −
                      </button>
                      <input
                        id="kirisli-floors-input"
                        data-testid="kirisli-floors-input"
                        type="text"
                        inputMode="numeric"
                        value={normalFloorsInput}
                        onChange={(e) => setNormalFloorsInput(e.target.value)}
                        className="h-11 w-full rounded-xl border border-border bg-background px-4 text-center font-mono text-base font-bold text-foreground outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-white/15 dark:bg-black/30 dark:text-white"
                      />
                      <button
                        type="button"
                        aria-label="Kat sayısını artır"
                        onClick={() =>
                          setNormalFloorsInput(String(Math.min(30, (parsedNormalFloors ?? 1) + 1)))
                        }
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40 font-mono text-base font-bold text-foreground transition-colors hover:bg-muted dark:border-white/15 dark:bg-white/5 dark:text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Mod 2: Parsel Alanı + TAKS + KAKS */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label
                        htmlFor="kirisli-parcel-input"
                        className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-slate-200"
                      >
                        Parsel Alanı
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {PARCEL_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setParcelInput(String(preset))}
                            className={`rounded-lg px-2 py-0.5 font-mono text-[11px] font-bold transition-colors ${
                              parsedParcel === preset
                                ? "bg-amber-500 text-black"
                                : "bg-muted text-muted-foreground hover:text-foreground dark:bg-white/5 dark:text-slate-400"
                            }`}
                          >
                            {formatSayi(preset)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="relative mt-2 rounded-2xl border border-border bg-background focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 dark:border-white/15 dark:bg-black/30">
                      <input
                        id="kirisli-parcel-input"
                        data-testid="kirisli-parcel-input"
                        type="text"
                        inputMode="decimal"
                        value={parcelInput}
                        onChange={(e) => setParcelInput(e.target.value)}
                        placeholder="Örn: 500"
                        className="w-full bg-transparent px-4 py-3 pr-12 font-mono text-base font-bold text-foreground outline-none dark:text-white"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-mono text-xs font-bold text-muted-foreground">
                        m²
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="kirisli-taks-input"
                        className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-slate-200"
                      >
                        TAKS
                      </label>
                      <input
                        id="kirisli-taks-input"
                        data-testid="kirisli-taks-input"
                        type="text"
                        inputMode="decimal"
                        value={taksInput}
                        onChange={(e) => setTaksInput(e.target.value)}
                        placeholder="0.30"
                        className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-4 font-mono text-base font-bold text-foreground outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-white/15 dark:bg-black/30 dark:text-white"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="kirisli-kaks-input"
                        className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-slate-200"
                      >
                        KAKS (Emsal)
                      </label>
                      <input
                        id="kirisli-kaks-input"
                        data-testid="kirisli-kaks-input"
                        type="text"
                        inputMode="decimal"
                        value={kaksInput}
                        onChange={(e) => setKaksInput(e.target.value)}
                        placeholder="1.50"
                        className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-4 font-mono text-base font-bold text-foreground outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-white/15 dark:bg-black/30 dark:text-white"
                      />
                    </div>
                  </div>

                  {result && (
                    <div
                      data-testid="kirisli-parcel-summary"
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/30 px-3.5 py-2 font-mono text-[11px] font-bold text-muted-foreground dark:border-white/5 dark:bg-white/[0.03]"
                    >
                      <span>Taban: {formatSayi(result.footprintAreaM2)} m²</span>
                      <span>~{result.normalFloors} Normal Kat</span>
                      <span>Toplam: {formatSayi(result.totalAreaM2)} m²</span>
                    </div>
                  )}
                </>
              )}

              {/* Taşıyıcı Sistem */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-slate-200">
                  Taşıyıcı Sistem
                </span>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {[
                    { id: "kolon", label: "Kolon" },
                    { id: "kolonPerde", label: "Kolon + Perde" },
                    { id: "sadecePerde", label: "Sadece Perdeli" },
                  ].map((item) => {
                    const active = structuralSystem === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-testid={`system-btn-${item.id}`}
                        aria-pressed={active}
                        onClick={() => setStructuralSystem(item.id as KirisliStructuralSystem)}
                        className={`rounded-xl border px-2 py-2.5 text-xs font-bold transition-all ${
                          active
                            ? "border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                            : "border-border/80 bg-muted/30 text-muted-foreground hover:text-foreground dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Temel Tipi & Bodrum */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-slate-200">
                    Temel Tipi
                  </span>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {[
                      { id: "radye", label: "Radye" },
                      { id: "mutemadi", label: "Mütemadi" },
                    ].map((item) => {
                      const active = foundationType === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          data-testid={`foundation-btn-${item.id}`}
                          aria-pressed={active}
                          onClick={() => setFoundationType(item.id as KirisliFoundationType)}
                          className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${
                            active
                              ? "border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300"
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
                    Bodrum (Rijit Perdeli)
                  </span>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {[
                      { id: 0, label: "Yok" },
                      { id: 1, label: "1 Kat" },
                      { id: 2, label: "2 Kat" },
                    ].map((item) => {
                      const active = basementFloors === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          data-testid={`basement-btn-${item.id}`}
                          aria-pressed={active}
                          onClick={() => setBasementFloors(item.id as KirisliBasementCount)}
                          className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${
                            active
                              ? "border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300"
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
            </div>
          </section>

          {/* SAĞ PANEL: DOĞRUDAN SONUÇ */}
          <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm dark:border-amber-500/20 dark:bg-[#0c0d12]/95">
            {result ? (
              <div className="space-y-5">
                {/* Beton & Demir Ana Kartları */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-b from-amber-500/[0.08] via-transparent to-transparent p-5 dark:from-amber-500/10">
                    <div className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                      Tahmini Beton
                    </div>
                    <div
                      data-testid="kirisli-total-concrete"
                      className="mt-2 font-mono text-3xl font-black tracking-tight text-foreground sm:text-4xl dark:text-white"
                    >
                      {formatSayi(result.totalConcreteM3, 1)} m³
                    </div>
                    <div className="mt-2 font-mono text-xs font-bold text-muted-foreground">
                      {formatSayi(result.concretePerM2, 2)} m³/m²
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-500/25 bg-gradient-to-b from-blue-500/[0.08] via-transparent to-transparent p-5 dark:from-blue-500/10">
                    <div className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                      Tahmini Demir
                    </div>
                    <div
                      data-testid="kirisli-total-rebar"
                      className="mt-2 font-mono text-3xl font-black tracking-tight text-foreground sm:text-4xl dark:text-white"
                    >
                      {formatSayi(result.totalRebarTons, 1)} ton
                    </div>
                    <div className="mt-2 font-mono text-xs font-bold text-muted-foreground">
                      {formatSayi(result.rebarKgPerM2, 1)} kg/m² · {formatSayi(result.rebarKgPerM3, 0)} kg/m³
                    </div>
                  </div>
                </div>

                {/* Tahmini Laboratuvar Ücreti */}
                <div className="rounded-2xl border border-cyan-500/25 bg-gradient-to-b from-cyan-500/[0.08] via-transparent to-transparent p-5 dark:from-cyan-500/10">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                      Tahmini Laboratuvar Ücreti (KDV Dahil)
                    </span>
                    <span className="font-mono text-[11px] font-bold text-muted-foreground">
                      KDV Hariç: {formatTL(result.labEstimate.subtotalNet)}
                    </span>
                  </div>
                  <div
                    data-testid="kirisli-lab-fee"
                    className="mt-2 font-mono text-3xl font-black tracking-tight text-foreground sm:text-4xl dark:text-white"
                  >
                    {formatTL(result.labEstimate.totalGross)}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
                    <span>{result.labEstimate.sampleCount} küp + EBİS çip</span>
                    <span>·</span>
                    <span>{result.labEstimate.steelTeamCount} takım demir çekme</span>
                    <span>·</span>
                    <span>{result.labEstimate.pourCount} gün döküm</span>
                  </div>
                </div>

                {/* Sade Dağılım Tablosu */}
                <div className="overflow-hidden rounded-2xl border border-border/70 dark:border-white/10">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/40 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:border-white/10 dark:bg-white/[0.03]">
                        <th className="px-4 py-2.5">Kalem</th>
                        <th className="px-3 py-2.5 text-right">Beton</th>
                        <th className="px-4 py-2.5 text-right">Demir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 dark:divide-white/5">
                      {result.breakdown.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 font-semibold text-foreground dark:text-slate-200">
                            {item.label}
                          </td>
                          <td className="px-3 py-3 text-right font-mono font-bold text-foreground dark:text-slate-200">
                            {formatSayi(item.concreteM3, 1)} m³
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-foreground dark:text-white">
                            {formatSayi(item.rebarTons, 1)} ton
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-muted/50 dark:bg-white/5">
                        <td className="px-4 py-3 font-extrabold text-foreground dark:text-white">
                          Toplam
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-sm font-black text-amber-700 dark:text-amber-300">
                          {formatSayi(result.totalConcreteM3, 1)} m³
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm font-black text-blue-700 dark:text-blue-300">
                          {formatSayi(result.totalRebarTons, 1)} ton
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Kısa Geometri Özeti */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5 font-mono text-[11px] text-muted-foreground dark:border-white/5 dark:bg-white/[0.02]">
                  <span>Alan: {formatSayi(result.totalAreaM2)} m²</span>
                  <span>Taban: {formatSayi(result.footprintAreaM2)} m²</span>
                  <span>Kat: {result.totalFloors} ({result.normalFloors}+{result.basementFloors}B)</span>
                </div>
              </div>
            ) : (
              <div
                data-testid="kirisli-empty-state"
                className="flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-border/70 p-6 text-center text-sm font-semibold text-muted-foreground dark:border-white/10"
              >
                Geçerli alan ve kat değerleri girin.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
