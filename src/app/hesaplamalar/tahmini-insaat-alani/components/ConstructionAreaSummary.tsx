"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  ExternalLink,
  FileDown,
  FileSearch,
  Info,
  LandPlot,
  Layers3,
  Printer,
} from "lucide-react";
import { formatSayi, formatYuzde } from "@/lib/calculations/core";
import type { EstimatedConstructionAreaResult } from "@/lib/calculations/modules/tahmini-insaat-alani/types";
import { cn } from "@/lib/utils";

function MetricCard({
  label,
  value,
  unit,
  accentClass,
  testId,
}: {
  label: string;
  value: string;
  unit?: string;
  accentClass: string;
  testId?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#070a20] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={cn("mt-2 font-mono text-2xl font-black", accentClass)}>
        <span data-testid={testId}>{value}</span>
      </p>
      {unit ? <p className="mt-1 text-xs text-slate-400 font-medium">{unit}</p> : null}
    </div>
  );
}

function ResultShell({ children }: { children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[32px] border border-blue-500/20 bg-[#090d26]/85 p-6 text-white backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] md:p-8">
      {children}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#070b20] p-6">
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 h-5 w-5 text-blue-400" />
        <div>
          <p className="text-base font-bold text-white">Verileri girin</p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
            Geçerli girdiler oluştuğunda tahmini toplam inşaat alanı, emsal dışı artış ve
            bodrum katkısı burada açılacak.
          </p>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
        <div>
          <p className="text-base font-bold text-white">Hesap üretilemedi</p>
          <p className="mt-1.5 text-xs leading-relaxed text-red-300">{error}</p>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  testId,
}: {
  icon: typeof Printer;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  testId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#0d1230] px-4 py-2.5 text-xs font-bold text-slate-300 shadow-sm transition-all hover:bg-[#131a44] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon className="h-4 w-4 text-blue-400" />
      {label}
    </button>
  );
}

function FooterLinks({ officialCostHref }: { officialCostHref: string }) {
  return (
    <>
      <div className="mt-6 rounded-2xl border border-white/10 bg-[#070b20] p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-300">
          Sonraki Adım
        </p>
        <div className="mt-3.5 grid gap-2.5">
          <Link
            href={officialCostHref}
            data-testid="estimated-area-official-link"
            className="inline-flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0d1230] px-4 py-3.5 text-xs font-bold text-white transition-all hover:border-blue-500/40 hover:bg-[#131942]"
          >
            <span className="flex items-center gap-2.5">
              <Building2 className="h-4 w-4 text-blue-400" />
              Resmî birim maliyete geç
            </span>
            <ArrowRight className="h-4 w-4 text-blue-400" />
          </Link>
          <Link
            href="/kategori/araclar/imar-hesaplayici"
            data-testid="estimated-area-imar-link"
            className="inline-flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0d1230] px-4 py-3.5 text-xs font-bold text-white transition-all hover:border-emerald-500/40 hover:bg-[#131942]"
          >
            <span className="flex items-center gap-2.5">
              <LandPlot className="h-4 w-4 text-emerald-400" />
              İmar aracıyla net parseli doğrula
            </span>
            <ExternalLink className="h-4 w-4 text-emerald-400" />
          </Link>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 h-4 w-4 flex-shrink-0">
            <Info className="h-4 w-4 text-blue-400" />
          </span>
          <p className="text-xs leading-relaxed text-slate-300">
            Bu araç, emsalden toplam inşaat alanına geçiş için ön fizibilite üretir. Yerel
            plan notları, yönetmelik istisnaları ve ruhsat projeleri ayrıca doğrulanmalıdır.
          </p>
        </div>
      </div>
    </>
  );
}

export function ConstructionAreaSummary({
  result,
  error,
  formulaLines,
  officialCostHref,
  exportError,
  activePdfAction,
  onPdfPreview,
  onPdfDownload,
  onPrint,
}: {
  result: EstimatedConstructionAreaResult | null;
  error: string | null;
  formulaLines: string[];
  officialCostHref: string;
  exportError: string | null;
  activePdfAction: "preview" | "download" | "print" | null;
  onPdfPreview: () => void;
  onPdfDownload: () => void;
  onPrint: () => void;
}) {
  return (
    <ResultShell>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-300">
            Sonuç Özeti
          </p>
          <h2 className="mt-1.5 text-2xl font-black tracking-tight text-white">
            Tahmini Toplam İnşaat Alanı
          </h2>
        </div>
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/15 p-2.5 text-blue-400">
          <Layers3 className="h-5 w-5" />
        </div>
      </div>

      {error ? <ErrorState error={error} /> : null}

      {!error && result ? (
        <div className="space-y-5">
          <div
            className={cn(
              "inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]",
              result.status === "ok"
                ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                : "border-blue-500/30 bg-blue-500/15 text-blue-300"
            )}
            data-testid="estimated-area-result-status"
          >
            {result.statusLabel}
          </div>

          {/* Grand Total Area HUD Box */}
          <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-br from-[#121945] via-[#0c1236] to-[#070b24] p-6 shadow-[0_20px_50px_rgba(37,99,235,0.25)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-300">
              Yaklaşık Toplam İnşaat Alanı
            </p>
            <p className="mt-2 font-mono text-4xl font-black text-white sm:text-5xl">
              <span data-testid="estimated-area-result-total">
                {formatSayi(result.yaklasikToplamInsaatAlaniM2, 2)}
              </span>
              <span className="text-xl font-bold text-blue-400 ml-2">m²</span>
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              Emsal alanı, emsal harici tipik büyüme ve bodrum katkısı birlikte hesaba katıldı.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard
              label="Emsal Alanı"
              value={formatSayi(result.emsalAreaM2, 2)}
              unit="m²"
              accentClass="text-blue-300"
              testId="estimated-area-result-emsal"
            />
            <MetricCard
              label="Emsal Harici Ek Alan"
              value={formatSayi(result.emsalHariciEkAlanM2, 2)}
              unit="m²"
              accentClass="text-indigo-300"
              testId="estimated-area-result-non-emsal"
            />
            <MetricCard
              label="Toplam Bodrum Alanı"
              value={formatSayi(result.toplamBodrumAlanM2, 2)}
              unit="m²"
              accentClass="text-purple-300"
              testId="estimated-area-result-basement-total"
            />
            <MetricCard
              label="Maksimum Taban Alanı"
              value={formatSayi(result.maxGroundAreaM2, 2)}
              unit="m²"
              accentClass="text-cyan-300"
              testId="estimated-area-result-taban"
            />
          </div>

          <p
            className="text-xs leading-relaxed text-slate-300"
            data-testid="estimated-area-result-status-message"
          >
            {result.statusMessage}
          </p>

          <div className="rounded-2xl border border-white/10 bg-[#070b20] p-4 text-xs">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-300">
              Hesap Detayları
            </p>
            <div className="mt-3 space-y-2.5 text-slate-300">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Kullanım Profili</span>
                <span className="font-bold text-white" data-testid="estimated-area-result-profile">
                  {result.profileLabel}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Emsal Dışı Artış Oranı</span>
                <span className="font-mono font-bold text-white" data-testid="estimated-area-result-non-emsal-ratio">
                  {formatYuzde(result.emsalHariciEkAlanOrani)}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Kat Yerleşim Kapasitesi</span>
                <span className="font-mono font-bold text-white" data-testid="estimated-area-result-capacity">
                  {formatSayi(result.katYerlesimKapasitesiM2, 2)} m²
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Ortalama Gerekli Kat Alanı</span>
                <span className="font-mono font-bold text-white">
                  {formatSayi(result.averageRequiredFloorAreaM2, 2)} m² / kat
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Teorik Kat Karşılığı</span>
                <span className="font-mono font-bold text-white" data-testid="estimated-area-result-theoretical-floor">
                  {formatSayi(result.theoreticalFloorEquivalent, 2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Bodrum Kat Alanı Kabulü</span>
                <span className="font-mono font-bold text-white">
                  {formatSayi(result.resolvedBasementFloorAreaM2, 2)} m²
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#070b20] p-4 text-xs font-mono">
            <p className="text-[11px] font-sans font-bold uppercase tracking-[0.18em] text-blue-300">
              Hesap Formülü Adımları
            </p>
            <div className="mt-3 space-y-1.5 text-slate-300">
              {formulaLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#070b20] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-300">
              Rapor İşlemleri
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <ActionButton
                icon={Printer}
                label={activePdfAction === "print" ? "Yazdırılıyor" : "Yazdır"}
                onClick={onPrint}
                disabled={activePdfAction !== null}
                testId="estimated-area-print-button"
              />
              <ActionButton
                icon={FileSearch}
                label={activePdfAction === "preview" ? "Hazırlanıyor" : "PDF Önizleme"}
                onClick={onPdfPreview}
                disabled={activePdfAction !== null}
                testId="estimated-area-pdf-preview-button"
              />
              <ActionButton
                icon={FileDown}
                label={activePdfAction === "download" ? "İndiriliyor" : "PDF İndir"}
                onClick={onPdfDownload}
                disabled={activePdfAction !== null}
                testId="estimated-area-pdf-button"
              />
            </div>
            {exportError ? (
              <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-300">
                {exportError}
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            {result.warnings.map((warning) => (
              <div
                key={warning.message}
                className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300"
                data-testid="estimated-area-warning"
              >
                {warning.message}
              </div>
            ))}
            {result.notes.map((note) => (
              <div
                key={note}
                className="rounded-xl border border-white/10 bg-[#070b20] p-3 text-xs text-slate-400"
              >
                {note}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {!error && !result ? <EmptyState /> : null}

      {!error && result ? <FooterLinks officialCostHref={officialCostHref} /> : null}
    </ResultShell>
  );
}
