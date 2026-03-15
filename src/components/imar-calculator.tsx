"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Calculator, Info, MapPinned } from "lucide-react";
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
import { TOOLS_HUB_HREF } from "@/lib/tools-data";
import { cn } from "@/lib/utils";

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
  useEffect(() => { if (!calculated) return; const id = window.setTimeout(() => setLive(form), 300); return () => window.clearTimeout(id); }, [form, calculated]);
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

  return <div className={cn(imarBodyFont.className, "tool-page-shell py-8 md:py-14")}>
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="mb-8"><Link href={TOOLS_HUB_HREF} className={cn(imarMonoFont.className, "inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/85 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-300")}><ArrowLeft className="h-3.5 w-3.5" />Tüm araçlar</Link></div>
      <section className="mb-8 rounded-[32px] border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/75 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div><Badge className="mb-4 rounded-full bg-blue-100 px-4 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-blue-800 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300">İmar aracı</Badge><h1 className={cn(imarDisplayFont.className, "text-4xl font-black tracking-tight text-zinc-950 dark:text-white md:text-6xl")}>İmar hesaplayıcı</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">Arsa alanı, TAKS, KAKS ve çekmelere göre taban alanı, kat karşılığı ve yaklaşık yükseklik için hızlı ön değerlendirme alın.</p></div>
          <div className="flex items-center gap-3"><Badge className="rounded-full bg-zinc-950 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-100 hover:bg-zinc-950 dark:bg-zinc-900">3194 Sayılı İmar Kanunu</Badge><Dialog><DialogTrigger asChild><Button type="button" variant="outline" className="rounded-full px-4 text-[11px] font-black uppercase tracking-[0.16em]"><Info className="h-3.5 w-3.5" />Mevzuat notları</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>İmar kuralları</DialogTitle><DialogDescription>{IMAR_REGULATION_GUIDE_INTRO}</DialogDescription></DialogHeader><div className="space-y-3">{IMAR_REGULATION_GUIDE_RULES.map((r, i) => <div key={r} className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 text-sm leading-6 dark:border-zinc-800 dark:bg-zinc-900/80"><span className="mr-2 font-black text-blue-700 dark:text-blue-300">{i + 1}.</span>{r}</div>)}</div><DialogFooter className="border-t border-zinc-200/80 pt-4 dark:border-zinc-800"><p className="mr-auto text-sm leading-6 text-zinc-600 dark:text-zinc-400">{IMAR_REGULATION_GUIDE_NOTE}</p></DialogFooter></DialogContent></Dialog></div>
        </div>
      </section>
      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <section className="rounded-[32px] border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/75">
          <div className="mb-6 flex items-start justify-between gap-4"><div><p className={cn(imarMonoFont.className, "text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400")}>Girdi bilgileri</p><h2 className={cn(imarDisplayFont.className, "mt-2 text-3xl font-black tracking-tight text-zinc-950 dark:text-white")}>Arsa ve katsayılar</h2></div><div className="rounded-2xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"><Calculator className="h-5 w-5" /></div></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><p className={cn(imarMonoFont.className, "mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500")}>Arsa alanı <span className="text-blue-700 dark:text-blue-300">[m²]</span></p><Input value={form.grossParcelAreaM2} onChange={(e) => setField("grossParcelAreaM2", e.target.value)} inputMode="decimal" className="tool-input h-12" /></div>
            <div className="sm:col-span-2 rounded-[28px] border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80"><p className={cn(imarMonoFont.className, "mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500")}>TAKS <span className="text-blue-700 dark:text-blue-300">[katsayı]</span></p><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_104px]"><input type="range" min={IMAR_TAKS_SLIDER.min} max={IMAR_TAKS_SLIDER.max} step={IMAR_TAKS_SLIDER.step} value={tVal} onChange={(e) => setField("taks", Number(e.target.value).toFixed(2))} className="h-2 w-full cursor-pointer accent-[#2563eb]" aria-label="TAKS" /><Input value={form.taks} onChange={(e) => setField("taks", e.target.value)} inputMode="decimal" className="tool-input h-11" /></div></div>
            <div className="sm:col-span-2 rounded-[28px] border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80"><p className={cn(imarMonoFont.className, "mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500")}>KAKS / emsal <span className="text-blue-700 dark:text-blue-300">[katsayı]</span></p><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_104px]"><input type="range" min={IMAR_KAKS_SLIDER.min} max={IMAR_KAKS_SLIDER.max} step={IMAR_KAKS_SLIDER.step} value={kVal} onChange={(e) => setField("kaks", Number(e.target.value).toFixed(2))} className="h-2 w-full cursor-pointer accent-[#2563eb]" aria-label="KAKS" /><Input value={form.kaks} onChange={(e) => setField("kaks", e.target.value)} inputMode="decimal" className="tool-input h-11" /></div></div>
            <div className="sm:col-span-2"><p className={cn(imarMonoFont.className, "mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500")}>Bodrum kat sayısı</p><Select value={form.basementCount} onValueChange={(v) => setField("basementCount", v)}><SelectTrigger className="h-12 rounded-none"><SelectValue /></SelectTrigger><SelectContent>{IMAR_BASEMENT_COUNT_OPTIONS.map((c) => <SelectItem key={c} value={String(c)}>{c}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="mt-6 rounded-[28px] border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80"><button type="button" onClick={() => setDetailed((v) => !v)} className={cn(imarMonoFont.className, "flex w-full items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500")}><span>▸ Detaylı giriş</span><span>{detailed ? "Açık" : "Kapalı"}</span></button>{detailed ? <div className="mt-5 grid gap-4 sm:grid-cols-2"><Input value={form.parcelWidthM} onChange={(e) => setField("parcelWidthM", e.target.value)} placeholder="Parsel eni [m]" inputMode="decimal" className="h-11 rounded-none" /><Input value={form.parcelDepthM} onChange={(e) => setField("parcelDepthM", e.target.value)} placeholder="Parsel derinliği [m]" inputMode="decimal" className="h-11 rounded-none" /><Input value={form.frontSetbackM} onChange={(e) => setField("frontSetbackM", e.target.value)} placeholder="Ön çekme [m]" inputMode="decimal" className="h-11 rounded-none" /><Input value={form.rearSetbackM} onChange={(e) => setField("rearSetbackM", e.target.value)} placeholder="Arka çekme [m]" inputMode="decimal" className="h-11 rounded-none" /><div className="sm:col-span-2"><Input value={form.sideSetbackM} onChange={(e) => setField("sideSetbackM", e.target.value)} placeholder="Yan çekme [m]" inputMode="decimal" className="h-11 rounded-none" /></div></div> : null}<p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{IMAR_DETAIL_HELP}</p></div>
          <Button type="button" onClick={() => { setLive(form); setCalculated(true); }} className="mt-6 h-12 w-full rounded-2xl bg-blue-700 text-sm font-black uppercase tracking-[0.14em] text-white hover:bg-blue-800">Hesapla</Button>
        </section>
        <section aria-live="polite" className="flex flex-col gap-6">{!calculated ? <div className="tool-panel rounded-[32px] p-6"><p className={cn(imarDisplayFont.className, "text-3xl font-black tracking-tight text-zinc-950 dark:text-white")}>← Verileri girin</p><p className="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-400">İlk hesaplamadan sonra sonuç kartları açılır. Sonraki değişiklikler kısa gecikmeyle yenilenir.</p></div> : error ? <div className="rounded-[32px] border border-red-200 bg-red-50/90 p-6 shadow-sm dark:border-red-950/60 dark:bg-red-950/20"><div className="flex items-start gap-3"><AlertTriangle className="mt-1 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-300" /><div><p className={cn(imarDisplayFont.className, "text-2xl font-black tracking-tight text-red-950 dark:text-red-100")}>Hesap üretilemedi</p><p className="mt-3 text-sm leading-7 text-red-900 dark:text-red-100">{error}</p></div></div></div> : result ? <><div className="tool-result-panel overflow-hidden rounded-[32px] p-6 text-white"><div className="mb-6 flex items-start justify-between gap-4"><div><p className={cn(imarMonoFont.className, "text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-200/80")}>Sonuç özeti</p><h2 className={cn(imarDisplayFont.className, "mt-2 text-3xl font-black tracking-tight text-white")}>Yapılaşma özeti</h2></div><div className="rounded-2xl bg-white/10 p-3 text-sky-200"><Calculator className="h-5 w-5" /></div></div><div className={cn(imarMonoFont.className, "inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]", result.statusTone === "ok" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : result.statusTone === "warn" ? "border-blue-400/30 bg-blue-500/10 text-blue-200" : "border-red-500/30 bg-red-500/10 text-red-200")}>{result.statusLabel}</div><div className="mt-6 grid gap-4 md:grid-cols-3"><div className="rounded-[24px] border border-white/10 bg-white/5 p-4"><p className={cn(imarMonoFont.className, "text-[11px] uppercase tracking-[0.18em] text-zinc-400")}>Taban alanı</p><p className={cn(imarMonoFont.className, "mt-3 text-4xl font-black text-sky-200")}>{fmt(result.maxGroundAreaM2)}</p><p className={cn(imarMonoFont.className, "text-xs text-zinc-500")}>m²</p></div><div className="rounded-[24px] border border-white/10 bg-white/5 p-4"><p className={cn(imarMonoFont.className, "text-[11px] uppercase tracking-[0.18em] text-zinc-400")}>Toplam inşaat</p><p className={cn(imarMonoFont.className, "mt-3 text-4xl font-black text-sky-200")}>{fmt(result.totalConstructionAreaM2)}</p><p className={cn(imarMonoFont.className, "text-xs text-zinc-500")}>m²</p></div><div className="rounded-[24px] border border-white/10 bg-white/5 p-4"><p className={cn(imarMonoFont.className, "text-[11px] uppercase tracking-[0.18em] text-zinc-400")}>Kat sayısı</p><p className={cn(imarMonoFont.className, "mt-3 text-4xl font-black text-emerald-200")}>{result.safeNormalFloorCount}</p><p className={cn(imarMonoFont.className, "text-xs text-zinc-500")}>normal kat</p></div></div><p className="mt-6 text-sm leading-7 text-zinc-300">Yaklaşık {fmt(result.maxGroundAreaM2)} m² taban oturumu, {result.safeNormalFloorCount} normal kat ve bodrum dahil {result.totalFloorCount} katlık ön fizibilite özeti üretildi.</p><div className="tool-result-inner mt-6 rounded-[24px] p-5"><div className="flex justify-between border-b border-white/10 py-3 text-sm"><span className={cn(imarMonoFont.className, "text-zinc-400")}>Net arsa</span><span className={cn(imarMonoFont.className, "text-sky-200")}>{fmt(result.netParcelAreaM2)} m²</span></div><div className="flex justify-between border-b border-white/10 py-3 text-sm"><span className={cn(imarMonoFont.className, "text-zinc-400")}>Boş alan</span><span className={cn(imarMonoFont.className, "text-emerald-300")}>{fmt(result.openAreaM2)} m²</span></div><div className="flex justify-between border-b border-white/10 py-3 text-sm"><span className={cn(imarMonoFont.className, "text-zinc-400")}>Teorik kat</span><span className={cn(imarMonoFont.className, "text-sky-200")}>{fmt(result.theoreticalFloorEquivalent)}</span></div><div className="flex justify-between border-b border-white/10 py-3 text-sm"><span className={cn(imarMonoFont.className, "text-zinc-400")}>Bodrum dahil kat</span><span className={cn(imarMonoFont.className, "text-sky-200")}>{result.totalFloorCount} kat</span></div><div className="flex justify-between py-3 text-sm"><span className={cn(imarMonoFont.className, "text-zinc-400")}>Tahmini yükseklik</span><span className={cn(imarMonoFont.className, "text-sky-200")}>{fmt(result.buildingHeightM)} m</span></div></div></div><div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"><div className="tool-panel rounded-[32px] p-6"><div className="mb-5 flex items-start justify-between gap-4"><div><p className={cn(imarMonoFont.className, "text-[11px] uppercase tracking-[0.2em] text-zinc-400")}>Arsa şeması</p><h2 className={cn(imarDisplayFont.className, "mt-2 text-3xl font-black tracking-tight text-zinc-950 dark:text-white")}>Taban oranı</h2></div><div className="rounded-2xl bg-sky-100 p-3 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300"><MapPinned className="h-5 w-5" /></div></div><div className="flex justify-center rounded-[28px] border border-zinc-200/80 bg-zinc-50/90 p-4 dark:border-zinc-800 dark:bg-zinc-900/80"><svg viewBox="0 0 240 240" className="h-60 w-60"><rect x="20" y="20" width="200" height="200" rx="20" fill="#111827" opacity="0.08" stroke="#64748b" strokeWidth="2" /><rect x={120 - fill / 2} y={120 - fill / 2} width={fill} height={fill} rx="14" fill="rgba(59,130,246,0.32)" stroke="#2563eb" strokeWidth="2" style={{ transition: "all 320ms ease" }} /><text x="120" y="116" textAnchor="middle" fontSize="18" fill="#0f172a" fontWeight="700">%{fmt(result.coverageRatio * 100)}</text><text x="120" y="138" textAnchor="middle" fontSize="11" fill="#0f172a" fontWeight="700">TAKS oturumu</text></svg></div></div><div className="tool-panel rounded-[32px] p-6"><p className={cn(imarMonoFont.className, "text-[11px] uppercase tracking-[0.2em] text-zinc-400")}>Formüller</p><div className="tool-formula-card mt-4 rounded-[28px] p-4"><div className={cn(imarMonoFont.className, "space-y-2 text-sm leading-6 text-zinc-100")}>{lines.map((line) => <div key={line}>{line}</div>)}</div></div><div className="mt-5 space-y-3">{result.warnings.map((w) => <div key={w.message} className={cn("rounded-2xl border p-4 text-sm leading-6", w.tone === "fail" ? "border-red-200 bg-red-50 text-red-900 dark:border-red-950/60 dark:bg-red-950/20 dark:text-red-100" : "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-950/60 dark:bg-blue-950/20 dark:text-blue-100")}>{w.message}</div>)}{result.warnings.length === 0 ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900 dark:border-emerald-950/60 dark:bg-emerald-950/20 dark:text-emerald-100">Girdi seti emsale göre tutarlı bir ön değerlendirme veriyor.</div> : null}{result.notes.map((n) => <div key={n} className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 text-sm leading-6 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300">{n}</div>)}</div></div></div></> : null}</section>
      </div>
      <div className="mt-8 text-center text-xs text-zinc-500 dark:text-zinc-500">{IMAR_PAGE_NOTE} · 3194 Sayılı İmar Kanunu</div>
    </div>
  </div>;
}
