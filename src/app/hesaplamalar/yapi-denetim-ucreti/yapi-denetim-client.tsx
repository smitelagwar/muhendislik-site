"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  ImageIcon,
  Info,
  Layers,
  Loader2,
  MapPin,
  Percent,
  Printer,
  Scale,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  INSPECTION_CLASS_GROUP_OPTIONS,
  REGIONAL_DISCOUNT_OPTIONS,
  YAPI_DENETIM_EFFECTIVE_YEAR,
  calculateYapiDenetimFee,
  tryCalculateYapiDenetimFee,
  type InspectionBuildingClassGroup,
  type ProjectDurationYears,
  type RegionalDiscountType,
  type YapiDenetimCalculationResult,
  type YapiDenetimInput,
} from "@/lib/calculations/modules/yapi-denetim-ucreti";
import { formatSayi } from "@/lib/calculations/core";
import { YapiDenetimResultReport } from "./components/yapi-denetim-result-report";
import { YapiDenetimTablesDialog } from "./components/yapi-denetim-tables-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function YapiDenetimClient() {
  // 4 Temel Kontrol State'i
  const [areaInput, setAreaInput] = useState<string>("");
  const [classBand, setClassBand] = useState<InspectionBuildingClassGroup | null>(null);
  const [durationYears, setDurationYears] = useState<ProjectDurationYears>(1);
  const [region, setRegion] = useState<RegionalDiscountType>("normal");

  // Dialog & Modal State'leri
  const [tablesDialogOpen, setTablesDialogOpen] = useState<boolean>(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pngPreviewUrl, setPngPreviewUrl] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Rapor kartı ref'i (PNG yakalama için)
  const reportRef = useRef<HTMLDivElement>(null);

  // Sayısal Alan Ayrıştırması (nokta ve virgül toleranslı)
  const parsedArea = useMemo(() => {
    const clean = areaInput.trim().replace(/\s+/g, "").replace(",", ".");
    if (!clean) return null;
    const num = Number.parseFloat(clean);
    return Number.isFinite(num) && num > 0 ? num : null;
  }, [areaInput]);

  // Canlı Hesaplama (Senkron ve Anında)
  const result: YapiDenetimCalculationResult | null = useMemo(() => {
    if (parsedArea === null || classBand === null) {
      return null;
    }

    const inputData: YapiDenetimInput = {
      area: parsedArea,
      classBand,
      durationYears,
      region,
    };

    return tryCalculateYapiDenetimFee(inputData);
  }, [parsedArea, classBand, durationYears, region]);

  // ----------------------------------------------------
  // DIŞA AKTARIM (EXPORT) İŞLEVLERİ — LAZY LOADED
  // ----------------------------------------------------

  const handlePdfPreview = async () => {
    if (!result || activeAction) return;
    setActiveAction("pdf-preview");
    setExportError(null);

    try {
      const { createYapiDenetimPdfBlobUrl } = await import(
        "@/lib/calculations/modules/yapi-denetim-ucreti/reporting"
      );
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
      const { url } = createYapiDenetimPdfBlobUrl(result);
      setPdfPreviewUrl(url);
    } catch (err) {
      console.error("PDF Preview Error:", err);
      setExportError("PDF önizleme oluşturulamadı.");
    } finally {
      setActiveAction(null);
    }
  };

  const handlePdfDownload = async () => {
    if (!result || activeAction) return;
    setActiveAction("pdf-download");
    setExportError(null);

    try {
      const { downloadYapiDenetimPdf } = await import(
        "@/lib/calculations/modules/yapi-denetim-ucreti/reporting"
      );
      downloadYapiDenetimPdf(result);
    } catch (err) {
      console.error("PDF Download Error:", err);
      setExportError("PDF indirme başarısız oldu.");
    } finally {
      setActiveAction(null);
    }
  };

  const handleExcelExport = async () => {
    if (!result || activeAction) return;
    setActiveAction("excel");
    setExportError(null);

    try {
      const { exportYapiDenetimExcel } = await import(
        "@/lib/calculations/modules/yapi-denetim-ucreti/reporting"
      );
      await exportYapiDenetimExcel(result);
    } catch (err) {
      console.error("Excel Export Error:", err);
      setExportError("Excel dosyası oluşturulamadı.");
    } finally {
      setActiveAction(null);
    }
  };

  const handlePngCapture = async () => {
    if (!result || activeAction || !reportRef.current) return;
    setActiveAction("png");
    setExportError(null);

    try {
      const { captureYapiDenetimPng } = await import(
        "@/lib/calculations/modules/yapi-denetim-ucreti/reporting"
      );
      const blob = await captureYapiDenetimPng(reportRef.current);
      if (pngPreviewUrl) {
        URL.revokeObjectURL(pngPreviewUrl);
      }
      const url = URL.createObjectURL(blob);
      setPngPreviewUrl(url);
    } catch (err) {
      console.error("PNG Capture Error:", err);
      setExportError("Görsel oluşturulamadı.");
    } finally {
      setActiveAction(null);
    }
  };

  const handlePngDownload = () => {
    if (!pngPreviewUrl) return;
    const a = document.createElement("a");
    a.href = pngPreviewUrl;
    a.download = `yapi-denetim-ucreti-2026-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = async () => {
    if (!result || activeAction) return;
    setActiveAction("print");
    setExportError(null);

    try {
      const { printYapiDenetimPdf } = await import(
        "@/lib/calculations/modules/yapi-denetim-ucreti/reporting"
      );
      printYapiDenetimPdf(result);
    } catch (err) {
      console.error("Print Error:", err);
      setExportError("Yazdırma penceresi açılamadı.");
    } finally {
      setActiveAction(null);
    }
  };

  const closePdfPreview = () => {
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(null);
    }
  };

  const closePngPreview = () => {
    if (pngPreviewUrl) {
      URL.revokeObjectURL(pngPreviewUrl);
      setPngPreviewUrl(null);
    }
  };

  return (
    <div className="tool-page-shell min-h-screen">
      <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-8 lg:px-12 md:py-12">
        {/* Sayfa Üst Bilgisi (Kompakt ve Şık Header) */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-700 shadow-[0_0_15px_rgba(245,158,11,0.15)] backdrop-blur-md dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{YAPI_DENETIM_EFFECTIVE_YEAR} Verisi · 4708 Sayılı Mevzuat</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl dark:text-white">
              Tahmini Yapı Denetim Ücreti
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base dark:text-slate-300">
              {YAPI_DENETIM_EFFECTIVE_YEAR} yapı denetim birim maliyetleri ve güncel hizmet oranlarıyla
              standart yeni yapı için hızlı tahmin.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <button
              type="button"
              data-testid="open-tables-dialog-btn"
              onClick={() => setTablesDialogOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-border/80 bg-card/80 px-4 py-3 text-xs font-bold text-foreground shadow-sm transition-all hover:border-amber-500/50 hover:bg-muted/80 dark:border-white/10 dark:bg-[#0c0f24] dark:text-slate-200 dark:hover:bg-[#13183a]"
            >
              <Scale className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>2026 Tabloları ve Kurallar</span>
            </button>
          </div>
        </div>

        {/* 2 Sütunlu Grid: Sol Form, Sağ Sonuç */}
        <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr] items-start">
          {/* SOL: 4 KONTROLLÜ HIZLI FORM */}
          <section className="rounded-3xl border border-border/80 bg-card p-6 md:p-8 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-[#090c1e]/90">
            <div className="mb-6 flex items-center justify-between border-b border-border/60 pb-4 dark:border-white/10">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
                  Girdi Paneli
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-foreground dark:text-white">
                  Proje Bilgilerini Girin
                </h2>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-mono text-muted-foreground dark:bg-white/5">
                4 Alan
              </span>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              {/* KONTROL 1: Yapı Denetimine Esas İnşaat Alanı */}
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="area-input"
                    className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-slate-200"
                  >
                    1. Yapı Denetimine Esas İnşaat Alanı (m²) *
                  </label>
                  {parsedArea && (
                    <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                      {formatSayi(parsedArea)} m²
                    </span>
                  )}
                </div>
                <div className="mt-2 relative rounded-2xl border border-border bg-background focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 dark:border-white/15 dark:bg-black/30">
                  <input
                    id="area-input"
                    data-testid="yapi-denetim-area-input"
                    type="text"
                    inputMode="decimal"
                    value={areaInput}
                    onChange={(e) => setAreaInput(e.target.value)}
                    placeholder="Örnek: 1800 veya 950,50"
                    className="w-full bg-transparent px-4 py-3.5 text-base font-semibold text-foreground outline-none placeholder:text-muted-foreground/60 dark:text-white dark:placeholder:text-slate-500"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-mono font-bold text-muted-foreground">
                    m²
                  </div>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground dark:text-slate-400">
                  Yapı denetimine esas inşaat alanını girin; emsal alanıyla aynı olmak zorunda değildir.
                </p>
              </div>

              {/* KONTROL 2: Yapı Sınıfı */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-slate-200">
                    2. Yapı Sınıfı *
                  </label>
                  <Link
                    href="/hesaplamalar/resmi-birim-maliyet-2026"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Yapı sınıfımı bilmiyorum
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="mt-2.5 grid gap-2.5">
                  {INSPECTION_CLASS_GROUP_OPTIONS.map((opt) => {
                    const isSelected = classBand === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        data-testid={`class-band-btn-${opt.id}`}
                        aria-pressed={isSelected}
                        onClick={() => setClassBand(opt.id)}
                        className={`rounded-2xl border p-4 text-left transition-all ${
                          isSelected
                            ? "border-amber-500 bg-amber-500/10 text-foreground shadow-[0_0_20px_rgba(245,158,11,0.15)] dark:bg-amber-500/15 dark:text-white dark:shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                            : "border-border/80 bg-muted/30 text-foreground hover:border-amber-500/40 hover:bg-muted/60 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-300 dark:hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-extrabold text-foreground dark:text-white">
                            {opt.title}
                          </span>
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-mono font-bold text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/20 dark:text-amber-300">
                            {formatSayi(opt.unitCostTL)} TL/m²
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground dark:text-slate-400">
                          {opt.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* KONTROL 3: Öngörülen Süre */}
              <div>
                <label
                  htmlFor="duration-select"
                  className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-slate-200"
                >
                  3. Ruhsata Esas Öngörülen Süre
                </label>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {([1, 2, 3, 4, 5] as const).map((years) => {
                    const isSelected = durationYears === years;
                    return (
                      <button
                        key={years}
                        type="button"
                        data-testid={`duration-btn-${years}`}
                        aria-pressed={isSelected}
                        onClick={() => setDurationYears(years)}
                        className={`rounded-xl border py-2.5 text-center text-xs font-bold transition-all ${
                          isSelected
                            ? "border-amber-500 bg-amber-500 text-white dark:bg-amber-500/25 dark:text-amber-300 border-amber-500"
                            : "border-border/80 bg-muted/30 text-foreground hover:bg-muted/60 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-300"
                        }`}
                      >
                        {years} Yıl
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground dark:text-slate-400">
                  Varsayılan 1 yıldır. Çok yıllı projelerde sonraki yıllara devreden iş güncel yılda re-rate edilir.
                </p>
              </div>

              {/* KONTROL 4: Bölge Türü */}
              <div>
                <label
                  htmlFor="region-select"
                  className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-slate-200"
                >
                  4. Bölge / İndirim Statüsü
                </label>
                <div className="mt-2 relative rounded-2xl border border-border bg-background dark:border-white/15 dark:bg-black/30">
                  <select
                    id="region-select"
                    data-testid="region-select"
                    value={region}
                    onChange={(e) => setRegion(e.target.value as RegionalDiscountType)}
                    className="w-full bg-transparent px-4 py-3 text-xs font-bold text-foreground outline-none dark:text-white cursor-pointer"
                  >
                    {REGIONAL_DISCOUNT_OPTIONS.map((reg) => (
                      <option key={reg.id} value={reg.id} className="dark:bg-[#0c0f24]">
                        {reg.label} {reg.percentText !== "%0" ? `(İndirim: ${reg.percentText})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground dark:text-slate-400">
                  OSB, Serbest Bölge, TGB ve Sanayi Sitelerinde %35, Endüstri Bölgelerinde %20 yasal indirim uygulanır.
                </p>
              </div>
            </form>
          </section>

          {/* SAĞ: HESAPLAMA SONUÇLARI VEYA YÖNLENDİRİCİ PLACEHOLDER */}
          <div className="space-y-4">
            {result ? (
              <>
                {/* HIZLI DIŞA AKTARIM AKSİYON BARI */}
                <div
                  data-testid="export-action-bar"
                  className="rounded-2xl border border-border/80 bg-card/70 p-3 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#0c0f24]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400 pl-1">
                      Rapor İşlemleri
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        data-testid="btn-pdf-preview"
                        disabled={!!activeAction}
                        onClick={handlePdfPreview}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:border-blue-500/40 hover:bg-muted dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 disabled:opacity-50"
                      >
                        {activeAction === "pdf-preview" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 text-blue-500" />
                        )}
                        PDF Önizle
                      </button>

                      <button
                        type="button"
                        data-testid="btn-pdf-download"
                        disabled={!!activeAction}
                        onClick={handlePdfDownload}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:border-red-500/40 hover:bg-muted dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 disabled:opacity-50"
                      >
                        {activeAction === "pdf-download" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-red-500" />
                        ) : (
                          <FileText className="h-3.5 w-3.5 text-red-500" />
                        )}
                        PDF İndir
                      </button>

                      <button
                        type="button"
                        data-testid="btn-excel-export"
                        disabled={!!activeAction}
                        onClick={handleExcelExport}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:border-emerald-500/40 hover:bg-muted dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 disabled:opacity-50"
                      >
                        {activeAction === "excel" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                        ) : (
                          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                        )}
                        Excel
                      </button>

                      <button
                        type="button"
                        data-testid="btn-png-capture"
                        disabled={!!activeAction}
                        onClick={handlePngCapture}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:border-purple-500/40 hover:bg-muted dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 disabled:opacity-50"
                      >
                        {activeAction === "png" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-500" />
                        ) : (
                          <ImageIcon className="h-3.5 w-3.5 text-purple-500" />
                        )}
                        Görsel
                      </button>

                      <button
                        type="button"
                        data-testid="btn-print"
                        disabled={!!activeAction}
                        onClick={handlePrint}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:border-amber-500/40 hover:bg-muted dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 disabled:opacity-50"
                      >
                        {activeAction === "print" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
                        ) : (
                          <Printer className="h-3.5 w-3.5 text-amber-500" />
                        )}
                        Yazdır
                      </button>
                    </div>
                  </div>

                  {exportError && (
                    <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium px-1">
                      {exportError}
                    </div>
                  )}
                </div>

                {/* RAPOR KARTI (Capture & Presentational) */}
                <YapiDenetimResultReport ref={reportRef} result={result} />
              </>
            ) : (
              <div
                data-testid="yapi-denetim-placeholder"
                className="rounded-3xl border border-dashed border-border/80 bg-muted/20 p-8 md:p-12 text-center dark:border-white/10 dark:bg-white/[0.02]"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                  <Building2 className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-lg font-extrabold text-foreground dark:text-white">
                  Tahmin İçin Bilgileri Girin
                </h3>
                <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground dark:text-slate-400">
                  Yapı denetimine esas inşaat alanını girip yapı sınıfı grubunu seçtiğinizde,
                  mevzuat oranlarına göre 2026 tahmini yapı denetim bedeli <strong>anında</strong> hesaplanacaktır.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3 text-left">
                  <div className="rounded-2xl border border-border/60 bg-card/60 p-3.5 dark:border-white/5 dark:bg-black/20">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Adım 1
                    </span>
                    <p className="mt-1 text-xs font-bold text-foreground dark:text-white">
                      Alanı Girin
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      m² inşaat alanı
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-card/60 p-3.5 dark:border-white/5 dark:bg-black/20">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Adım 2
                    </span>
                    <p className="mt-1 text-xs font-bold text-foreground dark:text-white">
                      Sınıfı Seçin
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Grup I, II veya III
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-card/60 p-3.5 dark:border-white/5 dark:bg-black/20">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Adım 3
                    </span>
                    <p className="mt-1 text-xs font-bold text-foreground dark:text-white">
                      Anlık Sonuç
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      KDV dahil döküm
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2026 Tabloları ve Kuralları Modal Dialog */}
        <YapiDenetimTablesDialog
          open={tablesDialogOpen}
          onOpenChange={setTablesDialogOpen}
        />

        {/* PDF Gerçek Önizleme Modalı */}
        <Dialog open={!!pdfPreviewUrl} onOpenChange={(open) => !open && closePdfPreview()}>
          <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0 overflow-hidden bg-card dark:bg-[#0b0f26]">
            <DialogHeader className="p-4 border-b border-border/60 dark:border-white/10 shrink-0 flex flex-row items-center justify-between">
              <div>
                <DialogTitle className="text-base font-bold text-foreground dark:text-white">
                  PDF Rapor Önizleme
                </DialogTitle>
              </div>
              <div className="flex items-center gap-2 pr-6">
                <button
                  type="button"
                  onClick={handlePdfDownload}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-amber-600"
                >
                  <Download className="h-3.5 w-3.5" />
                  İndir
                </button>
              </div>
            </DialogHeader>
            <div className="flex-1 w-full h-full bg-muted/30 p-2">
              {pdfPreviewUrl && (
                <iframe
                  src={pdfPreviewUrl}
                  title="PDF Önizleme"
                  className="w-full h-full rounded-xl border border-border/40"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* PNG Görsel Önizleme Modalı */}
        <Dialog open={!!pngPreviewUrl} onOpenChange={(open) => !open && closePngPreview()}>
          <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-card dark:bg-[#0b0f26]">
            <DialogHeader className="p-4 border-b border-border/60 dark:border-white/10 shrink-0 flex flex-row items-center justify-between">
              <div>
                <DialogTitle className="text-base font-bold text-foreground dark:text-white">
                  Hesaplama Kartı Görseli (PNG)
                </DialogTitle>
              </div>
              <div className="flex items-center gap-2 pr-6">
                <button
                  type="button"
                  onClick={handlePngDownload}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-amber-600"
                >
                  <Download className="h-3.5 w-3.5" />
                  PNG İndir
                </button>
              </div>
            </DialogHeader>
            <div className="flex-1 w-full overflow-auto p-4 flex items-center justify-center bg-black/40">
              {pngPreviewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pngPreviewUrl}
                  alt="Yapı Denetim Hesap Kartı"
                  className="max-w-full rounded-2xl shadow-2xl border border-white/10"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
