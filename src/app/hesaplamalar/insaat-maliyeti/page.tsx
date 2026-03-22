"use client";

import { useCallback, useMemo, useReducer, useState } from "react";
import { useSearchParams } from "next/navigation";
import type {
  CategoryInputs,
  CompositeCategoryKey,
  ProjectProfile,
} from "@/lib/calculations/types";
import {
  calculateOfficialUnitCost,
  getOfficialCostClasses,
  getOfficialCostGroups,
} from "@/lib/calculations/official-unit-costs";
import {
  buildDefaultInputs,
  buildPriceLayer,
  buildSnapshot,
} from "@/lib/calculations/modules/insaat-maliyeti/engine";
import { PRESETS } from "@/lib/calculations/presets";
import { KategoriKarti } from "./components/KategoriKarti";
import {
  BetonDemirForm,
  CatiForm,
  DisCepheForm,
  DuvarForm,
  ElektrikAlcipanForm,
  IsitmaSogutmaForm,
  KamuSabitForm,
  ParkeKaplamaForm,
  PencereKapiForm,
  SeramikMermerForm,
  SivaBoyaForm,
  SuYalitimForm,
} from "./components/KategoriFormlari";
import { OzetKarti } from "./components/OzetKarti";
import { ProjeGirisFormu } from "./components/ProjeGirisFormu";

interface HesaplamaState {
  project: ProjectProfile;
  inputs: CategoryInputs;
}

type CategoryStateKey = keyof CategoryInputs;

type Action =
  | { type: "UPDATE_PROJECT"; payload: Partial<ProjectProfile> }
  | { type: "APPLY_PRESET"; presetId: string }
  | { type: "UPDATE_CATEGORY_INPUT"; key: CategoryStateKey; payload: Record<string, unknown> }
  | { type: "RESET"; initialState: HesaplamaState };

const DEFAULT_PROJECT: ProjectProfile = {
  yapiTuru: "apartman",
  insaatAlani: 500,
  katAdedi: 4,
  bagimsizBolumSayisi: 8,
  kaliteSeviyesi: "orta",
  muteahhitKariPct: 0.15,
  kdvOraniPct: 0.2,
};

function getSeededArea(searchParams?: Pick<URLSearchParams, "get"> | null): number | null {
  const areaParam = Number.parseFloat(searchParams?.get("alan") ?? "");
  return Number.isFinite(areaParam) && areaParam > 0 ? areaParam : null;
}

function init(searchParams?: Pick<URLSearchParams, "get"> | null): HesaplamaState {
  const project = {
    ...DEFAULT_PROJECT,
    insaatAlani: getSeededArea(searchParams) ?? DEFAULT_PROJECT.insaatAlani,
  };

  return {
    project,
    inputs: buildDefaultInputs(project),
  };
}

function mergeInputsPreservingManualValues(
  currentInputs: CategoryInputs,
  previousProject: ProjectProfile,
  nextProject: ProjectProfile
): CategoryInputs {
  const previousDefaults = buildDefaultInputs(previousProject);
  const nextDefaults = buildDefaultInputs(nextProject);
  const merged = {} as Record<CategoryStateKey, CategoryInputs[CategoryStateKey]>;

  (Object.keys(nextDefaults) as CategoryStateKey[]).forEach((key) => {
    const currentCategory = currentInputs[key] as Record<string, unknown>;
    const previousDefaultCategory = previousDefaults[key] as Record<string, unknown>;
    const nextCategory = { ...(nextDefaults[key] as Record<string, unknown>) };

    Object.keys(currentCategory).forEach((field) => {
      const currentValue = currentCategory[field];
      const previousDefaultValue = previousDefaultCategory[field];

      if (currentValue !== undefined && currentValue !== previousDefaultValue) {
        nextCategory[field] = currentValue;
      }
    });

    merged[key] = nextCategory as CategoryInputs[typeof key];
  });

  return merged as CategoryInputs;
}

function reducer(state: HesaplamaState, action: Action): HesaplamaState {
  switch (action.type) {
    case "UPDATE_PROJECT": {
      const nextProject = { ...state.project, ...action.payload, presetId: undefined };
      return {
        project: nextProject,
        inputs: mergeInputsPreservingManualValues(state.inputs, state.project, nextProject),
      };
    }
    case "APPLY_PRESET": {
      const preset = PRESETS.find((item) => item.id === action.presetId);
      if (!preset) {
        return state;
      }

      return {
        project: { ...preset.project, presetId: preset.id },
        inputs: preset.inputs,
      };
    }
    case "UPDATE_CATEGORY_INPUT": {
      const nextCategory = {
        ...(state.inputs[action.key] as Record<string, unknown>),
        ...action.payload,
      } as CategoryInputs[typeof action.key];

      return {
        ...state,
        inputs: {
          ...state.inputs,
          [action.key]: nextCategory,
        },
      };
    }
    case "RESET":
      return action.initialState;
    default:
      return state;
  }
}

