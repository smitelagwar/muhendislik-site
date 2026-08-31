"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Building, Calculator, Info, MapPinned } from "lucide-react";
import Link from "next/link";
import { PageContextNavigation } from "@/components/page-context-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IMAR_BASEMENT_COUNT_OPTIONS, IMAR_KAKS_SLIDER, IMAR_TAKS_SLIDER } from "@/lib/imar/config";
import { IMAR_DETAIL_HELP, IMAR_PAGE_NOTE, IMAR_REGULATION_GUIDE_INTRO, IMAR_REGULATION_GUIDE_NOTE, IMAR_REGULATION_GUIDE_RULES } from "@/lib/imar/copy";
import { imarBodyFont, imarDisplayFont, imarMonoFont } from "@/lib/imar/fonts";
import { calculateImarValues } from "@/lib/imar/calculator";
import type { ImarCalculatorInput } from "@/lib/imar/types";
import { cn } from "@/lib/utils";
import {
  ToolScopeBadge,
  ToolSourceStamp,
  ToolLimitations,
  GoverningCheckCard,
} from "@/components/engineering-primitives";

type FormState = {
  grossParcelAreaM2: string; taks: string; kaks: string; basementCount: string;
  frontSetbackM: string; rearSetbackM: string; sideSetbackM: string; parcelWidthM: string; parcelDepthM: string;
};

const DEFAULT_STATE: FormState = {
  grossParcelAreaM2: "1000", taks: "0.30", kaks: "1.50", basementCount: "1",
  frontSetbackM: "5", rearSetbackM: "3", sideSetbackM: "3", parcelWidthM: "25", parcelDepthM: "40",
};

const nf = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const fmt = (v: number) => nf.format(v);
const num = (v: string) => v.trim() === "" ? null : Number(v.replace(",", "."));
const pos = (v: string) => { const n = num(v); return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : null; };
const nonNeg = (v: string) => v.trim() === "" ? null : (() => { const n = num(v); return typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : null; })();
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

function buildInput(state: FormState, detailed: boolean) {
  const gross = pos(state.grossParcelAreaM2), taks = pos(state.taks), kaks = pos(state.kaks), basement = num(state.basementCount);
  if (!gross) return { input: null, error: "Arsa alanı sıfırdan büyük olmalıdır." };
  if (!taks || taks > 1) return { input: null, error: "TAKS 0.00 ile 1.00 arasında olmalıdır." };
  if (!kaks) return { input: null, error: "KAKS / emsal sıfırdan büyük olmalıdır." };
  if (basement === null || !Number.isInteger(basement) || basement < 0 || basement > 3) return { input: null, error: "Bodrum kat sayısı 0-3 arasında tam sayı olmalıdır." };
  let front = 0, rear = 0, side = 0, width: number | null = null, depth: number | null = null;
  if (detailed) {
    const pf = nonNeg(state.frontSetbackM), pr = nonNeg(state.rearSetbackM), ps = nonNeg(state.sideSetbackM), pw = nonNeg(state.parcelWidthM), pd = nonNeg(state.parcelDepthM);
    if ([pf, pr, ps, pw, pd].includes(null) && [state.frontSetbackM, state.rearSetbackM, state.sideSetbackM, state.parcelWidthM, state.parcelDepthM].some((v) => v.trim() !== "")) return { input: null, error: "Detaylı girişte negatif veya geçersiz değer kullanılamaz." };
    const hasWidth = state.parcelWidthM.trim() !== "", hasDepth = state.parcelDepthM.trim() !== "";
    if (hasWidth !== hasDepth) return { input: null, error: "Parsel eni ve derinliği birlikte girilmelidir." };
    front = pf ?? 0; rear = pr ?? 0; side = ps ?? 0; width = hasWidth ? pw : null; depth = hasDepth ? pd : null;
    if (width !== null && depth !== null) {
      if (side * 2 >= width) return { input: null, error: "Yan çekmeler parsel enini tamamen tüketiyor." };
      if (front + rear >= depth) return { input: null, error: "Ön ve arka çekmeler parsel derinliğini tamamen tüketiyor." };
    }
  }
  const input: ImarCalculatorInput = { grossParcelAreaM2: gross, taks, kaks, basementCount: basement, frontSetbackM: front, rearSetbackM: rear, sideSetbackM: side, parcelWidthM: width, parcelDepthM: depth };
  return { input, error: null };
}

