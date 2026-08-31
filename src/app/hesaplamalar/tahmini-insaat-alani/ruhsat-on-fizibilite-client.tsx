"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Calculator,
  Copy,
  Check,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import {
  CURRENT_RULE_SNAPSHOT,
  calculateRuhsatFeasibility,
  normalizeRuhsatAnalysisInput,
  calculateQuickFeasibility,
  buildQuickFeasibilityViewModel,
  parseLocalizedDecimal,
  type ConfidenceEvidence,
  type UnitTypology,
} from "@/lib/calculations/modules/ruhsat-on-fizibilite";
import { RuhsatInputFlow } from "./components/RuhsatInputFlow";
import { RuhsatReportActions } from "./components/RuhsatReportActions";
import { RuhsatResultsExperience } from "./components/RuhsatResultsExperience";
import { RuhsatShellSummary } from "./components/RuhsatShellSummary";
import { QuickFeasibilityPanel } from "./components/QuickFeasibilityPanel";
import { TypologyComparisonGrid } from "./components/TypologyComparisonGrid";
import { ReverseSizingCard } from "./components/ReverseSizingCard";
import {
  buildRawRuhsatInput,
  buildScenarioAssumptionSet,
  createInitialRuhsatFormState,
  getScenarioAssumptionsForTypology,
  type RuhsatFormState,
  type ScenarioAssumptionFormState,
} from "./ruhsat-form-state";

export function RuhsatOnFizibiliteClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Mode: Basit (varsayılan) vs Gelişmiş
  const [activeMode, setActiveMode] = useState<"quick" | "advanced">("quick");

  // Form State
  const [form, setForm] = useState<RuhsatFormState>(createInitialRuhsatFormState);

  // Basit Mod özel seçimleri
  const [selectedTypology, setSelectedTypology] = useState<UnitTypology>("3+1");
  const [desiredUnits, setDesiredUnits] = useState<string>("10");
  const [reverseUnitType, setReverseUnitType] = useState<UnitTypology>("3+1");
  const [copiedSummary, setCopiedSummary] = useState(false);

  useEffect(() => {
    if (!searchParams.toString()) {
      return;
    }

    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }, [pathname, router, searchParams]);

  // Quick Feasibility Hesaplaması
  const quickCalc = useMemo(() => {
    const parcelAreaRes = parseLocalizedDecimal(form.parcelAreaM2);
    const taksRes = parseLocalizedDecimal(form.taks);
    const kaksRes = parseLocalizedDecimal(form.kaks);
    const floorCount = form.maxFloorCount ? parseInt(form.maxFloorCount, 10) : null;
    const desired = desiredUnits ? parseInt(desiredUnits, 10) : null;

    if (
      parcelAreaRes.state !== "parsed" ||
      taksRes.state !== "parsed" ||
      kaksRes.state !== "parsed"
    ) {
      return null;
    }

    return calculateQuickFeasibility({
      parcelAreaM2: parcelAreaRes.value,
      taks: taksRes.value,
      kaks: kaksRes.value,
      optionalFloorCount: Number.isFinite(floorCount) && floorCount! > 0 ? floorCount : null,
      desiredTotalUnits: Number.isFinite(desired) && desired! > 0 ? desired : null,
      reverseUnitType,
      evidence: form.evidence,
    });
  }, [form.parcelAreaM2, form.taks, form.kaks, form.maxFloorCount, form.evidence, desiredUnits, reverseUnitType]);

  const quickViewModel = useMemo(() => {
    if (!quickCalc) return null;
    const floorCount = form.maxFloorCount ? parseInt(form.maxFloorCount, 10) : null;
    return buildQuickFeasibilityViewModel(
      quickCalc,
      Number.isFinite(floorCount) && floorCount! > 0 ? floorCount : null,
      selectedTypology
    );
  }, [quickCalc, form.maxFloorCount, selectedTypology]);

  // Advanced Full Engine Hesaplaması
  const rawInput = useMemo(() => buildRawRuhsatInput(form), [form]);
  const normalization = useMemo(() => normalizeRuhsatAnalysisInput(rawInput), [rawInput]);
  const normalizedInput = normalization.ok ? normalization.value : normalization.partialValue;
  const assumptionBuild = useMemo(() => buildScenarioAssumptionSet(form), [form]);
  const calculation = useMemo(() => {
    if (!normalization.ok || !assumptionBuild.assumptions) {
      return null;
    }

    return calculateRuhsatFeasibility(
      {
        input: normalization.value,
        assumptions: assumptionBuild.assumptions,
        technicalCapacities: { shelterPersonCapacity: null },
      },
      CURRENT_RULE_SNAPSHOT
    );
  }, [assumptionBuild.assumptions, normalization]);

  const formIssues = useMemo(
    () => [
      ...normalization.issues.map((issue) => ({ field: issue.field, message: issue.message })),
      ...assumptionBuild.issues,
    ],
    [assumptionBuild.issues, normalization.issues]
  );

  const setFormField = (
    field: keyof Omit<RuhsatFormState, "evidence" | "scenarios" | "technicalReserves">,
    value: string
  ) => {
    if (
      field === "targetUnitType" &&
      (value === "1+1" || value === "2+1" || value === "3+1" || value === "4+1")
    ) {
      setSelectedTypology(value as UnitTypology);
      setReverseUnitType(value as UnitTypology);
      setForm((current) => ({
        ...current,
        targetUnitType: value as RuhsatFormState["targetUnitType"],
        scenarios: getScenarioAssumptionsForTypology(value as UnitTypology),
      }));
      return;
    }

    setForm((current) => ({ ...current, [field]: value }) as RuhsatFormState);
  };

  const handleSelectTypology = (ut: UnitTypology) => {
    setSelectedTypology(ut);
    setReverseUnitType(ut);
    setForm((current) => ({
      ...current,
      targetUnitType: ut,
      scenarios: getScenarioAssumptionsForTypology(ut),
    }));
  };

  const setEvidence = (field: keyof ConfidenceEvidence, checked: boolean) => {
    setForm((current) => ({
      ...current,
      evidence: { ...current.evidence, [field]: checked },
    }));
  };

  const setScenarioField = (
    scenarioId: keyof RuhsatFormState["scenarios"],
    field: keyof ScenarioAssumptionFormState,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      scenarios: {
        ...current.scenarios,
        [scenarioId]: { ...current.scenarios[scenarioId], [field]: value },
      },
    }));
  };

  const setTechnicalReserve = (
    field: keyof RuhsatFormState["technicalReserves"],
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      technicalReserves: { ...current.technicalReserves, [field]: value },
    }));
  };

  const handleFillExample = () => {
    setForm((current) => ({
      ...current,
      parcelAreaM2: "850",
      taks: "0.40",
      kaks: "1.60",
      maxFloorCount: "4",
    }));
  };

  const handleCopySummary = () => {
    if (!quickViewModel) return;
    navigator.clipboard.writeText(quickViewModel.customerSummary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="tool-page-shell min-h-screen">
      <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-8 md:py-12 lg:px-12">
        {/* Üst Başlık & Mod Switch Barı */}
        <div className="mb-8 flex flex-col justify-between gap-6 sm:mb-10 lg:flex-row lg:items-end">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-700 shadow-[0_0_15px_rgba(139,92,246,0.13)] dark:border-violet-400/30 dark:bg-violet-500/15 dark:text-violet-200">
                <Calculator className="h-3.5 w-3.5" /> Ruhsat Ön Fizibilite & Daire Hesabı
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                <Zap className="h-3 w-3" /> TEORİK ÖN TAHMİN
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl dark:text-white">
              Tahmini İnşaat Alanı & Daire Fizibilitesi
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base dark:text-slate-300">
              Arsa alanı, TAKS ve KAKS ile teorik yapı hakkını anında görün. 1+1, 2+1, 3+1 ve 4+1 tipolojilerini
              yan yana karşılaştırın. Kat, geometri ve çekirdek bilgisi girdikçe ön etüdü güvenle daraltın.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex shrink-0 items-center rounded-2xl border border-border/80 bg-muted/40 p-1.5 backdrop-blur-xl dark:border-white/10 dark:bg-[#070a1e]">
            <button
              type="button"
              data-testid="ruhsat-mode-quick"
              onClick={() => setActiveMode("quick")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition ${
                activeMode === "quick"
                  ? "bg-background text-foreground shadow-sm dark:bg-violet-600 dark:text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Zap className="h-4 w-4" /> Basit Mod (Hızlı)
            </button>
            <button
              type="button"
              data-testid="ruhsat-mode-advanced"
              onClick={() => setActiveMode("advanced")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition ${
                activeMode === "advanced"
                  ? "bg-background text-foreground shadow-sm dark:bg-violet-600 dark:text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" /> Gelişmiş Mod (Tam)
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BASİT MOD GÖRÜNÜMÜ                                        */}
        {/* ========================================================= */}
        {activeMode === "quick" ? (
          <div className="space-y-6" aria-live="polite">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.95fr)] xl:items-start xl:gap-8">
              {/* Sol Sütun: Temel Girdiler & Ters Hesap */}
              <div className="space-y-6">
                <QuickFeasibilityPanel
                  parcelArea={form.parcelAreaM2}
                  taks={form.taks}
                  kaks={form.kaks}
                  floorCount={form.maxFloorCount}
                  onParcelAreaChange={(val) => setFormField("parcelAreaM2", val)}
                  onTaksChange={(val) => setFormField("taks", val)}
                  onKaksChange={(val) => setFormField("kaks", val)}
                  onFloorCountChange={(val) => setFormField("maxFloorCount", val)}
                  onFillExample={handleFillExample}
                />

                <ReverseSizingCard
                  desiredUnits={desiredUnits}
                  reverseUnitType={reverseUnitType}
                  onDesiredUnitsChange={setDesiredUnits}
                  onReverseUnitTypeChange={setReverseUnitType}
                  reverseResult={quickViewModel?.reverseSizing ?? null}
                />
              </div>

              {/* Sağ Sütun: Sonuçlar HUD, Tipoloji Grid ve Müşteri Özeti */}
              <div className="space-y-6">
                {/* 1. Teorik İmar Hakkı HUD Kartı */}
                {quickViewModel ? (
                  <section className="rounded-[28px] border border-border/80 bg-card/95 p-5 shadow-[0_16px_45px_rgba(0,0,0,0.06)] backdrop-blur-2xl sm:p-6 dark:border-violet-500/25 dark:bg-[#090d26]/90">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3 dark:border-white/10">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">
                          Yasal Üst Sınırlar
                        </span>
                        <h2 className="text-lg font-black text-foreground dark:text-white">
                          Teorik İmar Hakkı
                        </h2>
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">
                        Parsel: {quickViewModel.legalRightsFormatted.parcelAreaM2}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-2xl border border-border/70 bg-muted/30 p-3.5 dark:border-white/10 dark:bg-[#070a1e]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Maks. Taban (TAKS)
                        </span>
                        <strong className="mt-1 block font-mono text-xl font-black text-foreground dark:text-white">
                          {quickViewModel.legalRightsFormatted.taksMaxM2}
                        </strong>
                        <span className="text-[10px] text-muted-foreground">TAKS: {quickViewModel.legalRightsFormatted.taks}</span>
                      </div>

                      <div className="rounded-2xl border border-border/70 bg-muted/30 p-3.5 dark:border-white/10 dark:bg-[#070a1e]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Maks. Emsal (KAKS)
                        </span>
                        <strong className="mt-1 block font-mono text-xl font-black text-foreground dark:text-white">
                          {quickViewModel.legalRightsFormatted.emsalMaxM2}
                        </strong>
                        <span className="text-[10px] text-muted-foreground">KAKS: {quickViewModel.legalRightsFormatted.kaks}</span>
                      </div>

                      <div className="rounded-2xl border border-border/70 bg-muted/30 p-3.5 dark:border-white/10 dark:bg-[#070a1e]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Teorik Min. Kat Plakası
                        </span>
                        <strong className="mt-1 block font-mono text-xl font-black text-violet-700 dark:text-violet-300">
                          ~ {quickViewModel.legalRightsFormatted.impliedMinFloorPlates} Kat
                        </strong>
                        <span className="text-[10px] text-muted-foreground">Emsal dağılım ihtiyacı</span>
                      </div>

                      <div className="rounded-2xl border border-border/70 bg-muted/30 p-3.5 dark:border-white/10 dark:bg-[#070a1e]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Etkin Oturum Sınırı
                        </span>
                        <strong className="mt-1 block font-mono text-xl font-black text-foreground dark:text-white">
                          {quickViewModel.legalRightsFormatted.effectiveFootprintLimitM2}
                        </strong>
                        <span className="text-[10px] text-muted-foreground">Geometri teyitsiz</span>
                      </div>
                    </div>
                  </section>
                ) : (
                  <div className="rounded-[28px] border border-dashed border-violet-500/30 bg-violet-500/5 p-8 text-center dark:border-violet-400/20 dark:bg-[#090d26]/50">
                    <p className="text-base font-bold text-foreground dark:text-slate-200">
                      Sonuçları görmek için sol taraftan Arsa Alanı, TAKS ve KAKS değerlerini girin.
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      veya hızlıca başlamak için &quot;Örnek Doldur&quot; butonuna tıklayın.
                    </p>
                  </div>
                )}

                {/* 2. Daire Tipolojileri Karşılaştırma Grid'i */}
                {quickViewModel && (
                  <TypologyComparisonGrid
                    typologies={quickViewModel.typologies}
                    selectedTypology={selectedTypology}
                    onSelectTypology={handleSelectTypology}
                  />
                )}

                {/* 3. Müşteriye Söyle Hazır Cümlesi & Sıradaki Veri */}
                {quickViewModel && (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {/* Müşteriye Söyle */}
                    <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-card to-card p-5 dark:border-violet-500/20 dark:from-violet-950/30 dark:via-[#090d26] dark:to-[#090d26]">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">
                          Müşteriye Söyle
                        </span>
                        <button
                          type="button"
                          onClick={handleCopySummary}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
                        >
                          {copiedSummary ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Kopyalandı
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" /> Kopyala
                            </>
                          )}
                        </button>
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-foreground/90 sm:text-sm dark:text-slate-200">
                        &ldquo;{quickViewModel.customerSummary}&rdquo;
                      </p>
                    </div>

                    {/* Sıradaki En Değerli Veri CTA */}
                    <div className="rounded-2xl border border-border/80 bg-card/90 p-5 dark:border-white/10 dark:bg-[#090d26]">
                      <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">
                        Sonucu Daraltmak İçin Sıradaki Adım
                      </span>
                      <h4 className="mt-1 text-sm font-black text-foreground dark:text-white">
                        {quickViewModel.nextBestInput.label}
                      </h4>
                      <p className="mt-1.5 text-xs text-muted-foreground leading-5">
                        {quickViewModel.nextBestInput.description}
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveMode("advanced")}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-violet-700 transition hover:gap-2 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200"
                      >
                        <span>{quickViewModel.nextBestInput.actionHint}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Kalıcı Ön Fizibilite Sorumluluk Reddi */}
            <div className="flex items-start gap-2.5 rounded-2xl border border-border/60 bg-muted/25 p-4 text-xs text-muted-foreground dark:border-white/5 dark:bg-[#070a1e]/60">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="leading-relaxed">
                <strong>Önemli Mesleki Not:</strong> Bu araç kesin mimari proje, statik hesap veya resmî ruhsat onayı yerine geçmez.
                Üretilen daire adetleri ve metrekareler, Türkiye imar mevzuatı ve tipik mimari yerleşim teamüllerine dayalı teorik üst sınır ve
                ön etüt göstergeleridir. Kesin sonuçlar; parselin koordinatlı aplikasyon krokisi, kadastral çekme mesafeleri, yol kotu ve belediye imar çapı ile doğrulanmalıdır.
              </p>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* GELİŞMİŞ MOD GÖRÜNÜMÜ                                     */
          /* ========================================================= */
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] xl:items-start xl:gap-8">
            <div className="order-2 xl:order-1">
              <RuhsatInputFlow
                form={form}
                issues={formIssues}
                onFieldChange={setFormField}
                onEvidenceChange={setEvidence}
                onScenarioChange={setScenarioField}
                onTechnicalReserveChange={setTechnicalReserve}
              />
            </div>
            <div className="order-1 space-y-5 xl:order-2">
              <RuhsatShellSummary
                confidence={normalizedInput.confidence}
                normalizationIssues={normalization.issues}
                assumptionIssues={assumptionBuild.issues}
                calculation={calculation}
              />
              <RuhsatResultsExperience analysis={calculation?.ok ? calculation.value : null} />
              <RuhsatReportActions
                analysis={calculation?.ok ? calculation.value : null}
                rawInput={rawInput}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
