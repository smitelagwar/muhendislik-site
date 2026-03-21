"use client";

import { useCallback, useMemo, useReducer, useState } from "react";
import type {
  CalculationResultSnapshot,
  CategoryInputs,
  CompositeCategoryKey,
  PriceBook,
  ProjectProfile,
} from "@/lib/calculations/types";
import {
  buildDefaultInputs,
  buildPriceLayer,
  buildSnapshot,
} from "@/lib/calculations/modules/insaat-maliyeti/engine";
import { PRESETS } from "@/lib/calculations/presets";
import { ProjeGirisFormu } from "./components/ProjeGirisFormu";
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

// ─────────────────────────────────────────────
// STATE VE REDUCER
// ─────────────────────────────────────────────

interface HesaplamaState {
  project:   ProjectProfile;
  inputs:    CategoryInputs;
  overrides: Partial<PriceBook>;
}

type Action =
  | { type: "UPDATE_PROJECT";        payload: Partial<ProjectProfile> }
  | { type: "APPLY_PRESET";          presetId: string }
  | { type: "UPDATE_CATEGORY_INPUT"; key: CompositeCategoryKey; payload: Record<string, unknown> }
  | { type: "OVERRIDE_PRICE";        key: keyof PriceBook; value: number }
  | { type: "RESET" };

const DEFAULT_PROJECT: ProjectProfile = {
  yapiTuru:            "apartman",
  insaatAlani:          500,
  katAdedi:              4,
  bagimsizBolumSayisi:   8,
  kaliteSeviyesi:       "orta",
};

function init(): HesaplamaState {
  return {
    project:   DEFAULT_PROJECT,
    inputs:    buildDefaultInputs(DEFAULT_PROJECT),
    overrides: {},
  };
}

function reducer(state: HesaplamaState, action: Action): HesaplamaState {
  switch (action.type) {
    case "UPDATE_PROJECT": {
      const project = { ...state.project, ...action.payload };
      return { ...state, project, inputs: buildDefaultInputs(project) };
    }
    case "APPLY_PRESET": {
      const preset = PRESETS.find(p => p.id === action.presetId);
      if (!preset) return state;
      return { project: preset.project, inputs: preset.inputs, overrides: {} };
    }
    case "UPDATE_CATEGORY_INPUT": {
      return {
        ...state,
        inputs: {
          ...state.inputs,
          [action.key]: {
            ...state.inputs[action.key as keyof CategoryInputs],
            ...action.payload,
          },
        },
      };
    }
    case "OVERRIDE_PRICE":
      return { ...state, overrides: { ...state.overrides, [action.key]: action.value } };
    case "RESET":
      return init();
    default:
      return state;
  }
}

// ─────────────────────────────────────────────
// ANA SAYFA
// ─────────────────────────────────────────────

