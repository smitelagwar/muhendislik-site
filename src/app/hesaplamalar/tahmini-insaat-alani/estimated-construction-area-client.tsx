"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Calculator } from "lucide-react";
import { formatSayi } from "@/lib/calculations/core";
import {
  buildDetailedDraftFromQuickInput,
  calculateDetailedConstructionArea,
  calculateQuickEstimatedConstructionArea,
  createCustomFloorProgramBlock,
  createEmptyTechnicalAreaLine,
} from "@/lib/calculations/modules/tahmini-insaat-alani/engine";
import type {
  AreaEstimationMode,
  DetailedEstimatedConstructionAreaInput,
  FloorProgramBlock,
  QuickEstimatedConstructionAreaInput,
  TechnicalAreaLine,
} from "@/lib/calculations/modules/tahmini-insaat-alani/types";
import {
  DEFAULT_QUICK_FORM,
  ESTIMATED_AREA_DETAILED_DRAFT_KEY,
  type DetailedDraftState,
  type FloorProgramBlockState,
  type QuickFormState,
  type TechnicalAreaLineState,
  stringifyNumberState,
} from "./client-state";
import { ConstructionAreaSummary } from "./components/ConstructionAreaSummary";
import { DetailedModePanel } from "./components/DetailedModePanel";
import { ModeSwitcher } from "./components/ModeSwitcher";
import { QuickModePanel } from "./components/QuickModePanel";

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

function parseNonNegativeDecimal(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  const parsed = parseDecimal(trimmed);
  return parsed !== null && parsed >= 0 ? parsed : null;
}

function normalizeNumberParam(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)));
}

function parseMode(searchParams: ReturnType<typeof useSearchParams>): AreaEstimationMode {
  return searchParams.get("mod") === "detailed" ? "detailed" : "quick";
}

function buildQuickInput(form: QuickFormState): {
  input: QuickEstimatedConstructionAreaInput | null;
  error: string | null;
} {
  const parcelAreaM2 = parsePositiveDecimal(form.parcelAreaM2);
  const taks = parsePositiveDecimal(form.taks);
  const kaks = parsePositiveDecimal(form.kaks);
  const normalFloorCount = parsePositiveInteger(form.normalFloorCount);

  if (!parcelAreaM2) {
    return { input: null, error: "Arsa alani sifirdan buyuk olmalidir." };
  }

  if (!taks || taks > 1) {
    return { input: null, error: "TAKS 0 ile 1 arasinda olmalidir." };
  }

  if (!kaks) {
    return { input: null, error: "KAKS / emsal sifirdan buyuk olmalidir." };
  }

  if (!normalFloorCount) {
    return { input: null, error: "Normal kat sayisi en az 1 olmalidir." };
  }

  const basementFloorCount = form.hasBasement
    ? parsePositiveInteger(form.basementFloorCount)
    : 0;

  if (form.hasBasement && !basementFloorCount) {
    return { input: null, error: "Bodrum kat sayisi en az 1 olmalidir." };
  }

  const basementFloorAreaM2 =
    form.hasBasement && form.basementFloorAreaM2.trim() !== ""
      ? parsePositiveDecimal(form.basementFloorAreaM2)
      : null;

  if (form.hasBasement && form.basementFloorAreaM2.trim() !== "" && !basementFloorAreaM2) {
    return { input: null, error: "Bodrum kat alani sifirdan buyuk olmalidir." };
  }

  return {
    input: {
      parcelAreaM2,
      taks,
      kaks,
      normalFloorCount,
      hasBasement: form.hasBasement,
      basementFloorCount: basementFloorCount ?? 0,
      basementFloorAreaM2,
    },
    error: null,
  };
}

