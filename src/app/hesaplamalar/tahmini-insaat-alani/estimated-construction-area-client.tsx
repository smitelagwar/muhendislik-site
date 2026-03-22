"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Calculator } from "lucide-react";
import { formatSayi, formatYuzde } from "@/lib/calculations/core";
import {
  calculateEstimatedConstructionArea,
  getConstructionAreaProfileDefinition,
} from "@/lib/calculations/modules/tahmini-insaat-alani/engine";
import type {
  ConstructionAreaProfile,
  EstimatedConstructionAreaInput,
} from "@/lib/calculations/modules/tahmini-insaat-alani/types";
import {
  type EstimatedConstructionAreaPdfSnapshot,
  downloadEstimatedConstructionAreaPdf,
  openEstimatedConstructionAreaPdfPreview,
  printEstimatedConstructionAreaPdf,
} from "@/lib/calculations/reporting";
import {
  DEFAULT_ESTIMATED_AREA_FORM,
  ESTIMATED_AREA_LEGACY_DRAFT_KEY,
  type EstimatedAreaFormState,
} from "./client-state";
import { ConstructionAreaSummary } from "./components/ConstructionAreaSummary";
import { QuickModePanel } from "./components/QuickModePanel";

const PDF_DATE_FORMATTER = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function parseDecimal(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePositiveDecimal(value: string): number | null {
  const parsed = parseDecimal(value);
  return parsed !== null && parsed > 0 ? parsed : null;
}

function parsePositiveInteger(value: string): number | null {
  const parsed = parseDecimal(value);
  return parsed !== null && Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
}

function normalizeNumberParam(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)));
}

function parseProfile(raw: string | null): ConstructionAreaProfile {
  switch (raw) {
    case "ticariOfis":
      return "ticariOfis";
    case "karma":
      return "karma";
    case "konut":
    default:
      return "konut";
  }
}

function parseInitialForm(
  searchParams: ReturnType<typeof useSearchParams>
): EstimatedAreaFormState {
  const parcelAreaRaw = searchParams.get("arsa") ?? "";
  const taksRaw = searchParams.get("taks") ?? "";
  const kaksRaw = searchParams.get("kaks") ?? "";
  const katRaw = searchParams.get("kat") ?? "";
  const hasBasement = searchParams.get("bodrum") === "1";
  const bodrumKatRaw = searchParams.get("bodrumKat") ?? "";
  const bodrumAlanRaw = searchParams.get("bodrumAlan") ?? "";

  return {
    parcelAreaM2: parsePositiveDecimal(parcelAreaRaw)
      ? parcelAreaRaw
      : DEFAULT_ESTIMATED_AREA_FORM.parcelAreaM2,
    taks:
      (() => {
        const parsed = parsePositiveDecimal(taksRaw);
        return parsed && parsed <= 1 ? taksRaw : DEFAULT_ESTIMATED_AREA_FORM.taks;
      })(),
    kaks: parsePositiveDecimal(kaksRaw) ? kaksRaw : DEFAULT_ESTIMATED_AREA_FORM.kaks,
    normalFloorCount: parsePositiveInteger(katRaw)
      ? katRaw
      : DEFAULT_ESTIMATED_AREA_FORM.normalFloorCount,
    profile: parseProfile(searchParams.get("profil")),
    hasBasement,
    basementFloorCount:
      hasBasement && parsePositiveInteger(bodrumKatRaw)
        ? bodrumKatRaw
        : DEFAULT_ESTIMATED_AREA_FORM.basementFloorCount,
    basementFloorAreaM2:
      hasBasement && parsePositiveDecimal(bodrumAlanRaw) ? bodrumAlanRaw : "",
  };
}

function buildInput(form: EstimatedAreaFormState): {
  input: EstimatedConstructionAreaInput | null;
  error: string | null;
} {
  const parcelAreaM2 = parsePositiveDecimal(form.parcelAreaM2);
  const taks = parsePositiveDecimal(form.taks);
  const kaks = parsePositiveDecimal(form.kaks);
  const normalFloorCount = parsePositiveInteger(form.normalFloorCount);

  if (!parcelAreaM2) {
    return { input: null, error: "Net parsel alanı sıfırdan büyük olmalıdır." };
  }

  if (!taks || taks > 1) {
    return { input: null, error: "TAKS 0 ile 1 arasında olmalıdır." };
  }

  if (!kaks) {
    return { input: null, error: "KAKS / emsal sıfırdan büyük olmalıdır." };
  }

  if (!normalFloorCount) {
    return { input: null, error: "Normal kat sayısı en az 1 olmalıdır." };
  }

  const basementFloorCount = form.hasBasement
    ? parsePositiveInteger(form.basementFloorCount)
    : 0;

  if (form.hasBasement && !basementFloorCount) {
    return { input: null, error: "Bodrum kat sayısı en az 1 olmalıdır." };
  }

  const basementFloorAreaM2 =
    form.hasBasement && form.basementFloorAreaM2.trim() !== ""
      ? parsePositiveDecimal(form.basementFloorAreaM2)
      : null;

  if (form.hasBasement && form.basementFloorAreaM2.trim() !== "" && !basementFloorAreaM2) {
    return { input: null, error: "Bodrum kat alanı sıfırdan büyük olmalıdır." };
  }

  return {
    input: {
      parcelAreaM2,
      taks,
      kaks,
      normalFloorCount,
      profile: form.profile,
      hasBasement: form.hasBasement,
      basementFloorCount: basementFloorCount ?? 0,
      basementFloorAreaM2,
    },
    error: null,
  };
}

