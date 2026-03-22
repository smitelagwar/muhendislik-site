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
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">{label}</p>
      <p className={cn("mt-3 text-3xl font-black", accentClass)}>
        <span data-testid={testId}>{value}</span>
      </p>
      {unit ? <p className="text-xs text-zinc-500">{unit}</p> : null}
    </div>
  );
}

function ResultShell({ children }: { children: ReactNode }) {
  return (
    <section className="tool-result-panel overflow-hidden rounded-[32px] p-6 text-white md:p-8">
      {children}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 h-5 w-5 text-emerald-200" />
        <div>
          <p className="text-lg font-black text-white">Verileri girin</p>
          <p className="mt-2 text-sm leading-7 text-blue-50/85">
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
    <div className="rounded-[28px] border border-red-300/30 bg-red-500/10 p-5 text-red-50">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
        <div>
          <p className="text-lg font-black">Hesap üretilemedi</p>
          <p className="mt-2 text-sm leading-7 text-red-50/90">{error}</p>
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
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/20 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Icon className="h-4 w-4 text-blue-100" />
      {label}
    </button>
  );
}

function FooterLinks({ officialCostHref }: { officialCostHref: string }) {
  return (
    <>
      <div className="mt-6 tool-result-inner rounded-[28px] p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-100/70">
          Sonraki adım
        </p>
        <div className="mt-4 grid gap-3">
          <Link
            href={officialCostHref}
            data-testid="estimated-area-official-link"
            className="inline-flex items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/20"
          >
            <span className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-sky-200" />
              Resmî birim maliyete geç
            </span>
            <ArrowRight className="h-4 w-4 text-sky-200" />
          </Link>
          <Link
            href="/kategori/araclar/imar-hesaplayici"
            data-testid="estimated-area-imar-link"
            className="inline-flex items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/20"
          >
            <span className="flex items-center gap-3">
              <LandPlot className="h-4 w-4 text-emerald-200" />
              İmar aracıyla net parseli doğrula
            </span>
            <ExternalLink className="h-4 w-4 text-emerald-200" />
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-[28px] border border-blue-300/20 bg-blue-400/10 p-5">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-100" />
          <p className="text-sm leading-7 text-blue-50/85">
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
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-200/80">
            Sonuç özeti
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
            Tahmini toplam inşaat alanı
          </h2>
        </div>
        <div className="rounded-2xl bg-white/10 p-3 text-blue-200">
          <Layers3 className="h-5 w-5" />
        </div>
      </div>

      {error ? <ErrorState error={error} /> : null}

      {!error && result ? (
        <div className="space-y-6">
          <div
            className={cn(
              "inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]",
              result.status === "ok"
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                : "border-amber-400/30 bg-amber-500/10 text-amber-100"
            )}
            data-testid="estimated-area-result-status"
          >
            {result.statusLabel}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">
              Yaklaşık toplam inşaat alanı
            </p>
            <p className="mt-3 text-5xl font-black text-emerald-200">
              <span data-testid="estimated-area-result-total">
                {formatSayi(result.yaklasikToplamInsaatAlaniM2, 2)}
              </span>
            </p>
            <p className="mt-2 text-sm leading-7 text-blue-50/85">
              Emsal alanı, emsal harici tipik büyüme ve bodrum katkısı birlikte hesaba
              katıldı.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <MetricCard
              label="Emsal alanı"
              value={formatSayi(result.emsalAreaM2, 2)}
              unit="m²"
              accentClass="text-sky-200"
              testId="estimated-area-result-emsal"
            />
            <MetricCard
              label="Emsal harici ek alan"
              value={formatSayi(result.emsalHariciEkAlanM2, 2)}
              unit="m²"
              accentClass="text-amber-100"
              testId="estimated-area-result-non-emsal"
            />
            <MetricCard
              label="Toplam bodrum alanı"
              value={formatSayi(result.toplamBodrumAlanM2, 2)}
              unit="m²"
              accentClass="text-blue-100"
              testId="estimated-area-result-basement-total"
            />
            <MetricCard
              label="Maksimum taban alanı"
              value={formatSayi(result.maxGroundAreaM2, 2)}
              unit="m²"
              accentClass="text-blue-100"
              testId="estimated-area-result-taban"
            />
          </div>

          <p
            className="text-sm leading-7 text-blue-50/85"
            data-testid="estimated-area-result-status-message"
          >
            {result.statusMessage}
          </p>

          <div className="tool-result-inner rounded-[28px] p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-100/70">
              Hesap özeti
            </p>
            <div className="mt-4 space-y-3 text-sm text-blue-50/90">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-blue-100/70">Kullanım profili</span>
                <span className="font-semibold" data-testid="estimated-area-result-profile">
                  {result.profileLabel}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-blue-100/70">Emsal dışı artış oranı</span>
                <span className="font-semibold" data-testid="estimated-area-result-non-emsal-ratio">
                  {formatYuzde(result.emsalHariciEkAlanOrani)}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-blue-100/70">Kat yerleşim kapasitesi</span>
                <span className="font-semibold" data-testid="estimated-area-result-capacity">
                  {formatSayi(result.katYerlesimKapasitesiM2, 2)} m²
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-blue-100/70">Ortalama gerekli kat alanı</span>
                <span className="font-semibold">
                  {formatSayi(result.averageRequiredFloorAreaM2, 2)} m² / kat
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-blue-100/70">Teorik kat karşılığı</span>
                <span className="font-semibold" data-testid="estimated-area-result-theoretical-floor">
                  {formatSayi(result.theoreticalFloorEquivalent, 2)}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-blue-100/70">Bodrum kat alanı kabulü</span>
                <span className="font-semibold">
                  {formatSayi(result.resolvedBasementFloorAreaM2, 2)} m²
                </span>
              </div>
            </div>
          </div>

          <div className="tool-formula-card rounded-[28px] p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-200/80">
              Hesap formülü
            </p>
            <div className="mt-4 space-y-2 text-sm leading-6 text-zinc-100">
              {formulaLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </div>

          <div className="tool-result-inner rounded-[28px] p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-100/70">
              Rapor işlemleri
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <ActionButton
                icon={Printer}
                label={activePdfAction === "print" ? "Yazdırılıyor" : "Yazdır"}
                onClick={onPrint}
                disabled={activePdfAction !== null}
                testId="estimated-area-print-button"
              />
              <ActionButton
                icon={FileSearch}
                label={activePdfAction === "preview" ? "Önizleme hazırlanıyor" : "PDF önizleme"}
                onClick={onPdfPreview}
                disabled={activePdfAction !== null}
                testId="estimated-area-pdf-preview-button"
              />
              <ActionButton
                icon={FileDown}
                label={activePdfAction === "download" ? "PDF hazırlanıyor" : "PDF indir"}
                onClick={onPdfDownload}
                disabled={activePdfAction !== null}
                testId="estimated-area-pdf-button"
              />
            </div>
            {exportError ? (
              <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-50">
                {exportError}
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            {result.warnings.map((warning) => (
              <div
                key={warning.message}
                className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-50"
                data-testid="estimated-area-warning"
              >
                {warning.message}
              </div>
            ))}
            {result.notes.map((note) => (
              <div
                key={note}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-blue-50/85"
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