function parseInitialQuickForm(searchParams: ReturnType<typeof useSearchParams>): QuickFormState {
  const parcelAreaRaw = searchParams.get("arsa") ?? "";
  const taksRaw = searchParams.get("taks") ?? "";
  const kaksRaw = searchParams.get("kaks") ?? "";
  const katRaw = searchParams.get("kat") ?? "";
  const hasBasement = searchParams.get("bodrum") === "1";
  const bodrumKatRaw = searchParams.get("bodrumKat") ?? "";
  const bodrumAlanRaw = searchParams.get("bodrumAlan") ?? "";

  return {
    parcelAreaM2: parsePositiveDecimal(parcelAreaRaw) ? parcelAreaRaw : DEFAULT_QUICK_FORM.parcelAreaM2,
    taks:
      (() => {
        const parsed = parsePositiveDecimal(taksRaw);
        return parsed && parsed <= 1 ? taksRaw : DEFAULT_QUICK_FORM.taks;
      })(),
    kaks: parsePositiveDecimal(kaksRaw) ? kaksRaw : DEFAULT_QUICK_FORM.kaks,
    normalFloorCount: parsePositiveInteger(katRaw) ? katRaw : DEFAULT_QUICK_FORM.normalFloorCount,
    hasBasement,
    basementFloorCount:
      hasBasement && parsePositiveInteger(bodrumKatRaw)
        ? bodrumKatRaw
        : DEFAULT_QUICK_FORM.basementFloorCount,
    basementFloorAreaM2:
      hasBasement && parsePositiveDecimal(bodrumAlanRaw) ? bodrumAlanRaw : "",
  };
}

