"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useState, type SetStateAction } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Calculator,
  Download,
  FileText,
  Layers3,
  Printer,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatSayi,
  formatTL,
  formatYuzde,
} from "@/lib/calculations/core";
import {
  QUICK_QUANTITY_FOUNDATION_OPTIONS,
  QUICK_QUANTITY_PLAN_OPTIONS,
  QUICK_QUANTITY_RETAINING_OPTIONS,
  QUICK_QUANTITY_SEISMIC_OPTIONS,
  QUICK_QUANTITY_SLAB_SYSTEM_OPTIONS,
  QUICK_QUANTITY_SOIL_OPTIONS,
  QUICK_QUANTITY_SPAN_OPTIONS,
  QUICK_QUANTITY_STRUCTURAL_SYSTEM_OPTIONS,
  calculateQuickQuantity,
  getQuickQuantityDefaultPreset,
  getQuickQuantityPreset,
  getQuickQuantityPresets,
  isQuickQuantityOfficialSelectionSupported,
  validateQuickQuantityInput,
  type QuickQuantityArchetype,
  type QuickQuantityInput,
  type QuickQuantityResult,
} from "@/lib/calculations/modules/hizli-metraj";
import {
  getOfficialCostClasses,
  getOfficialCostGroups,
  getOfficialCostRow,
  type OfficialCostSelection,
} from "@/lib/calculations/official-unit-costs";
import {
  createScenarioFromInputs,
  serializeCollectionToSearchParams,
  type ProjectInputsV2,
} from "@/lib/calculations/modules/insaat-maliyeti-v2";
import { buildPathWithSearch, normalizeNumberParam, setParamIfMeaningful } from "@/lib/url-state";
import {
  DEFAULT_QUICK_QUANTITY_FORM,
  type QuickQuantityFormState,
} from "./client-state";

const YEAR: OfficialCostSelection["yil"] = 2026;
const PDF_DATE_FORMATTER = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const ISSUE_CLASSES = {
  info: "border-sky-300/70 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200",
  warning:
    "border-teal-300/70 bg-teal-50 text-teal-800 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-200",
  error:
    "border-rose-300/70 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200",
} as const;

const BENCHMARK_CLASSES = {
  dusuk:
    "border-sky-300/70 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200",
  beklenen:
    "border-emerald-300/70 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
  yuksek:
    "border-teal-300/70 bg-teal-50 text-teal-800 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-200",
} as const;

async function loadQuickQuantityReportingModule() {
  return import("@/lib/calculations/modules/hizli-metraj/reporting");
}

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

function parseInteger(value: string): number | null {
  const parsed = parseDecimal(value);
  return parsed !== null && Number.isInteger(parsed) ? parsed : null;
}

function parseNonNegativeInteger(value: string): number | null {
  const parsed = parseInteger(value);
  return parsed !== null && parsed >= 0 ? parsed : null;
}

function isStructuralSystem(
  value: string | null
): value is QuickQuantityFormState["tasiyiciSistem"] {
  return QUICK_QUANTITY_STRUCTURAL_SYSTEM_OPTIONS.some((item) => item.value === value);
}

function isSlabSystem(value: string | null): value is QuickQuantityFormState["dosemeSistemi"] {
  return QUICK_QUANTITY_SLAB_SYSTEM_OPTIONS.some((item) => item.value === value);
}

function isFoundationType(
  value: string | null
): value is QuickQuantityFormState["temelTipi"] {
  return QUICK_QUANTITY_FOUNDATION_OPTIONS.some((item) => item.value === value);
}

function isSoilClass(value: string | null): value is QuickQuantityFormState["zeminSinifi"] {
  return QUICK_QUANTITY_SOIL_OPTIONS.some((item) => item.value === value);
}

function isSeismicDemand(
  value: string | null
): value is QuickQuantityFormState["depremTalebi"] {
  return QUICK_QUANTITY_SEISMIC_OPTIONS.some((item) => item.value === value);
}

function isPlanCompactness(
  value: string | null
): value is QuickQuantityFormState["planKompaktligi"] {
  return QUICK_QUANTITY_PLAN_OPTIONS.some((item) => item.value === value);
}

function isRetainingCondition(
  value: string | null
): value is QuickQuantityFormState["bodrumCevrePerdesi"] {
  return QUICK_QUANTITY_RETAINING_OPTIONS.some((item) => item.value === value);
}

function isSpanClass(value: string | null): value is QuickQuantityFormState["tipikAciklik"] {
  return QUICK_QUANTITY_SPAN_OPTIONS.some((item) => item.value === value);
}

function isArchetype(value: string | null): value is QuickQuantityArchetype {
  return getQuickQuantityPresets().some((preset) => preset.id === value);
}

function getOptionLabel<T extends string>(
  options: { value: T; label: string }[],
  value: T
): string {
  return options.find((item) => item.value === value)?.label ?? value;
}

function getOptionDescription<T extends string>(
  options: { value: T; label: string; description?: string }[],
  value: T
): string | null {
  return options.find((item) => item.value === value)?.description ?? null;
}

const FACTOR_TARGET_LABELS: Record<QuickQuantityResult["appliedFactors"][number]["target"], string> = {
  temel: "Temel",
  kolonPerde: "Kolon ve Perde",
  kirisDoseme: "Kiriş ve Döşeme",
  merdivenCekirdek: "Merdiven ve Çekirdek",
  genel: "Genel",
};

function parseInitialForm(
  searchParams: ReturnType<typeof useSearchParams>
): QuickQuantityFormState {
  const defaultPreset = getQuickQuantityDefaultPreset();
  const preset = isArchetype(searchParams.get("tip"))
    ? getQuickQuantityPreset(searchParams.get("tip") as QuickQuantityArchetype) ?? defaultPreset
    : defaultPreset;

  const rawGroup = searchParams.get("grup");
  const rawClass = searchParams.get("sinif");
  const hasOverride = Boolean(rawGroup && rawClass);
  const groupOptions = getOfficialCostGroups(YEAR);
  const resolvedGroup =
    rawGroup && groupOptions.includes(rawGroup as OfficialCostSelection["grup"])
      ? rawGroup
      : preset.officialSelection.grup;
  const classOptions = getOfficialCostClasses(
    YEAR,
    resolvedGroup as OfficialCostSelection["grup"]
  );
  const resolvedClass =
    rawClass && classOptions.includes(rawClass as OfficialCostSelection["sinif"])
      ? rawClass
      : preset.officialSelection.sinif;
  const initialBodrumKatSayisi =
    searchParams.get("bodrumKat") && parseNonNegativeInteger(searchParams.get("bodrumKat") as string) !== null
      ? (searchParams.get("bodrumKat") as string)
      : DEFAULT_QUICK_QUANTITY_FORM.bodrumKatSayisi;
  const hasBasement = (parseNonNegativeInteger(initialBodrumKatSayisi) ?? 0) > 0;

  return {
    katAlaniM2:
      searchParams.get("alan") && parsePositiveDecimal(searchParams.get("alan") as string)
        ? (searchParams.get("alan") as string)
        : DEFAULT_QUICK_QUANTITY_FORM.katAlaniM2,
    normalKatSayisi:
      searchParams.get("kat") && parseInteger(searchParams.get("kat") as string)
        ? (searchParams.get("kat") as string)
        : DEFAULT_QUICK_QUANTITY_FORM.normalKatSayisi,
    bodrumKatSayisi: initialBodrumKatSayisi,
    bodrumKatAlaniM2:
      hasBasement &&
      searchParams.get("bodrumAlan") &&
      parsePositiveDecimal(searchParams.get("bodrumAlan") as string)
        ? (searchParams.get("bodrumAlan") as string)
        : "",
    yapiArketipi: preset.id,
    tasiyiciSistem: isStructuralSystem(searchParams.get("tasiyici"))
      ? (searchParams.get("tasiyici") as QuickQuantityFormState["tasiyiciSistem"])
      : preset.defaultStructuralSystem,
    dosemeSistemi: isSlabSystem(searchParams.get("doseme"))
      ? (searchParams.get("doseme") as QuickQuantityFormState["dosemeSistemi"])
      : preset.defaultSlabSystem,
    temelTipi: isFoundationType(searchParams.get("temel"))
      ? (searchParams.get("temel") as QuickQuantityFormState["temelTipi"])
      : preset.defaultFoundationType,
    zeminSinifi: isSoilClass(searchParams.get("zemin"))
      ? (searchParams.get("zemin") as QuickQuantityFormState["zeminSinifi"])
      : DEFAULT_QUICK_QUANTITY_FORM.zeminSinifi,
    depremTalebi: isSeismicDemand(searchParams.get("deprem"))
      ? (searchParams.get("deprem") as QuickQuantityFormState["depremTalebi"])
      : preset.defaultSeismicDemand,
    planKompaktligi: isPlanCompactness(searchParams.get("plan"))
      ? (searchParams.get("plan") as QuickQuantityFormState["planKompaktligi"])
      : preset.defaultPlanCompactness,
    bodrumCevrePerdesi: hasBasement
      ? isRetainingCondition(searchParams.get("perde"))
      ? (searchParams.get("perde") as QuickQuantityFormState["bodrumCevrePerdesi"])
      : preset.defaultBasementRetainingCondition
      : "yok",
    tipikAciklik: isSpanClass(searchParams.get("aciklik"))
      ? (searchParams.get("aciklik") as QuickQuantityFormState["tipikAciklik"])
      : preset.defaultSpanClass,
    resmiSinifOverride: hasOverride,
    resmiGrup: resolvedGroup,
    resmiSinif: resolvedClass,
    showAdvanced: searchParams.get("gel") === "1",
  };
}