export default function InsaatMaliyetiPage() {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const [openCats, setOpenCats] = useState<Set<CompositeCategoryKey>>(new Set());

  const snapshot: CalculationResultSnapshot = useMemo(() => {
    const layer = buildPriceLayer(state.overrides);
    return buildSnapshot(state.project, state.inputs, layer);
  }, [state]);

  const updateProject  = useCallback((p: Partial<ProjectProfile>) => dispatch({ type: "UPDATE_PROJECT", payload: p }), []);
  const applyPreset    = useCallback((id: string) => dispatch({ type: "APPLY_PRESET", presetId: id }), []);
  const reset          = useCallback(() => { dispatch({ type: "RESET" }); setOpenCats(new Set()); }, []);

  const updateCat = useCallback((key: CompositeCategoryKey, payload: Record<string, unknown>) =>
    dispatch({ type: "UPDATE_CATEGORY_INPUT", key, payload }), []);

  const toggleCat = useCallback((key: CompositeCategoryKey) => {
    setOpenCats(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  // Kategori sonuçlarını key ile indexle
  const catMap = useMemo(() =>
    Object.fromEntries(snapshot.categories.map(c => [c.key, c])),
  [snapshot]);

  return (
    <div className="mx-auto max-w-screen-2xl px-6 py-10 sm:px-10 lg:px-16">

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
          İnşaat Maliyet Hesaplama
        </h1>
        <p className="text-sm text-zinc-500">
          Projenizin kaba iş, ince iş ve diğer giderlerini 12 kategoride hesaplayın.
          Kategori başlıklarına tıklayarak detayları açın ve değerleri düzenleyin.
        </p>
      </div>

      {/* PROJE GİRİŞ FORMU */}
      <ProjeGirisFormu
        project={state.project}
        snapshot={snapshot}
        onUpdate={updateProject}
        onApplyPreset={applyPreset}
        onReset={reset}
      />

      {/* GRUP ETİKETLERİ */}
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { label: "⬛ Kaba İş",     total: snapshot.kabaIsToplamı, pct: snapshot.kabaIsPct, cls: "text-blue-400" },
          { label: "⬛ İnce İş",     total: snapshot.inceIsToplamı, pct: snapshot.inceIsPct, cls: "text-emerald-400" },
          { label: "⬛ Diğer Gider", total: snapshot.digerToplamı,  pct: snapshot.digerPct,  cls: "text-purple-400" },
        ].map(g => (
          <div key={g.label} className="rounded-lg border border-zinc-800 bg-[#0d0d0d] px-4 py-2">
            <span className={`text-xs font-semibold ${g.cls}`}>
              {g.label.replace("⬛ ", "")}
            </span>
            <span className="mx-2 text-xs text-zinc-700">|</span>
            <span className="text-xs font-bold text-zinc-300 tabular-nums">
              {Math.round(g.total).toLocaleString("tr-TR")} TL
            </span>
            <span className="ml-1.5 text-xs text-zinc-600">
              (%{(g.pct * 100).toFixed(1)})
            </span>
          </div>
        ))}
      </div>

      {/* KATEGORİ KARTLARI */}
      <div className="space-y-2">

        {catMap.betonDemir && (
          <KategoriKarti result={catMap.betonDemir} isOpen={openCats.has("betonDemir")} onToggle={() => toggleCat("betonDemir")}>
            <BetonDemirForm input={state.inputs.betonDemir} onChange={p => updateCat("betonDemir", p as Record<string, unknown>)} />
          </KategoriKarti>
        )}

        {catMap.duvar && (
          <KategoriKarti result={catMap.duvar} isOpen={openCats.has("duvar")} onToggle={() => toggleCat("duvar")}>
            <DuvarForm input={state.inputs.duvar} onChange={p => updateCat("duvar", p as Record<string, unknown>)} />
          </KategoriKarti>
        )}

        {catMap.cati && (
          <KategoriKarti result={catMap.cati} isOpen={openCats.has("cati")} onToggle={() => toggleCat("cati")}>
            <CatiForm input={state.inputs.cati} onChange={p => updateCat("cati", p as Record<string, unknown>)} />
          </KategoriKarti>
        )}

        {catMap.suYalitimi && (
          <KategoriKarti result={catMap.suYalitimi} isOpen={openCats.has("suYalitimi")} onToggle={() => toggleCat("suYalitimi")}>
            <SuYalitimForm input={state.inputs.suYalitimi} onChange={p => updateCat("suYalitimi", p as Record<string, unknown>)} />
          </KategoriKarti>
        )}

        {catMap.disCephe && (
          <KategoriKarti result={catMap.disCephe} isOpen={openCats.has("disCephe")} onToggle={() => toggleCat("disCephe")}>
            <DisCepheForm input={state.inputs.disCephe} onChange={p => updateCat("disCephe", p as Record<string, unknown>)} />
          </KategoriKarti>
        )}

        {catMap.isitmaSogutma && (
          <KategoriKarti result={catMap.isitmaSogutma} isOpen={openCats.has("isitmaSogutma")} onToggle={() => toggleCat("isitmaSogutma")}>
            <IsitmaSogutmaForm input={state.inputs.isitmaSogutma} onChange={p => updateCat("isitmaSogutma", p as Record<string, unknown>)} />
          </KategoriKarti>
        )}

        {catMap.seramikMermer && (
          <KategoriKarti result={catMap.seramikMermer} isOpen={openCats.has("seramikMermer")} onToggle={() => toggleCat("seramikMermer")}>
            <SeramikMermerForm input={state.inputs.seramikMermer} onChange={p => updateCat("seramikMermer", p as Record<string, unknown>)} />
          </KategoriKarti>
        )}

        {catMap.sivaBoya && (
          <KategoriKarti result={catMap.sivaBoya} isOpen={openCats.has("sivaBoya")} onToggle={() => toggleCat("sivaBoya")}>
            <SivaBoyaForm input={state.inputs.sivaBoya} onChange={p => updateCat("sivaBoya", p as Record<string, unknown>)} />
          </KategoriKarti>
        )}

        {catMap.pencereKapi && (
          <KategoriKarti result={catMap.pencereKapi} isOpen={openCats.has("pencereKapi")} onToggle={() => toggleCat("pencereKapi")}>
            <PencereKapiForm input={state.inputs.pencereKapi} onChange={p => updateCat("pencereKapi", p as Record<string, unknown>)} />
          </KategoriKarti>
        )}

        {catMap.parkeKaplama && (
          <KategoriKarti result={catMap.parkeKaplama} isOpen={openCats.has("parkeKaplama")} onToggle={() => toggleCat("parkeKaplama")}>
            <ParkeKaplamaForm input={state.inputs.parkeKaplama} onChange={p => updateCat("parkeKaplama", p as Record<string, unknown>)} />
          </KategoriKarti>
        )}

        {catMap.elektrikAlcipan && (
          <KategoriKarti result={catMap.elektrikAlcipan} isOpen={openCats.has("elektrikAlcipan")} onToggle={() => toggleCat("elektrikAlcipan")}>
            <ElektrikAlcipanForm input={state.inputs.elektrikAlcipan} onChange={p => updateCat("elektrikAlcipan", p as Record<string, unknown>)} />
          </KategoriKarti>
        )}

        {catMap.kamuSabit && (
          <KategoriKarti result={catMap.kamuSabit} isOpen={openCats.has("kamuSabit")} onToggle={() => toggleCat("kamuSabit")}>
            <KamuSabitForm input={state.inputs.kamuSabit} onChange={p => updateCat("kamuSabit", p as Record<string, unknown>)} proj={state.project} />
          </KategoriKarti>
        )}

      </div>

      {/* ADIM 6 — Sticky özet kart */}
      {/* ADIM 7 — Pie chart */}

    </div>
  );
}
