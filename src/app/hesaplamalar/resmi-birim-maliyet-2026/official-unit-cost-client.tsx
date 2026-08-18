"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState, startTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Compass,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Printer,
  Search,
} from "lucide-react";
import {
  OFFICIAL_COST_GUIDED_CATEGORIES,
  OFFICIAL_UNIT_COST_SOURCE_2026,
  calculateOfficialUnitCost,
  findGuidedCategoryById,
  findGuidedOptionById,
  findGuidedOptionBySelection,
  getOfficialCostClasses,
  getOfficialCostGroups,
  getOfficialUnitCostsByYear,
  searchOfficialCostRows,
} from "@/lib/calculations/official-unit-costs";
import type {
  OfficialCostClassCode,
  OfficialCostGroupCode,
  OfficialCostRow,
  OfficialCostSelection,
} from "@/lib/calculations/official-unit-costs";
import { formatM2Fiyat, formatTL } from "@/lib/calculations/core";
import { buildPathWithSearch, normalizeNumberParam, setParamIfMeaningful } from "@/lib/url-state";

const YIL = 2026;

async function loadReportingModule() {
  return import("@/lib/calculations/reporting");
}

type SelectionMode = "guided" | "manual";
type PdfAction = "preview" | "download" | null;

interface ManualSelectionState {
  grup: OfficialCostGroupCode;
  sinif: OfficialCostClassCode;
}

interface GuidedSelectionState {
  categoryId: string;
  optionId: string;
}

interface InitialOfficialCostState {
  mode: SelectionMode;
  manualSelection: ManualSelectionState;
  guidedSelection: GuidedSelectionState;
  areaInput: string;
}

function clampAreaNumber(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(1_000_000, Math.max(1, value));
}

function parseAreaInput(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return clampAreaNumber(parsed);
}

function getDefaultGuideState(): GuidedSelectionState {
  const defaultCategory = OFFICIAL_COST_GUIDED_CATEGORIES[0];
  const defaultOption = defaultCategory.options[0];

  return {
    categoryId: defaultCategory.id,
    optionId: defaultOption.id,
  };
}

function getDefaultManualState(groups: OfficialCostGroupCode[]): ManualSelectionState {
  const defaultGroup = groups[0];
  const defaultClass = getOfficialCostClasses(YIL, defaultGroup)[0];

  return {
    grup: defaultGroup,
    sinif: defaultClass,
  };
}

function buildOfficialCostQueryString(
  selectionMode: SelectionMode,
  manualSelection: ManualSelectionState,
  guidedSelection: GuidedSelectionState,
  areaInput: number | null,
  groups: OfficialCostGroupCode[]
) {
  const params = new URLSearchParams();
  const defaultManualSelection = getDefaultManualState(groups);
  const defaultGuideState = getDefaultGuideState();

  if (selectionMode === "manual") {
    params.set("mod", "manual");

    if (manualSelection.grup !== defaultManualSelection.grup) {
      params.set("grup", manualSelection.grup);
    }

    if (
      manualSelection.sinif !== defaultManualSelection.sinif ||
      manualSelection.grup !== defaultManualSelection.grup
    ) {
      params.set("sinif", manualSelection.sinif);
    }
  } else if (
    guidedSelection.categoryId !== defaultGuideState.categoryId ||
    guidedSelection.optionId !== defaultGuideState.optionId
  ) {
    params.set("tip", guidedSelection.optionId);
  }

  if (areaInput !== null && areaInput !== 1000) {
    setParamIfMeaningful(params, "alan", normalizeNumberParam(areaInput));
  }

  return params.toString();
}