function buildInput(form: QuickQuantityFormState): {
  input: QuickQuantityInput | null;
  error: string | null;
  resolvedSelection: OfficialCostSelection;
} {
  const katAlaniM2 = parsePositiveDecimal(form.katAlaniM2);
  const normalKatSayisi = parseInteger(form.normalKatSayisi);
  const bodrumKatSayisi = parseNonNegativeInteger(form.bodrumKatSayisi);

  const fallbackPreset = getQuickQuantityPreset(form.yapiArketipi) ?? getQuickQuantityDefaultPreset();
  const resolvedSelection = form.resmiSinifOverride
    ? {
        yil: YEAR,
        grup: form.resmiGrup as OfficialCostSelection["grup"],
        sinif: form.resmiSinif as OfficialCostSelection["sinif"],
      }
    : fallbackPreset.officialSelection;

  if (!katAlaniM2) {
    return {
      input: null,
      error: "Kat alanı sıfırdan büyük olmalıdır.",
      resolvedSelection,
    };
  }

  if (!normalKatSayisi || normalKatSayisi < 1) {
    return {
      input: null,
      error: "Normal kat sayısı en az 1 olmalıdır.",
      resolvedSelection,
    };
  }

  if (bodrumKatSayisi === null || bodrumKatSayisi < 0) {
    return {
      input: null,
      error: "Bodrum kat sayısı negatif olamaz.",
      resolvedSelection,
    };
  }

  const bodrumKatAlaniM2 =
    bodrumKatSayisi > 0 && form.bodrumKatAlaniM2.trim() !== ""
      ? parsePositiveDecimal(form.bodrumKatAlaniM2)
      : null;
  const hasBasement = bodrumKatSayisi > 0;

  if (bodrumKatSayisi > 0 && form.bodrumKatAlaniM2.trim() !== "" && !bodrumKatAlaniM2) {
    return {
      input: null,
      error: "Bodrum kat alanı girildiyse sıfırdan büyük olmalıdır.",
      resolvedSelection,
    };
  }

  const input: QuickQuantityInput = {
    katAlaniM2,
    normalKatSayisi,
    bodrumKatSayisi,
    bodrumKatAlaniM2: hasBasement ? bodrumKatAlaniM2 : null,
    yapiArketipi: form.yapiArketipi,
    tasiyiciSistem: form.tasiyiciSistem,
    dosemeSistemi: form.dosemeSistemi,
    temelTipi: form.temelTipi,
    zeminSinifi: form.zeminSinifi,
    depremTalebi: form.depremTalebi,
    planKompaktligi: form.planKompaktligi,
    bodrumCevrePerdesi: hasBasement ? form.bodrumCevrePerdesi : "yok",
    tipikAciklik: form.tipikAciklik,
    resmiSinif: form.resmiSinifOverride ? resolvedSelection : null,
  };

  return {
    input,
    error: validateQuickQuantityInput(input),
    resolvedSelection,
  };
}

function buildQueryString(form: QuickQuantityFormState): string {
  const params = new URLSearchParams();
  const preset = getQuickQuantityPreset(form.yapiArketipi) ?? getQuickQuantityDefaultPreset();
  const katAlani = parsePositiveDecimal(form.katAlaniM2);
  const normalKat = parseInteger(form.normalKatSayisi);
  const bodrumKat = parseNonNegativeInteger(form.bodrumKatSayisi);
  const bodrumAlan = parsePositiveDecimal(form.bodrumKatAlaniM2);
  const hasBasement = (bodrumKat ?? 0) > 0;

  setParamIfMeaningful(params, "tip", form.yapiArketipi, {
    defaultValue: DEFAULT_QUICK_QUANTITY_FORM.yapiArketipi,
  });
  setParamIfMeaningful(params, "alan", katAlani ? normalizeNumberParam(katAlani) : null, {
    defaultValue: DEFAULT_QUICK_QUANTITY_FORM.katAlaniM2,
  });
  setParamIfMeaningful(params, "kat", normalKat ? String(normalKat) : null, {
    defaultValue: DEFAULT_QUICK_QUANTITY_FORM.normalKatSayisi,
  });
  setParamIfMeaningful(params, "bodrumKat", bodrumKat !== null ? String(bodrumKat) : null, {
    defaultValue: "0",
  });
  setParamIfMeaningful(
    params,
    "bodrumAlan",
    bodrumKat && bodrumAlan ? normalizeNumberParam(bodrumAlan) : null
  );
  setParamIfMeaningful(params, "tasiyici", form.tasiyiciSistem, {
    defaultValue: preset.defaultStructuralSystem,
  });
  setParamIfMeaningful(params, "doseme", form.dosemeSistemi, {
    defaultValue: preset.defaultSlabSystem,
  });
  setParamIfMeaningful(params, "temel", form.temelTipi, {
    defaultValue: preset.defaultFoundationType,
  });
  setParamIfMeaningful(params, "zemin", form.zeminSinifi, {
    defaultValue: DEFAULT_QUICK_QUANTITY_FORM.zeminSinifi,
  });
  setParamIfMeaningful(params, "deprem", form.depremTalebi, {
    defaultValue: preset.defaultSeismicDemand,
  });
  setParamIfMeaningful(params, "plan", form.planKompaktligi, {
    defaultValue: preset.defaultPlanCompactness,
  });
  setParamIfMeaningful(params, "perde", hasBasement ? form.bodrumCevrePerdesi : null, {
    defaultValue: hasBasement ? preset.defaultBasementRetainingCondition : "yok",
  });
  setParamIfMeaningful(params, "aciklik", form.tipikAciklik, {
    defaultValue: preset.defaultSpanClass,
  });
  setParamIfMeaningful(params, "gel", form.showAdvanced ? "1" : null, {
    defaultValue: "0",
  });

  if (form.resmiSinifOverride) {
    setParamIfMeaningful(params, "grup", form.resmiGrup, {
      defaultValue: preset.officialSelection.grup,
    });
    setParamIfMeaningful(params, "sinif", form.resmiSinif, {
      defaultValue: preset.officialSelection.sinif,
    });
  }

  return params.toString();
}