function buildQueryString(form: EstimatedAreaFormState): string {
  const params = new URLSearchParams();
  const parcelAreaM2 = parsePositiveDecimal(form.parcelAreaM2);
  const taks = parsePositiveDecimal(form.taks);
  const kaks = parsePositiveDecimal(form.kaks);
  const normalFloorCount = parsePositiveInteger(form.normalFloorCount);

  if (parcelAreaM2) {
    params.set("arsa", normalizeNumberParam(parcelAreaM2));
  }

  if (taks && taks <= 1) {
    params.set("taks", normalizeNumberParam(taks));
  }

  if (kaks) {
    params.set("kaks", normalizeNumberParam(kaks));
  }

  if (normalFloorCount) {
    params.set("kat", String(normalFloorCount));
  }

  params.set("profil", form.profile);
  params.set("bodrum", form.hasBasement ? "1" : "0");

  if (form.hasBasement) {
    const basementFloorCount = parsePositiveInteger(form.basementFloorCount);
    const basementFloorAreaM2 = parsePositiveDecimal(form.basementFloorAreaM2);

    if (basementFloorCount) {
      params.set("bodrumKat", String(basementFloorCount));
    }

    if (basementFloorAreaM2) {
      params.set("bodrumAlan", normalizeNumberParam(basementFloorAreaM2));
    }
  }

  return params.toString();
}

function buildOfficialCostHref(area: number): string {
  const params = new URLSearchParams();
  params.set("alan", normalizeNumberParam(area));
  return `/hesaplamalar/resmi-birim-maliyet-2026?${params.toString()}`;
}

function getPreviewErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes("sekmesi açılamadı")) {
      return "PDF önizleme yeni sekmede açılamadı. Tarayıcı açılır pencere iznini kontrol edip tekrar deneyin.";
    }

    if (error.message) {
      return error.message;
    }
  }

  return "PDF önizleme açılamadı. Lütfen tekrar deneyin.";
}

function getEstimatedAreaPdfFilename(snapshot: EstimatedConstructionAreaPdfSnapshot) {
  const profileSlug = snapshot.input.profile.toLowerCase();
  const roundedArea = Math.round(snapshot.result.yaklasikToplamInsaatAlaniM2);
  return `tahmini-insaat-alani-${profileSlug}-${roundedArea}m2.pdf`;
}

export function EstimatedConstructionAreaClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<EstimatedAreaFormState>(() => parseInitialForm(searchParams));
  const [activePdfAction, setActivePdfAction] = useState<"preview" | "download" | "print" | null>(
    null
  );
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(ESTIMATED_AREA_LEGACY_DRAFT_KEY);
  }, []);

  useEffect(() => {
    const nextQuery = buildQueryString(form);
    if (nextQuery === searchParams.toString()) {
      return;
    }

    startTransition(() => {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    });
  }, [form, pathname, router, searchParams]);

  const parsed = useMemo(() => buildInput(form), [form]);
  const result = useMemo(
    () => (parsed.input ? calculateEstimatedConstructionArea(parsed.input) : null),
    [parsed.input]
  );
  const error =
    parsed.error ?? (!result ? "Geçerli bir tahmini inşaat alanı sonucu üretilemedi." : null);

  const formulaLines =
    result && parsed.input
      ? [
          `${formatSayi(parsed.input.parcelAreaM2, 2)} × ${formatSayi(parsed.input.taks, 2)} = ${formatSayi(result.maxGroundAreaM2, 2)} m² maksimum taban alanı`,
          `${formatSayi(parsed.input.parcelAreaM2, 2)} × ${formatSayi(parsed.input.kaks, 2)} = ${formatSayi(result.emsalAreaM2, 2)} m² emsal alanı`,
          `${formatSayi(result.maxGroundAreaM2, 2)} × ${parsed.input.normalFloorCount} = ${formatSayi(result.katYerlesimKapasitesiM2, 2)} m² kat yerleşim kapasitesi`,
          `${formatYuzde(result.bazEmsalHariciOrani)} + ${formatYuzde(result.katAdediDuzeltmesiOrani)} = ${formatYuzde(result.emsalHariciEkAlanOrani)} emsal harici ek alan oranı`,
          `${formatSayi(result.emsalAreaM2, 2)} × ${formatYuzde(result.emsalHariciEkAlanOrani)} = ${formatSayi(result.emsalHariciEkAlanM2, 2)} m² emsal harici ek alan`,
          parsed.input.hasBasement
            ? `${parsed.input.basementFloorCount} × ${formatSayi(result.resolvedBasementFloorAreaM2, 2)} = ${formatSayi(result.toplamBodrumAlanM2, 2)} m² toplam bodrum alanı`
            : null,
          `${formatSayi(result.emsalAreaM2, 2)} + ${formatSayi(result.emsalHariciEkAlanM2, 2)} + ${formatSayi(result.toplamBodrumAlanM2, 2)} = ${formatSayi(result.yaklasikToplamInsaatAlaniM2, 2)} m² tahmini toplam inşaat alanı`,
        ].filter((line): line is string => Boolean(line))
      : [];

  const officialCostHref = result
    ? buildOfficialCostHref(result.yaklasikToplamInsaatAlaniM2)
    : "/hesaplamalar/resmi-birim-maliyet-2026";

  const pdfSnapshot = useMemo<EstimatedConstructionAreaPdfSnapshot | null>(() => {
    if (!parsed.input || !result) {
      return null;
    }

    return {
      input: parsed.input,
      result,
      profileLabel: result.profileLabel,
      formattedDate: PDF_DATE_FORMATTER.format(new Date()),
    };
  }, [parsed.input, result]);

  const isBusy = activePdfAction !== null;

  const handlePdfPreview = () => {
    if (isBusy) {
      return;
    }

    if (!pdfSnapshot) {
      setExportError("PDF önizleme için önce geçerli verileri girin.");
      return;
    }

    setActivePdfAction("preview");
    setExportError(null);

    try {
      openEstimatedConstructionAreaPdfPreview(pdfSnapshot);
    } catch (previewError) {
      console.error("Estimated area PDF preview failed", previewError);
      setExportError(getPreviewErrorMessage(previewError));
    } finally {
      setActivePdfAction(null);
    }
  };

  const handlePdfDownload = () => {
    if (isBusy) {
      return;
    }

    if (!pdfSnapshot) {
      setExportError("PDF indirmek için önce geçerli verileri girin.");
      return;
    }

    setActivePdfAction("download");
    setExportError(null);

    try {
      downloadEstimatedConstructionAreaPdf(
        pdfSnapshot,
        getEstimatedAreaPdfFilename(pdfSnapshot)
      );
    } catch (downloadError) {
      console.error("Estimated area PDF download failed", downloadError);
      setExportError("PDF raporu oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setActivePdfAction(null);
    }
  };

  const handlePrint = () => {
    if (isBusy) {
      return;
    }

    if (!pdfSnapshot) {
      setExportError("Yazdırmak için önce geçerli verileri girin.");
      return;
    }

    setActivePdfAction("print");
    setExportError(null);

    try {
      printEstimatedConstructionAreaPdf(pdfSnapshot);
    } catch (printError) {
      console.error("Estimated area PDF print failed", printError);
      setExportError("Yazdırma penceresi açılamadı.");
    } finally {
      setActivePdfAction(null);
    }
  };

  const setFormField = (key: keyof EstimatedAreaFormState, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
    setExportError(null);
  };

  const activeProfile = getConstructionAreaProfileDefinition(form.profile);

  return (
    <div className="tool-page-shell">
      <div className="mx-auto max-w-screen-2xl px-6 py-10 sm:px-10 lg:px-16">
        <div className="mb-10 max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300">
            <Calculator className="h-3.5 w-3.5" />
            Emsalden inşaat alanına geçiş
          </div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-5xl">
            Tahmini İnşaat Alanı Hesabı
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Net parsel alanı, TAKS, KAKS ve kat sayısından yola çıkarak emsale dahil alanı,
            emsal harici tipik büyümeyi ve bodrum katkısını birlikte değerlendirin. Amaç,
            resmi işlem öncesinde savunulabilir bir <strong>yaklaşık toplam inşaat alanı</strong>{" "}
            üretmektir.
          </p>
          <div className="mt-6 rounded-[28px] border border-blue-200/70 bg-white/70 p-5 text-sm leading-7 text-zinc-700 shadow-[0_18px_48px_-36px_rgba(37,99,235,0.35)] dark:border-blue-900/70 dark:bg-zinc-950/60 dark:text-zinc-300">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
              Aktif profil varsayımı
            </p>
            <p className="mt-2 text-base font-black text-zinc-950 dark:text-white">
              {activeProfile.label}
            </p>
            <p className="mt-2">{activeProfile.helper}</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.06fr)_minmax(360px,0.94fr)] lg:items-start">
          <div>
            <QuickModePanel form={form} onFieldChange={setFormField} />
          </div>

          <div className="lg:sticky lg:top-24">
            <ConstructionAreaSummary
              result={result}
              error={error}
              formulaLines={formulaLines}
              officialCostHref={officialCostHref}
              exportError={exportError}
              activePdfAction={activePdfAction}
              onPdfPreview={handlePdfPreview}
              onPdfDownload={handlePdfDownload}
              onPrint={handlePrint}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