function buildQueryString(form: QuickFormState, mode: AreaEstimationMode): string {
  const params = new URLSearchParams();
  const parcelAreaM2 = parsePositiveDecimal(form.parcelAreaM2);
  const taks = parsePositiveDecimal(form.taks);
  const kaks = parsePositiveDecimal(form.kaks);
  const normalFloorCount = parsePositiveInteger(form.normalFloorCount);

  params.set("mod", mode);

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

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function mapTechnicalLineToState(line: TechnicalAreaLine): TechnicalAreaLineState {
  return {
    id: line.id,
    label: line.label,
    areaM2: stringifyNumberState(line.areaM2),
  };
}

function mapBlockToState(block: FloorProgramBlock): FloorProgramBlockState {
  return {
    id: block.id,
    label: block.label,
    role: block.role,
    repeatCount: String(block.repeatCount),
    grossIndependentAreaM2: stringifyNumberState(block.grossIndependentAreaM2),
    netIndependentAreaM2: stringifyNumberState(block.netIndependentAreaM2),
    balconyTerraceAreaM2: stringifyNumberState(block.balconyTerraceAreaM2),
    commonCirculationAreaM2: stringifyNumberState(block.commonCirculationAreaM2),
    elevatorShaftAreaM2: stringifyNumberState(block.elevatorShaftAreaM2),
    technicalLines: block.technicalLines.map(mapTechnicalLineToState),
    notes: block.notes ?? "",
  };
}

function mapDetailedInputToState(input: DetailedEstimatedConstructionAreaInput): DetailedDraftState {
  return {
    projectIdentity: { ...input.projectIdentity },
    blocks: input.blocks.map(mapBlockToState),
  };
}

function loadDetailedDraft(): DetailedDraftState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(ESTIMATED_AREA_DETAILED_DRAFT_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as DetailedDraftState;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !parsed.projectIdentity ||
      !Array.isArray(parsed.blocks)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function saveDetailedDraft(draft: DetailedDraftState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ESTIMATED_AREA_DETAILED_DRAFT_KEY, JSON.stringify(draft));
}

function buildDetailedInput(draft: DetailedDraftState): {
  input: DetailedEstimatedConstructionAreaInput | null;
  error: string | null;
} {
  if (!draft.blocks.length) {
    return { input: null, error: "En az bir kat blogu bulunmalidir." };
  }

  const blocks: FloorProgramBlock[] = [];

  for (const block of draft.blocks) {
    const repeatCount = parsePositiveInteger(block.repeatCount);
    if (!repeatCount) {
      return { input: null, error: `${block.label || "Kat"} icin tekrar sayisi en az 1 olmalidir.` };
    }

    const grossIndependentAreaM2 = parseNonNegativeDecimal(block.grossIndependentAreaM2);
    const netIndependentAreaM2 = parseNonNegativeDecimal(block.netIndependentAreaM2);
    const balconyTerraceAreaM2 = parseNonNegativeDecimal(block.balconyTerraceAreaM2);
    const commonCirculationAreaM2 = parseNonNegativeDecimal(block.commonCirculationAreaM2);
    const elevatorShaftAreaM2 = parseNonNegativeDecimal(block.elevatorShaftAreaM2);

    if (
      grossIndependentAreaM2 === null ||
      netIndependentAreaM2 === null ||
      balconyTerraceAreaM2 === null ||
      commonCirculationAreaM2 === null ||
      elevatorShaftAreaM2 === null
    ) {
      return { input: null, error: `${block.label || "Kat"} icin sayisal alanlar negatif olamaz.` };
    }

    const technicalLines: TechnicalAreaLine[] = [];
    for (const line of block.technicalLines) {
      const areaM2 = parseNonNegativeDecimal(line.areaM2);
      if (areaM2 === null) {
        return { input: null, error: `${block.label || "Kat"} icin teknik alanlar negatif olamaz.` };
      }

      technicalLines.push({
        id: line.id,
        label: line.label.trim() || "Teknik alan",
        areaM2,
      });
    }

    blocks.push({
      id: block.id,
      label: block.label.trim() || "Kat blogu",
      role: block.role,
      repeatCount,
      grossIndependentAreaM2,
      netIndependentAreaM2,
      balconyTerraceAreaM2,
      commonCirculationAreaM2,
      elevatorShaftAreaM2,
      technicalLines,
      notes: block.notes.trim() || undefined,
    });
  }

  return {
    input: {
      projectIdentity: { ...draft.projectIdentity },
      blocks,
    },
    error: null,
  };
}

const DEFAULT_QUICK_INPUT = buildQuickInput(DEFAULT_QUICK_FORM).input;

export function EstimatedConstructionAreaClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialMode = useMemo(() => parseMode(searchParams), [searchParams]);
  const initialQuickForm = useMemo(() => parseInitialQuickForm(searchParams), [searchParams]);
  const [mode, setMode] = useState<AreaEstimationMode>(initialMode);
  const [quickForm, setQuickForm] = useState<QuickFormState>(initialQuickForm);
  const [detailedDraft, setDetailedDraft] = useState<DetailedDraftState>(() =>
    mapDetailedInputToState(
      buildDetailedDraftFromQuickInput(DEFAULT_QUICK_INPUT ?? {
        parcelAreaM2: 1000,
        taks: 0.3,
        kaks: 1.5,
        normalFloorCount: 5,
        hasBasement: false,
        basementFloorCount: 0,
        basementFloorAreaM2: null,
      })
    )
  );
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
  const [hasDetailedEdits, setHasDetailedEdits] = useState(false);

  useEffect(() => {
    const savedDraft = loadDetailedDraft();

    startTransition(() => {
      if (savedDraft) {
        setDetailedDraft(savedDraft);
        setHasDetailedEdits(true);
      } else {
        const parsedQuick = buildQuickInput(initialQuickForm).input ?? DEFAULT_QUICK_INPUT;
        if (parsedQuick) {
          setDetailedDraft(mapDetailedInputToState(buildDetailedDraftFromQuickInput(parsedQuick)));
        }
      }

      setHasLoadedDraft(true);
    });
  }, [initialQuickForm]);

  useEffect(() => {
    if (!hasLoadedDraft || !hasDetailedEdits) {
      return;
    }

    saveDetailedDraft(detailedDraft);
  }, [detailedDraft, hasDetailedEdits, hasLoadedDraft]);

  useEffect(() => {
    const nextQuery = buildQueryString(quickForm, mode);
    if (nextQuery === searchParams.toString()) {
      return;
    }

    startTransition(() => {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    });
  }, [mode, pathname, quickForm, router, searchParams]);

  const quickParsed = useMemo(() => buildQuickInput(quickForm), [quickForm]);
  const quickResult = useMemo(
    () =>
      quickParsed.input ? calculateQuickEstimatedConstructionArea(quickParsed.input) : null,
    [quickParsed.input]
  );
  const quickError =
    quickParsed.error ?? (!quickResult ? "Gecerli bir hizli sonuc uretilemedi." : null);

  const detailedParsed = useMemo(() => buildDetailedInput(detailedDraft), [detailedDraft]);
  const detailedResult = useMemo(
    () =>
      detailedParsed.input
        ? calculateDetailedConstructionArea(
            detailedParsed.input,
            quickResult?.approximateTotalConstructionAreaM2 ?? null
          )
        : null,
    [detailedParsed.input, quickResult]
  );
  const detailedError =
    detailedParsed.error ??
    (!detailedResult ? "Kat programinda en az bir blok toplam alani sifirdan buyuk olmalidir." : null);

  const quickFormulaLines =
    quickResult && quickParsed.input
      ? [
          `${formatSayi(quickParsed.input.parcelAreaM2, 2)} x ${formatSayi(quickParsed.input.taks, 2)} = ${formatSayi(quickResult.maxGroundAreaM2, 2)} m2 taban alani`,
          `${formatSayi(quickParsed.input.parcelAreaM2, 2)} x ${formatSayi(quickParsed.input.kaks, 2)} = ${formatSayi(quickResult.emsalAreaM2, 2)} m2 emsale dahil alan`,
          `${formatSayi(quickResult.maxGroundAreaM2, 2)} x ${quickParsed.input.normalFloorCount} = ${formatSayi(quickResult.enteredFloorCapacityM2, 2)} m2 girilen kat kapasitesi`,
          `${formatSayi(quickResult.emsalAreaM2, 2)} / ${quickParsed.input.normalFloorCount} = ${formatSayi(quickResult.averageRequiredFloorAreaM2, 2)} m2 ortalama kat alani`,
          quickParsed.input.hasBasement
            ? `${quickParsed.input.basementFloorCount} x ${formatSayi(quickResult.resolvedBasementFloorAreaM2, 2)} = ${formatSayi(quickResult.totalBasementAreaM2, 2)} m2 bodrum toplami`
            : null,
          `${formatSayi(quickResult.emsalAreaM2, 2)} + ${formatSayi(quickResult.totalBasementAreaM2, 2)} = ${formatSayi(quickResult.approximateTotalConstructionAreaM2, 2)} m2 yaklasik toplam insaat alani`,
        ].filter((line): line is string => Boolean(line))
      : [];

  const detailedFormulaLines = detailedResult
    ? [
        ...detailedResult.floors.map(
          (floor) =>
            `${floor.label}: ${formatSayi(floor.grossIndependentAreaM2, 2)} + ${formatSayi(floor.commonCirculationAreaM2, 2)} + ${formatSayi(floor.elevatorShaftAreaM2, 2)} + ${formatSayi(floor.technicalAreaM2, 2)} = ${formatSayi(floor.floorTotalM2, 2)} m2 x ${floor.repeatCount}`
        ),
        `${formatSayi(detailedResult.grossIndependentAreaTotalM2, 2)} + ${formatSayi(detailedResult.commonAreaTotalM2, 2)} + ${formatSayi(detailedResult.technicalAreaTotalM2, 2)} = ${formatSayi(detailedResult.grandTotalConstructionAreaM2, 2)} m2 toplam insaat alani`,
      ]
    : [];

  const officialCostHref = mode === "detailed"
    ? detailedResult
      ? buildOfficialCostHref(detailedResult.grandTotalConstructionAreaM2)
      : "/hesaplamalar/resmi-birim-maliyet-2026"
    : quickResult
      ? buildOfficialCostHref(quickResult.approximateTotalConstructionAreaM2)
      : "/hesaplamalar/resmi-birim-maliyet-2026";

  const suggestedFootprintM2 = quickResult?.maxGroundAreaM2 ?? null;

  const handleModeChange = (nextMode: AreaEstimationMode) => {
    if (nextMode === "detailed" && !hasDetailedEdits) {
      const baseQuickInput = quickParsed.input ?? DEFAULT_QUICK_INPUT;
      if (baseQuickInput) {
        setDetailedDraft(mapDetailedInputToState(buildDetailedDraftFromQuickInput(baseQuickInput)));
      }
    }

    setMode(nextMode);
  };

  const setQuickField = (key: keyof QuickFormState, value: string | boolean) => {
    setQuickForm((current) => ({ ...current, [key]: value }));
  };

  const setProjectIdentityField = (
    key: keyof DetailedDraftState["projectIdentity"],
    value: string
  ) => {
    setHasDetailedEdits(true);
    setDetailedDraft((current) => ({
      ...current,
      projectIdentity: {
        ...current.projectIdentity,
        [key]: value,
      },
    }));
  };

  const setBlockField = (
    blockId: string,
    key:
      | "label"
      | "repeatCount"
      | "grossIndependentAreaM2"
      | "netIndependentAreaM2"
      | "balconyTerraceAreaM2"
      | "commonCirculationAreaM2"
      | "elevatorShaftAreaM2"
      | "notes",
    value: string
  ) => {
    setHasDetailedEdits(true);
    setDetailedDraft((current) => ({
      ...current,
      blocks: current.blocks.map((block) =>
        block.id === blockId ? { ...block, [key]: value } : block
      ),
    }));
  };

  const addCustomBlock = () => {
    setHasDetailedEdits(true);
    setDetailedDraft((current) => ({
      ...current,
      blocks: [
        ...current.blocks,
        mapBlockToState(
          createCustomFloorProgramBlock(
            `custom-${current.blocks.filter((block) => block.role === "custom").length + 1}`
          )
        ),
      ],
    }));
  };

  const removeBlock = (blockId: string) => {
    setHasDetailedEdits(true);
    setDetailedDraft((current) => ({
      ...current,
      blocks: current.blocks.filter((block) => block.id !== blockId),
    }));
  };

  const addTechnicalLine = (blockId: string) => {
    setHasDetailedEdits(true);
    setDetailedDraft((current) => ({
      ...current,
      blocks: current.blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              technicalLines: [
                ...block.technicalLines,
                mapTechnicalLineToState(createEmptyTechnicalAreaLine(createId("technical"))),
              ],
            }
          : block
      ),
    }));
  };

  const setTechnicalLineField = (
    blockId: string,
    lineId: string,
    key: "label" | "areaM2",
    value: string
  ) => {
    setHasDetailedEdits(true);
    setDetailedDraft((current) => ({
      ...current,
      blocks: current.blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              technicalLines: block.technicalLines.map((line) =>
                line.id === lineId ? { ...line, [key]: value } : line
              ),
            }
          : block
      ),
    }));
  };

  const removeTechnicalLine = (blockId: string, lineId: string) => {
    setHasDetailedEdits(true);
    setDetailedDraft((current) => ({
      ...current,
      blocks: current.blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              technicalLines: block.technicalLines.filter((line) => line.id !== lineId),
            }
          : block
      ),
    }));
  };

  return (
    <div className="tool-page-shell">
      <div className="mx-auto max-w-screen-2xl px-6 py-10 sm:px-10 lg:px-16">
        <div className="mb-10 max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300">
            <Calculator className="h-3.5 w-3.5" />
            Hizli + Detayli Tahmin
          </div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-5xl">
            Tahmini Insaat Alani Hesabi
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Hizli modda brut arsa, TAKS, KAKS ve bodrum kabulleriyle on fizibilite alin.
            Detayli modda ise kat bazli brut alan, ortak alan, asansor ve teknik hacimlerle
            gercege daha yakin <strong>Toplam Insaat Alani</strong> uretin.
          </p>
          <div className="mt-6">
            <ModeSwitcher mode={mode} onChange={handleModeChange} />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.06fr)_minmax(360px,0.94fr)] lg:items-start">
          <div>
            {mode === "quick" ? (
              <QuickModePanel form={quickForm} onFieldChange={setQuickField} />
            ) : (
              <DetailedModePanel
                draft={detailedDraft}
                suggestedFootprintM2={suggestedFootprintM2}
                onIdentityChange={setProjectIdentityField}
                onBlockFieldChange={setBlockField}
                onAddCustomBlock={addCustomBlock}
                onRemoveBlock={removeBlock}
                onAddTechnicalLine={addTechnicalLine}
                onTechnicalLineChange={setTechnicalLineField}
                onRemoveTechnicalLine={removeTechnicalLine}
              />
            )}
          </div>

          <div className="lg:sticky lg:top-24">
            <ConstructionAreaSummary
              mode={mode}
              quickResult={quickResult}
              quickError={quickError}
              quickFormulaLines={quickFormulaLines}
              detailedResult={detailedResult}
              detailedError={detailedError}
              detailedFormulaLines={detailedFormulaLines}
              officialCostHref={officialCostHref}
              onChangeMode={handleModeChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