function normalizeFormState(form: QuickQuantityFormState): QuickQuantityFormState {
  const nextForm = { ...form };
  const classOptions = getOfficialCostClasses(
    YEAR,
    nextForm.resmiGrup as OfficialCostSelection["grup"]
  );

  if (
    classOptions.length > 0 &&
    !classOptions.includes(nextForm.resmiSinif as OfficialCostSelection["sinif"])
  ) {
    nextForm.resmiSinif = classOptions[0];
  }

  const bodrumKatSayisi = parseNonNegativeInteger(nextForm.bodrumKatSayisi) ?? 0;
  if (bodrumKatSayisi === 0) {
    nextForm.bodrumCevrePerdesi = "yok";
    nextForm.bodrumKatAlaniM2 = "";
  }

  return nextForm;
}

function getPdfFilename(result: QuickQuantityResult) {
  const roundedArea = Math.round(result.toplamInsaatAlaniM2);
  return `hizli-metraj-${result.preset.id}-${roundedArea}m2.pdf`;
}

function resolveStructureKind(
  result: QuickQuantityResult
): ProjectInputsV2["structureKind"] {
  if (result.input.yapiArketipi === "villa-bungalov") {
    return "villa";
  }

  if (result.input.yapiArketipi === "ofis-banka-idari") {
    return "ofis";
  }

  if (
    result.input.yapiArketipi === "otopark-akaryakit" ||
    result.input.yapiArketipi === "karma-kullanim"
  ) {
    return "ticari";
  }

  return "apartman";
}

function resolveQualityLevel(
  result: QuickQuantityResult
): ProjectInputsV2["qualityLevel"] {
  const code = `${result.resolvedOfficialSelection.grup}-${result.resolvedOfficialSelection.sinif}`;
  if (code === "III-A") {
    return "ekonomik";
  }

  if (code === "III-B" || code === "II-C") {
    return "standart";
  }

  if (code === "III-C" || code === "IV-A") {
    return "premium";
  }

  return "luks";
}

function buildConstructionCostHref(result: QuickQuantityResult) {
  const structureKind = resolveStructureKind(result);
  const qualityLevel = resolveQualityLevel(result);
  const commonAreaRatio =
    structureKind === "villa" ? 0.08 : structureKind === "ofis" ? 0.18 : structureKind === "ticari" ? 0.16 : 0.14;
  const saleableArea = result.toplamInsaatAlaniM2 * (1 - commonAreaRatio);
  const facadeComplexityBase =
    structureKind === "ofis" ? 1.14 : structureKind === "ticari" ? 1.12 : 1.04;
  const facadeComplexity =
    result.input.planKompaktligi === "girintili"
      ? facadeComplexityBase + 0.08
      : result.input.planKompaktligi === "kompakt"
        ? facadeComplexityBase - 0.03
        : facadeComplexityBase;
  const siteDifficulty: ProjectInputsV2["site"]["siteDifficulty"] =
    result.input.bodrumKatSayisi > 1 ||
    result.input.bodrumCevrePerdesi === "tam" ||
    result.input.zeminSinifi === "ZE"
      ? "yuksek"
      : result.input.zeminSinifi === "ZD" || result.input.bodrumCevrePerdesi === "kismi"
        ? "orta"
        : "dusuk";
  const mepLevel: ProjectInputsV2["site"]["mepLevel"] =
    structureKind === "ofis"
      ? "premium"
      : result.input.tipikAciklik === "genis"
        ? "yuksek"
        : "orta";
  const wetAreaDensity: ProjectInputsV2["site"]["wetAreaDensity"] =
    structureKind === "ofis" ? "orta" : structureKind === "villa" ? "orta" : "yuksek";

  const inputs: ProjectInputsV2 = {
    projectName: `${result.preset.shortLabel} Ön Keşif`,
    structureKind,
    qualityLevel,
    floorCount: result.input.normalKatSayisi,
    basementCount: result.input.bodrumKatSayisi,
    unitCount:
      structureKind === "villa"
        ? 1
        : Math.max(
            1,
            Math.round(
              result.toplamInsaatAlaniM2 /
                (structureKind === "ofis" ? 140 : structureKind === "ticari" ? 180 : 120)
            )
          ),
    saleableArea: Number(saleableArea.toFixed(1)),
    commonAreaRatio,
    facadeComplexity,
    elevatorCount: result.input.normalKatSayisi >= 5 ? 1 : 0,
    area: {
      advancedMode: true,
      totalArea: 0,
      basementArea: Number(result.toplamBodrumAlanM2.toFixed(1)),
      normalArea: Number(result.toplamNormalAlanM2.toFixed(1)),
      mezzanineArea: 0,
      roofTerraceArea: 0,
      parkingArea: 0,
      landscapeArea: structureKind === "villa" ? result.input.katAlaniM2 * 0.35 : result.input.katAlaniM2 * 0.12,
    },
    commercial: {
      contractorMarginRate: 0.18,
      vatRate: 0.2,
      overheadRate: 0.1,
      contingencyRate: 0.06,
      targetSalePrice: structureKind === "villa" ? 92000 : structureKind === "ofis" ? 59000 : 32500,
      durationMonths: Math.max(8, result.input.normalKatSayisi * 2 + result.input.bodrumKatSayisi * 2),
      monthlyInflationRate: 0.018,
      contractorProfile: structureKind === "villa" ? "bireysel" : "ortaOlcekli",
    },
    site: {
      region: "diger_buyuksehir",
      soilClass: result.input.zeminSinifi,
      siteDifficulty,
      climateZone: "iliman",
      heatingSystem:
        structureKind === "ofis" ? "vrf" : structureKind === "villa" ? "bireyselKombi" : "merkeziKazan",
      facadeSystem: structureKind === "ofis" ? "premiumCam" : "klasik",
      mepLevel,
      parkingType: structureKind === "villa" ? "acik" : "kapali",
      wetAreaDensity,
    },
    reference: {
      officialSelection: result.resolvedOfficialSelection,
    },
  };

  const scenario = createScenarioFromInputs(inputs, {
    name: `${result.preset.shortLabel} Senaryosu`,
  });
  const params = serializeCollectionToSearchParams({
    activeScenarioId: scenario.id,
    comparisonMode: "single",
    scenarios: [scenario],
    version: 2,
  });

  return buildPathWithSearch("/hesaplamalar/insaat-maliyeti", params);
}

function buildOfficialCostHref(result: QuickQuantityResult) {
  const params = new URLSearchParams();
  setParamIfMeaningful(params, "mod", "manual");
  setParamIfMeaningful(params, "alan", normalizeNumberParam(result.toplamInsaatAlaniM2));
  setParamIfMeaningful(params, "grup", result.resolvedOfficialSelection.grup);
  setParamIfMeaningful(params, "sinif", result.resolvedOfficialSelection.sinif);
  return buildPathWithSearch("/hesaplamalar/resmi-birim-maliyet-2026", params);
}

function getPreviewErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "PDF işlemi tamamlanamadı.";
}

function getBenchmarkLabel(status: QuickQuantityResult["benchmarklar"][number]["status"]) {
  if (status === "dusuk") {
    return "Alt bant";
  }

  if (status === "yuksek") {
    return "Üst bant";
  }

  return "Beklenen";
}

function formatBenchmarkValue(
  value: number,
  unit: QuickQuantityResult["benchmarklar"][number]["unit"]
) {
  if (unit === "TL/m²") {
    return formatTL(value).replace(" TL", " TL/m²");
  }

  return `${formatSayi(value, unit === "kg/m²" ? 1 : 2)} ${unit}`;
}

