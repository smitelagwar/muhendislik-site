"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  Building2,
  CheckCircle2,
  Info,
  LandPlot,
  Layers3,
} from "lucide-react";
import { formatSayi } from "@/lib/calculations/core";
import type {
  AreaEstimationMode,
  DetailedEstimatedConstructionAreaResult,
  QuickEstimatedConstructionAreaResult,
} from "@/lib/calculations/modules/tahmini-insaat-alani/types";
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

function EmptyState({ mode }: { mode: AreaEstimationMode }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-200" />
        <div>
          <p className="text-lg font-black text-white">Verileri girin</p>
          <p className="mt-2 text-sm leading-7 text-blue-50/85">
            {mode === "quick"
              ? "Gecerli girdiler olustugunda hizli mod ozeti burada acilacak."
              : "Kat programi olustugunda detayli toplam burada acilacak."}
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
          <p className="text-lg font-black">Hesap uretilemedi</p>
          <p className="mt-2 text-sm leading-7 text-red-50/90">{error}</p>
        </div>
      </div>
    </div>
  );
}

function FooterLinks({ officialCostHref }: { officialCostHref: string }) {
  return (
    <>
      <div className="mt-6 tool-result-inner rounded-[28px] p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-100/70">
          Sonraki adim
        </p>
        <div className="mt-4 grid gap-3">
          <Link
            href={officialCostHref}
            data-testid="estimated-area-official-link"
            className="inline-flex items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            <span className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-sky-200" />
              Resmi birim maliyet ile devam et
            </span>
            <ArrowRight className="h-4 w-4 text-sky-200" />
          </Link>
          <Link
            href="/kategori/araclar/imar-hesaplayici"
            data-testid="estimated-area-imar-link"
            className="inline-flex items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            <span className="flex items-center gap-3">
              <LandPlot className="h-4 w-4 text-emerald-200" />
              Net parsel icin imar aracina gec
            </span>
            <ArrowRight className="h-4 w-4 text-emerald-200" />
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-[28px] border border-blue-300/20 bg-blue-400/10 p-5">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-100" />
          <p className="text-sm leading-7 text-blue-50/85">
            Bu arac hizli on fizibilite ve kat bazli tahmin verir; kesin ruhsat hesabi
            degildir. Net parsel ve cekme etkisi icin imar aracini ayrica kullanin.
          </p>
        </div>
      </div>
    </>
  );
}