function parseOfficialBaseline(
  searchParams: Pick<URLSearchParams, "get">,
  fallbackArea: number
) {
  const yil = searchParams.get("yil");
  const grup = searchParams.get("grup");
  const sinif = searchParams.get("sinif");
  const areaParam = Number.parseFloat(searchParams.get("alan") ?? "");
  const alan = Number.isFinite(areaParam) && areaParam > 0 ? areaParam : fallbackArea;

  if (yil !== "2026" || !grup || !sinif) {
    return null;
  }

  const validGroups = getOfficialCostGroups(2026);
  if (!validGroups.includes(grup as (typeof validGroups)[number])) {
    return null;
  }

  const validClasses = getOfficialCostClasses(2026, grup as (typeof validGroups)[number]);
  if (!validClasses.includes(sinif as (typeof validClasses)[number])) {
    return null;
  }

  return calculateOfficialUnitCost(
    {
      yil: 2026,
      grup: grup as (typeof validGroups)[number],
      sinif: sinif as (typeof validClasses)[number],
    },
    alan
  );
}

export default function InsaatMaliyetiPage() {
  const searchParams = useSearchParams();
  const [initialState] = useState(() => init(searchParams));
  const [state, dispatch] = useReducer(reducer, initialState);
  const [openCats, setOpenCats] = useState<Set<CompositeCategoryKey>>(new Set());

  const snapshot = useMemo(() => {
    const layer = buildPriceLayer();
    return buildSnapshot(state.project, state.inputs, layer);
  }, [state.inputs, state.project]);

  const officialBaseline = useMemo(
    () => parseOfficialBaseline(searchParams, state.project.insaatAlani),
    [searchParams, state.project.insaatAlani]
  );

  const updateProject = useCallback((payload: Partial<ProjectProfile>) => {
    dispatch({ type: "UPDATE_PROJECT", payload });
  }, []);

  const applyPreset = useCallback((presetId: string) => {
    dispatch({ type: "APPLY_PRESET", presetId });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET", initialState });
    setOpenCats(new Set());
  }, [initialState]);

  const updateCat = useCallback((key: CompositeCategoryKey, payload: Record<string, unknown>) => {
    dispatch({ type: "UPDATE_CATEGORY_INPUT", key, payload });
  }, []);

  const toggleCat = useCallback((key: CompositeCategoryKey) => {
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const catMap = useMemo(
    () =>
      Object.fromEntries(
        snapshot.categories.map((category) => [category.key, category])
      ) as Record<CompositeCategoryKey, (typeof snapshot.categories)[number]>,
    [snapshot]
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_28%),linear-gradient(180deg,rgba(248,250,252,1),rgba(240,244,248,1))] text-foreground dark:bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.08),transparent_26%),linear-gradient(180deg,rgba(8,15,29,1),rgba(10,18,31,1))]">
      <div className="mx-auto max-w-screen-2xl px-6 py-10 sm:px-10 lg:px-16">
        <div className="mb-10 max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-amber-600 dark:text-amber-300">
            Pro hesap aracı
          </div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-5xl">
            İnşaat Maliyet Analizi
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Kaba iş, ince iş, kamu giderleri, müteahhit kârı ve KDV dahil olmak üzere
            tüm maliyet kalemlerini kategori bazında görebilir, varsayımları
            düzenleyebilir ve sonucu resmî 2026 birim maliyet sınıflarıyla
            karşılaştırabilirsiniz.
          </p>
        </div>

        <ProjeGirisFormu
          project={state.project}
          snapshot={snapshot}
          onUpdate={updateProject}
          onApplyPreset={applyPreset}
          onReset={reset}
        />

        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-start">
          <div className="order-2 space-y-4 lg:order-1 lg:col-span-8">
            <div className="flex flex-wrap gap-2">
              {[
                {
                  label: "Kaba iş",
                  total: snapshot.kabaIsToplamı,
                  pct: snapshot.kabaIsPct,
                  cls: "text-sky-600 dark:text-sky-300",
                },
                {
                  label: "İnce iş",
                  total: snapshot.inceIsToplamı,
                  pct: snapshot.inceIsPct,
                  cls: "text-emerald-600 dark:text-emerald-300",
                },
                {
                  label: "Diğer gider",
                  total: snapshot.digerToplamı,
                  pct: snapshot.digerPct,
                  cls: "text-violet-600 dark:text-violet-300",
                },
              ].map((group) => (
                <div
                  key={group.label}
                  className="rounded-xl border border-zinc-200/80 bg-white/80 px-3 py-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70"
                >
                  <span className={`text-[11px] font-black uppercase tracking-[0.18em] ${group.cls}`}>
                    {group.label}
                  </span>
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <span className="font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                      {Math.round(group.total).toLocaleString("tr-TR")} TL
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      %{(group.pct * 100).toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {catMap.betonDemir && (
                <KategoriKarti
                  result={catMap.betonDemir}
                  isOpen={openCats.has("betonDemir")}
                  onToggle={() => toggleCat("betonDemir")}
                >
                  <BetonDemirForm
                    input={state.inputs.betonDemir}
                    onChange={(payload) => updateCat("betonDemir", payload as Record<string, unknown>)}
                  />
                </KategoriKarti>
              )}

              {catMap.duvar && (
                <KategoriKarti
                  result={catMap.duvar}
                  isOpen={openCats.has("duvar")}
                  onToggle={() => toggleCat("duvar")}
                >
                  <DuvarForm
                    input={state.inputs.duvar}
                    onChange={(payload) => updateCat("duvar", payload as Record<string, unknown>)}
                  />
                </KategoriKarti>
              )}

              {catMap.cati && (
                <KategoriKarti
                  result={catMap.cati}
                  isOpen={openCats.has("cati")}
                  onToggle={() => toggleCat("cati")}
                >
                  <CatiForm
                    input={state.inputs.cati}
                    onChange={(payload) => updateCat("cati", payload as Record<string, unknown>)}
                  />
                </KategoriKarti>
              )}

              {catMap.suYalitimi && (
                <KategoriKarti
                  result={catMap.suYalitimi}
                  isOpen={openCats.has("suYalitimi")}
                  onToggle={() => toggleCat("suYalitimi")}
                >
                  <SuYalitimForm
                    input={state.inputs.suYalitimi}
                    onChange={(payload) => updateCat("suYalitimi", payload as Record<string, unknown>)}
                  />
                </KategoriKarti>
              )}

              {catMap.disCephe && (
                <KategoriKarti
                  result={catMap.disCephe}
                  isOpen={openCats.has("disCephe")}
                  onToggle={() => toggleCat("disCephe")}
                >
                  <DisCepheForm
                    input={state.inputs.disCephe}
                    onChange={(payload) => updateCat("disCephe", payload as Record<string, unknown>)}
                  />
                </KategoriKarti>
              )}

              {catMap.isitmaSogutma && (
                <KategoriKarti
                  result={catMap.isitmaSogutma}
                  isOpen={openCats.has("isitmaSogutma")}
                  onToggle={() => toggleCat("isitmaSogutma")}
                >
                  <IsitmaSogutmaForm
                    input={state.inputs.isitmaSogutma}
                    onChange={(payload) => updateCat("isitmaSogutma", payload as Record<string, unknown>)}
                  />
                </KategoriKarti>
              )}

              {catMap.seramikMermer && (
                <KategoriKarti
                  result={catMap.seramikMermer}
                  isOpen={openCats.has("seramikMermer")}
                  onToggle={() => toggleCat("seramikMermer")}
                >
                  <SeramikMermerForm
                    input={state.inputs.seramikMermer}
                    onChange={(payload) => updateCat("seramikMermer", payload as Record<string, unknown>)}
                  />
                </KategoriKarti>
              )}

              {catMap.sivaBoya && (
                <KategoriKarti
                  result={catMap.sivaBoya}
                  isOpen={openCats.has("sivaBoya")}
                  onToggle={() => toggleCat("sivaBoya")}
                >
                  <SivaBoyaForm
                    input={state.inputs.sivaBoya}
                    onChange={(payload) => updateCat("sivaBoya", payload as Record<string, unknown>)}
                  />
                </KategoriKarti>
              )}

              {catMap.pencereKapi && (
                <KategoriKarti
                  result={catMap.pencereKapi}
                  isOpen={openCats.has("pencereKapi")}
                  onToggle={() => toggleCat("pencereKapi")}
                >
                  <PencereKapiForm
                    input={state.inputs.pencereKapi}
                    onChange={(payload) => updateCat("pencereKapi", payload as Record<string, unknown>)}
                  />
                </KategoriKarti>
              )}

              {catMap.parkeKaplama && (
                <KategoriKarti
                  result={catMap.parkeKaplama}
                  isOpen={openCats.has("parkeKaplama")}
                  onToggle={() => toggleCat("parkeKaplama")}
                >
                  <ParkeKaplamaForm
                    input={state.inputs.parkeKaplama}
                    onChange={(payload) => updateCat("parkeKaplama", payload as Record<string, unknown>)}
                  />
                </KategoriKarti>
              )}

              {catMap.elektrikAlcipan && (
                <KategoriKarti
                  result={catMap.elektrikAlcipan}
                  isOpen={openCats.has("elektrikAlcipan")}
                  onToggle={() => toggleCat("elektrikAlcipan")}
                >
                  <ElektrikAlcipanForm
                    input={state.inputs.elektrikAlcipan}
                    onChange={(payload) => updateCat("elektrikAlcipan", payload as Record<string, unknown>)}
                  />
                </KategoriKarti>
              )}

              {catMap.kamuSabit && (
                <KategoriKarti
                  result={catMap.kamuSabit}
                  isOpen={openCats.has("kamuSabit")}
                  onToggle={() => toggleCat("kamuSabit")}
                >
                  <KamuSabitForm
                    input={state.inputs.kamuSabit}
                    onChange={(payload) => updateCat("kamuSabit", payload as Record<string, unknown>)}
                    proj={state.project}
                  />
                </KategoriKarti>
              )}
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-4">
            <OzetKarti snapshot={snapshot} officialBaseline={officialBaseline} />
          </div>
        </div>
      </div>
    </div>
  );
}