export function QuickQuantityClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<QuickQuantityFormState>(() =>
    normalizeFormState(parseInitialForm(searchParams))
  );
  const [pdfError, setPdfError] = useState<string | null>(null);

  const groupOptions = useMemo(() => getOfficialCostGroups(YEAR), []);
  const classOptions = useMemo(
    () => getOfficialCostClasses(YEAR, form.resmiGrup as OfficialCostSelection["grup"]),
    [form.resmiGrup]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextQuery = buildQueryString(form);
      if (nextQuery === searchParams.toString()) {
        return;
      }

      startTransition(() => {
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [form, pathname, router, searchParams]);

  const parsed = useMemo(() => buildInput(form), [form]);
  const result = useMemo(
    () => (parsed.input && !parsed.error ? calculateQuickQuantity(parsed.input) : null),
    [parsed.error, parsed.input]
  );

  const activeOfficialRow = useMemo(
    () => getOfficialCostRow(parsed.resolvedSelection),
    [parsed.resolvedSelection]
  );
  const supportedOfficialSelection = isQuickQuantityOfficialSelectionSupported(parsed.resolvedSelection);

  const preset = getQuickQuantityPreset(form.yapiArketipi) ?? getQuickQuantityDefaultPreset();
  const bodrumAktif = (parseNonNegativeInteger(form.bodrumKatSayisi) ?? 0) > 0;
  const tasiyiciSistemLabel = getOptionLabel(
    QUICK_QUANTITY_STRUCTURAL_SYSTEM_OPTIONS,
    form.tasiyiciSistem
  );
  const dosemeSistemiLabel = getOptionLabel(QUICK_QUANTITY_SLAB_SYSTEM_OPTIONS, form.dosemeSistemi);
  const temelTipiLabel = getOptionLabel(QUICK_QUANTITY_FOUNDATION_OPTIONS, form.temelTipi);
  const zeminSinifiLabel = getOptionLabel(QUICK_QUANTITY_SOIL_OPTIONS, form.zeminSinifi);
  const depremTalebiLabel = getOptionLabel(QUICK_QUANTITY_SEISMIC_OPTIONS, form.depremTalebi);
  const planKompaktligiLabel = getOptionLabel(QUICK_QUANTITY_PLAN_OPTIONS, form.planKompaktligi);
  const bodrumPerdesiLabel = bodrumAktif
    ? getOptionLabel(QUICK_QUANTITY_RETAINING_OPTIONS, form.bodrumCevrePerdesi)
    : "Bodrum yok";
  const tipikAciklikLabel = getOptionLabel(QUICK_QUANTITY_SPAN_OPTIONS, form.tipikAciklik);
  const depremTalebiDescription = getOptionDescription(
    QUICK_QUANTITY_SEISMIC_OPTIONS,
    form.depremTalebi
  );
  const planKompaktligiDescription = getOptionDescription(
    QUICK_QUANTITY_PLAN_OPTIONS,
    form.planKompaktligi
  );
  const bodrumPerdesiDescription = bodrumAktif
    ? getOptionDescription(QUICK_QUANTITY_RETAINING_OPTIONS, form.bodrumCevrePerdesi)
    : "Bodrum kat sayısı 0 olduğunda çevre perdesi ve su yalıtımı etkisi devre dışı kalır.";
  const tipikAciklikDescription = getOptionDescription(
    QUICK_QUANTITY_SPAN_OPTIONS,
    form.tipikAciklik
  );

  const resultError =
    parsed.error ??
    (!supportedOfficialSelection
      ? "Seçilen resmî sınıf bu v1 metraj aracında desteklenmiyor. Resmî Birim Maliyet aracına geçerek toplam yaklaşık maliyeti inceleyin."
      : null) ??
    (!result ? "Geçerli bir metraj sonucu üretilemedi." : null);

  const setNormalizedForm = (updater: SetStateAction<QuickQuantityFormState>) => {
    setForm((current) => {
      const nextForm =
        typeof updater === "function"
          ? (updater as (currentState: QuickQuantityFormState) => QuickQuantityFormState)(current)
          : updater;

      return normalizeFormState(nextForm);
    });
  };

  const updateField = <K extends keyof QuickQuantityFormState>(
    key: K,
    value: QuickQuantityFormState[K]
  ) => {
    setNormalizedForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="tool-page-shell">
      <div className="mx-auto max-w-screen-2xl px-6 py-10 sm:px-10 lg:px-16">
        <section className="mb-8 rounded-[34px] border border-zinc-200/80 bg-white/85 p-6 shadow-sm backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/75 md:p-8">
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                <Layers3 className="h-4 w-4" />
                Taşıyıcı sistem ön keşfi
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
                Hızlı Metraj Hesaplayıcı
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400 md:text-base">
                Kat alanı, kat sayısı, deprem talebi, plan kompaktlığı ve bodrum çevre perdesi
                kararlarına göre yaklaşık beton, donatı, kalıp ve kaba taşıyıcı maliyet bandını tek
                ekranda görün. Aynı akışta yardımcı kaba iş metrajını ve 2026 resmî yaklaşık
                maliyet kıyasını da izleyin.
              </p>
            </div>

            <div className="rounded-[30px] border border-teal-500/20 bg-gradient-to-br from-zinc-950 via-zinc-900 to-teal-950/60 p-6 text-white shadow-[0_24px_90px_-50px_rgba(13, 148, 136,0.55)]">
              <div className="flex h-full flex-col justify-between gap-5">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-200/80">
                    Aktif mühendislik profili
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight">
                    {preset.shortLabel}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-zinc-200/85">
                    {preset.applicationNote}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-400">
                      Önerilen resmî bant
                    </p>
                    <p className="mt-2 font-mono text-2xl font-black text-teal-200">
                      {preset.officialSelection.grup}-{preset.officialSelection.sinif}
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-400">
                      Taşıyıcı payı hedefi
                    </p>
                    <p className="mt-2 font-mono text-2xl font-black text-emerald-200">
                      {formatYuzde(preset.carryingShareBand.expected)}
                    </p>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">Taşıyıcı sistem</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-100">{tasiyiciSistemLabel}</p>
                  </div>
                  <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">Döşeme sistemi</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-100">{dosemeSistemiLabel}</p>
                  </div>
                  <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">Temel tipi</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-100">{temelTipiLabel}</p>
                  </div>
                  <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">Zemin sınıfı</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-100">{zeminSinifiLabel}</p>
                  </div>
                  <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">Deprem talebi</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-100">{depremTalebiLabel}</p>
                  </div>
                  <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">Plan kompaktlığı</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-100">{planKompaktligiLabel}</p>
                  </div>
                  <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">Bodrum perdesi</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-100">{bodrumPerdesiLabel}</p>
                  </div>
                  <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">Tipik açıklık</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-100">{tipikAciklikLabel}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <section className="rounded-[32px] border border-zinc-200/80 bg-white/85 p-6 shadow-sm backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/75 md:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                  Hızlı mod
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
                  Bina tipini ve kaba boyutları girin
                </h2>
              </div>
              <div className="rounded-2xl bg-teal-500/10 p-3 text-teal-600 dark:text-teal-300">
                <Calculator className="h-5 w-5" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {getQuickQuantityPresets().map((item) => {
                const isActive = form.yapiArketipi === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-testid={`hizli-metraj-arketip-${item.id}`}
                    onClick={() =>
                      setNormalizedForm((current) => ({
                        ...current,
                        yapiArketipi: item.id,
                        tasiyiciSistem: item.defaultStructuralSystem,
                        dosemeSistemi: item.defaultSlabSystem,
                        temelTipi: item.defaultFoundationType,
                        depremTalebi: item.defaultSeismicDemand,
                        planKompaktligi: item.defaultPlanCompactness,
                        bodrumCevrePerdesi: item.defaultBasementRetainingCondition,
                        tipikAciklik: item.defaultSpanClass,
                        resmiSinifOverride: false,
                        resmiGrup: item.officialSelection.grup,
                        resmiSinif: item.officialSelection.sinif,
                      }))
                    }
                    className={cn(
                      "rounded-[24px] border p-4 text-left transition-colors",
                      isActive
                        ? "border-teal-400 bg-teal-50/80 text-zinc-950 dark:border-teal-500/50 dark:bg-teal-500/10 dark:text-white"
                        : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-teal-300 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:border-zinc-700"
                    )}
                  >
                    <p className="text-sm font-black">{item.shortLabel}</p>
                    <p className="mt-2 text-xs leading-6 opacity-80">{item.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Kat alanı [m²]
                </span>
                <input
                  data-testid="hizli-metraj-input-kat-alani"
                  value={form.katAlaniM2}
                  onChange={(event) => updateField("katAlaniM2", event.target.value)}
                  inputMode="decimal"
                  className="tool-input h-12 w-full rounded-2xl border px-4 py-3"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Normal kat sayısı
                </span>
                <input
                  data-testid="hizli-metraj-input-normal-kat"
                  value={form.normalKatSayisi}
                  onChange={(event) => updateField("normalKatSayisi", event.target.value)}
                  inputMode="numeric"
                  className="tool-input h-12 w-full rounded-2xl border px-4 py-3"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Bodrum kat sayısı
                </span>
                <input
                  data-testid="hizli-metraj-input-bodrum-kat"
                  value={form.bodrumKatSayisi}
                  onChange={(event) => updateField("bodrumKatSayisi", event.target.value)}
                  inputMode="numeric"
                  className="tool-input h-12 w-full rounded-2xl border px-4 py-3"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Bodrum kat alanı [m²]
                </span>
                <input
                  data-testid="hizli-metraj-input-bodrum-alan"
                  value={form.bodrumKatAlaniM2}
                  onChange={(event) => updateField("bodrumKatAlaniM2", event.target.value)}
                  inputMode="decimal"
                  disabled={!bodrumAktif}
                  placeholder="Boş bırakılırsa kat alanı kullanılır"
                  className="tool-input h-12 w-full rounded-2xl border px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <p className="mt-2 text-xs leading-6 text-zinc-500">
                  {bodrumAktif
                    ? "Bodrum alanı boş bırakılırsa normal kat alanı kabul edilir."
                    : "Bodrum kat sayısı 0 iken bu alan devre dışıdır."}
                </p>
              </label>
            </div>

            <div className="mt-6 rounded-[28px] border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                    Resmî sınıf
                  </p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {parsed.resolvedSelection.grup}-{parsed.resolvedSelection.sinif}
                    {activeOfficialRow ? ` · ${activeOfficialRow.sinifAdi}` : ""}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em]",
                    supportedOfficialSelection
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                      : "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
                  )}
                >
                  {supportedOfficialSelection ? "Desteklenen bant" : "Destek dışı bant"}
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-[28px] border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
              <button
                type="button"
                data-testid="hizli-metraj-advanced-toggle"
                onClick={() => updateField("showAdvanced", !form.showAdvanced)}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Gelişmiş mod
                </span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {form.showAdvanced ? "Açık" : "Kapalı"}
                </span>
              </button>

              {form.showAdvanced ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      Taşıyıcı sistem
                    </span>
                    <select
                      data-testid="hizli-metraj-select-tasiyici"
                      value={form.tasiyiciSistem}
                      onChange={(event) => updateField("tasiyiciSistem", event.target.value as QuickQuantityFormState["tasiyiciSistem"])}
                      className="tool-input h-12 w-full rounded-2xl border px-4 py-3"
                    >
                      {QUICK_QUANTITY_STRUCTURAL_SYSTEM_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      Döşeme sistemi
                    </span>
                    <select
                      data-testid="hizli-metraj-select-doseme"
                      value={form.dosemeSistemi}
                      onChange={(event) => updateField("dosemeSistemi", event.target.value as QuickQuantityFormState["dosemeSistemi"])}
                      className="tool-input h-12 w-full rounded-2xl border px-4 py-3"
                    >
                      {QUICK_QUANTITY_SLAB_SYSTEM_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      Temel tipi
                    </span>
                    <select
                      data-testid="hizli-metraj-select-temel"
                      value={form.temelTipi}
                      onChange={(event) => updateField("temelTipi", event.target.value as QuickQuantityFormState["temelTipi"])}
                      className="tool-input h-12 w-full rounded-2xl border px-4 py-3"
                    >
                      {QUICK_QUANTITY_FOUNDATION_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      Zemin sınıfı
                    </span>
                    <select
                      data-testid="hizli-metraj-select-zemin"
                      value={form.zeminSinifi}
                      onChange={(event) => updateField("zeminSinifi", event.target.value as QuickQuantityFormState["zeminSinifi"])}
                      className="tool-input h-12 w-full rounded-2xl border px-4 py-3"
                    >
                      {QUICK_QUANTITY_SOIL_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      Deprem talebi
                    </span>
                    <select
                      data-testid="hizli-metraj-select-deprem"
                      value={form.depremTalebi}
                      onChange={(event) =>
                        updateField(
                          "depremTalebi",
                          event.target.value as QuickQuantityFormState["depremTalebi"]
                        )
                      }
                      className="tool-input h-12 w-full rounded-2xl border px-4 py-3"
                    >
                      {QUICK_QUANTITY_SEISMIC_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    {depremTalebiDescription ? (
                      <p className="mt-2 text-xs leading-6 text-zinc-500">{depremTalebiDescription}</p>
                    ) : null}
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      Plan kompaktlığı
                    </span>
                    <select
                      data-testid="hizli-metraj-select-plan"
                      value={form.planKompaktligi}
                      onChange={(event) =>
                        updateField(
                          "planKompaktligi",
                          event.target.value as QuickQuantityFormState["planKompaktligi"]
                        )
                      }
                      className="tool-input h-12 w-full rounded-2xl border px-4 py-3"
                    >
                      {QUICK_QUANTITY_PLAN_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    {planKompaktligiDescription ? (
                      <p className="mt-2 text-xs leading-6 text-zinc-500">{planKompaktligiDescription}</p>
                    ) : null}
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      Bodrum çevre perdesi
                    </span>
                    <select
                      data-testid="hizli-metraj-select-perde"
                      value={form.bodrumCevrePerdesi}
                      disabled={!bodrumAktif}
                      onChange={(event) =>
                        updateField(
                          "bodrumCevrePerdesi",
                          event.target.value as QuickQuantityFormState["bodrumCevrePerdesi"]
                        )
                      }
                      className="tool-input h-12 w-full rounded-2xl border px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {QUICK_QUANTITY_RETAINING_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    {bodrumPerdesiDescription ? (
                      <p className="mt-2 text-xs leading-6 text-zinc-500">{bodrumPerdesiDescription}</p>
                    ) : null}
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      Tipik açıklık
                    </span>
                    <select
                      data-testid="hizli-metraj-select-aciklik"
                      value={form.tipikAciklik}
                      onChange={(event) =>
                        updateField(
                          "tipikAciklik",
                          event.target.value as QuickQuantityFormState["tipikAciklik"]
                        )
                      }
                      className="tool-input h-12 w-full rounded-2xl border px-4 py-3"
                    >
                      {QUICK_QUANTITY_SPAN_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    {tipikAciklikDescription ? (
                      <p className="mt-2 text-xs leading-6 text-zinc-500">{tipikAciklikDescription}</p>
                    ) : null}
                  </label>

                  <label className="sm:col-span-2 flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white/70 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                    <input
                      type="checkbox"
                      checked={form.resmiSinifOverride}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setNormalizedForm((current) => ({
                          ...current,
                          resmiSinifOverride: checked,
                          resmiGrup: checked ? current.resmiGrup : preset.officialSelection.grup,
                          resmiSinif: checked ? current.resmiSinif : preset.officialSelection.sinif,
                        }));
                      }}
                    />
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Resmî sınıfı elle sabitle
                    </span>
                  </label>

                  {form.resmiSinifOverride ? (
                    <>
                      <label className="block">
                        <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                          Resmî grup
                        </span>
                        <select
                          data-testid="hizli-metraj-select-official-group"
                          value={form.resmiGrup}
                          onChange={(event) => updateField("resmiGrup", event.target.value)}
                          className="tool-input h-12 w-full rounded-2xl border px-4 py-3"
                        >
                          {groupOptions.map((group) => (
                            <option key={group} value={group}>
                              {group}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                          Resmî sınıf
                        </span>
                        <select
                          data-testid="hizli-metraj-select-official-class"
                          value={form.resmiSinif}
                          onChange={(event) => updateField("resmiSinif", event.target.value)}
                          className="tool-input h-12 w-full rounded-2xl border px-4 py-3"
                        >
                          {classOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>

          <section aria-live="polite" className="flex flex-col gap-6">
            {resultError ? (
              <div
                data-testid="hizli-metraj-error"
                className={cn(
                  "rounded-[32px] border p-6 shadow-sm",
                  !supportedOfficialSelection ? ISSUE_CLASSES.error : ISSUE_CLASSES.warning
                )}
              >
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-1 h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="text-2xl font-black tracking-tight">Metraj sonucu üretilemedi</p>
                    <p className="mt-3 text-sm leading-7">{resultError}</p>
                    {!supportedOfficialSelection ? (
                      <Link
                        href={buildPathWithSearch(
                          "/hesaplamalar/resmi-birim-maliyet-2026",
                          new URLSearchParams({
                            mod: "manual",
                            grup: parsed.resolvedSelection.grup,
                            sinif: parsed.resolvedSelection.sinif,
                          })
                        )}
                        className="mt-5 inline-flex items-center gap-2 text-sm font-black"
                      >
                        Resmî Birim Maliyet aracına git
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : result ? (
              <>
                <section className="rounded-[32px] border border-zinc-200/80 bg-white/85 p-6 shadow-sm backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/75">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                        Sonuç özeti
                      </p>
                      <h2 className="mt-2 text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
                        Beton, donatı ve kalıp dengesi
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        data-testid="hizli-metraj-pdf-preview-button"
                        onClick={async () => {
                          setPdfError(null);
                          try {
                            const { openQuickQuantityPdfPreview } = await loadQuickQuantityReportingModule();
                            openQuickQuantityPdfPreview({
                              result,
                              formattedDate: PDF_DATE_FORMATTER.format(new Date()),
                            });
                          } catch (error) {
                            setPdfError(getPreviewErrorMessage(error));
                          }
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-black text-zinc-700 transition-colors hover:border-teal-300 hover:text-teal-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:text-teal-200"
                      >
                        <FileText className="h-4 w-4" />
                        PDF önizleme
                      </button>
                      <button
                        type="button"
                        data-testid="hizli-metraj-pdf-download-button"
                        onClick={async () => {
                          setPdfError(null);
                          try {
                            const { downloadQuickQuantityPdf } = await loadQuickQuantityReportingModule();
                            downloadQuickQuantityPdf(
                              {
                                result,
                                formattedDate: PDF_DATE_FORMATTER.format(new Date()),
                              },
                              getPdfFilename(result)
                            );
                          } catch (error) {
                            setPdfError(getPreviewErrorMessage(error));
                          }
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-black text-zinc-700 transition-colors hover:border-teal-300 hover:text-teal-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:text-teal-200"
                      >
                        <Download className="h-4 w-4" />
                        PDF indir
                      </button>
                      <button
                        type="button"
                        data-testid="hizli-metraj-pdf-print-button"
                        onClick={async () => {
                          setPdfError(null);
                          try {
                            const { printQuickQuantityPdf } = await loadQuickQuantityReportingModule();
                            printQuickQuantityPdf({
                              result,
                              formattedDate: PDF_DATE_FORMATTER.format(new Date()),
                            });
                          } catch (error) {
                            setPdfError(getPreviewErrorMessage(error));
                          }
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-black text-zinc-700 transition-colors hover:border-teal-300 hover:text-teal-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:text-teal-200"
                      >
                        <Printer className="h-4 w-4" />
                        Yazdır
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[24px] border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Toplam alan</p>
                      <p data-testid="hizli-metraj-result-total-area" className="mt-3 font-mono text-3xl font-black text-zinc-950 dark:text-white">
                        {formatSayi(result.toplamInsaatAlaniM2, 1)}
                      </p>
                      <p className="text-xs text-zinc-500">m²</p>
                      <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                        Normal: {formatSayi(result.toplamNormalAlanM2, 1)} m² · Bodrum:{" "}
                        {formatSayi(result.toplamBodrumAlanM2, 1)} m²
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Beton</p>
                      <p data-testid="hizli-metraj-result-beton" className="mt-3 font-mono text-3xl font-black text-zinc-950 dark:text-white">
                        {formatSayi(result.betonM3, 1)}
                      </p>
                      <p className="text-xs text-zinc-500">m³</p>
                      <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                        {formatSayi(result.yogunlukOzet.betonM3PerM2, 3)} m³/m²
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Donatı</p>
                      <p data-testid="hizli-metraj-result-donati" className="mt-3 font-mono text-3xl font-black text-zinc-950 dark:text-white">
                        {formatSayi(result.donatiTon, 2)}
                      </p>
                      <p className="text-xs text-zinc-500">ton</p>
                      <p
                        data-testid="hizli-metraj-result-rebar-intensity"
                        className="mt-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400"
                      >
                        {formatSayi(result.donatiKg / result.toplamInsaatAlaniM2, 1)} kg/m²
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Kalıp</p>
                      <p data-testid="hizli-metraj-result-kalip" className="mt-3 font-mono text-3xl font-black text-zinc-950 dark:text-white">
                        {formatSayi(result.kalipM2, 1)}
                      </p>
                      <p className="text-xs text-zinc-500">m²</p>
                      <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                        {formatSayi(result.yogunlukOzet.kalipM2PerM2, 2)} m²/m²
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-teal-500/20 bg-teal-50/70 p-4 dark:border-teal-500/30 dark:bg-teal-500/10">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                        Doğrudan taşıyıcı maliyet
                      </p>
                      <p data-testid="hizli-metraj-result-direct-cost" className="mt-3 font-mono text-2xl font-black text-zinc-950 dark:text-white">
                        {formatTL(result.dogrudanTasiyiciMaliyet)}
                      </p>
                      <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                        Beton + donatı + kalıp · {result.priceBook.monthLabel}
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-sky-500/20 bg-sky-50/70 p-4 dark:border-sky-500/30 dark:bg-sky-500/10">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
                        Resmî toplam
                      </p>
                      <p data-testid="hizli-metraj-result-official-cost" className="mt-3 font-mono text-2xl font-black text-zinc-950 dark:text-white">
                        {formatTL(result.officialResult.resmiToplamMaliyet)}
                      </p>
                      <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                        {result.officialResult.row.sinifKodu} · {result.officialResult.row.sinifAdi}
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-emerald-500/20 bg-emerald-50/70 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                        Taşıyıcı payı
                      </p>
                      <p data-testid="hizli-metraj-result-carrying-share" className="mt-3 font-mono text-2xl font-black text-zinc-950 dark:text-white">
                        {formatYuzde(result.tasiyiciPayi.actual)}
                      </p>
                      <p
                        data-testid="hizli-metraj-share-band"
                        className="mt-2 text-xs text-zinc-600 dark:text-zinc-400"
                      >
                        Bant: {formatYuzde(result.tasiyiciPayi.low)} / {formatYuzde(
                          result.tasiyiciPayi.expected
                        )} / {formatYuzde(result.tasiyiciPayi.high)}
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-violet-500/20 bg-violet-50/70 p-4 dark:border-violet-500/30 dark:bg-violet-500/10">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
                        Genişletilmiş kaba yapı
                      </p>
                      <p className="mt-3 font-mono text-2xl font-black text-zinc-950 dark:text-white">
                        {formatTL(result.genisletilmisKabaYapiBandi.expectedAmount)}
                      </p>
                      <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                        Low / High: {formatTL(result.genisletilmisKabaYapiBandi.lowAmount)} / {formatTL(
                          result.genisletilmisKabaYapiBandi.highAmount
                        )}
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                        Doğrudan maliyet / m²
                      </p>
                      <p className="mt-3 font-mono text-2xl font-black text-zinc-950 dark:text-white">
                        {formatTL(result.yogunlukOzet.directCostPerM2).replace(" TL", " TL/m²")}
                      </p>
                      <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                        Brüt inşaat alanına göre
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                        Yaklaşık çevre uzunluğu
                      </p>
                      <p className="mt-3 font-mono text-2xl font-black text-zinc-950 dark:text-white">
                        {formatSayi(result.geometriOzet.perimeterM, 1)}
                      </p>
                      <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">m</p>
                    </div>
                    <div className="rounded-[24px] border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                        Bodrum perde yüzeyi
                      </p>
                      <p className="mt-3 font-mono text-2xl font-black text-zinc-950 dark:text-white">
                        {formatSayi(result.geometriOzet.basementWallAreaM2, 1)}
                      </p>
                      <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">m²</p>
                    </div>
                    <div className="rounded-[24px] border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                        Yardımcı kaba iş bandı
                      </p>
                      <p className="mt-3 font-mono text-2xl font-black text-zinc-950 dark:text-white">
                        {formatTL(result.yardimciKabaIsBandi.expectedAmount)}
                      </p>
                      <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                        {formatYuzde(result.yardimciKabaIsBandi.expected)} oran kabulü
                      </p>
                    </div>
                  </div>

                  {pdfError ? (
                    <div className={cn("mt-4 rounded-2xl border px-4 py-3 text-sm", ISSUE_CLASSES.error)}>
                      {pdfError}
                    </div>
                  ) : null}
                </section>

                <section className="rounded-[32px] border border-zinc-200/80 bg-white/85 p-6 shadow-sm backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/75">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                        Karar özeti
                      </p>
                      <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
                        Mühendis ve muhasebe odakları
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                        Bu panel, hangi grup ve hangi saha şartının sonucu sürüklediğini tek ekranda
                        özetler.
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                    {result.kararOzetleri.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "rounded-[24px] border px-4 py-4 shadow-sm",
                          ISSUE_CLASSES[item.tone]
                        )}
                      >
                        <p className="text-[11px] font-black uppercase tracking-[0.18em]">
                          {item.title}
                        </p>
                        <p className="mt-3 text-lg font-black tracking-tight">{item.value}</p>
                        <p className="mt-3 text-sm leading-7 opacity-90">{item.note}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.96fr_1.04fr]">
                  <div className="rounded-[32px] border border-zinc-200/80 bg-white/85 p-6 shadow-sm backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/75">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                      Mühendislik kontrolü
                    </p>
                    <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
                      Yoğunluk ve benchmark paneli
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                      Bu kıyas, seçilen arketipin Türkiye betonarme pratiğindeki tipik referans bandına
                      göre okunmalıdır; statik proje doğrulamasının yerine geçmez.
                    </p>
                    <div className="mt-5 space-y-3">
                      {result.benchmarklar.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-[24px] border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-black text-zinc-950 dark:text-zinc-100">
                                {item.label}
                              </p>
                              <p className="mt-1 text-xs leading-6 text-zinc-500">{item.helper}</p>
                            </div>
                            <span
                              className={cn(
                                "rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em]",
                                BENCHMARK_CLASSES[item.status]
                              )}
                            >
                              {getBenchmarkLabel(item.status)}
                            </span>
                          </div>
                          <div className="mt-4 grid gap-3 md:grid-cols-[0.95fr_1.05fr]">
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Hesaplanan değer</p>
                              <p className="mt-2 font-mono text-xl font-black text-zinc-950 dark:text-white">
                                {formatBenchmarkValue(item.value, item.unit)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Referans bant</p>
                              <p className="mt-2 font-mono text-sm font-bold text-zinc-700 dark:text-zinc-300">
                                {formatBenchmarkValue(item.band.low, item.unit)} /{" "}
                                {formatBenchmarkValue(item.band.expected, item.unit)} /{" "}
                                {formatBenchmarkValue(item.band.high, item.unit)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[32px] border border-zinc-200/80 bg-white/85 p-6 shadow-sm backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/75">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                      Yardımcı kaba iş metrajı
                    </p>
                    <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
                      Kazı, bohçalama ve drenaj ön keşfi
                    </h3>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      {result.yardimciMetrajlar.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-[24px] border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80"
                        >
                          <p className="text-sm font-black text-zinc-950 dark:text-zinc-100">
                            {item.label}
                          </p>
                          <p className="mt-3 font-mono text-2xl font-black text-zinc-950 dark:text-white">
                            {formatSayi(item.quantity, item.unit === "m" ? 1 : 2)}
                          </p>
                          <p className="text-xs text-zinc-500">{item.unit}</p>
                          <p className="mt-3 text-xs leading-6 text-zinc-500">{item.basis}</p>
                          <p className="mt-2 text-xs leading-6 text-zinc-600 dark:text-zinc-400">
                            {item.note}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 rounded-[24px] border border-teal-300/50 bg-teal-50/70 p-4 dark:border-teal-500/30 dark:bg-teal-500/10">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-zinc-950 dark:text-zinc-100">
                            Yardımcı kaba iş maliyet bandı
                          </p>
                          <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                            {result.yardimciKabaIsBandi.note}
                          </p>
                        </div>
                        <p className="font-mono text-2xl font-black text-zinc-950 dark:text-white">
                          {formatTL(result.yardimciKabaIsBandi.expectedAmount)}
                        </p>
                      </div>
                      <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
                        Low / High: {formatTL(result.yardimciKabaIsBandi.lowAmount)} /{" "}
                        {formatTL(result.yardimciKabaIsBandi.highAmount)}
                      </p>
                    </div>

                    <div className="mt-5 rounded-[24px] border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-zinc-950 dark:text-zinc-100">
                            Yardımcı iş muhasebe dağılımı
                          </p>
                          <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                            Poz bazlı olmayan band, bu ekranda hangi yardımcı kalemde yoğunlaştığını
                            gösterecek şekilde paylaştırılır.
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-3">
                        {result.yardimciKabaIsDagilimi.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-[20px] border border-zinc-200/80 bg-white/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/70"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-black text-zinc-950 dark:text-zinc-100">
                                  {item.label}
                                </p>
                                <p className="mt-1 text-xs leading-6 text-zinc-500">{item.note}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-mono text-lg font-black text-zinc-950 dark:text-white">
                                  {formatTL(item.amount)}
                                </p>
                                <p className="text-xs text-zinc-500">{formatYuzde(item.share)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
                  <div className="rounded-[32px] border border-zinc-200/80 bg-white/85 p-6 shadow-sm backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/75">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                      Dağılım
                    </p>
                    <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
                      Grup bazında kaba taşıyıcı sistem
                    </h3>
                    <div className="mt-5 space-y-4">
                      {result.breakdowns.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-[26px] border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-black text-zinc-950 dark:text-zinc-100">
                                {item.label}
                              </p>
                              <p className="mt-1 text-xs text-zinc-500">{item.basisLabel}: {formatSayi(item.basisAreaM2, 1)} m²</p>
                            </div>
                            <div className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                              {formatYuzde(item.directCostShare)}
                            </div>
                          </div>
                          <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Beton</p>
                              <p
                                data-testid={`hizli-metraj-breakdown-${item.id}-beton`}
                                className="mt-2 font-mono text-xl font-black text-zinc-950 dark:text-white"
                              >
                                {formatSayi(item.betonM3, 2)}
                              </p>
                              <p className="text-xs text-zinc-500">{formatSayi(item.betonM3PerM2, 3)} m³/m²</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Donatı</p>
                              <p
                                data-testid={`hizli-metraj-breakdown-${item.id}-donati`}
                                className="mt-2 font-mono text-xl font-black text-zinc-950 dark:text-white"
                              >
                                {formatSayi(item.donatiTon, 2)}
                              </p>
                              <p className="text-xs text-zinc-500">{formatSayi(item.donatiKgPerM2, 1)} kg/m²</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Kalıp</p>
                              <p
                                data-testid={`hizli-metraj-breakdown-${item.id}-kalip`}
                                className="mt-2 font-mono text-xl font-black text-zinc-950 dark:text-white"
                              >
                                {formatSayi(item.kalipM2, 2)}
                              </p>
                              <p className="text-xs text-zinc-500">{formatSayi(item.kalipM2PerM2, 2)} m²/m²</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <section className="rounded-[32px] border border-zinc-200/80 bg-white/85 p-6 shadow-sm backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/75">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                        Kullanılan katsayılar
                      </p>
                      <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
                        Şeffaf katsayı tablosu
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                        İlk tablo nihai yoğunlukları, ikinci tablo ise hesapta gerçekten etkili olan çarpanları
                        gösterir. Nötr kalan x1,00 etkiler gereksiz gürültü oluşturmamak için çıkarılır.
                      </p>
                      <div className="mt-5 overflow-hidden rounded-[24px] border border-zinc-200/80 dark:border-zinc-800">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-zinc-100/90 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                            <tr>
                              <th className="px-4 py-3 font-black">Grup</th>
                              <th className="px-4 py-3 font-black">Beton</th>
                              <th className="px-4 py-3 font-black">Donatı</th>
                              <th className="px-4 py-3 font-black">Kalıp</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.breakdowns.map((item) => (
                              <tr key={item.id} className="border-t border-zinc-200/80 dark:border-zinc-800">
                                <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                                  {item.label}
                                </td>
                                <td className="px-4 py-3 font-mono text-zinc-700 dark:text-zinc-300">
                                  {formatSayi(item.betonM3PerM2, 3)}
                                </td>
                                <td className="px-4 py-3 font-mono text-zinc-700 dark:text-zinc-300">
                                  {formatSayi(item.donatiKgPerM2, 1)}
                                </td>
                                <td className="px-4 py-3 font-mono text-zinc-700 dark:text-zinc-300">
                                  {formatSayi(item.kalipM2PerM2, 2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-5 overflow-hidden rounded-[24px] border border-zinc-200/80 dark:border-zinc-800">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-zinc-100/90 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                            <tr>
                              <th className="px-4 py-3 font-black">Etki</th>
                              <th className="px-4 py-3 font-black">Hedef</th>
                              <th className="px-4 py-3 font-black">Beton</th>
                              <th className="px-4 py-3 font-black">Donatı</th>
                              <th className="px-4 py-3 font-black">Kalıp</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.appliedFactors.map((factor) => (
                              <tr key={factor.id} className="border-t border-zinc-200/80 dark:border-zinc-800">
                                <td className="px-4 py-3 align-top font-semibold text-zinc-900 dark:text-zinc-100">
                                  {factor.label}
                                  {factor.note ? (
                                    <p className="mt-1 text-xs font-normal leading-6 text-zinc-500">
                                      {factor.note}
                                    </p>
                                  ) : null}
                                </td>
                                <td className="px-4 py-3 font-mono text-zinc-700 dark:text-zinc-300">
                                  {FACTOR_TARGET_LABELS[factor.target]}
                                </td>
                                <td className="px-4 py-3 font-mono text-zinc-700 dark:text-zinc-300">
                                  x{formatSayi(factor.betonFactor, 2)}
                                </td>
                                <td className="px-4 py-3 font-mono text-zinc-700 dark:text-zinc-300">
                                  x{formatSayi(factor.donatiFactor, 2)}
                                </td>
                                <td className="px-4 py-3 font-mono text-zinc-700 dark:text-zinc-300">
                                  x{formatSayi(factor.kalipFactor, 2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>

                    <section className="rounded-[32px] border border-zinc-200/80 bg-white/85 p-6 shadow-sm backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/75">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                        Poz ve fiyat dayanakları
                      </p>
                      <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
                        {result.priceBook.monthLabel} snapshot
                      </h3>
                      <div className="mt-5 space-y-3">
                        <div className="rounded-[24px] border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                          <p className="text-sm font-black text-zinc-950 dark:text-zinc-100">
                            {result.priceBook.entries.concreteC30_37.pozNo} · {result.priceBook.entries.concreteC30_37.label}
                          </p>
                          <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                            {result.priceBook.entries.concreteC30_37.description}
                          </p>
                          <p className="mt-3 font-mono text-lg font-black text-zinc-950 dark:text-white">
                            {formatTL(result.betonBirimFiyat).replace(" TL", " TL/m³")}
                          </p>
                        </div>
                        <div className="rounded-[24px] border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                          <p className="text-sm font-black text-zinc-950 dark:text-zinc-100">
                            {result.priceBook.entries.rebar8To12.pozNo} + {result.priceBook.entries.rebar14To28.pozNo}
                          </p>
                          <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                            {result.priceBook.weightedRebarNote}
                          </p>
                          <p className="mt-3 font-mono text-lg font-black text-zinc-950 dark:text-white">
                            {formatTL(result.donatiBirimFiyat).replace(" TL", " TL/ton")}
                          </p>
                        </div>
                        <div className="rounded-[24px] border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                          <p className="text-sm font-black text-zinc-950 dark:text-zinc-100">
                            {result.priceBook.entries.formworkPlywood.pozNo} · {result.priceBook.entries.formworkPlywood.label}
                          </p>
                          <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                            {result.priceBook.entries.formworkPlywood.description}
                          </p>
                          <p className="mt-3 font-mono text-lg font-black text-zinc-950 dark:text-white">
                            {formatTL(result.kalipBirimFiyat).replace(" TL", " TL/m²")}
                          </p>
                        </div>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-3">
                        <Link
                          href={result.priceBook.sourceUrl}
                          target="_blank"
                          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-black text-zinc-700 transition-colors hover:border-teal-300 hover:text-teal-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:text-teal-200"
                        >
                          YFK Mart 2026 PDF
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                          href="https://webdosya.csb.gov.tr/v2/yfk/2026/02/M-MARLIK-M-HEND-SL-K-TEBL-2026-20260204101544.pdf"
                          target="_blank"
                          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-black text-zinc-700 transition-colors hover:border-sky-300 hover:text-sky-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:text-sky-200"
                        >
                          2026 Tebliğ PDF
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </section>
                  </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
                  <div className="rounded-[32px] border border-zinc-200/80 bg-white/85 p-6 shadow-sm backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/75">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                      Uyarılar
                    </p>
                    <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
                      Yorum sınırları
                    </h3>
                    <div className="mt-5 space-y-3">
                      {result.warnings.map((warning, index) => (
                        <div
                          key={`${warning.tone}-${index}`}
                          className={cn("rounded-[24px] border px-4 py-3 text-sm leading-7", ISSUE_CLASSES[warning.tone])}
                        >
                          {warning.message}
                        </div>
                      ))}
                      {result.notes.map((note) => (
                        <div
                          key={note}
                          className="rounded-[24px] border border-zinc-200/80 bg-zinc-50/80 px-4 py-3 text-sm leading-7 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300"
                        >
                          {note}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[32px] border border-zinc-200/80 bg-white/85 p-6 shadow-sm backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/75">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                      Bir sonraki adım
                    </p>
                    <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
                      Maliyete ve benchmark’a geçin
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                      Bu ekrandaki kaba taşıyıcı sistem çıktısını detaylı inşaat maliyeti ve resmî
                      yaklaşık maliyet kıyası ile birlikte büyütebilirsiniz.
                    </p>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <Link
                        data-testid="hizli-metraj-next-step-link"
                        href={buildConstructionCostHref(result)}
                        className="group rounded-[28px] border border-zinc-200 bg-zinc-50 p-5 transition-all hover:-translate-y-1 hover:border-teal-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                      >
                        <p className="text-sm font-black text-zinc-950 dark:text-zinc-100">
                          İnşaat Maliyeti Analizi
                        </p>
                        <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                          Alan, kat ve resmî sınıf bağlamını taşıyarak senaryo maliyet ekranına geçin.
                        </p>
                        <div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-teal-700 dark:text-teal-300">
                          Analize git
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </Link>
                      <Link
                        href={buildOfficialCostHref(result)}
                        className="group rounded-[28px] border border-zinc-200 bg-zinc-50 p-5 transition-all hover:-translate-y-1 hover:border-sky-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                      >
                        <p className="text-sm font-black text-zinc-950 dark:text-zinc-100">
                          Resmî Birim Maliyet 2026
                        </p>
                        <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                          Aynı toplam alan ve sınıf ile resmî yaklaşık maliyet ekranına geçin.
                        </p>
                        <div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-sky-700 dark:text-sky-300">
                          Benchmark’a git
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </Link>
                    </div>
                  </div>
                </section>
              </>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