function parseInitialState(
  searchParams: ReturnType<typeof useSearchParams>,
  groups: OfficialCostGroupCode[]
): InitialOfficialCostState {
  const groupParam = searchParams.get("grup") as OfficialCostGroupCode | null;
  const manualGroup = groupParam && groups.includes(groupParam) ? groupParam : groups[0];
  const manualClasses = getOfficialCostClasses(YIL, manualGroup);
  const classParam = searchParams.get("sinif") as OfficialCostClassCode | null;
  const manualClass =
    classParam && manualClasses.includes(classParam) ? classParam : manualClasses[0];
  const tipParam = searchParams.get("tip");
  const matchedGuide =
    (tipParam ? findGuidedOptionById(tipParam) : null) ??
    (() => {
      const linked = findGuidedOptionBySelection(manualGroup, manualClass);
      return linked ? findGuidedOptionById(linked.optionId) : null;
    })();
  const fallbackGuideState = getDefaultGuideState();
  const areaParam = searchParams.get("alan");
  const parsedArea = areaParam ? parseAreaInput(areaParam) : null;

  return {
    mode: searchParams.get("mod") === "manual" ? "manual" : "guided",
    manualSelection: { grup: manualGroup, sinif: manualClass },
    guidedSelection: {
      categoryId: matchedGuide?.category.id ?? fallbackGuideState.categoryId,
      optionId: matchedGuide?.option.id ?? fallbackGuideState.optionId,
    },
    areaInput: parsedArea !== null ? String(parsedArea) : "1000",
  };
}

function getExampleStructuresTitle(row: OfficialCostRow): string {
  return `${row.anaGrupKodu}. ${row.altGrupKodu} sınıfına giren yapılar`;
}

function getOfficialPdfFilename(selection: OfficialCostSelection): string {
  return `resmi-birim-maliyet-2026-${selection.grup}-${selection.sinif}.pdf`;
}

function getPreviewErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.includes("sekmesi")) {
    return "PDF önizleme yeni sekmede açılamadı. Tarayıcı açılır pencere iznini kontrol edip tekrar deneyin.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "PDF önizleme açılamadı. Lütfen tekrar deneyin.";
}

