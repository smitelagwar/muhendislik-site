"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ConstructionCostResultV3 } from "@/lib/calculations/modules/insaat-maliyeti-v3";
import type { PdfChartSlice, PdfExportSnapshot } from "@/lib/calculations/reporting";
import {
  PieChart, Pie, Cell,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  RotateCcw, Printer, Download, Eye, Image as ImageIcon, Loader2,
  TrendingDown, TrendingUp, Building2, AlertCircle, Sparkles,
  ArrowRight, Layers, Calendar, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

async function loadReportingModule() {
  return import("@/lib/calculations/reporting");
}

interface ResultDashboardProps {
  result: ConstructionCostResultV3;
  onReset: () => void;
}

const COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"];
type ExportAction = "pdf-preview" | "pdf-download" | "image-preview" | "print" | null;
type ViewTab = "breakdown" | "phases" | "cashflow";

interface TooltipPayloadItem {
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

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

function buildChartSlices(result: ConstructionCostResultV3): PdfChartSlice[] {
  return result.categories.map((category, index) => ({
    label: category.label,
    value: category.total,
    percent: category.share * 100,
    color: COLORS[index % COLORS.length],
    description: category.description,
  }));
}

function buildV3PdfSnapshot(result: ConstructionCostResultV3): PdfExportSnapshot {
  const { inputs, categories, macroMaterials, grandTotal, costPerM2, optimistic, pessimistic, cityLabel } = result;

  return {
    variant: "calculation",
    title: "İnşaat Maliyeti Analiz Raporu",
    subtitle: `${cityLabel} • ${inputs.totalArea.toLocaleString("tr-TR")} m² • ${STRUCTURE_LABELS[inputs.structureKind] ?? inputs.structureKind}`,
    generatedAt: result.generatedAt,
    highlights: [
      {
        label: "Toplam Yaklaşık Maliyet",
        value: formatTL(grandTotal),
        helper: "KDV hariç 2026 piyasa tahmini",
        tone: "blue",
      },
      {
        label: "Birim Maliyet",
        value: `${formatTL(costPerM2)} / m²`,
        helper: "Brüt inşaat alanı başına",
        tone: "slate",
      },
      {
        label: "İyimser Senaryo",
        value: formatTL(optimistic),
        helper: "-%10 piyasa sapması",
        tone: "emerald",
      },
      {
        label: "Kötümser Senaryo",
        value: formatTL(pessimistic),
        helper: "+%15 piyasa sapması",
        tone: "amber",
      },
    ],
    sections: [
      {
        title: "Proje Parametreleri",
        rows: [
          { label: "Yapı Türü", value: STRUCTURE_LABELS[inputs.structureKind] ?? inputs.structureKind },
          { label: "Brüt İnşaat Alanı", value: `${inputs.totalArea.toLocaleString("tr-TR")} m²` },
          { label: "Toplam Kat Sayısı", value: `${inputs.floorCount} kat (${inputs.basementFloors} bodrum)` },
          { label: "Şehir / Bölge", value: cityLabel },
          { label: "Zemin Durumu", value: SOIL_LABELS[inputs.soilClass] ?? inputs.soilClass },
          { label: "Kalite Seviyesi", value: QUALITY_LABELS[inputs.qualityLevel] ?? inputs.qualityLevel },
          { label: "Cephe Tipi", value: FACADE_LABELS[inputs.facadeType] ?? inputs.facadeType },
          {
            label: "Asansör",
            value: inputs.hasElevator ? `Var (${inputs.elevatorCount} adet)` : "Yok",
          },
        ],
      },
      {
        title: "Ana Malzeme Metrajı",
        rows: [
          {
            label: "Hazır Beton (C30/37)",
            value: `${macroMaterials.concreteM3.toLocaleString("tr-TR")} m³ (~${formatTL(macroMaterials.concreteCost)})`,
          },
          {
            label: "İnşaat Demiri (B420C)",
            value: `${macroMaterials.ironTon.toLocaleString("tr-TR")} Ton (~${formatTL(macroMaterials.ironCost)})`,
          },
          {
            label: "Duvar / Tuğla / Bims",
            value: `${macroMaterials.brickM2.toLocaleString("tr-TR")} m² (~${formatTL(macroMaterials.brickCost)})`,
          },
        ],
      },
      {
        title: "12 Kalem Maliyet Dağılımı",
        rows: categories.map((cat) => ({
          label: `${cat.label} (%${(cat.share * 100).toFixed(1)})`,
          value: formatTL(cat.total),
        })),
      },
    ],
    chart: buildChartSlices(result),
    footnotes: [
      "Fiyatlar 2026 Türkiye inşaat piyasası malzeme ve işçilik ortalamalarına dayanmaktadır.",
      "KDV, arsa bedeli, proje müelliflik ücretleri ve resmî harçlar dahil değildir.",
      "Zemin iyileştirme, iksa, fore kazık vb. özel imalatlar bu hesaba dahil değildir.",
    ],
  };
}

function getPreviewErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.includes("popup")) {
    return "Önizleme penceresi açılamadı. Tarayıcınızda açılır pencerelere (pop-up) izin veriniz.";
  }
  return "PDF önizleme açılamadı. Lütfen tekrar deneyin.";
}

