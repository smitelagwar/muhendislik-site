"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState, startTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Compass, Download, ExternalLink, FileText, Printer, Search } from "lucide-react";
import { buildOfficialCostPdfSnapshot, exportPdf } from "@/lib/calculations/reporting";
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
  OfficialCostSelection,
} from "@/lib/calculations/official-unit-costs";
import { formatM2Fiyat, formatTL } from "@/lib/calculations/core";

const YIL = 2026;

type SelectionMode = "guided" | "manual";

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

function parseInitialState(
  searchParams: ReturnType<typeof useSearchParams>,
  groups: OfficialCostGroupCode[]
): InitialOfficialCostState {
  const groupParam = searchParams.get("grup") as OfficialCostGroupCode | null;
  const manualGroup = groupParam && groups.includes(groupParam) ? groupParam : groups[0];
  const manualClasses = getOfficialCostClasses(YIL, manualGroup);
  const classParam = searchParams.get("sinif") as OfficialCostClassCode | null;
  const manualClass = classParam && manualClasses.includes(classParam) ? classParam : manualClasses[0];
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

export function OfficialUnitCostClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const groups = useMemo(() => getOfficialCostGroups(YIL), []);
  const allRows = useMemo(() => getOfficialUnitCostsByYear(YIL), []);
  const initialState = useMemo(() => parseInitialState(searchParams, groups), [groups, searchParams]);

  const [selectionMode, setSelectionMode] = useState<SelectionMode>(initialState.mode);
  const [manualSelection, setManualSelection] = useState<ManualSelectionState>(initialState.manualSelection);
  const [guidedSelection, setGuidedSelection] = useState<GuidedSelectionState>(initialState.guidedSelection);
  const [areaInput, setAreaInput] = useState(initialState.areaInput);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const parsedArea = useMemo(() => parseAreaInput(areaInput), [areaInput]);
  const hasValidArea = parsedArea !== null;
  const safeArea = parsedArea ?? 0;
  const manualClassOptions = useMemo(() => getOfficialCostClasses(YIL, manualSelection.grup), [manualSelection.grup]);

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
    () => activeGuideCategory.options.find((option) => option.id === guidedSelection.optionId) ?? activeGuideCategory.options[0],
    [activeGuideCategory, guidedSelection.optionId]
  );

  useEffect(() => {
    if (activeGuidedOption.id !== guidedSelection.optionId) {
      setGuidedSelection({ categoryId: activeGuideCategory.id, optionId: activeGuidedOption.id });
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
    () => allRows.find((row) => row.anaGrupKodu === resolvedSelection.grup && row.altGrupKodu === resolvedSelection.sinif) ?? null,
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

    const matched = findGuidedOptionBySelection(resolvedSelection.grup, resolvedSelection.sinif);
    return matched ? findGuidedOptionById(matched.optionId) : null;
  }, [activeGuideCategory, activeGuidedOption, resolvedSelection.grup, resolvedSelection.sinif, selectionMode]);

  const searchResults = useMemo(
    () => searchOfficialCostRows(allRows, deferredSearchQuery).slice(0, 6),
    [allRows, deferredSearchQuery]
  );

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("yil", String(YIL));
    params.set("grup", resolvedSelection.grup);
    params.set("sinif", resolvedSelection.sinif);
    params.set("mod", selectionMode);
    if (hasValidArea && parsedArea !== null) {
      params.set("alan", String(parsedArea));
    }
    if (selectionMode === "guided") {
      params.set("tip", activeGuidedOption.id);
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }, [activeGuidedOption.id, hasValidArea, parsedArea, pathname, resolvedSelection.grup, resolvedSelection.sinif, router, selectionMode]);

  const detailSearchParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("yil", String(YIL));
    params.set("grup", resolvedSelection.grup);
    params.set("sinif", resolvedSelection.sinif);
    if (hasValidArea && parsedArea !== null) {
      params.set("alan", String(parsedArea));
    }
    return params.toString();
  }, [hasValidArea, parsedArea, resolvedSelection.grup, resolvedSelection.sinif]);

  const detayliMaliyetLink = `/hesaplamalar/insaat-maliyeti?${detailSearchParams}`;

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
      sinif: nextClassOptions.includes(manualSelection.sinif) ? manualSelection.sinif : nextClassOptions[0],
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
      setExportError("Bu ortamda yazdirma kullanilamiyor.");
      return;
    }

    try {
      window.print();
    } catch (error) {
      console.error("Official cost print failed", error);
      setExportError("Yazdirma penceresi acilamadi.");
    }
  };

  const downloadPdf = () => {
    if (isExporting) {
      return;
    }

    if (!result || !selectedRow || !hasValidArea) {
      setExportError("PDF raporu icin once gecerli bir toplam insaat alani girin.");
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      const pdfSnapshot = buildOfficialCostPdfSnapshot(result);
      exportPdf(pdfSnapshot, `resmi-birim-maliyet-2026-${resolvedSelection.grup}-${resolvedSelection.sinif}.pdf`);
    } catch (error) {
      console.error("Official cost PDF export failed", error);
      setExportError("PDF raporu olusturulamadi. Yazdir secenegini kullanabilirsiniz.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="tool-page-shell">
      <div className="mx-auto max-w-screen-2xl px-6 py-12 sm:px-10 lg:px-16">
        <div className="mb-10 max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
            <FileText className="h-3.5 w-3.5" />
            Resmi referans araci
          </div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
            Resmi Birim Maliyet 2026
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Grubu biliyorsan dogrudan sec, bilmiyorsan bina tipinden ilerle. Sade secim
            akisiyla resmi m2 birim maliyetini bul, toplam insaat alanini yaz ve resmi
            yaklasik maliyeti aninda gor.
          </p>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.02fr_0.98fr]">
          <section className="tool-panel rounded-[32px] p-6 md:p-8">
            <div className="mb-6">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                Secim paneli
              </p>
              <h2 className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">
                Yapina uygun resmi sinifi bul
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                Iki ayri akis var. En kolayi bina tipinden secmek. Resmi sinifi biliyorsan
                sinif kodunu veya bina tipini aratip direkt secim yapabilirsin.
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
                className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                  selectionMode === "guided"
                    ? "border-blue-400/60 bg-blue-50 text-zinc-950 shadow-[0_18px_38px_-28px_rgba(37,99,235,0.6)] dark:border-blue-500/40 dark:bg-blue-950/40 dark:text-white"
                    : "border-zinc-200 bg-white/70 text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Compass className="h-4 w-4" />
                  <span className="text-sm font-black uppercase tracking-[0.16em]">
                    Bina tipinden bul
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  Kullanici dostu, azaltilmis secenekler. Konut, ticari, saglik veya
                  sanayi gibi yapini sec ve sistem resmi sinifi onersin.
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
                className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                  selectionMode === "manual"
                    ? "border-blue-400/60 bg-blue-50 text-zinc-950 shadow-[0_18px_38px_-28px_rgba(37,99,235,0.6)] dark:border-blue-500/40 dark:bg-blue-950/40 dark:text-white"
                    : "border-zinc-200 bg-white/70 text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Search className="h-4 w-4" />
                  <span className="text-sm font-black uppercase tracking-[0.16em]">
                    Grubu biliyorum
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  Sinif kodunu, bina tipini veya ornek yapilari yaz. Sonra resmi grup ve
                  sinifi direkt secerek hizli ilerle.
                </p>
              </button>
            </div>

            {selectionMode === "guided" ? (
              <div className="space-y-6">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                    1. Adim
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {OFFICIAL_COST_GUIDED_CATEGORIES.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        data-testid={`official-guide-category-${category.id}`}
                        aria-pressed={category.id === activeGuideCategory.id}
                        onClick={() => handleGuideCategorySelect(category.id)}
                        className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                          category.id === activeGuideCategory.id
                            ? "border-blue-400/60 bg-blue-50 shadow-[0_18px_38px_-28px_rgba(37,99,235,0.6)] dark:border-blue-500/40 dark:bg-blue-950/40"
                            : "border-zinc-200 bg-white/70 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700"
                        }`}
                      >
                        <p className="text-sm font-black text-zinc-950 dark:text-white">
                          {category.label}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                          {category.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                    2. Adim
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
                          className={`rounded-[24px] border p-4 text-left transition-colors ${
                            option.id === activeGuidedOption.id
                              ? "border-blue-400/60 bg-white shadow-[0_22px_45px_-32px_rgba(37,99,235,0.7)] dark:border-blue-500/40 dark:bg-zinc-950"
                              : "border-zinc-200 bg-zinc-50/70 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/70 dark:hover:border-zinc-700"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-sm font-black text-zinc-950 dark:text-white">
                              {option.label}
                            </span>
                            <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
                              {option.selection.grup}-{option.selection.sinif}
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                            {option.description}
                          </p>
                          {row ? (
                            <p className="mt-3 text-xs leading-6 text-zinc-500 dark:text-zinc-400">
                              Resmi ornek: {row.ornekYapilar[0]}
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
                <div className="rounded-[24px] border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                  <label
                    htmlFor="resmi-search"
                    className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400"
                  >
                    Sinif kodu veya bina tipi ara
                  </label>
                  <div className="mt-3 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-950/80">
                    <Search className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    <input
                      id="resmi-search"
                      data-testid="official-search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Ornek: IV-A, villa, hastane, AVM, okul"
                      className="w-full bg-transparent text-sm font-semibold text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    />
                  </div>
                  <p className="mt-3 text-xs leading-6 text-zinc-500 dark:text-zinc-400">
                    Yazdikca resmi siniflari, ornek yapilari ve sinif kodlarini birlikte
                    tarar.
                  </p>

                  {deferredSearchQuery ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
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
                            className="rounded-2xl border border-zinc-200 bg-white p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/60 dark:border-zinc-800 dark:bg-zinc-950/70 dark:hover:border-blue-600/40 dark:hover:bg-blue-950/20"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-black text-zinc-950 dark:text-white">
                                {row.sinifAdi}
                              </span>
                              <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
                                {row.sinifKodu}
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                              {row.ornekYapilar.slice(0, 2).join(" / ")}
                            </p>
                          </button>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-5 text-sm leading-6 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400 md:col-span-2">
                          Sonuc bulunamadi. Konut, villa, okul, hastane, AVM gibi bina tipi
                          kelimeleri veya dogrudan sinif kodu yazabilirsin.
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400" htmlFor="resmi-grup">
                      Ana grup
                    </label>
                    <select
                      id="resmi-grup"
                      data-testid="official-group-select"
                      value={manualSelection.grup}
                      onChange={(event) => handleManualGroupChange(event.target.value as OfficialCostGroupCode)}
                      className="tool-input w-full px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                    >
                      {groups.map((groupCode) => {
                        const row = allRows.find((item) => item.anaGrupKodu === groupCode);
                        return (
                          <option key={groupCode} value={groupCode}>
                            {row?.anaGrupAdi ?? groupCode}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400" htmlFor="resmi-sinif">
                      Alt grup / sinif
                    </label>
                    <select
                      id="resmi-sinif"
                      data-testid="official-class-select"
                      value={manualSelection.sinif}
                      onChange={(event) => handleManualClassChange(event.target.value as OfficialCostClassCode)}
                      className="tool-input w-full px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                    >
                      {manualClassOptions.map((classCode) => {
                        const row = allRows.find(
                          (item) => item.anaGrupKodu === manualSelection.grup && item.altGrupKodu === classCode
                        );
                        return (
                          <option key={classCode} value={classCode}>
                            {row?.sinifAdi ?? `${manualSelection.grup}-${classCode}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400" htmlFor="alan">
                  Toplam insaat alani (m2)
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
                  className="tool-input w-full px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                />
                {!hasValidArea ? (
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Gecerli bir toplam insaat alani girin. Alan en az 1 m2 olmali.
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                  Secilen resmi sinif
                </p>
                <p className="mt-2 text-lg font-black text-zinc-950 dark:text-white">
                  <span data-testid="official-selected-class-code">{selectedRow?.sinifKodu}</span>
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {selectedRow?.sinifAdi}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-blue-200/70 bg-blue-50/80 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Formul</p>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                Toplam insaat alani x resmi m2 birim maliyeti = toplam resmi yaklasik maliyet
              </p>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Bu arac piyasa teklifi uretmez. Ruhsat, resmi referans ve yaklasik butce karsilastirmasi icin kullanilir.
              </p>
            </div>
          </section>

          <section className="tool-result-panel rounded-[32px] p-6 text-white md:p-8">
            {result && selectedRow ? (
              <div className="space-y-6">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-200/80">Sonuc</p>
                  <h2 className="mt-2 text-3xl font-black">{selectedRow.sinifAdi}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-50/85">
                    Resmi secim, {selectedRow.anaGrupAdi} icindeki {selectedRow.sinifAdi} icin hesaplandi.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="tool-result-inner rounded-2xl p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-blue-100/70">
                      Resmi m2 birim maliyeti
                    </p>
                    <p className="mt-2 text-2xl font-black">
                      <span data-testid="official-unit-cost-value">
                        {formatM2Fiyat(selectedRow.m2BirimMaliyet)}
                      </span>
                    </p>
                  </div>
                  <div className="tool-result-inner rounded-2xl p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-blue-100/70">
                      Toplam resmi maliyet
                    </p>
                    <p className="mt-2 text-2xl font-black">
                      <span data-testid="official-total-cost-value">
                        {formatTL(result.resmiToplamMaliyet)}
                      </span>
                    </p>
                  </div>
                  <div className="tool-result-inner rounded-2xl p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-blue-100/70">
                      Toplam insaat alani
                    </p>
                    <p className="mt-2 text-2xl font-black">
                      <span data-testid="official-area-value">
                        {safeArea.toLocaleString("tr-TR")} m2
                      </span>
                    </p>
                  </div>
                  <div className="tool-result-inner rounded-2xl p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-blue-100/70">
                      Resmi sinif kodu
                    </p>
                    <p className="mt-2 text-2xl font-black">
                      <span data-testid="official-result-class-code">{selectedRow.sinifKodu}</span>
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                  <div className="tool-result-inner rounded-[28px] p-5">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-100/70">
                      Hesap ozeti
                    </p>
                    <div className="mt-4 space-y-3 text-sm text-blue-50/90">
                      <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
                        <span className="text-blue-100/70">Yil</span>
                        <span className="text-right font-semibold">{YIL}</span>
                      </div>
                      <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
                        <span className="text-blue-100/70">Ana grup</span>
                        <span className="text-right font-semibold">{selectedGroup?.anaGrupAdi}</span>
                      </div>
                      <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
                        <span className="text-blue-100/70">Alt grup / sinif</span>
                        <span className="text-right font-semibold">{selectedRow.sinifAdi}</span>
                      </div>
                      <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
                        <span className="text-blue-100/70">Formul</span>
                        <span className="max-w-[18rem] text-right font-semibold">
                          {result.formula} x {safeArea.toLocaleString("tr-TR")} m2
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-blue-100/70">Kapsam</span>
                        <span className="max-w-[18rem] text-right font-semibold">
                          Resmi yaklasik birim maliyet referansi
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {activeGuideMeta ? (
                      <div className="tool-result-inner rounded-[28px] p-5">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-100/70">
                          Kolay secim ozeti
                        </p>
                        <p className="mt-3 text-lg font-black text-white">
                          {activeGuideMeta.category.label}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-blue-50/85">
                          {activeGuideMeta.option.label}
                        </p>
                        <p className="mt-2 text-xs leading-6 text-blue-100/70">
                          {activeGuideMeta.option.description}
                        </p>
                      </div>
                    ) : null}

                    <div className="tool-result-inner rounded-[28px] p-5">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-100/70">
                        Kaynak
                      </p>
                      <p className="mt-3 text-sm leading-6 text-blue-50/85">
                        2026 resmi yaklasik birim maliyet tablosu kullaniliyor.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <a
                          href={OFFICIAL_UNIT_COST_SOURCE_2026.localPdfPath}
                          target="_blank"
                          rel="noreferrer"
                          data-testid="official-local-pdf-link"
                          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-white/15"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Resmi PDF dosyasini ac
                        </a>
                        <a
                          href={OFFICIAL_UNIT_COST_SOURCE_2026.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          data-testid="official-source-link"
                          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-white/15"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Resmi kaynak
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="tool-result-inner rounded-[28px] p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-100/70">
                    Ornek yapi turleri
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {selectedRow.ornekYapilar.map((example) => (
                      <div
                        key={example}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-blue-50/90"
                      >
                        {example}
                      </div>
                    ))}
                  </div>
                </div>

                {exportError ? (
                  <div className="rounded-2xl border border-rose-300/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                    {exportError}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    data-testid="official-print-button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-white/15"
                  >
                    <Printer className="h-4 w-4" />
                    Yazdir
                  </button>
                  <button
                    type="button"
                    data-testid="official-pdf-button"
                    onClick={downloadPdf}
                    disabled={isExporting || !hasValidArea}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:bg-white/60"
                  >
                    <Download className="h-4 w-4" />
                    {isExporting ? "PDF hazirlaniyor" : "PDF raporu"}
                  </button>
                  <Link
                    href={detayliMaliyetLink}
                    data-testid="official-compare-link"
                    className="inline-flex items-center gap-2 rounded-full border border-blue-200/30 bg-blue-400/10 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-blue-50 transition-colors hover:bg-blue-400/15"
                  >
                    <Compass className="h-4 w-4" />
                    Detayli maliyet araci ile karsilastir
                  </Link>
                </div>
              </div>
            ) : (
              <div className="tool-result-inner rounded-[28px] p-6">
                <p className="text-lg font-black text-white">Resmi sonuc hazir degil</p>
                <p className="mt-3 max-w-xl text-sm leading-7 text-blue-50/85">
                  Gecerli bir grup, sinif ve toplam insaat alani secildiginde resmi
                  yaklasik maliyet burada gosterilecek.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