export function OfficialUnitCostClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const groups = useMemo(() => getOfficialCostGroups(YIL), []);
  const allRows = useMemo(() => getOfficialUnitCostsByYear(YIL), []);
  const initialState = useMemo(
    () => parseInitialState(searchParams, groups),
    [groups, searchParams]
  );

  const [selectionMode, setSelectionMode] = useState<SelectionMode>(initialState.mode);
  const [manualSelection, setManualSelection] = useState<ManualSelectionState>(
    initialState.manualSelection
  );
  const [guidedSelection, setGuidedSelection] = useState<GuidedSelectionState>(
    initialState.guidedSelection
  );
  const [areaInput, setAreaInput] = useState(initialState.areaInput);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePdfAction, setActivePdfAction] = useState<PdfAction>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const parsedArea = useMemo(() => parseAreaInput(areaInput), [areaInput]);
  const hasValidArea = parsedArea !== null;
  const safeArea = parsedArea ?? 0;
  const manualClassOptions = useMemo(
    () => getOfficialCostClasses(YIL, manualSelection.grup),
    [manualSelection.grup]
  );

  useEffect(() => {
    if (!manualClassOptions.includes(manualSelection.sinif)) {
      setManualSelection((current) => ({ ...current, sinif: manualClassOptions[0] }));
    }
  }, [manualClassOptions, manualSelection.sinif]);

  const activeGuideCategory = useMemo(
    () => findGuidedCategoryById(guidedSelection.categoryId) ?? OFFICIAL_COST_GUIDED_CATEGORIES[0],
    [guidedSelection.categoryId]
  );
  const activeGuidedOption = useMemo(
    () =>
      activeGuideCategory.options.find((option) => option.id === guidedSelection.optionId) ??
      activeGuideCategory.options[0],
    [activeGuideCategory, guidedSelection.optionId]
  );

  useEffect(() => {
    if (activeGuidedOption.id !== guidedSelection.optionId) {
      setGuidedSelection({
        categoryId: activeGuideCategory.id,
        optionId: activeGuidedOption.id,
      });
    }
  }, [activeGuideCategory.id, activeGuidedOption.id, guidedSelection.optionId]);

  const resolvedSelection = useMemo<OfficialCostSelection>(
    () =>
      selectionMode === "guided"
        ? activeGuidedOption.selection
        : { yil: YIL, grup: manualSelection.grup, sinif: manualSelection.sinif },
    [activeGuidedOption.selection, manualSelection.grup, manualSelection.sinif, selectionMode]
  );

  const selectedRow = useMemo(
    () =>
      allRows.find(
        (row) =>
          row.anaGrupKodu === resolvedSelection.grup &&
          row.altGrupKodu === resolvedSelection.sinif
      ) ?? null,
    [allRows, resolvedSelection.grup, resolvedSelection.sinif]
  );
  const selectedGroup = useMemo(
    () => allRows.find((row) => row.anaGrupKodu === resolvedSelection.grup) ?? null,
    [allRows, resolvedSelection.grup]
  );
  const result = useMemo(
    () => (selectedRow ? calculateOfficialUnitCost(resolvedSelection, safeArea) : null),
    [resolvedSelection, safeArea, selectedRow]
  );

  const activeGuideMeta = useMemo(() => {
    if (selectionMode === "guided") {
      return { category: activeGuideCategory, option: activeGuidedOption };
    }

    const matched = findGuidedOptionBySelection(
      resolvedSelection.grup,
      resolvedSelection.sinif
    );
    return matched ? findGuidedOptionById(matched.optionId) : null;
  }, [
    activeGuideCategory,
    activeGuidedOption,
    resolvedSelection.grup,
    resolvedSelection.sinif,
    selectionMode,
  ]);

  const searchResults = useMemo(
    () => searchOfficialCostRows(allRows, deferredSearchQuery).slice(0, 6),
    [allRows, deferredSearchQuery]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextQuery = buildOfficialCostQueryString(
        selectionMode,
        manualSelection,
        guidedSelection,
        parsedArea,
        groups
      );

      if (nextQuery === searchParams.toString()) {
        return;
      }

      startTransition(() => {
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [guidedSelection, groups, manualSelection, parsedArea, pathname, router, searchParams, selectionMode]);

  const detailSearchParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("grup", resolvedSelection.grup);
    params.set("sinif", resolvedSelection.sinif);
    if (hasValidArea && parsedArea !== null && parsedArea !== 1000) {
      setParamIfMeaningful(params, "alan", normalizeNumberParam(parsedArea), { defaultValue: "1000" });
    }
    return params.toString();
  }, [hasValidArea, parsedArea, resolvedSelection.grup, resolvedSelection.sinif]);

  const detailedCostLink = buildPathWithSearch("/hesaplamalar/insaat-maliyeti", new URLSearchParams(detailSearchParams));
  const exampleStructures = selectedRow?.ornekYapilar ?? [];
  const isBusy = activePdfAction !== null;

  const handleGuideCategorySelect = (categoryId: string) => {
    const category = findGuidedCategoryById(categoryId);
    if (!category) {
      return;
    }

    setSelectionMode("guided");
    setGuidedSelection({ categoryId: category.id, optionId: category.options[0].id });
    setExportError(null);
  };

  const handleGuideOptionSelect = (optionId: string) => {
    const matched = findGuidedOptionById(optionId);
    if (!matched) {
      return;
    }

    setSelectionMode("guided");
    setGuidedSelection({ categoryId: matched.category.id, optionId: matched.option.id });
    setExportError(null);
  };

  const handleManualGroupChange = (groupCode: OfficialCostGroupCode) => {
    const nextClassOptions = getOfficialCostClasses(YIL, groupCode);
    setSelectionMode("manual");
    setManualSelection({
      grup: groupCode,
      sinif: nextClassOptions.includes(manualSelection.sinif)
        ? manualSelection.sinif
        : nextClassOptions[0],
    });
    setExportError(null);
  };

  const handleManualClassChange = (classCode: OfficialCostClassCode) => {
    setSelectionMode("manual");
    setManualSelection((current) => ({ ...current, sinif: classCode }));
    setExportError(null);
  };

  const handleManualSearchResultClick = (
    groupCode: OfficialCostGroupCode,
    classCode: OfficialCostClassCode,
    label: string
  ) => {
    setSelectionMode("manual");
    setManualSelection({ grup: groupCode, sinif: classCode });
    setSearchQuery(label);
    setExportError(null);
  };

  const handleAreaBlur = () => {
    if (parsedArea !== null) {
      setAreaInput(String(parsedArea));
    }
  };

  const handlePrint = () => {
    setExportError(null);

    if (typeof window === "undefined" || typeof window.print !== "function") {
      setExportError("Bu ortamda yazdırma kullanılamıyor.");
      return;
    }

    try {
      window.print();
    } catch (error) {
      console.error("Official cost print failed", error);
      setExportError("Yazdırma penceresi açılamadı.");
    }
  };

  const handlePdfPreview = async () => {
    if (isBusy) {
      return;
    }

    if (!result || !selectedRow || !hasValidArea) {
      setExportError("PDF önizleme için önce geçerli bir toplam inşaat alanı girin.");
      return;
    }

    setActivePdfAction("preview");
    setExportError(null);

    try {
      const { openOfficialCostPdfPreview } = await loadReportingModule();
      openOfficialCostPdfPreview(result);
    } catch (error) {
      console.error("Official cost PDF preview failed", error);
      setExportError(getPreviewErrorMessage(error));
    } finally {
      setActivePdfAction(null);
    }
  };

  const handlePdfDownload = async () => {
    if (isBusy) {
      return;
    }

    if (!result || !selectedRow || !hasValidArea) {
      setExportError("PDF indirmek için önce geçerli bir toplam inşaat alanı girin.");
      return;
    }

    setActivePdfAction("download");
    setExportError(null);

    try {
      const { downloadOfficialCostPdf } = await loadReportingModule();
      downloadOfficialCostPdf(result, getOfficialPdfFilename(resolvedSelection));
    } catch (error) {
      console.error("Official cost PDF export failed", error);
      setExportError("PDF raporu oluşturulamadı. Yazdır seçeneğini kullanabilirsiniz.");
    } finally {
      setActivePdfAction(null);
    }
  };

  return (
    <div className="tool-page-shell">
      <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-8 lg:px-12 md:py-12">
        <div className="mb-10 max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-bold text-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.15)] backdrop-blur-md dark:border-blue-400/30 dark:bg-blue-500/15 dark:text-blue-300 dark:shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <FileText className="h-3.5 w-3.5" />
            Resmî Referans Aracı
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl dark:text-white">
            Resmî Birim Maliyet 2026
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base font-normal dark:text-slate-300">
            Grubu biliyorsan doğrudan seç, bilmiyorsan yapı tipinden ilerle. Sade seçim
            akışıyla resmî m² birim maliyetini bul, toplam inşaat alanını yaz ve yaklaşık
            resmî maliyeti anında gör.
          </p>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.02fr_0.98fr]">
          <section className="rounded-3xl border border-border/80 bg-card/90 p-6 md:p-8 shadow-sm backdrop-blur-2xl dark:border-blue-500/20 dark:bg-[#090d26]/85 dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
            <div className="mb-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
                Seçim Paneli
              </p>
              <h2 className="mt-1.5 text-2xl font-black text-foreground dark:text-white">
                Yapına Uygun Resmî Sınıfı Bul
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-slate-300">
                İki ayrı akış var. En kolayı yapı tipinden seçmek. Resmî sınıfı
                biliyorsan sınıf kodunu veya bina tipini aratıp doğrudan seçim
                yapabilirsin.
              </p>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                data-testid="official-mode-guided"
                aria-pressed={selectionMode === "guided"}
                onClick={() => {
                  setSelectionMode("guided");
                  setExportError(null);
                }}
                className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                  selectionMode === "guided"
                    ? "border-blue-500 bg-blue-500/10 text-foreground shadow-[0_0_20px_rgba(59,130,246,0.15)] dark:bg-blue-500/15 dark:text-white dark:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                    : "border-border/80 bg-muted/40 text-foreground hover:border-blue-500/40 hover:bg-card dark:border-white/10 dark:bg-[#070a20] dark:text-slate-300 dark:hover:bg-[#0c1236]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Compass className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-black uppercase tracking-[0.16em]">
                    Yapı tipinden bul
                  </span>
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground dark:text-slate-400">
                  Kullanıcı dostu, azaltılmış seçenekler. Konut, ticari, sağlık veya
                  sanayi gibi yapını seç ve sistem sana uygun resmî sınıfı önersin.
                </p>
              </button>

              <button
                type="button"
                data-testid="official-mode-manual"
                aria-pressed={selectionMode === "manual"}
                onClick={() => {
                  setSelectionMode("manual");
                  setExportError(null);
                }}
                className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                  selectionMode === "manual"
                    ? "border-blue-500 bg-blue-500/10 text-foreground shadow-[0_0_20px_rgba(59,130,246,0.15)] dark:bg-blue-500/15 dark:text-white dark:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                    : "border-border/80 bg-muted/40 text-foreground hover:border-blue-500/40 hover:bg-card dark:border-white/10 dark:bg-[#070a20] dark:text-slate-300 dark:hover:bg-[#0c1236]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Search className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-black uppercase tracking-[0.16em]">
                    Grubu biliyorum
                  </span>
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground dark:text-slate-400">
                  Sınıf kodunu, bina tipini veya örnek yapıları yaz. Sonra resmî grup ve
                  sınıfı doğrudan seçerek hızlı ilerle.
                </p>
              </button>
            </div>

            {selectionMode === "guided" ? (
              <div className="space-y-6">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
                    1. Adım: Yapı Kategorisi
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {OFFICIAL_COST_GUIDED_CATEGORIES.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        data-testid={`official-guide-category-${category.id}`}
                        aria-pressed={category.id === activeGuideCategory.id}
                        onClick={() => handleGuideCategorySelect(category.id)}
                        className={`rounded-2xl border p-4 text-left transition-all ${
                          category.id === activeGuideCategory.id
                            ? "border-blue-500 bg-blue-500/10 text-foreground shadow-[0_0_20px_rgba(59,130,246,0.15)] dark:bg-blue-500/15 dark:text-white dark:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                            : "border-border/80 bg-muted/40 text-foreground hover:border-blue-500/40 hover:bg-card dark:border-white/10 dark:bg-[#070a20] dark:text-slate-300 dark:hover:bg-[#0c1236]"
                        }`}
                      >
                        <p className="text-sm font-bold text-foreground dark:text-white">
                          {category.label}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground dark:text-slate-400">
                          {category.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
                    2. Adım: Tipik Yapı Seçimi
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {activeGuideCategory.options.map((option) => {
                      const row = allRows.find(
                        (item) =>
                          item.anaGrupKodu === option.selection.grup &&
                          item.altGrupKodu === option.selection.sinif
                      );

                      return (
                        <button
                          key={option.id}
                          type="button"
                          data-testid={`official-guide-option-${option.id}`}
                          aria-pressed={option.id === activeGuidedOption.id}
                          onClick={() => handleGuideOptionSelect(option.id)}
                          className={`rounded-2xl border p-4 text-left transition-all ${
                            option.id === activeGuidedOption.id
                              ? "border-blue-500 bg-blue-500/10 text-foreground shadow-[0_0_20px_rgba(59,130,246,0.15)] dark:bg-blue-500/15 dark:text-white dark:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                              : "border-border/80 bg-muted/40 text-foreground hover:border-blue-500/40 hover:bg-card dark:border-white/10 dark:bg-[#070a20] dark:text-slate-300 dark:hover:bg-[#0c1236]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-sm font-bold text-foreground dark:text-white">
                              {option.label}
                            </span>
                            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-blue-600 dark:border-blue-400/30 dark:bg-blue-500/15 dark:text-blue-300">
                              {option.selection.grup}-{option.selection.sinif}
                            </span>
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-slate-400">
                            {option.description}
                          </p>
                          {row ? (
                            <p className="mt-2 text-[11px] text-muted-foreground dark:text-slate-400">
                              Resmî örnek: {row.ornekYapilar[0]}
                            </p>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-2xl border border-border/80 bg-muted/40 p-4 dark:border-white/10 dark:bg-[#070a20]">
                  <label
                    htmlFor="resmi-search"
                    className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300"
                  >
                    Sınıf Kodu veya Bina Tipi Ara
                  </label>
                  <div className="mt-2.5 flex items-center gap-3 rounded-xl border border-input bg-card px-4 py-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-white/15 dark:bg-[#0c1233] dark:focus-within:border-blue-400 dark:focus-within:ring-blue-500/30">
                    <Search className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <input
                      id="resmi-search"
                      data-testid="official-search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Örnek: IV-A, villa, hastane, AVM, okul"
                      className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground dark:text-white dark:placeholder:text-slate-500"
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground dark:text-slate-400">
                    Yazdıkça resmî sınıfları, örnek yapıları ve sınıf kodlarını anlık tarar.
                  </p>

                  {deferredSearchQuery ? (
                    <div className="mt-4 grid gap-2.5 md:grid-cols-2">
                      {searchResults.length > 0 ? (
                        searchResults.map((row) => (
                          <button
                            key={row.sinifKodu}
                            type="button"
                            data-testid={`official-search-result-${row.sinifKodu}`}
                            onClick={() =>
                              handleManualSearchResultClick(
                                row.anaGrupKodu,
                                row.altGrupKodu,
                                `${row.sinifKodu} - ${row.sinifAdi}`
                              )
                            }
                            className="rounded-xl border border-border/80 bg-card p-3 text-left transition-all hover:border-blue-500/40 hover:bg-muted dark:border-white/10 dark:bg-[#070b20] dark:text-slate-300 dark:hover:bg-[#0c1236]"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-xs font-bold text-foreground dark:text-white">
                                {row.sinifAdi}
                              </span>
                              <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-600 dark:border-blue-400/30 dark:bg-blue-500/15 dark:text-blue-300">
                                {row.sinifKodu}
                              </span>
                            </div>
                            <p className="mt-1.5 text-xs text-muted-foreground dark:text-slate-400">
                              {row.ornekYapilar.slice(0, 2).join(" / ")}
                            </p>
                          </button>
                        ))
                      ) : (
                        <div className="rounded-xl border border-dashed border-border/80 bg-card/50 px-4 py-4 text-xs text-muted-foreground md:col-span-2 dark:border-white/15 dark:bg-transparent dark:text-slate-400">
                          Sonuç bulunamadı. Konut, villa, okul, hastane, AVM gibi bina tipi
                          kelimeleri veya doğrudan sınıf kodu yazabilirsiniz.
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label
                      className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-slate-300"
                      htmlFor="resmi-grup"
                    >
                      Ana Grup
                    </label>
                    <select
                      id="resmi-grup"
                      data-testid="official-group-select"
                      value={manualSelection.grup}
                      onChange={(event) =>
                        handleManualGroupChange(event.target.value as OfficialCostGroupCode)
                      }
                      className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm font-semibold text-foreground outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/15 dark:bg-[#070a20] dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/30"
                    >
                      {groups.map((groupCode) => {
                        const row = allRows.find((item) => item.anaGrupKodu === groupCode);
                        return (
                          <option key={groupCode} value={groupCode} className="bg-card text-foreground dark:bg-[#070a20] dark:text-white">
                            {row?.anaGrupAdi ?? groupCode}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-slate-300"
                      htmlFor="resmi-sinif"
                    >
                      Alt Grup / Sınıf
                    </label>
                    <select
                      id="resmi-sinif"
                      data-testid="official-class-select"
                      value={manualSelection.sinif}
                      onChange={(event) =>
                        handleManualClassChange(event.target.value as OfficialCostClassCode)
                      }
                      className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm font-semibold text-foreground outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/15 dark:bg-[#070a20] dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/30"
                    >
                      {manualClassOptions.map((classCode) => {
                        const row = allRows.find(
                          (item) =>
                            item.anaGrupKodu === manualSelection.grup &&
                            item.altGrupKodu === classCode
                        );
                        return (
                          <option key={classCode} value={classCode} className="bg-card text-foreground dark:bg-[#070a20] dark:text-white">
                            {row?.sinifAdi ?? `${manualSelection.grup}-${classCode}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="space-y-1.5">
                <label
                  className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-slate-300"
                  htmlFor="alan"
                >
                  Toplam İnşaat Alanı (m²)
                </label>
                <input
                  id="alan"
                  data-testid="official-area-input"
                  type="number"
                  min={1}
                  step={1}
                  value={areaInput}
                  aria-invalid={!hasValidArea}
                  onChange={(event) => {
                    setAreaInput(event.target.value);
                    setExportError(null);
                  }}
                  onBlur={handleAreaBlur}
                  className="w-full rounded-xl border border-input bg-card px-4 py-3 font-mono text-sm font-bold text-foreground outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/15 dark:bg-[#070a20] dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/30"
                />
                {!hasValidArea ? (
                  <p className="text-xs font-medium text-rose-600 dark:text-red-400">
                    Geçerli bir toplam inşaat alanı girin. Alan en az 1 m² olmalıdır.
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 dark:bg-[#070a20]">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
                  Seçilen Resmî Sınıf
                </p>
                <p className="mt-1 font-mono text-lg font-black text-foreground dark:text-white">
                  <span data-testid="official-selected-class-code">
                    {selectedRow?.sinifKodu}
                  </span>
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground dark:text-slate-400">
                  {selectedRow?.sinifAdi}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
              <p className="text-xs font-bold text-foreground uppercase tracking-wider dark:text-white">Formül ve Kapsam</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground dark:text-slate-300">
                Toplam inşaat alanı × resmî m² birim maliyeti = toplam resmî yaklaşık maliyet
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground dark:text-slate-400">
                Bu araç piyasa teklifi üretmez. Ruhsat, resmî referans ve yaklaşık bütçe karşılaştırması için kullanılır.
              </p>
            </div>
          </section>

          {/* ── Result HUD Panel ── */}
          <section className="rounded-3xl border border-border/80 bg-card/90 p-6 text-foreground md:p-8 shadow-sm backdrop-blur-2xl dark:border-blue-500/20 dark:bg-[#090d26]/85 dark:text-white dark:shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
            {result && selectedRow ? (
              <div className="space-y-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
                    Sonuç Paneli
                  </p>
                  <h2 className="mt-1.5 text-2xl font-black text-foreground dark:text-white">{selectedRow.sinifAdi}</h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground dark:text-slate-300">
                    Resmî seçim, {selectedGroup?.anaGrupAdi ?? selectedRow.anaGrupAdi} içindeki{" "}
                    {selectedRow.sinifAdi} için hesaplandı.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs dark:border-white/10 dark:bg-[#070a20]">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground dark:text-slate-400">
                      Resmî m² Birim Maliyeti
                    </p>
                    <p className="mt-1.5 font-mono text-2xl font-black text-blue-600 dark:text-blue-300">
                      <span data-testid="official-unit-cost-value">
                        {formatM2Fiyat(selectedRow.m2BirimMaliyet)}
                      </span>
                    </p>
                  </div>
                  <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-[#121945] via-[#0c1236] to-[#070b24] p-4 text-white shadow-[0_10px_30px_rgba(37,99,235,0.2)]">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-300">
                      Toplam Resmî Maliyet
                    </p>
                    <p className="mt-1.5 font-mono text-2xl font-black text-white">
                      <span data-testid="official-total-cost-value">
                        {formatTL(result.resmiToplamMaliyet)}
                      </span>
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs dark:border-white/10 dark:bg-[#070a20]">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground dark:text-slate-400">
                      Toplam İnşaat Alanı
                    </p>
                    <p className="mt-1.5 font-mono text-2xl font-black text-foreground dark:text-white">
                      <span data-testid="official-area-value">
                        {safeArea.toLocaleString("tr-TR")} m²
                      </span>
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs dark:border-white/10 dark:bg-[#070a20]">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground dark:text-slate-400">
                      Resmî Sınıf Kodu
                    </p>
                    <p className="mt-1.5 font-mono text-2xl font-black text-indigo-600 dark:text-indigo-300">
                      <span data-testid="official-result-class-code">
                        {selectedRow.sinifKodu}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)]">
                  <div className="rounded-2xl border border-border/80 bg-muted/40 p-4 text-xs dark:border-white/10 dark:bg-[#070a20]">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
                      Hesap Özeti
                    </p>
                    <div className="mt-3 space-y-2.5 text-foreground dark:text-slate-300">
                      <div className="flex items-center justify-between border-b border-border/60 pb-2 dark:border-white/5">
                        <span className="text-muted-foreground dark:text-slate-400">Yıl</span>
                        <span className="font-bold text-foreground dark:text-white">{YIL}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-border/60 pb-2 dark:border-white/5">
                        <span className="text-muted-foreground dark:text-slate-400">Ana Grup</span>
                        <span className="font-bold text-foreground dark:text-white">
                          {selectedGroup?.anaGrupAdi ?? selectedRow.anaGrupAdi}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b border-border/60 pb-2 dark:border-white/5">
                        <span className="text-muted-foreground dark:text-slate-400">Alt Grup / Sınıf</span>
                        <span className="font-bold text-foreground dark:text-white">{selectedRow.sinifAdi}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-border/60 pb-2 dark:border-white/5">
                        <span className="text-muted-foreground dark:text-slate-400">Formül</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-300">
                          {result.formula}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground dark:text-slate-400">Kapsam</span>
                        <span className="text-right font-medium text-foreground dark:text-slate-300">
                          Ruhsat ve resmî karşılaştırma
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {activeGuideMeta ? (
                      <div className="rounded-2xl border border-border/80 bg-muted/40 p-4 dark:border-white/10 dark:bg-[#070a20]">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
                          Seçim Bilgisi
                        </p>
                        <p className="mt-2 text-sm font-bold text-foreground dark:text-white">
                          {activeGuideMeta.category.label}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground dark:text-slate-300">
                          {activeGuideMeta.option.label}
                        </p>
                      </div>
                    ) : null}

                    <div className="rounded-2xl border border-border/80 bg-muted/40 p-4 dark:border-white/10 dark:bg-[#070a20]">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
                        Kaynak
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground dark:text-slate-400">
                        {OFFICIAL_UNIT_COST_SOURCE_2026.label} referans alınmıştır.
                      </p>
                      <a
                        href={OFFICIAL_UNIT_COST_SOURCE_2026.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        data-testid="official-source-link"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3.5 py-2 text-xs font-bold text-foreground shadow-2xs transition-all hover:bg-muted dark:border-white/10 dark:bg-[#0d1230] dark:text-slate-300 dark:hover:bg-[#131a44] dark:hover:text-white"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        Resmî Kaynak
                      </a>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/80 bg-muted/40 p-4 dark:border-white/10 dark:bg-[#070a20]">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
                      {getExampleStructuresTitle(selectedRow)}
                    </p>
                    <span className="text-[11px] font-mono text-muted-foreground dark:text-slate-400">
                      {exampleStructures.length} örnek
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {exampleStructures.map((example) => (
                      <div
                        key={example}
                        className="rounded-lg border border-border/80 bg-card px-2.5 py-1 text-xs text-foreground shadow-2xs dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                      >
                        {example}
                      </div>
                    ))}
                  </div>
                </div>

                {exportError ? (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-700 dark:text-rose-300">
                    {exportError}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2.5 pt-2">
                  <button
                    type="button"
                    data-testid="official-print-button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground shadow-2xs transition-all hover:bg-muted dark:border-white/10 dark:bg-[#0d1230] dark:text-slate-300 dark:hover:bg-[#131a44] dark:hover:text-white"
                  >
                    <Printer className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Yazdır
                  </button>
                  <button
                    type="button"
                    data-testid="official-pdf-preview-button"
                    onClick={handlePdfPreview}
                    disabled={isBusy || !hasValidArea}
                    className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground shadow-2xs transition-all hover:bg-muted dark:border-white/10 dark:bg-[#0d1230] dark:text-slate-300 dark:hover:bg-[#131a44] dark:hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Eye className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    {activePdfAction === "preview" ? "Hazırlanıyor" : "PDF Önizleme"}
                  </button>
                  <button
                    type="button"
                    data-testid="official-pdf-button"
                    onClick={handlePdfDownload}
                    disabled={isBusy || !hasValidArea}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    {activePdfAction === "download" ? "Hazırlanıyor" : "PDF İndir"}
                  </button>
                  <Link
                    href={detailedCostLink}
                    data-testid="official-compare-link"
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-blue-600 transition-all hover:bg-blue-500/20 dark:text-blue-300"
                  >
                    <Compass className="h-4 w-4" />
                    Detaylı Maliyet ile Karşılaştır
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border/80 bg-muted/40 p-6 dark:border-white/10 dark:bg-[#070a20]">
                <p className="text-base font-bold text-foreground dark:text-white">Resmî sonuç hazır değil</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-slate-400">
                  Geçerli bir grup, sınıf ve toplam inşaat alanı seçildiğinde resmî yaklaşık
                  maliyet burada gösterilecek.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