export function ResultDashboard({ result, onReset }: ResultDashboardProps) {
  const { inputs, categories, macroMaterials, grandTotal, costPerM2, optimistic, pessimistic, cityLabel, assumptions } = result;

  const [activeExportAction, setActiveExportAction] = useState<ExportAction>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<ViewTab>("breakdown");

  // Grouped Phases calculation
  const phaseKaba = categories
    .filter((c) => ["hafriyat", "temel", "betonarme", "kalip_demir", "duvar"].includes(c.id))
    .reduce((acc, c) => acc + c.total, 0);

  const phaseInce = categories
    .filter((c) => ["siva_boya", "yalitim", "kapi_pencere", "zemin_seramik", "cephe"].includes(c.id))
    .reduce((acc, c) => acc + c.total, 0);

  const phaseTesisat = categories
    .filter((c) => ["mekanik", "elektrik", "asansor"].includes(c.id))
    .reduce((acc, c) => acc + c.total, 0);

  const phaseGenel = categories
    .filter((c) => ["ruhsat_proje", "santiye_genel", "cevre_duzenleme"].includes(c.id))
    .reduce((acc, c) => acc + c.total, 0);

  const phases = [
    {
      title: "1. Kaba Yapı & Taşıyıcı İskelet",
      total: phaseKaba,
      share: phaseKaba / grandTotal,
      desc: "Hafriyat, temel, betonarme karkas, kalıp, demir ve duvar imalatları.",
      color: "#3b82f6",
    },
    {
      title: "2. İnce Yapı & Cephe Kaplama",
      total: phaseInce,
      share: phaseInce / grandTotal,
      desc: "İç-dış sıva, boya, su/ısı yalıtımı, kapı, pencere, seramik ve zemin.",
      color: "#8b5cf6",
    },
    {
      title: "3. Mekanik, Elektrik & Asansör",
      total: phaseTesisat,
      share: phaseTesisat / grandTotal,
      desc: "Sıhhi tesisat, ısıtma/soğutma, elektrik altyapısı ve dikey sirkülasyon.",
      color: "#06b6d4",
    },
    {
      title: "4. Şantiye Yönetimi & Genel Giderler",
      total: phaseGenel,
      share: phaseGenel / grandTotal,
      desc: "Ruhsat, proje müelliflikleri, şantiye mobilizasyonu ve çevre düzeni.",
      color: "#10b981",
    },
  ];

  // Cashflow quarters
  const quarters = [
    { name: "1. Çeyrek (Aylar 1-3)", percent: 30, desc: "Hafriyat, temel ve zemin kat kaba taşıyıcı", amount: grandTotal * 0.3 },
    { name: "2. Çeyrek (Aylar 4-7)", percent: 35, desc: "Normal katlar karkas, çatı ve duvar imalatları", amount: grandTotal * 0.35 },
    { name: "3. Çeyrek (Aylar 8-11)", percent: 25, desc: "İnce işler, cephe kaplama ve tesisat döşeme", amount: grandTotal * 0.25 },
    { name: "4. Çeyrek (Aylar 12-14)", percent: 10, desc: "Boya, vitrifiye, test-devreye alma ve kabul", amount: grandTotal * 0.1 },
  ];

  const chartData = categories.map((c, i) => ({
    name: c.label,
    value: c.total,
    color: COLORS[i % COLORS.length],
  }));

  const handlePdfPreview = async () => {
    if (activeExportAction) return;
    setActiveExportAction("pdf-preview");
    setExportError(null);
    try {
      const { openConstructionCostPdfPreview } = await loadReportingModule();
      openConstructionCostPdfPreview(buildV3PdfSnapshot(result));
    } catch (error) {
      console.error(error);
      setExportError(getPreviewErrorMessage(error));
    } finally {
      setActiveExportAction(null);
    }
  };

  const handleImagePreview = async () => {
    if (activeExportAction) return;
    setActiveExportAction("image-preview");
    setExportError(null);
    try {
      const { openConstructionCostImagePreview } = await loadReportingModule();
      openConstructionCostImagePreview(
        buildV3PdfSnapshot(result),
        `insaat-maliyeti-gorsel-${new Date().getFullYear()}.png`
      );
    } catch (error) {
      console.error(error);
      setExportError("Görsel önizleme açılamadı. Lütfen açılır pencere engelleyicisini kontrol edin.");
    } finally {
      setActiveExportAction(null);
    }
  };

  const handlePdfDownload = async () => {
    if (activeExportAction) return;
    setActiveExportAction("pdf-download");
    setExportError(null);
    try {
      const { downloadConstructionCostPdf } = await loadReportingModule();
      downloadConstructionCostPdf(buildV3PdfSnapshot(result), `insaat-maliyeti-raporu-${new Date().getFullYear()}.pdf`);
    } catch (error) {
      console.error(error);
      setExportError("PDF indirilemedi. Lütfen tekrar deneyin.");
    } finally {
      setActiveExportAction(null);
    }
  };

  const handlePrint = async () => {
    if (activeExportAction) return;
    setActiveExportAction("print");
    setExportError(null);
    try {
      const { printConstructionCostPdf } = await loadReportingModule();
      printConstructionCostPdf(buildV3PdfSnapshot(result));
    } catch (error) {
      console.error(error);
      setExportError("Yazdırma penceresi açılamadı. Lütfen tekrar deneyin.");
    } finally {
      setActiveExportAction(null);
    }
  };

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-border bg-card p-3 shadow-xl backdrop-blur-xl dark:border-blue-500/30 dark:bg-[#070b20]">
          <p className="font-bold text-foreground text-xs dark:text-white">{payload[0].name}</p>
          <p className="font-mono text-blue-600 font-bold text-sm dark:text-blue-400">{formatTL(payload[0].value)}</p>
          <p className="text-[11px] text-muted-foreground dark:text-slate-400">%{((payload[0].value / grandTotal) * 100).toFixed(1)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div
        data-testid="construction-result-dashboard"
        className="mx-auto w-full max-w-6xl animate-in fade-in zoom-in-95 duration-500"
      >
        {/* ── NeuroBank Action Bar ── */}
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-foreground dark:text-white">Hesaplama Sonucu</h2>
            <p className="text-xs text-muted-foreground dark:text-slate-400">
              {formatDate(result.generatedAt)} • 2026 Şantiye & Malzeme Analizi
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-none sm:flex sm:flex-wrap sm:justify-end">
            <button
              type="button"
              data-testid="construction-reset-button"
              onClick={onReset}
              className="flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground shadow-xs transition-all hover:bg-muted dark:border-white/10 dark:bg-[#0d1230] dark:text-slate-300 dark:hover:bg-[#131a44] dark:hover:text-white"
            >
              <RotateCcw className="h-4 w-4 text-blue-500 dark:text-blue-400" /> Yeni Hesap
            </button>
            <button
              type="button"
              data-testid="construction-print-button"
              onClick={handlePrint}
              disabled={activeExportAction !== null}
              className="flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground shadow-xs transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#0d1230] dark:text-slate-300 dark:hover:bg-[#131a44] dark:hover:text-white"
            >
              {activeExportAction === "print" ? <Loader2 className="h-4 w-4 animate-spin text-blue-500 dark:text-blue-400" /> : <Printer className="h-4 w-4 text-blue-500 dark:text-blue-400" />}
              {activeExportAction === "print" ? "Hazırlanıyor" : "Yazdır"}
            </button>
            <button
              type="button"
              data-testid="construction-pdf-preview-button"
              onClick={handlePdfPreview}
              disabled={activeExportAction !== null}
              className="flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground shadow-xs transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#0d1230] dark:text-slate-300 dark:hover:bg-[#131a44] dark:hover:text-white"
            >
              {activeExportAction === "pdf-preview" ? <Loader2 className="h-4 w-4 animate-spin text-indigo-500 dark:text-indigo-400" /> : <Eye className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />}
              {activeExportAction === "pdf-preview" ? "Hazırlanıyor" : "PDF Önizle"}
            </button>
            <button
              type="button"
              data-testid="construction-image-preview-button"
              onClick={handleImagePreview}
              disabled={activeExportAction !== null}
              className="flex items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-purple-600 shadow-xs transition-all hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-purple-300"
            >
              {activeExportAction === "image-preview" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              {activeExportAction === "image-preview" ? "Hazırlanıyor" : "Görsel"}
            </button>
            <button
              type="button"
              data-testid="construction-pdf-download-button"
              onClick={handlePdfDownload}
              disabled={activeExportAction !== null}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50 active:scale-98"
            >
              {activeExportAction === "pdf-download" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {activeExportAction === "pdf-download" ? "Hazırlanıyor" : "PDF İndir"}
            </button>
          </div>
        </div>

        {exportError ? (
          <div
            role="alert"
            aria-live="polite"
            className="no-print mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-600 dark:text-red-300"
          >
            {exportError}
          </div>
        ) : null}

        {/* ── Main Grid ── */}
        <div className="grid gap-5 lg:grid-cols-3">

          {/* ─ Left Column (HUD Terminal) ─ */}
          <div className="flex flex-col gap-5 lg:col-span-1">

            {/* Grand Total Terminal */}
            <div className="break-inside-avoid rounded-3xl border border-blue-500/30 bg-gradient-to-br from-[#121945] via-[#0c1236] to-[#070b24] p-6 shadow-[0_20px_50px_rgba(37,99,235,0.25)] backdrop-blur-2xl text-white">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-300">
                TOPLAM YAKLAŞIK MALİYET
              </div>
              <div
                data-testid="construction-grand-total-value"
                className="mt-2 break-words font-mono text-3xl font-black leading-tight text-white sm:text-4xl"
              >
                {formatTL(grandTotal)}
              </div>
              <div className="mt-1.5 break-words font-mono text-sm font-bold text-blue-300">
                {formatTL(costPerM2)} / m²
              </div>

              {/* Range */}
              <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-white/10 pt-4">
                <div className="min-w-0 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5">
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-400">
                    <TrendingDown className="h-3 w-3" /> İyimser (-%10)
                  </div>
                  <div className="mt-1 break-words font-mono text-xs font-black text-emerald-300">
                    {formatTL(optimistic)}
                  </div>
                </div>
                <div className="min-w-0 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5">
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-rose-400">
                    <TrendingUp className="h-3 w-3" /> Kötümser (+%15)
                  </div>
                  <div className="mt-1 break-words font-mono text-xs font-black text-rose-300">
                    {formatTL(pessimistic)}
                  </div>
                </div>
              </div>
            </div>

            {/* Pie Chart Card */}
            <div className="break-inside-avoid rounded-3xl border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-[#090d26]/85">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">
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
                    <div key={i} className="flex items-start justify-between gap-2 text-xs">
                      <div className="flex min-w-0 items-start gap-2">
                        <div className="h-2.5 w-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: entry.color }} />
                        <span className="break-words text-muted-foreground dark:text-slate-300">{entry.name}</span>
                      </div>
                      <span className="font-mono font-bold text-foreground dark:text-white">
                        %{((entry.value / grandTotal) * 100).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Project Summary Card */}
            <div className="break-inside-avoid rounded-3xl border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-[#090d26]/85">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">
                <Building2 className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" /> Proje Parametreleri
              </h3>
              <dl className="space-y-2 text-xs">
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
                  <div key={row.label} className="flex items-start justify-between gap-3 border-b border-border/60 pb-1.5 last:border-0 dark:border-white/5">
                    <dt className="shrink-0 text-muted-foreground dark:text-slate-400">{row.label}</dt>
                    <dd className="min-w-0 break-words text-right font-bold text-foreground dark:text-white">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* ─ Right Column (Tabbed Breakdown, Phases, Cash Flow, Materials & Next Steps) ─ */}
          <div className="flex flex-col gap-5 lg:col-span-2">

            {/* View Switcher Bar */}
            <div className="flex items-center gap-1.5 rounded-2xl border border-border/80 bg-muted/70 p-1.5 backdrop-blur-2xl dark:border-blue-500/20 dark:bg-[#090d26]/85">
              <button
                type="button"
                onClick={() => setViewTab("breakdown")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200",
                  viewTab === "breakdown"
                    ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-card dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5"
                )}
              >
                <Layers className="h-3.5 w-3.5" /> 12 Kalem Kırılım
              </button>
              <button
                type="button"
                onClick={() => setViewTab("phases")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200",
                  viewTab === "phases"
                    ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-card dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5"
                )}
              >
                <BarChart3 className="h-3.5 w-3.5" /> Aşama Dağılımı
              </button>
              <button
                type="button"
                onClick={() => setViewTab("cashflow")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200",
                  viewTab === "cashflow"
                    ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-card dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5"
                )}
              >
                <Calendar className="h-3.5 w-3.5" /> Hakediş Akışı
              </button>
            </div>

            {/* TAB 1: 12 Kalem Detaylı Kırılım */}
            {viewTab === "breakdown" && (
              <div className="break-inside-avoid overflow-hidden rounded-3xl border border-border/80 bg-card/90 backdrop-blur-2xl shadow-sm animate-in fade-in duration-300 dark:border-blue-500/20 dark:bg-[#090d26]/85">
                <div className="border-b border-border/70 bg-muted/40 px-6 py-4 flex items-center justify-between dark:border-white/10 dark:bg-[#070a20]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-slate-300">
                    12 Kalem Detaylı Maliyet Kırılımı
                  </h3>
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">12 Kalem</span>
                </div>
                <div className="divide-y divide-border/60 dark:divide-white/5">
                  {categories.map((cat, idx) => (
                    <div key={cat.id} className="group px-4 py-3.5 transition-colors hover:bg-blue-500/5 sm:px-6">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <div
                            className="h-3.5 w-3.5 shrink-0 rounded-full mt-0.5"
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                          />
                          <div className="min-w-0">
                            <div className="break-words font-bold text-sm text-foreground dark:text-white">{cat.label}</div>
                            <div className="mt-0.5 text-xs text-muted-foreground dark:text-slate-400">{cat.description}</div>
                          </div>
                        </div>
                        <div className="min-w-0 shrink-0 text-left sm:text-right">
                          <div className="break-words font-mono font-bold text-foreground text-sm dark:text-white">
                            {formatTL(cat.total)}
                          </div>
                          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                            %{(cat.share * 100).toFixed(1)} <span className="text-muted-foreground font-normal dark:text-slate-500">({formatTL(cat.total / inputs.totalArea)}/m²)</span>
                          </div>
                        </div>
                      </div>
                      {/* Share bar */}
                      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted dark:bg-[#101638]">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${cat.share * 100}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                      </div>
                    </div>
                  ))}
                  {/* Total row */}
                  <div className="bg-muted/60 px-4 py-4 sm:px-6 dark:bg-[#070a20]">
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="font-black text-foreground text-sm uppercase tracking-wider dark:text-white">TOPLAM (KDV HARİÇ)</div>
                      <div className="break-words font-mono text-2xl font-black text-blue-600 dark:text-blue-400">
                        {formatTL(grandTotal)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: 4 Ana Aşama Dağılımı */}
            {viewTab === "phases" && (
              <div className="break-inside-avoid overflow-hidden rounded-3xl border border-border/80 bg-card/90 backdrop-blur-2xl shadow-sm animate-in fade-in duration-300 dark:border-blue-500/20 dark:bg-[#090d26]/85">
                <div className="border-b border-border/70 bg-muted/40 px-6 py-4 flex items-center justify-between dark:border-white/10 dark:bg-[#070a20]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-slate-300">
                    Aşama Bazlı Toplu Maliyet Grupları
                  </h3>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">4 Ana Faz</span>
                </div>
                <div className="p-5 sm:p-6 space-y-4">
                  {phases.map((phase, idx) => (
                    <div key={idx} className="rounded-2xl border border-border/80 bg-muted/30 p-4 sm:p-5 dark:border-white/10 dark:bg-[#070a20]">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-foreground dark:text-white">{phase.title}</h4>
                          <p className="mt-1 text-xs text-muted-foreground dark:text-slate-400">{phase.desc}</p>
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <p className="font-mono text-lg font-black text-foreground dark:text-white">{formatTL(phase.total)}</p>
                          <p className="text-xs font-bold text-blue-600 dark:text-blue-400">%{(phase.share * 100).toFixed(1)} Pay</p>
                        </div>
                      </div>
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted dark:bg-[#101638]">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${phase.share * 100}%`, backgroundColor: phase.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: Şantiye Hakediş ve Nakit Akışı */}
            {viewTab === "cashflow" && (
              <div className="break-inside-avoid overflow-hidden rounded-3xl border border-border/80 bg-card/90 backdrop-blur-2xl shadow-sm animate-in fade-in duration-300 dark:border-blue-500/20 dark:bg-[#090d26]/85">
                <div className="border-b border-border/70 bg-muted/40 px-6 py-4 flex items-center justify-between dark:border-white/10 dark:bg-[#070a20]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-slate-300">
                    Tahmini Şantiye Hakediş ve Nakit Akışı
                  </h3>
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">4 Çeyrek Projeksiyonu</span>
                </div>
                <div className="p-5 sm:p-6 space-y-4">
                  {quarters.map((q, idx) => (
                    <div key={idx} className="rounded-2xl border border-border/80 bg-muted/30 p-4 sm:p-5 dark:border-white/10 dark:bg-[#070a20]">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-400/30 dark:bg-blue-500/20 dark:text-blue-300">
                            {q.name}
                          </span>
                          <p className="mt-2 text-xs text-muted-foreground dark:text-slate-300">{q.desc}</p>
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <p className="font-mono text-lg font-black text-emerald-600 dark:text-emerald-300">{formatTL(q.amount)}</p>
                          <p className="text-xs font-bold text-muted-foreground dark:text-slate-400">Toplamın %{q.percent}&apos;i</p>
                        </div>
                      </div>
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted dark:bg-[#101638]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                          style={{ width: `${q.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Macro Materials Terminal */}
            <div className="break-inside-avoid grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              {[
                { label: "Beton (C30/37)", value: `${macroMaterials.concreteM3} m³`, sub: formatTL(macroMaterials.concreteCost), color: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300" },
                { label: "Demir (B420C)", value: `${macroMaterials.ironTon} Ton`, sub: formatTL(macroMaterials.ironCost), color: "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-300" },
                { label: "Tuğla / Duvar", value: `${macroMaterials.brickM2} m²`, sub: formatTL(macroMaterials.brickCost), color: "border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300" },
              ].map((m) => (
                <div key={m.label} className={cn("min-w-0 rounded-2xl border p-4 backdrop-blur-xl", m.color)}>
                  <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">{m.label}</div>
                  <div className="mt-1 break-words text-xl font-mono font-black text-foreground dark:text-white">{m.value}</div>
                  <div className="mt-1 break-words font-mono text-xs opacity-75">{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Next Steps & Cross-tool Navigation Cards */}
            <div className="break-inside-avoid rounded-3xl border border-border/80 bg-card/90 p-6 shadow-sm backdrop-blur-2xl dark:border-blue-500/20 dark:bg-[#090d26]/85">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3 flex items-center gap-2 dark:text-slate-300">
                <Sparkles className="h-4 w-4 text-blue-500 dark:text-blue-400" /> İleri Seviye Mühendislik Kontrolleri
              </h4>
              <div className="grid gap-3 sm:grid-cols-3">
                <Link
                  href={`/hesaplamalar/hizli-metraj?tip=${inputs.structureKind === "villa" ? "villa-bungalov" : inputs.floorCount <= 3 ? "apartman-3kat" : "apartman-4-7kat"}&alan=${inputs.totalArea}&kat=${inputs.floorCount}&bodrumKat=${inputs.basementFloors}`}
                  className="group rounded-2xl border border-border/80 bg-muted/40 p-3.5 transition-all hover:border-blue-500/40 hover:bg-card dark:border-white/10 dark:bg-[#070a20] dark:hover:bg-[#0c1236]"
                >
                  <p className="text-xs font-bold text-foreground group-hover:text-blue-600 flex items-center justify-between dark:text-white dark:group-hover:text-blue-300">
                    Hızlı Metraj <ArrowRight className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground dark:text-slate-400">Beton, demir ve kalıp metrajını ayrıntılı doğrula.</p>
                </Link>
                <Link
                  href={`/hesaplamalar/resmi-birim-maliyet-2026?alan=${inputs.totalArea}`}
                  className="group rounded-2xl border border-border/80 bg-muted/40 p-3.5 transition-all hover:border-blue-500/40 hover:bg-card dark:border-white/10 dark:bg-[#070a20] dark:hover:bg-[#0c1236]"
                >
                  <p className="text-xs font-bold text-foreground group-hover:text-blue-600 flex items-center justify-between dark:text-white dark:group-hover:text-blue-300">
                    Resmî Maliyet 2026 <ArrowRight className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground dark:text-slate-400">Bakanlık tebliğ sınıfı yaklaşık maliyetini gör.</p>
                </Link>
                <Link
                  href={`/hesaplamalar/tahmini-insaat-alani?alan=${inputs.totalArea}&kat=${inputs.floorCount}`}
                  className="group rounded-2xl border border-border/80 bg-muted/40 p-3.5 transition-all hover:border-blue-500/40 hover:bg-card dark:border-white/10 dark:bg-[#070a20] dark:hover:bg-[#0c1236]"
                >
                  <p className="text-xs font-bold text-foreground group-hover:text-blue-600 flex items-center justify-between dark:text-white dark:group-hover:text-blue-300">
                    Emsal / İmar Alanı <ArrowRight className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground dark:text-slate-400">TAKS/KAKS ve emsal dışı brüt büyümeyi hesapla.</p>
                </Link>
              </div>
            </div>

            {/* Assumptions */}
            <div className="break-inside-avoid rounded-2xl border border-border/80 bg-muted/40 p-5 dark:border-white/10 dark:bg-[#080c22]">
              <div className="mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-slate-300">
                  Varsayımlar ve Notlar
                </h4>
              </div>
              <ul className="space-y-1.5">
                {assumptions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 break-words text-xs leading-relaxed text-muted-foreground dark:text-slate-400">
                    <span className="mt-1 shrink-0 text-blue-500 dark:text-blue-400">•</span>
                    <span className="min-w-0">{a}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* ── Print Footer ── */}
        <div className="mt-6 hidden border-t border-border/60 pt-4 text-center text-xs text-muted-foreground print:block dark:border-white/10 dark:text-slate-500">
          Bu rapor muhendislik-site.vercel.app tarafından otomatik üretilmiştir. Ön boyutlandırma amaçlıdır; kesin teklif için müteahhit ile iletişime geçiniz.
        </div>
      </div>
    </>
  );
}
