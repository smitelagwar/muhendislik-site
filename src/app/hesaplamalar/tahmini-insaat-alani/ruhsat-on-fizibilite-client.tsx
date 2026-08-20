"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Building2, Calculator, ChevronRight } from "lucide-react";
import {
  CURRENT_RULE_SNAPSHOT,
  calculateRuhsatFeasibility,
  normalizeRuhsatAnalysisInput,
  type ConfidenceEvidence,
} from "@/lib/calculations/modules/ruhsat-on-fizibilite";
import { RuhsatInputFlow } from "./components/RuhsatInputFlow";
import { RuhsatReportActions } from "./components/RuhsatReportActions";
import { RuhsatResultsExperience } from "./components/RuhsatResultsExperience";
import { RuhsatShellSummary } from "./components/RuhsatShellSummary";
import {
  buildRawRuhsatInput,
  buildScenarioAssumptionSet,
  createInitialRuhsatFormState,
  type RuhsatFormState,
  type ScenarioAssumptionFormState,
} from "./ruhsat-form-state";

export function RuhsatOnFizibiliteClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<RuhsatFormState>(createInitialRuhsatFormState);

  useEffect(() => {
    if (!searchParams.toString()) {
      return;
    }

    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }, [pathname, router, searchParams]);

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
    setForm((current) => ({ ...current, [field]: value }) as RuhsatFormState);
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

  return (
    <div className="tool-page-shell min-h-screen">
      <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-8 md:py-12 lg:px-12">
        <div className="mb-8 max-w-4xl sm:mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-700 shadow-[0_0_15px_rgba(139,92,246,0.13)] dark:border-violet-400/30 dark:bg-violet-500/15 dark:text-violet-200 dark:shadow-[0_0_18px_rgba(139,92,246,0.3)]">
            <Calculator className="h-3.5 w-3.5" /> Ruhsat ön fizibilite
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl dark:text-white">
            İmar hakkını, veri güvenini ve daire senaryolarını birlikte görün.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base dark:text-slate-300">
            Bu ön etüt; parsel, TAKS/KAKS, kat ve belge verilerini tek zincirde değerlendirir.
            Eksik veya teyit bekleyen veri kesin sonuca dönüştürülmez.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-muted-foreground dark:text-slate-400">
            <Building2 className="h-4 w-4 text-violet-600 dark:text-violet-300" />
            Yalnız 01.07.2026 ve sonrası konut başvuruları için yürütülebilir snapshot aktif.
            <ChevronRight className="h-4 w-4" />
            Yerel plan notları ayrıca teyit edilir.
          </div>
        </div>

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
      </div>
    </div>
  );
}
