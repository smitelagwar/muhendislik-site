"use client";

import React, { useRef } from "react";
import { ConstructionCostResultV3 } from "@/lib/calculations/modules/insaat-maliyeti-v3";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  Tooltip as RechartsTooltip, Legend,
} from "recharts";
import {
  RotateCcw, Printer, FileText,
  TrendingDown, TrendingUp, Building2, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ResultDashboardProps {
  result: ConstructionCostResultV3;
  onReset: () => void;
}

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#64748b"];

const STRUCTURE_LABELS: Record<string, string> = {
  apartman: "Apartman / Site",
  villa: "Villa / Müstakil",
  ofis: "Ofis / AVM",
  endustriyel: "Endüstriyel",
};

const QUALITY_LABELS: Record<string, string> = {
  ekonomik: "Ekonomik",
  standart: "Standart",
  luks: "Lüks",
};

const SOIL_LABELS: Record<string, string> = {
  iyi: "İyi Zemin",
  orta: "Orta Zemin",
  kotu: "Kötü Zemin",
};

const FACADE_LABELS: Record<string, string> = {
  klasik: "Klasik Sıva",
  kompozit: "Kompozit Panel",
  cam_giydirme: "Cam Giydirme",
};

function formatTL(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function ResultDashboard({ result, onReset }: ResultDashboardProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { inputs, categories, macroMaterials, grandTotal, costPerM2, optimistic, pessimistic, assumptions, cityLabel } = result;

  const chartData = categories.map((cat, i) => ({
    name: cat.label,
    value: cat.total,
    color: COLORS[i % COLORS.length],
  }));

  const handlePrint = () => window.print();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <p className="font-semibold text-slate-900 dark:text-slate-100">{payload[0].name}</p>
          <p className="font-mono text-amber-600 dark:text-amber-400">{formatTL(payload[0].value)}</p>
          <p className="text-xs text-slate-500">%{((payload[0].value / grandTotal) * 100).toFixed(1)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* ── Print CSS — only activates on window.print() ── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #pdf-content, #pdf-content * { visibility: visible !important; }
          #pdf-content { position: absolute; inset: 0; background: white; color: black; padding: 24px; }
          .no-print { display: none !important; }
          .print-page-break { page-break-before: always; }
        }
      `}</style>

      <div id="pdf-content" ref={printRef} className="mx-auto w-full max-w-5xl animate-in fade-in zoom-in-95 duration-500">
        {/* ── Action Bar ── */}
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Hesaplama Sonucu</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {formatDate(result.generatedAt)} • Tahmini değerdir
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onReset}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RotateCcw className="h-4 w-4" /> Yeni Hesap
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              <Printer className="h-4 w-4" /> PDF / Yazdır
            </button>
          </div>
        </div>

        {/* ── Print Header (only shows on print) ── */}
        <div className="hidden print:block mb-6 border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold">İNŞAAT MALİYETİ ANALİZİ</h1>
              <p className="text-sm text-gray-500">{formatDate(result.generatedAt)}</p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>muhendislik-site.vercel.app</p>
              <p>Ön Boyutlandırma Amaçlıdır</p>
            </div>
          </div>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid gap-5 lg:grid-cols-3">

          {/* ─ Left Column ─ */}
          <div className="flex flex-col gap-5 lg:col-span-1">

            {/* Grand Total */}
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-lg dark:border-amber-900/40 dark:from-amber-950/30 dark:to-slate-900">
              <div className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500">
                TOPLAM YAKLAŞIK MALİYET
              </div>
              <div className="mt-2 font-mono text-4xl font-extrabold leading-none text-slate-900 dark:text-white">
                {formatTL(grandTotal)}
              </div>
              <div className="mt-1 font-mono text-base text-slate-600 dark:text-slate-400">
                {formatTL(costPerM2)} / m²
              </div>

              {/* Range */}
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-amber-200/60 pt-4 dark:border-slate-700">
                <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-950/30">
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                    <TrendingDown className="h-3 w-3" /> İyimser
                  </div>
                  <div className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    {formatTL(optimistic)}
                  </div>
                </div>
                <div className="rounded-lg bg-red-50 p-2 dark:bg-red-950/30">
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-red-600 dark:text-red-400">
                    <TrendingUp className="h-3 w-3" /> Kötümser
                  </div>
                  <div className="font-mono text-sm font-bold text-red-600 dark:text-red-400">
                    {formatTL(pessimistic)}
                  </div>
                </div>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Maliyet Dağılımı
              </h3>
              <div className="flex flex-col items-center">
                <PieChart width={240} height={200}>
                  <Pie data={chartData} cx={120} cy={90} innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
                {/* Legend */}
                <div className="mt-2 w-full space-y-1.5">
                  {chartData.map((entry, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="text-slate-600 dark:text-slate-400">{entry.name}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        %{((entry.value / grandTotal) * 100).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Project Summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Building2 className="h-3.5 w-3.5" /> Proje Özeti
              </h3>
              <dl className="space-y-2 text-sm">
                {[
                  { label: "Yapı Türü",   value: STRUCTURE_LABELS[inputs.structureKind] ?? inputs.structureKind },
                  { label: "Brüt Alan",   value: `${inputs.totalArea.toLocaleString("tr-TR")} m²` },
                  { label: "Kat Sayısı",  value: `${inputs.floorCount} kat (${inputs.basementFloors} bodrum)` },
                  { label: "Bölge",       value: cityLabel },
                  { label: "Zemin",       value: SOIL_LABELS[inputs.soilClass] },
                  { label: "Kalite",      value: QUALITY_LABELS[inputs.qualityLevel] },
                  { label: "Cephe",       value: FACADE_LABELS[inputs.facadeType] },
                  { label: "Asansör",     value: inputs.hasElevator ? `${inputs.elevatorCount} adet` : "Yok" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between gap-2 border-b border-slate-100 pb-1.5 last:border-0 dark:border-slate-800">
                    <dt className="text-slate-500 dark:text-slate-400">{row.label}</dt>
                    <dd className="font-semibold text-slate-800 dark:text-slate-200">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* ─ Right Column ─ */}
          <div className="flex flex-col gap-5 lg:col-span-2">

            {/* Cost Breakdown */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Detaylı Maliyet Kırılımı
                </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {categories.map((cat, idx) => (
                  <div key={cat.id} className="group px-6 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="h-3.5 w-3.5 shrink-0 rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{cat.label}</div>
                          <div className="truncate text-xs text-slate-500 dark:text-slate-400">{cat.description}</div>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {formatTL(cat.total)}
                        </div>
                        <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                          %{(cat.share * 100).toFixed(1)}
                        </div>
                      </div>
                    </div>
                    {/* Share bar */}
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${cat.share * 100}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                    </div>
                  </div>
                ))}
                {/* Total row */}
                <div className="bg-slate-50 px-6 py-4 dark:bg-slate-950">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-900 dark:text-slate-100">TOPLAM</div>
                    <div className="font-mono text-xl font-extrabold text-amber-600 dark:text-amber-400">
                      {formatTL(grandTotal)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Macro Materials */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Beton", value: `${macroMaterials.concreteM3} m³`, sub: formatTL(macroMaterials.concreteCost), color: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900/40", textColor: "text-blue-700 dark:text-blue-400" },
                { label: "Demir", value: `${macroMaterials.ironTon} Ton`, sub: formatTL(macroMaterials.ironCost), color: "bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700", textColor: "text-slate-700 dark:text-slate-300" },
                { label: "Tuğla/Duvar", value: `${macroMaterials.brickM2} m²`, sub: formatTL(macroMaterials.brickCost), color: "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900/40", textColor: "text-orange-700 dark:text-orange-400" },
              ].map((m) => (
                <div key={m.label} className={cn("rounded-xl border p-4", m.color)}>
                  <div className={cn("text-xs font-bold uppercase tracking-wider", m.textColor)}>{m.label}</div>
                  <div className={cn("mt-1 text-xl font-extrabold", m.textColor)}>{m.value}</div>
                  <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Assumptions */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Varsayımlar ve Notlar
                </h4>
              </div>
              <ul className="space-y-1.5">
                {assumptions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300/80">
                    <span className="mt-0.5 shrink-0 text-amber-500">•</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* ── Print Footer ── */}
        <div className="mt-6 hidden border-t pt-4 text-center text-xs text-gray-400 print:block">
          Bu rapor muhendislik-site.vercel.app tarafından otomatik üretilmiştir. Ön boyutlandırma amaçlıdır; kesin teklif için müteahhit ile iletişime geçiniz.
        </div>
      </div>
    </>
  );
}
