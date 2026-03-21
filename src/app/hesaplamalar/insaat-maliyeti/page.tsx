"use client";

import { useCallback, useMemo, useReducer } from "react";
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

// ─────────────────────────────────────────────
// STATE VE ACTIONS
// ─────────────────────────────────────────────

interface HesaplamaState {
  project:   ProjectProfile;
  inputs:    CategoryInputs;
  overrides: Partial<PriceBook>;
}

type Action =
  | { type: "UPDATE_PROJECT";         payload: Partial<ProjectProfile> }
  | { type: "APPLY_PRESET";           presetId: string }
  | { type: "UPDATE_CATEGORY_INPUT";  key: CompositeCategoryKey; payload: Record<string, unknown> }
  | { type: "OVERRIDE_PRICE";         key: keyof PriceBook; value: number }
  | { type: "RESET" };

const DEFAULT_PROJECT: ProjectProfile = {
  yapiTuru:             "apartman",
  insaatAlani:           500,
  katAdedi:               4,
  bagimsizBolumSayisi:    8,
  kaliteSeviyesi:        "orta",
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
      return {
        ...state,
        project,
        inputs: buildDefaultInputs(project), // proje değişince auto-fill
      };
    }

    case "APPLY_PRESET": {
      const preset = PRESETS.find(p => p.id === action.presetId);
      if (!preset) return state;
      return {
        project:   preset.project,
        inputs:    preset.inputs,
        overrides: {},
      };
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

    case "OVERRIDE_PRICE": {
      return {
        ...state,
        overrides: { ...state.overrides, [action.key]: action.value },
      };
    }

    case "RESET":
      return init();

    default:
      return state;
  }
}

// ─────────────────────────────────────────────
// ANA SAYFA BİLEŞENİ
// ─────────────────────────────────────────────

export default function InsaatMaliyetiPage() {
  const [state, dispatch] = useReducer(reducer, undefined, init);

  // Snapshot — saf fonksiyon, proje/input/override değiştikçe memoize
  const snapshot: CalculationResultSnapshot = useMemo(() => {
    const layer = buildPriceLayer(state.overrides);
    return buildSnapshot(state.project, state.inputs, layer);
  }, [state]);

  // Dispatch yardımcıları — memoize
  const updateProject   = useCallback((p: Partial<ProjectProfile>) => dispatch({ type: "UPDATE_PROJECT", payload: p }), []);
  const applyPreset     = useCallback((id: string) => dispatch({ type: "APPLY_PRESET", presetId: id }), []);
  const updateCatInput  = useCallback((key: CompositeCategoryKey, payload: Record<string, unknown>) =>
    dispatch({ type: "UPDATE_CATEGORY_INPUT", key, payload }), []);
  const overridePrice   = useCallback((key: keyof PriceBook, value: number) => dispatch({ type: "OVERRIDE_PRICE", key, value }), []);
  const reset           = useCallback(() => dispatch({ type: "RESET" }), []);

  return (
    <div className="mx-auto max-w-screen-2xl px-6 py-10 sm:px-10 lg:px-16">

      {/* ── HEADER ── */}
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
          İnşaat Maliyet Hesaplama
        </h1>
        <p className="text-sm text-zinc-500">
          Projenizin kaba iş, ince iş ve diğer giderlerini 12 kategoride hesaplayın.
          Veriler referans niteliğindedir; birim fiyatları kendi değerlerinizle güncelleyebilirsiniz.
        </p>
      </div>

      {/* ── PROJE GİRİŞ FORMU ── */}
      <ProjeGirisFormu
        project={state.project}
        snapshot={snapshot}
        onUpdate={updateProject}
        onApplyPreset={applyPreset}
        onReset={reset}
      />

      {/* ADIM 5 — Kategori kartları buraya gelecek */}
      {/* ADIM 6 — Sticky özet kart buraya gelecek */}
      {/* ADIM 7 — Pie chart buraya gelecek */}

      {/* Geçici: Ham sonucu debug olarak göster */}
      <details className="mt-10 rounded-lg border border-zinc-800 bg-[#0d0d0d] p-4">
        <summary className="cursor-pointer text-xs text-zinc-500">
          Snapshot (geliştirici — ADIM 5  sonrası kaldırılacak)
        </summary>
        <pre className="mt-3 overflow-x-auto text-xs text-zinc-600">
          {JSON.stringify({ genelToplam: snapshot.genelToplam, m2: snapshot.m2BasinaFiyat }, null, 2)}
        </pre>
      </details>
    </div>
  );
}

// Dispatch callback tipleri — diğer bileşenler için export
export type { Action, HesaplamaState };
export type UpdateCatInput = (key: CompositeCategoryKey, payload: Record<string, unknown>) => void;
export type OverridePrice  = (key: keyof PriceBook, value: number) => void;