export function ImarCalculator() {
  const [form, setForm] = useState<FormState>(DEFAULT_STATE);
  const [live, setLive] = useState<FormState>(DEFAULT_STATE);
  const [detailed, setDetailed] = useState(false);
  const [calculated, setCalculated] = useState(false);

  useEffect(() => {
    if (!calculated) return;
    const t = setTimeout(() => setLive(form), 180);
    return () => clearTimeout(t);
  }, [form, calculated]);

  const active = calculated ? live : form;
  const parsed = useMemo(() => buildInput(active, detailed), [active, detailed]);
  const result = useMemo(() => parsed.input ? calculateImarValues(parsed.input) : null, [parsed.input]);
  const error = calculated ? parsed.error ?? (!result ? "Geçerli sonuç üretilemedi." : null) : null;
  const tVal = clamp(num(form.taks) ?? IMAR_TAKS_SLIDER.min, IMAR_TAKS_SLIDER.min, IMAR_TAKS_SLIDER.max);
  const kVal = clamp(num(form.kaks) ?? IMAR_KAKS_SLIDER.min, IMAR_KAKS_SLIDER.min, IMAR_KAKS_SLIDER.max);
  const fill = result ? 176 * Math.sqrt(result.coverageRatio) : 0;
  const lines = result && parsed.input ? [
    result.netAreaMode === "setbacks" && result.buildableWidthM !== null && result.buildableDepthM !== null
      ? `Net arsa = (${fmt(parsed.input.parcelWidthM ?? 0)} - 2 x ${fmt(parsed.input.sideSetbackM)}) x (${fmt(parsed.input.parcelDepthM ?? 0)} - ${fmt(parsed.input.frontSetbackM)} - ${fmt(parsed.input.rearSetbackM)}) = ${fmt(result.netParcelAreaM2)} m²`
      : `Net arsa = ${fmt(parsed.input.grossParcelAreaM2)} m²`,
    `${fmt(result.netParcelAreaM2)} x ${fmt(parsed.input.taks)} = ${fmt(result.maxGroundAreaM2)} m² taban`,
    `${fmt(result.netParcelAreaM2)} x ${fmt(parsed.input.kaks)} = ${fmt(result.totalConstructionAreaM2)} m² toplam inşaat`,
    `${fmt(result.totalConstructionAreaM2)} / ${fmt(result.maxGroundAreaM2)} = ${fmt(result.theoreticalFloorEquivalent)} teorik kat`,
  ] : [];
  const setField = (k: keyof FormState, v: string) => setForm((s) => ({ ...s, [k]: v }));

  return (
    <div className={cn(imarBodyFont.className, "tool-page-shell relative min-h-screen py-8 md:py-14 text-foreground")}>
      {/* Cosmic Background Glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-b from-purple-600/20 via-indigo-600/10 to-transparent blur-[120px] dark:from-purple-600/25" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <PageContextNavigation
          showBreadcrumbs={false}
          className="mb-8"
          backLinkClassName={cn(
            imarMonoFont.className,
            "inline-flex items-center gap-2 rounded-xl border border-border/80 dark:border-white/15 bg-card/80 dark:bg-[#120f28]/90 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-200 backdrop-blur-xl transition-all hover:border-purple-500/50 hover:bg-card dark:hover:bg-[#1b173b] hover:text-foreground dark:hover:text-white",
          )}
        />

        {/* Hero Header */}
        <section className="mb-8 rounded-[32px] border border-border/80 dark:border-purple-500/20 bg-card/90 dark:bg-[#0f0d22]/85 p-6 sm:p-8 md:p-10 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <ToolScopeBadge kind="classification" />
                <ToolSourceStamp sources={["Planlı Alanlar İmar Yönetmeliği", "3194 Sayılı Kanun"]} tier="B" />
              </div>
              <h1 className={cn(imarDisplayFont.className, "text-4xl font-black tracking-tight text-foreground dark:text-white md:text-6xl")}>
                İmar Hesaplayıcı
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground dark:text-zinc-300 md:text-base">
                Arsa alanı, TAKS, KAKS ve çekmelere göre taban alanı, kat karşılığı ve yaklaşık yükseklik için yüksek hassasiyetli ön değerlendirme alın.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" className="rounded-xl border-border/80 dark:border-white/15 bg-card/80 dark:bg-[#16132e]/90 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-200 hover:border-purple-500/50 hover:text-white">
                    <Info className="mr-2 h-4 w-4 text-purple-400" />
                    Mevzuat Notları
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-card dark:bg-[#0c0a1e] border-border dark:border-purple-500/30 rounded-3xl p-6 shadow-[0_0_60px_rgba(139,92,246,0.2)]">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black text-foreground dark:text-white">İmar Kuralları & Esaslar</DialogTitle>
                    <DialogDescription className="text-muted-foreground dark:text-zinc-300">{IMAR_REGULATION_GUIDE_INTRO}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 mt-4">
                    {IMAR_REGULATION_GUIDE_RULES.map((r, i) => (
                      <div key={r} className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#120f26]/80 p-4 text-sm leading-6 text-foreground dark:text-zinc-200">
                        <span className="mr-2 font-black text-purple-400">{i + 1}.</span>
                        {r}
                      </div>
                    ))}
                  </div>
                  <DialogFooter className="border-t border-border/70 dark:border-white/10 pt-4 mt-4">
                    <p className="mr-auto text-xs text-muted-foreground dark:text-zinc-400">{IMAR_REGULATION_GUIDE_NOTE}</p>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          {/* Inputs Section */}
          <section className="tool-panel rounded-[32px] p-6 sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4 border-b border-border/70 dark:border-white/10 pb-4">
              <div>
                <p className={cn(imarMonoFont.className, "text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground dark:text-zinc-400")}>Girdi Bilgileri</p>
                <h2 className={cn(imarDisplayFont.className, "mt-2 text-2xl sm:text-3xl font-black tracking-tight text-foreground dark:text-white")}>Arsa ve Katsayılar</h2>
              </div>
              <div className="rounded-2xl bg-purple-500/15 border border-purple-500/30 p-3 text-purple-400">
                <Calculator className="h-5 w-5" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <p className={cn(imarMonoFont.className, "mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300")}>
                  Arsa Alanı <span className="text-purple-400">[m²]</span>
                </p>
                <Input
                  value={form.grossParcelAreaM2}
                  onChange={(e) => setField("grossParcelAreaM2", e.target.value)}
                  inputMode="decimal"
                  className="tool-input h-12 text-foreground dark:text-white font-mono font-bold"
                />
              </div>

              <div className="sm:col-span-2 rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                <p className={cn(imarMonoFont.className, "mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300")}>
                  TAKS <span className="text-purple-400">[Taban Alanı Katsayısı]</span>
                </p>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_104px] items-center">
                  <input
                    type="range"
                    min={IMAR_TAKS_SLIDER.min}
                    max={IMAR_TAKS_SLIDER.max}
                    step={IMAR_TAKS_SLIDER.step}
                    value={tVal}
                    onChange={(e) => setField("taks", Number(e.target.value).toFixed(2))}
                    className="h-2 w-full cursor-pointer accent-[#a855f7]"
                    aria-label="TAKS"
                  />
                  <Input
                    value={form.taks}
                    onChange={(e) => setField("taks", e.target.value)}
                    inputMode="decimal"
                    className="tool-input h-11 text-foreground dark:text-white font-mono font-bold text-center"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                <p className={cn(imarMonoFont.className, "mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300")}>
                  KAKS / Emsal <span className="text-purple-400">[Katsayı]</span>
                </p>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_104px] items-center">
                  <input
                    type="range"
                    min={IMAR_KAKS_SLIDER.min}
                    max={IMAR_KAKS_SLIDER.max}
                    step={IMAR_KAKS_SLIDER.step}
                    value={kVal}
                    onChange={(e) => setField("kaks", Number(e.target.value).toFixed(2))}
                    className="h-2 w-full cursor-pointer accent-[#a855f7]"
                    aria-label="KAKS"
                  />
                  <Input
                    value={form.kaks}
                    onChange={(e) => setField("kaks", e.target.value)}
                    inputMode="decimal"
                    className="tool-input h-11 text-foreground dark:text-white font-mono font-bold text-center"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <p className={cn(imarMonoFont.className, "mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300")}>
                  Bodrum Kat Sayısı
                </p>
                <Select value={form.basementCount} onValueChange={(v) => setField("basementCount", v)}>
                  <SelectTrigger className="tool-input h-12 text-foreground dark:text-white font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card dark:bg-[#16132e] border-border dark:border-white/15 text-foreground dark:text-white">
                    {IMAR_BASEMENT_COUNT_OPTIONS.map((c) => (
                      <SelectItem key={c} value={String(c)}>{c} Bodrum Kat</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Detailed Setbacks Toggle */}
            <div className="mt-6 rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
              <button
                type="button"
                onClick={() => setDetailed((v) => !v)}
                className={cn(imarMonoFont.className, "flex w-full items-center justify-between text-xs font-bold uppercase tracking-wider text-purple-400 hover:text-purple-300")}
              >
                <span>▸ Çekme Mesafeleri ve Parsel Boyutları</span>
                <span className="rounded-lg bg-purple-500/20 px-2 py-0.5 text-[10px]">{detailed ? "Açık" : "Kapalı"}</span>
              </button>
              {detailed && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Input value={form.parcelWidthM} onChange={(e) => setField("parcelWidthM", e.target.value)} placeholder="Parsel eni [m]" inputMode="decimal" className="tool-input h-11" />
                  <Input value={form.parcelDepthM} onChange={(e) => setField("parcelDepthM", e.target.value)} placeholder="Parsel derinliği [m]" inputMode="decimal" className="tool-input h-11" />
                  <Input value={form.frontSetbackM} onChange={(e) => setField("frontSetbackM", e.target.value)} placeholder="Ön çekme [m]" inputMode="decimal" className="tool-input h-11" />
                  <Input value={form.rearSetbackM} onChange={(e) => setField("rearSetbackM", e.target.value)} placeholder="Arka çekme [m]" inputMode="decimal" className="tool-input h-11" />
                  <div className="sm:col-span-2">
                    <Input value={form.sideSetbackM} onChange={(e) => setField("sideSetbackM", e.target.value)} placeholder="Yan çekme [m]" inputMode="decimal" className="tool-input h-11" />
                  </div>
                </div>
              )}
              <p className="mt-4 text-xs text-muted-foreground dark:text-zinc-400">{IMAR_DETAIL_HELP}</p>
            </div>

            <Button
              type="button"
              onClick={() => { setLive(form); setCalculated(true); }}
              className="mt-6 h-12 w-full rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500 text-sm font-bold uppercase tracking-wider text-white shadow-[0_0_25px_rgba(139,92,246,0.4)] active:scale-98"
            >
              İmar Hesabını Çalıştır
            </Button>
          </section>

          {/* Results Section */}
          <section aria-live="polite" className="flex flex-col gap-6">
            {!calculated ? (
              <div className="tool-panel flex min-h-[300px] flex-col items-center justify-center rounded-[32px] p-6 text-center">
                <Calculator className="h-10 w-10 text-purple-400 mb-3 opacity-60" />
                <p className={cn(imarDisplayFont.className, "text-2xl font-black tracking-tight text-foreground dark:text-white")}>Girdileri Belirleyin</p>
                <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground dark:text-zinc-300">
                  Arsa alanı ve emsal katsayılarını girdikten sonra &apos;İmar Hesabını Çalıştır&apos; butonuna tıklayın.
                </p>
              </div>
            ) : error ? (
              <div className="rounded-[32px] border border-red-500/30 bg-red-500/10 p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-red-400" />
                  <div>
                    <p className={cn(imarDisplayFont.className, "text-xl font-black text-red-200")}>Hesap Üretilemedi</p>
                    <p className="mt-2 text-sm text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            ) : result ? (
              <>
                <div className="tool-result-panel overflow-hidden rounded-[32px] p-6 sm:p-8 text-white">
                  <div className="mb-6 flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                      <p className={cn(imarMonoFont.className, "text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-200")}>Sonuç Özeti</p>
                      <h2 className={cn(imarDisplayFont.className, "mt-1 text-2xl sm:text-3xl font-black tracking-tight text-white")}>Yapılaşma Özeti</h2>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3 text-purple-200">
                      <Calculator className="h-5 w-5" />
                    </div>
                  </div>

                  <div className={cn(imarMonoFont.className, "inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]", result.statusTone === "ok" ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300" : result.statusTone === "warn" ? "border-amber-500/40 bg-amber-500/20 text-amber-300" : "border-red-500/40 bg-red-500/20 text-red-300")}>
                    {result.statusLabel}
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className={cn(imarMonoFont.className, "text-[11px] uppercase tracking-wider text-zinc-400")}>Taban Alanı</p>
                      <p className={cn(imarMonoFont.className, "mt-2 text-3xl font-black text-white drop-shadow-[0_0_15px_rgba(192,132,252,0.3)]")}>{fmt(result.maxGroundAreaM2)}</p>
                      <p className={cn(imarMonoFont.className, "text-xs text-purple-300")}>m²</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className={cn(imarMonoFont.className, "text-[11px] uppercase tracking-wider text-zinc-400")}>Toplam İnşaat</p>
                      <p className={cn(imarMonoFont.className, "mt-2 text-3xl font-black text-purple-200")}>{fmt(result.totalConstructionAreaM2)}</p>
                      <p className={cn(imarMonoFont.className, "text-xs text-purple-300")}>m²</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className={cn(imarMonoFont.className, "text-[11px] uppercase tracking-wider text-zinc-400")}>Kat Sayısı</p>
                      <p className={cn(imarMonoFont.className, "mt-2 text-3xl font-black text-emerald-300")}>{result.safeNormalFloorCount}</p>
                      <p className={cn(imarMonoFont.className, "text-xs text-zinc-400")}>normal kat</p>
                    </div>
                  </div>

                  <p className="mt-6 text-xs sm:text-sm leading-relaxed text-zinc-300">
                    Yaklaşık {fmt(result.maxGroundAreaM2)} m² taban oturumu, {result.safeNormalFloorCount} normal kat ve bodrum dahil {result.totalFloorCount} katlık ön fizibilite özeti üretildi.
                  </p>

                  <div className="tool-result-inner mt-6 rounded-2xl p-5">
                    <div className="flex justify-between border-b border-white/10 py-2.5 text-xs sm:text-sm">
                      <span className={cn(imarMonoFont.className, "text-zinc-400")}>Net Arsa</span>
                      <span className={cn(imarMonoFont.className, "text-white font-bold")}>{fmt(result.netParcelAreaM2)} m²</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 py-2.5 text-xs sm:text-sm">
                      <span className={cn(imarMonoFont.className, "text-zinc-400")}>Boş Alan</span>
                      <span className={cn(imarMonoFont.className, "text-emerald-300 font-bold")}>{fmt(result.openAreaM2)} m²</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 py-2.5 text-xs sm:text-sm">
                      <span className={cn(imarMonoFont.className, "text-zinc-400")}>Teorik Kat</span>
                      <span className={cn(imarMonoFont.className, "text-purple-300 font-bold")}>{fmt(result.theoreticalFloorEquivalent)}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 py-2.5 text-xs sm:text-sm">
                      <span className={cn(imarMonoFont.className, "text-zinc-400")}>Bodrum Dahil Kat</span>
                      <span className={cn(imarMonoFont.className, "text-white font-bold")}>{result.totalFloorCount} kat</span>
                    </div>
                    <div className="flex justify-between py-2.5 text-xs sm:text-sm">
                      <span className={cn(imarMonoFont.className, "text-zinc-400")}>Tahmini Yükseklik</span>
                      <span className={cn(imarMonoFont.className, "text-purple-200 font-bold")}>{fmt(result.buildingHeightM)} m</span>
                    </div>
                  </div>

                  {/* Governing Check */}
                  <div className="mt-4">
                    <GoverningCheckCard
                      label="İmar Taban Alanı ve Emsal Oturumu Tahkiki"
                      demand={Number(result.maxGroundAreaM2.toFixed(1))}
                      capacity={Number((parsed.input ? parsed.input.grossParcelAreaM2 * parsed.input.taks : result.maxGroundAreaM2).toFixed(1))}
                      unit="m²"
                      status="ok"
                      explanation={`Net arsa ${fmt(result.netParcelAreaM2)} m² için TAKS taban oturumu = ${fmt(result.maxGroundAreaM2)} m² (%${fmt(result.coverageRatio * 100)}), KAKS toplam emsal inşaat alanı = ${fmt(result.totalConstructionAreaM2)} m² (${fmt(result.theoreticalFloorEquivalent)} teorik kat).`}
                    />
                  </div>
                </div>

                {/* Plot & Formulas Grid */}
                <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="tool-panel rounded-[32px] p-6">
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div>
                        <p className={cn(imarMonoFont.className, "text-[11px] uppercase tracking-wider text-muted-foreground dark:text-zinc-400")}>Arsa Şeması</p>
                        <h2 className={cn(imarDisplayFont.className, "mt-1 text-xl font-black tracking-tight text-foreground dark:text-white")}>Taban Oranı</h2>
                      </div>
                      <div className="rounded-2xl bg-purple-500/15 border border-purple-500/30 p-2.5 text-purple-400">
                        <MapPinned className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="flex justify-center rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                      <svg viewBox="0 0 240 240" className="h-56 w-56">
                        <rect x="20" y="20" width="200" height="200" rx="20" fill="currentColor" className="text-zinc-800/20 dark:text-white/5" stroke="#6366f1" strokeWidth="1.5" />
                        <rect x={120 - fill / 2} y={120 - fill / 2} width={fill} height={fill} rx="14" fill="rgba(168, 85, 247, 0.35)" stroke="#c084fc" strokeWidth="2" style={{ transition: "all 320ms ease" }} />
                        <text x="120" y="116" textAnchor="middle" fontSize="18" fill="currentColor" className="text-foreground dark:text-white font-bold">%{fmt(result.coverageRatio * 100)}</text>
                        <text x="120" y="138" textAnchor="middle" fontSize="11" fill="currentColor" className="text-muted-foreground dark:text-purple-300 font-medium">TAKS Oturumu</text>
                      </svg>
                    </div>
                  </div>

                  <div className="tool-panel rounded-[32px] p-6">
                    <p className={cn(imarMonoFont.className, "text-[11px] uppercase tracking-wider text-muted-foreground dark:text-zinc-400")}>Formüller</p>
                    <div className="tool-formula-card mt-3 rounded-2xl p-4">
                      <div className={cn(imarMonoFont.className, "space-y-2 text-xs leading-relaxed text-zinc-100")}>
                        {lines.map((line) => <div key={line}>{line}</div>)}
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      {result.warnings.map((w) => (
                        <div key={w.message} className={cn("rounded-xl border p-3 text-xs leading-relaxed", w.tone === "fail" ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-purple-500/30 bg-purple-500/10 text-purple-200")}>
                          {w.message}
                        </div>
                      ))}
                      {result.warnings.length === 0 && (
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                          Girdi seti emsale göre tutarlı bir ön değerlendirme veriyor.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Advanced Estimation Promo */}
                <div className="rounded-[32px] border border-purple-500/30 bg-gradient-to-br from-[#1c1540] via-[#120e2c] to-[#0a0818] p-6 sm:p-8 text-white shadow-xl backdrop-blur-2xl">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 shadow-xl">
                      <Building className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-300">Gelişmiş Değerlendirme</p>
                      <h3 className={cn(imarDisplayFont.className, "mt-1 text-xl font-black tracking-tight text-white")}>Tahmini İnşaat Alanı Analizi Yapın</h3>
                      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-300">
                        Bu imar parametrelerine göre otopark, sığınak, asansör ve ortak alan kayıplarını netleştirip satılabilir / kiralanabilir bağımsız bölüm oranlarını öğrenmek için gelişmiş analiz modülünü kullanın.
                      </p>
                      <Button asChild className="mt-4 h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] hover:scale-[1.02] transition-all">
                        <Link href="/hesaplamalar/tahmini-insaat-alani">
                          Tahmini İnşaat Alanı Aracı
                          <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </section>
        </div>

        {/* Tool Limitations & Normative Bounds */}
        <div className="mt-8">
          <ToolLimitations
            scope={[
              "3194 Sayılı İmar Kanunu ve Planlı Alanlar İmar Yönetmeliği uyarınca TAKS, KAKS/Emsal ve çekme mesafelerine göre taban alanı ve kat adedi hesabı",
              "Ön, arka ve yan bahçe çekmeleri ile net yapı oturum alanı sınırının geometrik tahkiki",
              "Bodrum kat dahil toplam inşaat alanı ve teorik kat yüksekliği hesabı"
            ]}
            limitations={[
              "Yerel belediye imar planı notları, gabari/Hmax sınırlamaları ve saçak seviyesi kararları yerel imar durum belgesiyle doğrulanmalıdır",
              "Emsal harici alanlar (%30 ortak alan istisnası, sığınak, yangın merdiveni, otopark) için 'Tahmini İnşaat Alanı' modülü kullanılmalıdır",
              "Yola terk, ihdas veya kamulaştırma kesintileri haritacı aplikasyon krokisi ile netleştirilmelidir"
            ]}
            inputProvenance="3194 Sayılı İmar Kanunu ve Çevre, Şehircilik ve İklim Değişikliği Bakanlığı Planlı Alanlar İmar Yönetmeliği"
            defaultOpen={false}
          />
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground dark:text-zinc-500">
          {IMAR_PAGE_NOTE} · 3194 Sayılı İmar Kanunu
        </div>
      </div>
    </div>
  );
}