export function ConstructionAreaSummary({
  mode,
  quickResult,
  quickError,
  quickFormulaLines,
  detailedResult,
  detailedError,
  detailedFormulaLines,
  officialCostHref,
  onChangeMode,
}: {
  mode: AreaEstimationMode;
  quickResult: QuickEstimatedConstructionAreaResult | null;
  quickError: string | null;
  quickFormulaLines: string[];
  detailedResult: DetailedEstimatedConstructionAreaResult | null;
  detailedError: string | null;
  detailedFormulaLines: string[];
  officialCostHref: string;
  onChangeMode: (mode: AreaEstimationMode) => void;
}) {
  const error = mode === "quick" ? quickError : detailedError;

  return (
    <ResultShell>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-200/80">
            Sonuc ozeti
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
            {mode === "quick" ? "Hizli alan ozeti" : "Detayli toplam ozeti"}
          </h2>
        </div>
        <div className="rounded-2xl bg-white/10 p-3 text-blue-200">
          <Layers3 className="h-5 w-5" />
        </div>
      </div>

      {error ? <ErrorState error={error} /> : null}

      {!error && mode === "quick" && quickResult ? (
        <div className="space-y-6">
          <div
            className={cn(
              "inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]",
              quickResult.status === "ok"
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                : "border-amber-400/30 bg-amber-500/10 text-amber-100"
            )}
            data-testid="estimated-area-result-status"
          >
            {quickResult.statusLabel}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">
              Yaklasik Toplam Insaat Alani
            </p>
            <p className="mt-3 text-5xl font-black text-emerald-200">
              <span data-testid="estimated-area-result-approx-total">
                {formatSayi(quickResult.approximateTotalConstructionAreaM2, 2)}
              </span>
            </p>
            <p className="mt-2 text-sm leading-7 text-blue-50/85">
              Bu toplam kat holu, asansor ve teknik hacimlerle detayli modda rafine edilmelidir.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <MetricCard
              label="Maksimum taban alani"
              value={formatSayi(quickResult.maxGroundAreaM2, 2)}
              unit="m2"
              accentClass="text-sky-200"
              testId="estimated-area-result-taban"
            />
            <MetricCard
              label="Emsale dahil alan"
              value={formatSayi(quickResult.emsalAreaM2, 2)}
              unit="m2"
              accentClass="text-sky-200"
              testId="estimated-area-result-emsal"
            />
            <MetricCard
              label="Bodrum dahil toplam alan"
              value={formatSayi(quickResult.totalAreaWithBasementM2, 2)}
              unit="m2"
              accentClass="text-blue-100"
              testId="estimated-area-result-toplam"
            />
            <MetricCard
              label="Ortalama kat alani"
              value={formatSayi(quickResult.averageRequiredFloorAreaM2, 2)}
              unit="m2 / kat"
              accentClass="text-blue-100"
              testId="estimated-area-result-ortalama"
            />
          </div>

          <p
            className="text-sm leading-7 text-blue-50/85"
            data-testid="estimated-area-result-status-message"
          >
            {quickResult.statusMessage}
          </p>

          <div className="tool-result-inner rounded-[28px] p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-100/70">
              Alan ozeti
            </p>
            <div className="mt-4 space-y-3 text-sm text-blue-50/90">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-blue-100/70">Teorik kat karsiligi</span>
                <span className="font-semibold" data-testid="estimated-area-result-theoretical-floor">
                  {formatSayi(quickResult.theoreticalFloorEquivalent, 2)}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-blue-100/70">Girilen kat kapasitesi</span>
                <span className="font-semibold">
                  {formatSayi(quickResult.enteredFloorCapacityM2, 2)} m2
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-blue-100/70">Bodrum toplami</span>
                <span className="font-semibold" data-testid="estimated-area-result-basement-total">
                  {formatSayi(quickResult.totalBasementAreaM2, 2)} m2
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-blue-100/70">Bodrum kat alani kabulu</span>
                <span className="font-semibold">
                  {formatSayi(quickResult.resolvedBasementFloorAreaM2, 2)} m2
                </span>
              </div>
            </div>
          </div>

          <div className="tool-formula-card rounded-[28px] p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-200/80">
              Formuller
            </p>
            <div className="mt-4 space-y-2 text-sm leading-6 text-zinc-100">
              {quickFormulaLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {quickResult.warnings.map((warning) => (
              <div
                key={warning.message}
                className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-50"
              >
                {warning.message}
              </div>
            ))}
            {quickResult.notes.map((note) => (
              <div
                key={note}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-blue-50/85"
              >
                {note}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onChangeMode("detailed")}
            className="inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm font-bold text-white transition-colors hover:bg-white/10"
            data-testid="estimated-area-quick-to-detailed"
          >
            <span className="flex items-center gap-3">
              <ArrowLeftRight className="h-4 w-4 text-emerald-200" />
              Detayli hesap moduna gec
            </span>
            <ArrowRight className="h-4 w-4 text-emerald-200" />
          </button>
        </div>
      ) : null}

      {!error && mode === "detailed" && detailedResult ? (
        <div className="space-y-6">
          <div
            className={cn(
              "inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]",
              detailedResult.status === "ok"
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                : "border-amber-400/30 bg-amber-500/10 text-amber-100"
            )}
            data-testid="estimated-area-detailed-status"
          >
            {detailedResult.statusLabel}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">
              Toplam Insaat Alani
            </p>
            <p className="mt-3 text-5xl font-black text-emerald-200">
              <span data-testid="estimated-area-detailed-total">
                {formatSayi(detailedResult.grandTotalConstructionAreaM2, 2)}
              </span>
            </p>
            <p className="mt-2 text-sm leading-7 text-blue-50/85">
              Kat bazli brut alan, ortak alan, asansor ve teknik hacimlerin toplami.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <MetricCard
              label="Net alan toplami"
              value={formatSayi(detailedResult.netIndependentAreaTotalM2, 2)}
              unit="m2"
              accentClass="text-sky-200"
              testId="estimated-area-detailed-net-total"
            />
            <MetricCard
              label="Balkon / teras toplami"
              value={formatSayi(detailedResult.balconyTerraceAreaTotalM2, 2)}
              unit="m2"
              accentClass="text-sky-200"
            />
            <MetricCard
              label="Brut bagimsiz bolum toplami"
              value={formatSayi(detailedResult.grossIndependentAreaTotalM2, 2)}
              unit="m2"
              accentClass="text-blue-100"
            />
            <MetricCard
              label="Ortak alan toplami"
              value={formatSayi(detailedResult.commonAreaTotalM2, 2)}
              unit="m2"
              accentClass="text-blue-100"
            />
            <MetricCard
              label="Teknik hacim toplami"
              value={formatSayi(detailedResult.technicalAreaTotalM2, 2)}
              unit="m2"
              accentClass="text-amber-100"
              testId="estimated-area-detailed-technical-total"
            />
            <MetricCard
              label="Kat blogu sayisi"
              value={String(detailedResult.floors.length)}
              unit="adet"
              accentClass="text-blue-100"
            />
          </div>

          <p className="text-sm leading-7 text-blue-50/85">{detailedResult.statusMessage}</p>

          {detailedResult.quickReferenceTotalM2 ? (
            <div className="tool-result-inner rounded-[28px] p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-100/70">
                Hizli mod karsilastirmasi
              </p>
              <div className="mt-4 space-y-3 text-sm text-blue-50/90">
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
                  <span className="text-blue-100/70">Hizli mod toplami</span>
                  <span className="font-semibold">
                    {formatSayi(detailedResult.quickReferenceTotalM2, 2)} m2
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-blue-100/70">Fark orani</span>
                  <span
                    className="font-semibold"
                    data-testid="estimated-area-detailed-difference-ratio"
                  >
                    {detailedResult.quickDifferenceRatio !== null
                      ? `%${formatSayi(detailedResult.quickDifferenceRatio * 100, 1)}`
                      : "-"}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="tool-result-inner rounded-[28px] p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-100/70">
              Kat bazli dagilim
            </p>
            <div className="mt-4 space-y-3 text-sm text-blue-50/90">
              {detailedResult.floors.map((floor) => (
                <div
                  key={floor.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  data-testid={`estimated-area-detailed-floor-${floor.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black">{floor.label}</p>
                      <p className="text-xs text-blue-100/70">
                        Tekrar: {floor.repeatCount} | Kat toplami: {formatSayi(floor.floorTotalM2, 2)} m2
                      </p>
                    </div>
                    <p className="text-base font-black text-emerald-200">
                      {formatSayi(floor.repeatedFloorTotalM2, 2)} m2
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="tool-formula-card rounded-[28px] p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-200/80">
              Formuller
            </p>
            <div className="mt-4 space-y-2 text-sm leading-6 text-zinc-100">
              {detailedFormulaLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {detailedResult.warnings.map((warning) => (
              <div
                key={warning.message}
                className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-50"
                data-testid={
                  warning.message.toLowerCase().includes("hizli mod")
                    ? "estimated-area-detailed-difference-warning"
                    : undefined
                }
              >
                {warning.message}
              </div>
            ))}
            {detailedResult.notes.map((note) => (
              <div
                key={note}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-blue-50/85"
              >
                {note}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onChangeMode("quick")}
            className="inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm font-bold text-white transition-colors hover:bg-white/10"
            data-testid="estimated-area-detailed-to-quick"
          >
            <span className="flex items-center gap-3">
              <ArrowLeftRight className="h-4 w-4 text-sky-200" />
              Hizli moda don
            </span>
            <ArrowRight className="h-4 w-4 text-sky-200" />
          </button>
        </div>
      ) : null}

      {!error && mode === "quick" && !quickResult ? <EmptyState mode={mode} /> : null}
      {!error && mode === "detailed" && !detailedResult ? <EmptyState mode={mode} /> : null}

      {!error && ((mode === "quick" && quickResult) || (mode === "detailed" && detailedResult)) ? (
        <FooterLinks officialCostHref={officialCostHref} />
      ) : null}
    </ResultShell>
  );
}
