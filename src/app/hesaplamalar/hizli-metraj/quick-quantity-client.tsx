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
  info: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  error: "border-rose-500/30 bg-rose-500/10 text-rose-300",
} as const;

const BENCHMARK_CLASSES = {
  dusuk: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  beklenen: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  yuksek: "border-amber-500/30 bg-amber-500/10 text-amber-300",
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
      <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-8 lg:px-12 md:py-12">
        <section className="mb-8 rounded-3xl border border-blue-500/20 bg-[#090d26]/85 p-6 md:p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/15 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <Layers3 className="h-4 w-4" />
                Taşıyıcı Sistem Ön Keşfi
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
                Hızlı Metraj Hesaplayıcı
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
                Kat alanı, kat sayısı, deprem talebi, plan kompaktlığı ve bodrum çevre perdesi
                kararlarına göre yaklaşık beton, donatı, kalıp ve kaba taşıyıcı maliyet bandını tek
                ekranda görün. Aynı akışta yardımcı kaba iş metrajını ve 2026 resmî yaklaşık
                maliyet kıyasını da izleyin.
              </p>
            </div>

            <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-br from-[#121945] via-[#0c1236] to-[#070b24] p-6 text-white shadow-[0_20px_50px_rgba(37,99,235,0.25)]">
              <div className="flex h-full flex-col justify-between gap-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-300">
                    Aktif Mühendislik Profili
                  </p>
                  <h2 className="mt-1.5 text-2xl font-black tracking-tight text-white">
                    {preset.shortLabel}
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">
                    {preset.applicationNote}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-[#070a20] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      Önerilen Resmî Bant
                    </p>
                    <p className="mt-1 font-mono text-2xl font-black text-blue-300">
                      {preset.officialSelection.grup}-{preset.officialSelection.sinif}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-400">
                      Taşıyıcı Payı Hedefi
                    </p>
                    <p className="mt-1 font-mono text-2xl font-black text-emerald-300">
                      {formatYuzde(preset.carryingShareBand.expected)}
                    </p>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 text-xs">
                  <div className="rounded-xl border border-white/5 bg-[#070a20] px-3.5 py-2.5">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400 font-bold">Taşıyıcı Sistem</p>
                    <p className="mt-0.5 font-bold text-white">{tasiyiciSistemLabel}</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-[#070a20] px-3.5 py-2.5">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400 font-bold">Döşeme Sistemi</p>
                    <p className="mt-0.5 font-bold text-white">{dosemeSistemiLabel}</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-[#070a20] px-3.5 py-2.5">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400 font-bold">Temel Tipi</p>
                    <p className="mt-0.5 font-bold text-white">{temelTipiLabel}</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-[#070a20] px-3.5 py-2.5">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400 font-bold">Zemin Sınıfı</p>
                    <p className="mt-0.5 font-bold text-white">{zeminSinifiLabel}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <section className="rounded-3xl border border-blue-500/20 bg-[#090d26]/85 p-6 md:p-7 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-300">
                  Hızlı Mod
                </p>
                <h2 className="mt-1.5 text-2xl font-black tracking-tight text-white">
                  Bina Tipini ve Kaba Boyutları Girin
                </h2>
              </div>
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/15 p-2.5 text-blue-400">
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
                      "rounded-2xl border p-4 text-left transition-all",
                      isActive
                        ? "border-blue-500 bg-blue-500/15 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                        : "border-white/10 bg-[#070a20] text-slate-300 hover:border-blue-500/40 hover:bg-[#0c1236]"
                    )}
                  >
                    <p className="text-sm font-bold text-white">{item.shortLabel}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{item.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Kat Alanı (m²)
                </span>
                <input
                  data-testid="hizli-metraj-input-kat-alani"
                  value={form.katAlaniM2}
                  onChange={(event) => updateField("katAlaniM2", event.target.value)}
                  inputMode="decimal"
                  className="h-12 w-full rounded-xl border border-white/15 bg-[#070a20] px-4 py-3 font-mono text-sm font-bold text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Normal Kat Sayısı
                </span>
                <input
                  data-testid="hizli-metraj-input-normal-kat"
                  value={form.normalKatSayisi}
                  onChange={(event) => updateField("normalKatSayisi", event.target.value)}
                  inputMode="numeric"
                  className="h-12 w-full rounded-xl border border-white/15 bg-[#070a20] px-4 py-3 font-mono text-sm font-bold text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Bodrum Kat Sayısı
                </span>
                <input
                  data-testid="hizli-metraj-input-bodrum-kat"
                  value={form.bodrumKatSayisi}
                  onChange={(event) => updateField("bodrumKatSayisi", event.target.value)}
                  inputMode="numeric"
                  className="h-12 w-full rounded-xl border border-white/15 bg-[#070a20] px-4 py-3 font-mono text-sm font-bold text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Bodrum Kat Alanı (m²)
                </span>
                <input
                  data-testid="hizli-metraj-input-bodrum-alan"
                  value={form.bodrumKatAlaniM2}
                  onChange={(event) => updateField("bodrumKatAlaniM2", event.target.value)}
                  inputMode="decimal"
                  disabled={!bodrumAktif}
                  placeholder="Boş bırakılırsa kat alanı kullanılır"
                  className="h-12 w-full rounded-xl border border-white/15 bg-[#070a20] px-4 py-3 font-mono text-sm font-bold text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-40"
                />
                <p className="text-xs text-slate-400">
                  {bodrumAktif
                    ? "Bodrum alanı boş bırakılırsa normal kat alanı kabul edilir."
                    : "Bodrum kat sayısı 0 iken bu alan devre dışıdır."}
                </p>
              </label>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-[#070a20] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-300">
                    Resmî Sınıf
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">
                    {parsed.resolvedSelection.grup}-{parsed.resolvedSelection.sinif}
                    {activeOfficialRow ? ` · ${activeOfficialRow.sinifAdi}` : ""}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em]",
                    supportedOfficialSelection
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-rose-500/30 bg-rose-500/10 text-rose-300"
                  )}
                >
                  {supportedOfficialSelection ? "Desteklenen bant" : "Destek dışı bant"}
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-[#070a20] p-4">
              <button
                type="button"
                data-testid="hizli-metraj-advanced-toggle"
                onClick={() => updateField("showAdvanced", !form.showAdvanced)}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Gelişmiş Parametreler
                </span>
                <span className="rounded-lg border border-white/10 bg-[#0c1233] px-2.5 py-1 text-xs font-bold text-white">
                  {form.showAdvanced ? "Kapat" : "Aç"}
                </span>
              </button>

              {form.showAdvanced ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Taşıyıcı Sistem
                    </span>
                    <select
                      data-testid="hizli-metraj-select-tasiyici"
                      value={form.tasiyiciSistem}
                      onChange={(event) => updateField("tasiyiciSistem", event.target.value as QuickQuantityFormState["tasiyiciSistem"])}
                      className="h-12 w-full rounded-xl border border-white/15 bg-[#0c1233] px-4 py-3 text-xs font-bold text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                    >
                      {QUICK_QUANTITY_STRUCTURAL_SYSTEM_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value} className="bg-[#070a20] text-white">
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Döşeme Sistemi
                    </span>
                    <select
                      data-testid="hizli-metraj-select-doseme"
                      value={form.dosemeSistemi}
                      onChange={(event) => updateField("dosemeSistemi", event.target.value as QuickQuantityFormState["dosemeSistemi"])}
                      className="h-12 w-full rounded-xl border border-white/15 bg-[#0c1233] px-4 py-3 text-xs font-bold text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                    >
                      {QUICK_QUANTITY_SLAB_SYSTEM_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value} className="bg-[#070a20] text-white">
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Temel Tipi
                    </span>
                    <select
                      data-testid="hizli-metraj-select-temel"
                      value={form.temelTipi}
                      onChange={(event) => updateField("temelTipi", event.target.value as QuickQuantityFormState["temelTipi"])}
                      className="h-12 w-full rounded-xl border border-white/15 bg-[#0c1233] px-4 py-3 text-xs font-bold text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                    >
                      {QUICK_QUANTITY_FOUNDATION_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value} className="bg-[#070a20] text-white">
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Zemin Sınıfı
                    </span>
                    <select
                      data-testid="hizli-metraj-select-zemin"
                      value={form.zeminSinifi}
                      onChange={(event) => updateField("zeminSinifi", event.target.value as QuickQuantityFormState["zeminSinifi"])}
                      className="h-12 w-full rounded-xl border border-white/15 bg-[#0c1233] px-4 py-3 text-xs font-bold text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                    >
                      {QUICK_QUANTITY_SOIL_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value} className="bg-[#070a20] text-white">
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Deprem Talebi
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
                      className="h-12 w-full rounded-xl border border-white/15 bg-[#0c1233] px-4 py-3 text-xs font-bold text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                    >
                      {QUICK_QUANTITY_SEISMIC_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value} className="bg-[#070a20] text-white">
                          {item.label}
                        </option>
                      ))}
                    </select>
                    {depremTalebiDescription ? (
                      <p className="text-xs text-slate-400">{depremTalebiDescription}</p>
                    ) : null}
                  </label>

                  <label className="block space-y-1.5">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Plan Kompaktlığı
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
                      className="h-12 w-full rounded-xl border border-white/15 bg-[#0c1233] px-4 py-3 text-xs font-bold text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                    >
                      {QUICK_QUANTITY_PLAN_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value} className="bg-[#070a20] text-white">
                          {item.label}
                        </option>
                      ))}
                    </select>
                    {planKompaktligiDescription ? (
                      <p className="text-xs text-slate-400">{planKompaktligiDescription}</p>
                    ) : null}
                  </label>

                  <label className="block space-y-1.5">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Bodrum Çevre Perdesi
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
                      className="h-12 w-full rounded-xl border border-white/15 bg-[#0c1233] px-4 py-3 text-xs font-bold text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {QUICK_QUANTITY_RETAINING_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value} className="bg-[#070a20] text-white">
                          {item.label}
                        </option>
                      ))}
                    </select>
                    {bodrumPerdesiDescription ? (
                      <p className="text-xs text-slate-400">{bodrumPerdesiDescription}</p>
                    ) : null}
                  </label>

                  <label className="block space-y-1.5">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Tipik Açıklık
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
                      className="h-12 w-full rounded-xl border border-white/15 bg-[#0c1233] px-4 py-3 text-xs font-bold text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                    >
                      {QUICK_QUANTITY_SPAN_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value} className="bg-[#070a20] text-white">
                          {item.label}
                        </option>
                      ))}
                    </select>
                    {tipikAciklikDescription ? (
                      <p className="text-xs text-slate-400">{tipikAciklikDescription}</p>
                    ) : null}
                  </label>

                  <label className="sm:col-span-2 flex items-center gap-3 rounded-xl border border-white/10 bg-[#070a20] px-4 py-3">
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
                      className="h-4 w-4 rounded border-white/20 bg-[#0c1233] text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-white">
                      Resmî Sınıfı Elle Sabitle
                    </span>
                  </label>

                  {form.resmiSinifOverride ? (
                    <>
                      <label className="block space-y-1.5">
                        <span className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                          Resmî Grup
                        </span>
                        <select
                          data-testid="hizli-metraj-select-official-group"
                          value={form.resmiGrup}
                          onChange={(event) => updateField("resmiGrup", event.target.value)}
                          className="h-12 w-full rounded-xl border border-white/15 bg-[#0c1233] px-4 py-3 text-xs font-bold text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                        >
                          {groupOptions.map((group) => (
                            <option key={group} value={group} className="bg-[#070a20] text-white">
                              {group}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block space-y-1.5">
                        <span className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                          Resmî Sınıf
                        </span>
                        <select
                          data-testid="hizli-metraj-select-official-class"
                          value={form.resmiSinif}
                          onChange={(event) => updateField("resmiSinif", event.target.value)}
                          className="h-12 w-full rounded-xl border border-white/15 bg-[#0c1233] px-4 py-3 text-xs font-bold text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                        >
                          {classOptions.map((option) => (
                            <option key={option} value={option} className="bg-[#070a20] text-white">
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
                  "rounded-3xl border p-6 shadow-sm",
                  !supportedOfficialSelection ? ISSUE_CLASSES.error : ISSUE_CLASSES.warning
                )}
              >
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-1 h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="text-xl font-bold tracking-tight text-white">Metraj Sonucu Üretilemedi</p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-300">{resultError}</p>
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
                        className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-blue-400"
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
                <section className="rounded-3xl border border-blue-500/20 bg-[#090d26]/85 p-6 md:p-8 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-300">
                        Sonuç Özeti
                      </p>
                      <h2 className="mt-1.5 text-2xl font-black tracking-tight text-white">
                        Beton, Donatı ve Kalıp Dengesi
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
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#0d1230] px-3.5 py-2 text-xs font-bold text-slate-300 transition-all hover:bg-[#131a44] hover:text-white"
                      >
                        <FileText className="h-4 w-4 text-blue-400" />
                        PDF Önizle
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
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500"
                      >
                        <Download className="h-4 w-4" />
                        PDF İndir
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
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#0d1230] px-3.5 py-2 text-xs font-bold text-slate-300 transition-all hover:bg-[#131a44] hover:text-white"
                      >
                        <Printer className="h-4 w-4 text-blue-400" />
                        Yazdır
                      </button>
                    </div>
                  </div>

                  {/* ── 3-Box HUD + Total Area ── */}
                  <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-[#070a20] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Toplam Alan</p>
                      <p data-testid="hizli-metraj-result-total-area" className="mt-2 font-mono text-3xl font-black text-white">
                        {formatSayi(result.toplamInsaatAlaniM2, 1)}
                      </p>
                      <p className="text-xs text-blue-300 font-bold">m²</p>
                      <p className="mt-1.5 text-xs text-slate-400">
                        Normal: {formatSayi(result.toplamNormalAlanM2, 1)} m² · Bodrum:{" "}
                        {formatSayi(result.toplamBodrumAlanM2, 1)} m²
                      </p>
                    </div>

                    <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-[#121945] via-[#0c1236] to-[#070b24] p-4 shadow-[0_10px_30px_rgba(37,99,235,0.25)]">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-300">Beton (C30/37)</p>
                      <p data-testid="hizli-metraj-result-beton" className="mt-2 font-mono text-3xl font-black text-white">
                        {formatSayi(result.betonM3, 1)}
                      </p>
                      <p className="text-xs text-blue-300 font-bold">m³</p>
                      <p className="mt-1.5 font-mono text-xs text-blue-200">
                        {formatSayi(result.yogunlukOzet.betonM3PerM2, 3)} m³/m²
                      </p>
                    </div>

                    <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-[#1e1045] via-[#140c36] to-[#070b24] p-4 shadow-[0_10px_30px_rgba(139,92,246,0.25)]">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-purple-300">Donatı (B420C)</p>
                      <p data-testid="hizli-metraj-result-donati" className="mt-2 font-mono text-3xl font-black text-white">
                        {formatSayi(result.donatiTon, 2)}
                      </p>
                      <p className="text-xs text-purple-300 font-bold">ton</p>
                      <p
                        data-testid="hizli-metraj-result-rebar-intensity"
                        className="mt-1.5 font-mono text-xs text-purple-200"
                      >
                        {formatSayi(result.donatiKg / result.toplamInsaatAlaniM2, 1)} kg/m²
                      </p>
                    </div>

                    <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-[#141b4d] via-[#0c1236] to-[#070b24] p-4 shadow-[0_10px_30px_rgba(99,102,241,0.25)]">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-300">Kalıp</p>
                      <p data-testid="hizli-metraj-result-kalip" className="mt-2 font-mono text-3xl font-black text-white">
                        {formatSayi(result.kalipM2, 1)}
                      </p>
                      <p className="text-xs text-indigo-300 font-bold">m²</p>
                      <p className="mt-1.5 font-mono text-xs text-indigo-200">
                        {formatSayi(result.yogunlukOzet.kalipM2PerM2, 2)} m²/m²
                      </p>
                    </div>

                    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-300">
                        Doğrudan Taşıyıcı Maliyet
                      </p>
                      <p data-testid="hizli-metraj-result-direct-cost" className="mt-2 font-mono text-2xl font-black text-white">
                        {formatTL(result.dogrudanTasiyiciMaliyet)}
                      </p>
                      <p className="mt-1.5 text-xs text-slate-400">
                        Beton + donatı + kalıp · {result.priceBook.monthLabel}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                        Resmî Yaklaşık Maliyet
                      </p>
                      <p data-testid="hizli-metraj-result-official-cost" className="mt-2 font-mono text-2xl font-black text-white">
                        {formatTL(result.officialResult.resmiToplamMaliyet)}
                      </p>
                      <p className="mt-1.5 text-xs text-slate-400">
                        {result.officialResult.row.sinifKodu} · {result.officialResult.row.sinifAdi}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                        Taşıyıcı Payı
                      </p>
                      <p data-testid="hizli-metraj-result-carrying-share" className="mt-2 font-mono text-2xl font-black text-emerald-300">
                        {formatYuzde(result.tasiyiciPayi.actual)}
                      </p>
                      <p
                        data-testid="hizli-metraj-share-band"
                        className="mt-1.5 font-mono text-xs text-emerald-400"
                      >
                        Bant: {formatYuzde(result.tasiyiciPayi.low)} / {formatYuzde(
                          result.tasiyiciPayi.expected
                        )} / {formatYuzde(result.tasiyiciPayi.high)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-purple-300">
                        Genişletilmiş Kaba Yapı
                      </p>
                      <p className="mt-2 font-mono text-2xl font-black text-white">
                        {formatTL(result.genisletilmisKabaYapiBandi.expectedAmount)}
                      </p>
                      <p className="mt-1.5 text-xs text-slate-400">
                        Low / High: {formatTL(result.genisletilmisKabaYapiBandi.lowAmount)} / {formatTL(
                          result.genisletilmisKabaYapiBandi.highAmount
                        )}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#070a20] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Doğrudan Maliyet / m²
                      </p>
                      <p className="mt-2 font-mono text-2xl font-black text-white">
                        {formatTL(result.yogunlukOzet.directCostPerM2).replace(" TL", " TL/m²")}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Brüt inşaat alanına göre
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#070a20] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Yaklaşık Çevre Uzunluğu
                      </p>
                      <p className="mt-2 font-mono text-2xl font-black text-white">
                        {formatSayi(result.geometriOzet.perimeterM, 1)} <span className="text-xs text-blue-300">m</span>
                      </p>
                      <p className="mt-1 text-xs text-slate-400">Kat geometrisi</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#070a20] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Bodrum Perde Yüzeyi
                      </p>
                      <p className="mt-2 font-mono text-2xl font-black text-white">
                        {formatSayi(result.geometriOzet.basementWallAreaM2, 1)} <span className="text-xs text-blue-300">m²</span>
                      </p>
                      <p className="mt-1 text-xs text-slate-400">Toprak altı yüzey</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#070a20] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Yardımcı Kaba İş Bandı
                      </p>
                      <p className="mt-2 font-mono text-2xl font-black text-white">
                        {formatTL(result.yardimciKabaIsBandi.expectedAmount)}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        %{formatYuzde(result.yardimciKabaIsBandi.expected)} oran kabulü
                      </p>
                    </div>
                  </div>

                  {pdfError ? (
                    <div className={cn("mt-4 rounded-xl border px-4 py-3 text-xs font-semibold", ISSUE_CLASSES.error)}>
                      {pdfError}
                    </div>
                  ) : null}
                </section>

                {/* ── Decision Focus Cards ── */}
                <section className="rounded-3xl border border-blue-500/20 bg-[#090d26]/85 p-6 md:p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-300">
                        Karar Özeti
                      </p>
                      <h3 className="mt-1.5 text-2xl font-black tracking-tight text-white">
                        Mühendis ve Muhasebe Odakları
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                        Bu panel, hangi grup ve hangi saha şartının sonucu sürüklediğini tek ekranda özetler.
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3.5 lg:grid-cols-2 xl:grid-cols-3">
                    {result.kararOzetleri.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "rounded-2xl border p-4 shadow-sm backdrop-blur-md",
                          ISSUE_CLASSES[item.tone]
                        )}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em]">
                          {item.title}
                        </p>
                        <p className="mt-2 text-base font-bold tracking-tight text-white">{item.value}</p>
                        <p className="mt-1.5 text-xs leading-relaxed opacity-90">{item.note}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* ── Benchmark & Excavation ── */}
                <section className="grid gap-6 xl:grid-cols-[0.96fr_1.04fr]">
                  <div className="rounded-3xl border border-blue-500/20 bg-[#090d26]/85 p-6 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-300">
                      Mühendislik Kontrolü
                    </p>
                    <h3 className="mt-1.5 text-2xl font-black tracking-tight text-white">
                      Yoğunluk ve Benchmark Paneli
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                      Bu kıyas, seçilen arketipin Türkiye betonarme pratiğindeki tipik referans bandına göre okunmalıdır.
                    </p>
                    <div className="mt-5 space-y-3">
                      {result.benchmarklar.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-white/10 bg-[#070a20] p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold text-white">
                                {item.label}
                              </p>
                              <p className="mt-0.5 text-[11px] text-slate-400">{item.helper}</p>
                            </div>
                            <span
                              className={cn(
                                "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em]",
                                BENCHMARK_CLASSES[item.status]
                              )}
                            >
                              {getBenchmarkLabel(item.status)}
                            </span>
                          </div>
                          <div className="mt-3.5 grid gap-3 md:grid-cols-[0.95fr_1.05fr]">
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Hesaplanan Değer</p>
                              <p className="mt-1 font-mono text-lg font-black text-white">
                                {formatBenchmarkValue(item.value, item.unit)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Referans Bant</p>
                              <p className="mt-1 font-mono text-xs font-bold text-blue-300">
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

                  <div className="rounded-3xl border border-blue-500/20 bg-[#090d26]/85 p-6 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-300">
                      Yardımcı Kaba İş Metrajı
                    </p>
                    <h3 className="mt-1.5 text-2xl font-black tracking-tight text-white">
                      Kazı, Bohçalama ve Drenaj Ön Keşfi
                    </h3>
                    <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
                      {result.yardimciMetrajlar.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-white/10 bg-[#070a20] p-4"
                        >
                          <p className="text-xs font-bold text-white">
                            {item.label}
                          </p>
                          <p className="mt-2 font-mono text-2xl font-black text-white">
                            {formatSayi(item.quantity, item.unit === "m" ? 1 : 2)}
                            <span className="text-xs text-blue-300 ml-1.5">{item.unit}</span>
                          </p>
                          <p className="mt-2 text-[11px] text-slate-400">{item.basis}</p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {item.note}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-white">
                            Yardımcı Kaba İş Maliyet Bandı
                          </p>
                          <p className="mt-1 text-xs text-slate-300">
                            {result.yardimciKabaIsBandi.note}
                          </p>
                        </div>
                        <p className="font-mono text-xl font-black text-white">
                          {formatTL(result.yardimciKabaIsBandi.expectedAmount)}
                        </p>
                      </div>
                      <p className="mt-2 text-xs text-blue-300 font-mono">
                        Low / High: {formatTL(result.yardimciKabaIsBandi.lowAmount)} /{" "}
                        {formatTL(result.yardimciKabaIsBandi.highAmount)}
                      </p>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-[#070a20] p-4">
                      <p className="text-xs font-bold text-white">
                        Yardımcı İş Dağılımı
                      </p>
                      <div className="mt-3 space-y-2">
                        {result.yardimciKabaIsDagilimi.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between rounded-xl border border-white/5 bg-[#090d26] px-3.5 py-2.5 text-xs"
                          >
                            <div>
                              <p className="font-bold text-white">{item.label}</p>
                              <p className="text-[11px] text-slate-400">{item.note}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono font-bold text-white">{formatTL(item.amount)}</p>
                              <p className="text-[11px] text-blue-300">{formatYuzde(item.share)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* ── Breakdowns & Price Book ── */}
                <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
                  <div className="rounded-3xl border border-blue-500/20 bg-[#090d26]/85 p-6 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-300">
                      Dağılım
                    </p>
                    <h3 className="mt-1.5 text-2xl font-black tracking-tight text-white">
                      Grup Bazında Kaba Taşıyıcı Sistem
                    </h3>
                    <div className="mt-5 space-y-3">
                      {result.breakdowns.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-white/10 bg-[#070a20] p-4 text-xs"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-white">
                                {item.label}
                              </p>
                              <p className="mt-0.5 text-[11px] text-slate-400">{item.basisLabel}: {formatSayi(item.basisAreaM2, 1)} m²</p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-base font-black text-blue-300">
                                {formatTL(item.directCost)}
                              </p>
                              <p className="text-[11px] text-slate-400">{formatYuzde(item.directCostShare)} pay</p>
                            </div>
                          </div>

                          <div className="mt-3 grid gap-2 grid-cols-3 rounded-xl border border-white/5 bg-[#090d26] p-3 text-center">
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase">Beton</p>
                              <p className="font-mono font-bold text-white">{formatSayi(item.betonM3, 1)} m³</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase">Donatı</p>
                              <p className="font-mono font-bold text-white">{formatSayi(item.donatiTon, 2)} ton</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase">Kalıp</p>
                              <p className="font-mono font-bold text-white">{formatSayi(item.kalipM2, 1)} m²</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-blue-500/20 bg-[#090d26]/85 p-6 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-300">
                      Birim Fiyat Seti
                    </p>
                    <h3 className="mt-1.5 text-2xl font-black tracking-tight text-white">
                      YFK Mart 2026 Resmî Rayiçleri
                    </h3>
                    <div className="mt-5 space-y-3">
                      <div className="rounded-2xl border border-white/10 bg-[#070a20] p-4 text-xs">
                        <p className="font-bold text-white">
                          {result.priceBook.entries.concreteC30_37.pozNo} · {result.priceBook.entries.concreteC30_37.label}
                        </p>
                        <p className="mt-1 text-slate-400">
                          {result.priceBook.entries.concreteC30_37.description}
                        </p>
                        <p className="mt-2 font-mono text-base font-black text-blue-300">
                          {formatTL(result.betonBirimFiyat).replace(" TL", " TL/m³")}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-[#070a20] p-4 text-xs">
                        <p className="font-bold text-white">
                          {result.priceBook.entries.rebar8To12.pozNo} / {result.priceBook.entries.rebar14To28.pozNo} · {result.priceBook.entries.rebar8To12.label}
                        </p>
                        <p className="mt-1 text-slate-400">
                          {result.priceBook.weightedRebarNote}
                        </p>
                        <p className="mt-2 font-mono text-base font-black text-purple-300">
                          {formatTL(result.donatiBirimFiyat).replace(" TL", " TL/ton")}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-[#070a20] p-4 text-xs">
                        <p className="font-bold text-white">
                          {result.priceBook.entries.formworkPlywood.pozNo} · {result.priceBook.entries.formworkPlywood.label}
                        </p>
                        <p className="mt-1 text-slate-400">
                          {result.priceBook.entries.formworkPlywood.description}
                        </p>
                        <p className="mt-2 font-mono text-base font-black text-indigo-300">
                          {formatTL(result.kalipBirimFiyat).replace(" TL", " TL/m²")}
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2.5">
                      <Link
                        href={result.priceBook.sourceUrl}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#0d1230] px-3.5 py-2 text-xs font-bold text-slate-300 transition-all hover:bg-[#131a44] hover:text-white"
                      >
                        YFK Mart 2026 PDF
                        <ArrowRight className="h-4 w-4 text-blue-400" />
                      </Link>
                      <Link
                        href="https://webdosya.csb.gov.tr/v2/yfk/2026/02/M-MARLIK-M-HEND-SL-K-TEBL-2026-20260204101544.pdf"
                        target="_blank"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#0d1230] px-3.5 py-2 text-xs font-bold text-slate-300 transition-all hover:bg-[#131a44] hover:text-white"
                      >
                        2026 Tebliğ PDF
                        <ArrowRight className="h-4 w-4 text-indigo-400" />
                      </Link>
                    </div>
                  </div>
                </section>

                {/* ── Warnings & Next Steps ── */}
                <section className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
                  <div className="rounded-3xl border border-white/10 bg-[#090d26]/85 p-6 backdrop-blur-2xl">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-300">
                      Uyarılar ve Notlar
                    </p>
                    <h3 className="mt-1.5 text-2xl font-black tracking-tight text-white">
                      Yorum Sınırları
                    </h3>
                    <div className="mt-5 space-y-2.5">
                      {result.warnings.map((warning, index) => (
                        <div
                          key={`${warning.tone}-${index}`}
                          className={cn("rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed", ISSUE_CLASSES[warning.tone])}
                        >
                          {warning.message}
                        </div>
                      ))}
                      {result.notes.map((note) => (
                        <div
                          key={note}
                          className="rounded-xl border border-white/10 bg-[#070a20] px-3.5 py-2.5 text-xs leading-relaxed text-slate-300"
                        >
                          {note}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-blue-500/20 bg-[#090d26]/85 p-6 backdrop-blur-2xl">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-300">
                      Bir Sonraki Adım
                    </p>
                    <h3 className="mt-1.5 text-2xl font-black tracking-tight text-white">
                      Maliyete ve Benchmark’a Geçin
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-300">
                      Bu ekrandaki kaba taşıyıcı sistem çıktısını detaylı inşaat maliyeti ve resmî yaklaşık maliyet kıyası ile birlikte büyütebilirsiniz.
                    </p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <Link
                        data-testid="hizli-metraj-next-step-link"
                        href={buildConstructionCostHref(result)}
                        className="group rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 transition-all hover:bg-blue-500/20 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                      >
                        <p className="text-xs font-bold text-white">
                          İnşaat Maliyeti Analizi
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                          Alan, kat ve resmî sınıf bağlamını taşıyarak senaryo maliyet ekranına geçin.
                        </p>
                        <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-blue-300">
                          Analize Git
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </div>
                      </Link>
                      <Link
                        href={buildOfficialCostHref(result)}
                        className="group rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 transition-all hover:bg-indigo-500/20 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                      >
                        <p className="text-xs font-bold text-white">
                          Resmî Birim Maliyet 2026
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                          Aynı toplam alan ve sınıf ile resmî yaklaşık maliyet ekranına geçin.
                        </p>
                        <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                          Benchmark’a Git
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
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
