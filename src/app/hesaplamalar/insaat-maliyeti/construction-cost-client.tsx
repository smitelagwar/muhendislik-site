"use client";

import Link from "next/link";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  ArrowRight,
  BarChart3,
  ChevronUp,
  CheckCircle2,
  Download,
  FileText,
  Info,
  Layers3,
  Plus,
  Share2,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipValueType,
} from "recharts";
import { cn } from "@/lib/utils";
import { formatM2Fiyat, formatSayi, formatTL, formatYuzde } from "@/lib/calculations/core";
import {
  getOfficialCostClasses,
  getOfficialCostGroups,
} from "@/lib/calculations/official-unit-costs";
import {
  CONSTRUCTION_COST_PRESETS,
  buildConstructionCostPdfSnapshot,
  buildConstructionCostReport,
  createDefaultCollection,
  createScenarioFromInputs,
  createScenarioFromPreset,
  deserializeCollectionFromSearchParams,
  exportConstructionCostExcel,
  nextScenarioName,
  normalizeCollection,
  serializeCollectionToSearchParams,
  type ComparisonMode,
  type ConstructionCostScenarioSnapshot,
  type ScenarioCollection,
  type ScenarioState,
} from "@/lib/calculations/modules/insaat-maliyeti-v2";
import { buildPathWithSearch } from "@/lib/url-state";

type BusyAction =
  | "preview"
  | "download"
  | "print"
  | "excel"
  | "copy"
  | "json-export"
  | "json-import"
  | null;
type ActionKey = NonNullable<BusyAction>;
type ExportActionLogEntry = {
  id: string;
  action: ActionKey;
  label: string;
  detail: string;
  createdAt: string;
};

type BreakdownSort = "order" | "amount" | "share" | "label";
type BreakdownFilter = "all" | "direct" | "indirect" | "soft" | "commercial";

type Action =
  | { type: "load"; collection: ScenarioCollection }
  | { type: "setActive"; scenarioId: string }
  | { type: "setMode"; mode: ComparisonMode }
  | { type: "updateInput"; scenarioId: string; path: string; value: unknown }
  | { type: "applyPreset"; scenarioId: string; presetId: string }
  | { type: "rename"; scenarioId: string; name: string }
  | { type: "duplicate"; scenarioId: string }
  | { type: "addCurrent" }
  | { type: "remove"; scenarioId: string }
  | { type: "reset"; scenarioId: string }
  | { type: "setOverride"; scenarioId: string; itemId: string; amount?: number };

const MONTH_LABEL = new Intl.DateTimeFormat("tr-TR", {
  month: "long",
  year: "numeric",
}).format(new Date());
const REVISION_DATE_FORMATTER = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const ACTION_LABELS: Record<ActionKey, string> = {
  preview: "PDF önizleme",
  download: "PDF indirme",
  print: "PDF yazdırma",
  excel: "Excel dışa aktarım",
  copy: "Bağlantı paylaşımı",
  "json-export": "JSON dışa aktarım",
  "json-import": "JSON içe aktarım",
};

const STRUCTURE_LABELS = {
  apartman: "Apartman",
  villa: "Villa",
  ofis: "Ofis",
  ticari: "Ticari",
} as const;

const CONSTRUCTION_COST_ROUTE = "/hesaplamalar/insaat-maliyeti";
const CONSTRUCTION_COST_DRAFT_KEY = "muhendislik-site:construction-cost-draft-v2";

async function loadReportingModule() {
  return import("@/lib/calculations/reporting");
}

const QUALITY_LABELS = {
  ekonomik: "Ekonomik",
  standart: "Standart",
  premium: "Premium",
  luks: "Lüks",
} as const;

const ISSUE_STYLES = {
  error: "border-rose-300/70 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200",
  warning:
    "border-amber-300/70 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
  info: "border-sky-300/70 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200",
} as const;

const GROUP_STYLES: Record<BreakdownFilter, { border: string; badge: string }> = {
  all: {
    border: "border-slate-300",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200",
  },
  direct: {
    border: "border-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
  },
  indirect: {
    border: "border-sky-500",
    badge: "bg-sky-50 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
  },
  soft: {
    border: "border-orange-500",
    badge: "bg-orange-50 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200",
  },
  commercial: {
    border: "border-violet-500",
    badge: "bg-violet-50 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200",
  },
};

function getBenchmarkStatusLabel(
  status: ConstructionCostScenarioSnapshot["benchmark"]["status"]
) {
  switch (status) {
    case "high":
      return "Benchmark üstü";
    case "low":
      return "Benchmark altı";
    default:
      return "Benchmark hizalı";
  }
}

function getBenchmarkStatusClasses(
  status: ConstructionCostScenarioSnapshot["benchmark"]["status"]
) {
  switch (status) {
    case "high":
      return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100";
    case "low":
      return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100";
    default:
      return "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100";
  }
}

function getDeltaClasses(isBaseline: boolean, delta: number) {
  if (isBaseline) {
    return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200";
  }

  return delta <= 0
    ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100"
    : "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100";
}

function getDeltaLabel(isBaseline: boolean, delta: number, deltaPct: number) {
  if (isBaseline) {
    return "Baz senaryo";
  }

  return `${delta <= 0 ? "↓" : "↑"} ${formatYuzde(Math.abs(deltaPct))}`;
}

function formatComparisonValue(value: number, unit: string) {
  if (unit === "TL" || unit.startsWith("TL/")) {
    return formatTL(value);
  }

  return `${formatSayi(value, 1)} ${unit}`;
}

function formatComparisonDelta(delta: number, baseline: number, unit: string) {
  const deltaPct = baseline > 0 ? Math.abs(delta / baseline) : 0;
  const deltaLabel =
    unit === "TL" || unit.startsWith("TL/")
      ? formatTL(Math.abs(delta))
      : `${formatSayi(Math.abs(delta), 1)} ${unit}`;

  return `${delta <= 0 ? "↓" : "↑"} ${deltaLabel} · ${formatYuzde(deltaPct)}`;
}

function getSectionStatusClasses(status: "ready" | "review" | "attention") {
  switch (status) {
    case "ready":
      return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100";
    case "attention":
      return "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100";
    default:
      return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100";
  }
}

function getSectionStatusLabel(status: "ready" | "review" | "attention") {
  switch (status) {
    case "ready":
      return "Hazır";
    case "attention":
      return "Dikkat";
    default:
      return "Gözden geçir";
  }
}

function getLastEditedFieldLabel(path?: string) {
  if (!path) {
    return "Henüz alan düzenlenmedi";
  }

  const labels: Array<[string, string]> = [
    ["projectName", "Proje adı"],
    ["structureKind", "Yapı türü"],
    ["qualityLevel", "Kalite seviyesi"],
    ["floorCount", "Kat adedi"],
    ["basementCount", "Bodrum kat"],
    ["unitCount", "Bağımsız bölüm"],
    ["saleableArea", "Satılabilir alan"],
    ["commonAreaRatio", "Ortak alan oranı"],
    ["area.totalArea", "Toplam inşaat alanı"],
    ["area.basementArea", "Bodrum alanı"],
    ["area.normalArea", "Normal kat alanı"],
    ["area.mezzanineArea", "Asma kat alanı"],
    ["area.roofTerraceArea", "Çatı / teras alanı"],
    ["area.parkingArea", "Otopark alanı"],
    ["area.landscapeArea", "Peyzaj alanı"],
    ["commercial.contractorMarginRate", "Müteahhit kârı"],
    ["commercial.vatRate", "KDV oranı"],
    ["commercial.overheadRate", "Overhead"],
    ["commercial.contingencyRate", "Contingency"],
    ["commercial.targetSalePrice", "Hedef satış fiyatı"],
    ["commercial.durationMonths", "Termin"],
    ["commercial.monthlyInflationRate", "Aylık enflasyon"],
    ["commercial.contractorProfile", "Yüklenici profili"],
    ["site.region", "Şehir / bölge"],
    ["site.soilClass", "Zemin sınıfı"],
    ["site.siteDifficulty", "Saha zorluğu"],
    ["site.climateZone", "İklim"],
    ["site.heatingSystem", "Isıtma sistemi"],
    ["site.facadeSystem", "Cephe sistemi"],
    ["site.mepLevel", "MEP seviyesi"],
    ["site.parkingType", "Otopark tipi"],
    ["site.wetAreaDensity", "Islak hacim yoğunluğu"],
    ["reference.officialSelection", "Resmî benchmark seçimi"],
  ];

  return labels.find(([prefix]) => path === prefix || path.startsWith(`${prefix}.`))?.[1] ?? path;
}

function getActionCardCopy(
  action: "pdf" | "excel" | "json" | "share",
  snapshot: ConstructionCostScenarioSnapshot
) {
  switch (action) {
    case "pdf":
      return {
        title: "Kompakt PDF raporu",
        value: "1 sayfa premium çıktı",
        helper: `${snapshot.scenarioName} · KPI, benchmark ve maliyet kırılımı tek dosyada`,
      };
    case "excel":
      return {
        title: "Excel analiz paketi",
        value: "Özet + kalem detayı",
        helper: "Özet, kalem detayı ve varsayımlar sheet olarak dışa aktarılır",
      };
    case "json":
      return {
        title: "Senaryo paketi",
        value: `${snapshot.scenarioName} state export`,
        helper: "Tüm senaryoları başka cihazda geri yüklemek için ham veri çıktısı",
      };
    default:
      return {
        title: "Paylaşılabilir bağlantı",
        value: "Aktif URL senkronu",
        helper: "Aktif senaryo ve karşılaştırma modu query parametreleri ile taşınır",
      };
  }
}

function parseLocaleNumber(value: string) {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  if (!normalized || normalized === "-" || normalized === ".") {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatEditableNumber(value: number, digits = 0) {
  return value.toLocaleString("tr-TR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function setDeepValue<T extends object>(source: T, path: string, value: unknown): T {
  const target = deepClone(source) as Record<string, unknown>;
  const keys = path.split(".");
  let current: Record<string, unknown> = target;

  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      current[key] = value;
      return;
    }

    current[key] = { ...(current[key] as Record<string, unknown>) };
    current = current[key] as Record<string, unknown>;
  });

  return target as T;
}

function getPdfFilename(snapshot: ConstructionCostScenarioSnapshot) {
  return `insaat-maliyet-${snapshot.scenarioName.toLocaleLowerCase("tr-TR").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Math.round(snapshot.equivalentArea)}m2.pdf`;
}

function readConstructionCostDraft() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(CONSTRUCTION_COST_DRAFT_KEY);
    if (!raw) {
      return null;
    }

    return normalizeCollection(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

function getJsonFilename(snapshot: ConstructionCostScenarioSnapshot) {
  return `insaat-maliyet-${snapshot.scenarioName.toLocaleLowerCase("tr-TR").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.json`;
}

function useAnimatedNumber(value: number) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValueRef = useRef(value);

  useEffect(() => {
    const startValue = previousValueRef.current;
    const delta = value - startValue;
    if (Math.abs(delta) < 1) {
      const frame = window.requestAnimationFrame(() => setDisplayValue(value));
      previousValueRef.current = value;
      return () => window.cancelAnimationFrame(frame);
    }

    let frame = 0;
    const startedAt = performance.now();
    const duration = 600;

    const tick = (timestamp: number) => {
      const progress = Math.min((timestamp - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = startValue + delta * eased;
      setDisplayValue(nextValue);
      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      } else {
        previousValueRef.current = value;
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  return displayValue;
}

function formatRadarTooltipValue(value: TooltipValueType | undefined) {
  const numericValue = Array.isArray(value) ? Number(value[0] ?? 0) : Number(value ?? 0);
  return [`%${Math.round(numericValue)}`, "Göreceli Oran"] as const;
}

function reduceCollection(state: ScenarioCollection, action: Action): ScenarioCollection {
  const updateScenario = (
    scenarioId: string,
    recipe: (scenario: ScenarioState) => ScenarioState
  ): ScenarioCollection => ({
    ...state,
    scenarios: state.scenarios.map((scenario) =>
      scenario.id === scenarioId ? recipe(scenario) : scenario
    ),
  });

  switch (action.type) {
    case "load":
      return normalizeCollection(action.collection);
    case "setActive":
      return { ...state, activeScenarioId: action.scenarioId };
    case "setMode":
      return { ...state, comparisonMode: action.mode };
    case "updateInput":
      return updateScenario(action.scenarioId, (scenario) => ({
        ...scenario,
        presetId: undefined,
        lastEditedField: action.path,
        inputs: setDeepValue(scenario.inputs, action.path, action.value),
      }));
    case "applyPreset": {
      const preset = createScenarioFromPreset(action.presetId);
      return updateScenario(action.scenarioId, (scenario) => ({
        ...scenario,
        presetId: action.presetId,
        manualOverrides: {},
        inputs: preset.inputs,
      }));
    }
    case "rename":
      return updateScenario(action.scenarioId, (scenario) => ({
        ...scenario,
        name: action.name || scenario.name,
      }));
    case "duplicate": {
      if (state.scenarios.length >= 3) return state;
      const source = state.scenarios.find((scenario) => scenario.id === action.scenarioId);
      if (!source) return state;
      const duplicate = createScenarioFromInputs(source.inputs, {
        name: nextScenarioName(state.scenarios),
      });
      duplicate.manualOverrides = deepClone(source.manualOverrides);
      return {
        ...state,
        activeScenarioId: duplicate.id,
        comparisonMode: "compare",
        scenarios: [...state.scenarios, duplicate],
      };
    }
    case "addCurrent": {
      if (state.scenarios.length >= 3) return state;
      const source = state.scenarios.find((scenario) => scenario.id === state.activeScenarioId);
      if (!source) return state;
      const nextScenario = createScenarioFromInputs(source.inputs, {
        name: nextScenarioName(state.scenarios),
      });
      nextScenario.manualOverrides = deepClone(source.manualOverrides);
      return {
        ...state,
        activeScenarioId: nextScenario.id,
        comparisonMode: "compare",
        scenarios: [...state.scenarios, nextScenario],
      };
    }
    case "remove": {
      if (state.scenarios.length <= 1) return state;
      const scenarios = state.scenarios.filter((scenario) => scenario.id !== action.scenarioId);
      return {
        ...state,
        activeScenarioId: scenarios[0].id,
        comparisonMode: scenarios.length > 1 ? "compare" : "single",
        scenarios,
      };
    }
    case "reset": {
      const scenario = state.scenarios.find((item) => item.id === action.scenarioId);
      if (!scenario) return state;
      const template = scenario.presetId
        ? createScenarioFromPreset(scenario.presetId, scenario.name)
        : createScenarioFromInputs(createDefaultCollection().scenarios[0].inputs, {
            name: scenario.name,
          });
      return updateScenario(action.scenarioId, () => ({
        ...template,
        id: scenario.id,
        name: scenario.name,
      }));
    }
    case "setOverride":
      return updateScenario(action.scenarioId, (scenario) => {
        const manualOverrides = { ...scenario.manualOverrides };
        if (action.amount && action.amount > 0) {
          manualOverrides[action.itemId] = action.amount;
        } else {
          delete manualOverrides[action.itemId];
        }
        return { ...scenario, presetId: undefined, manualOverrides };
      });
    default:
      return state;
  }
}

function NumberField(props: {
  value: number;
  onChange: (value: number) => void;
  digits?: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  error?: string | null;
  inputMode?: "numeric" | "decimal";
  "data-testid"?: string;
}) {
  const { value, onChange, digits = 0, min, max, suffix, error, inputMode, step, ...rest } = props;
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState(formatEditableNumber(value, digits));

  return (
    <div className="relative">
      <input
        {...rest}
        className={cn(
          "tool-input w-full rounded-2xl border px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100",
          error && "border-rose-400 focus-visible:border-rose-500"
        )}
        inputMode={inputMode ?? (digits > 0 ? "decimal" : "numeric")}
        step={step}
        value={focused ? text : formatEditableNumber(value, digits)}
        onFocus={() => {
          setFocused(true);
          setText(value ? String(value).replace(".", ",") : "");
        }}
        onBlur={() => {
          setFocused(false);
          const parsed = parseLocaleNumber(text);
          let nextValue = parsed ?? 0;
          if (typeof min === "number") nextValue = Math.max(min, nextValue);
          if (typeof max === "number") nextValue = Math.min(max, nextValue);
          onChange(nextValue);
          setText(formatEditableNumber(nextValue, digits));
        }}
        onChange={(event) => {
          setText(event.target.value);
          const parsed = parseLocaleNumber(event.target.value);
          if (parsed === null) {
            return;
          }

          let nextValue = parsed;
          if (typeof min === "number") nextValue = Math.max(min, nextValue);
          if (typeof max === "number") nextValue = Math.min(max, nextValue);
          onChange(nextValue);
        }}
      />
      {suffix ? (
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-bold text-slate-500 dark:text-slate-400">
          {suffix}
        </span>
      ) : null}
      {error ? <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-300">{error}</p> : null}
    </div>
  );
}

function InfoTip({ content }: { content: string }) {
  return (
    <span className="group relative inline-flex">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300/80 text-slate-500 dark:border-slate-600 dark:text-slate-300">
        <Info className="h-3.5 w-3.5" />
      </span>
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-60 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-2xl group-hover:block group-focus-within:block dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
        {content}
      </span>
    </span>
  );
}

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: { name: string; color: string; share: number } }>;
}) {
  if (!active || !payload?.[0]?.payload) {
    return null;
  }

  const datum = payload[0].payload;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-2xl dark:border-slate-700 dark:bg-slate-950">
      <p className="font-semibold text-slate-800 dark:text-slate-100">{datum.name}</p>
      <p className="mt-1 font-bold" style={{ color: datum.color }}>
        {formatTL(payload[0].value ?? 0)}
      </p>
      <p className="text-slate-500 dark:text-slate-400">{formatYuzde(datum.share)}</p>
    </div>
  );
}

function SummaryPanelContent(props: {
  snapshot: ConstructionCostScenarioSnapshot;
  busyAction: BusyAction;
  animatedTotal: number;
  hasBlockingErrors: boolean;
  isRefreshing: boolean;
  exportError: string | null;
  toastMessage: string | null;
  actionLog: ExportActionLogEntry[];
  onPdfPreview: () => void;
  onPdfDownload: () => void;
  onPrint: () => void;
  onExcel: () => void;
  onCopyLink: () => void;
  onJsonExport: () => void;
  onJsonImport: () => void;
  onLoadExample: () => void;
  onReset: () => void;
}) {
  const {
    snapshot,
    busyAction,
    animatedTotal,
    hasBlockingErrors,
    isRefreshing,
    exportError,
    toastMessage,
    actionLog,
    onPdfPreview,
    onPdfDownload,
    onPrint,
    onExcel,
    onCopyLink,
    onJsonExport,
    onJsonImport,
    onLoadExample,
    onReset,
  } = props;

  const chartData = snapshot.groups.map((group, index) => ({
    name: group.label,
    value: group.total,
    share: group.share,
    color: ["#2563eb", "#16a34a", "#ea580c", "#7c3aed"][index] ?? "#475569",
  }));
  const currentActionLabel = busyAction ? ACTION_LABELS[busyAction] : null;
  const exportCards = [
    getActionCardCopy("pdf", snapshot),
    getActionCardCopy("excel", snapshot),
    getActionCardCopy("json", snapshot),
    getActionCardCopy("share", snapshot),
  ];

  return (
    <div className="tool-result-panel rounded-[2rem] p-5 text-white">
      <div className="tool-result-inner rounded-[1.75rem] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-200">Karar Paneli</p>
            <h2 data-testid="construction-total-value" className="mt-3 text-4xl font-black tracking-tight">{formatTL(animatedTotal)}</h2>
            <p className="mt-2 text-sm text-slate-300">
              {formatM2Fiyat(snapshot.costPerM2)} · {formatTL(snapshot.costPerUnit)} / bölüm
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-slate-100">{MONTH_LABEL} fiyatları</span>
              <span className="rounded-full bg-rose-400/15 px-3 py-1 font-semibold text-rose-100">↑ 2024&apos;e göre %19,8 artış</span>
              {snapshot.activePresetLabel ? (
                <span className="rounded-full bg-sky-400/15 px-3 py-1 font-semibold text-sky-100">{snapshot.activePresetLabel}</span>
              ) : null}
            </div>
          </div>
          <div
            className={cn(
              "rounded-2xl border px-3 py-2 text-right text-xs font-semibold",
              snapshot.benchmark.status === "high"
                ? "border-amber-400/40 bg-amber-400/10 text-amber-100"
                : snapshot.benchmark.status === "low"
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                  : "border-sky-400/40 bg-sky-400/10 text-sky-100"
            )}
          >
            <div>{snapshot.benchmark.label}</div>
            <div className="mt-1 text-lg font-black">{formatYuzde(snapshot.benchmark.deltaPct)}</div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-6 xl:flex-row xl:items-center">
          <div className="relative mx-auto h-[220px] w-[220px]">
            <PieChart width={220} height={220}>
              <Pie data={chartData} dataKey="value" innerRadius={70} outerRadius={98} paddingAngle={3} stroke="none" isAnimationActive={!isRefreshing}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip cursor={false} content={<DonutTooltip />} />
            </PieChart>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-300">Toplam</span>
              <span className={cn("mt-2 text-lg font-black", isRefreshing && "animate-pulse")}>{formatTL(snapshot.grandTotal)}</span>
            </div>
          </div>

          <div className="grid flex-1 gap-3">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <div>
                    <p className="text-sm font-semibold text-white">{item.name}</p>
                    <p className="text-xs text-slate-300">{formatYuzde(item.share)}</p>
                  </div>
                </div>
                <p className="text-sm font-black text-white">{formatTL(item.value)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {snapshot.topDrivers.map((driver) => (
            <div key={driver.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">{driver.label}</p>
              <p className="mt-2 text-lg font-black text-white">{formatTL(driver.impactAmount)}</p>
              <p className="text-xs text-slate-300">{driver.note}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {snapshot.validationIssues.slice(0, 3).map((issue) => (
            <div key={issue.id} className={cn("rounded-2xl border px-4 py-3 text-sm", ISSUE_STYLES[issue.tone])}>
              <p className="font-semibold">{issue.message}</p>
              {issue.hint ? <p className="mt-1 text-xs opacity-80">{issue.hint}</p> : null}
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {exportCards.map((card) => (
            <div key={card.title} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">
                {card.title}
              </p>
              <p className="mt-2 text-sm font-black text-white">{card.value}</p>
              <p className="mt-2 text-xs leading-6 text-slate-300">{card.helper}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-300">
                İşlem merkezi
              </p>
              <p className="mt-2 text-sm font-black text-white">
                {currentActionLabel ? `${currentActionLabel} hazırlanıyor` : "Çıktı ve paylaşım aksiyonları hazır"}
              </p>
              <p className="mt-1 text-xs leading-6 text-slate-300">
                {hasBlockingErrors
                  ? "Hata seviyesinde doğrulama uyarıları çözüldüğünde PDF ve Excel aksiyonları açılır."
                  : "PDF, Excel, JSON ve link aksiyonları aktif senaryo bağlamı ile çalışır."}
              </p>
            </div>
            {actionLog[0] ? (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-100">
                Son işlem: {actionLog[0].label}
                <div className="mt-1 opacity-80">{actionLog[0].detail}</div>
              </div>
            ) : null}
          </div>
          {actionLog.length > 0 ? (
            <div className="mt-4 grid gap-2">
              {actionLog.slice(0, 3).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/10 px-3 py-2 text-xs"
                >
                  <div>
                    <p className="font-black text-white">{entry.label}</p>
                    <p className="mt-1 text-slate-300">{entry.detail}</p>
                  </div>
                  <span className="shrink-0 text-slate-400">
                    {REVISION_DATE_FORMATTER.format(new Date(entry.createdAt))}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {toastMessage ? <div className="mt-5 rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100">{toastMessage}</div> : null}
        {exportError ? <div className="mt-5 rounded-2xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-100">{exportError}</div> : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button data-testid="construction-pdf-preview-button" type="button" onClick={onPdfPreview} disabled={hasBlockingErrors || busyAction !== null} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-900 disabled:cursor-not-allowed disabled:opacity-50">{busyAction === "preview" ? "Önizleme hazırlanıyor" : "PDF önizleme"}</button>
          <button data-testid="construction-pdf-download-button" type="button" onClick={onPdfDownload} disabled={hasBlockingErrors || busyAction !== null} className="rounded-2xl border border-white/20 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">{busyAction === "download" ? "PDF hazırlanıyor" : "PDF indir"}</button>
          <button data-testid="construction-print-button" type="button" onClick={onPrint} disabled={hasBlockingErrors || busyAction !== null} className="rounded-2xl border border-white/20 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">{busyAction === "print" ? "Yazdırılıyor" : "Yazdır"}</button>
          <button data-testid="construction-excel-download-button" type="button" onClick={onExcel} disabled={hasBlockingErrors || busyAction !== null} className="rounded-2xl border border-white/20 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">{busyAction === "excel" ? "Excel hazırlanıyor" : "Excel indir"}</button>
          <button data-testid="construction-copy-link-button" type="button" onClick={onCopyLink} disabled={busyAction !== null} className="rounded-2xl border border-white/20 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">Bağlantıyı kopyala</button>
          <button data-testid="construction-json-export-button" type="button" onClick={onJsonExport} disabled={busyAction !== null} className="rounded-2xl border border-white/20 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">JSON dışa aktar</button>
          <button data-testid="construction-json-import-button" type="button" onClick={onJsonImport} disabled={busyAction !== null} className="rounded-2xl border border-white/20 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">JSON içe aktar</button>
          <button data-testid="construction-load-example-button" type="button" onClick={onLoadExample} className="rounded-2xl border border-white/20 px-4 py-3 text-sm font-black text-white">Örnek veri yükle</button>
          <button data-testid="construction-reset-button" type="button" onClick={onReset} className="rounded-2xl border border-white/20 px-4 py-3 text-sm font-black text-white sm:col-span-2">Aktif senaryoyu sıfırla</button>
        </div>
      </div>
    </div>
  );
}

export function ConstructionCostClient() {
  const searchParams = useSearchParams();
  const initialCollection =
    deserializeCollectionFromSearchParams(searchParams) ?? createDefaultCollection();
  const [collection, dispatch] = useReducer(reduceCollection, initialCollection);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const deferredCollection = useDeferredValue(collection);
  const report = useMemo(() => buildConstructionCostReport(deferredCollection), [deferredCollection]);
  const activeScenario =
    collection.scenarios.find((scenario) => scenario.id === collection.activeScenarioId) ??
    collection.scenarios[0];
  const activeSnapshot =
    report.scenarios.find((scenario) => scenario.scenarioId === collection.activeScenarioId) ??
    report.scenarios[0];
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [breakdownSort, setBreakdownSort] = useState<BreakdownSort>("order");
  const [breakdownFilter, setBreakdownFilter] = useState<BreakdownFilter>("all");
  const [breakdownSearch, setBreakdownSearch] = useState("");
  const [showOverriddenOnly, setShowOverriddenOnly] = useState(false);
  const [showHighImpactOnly, setShowHighImpactOnly] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<BreakdownFilter>>(
    new Set(["direct", "indirect", "soft", "commercial"])
  );
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [summarySheetOpen, setSummarySheetOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [actionLog, setActionLog] = useState<ExportActionLogEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const animatedTotal = useAnimatedNumber(activeSnapshot?.grandTotal ?? 0);

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const [sensitivityDeltas, setSensitivityDeltas] = useState({ margin: 0, salePrice: 0, overrideCost: 0 });
  const sensitivitySnapshot = useMemo(() => {
    if (sensitivityDeltas.margin === 0 && sensitivityDeltas.salePrice === 0 && sensitivityDeltas.overrideCost === 0) return null;
    return buildConstructionCostReport({
      ...collection,
      scenarios: [
        {
          ...activeScenario,
          inputs: {
            ...activeScenario.inputs,
            commercial: {
              ...activeScenario.inputs.commercial,
              contractorMarginRate: Math.max(0, activeScenario.inputs.commercial.contractorMarginRate + sensitivityDeltas.margin),
              targetSalePrice: Math.max(0, activeScenario.inputs.commercial.targetSalePrice * (1 + sensitivityDeltas.salePrice)),
              contingencyRate: Math.max(0, activeScenario.inputs.commercial.contingencyRate + sensitivityDeltas.overrideCost)
            }
          }
        }
      ]
    }).scenarios[0];
  }, [collection, activeScenario, sensitivityDeltas]);

  const officialGroups = getOfficialCostGroups(2026);
  const benchmarkGroup = activeScenario.inputs.reference.officialSelection?.grup;
  const benchmarkClasses = benchmarkGroup ? getOfficialCostClasses(2026, benchmarkGroup) : [];
  const areaError = activeSnapshot.validationIssues.find((issue) => issue.id === "equivalent-area-range");
  const floorError = activeSnapshot.validationIssues.find((issue) => issue.id === "floor-count-range");
  const unitError = activeSnapshot.validationIssues.find((issue) => issue.id === "unit-count-range");
  const hasBlockingErrors = activeSnapshot.validationIssues.some((issue) => issue.tone === "error");
  const baselineSnapshot = report.scenarios[0] ?? activeSnapshot;
  const scenarioCardMeta = useMemo(() => {
    const baselineTotal = report.scenarios[0]?.grandTotal ?? 0;

    return Object.fromEntries(
      report.scenarios.map((snapshot, index) => {
        const topLineItem =
          [...snapshot.lineItems].sort((left, right) => right.amount - left.amount)[0] ?? null;
        const delta = snapshot.grandTotal - baselineTotal;
        const deltaPct = baselineTotal > 0 ? delta / baselineTotal : 0;

        return [
          snapshot.scenarioId,
          {
            isBaseline: index === 0,
            delta,
            deltaPct,
            overrideCount: snapshot.lineItems.filter((item) => item.isOverridden).length,
            topLineItem,
          },
        ];
      })
    );
  }, [report.scenarios]);
  const breakdownHighlights = useMemo(() => {
    const topItems = [...activeSnapshot.lineItems]
      .sort((left, right) => right.amount - left.amount)
      .slice(0, 3);
    const overrideCount = activeSnapshot.lineItems.filter((item) => item.isOverridden).length;
    const leadDriver = activeSnapshot.topDrivers[0];

    return [
      {
        id: "top-item",
        eyebrow: "En yüksek kalem",
        title: topItems[0]?.label ?? "Kalem bulunamadı",
        value: topItems[0] ? formatTL(topItems[0].amount) : formatTL(0),
        helper: topItems[0] ? `${formatYuzde(topItems[0].share)} pay` : "Kalem verisi oluşmadı",
      },
      {
        id: "overrides",
        eyebrow: "Manuel kalibrasyon",
        title: overrideCount > 0 ? `${overrideCount} kalem özelleştirildi` : "Hazır şablon akışı",
        value:
          overrideCount > 0
            ? "Satır bazlı override aktif"
            : activeSnapshot.activePresetLabel ?? "Henüz manuel müdahale yok",
        helper:
          overrideCount > 0
            ? "Sıfırla butonları ile varsayılan motora dönebilirsiniz."
            : "Hazır preset ve motor varsayımları birlikte çalışıyor.",
      },
      {
        id: "benchmark",
        eyebrow: "Benchmark yorumu",
        title: getBenchmarkStatusLabel(activeSnapshot.benchmark.status),
        value: formatTL(activeSnapshot.benchmark.delta),
        helper:
          activeSnapshot.benchmark.reasons[0] ??
          "Resmî kıyas için bir sınıf veya otomatik eşleştirme kullanılabilir.",
      },
      {
        id: "driver",
        eyebrow: "En hassas sürücü",
        title: leadDriver?.label ?? "Ek sürücü bulunamadı",
        value: leadDriver ? formatTL(leadDriver.impactAmount) : formatTL(0),
        helper: leadDriver?.note ?? "Alan, kalite ve saha parametreleri birlikte etkiler.",
      },
    ];
  }, [activeSnapshot]);
  const comparisonInsights = useMemo(() => {
    if (report.scenarios.length < 2) {
      return null;
    }

    const sortedByTotal = [...report.scenarios].sort((left, right) => left.grandTotal - right.grandTotal);
    const cheapest = sortedByTotal[0];
    const priciest = sortedByTotal[sortedByTotal.length - 1];
    const bestBenchmark = [...report.scenarios].sort(
      (left, right) =>
        Math.abs(left.benchmark.deltaPct) - Math.abs(right.benchmark.deltaPct)
    )[0];
    const highestProfit = [...report.scenarios].sort((left, right) => {
      const leftProfit =
        left.inputs.commercial.targetSalePrice * left.saleableArea - left.grandTotal;
      const rightProfit =
        right.inputs.commercial.targetSalePrice * right.saleableArea - right.grandTotal;

      return rightProfit - leftProfit;
    })[0];
    const spread = priciest.grandTotal - cheapest.grandTotal;
    const spreadPct = cheapest.grandTotal > 0 ? spread / cheapest.grandTotal : 0;

    return {
      cards: [
        {
          id: "winner",
          eyebrow: "Maliyet lideri",
          title: cheapest.scenarioName,
          value: formatTL(cheapest.grandTotal),
          helper: `${formatM2Fiyat(cheapest.costPerM2)} · ${getBenchmarkStatusLabel(cheapest.benchmark.status)}`,
        },
        {
          id: "spread",
          eyebrow: "Senaryo aralığı",
          title: formatTL(spread),
          value: formatYuzde(spreadPct),
          helper: `${cheapest.scenarioName} ile ${priciest.scenarioName} arasında toplam fark`,
        },
        {
          id: "benchmark",
          eyebrow: "Benchmark uyumu",
          title: bestBenchmark.scenarioName,
          value: formatYuzde(Math.abs(bestBenchmark.benchmark.deltaPct)),
          helper: bestBenchmark.benchmark.label,
        },
        {
          id: "profit",
          eyebrow: "Satış potansiyeli",
          title: highestProfit.scenarioName,
          value: formatTL(
            highestProfit.inputs.commercial.targetSalePrice * highestProfit.saleableArea -
              highestProfit.grandTotal
          ),
          helper: "Tahmini brüt satış geliri eksi toplam maliyet",
        },
      ],
      recommendation:
        spreadPct > 0.1
          ? `${cheapest.scenarioName} maliyet açısından açık lider. ${priciest.scenarioName} ise ${formatTL(
              spread
            )} daha yüksek.`
          : `Senaryolar birbirine yakın. Nihai karar için benchmark uyumu ve satış potansiyeli öne çıkıyor.`,
    };
  }, [report.scenarios]);
  const formSectionCards = useMemo(() => {
    const benchmarkDelta = Math.abs(activeSnapshot.benchmark.deltaPct);

    return [
      {
        id: "project",
        targetId: "construction-section-project",
        label: "Proje",
        title:
          activeScenario.inputs.projectName.trim() || `${STRUCTURE_LABELS[activeScenario.inputs.structureKind]} senaryosu`,
        helper: `${formatSayi(activeScenario.inputs.floorCount, 0)} kat · ${formatSayi(activeScenario.inputs.unitCount, 0)} bölüm`,
        status:
          !activeScenario.inputs.projectName.trim() || floorError || unitError
            ? ("attention" as const)
            : activeScenario.inputs.saleableArea <= 0
              ? ("review" as const)
              : ("ready" as const),
      },
      {
        id: "area",
        targetId: "construction-section-area",
        label: "Alan modeli",
        title: activeScenario.inputs.area.advancedMode ? "Gelişmiş alan girişi" : "Tek toplam alan girişi",
        helper: `${formatSayi(activeSnapshot.equivalentArea, 0)} m² eşdeğer · ${formatSayi(activeSnapshot.physicalArea, 0)} m² fiziksel`,
        status: areaError
          ? ("attention" as const)
          : activeScenario.inputs.area.advancedMode
            ? ("ready" as const)
            : ("review" as const),
      },
      {
        id: "commercial",
        targetId: "construction-section-commercial",
        label: "Ticari katman",
        title: `${formatM2Fiyat(activeScenario.inputs.commercial.targetSalePrice)} satış hedefi`,
        helper: `%${Math.round(activeScenario.inputs.commercial.contractorMarginRate * 100)} kâr · ${activeScenario.inputs.commercial.durationMonths} ay termin`,
        status:
          activeScenario.inputs.commercial.targetSalePrice <= 0
            ? ("attention" as const)
            : activeScenario.inputs.commercial.durationMonths > 24
              ? ("review" as const)
              : ("ready" as const),
      },
      {
        id: "site",
        targetId: "construction-section-site",
        label: "Saha ve referans",
        title: activeSnapshot.benchmark.label,
        helper:
          activeScenario.inputs.reference.officialSelection
            ? "Resmî referans seçimi aktif"
            : activeSnapshot.benchmark.reasons[0] ?? "Otomatik benchmark eşleştirmesi kullanılıyor.",
        status:
          benchmarkDelta > 0.18
            ? ("attention" as const)
            : activeScenario.inputs.reference.officialSelection
              ? ("ready" as const)
              : ("review" as const),
      },
    ];
  }, [
    activeScenario.inputs,
    activeSnapshot.benchmark,
    activeSnapshot.equivalentArea,
    activeSnapshot.physicalArea,
    areaError,
    floorError,
    unitError,
  ]);
  const heroQuickLinks = [
    { id: "project", label: "Proje", targetId: "construction-section-project" },
    { id: "area", label: "Alan modeli", targetId: "construction-section-area" },
    { id: "commercial", label: "Ticari katman", targetId: "construction-section-commercial" },
    { id: "site", label: "Saha / referans", targetId: "construction-section-site" },
    { id: "breakdown", label: "Kırılım", targetId: "construction-breakdown" },
    { id: "compare", label: "Karşılaştırma", targetId: "construction-compare" },
  ];
  const mobileSummaryMetrics = [
    {
      id: "benchmark",
      label: "Benchmark",
      value: getBenchmarkStatusLabel(activeSnapshot.benchmark.status),
    },
    {
      id: "risk",
      label: "Risk",
      value: formatYuzde(activeSnapshot.range.variancePct),
    },
    {
      id: "m2",
      label: "m²",
      value: formatM2Fiyat(activeSnapshot.costPerM2),
    },
  ];

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };
  const recordAction = (action: ActionKey, detail: string, toast?: string) => {
    setActionLog((current) => [
      {
        id: `${action}-${Date.now()}`,
        action,
        label: ACTION_LABELS[action],
        detail,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ].slice(0, 4));
    if (toast) {
      setToastMessage(toast);
    }
  };

  useEffect(() => {
    setIsRefreshing(true);
    const timer = window.setTimeout(() => setIsRefreshing(false), 300);
    return () => window.clearTimeout(timer);
  }, [collection]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(
      CONSTRUCTION_COST_DRAFT_KEY,
      JSON.stringify(normalizeCollection(collection))
    );
  }, [collection]);

  useEffect(() => {
    if (draftHydrated || searchParams.toString()) {
      return;
    }

    const draft = readConstructionCostDraft();
    setDraftHydrated(true);

    if (draft) {
      dispatch({ type: "load", collection: draft });
    }
  }, [draftHydrated, dispatch, searchParams]);

  useEffect(() => {
    if (!summarySheetOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [summarySheetOpen]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const updateInput = (path: string, value: unknown) => {
    dispatch({ type: "updateInput", scenarioId: activeScenario.id, path, value });
  };

  const handlePdfPreview = async () => {
    try {
      setBusyAction("preview");
      setExportError(null);
      const { openConstructionCostPdfPreview } = await loadReportingModule();
      openConstructionCostPdfPreview(buildConstructionCostPdfSnapshot(report));
      recordAction("preview", `${activeSnapshot.scenarioName} için PDF önizleme açıldı.`, "PDF önizleme hazır.");
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "PDF önizleme açılamadı.");
    } finally {
      setBusyAction(null);
    }
  };

  const handlePdfDownload = async () => {
    try {
      setBusyAction("download");
      setExportError(null);
      const { downloadConstructionCostPdf } = await loadReportingModule();
      downloadConstructionCostPdf(buildConstructionCostPdfSnapshot(report), getPdfFilename(activeSnapshot));
      recordAction("download", `${getPdfFilename(activeSnapshot)} indirildi.`, "PDF indirildi.");
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "PDF indirilemedi.");
    } finally {
      setBusyAction(null);
    }
  };

  const handlePrint = async () => {
    try {
      setBusyAction("print");
      setExportError(null);
      const { printConstructionCostPdf } = await loadReportingModule();
      printConstructionCostPdf(buildConstructionCostPdfSnapshot(report));
      recordAction("print", `${activeSnapshot.scenarioName} için yazdırma akışı başlatıldı.`, "Yazdırma penceresi açıldı.");
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Yazdırma başlatılamadı.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleExcel = async () => {
    try {
      setBusyAction("excel");
      setExportError(null);
      await exportConstructionCostExcel(report);
      recordAction("excel", `${report.scenarios.length} senaryo için Excel paketi üretildi.`, "Excel dışa aktarıldı.");
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Excel dışa aktarılamadı.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleCopyLink = async () => {
    try {
      setBusyAction("copy");
      setExportError(null);
      const shareUrl = buildPathWithSearch(
        CONSTRUCTION_COST_ROUTE,
        serializeCollectionToSearchParams(collection)
      );
      await navigator.clipboard.writeText(new URL(shareUrl, window.location.origin).toString());
      recordAction("copy", "Aktif URL panoya kopyalandı.", "Bağlantı kopyalandı.");
    } catch {
      setExportError("Bağlantı panoya kopyalanamadı.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleJsonExport = () => {
    try {
      setBusyAction("json-export");
      setExportError(null);
      const blob = new Blob([JSON.stringify(collection, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getJsonFilename(activeSnapshot);
      link.click();
      URL.revokeObjectURL(url);
      recordAction("json-export", `${collection.scenarios.length} senaryo JSON olarak dışa aktarıldı.`, "JSON dışa aktarıldı.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleJsonImport = () => {
    setBusyAction("json-import");
    fileInputRef.current?.click();
  };

  const handleImportedJson = async (event: { target: HTMLInputElement }) => {
    const file = event.target.files?.[0];
    if (!file) {
      setBusyAction(null);
      return;
    }

    try {
      const raw = await file.text();
      dispatch({ type: "load", collection: JSON.parse(raw) as ScenarioCollection });
      recordAction("json-import", `${file.name} dosyası içe aktarıldı.`, "JSON içe aktarıldı.");
    } catch {
      setExportError("JSON dosyası okunamadı.");
    } finally {
      setBusyAction(null);
      event.target.value = "";
    }
  };

  const breakdownGroupCards = useMemo(
    () =>
      activeSnapshot.groups
        .map((group) => {
          const leadItem =
            [...group.items].sort((left, right) => right.amount - left.amount)[0] ?? null;

          return {
            ...group,
            itemCount: group.items.length,
            overrideCount: group.items.filter((item) => item.isOverridden).length,
            highImpactCount: group.items.filter((item) => item.isHighImpact).length,
            leadItem,
          };
        })
        .sort((left, right) => right.total - left.total),
    [activeSnapshot.groups]
  );
  const hasAdvancedBreakdownFilters =
    breakdownFilter !== "all" ||
    breakdownSearch.trim().length > 0 ||
    showOverriddenOnly ||
    showHighImpactOnly;
  const sortedGroups = useMemo(() => {
    const normalizedSearch = breakdownSearch.trim().toLocaleLowerCase("tr-TR");

    return activeSnapshot.groups
      .filter((group) => breakdownFilter === "all" || group.id === breakdownFilter)
      .map((group) => {
        const items = group.items
          .filter((item) => {
            if (showOverriddenOnly && !item.isOverridden) return false;
            if (showHighImpactOnly && !item.isHighImpact) return false;
            if (!normalizedSearch) return true;

            const haystack = [item.label, item.description, ...(item.notes ?? [])]
              .join(" ")
              .toLocaleLowerCase("tr-TR");
            return haystack.includes(normalizedSearch);
          })
          .sort((left, right) => {
            switch (breakdownSort) {
              case "amount":
                return right.amount - left.amount;
              case "share":
                return right.share - left.share;
              case "label":
                return left.label.localeCompare(right.label, "tr");
              default:
                return left.order - right.order;
            }
          });
        const total = items.reduce((sum, item) => sum + item.amount, 0);

        return {
          ...group,
          items,
          total,
          share: activeSnapshot.grandTotal > 0 ? total / activeSnapshot.grandTotal : 0,
        };
      })
      .filter((group) => group.items.length > 0);
  }, [
    activeSnapshot.grandTotal,
    activeSnapshot.groups,
    breakdownFilter,
    breakdownSearch,
    breakdownSort,
    showHighImpactOnly,
    showOverriddenOnly,
  ]);
  const visibleBreakdownStats = useMemo(() => {
    const visibleItems = sortedGroups.flatMap((group) => group.items);

    return {
      groupCount: sortedGroups.length,
      itemCount: visibleItems.length,
      total: visibleItems.reduce((sum, item) => sum + item.amount, 0),
      overrideCount: visibleItems.filter((item) => item.isOverridden).length,
      highImpactCount: visibleItems.filter((item) => item.isHighImpact).length,
    };
  }, [sortedGroups]);
  const dominantBreakdownGroup = breakdownGroupCards[0] ?? null;

  const commitInlineEdit = () => {
    if (!editingItemId) return;
    const parsed = parseLocaleNumber(editingValue);
    if (parsed && parsed > 0) {
      dispatch({
        type: "setOverride",
        scenarioId: activeScenario.id,
        itemId: editingItemId,
        amount: parsed,
      });
    }
    setEditingItemId(null);
    setEditingValue("");
  };
  const resetBreakdownFilters = () => {
    setBreakdownFilter("all");
    setBreakdownSort("order");
    setBreakdownSearch("");
    setShowOverriddenOnly(false);
    setShowHighImpactOnly(false);
  };

  return (
    <div className="tool-page-shell min-h-screen pb-28 md:pb-16">
      <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={(event) => void handleImportedJson({ target: event.target })} />
      <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-10">
        <div className="tool-hero-panel rounded-[2.2rem] px-6 py-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500/20 to-blue-500/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-sky-700 ring-1 ring-sky-500/30 dark:text-sky-300">
                  <BarChart3 className="h-3 w-3" />
                  İnşaat Maliyeti V2
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/80 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-300/60 dark:bg-slate-800/80 dark:text-slate-300 dark:ring-slate-600/60">
                  <ShieldCheck className="h-3 w-3" />
                  Resmî birim maliyet kıyası
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/80 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-300/60 dark:bg-slate-800/80 dark:text-slate-300 dark:ring-slate-600/60">
                  <Layers3 className="h-3 w-3" />
                  Senaryo karşılaştırma
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/80 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-300/60 dark:bg-slate-800/80 dark:text-slate-300 dark:ring-slate-600/60">
                  <Download className="h-3 w-3" />
                  PDF / Excel / Paylaşım
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">İnşaat Maliyeti Analizi</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">Parametrik maliyet motoru ile eşdeğer alan, bölgesel katsayı, zemin etkisi, ticari marj ve resmî benchmark farkını gerçek zamanlı analiz edin. Senaryo karşılaştırması ve profesyonel rapor çıktısı dahil.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button data-testid="construction-add-scenario-button" type="button" onClick={() => dispatch({ type: "addCurrent" })} disabled={collection.scenarios.length >= 3} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/20 transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:opacity-50 dark:bg-white dark:text-slate-950">
                <Plus className="h-4 w-4" />
                Senaryo ekle
              </button>
              <button data-testid="construction-mode-toggle-button" type="button" onClick={() => dispatch({ type: "setMode", mode: collection.comparisonMode === "single" ? "compare" : "single" })} className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-black text-slate-700 transition-all hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md active:translate-y-0 dark:border-slate-700 dark:text-slate-100">
                <Layers3 className="h-4 w-4" />
                {collection.comparisonMode === "compare" ? "Tek görünüm" : "Karşılaştır"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {collection.scenarios.map((scenario) => {
            const snapshot = report.scenarios.find((item) => item.scenarioId === scenario.id) ?? activeSnapshot;
            const meta = scenarioCardMeta[scenario.id];
            return (
              <div
                data-testid="construction-scenario-card"
                key={scenario.id}
                className={cn(
                  "tool-panel rounded-[1.75rem] p-4 transition-all duration-300 hover:shadow-xl",
                  scenario.id === collection.activeScenarioId && "ring-2 ring-sky-500/60 shadow-lg shadow-sky-500/10",
                  scenario.id === collection.activeScenarioId && isRefreshing && "animate-tool-shimmer",
                  scenario.id === collection.activeScenarioId && "md:-translate-y-1"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <input value={scenario.name} onChange={(event) => dispatch({ type: "rename", scenarioId: scenario.id, name: event.target.value })} onFocus={() => dispatch({ type: "setActive", scenarioId: scenario.id })} className="w-full bg-transparent text-lg font-black text-slate-950 outline-none dark:text-white" />
                  <button type="button" onClick={() => dispatch({ type: "duplicate", scenarioId: scenario.id })} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-black transition hover:border-slate-400 hover:shadow-sm dark:border-slate-700">Kopyala</button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-black", getDeltaClasses(meta?.isBaseline ?? false, meta?.delta ?? 0))}>
                    {getDeltaLabel(meta?.isBaseline ?? false, meta?.delta ?? 0, meta?.deltaPct ?? 0)}
                  </span>
                  <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-black", getBenchmarkStatusClasses(snapshot.benchmark.status))}>
                    {getBenchmarkStatusLabel(snapshot.benchmark.status)}
                  </span>
                  {meta?.overrideCount ? (
                    <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                      {meta.overrideCount} özel kalem
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-3xl font-black text-slate-950 dark:text-white">{formatTL(snapshot.grandTotal)}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{formatM2Fiyat(snapshot.costPerM2)}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white/70 px-3 py-3 dark:border-slate-700 dark:bg-slate-950/50">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Eşdeğer alan</p>
                    <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">{formatSayi(snapshot.equivalentArea, 0)} m²</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{formatSayi(snapshot.inputs.unitCount, 0)} bölüm</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/70 px-3 py-3 dark:border-slate-700 dark:bg-slate-950/50">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">En ağır kalem</p>
                    <p className="mt-2 line-clamp-1 text-sm font-black text-slate-950 dark:text-white">
                      {meta?.topLineItem?.label ?? "Veri yok"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                      {meta?.topLineItem ? formatTL(meta.topLineItem.amount) : formatTL(0)}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-xs leading-6 text-slate-500 dark:text-slate-300">
                  {snapshot.benchmark.reasons[0] ?? baselineSnapshot.benchmark.reasons[0]}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <button type="button" onClick={() => dispatch({ type: "setActive", scenarioId: scenario.id })} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white transition hover:-translate-y-0.5 active:translate-y-0 dark:bg-white dark:text-slate-950">Düzenle</button>
                  {collection.scenarios.length > 1 ? <button type="button" onClick={() => dispatch({ type: "remove", scenarioId: scenario.id })} className="rounded-xl border border-rose-300 px-3 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-500/10">Sil</button> : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Toplam tahmini maliyet",
              value: formatTL(activeSnapshot.grandTotal),
              helper: `${formatM2Fiyat(activeSnapshot.costPerM2)} · ${formatTL(activeSnapshot.costPerUnit)} / bölüm`,
              accent: "border-l-sky-500",
              icon: <BarChart3 className="h-4 w-4 text-sky-500" />,
            },
            {
              label: "Resmî benchmark farkı",
              value: formatTL(activeSnapshot.benchmark.delta),
              helper: `${formatYuzde(activeSnapshot.benchmark.deltaPct)} · ${activeSnapshot.benchmark.label}`,
              accent: activeSnapshot.benchmark.status === "high" ? "border-l-amber-500" : activeSnapshot.benchmark.status === "low" ? "border-l-emerald-500" : "border-l-sky-400",
              icon: <ShieldCheck className={cn("h-4 w-4", activeSnapshot.benchmark.status === "high" ? "text-amber-500" : activeSnapshot.benchmark.status === "low" ? "text-emerald-500" : "text-sky-400")} />,
            },
            {
              label: "Risk bandı",
              value: `${formatTL(activeSnapshot.range.optimistic)} – ${formatTL(activeSnapshot.range.pessimistic)}`,
              helper: `Varyans ${formatYuzde(activeSnapshot.range.variancePct)}`,
              accent: "border-l-orange-400",
              icon: <Info className="h-4 w-4 text-orange-400" />,
            },
            {
              label: "Tahmini satış potansiyeli",
              value: formatTL(activeSnapshot.inputs.commercial.targetSalePrice * activeSnapshot.saleableArea),
              helper: `${formatM2Fiyat(activeSnapshot.inputs.commercial.targetSalePrice)} · ${formatSayi(activeSnapshot.saleableArea, 0)} m²`,
              accent: "border-l-emerald-500",
              icon: <Download className="h-4 w-4 text-emerald-500" />,
            },
          ].map((kpi) => (
            <div key={kpi.label} className={cn("tool-panel rounded-[1.75rem] border-l-4 p-5 transition-shadow hover:shadow-lg", kpi.accent, isRefreshing && "animate-tool-shimmer")}>
              <div className="flex items-center gap-2">
                {kpi.icon}
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{kpi.label}</p>
              </div>
              <p className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{kpi.value}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">{kpi.helper}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12 items-start">
          <div className="min-w-0 space-y-6 lg:col-span-8 xl:col-span-9">
            <div className="tool-panel rounded-[1.75rem] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Hızlı presetler</p>
                  <h2 className="mt-2 text-xl font-black text-slate-950 dark:text-white">Başlangıç şablonları</h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-300">Aktif senaryoya uygulanır</p>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {CONSTRUCTION_COST_PRESETS.map((preset) => (
                  <button key={preset.id} type="button" onClick={() => dispatch({ type: "applyPreset", scenarioId: activeScenario.id, presetId: preset.id })} className={cn("rounded-2xl border px-4 py-4 text-left transition", activeScenario.presetId === preset.id ? "border-sky-500 bg-sky-50 shadow-lg shadow-sky-500/10 dark:bg-sky-500/10" : "border-slate-200 hover:border-slate-300 dark:border-slate-700")}>
                    <p className="text-sm font-black text-slate-950 dark:text-white">{preset.label}</p>
                    <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-300">{preset.description}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="tool-panel rounded-[1.75rem] p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Form rehberi</p>
                  <h2 className="mt-2 text-xl font-black text-slate-950 dark:text-white">Bölüm durumu ve hızlı geçiş</h2>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-200">
                  Son düzenlenen alan: <span className="font-black text-slate-950 dark:text-white">{getLastEditedFieldLabel(activeScenario.lastEditedField)}</span>
                </div>
              </div>
              <div className="mt-4 grid gap-3 xl:grid-cols-4">
                {formSectionCards.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => scrollToSection(section.targetId)}
                    className="rounded-[1.35rem] border border-slate-200 bg-white/75 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 dark:bg-slate-950/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">{section.label}</p>
                        <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">{section.title}</p>
                      </div>
                      <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-black", getSectionStatusClasses(section.status))}>
                        {getSectionStatusLabel(section.status)}
                      </span>
                    </div>
                    <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-300">{section.helper}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-xs font-black text-sky-600 dark:text-sky-300">
                      Bölüme git <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <div id="construction-section-project" className="tool-panel scroll-mt-28 rounded-[1.75rem] p-5">
                <div className="flex items-center justify-between cursor-pointer md:cursor-default group" onClick={() => toggleSection("project")}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <h2 className="text-xl font-black text-slate-950 group-active:scale-95 transition-transform dark:text-white">Proje genel bilgileri</h2>
                    <InfoTip content="Yapı türü, kat adedi, satış alanı ve bölgesel katsayı bütün motoru etkiler." />
                  </div>
                  <ChevronUp className={cn("h-5 w-5 text-slate-400 transition-transform md:hidden", collapsedSections.has("project") && "rotate-180")} />
                </div>
                <div className={cn("grid gap-3 sm:grid-cols-2 overflow-hidden transition-all duration-300 ease-in-out md:max-h-[3000px] md:opacity-100 md:mt-4", collapsedSections.has("project") ? "max-h-0 opacity-0 mt-0 pointer-events-none" : "max-h-[3000px] opacity-100 mt-4")}>
                  <label className="sm:col-span-2">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Proje adı</span>
                    <input value={activeScenario.inputs.projectName} onChange={(event) => updateInput("projectName", event.target.value)} className="tool-input w-full rounded-2xl border px-4 py-3 text-sm font-semibold text-slate-900 transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:text-slate-100" />
                  </label>
                  <label className="sm:col-span-2">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Yapı türü</span>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(STRUCTURE_LABELS).map(([value, label]) => (
                        <button key={value} type="button" onClick={() => updateInput("structureKind", value)} className={cn("rounded-2xl border px-4 py-3 text-sm font-black transition-all duration-200 active:scale-[0.98]", activeScenario.inputs.structureKind === value ? "border-slate-950 bg-slate-950 text-white shadow-md dark:border-white dark:bg-white dark:text-slate-950" : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800")}>{label}</button>
                      ))}
                    </div>
                  </label>
                  <label className="sm:col-span-2">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Kalite seviyesi</span>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(QUALITY_LABELS).map(([value, label]) => (
                        <button key={value} type="button" onClick={() => updateInput("qualityLevel", value)} className={cn("rounded-2xl border px-4 py-3 text-sm font-black transition-all duration-200 active:scale-[0.98]", activeScenario.inputs.qualityLevel === value ? "border-sky-500 bg-sky-50 text-sky-700 shadow-md ring-1 ring-sky-500 dark:bg-sky-500/10 dark:text-sky-100" : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800")}>{label}</button>
                      ))}
                    </div>
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Kat adedi</span>
                    <NumberField value={activeScenario.inputs.floorCount} onChange={(value) => updateInput("floorCount", value)} min={1} max={40} error={floorError?.message ?? null} />
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Bodrum kat</span>
                    <NumberField value={activeScenario.inputs.basementCount} onChange={(value) => updateInput("basementCount", value)} min={0} max={10} />
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Bağımsız bölüm</span>
                    <NumberField value={activeScenario.inputs.unitCount} onChange={(value) => updateInput("unitCount", value)} min={1} max={500} error={unitError?.message ?? null} />
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Satılabilir alan</span>
                    <NumberField value={activeScenario.inputs.saleableArea} onChange={(value) => updateInput("saleableArea", value)} min={0} suffix="m²" />
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Ortak alan oranı</span>
                    <NumberField value={activeScenario.inputs.commonAreaRatio * 100} onChange={(value) => updateInput("commonAreaRatio", value / 100)} min={0} max={60} suffix="%" />
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Şehir / bölge</span>
                    <select value={activeScenario.inputs.site.region} onChange={(event) => updateInput("site.region", event.target.value)} className="tool-input w-full rounded-2xl border px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      <option value="istanbul_avrupa">İstanbul Avrupa</option>
                      <option value="istanbul_anadolu">İstanbul Anadolu</option>
                      <option value="ankara">Ankara</option>
                      <option value="izmir">İzmir</option>
                      <option value="bursa">Bursa</option>
                      <option value="antalya">Antalya</option>
                      <option value="kayseri">Kayseri</option>
                      <option value="trabzon">Trabzon</option>
                      <option value="diger_buyuksehir">Diğer büyükşehir</option>
                      <option value="il_merkezi">İl merkezi</option>
                      <option value="ilce">İlçe / kasaba</option>
                    </select>
                  </label>
                </div>
              </div>

              <div id="construction-section-area" className="tool-panel scroll-mt-28 rounded-[1.75rem] p-5">
                <div className="flex items-center justify-between cursor-pointer md:cursor-default group" onClick={(e) => { if ((e.target as HTMLElement).closest('button')) return; toggleSection("area"); }}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <h2 className="text-xl font-black text-slate-950 group-active:scale-95 transition-transform dark:text-white">Alan modeli</h2>
                    <InfoTip content="Gelişmiş modda eşdeğer alan katsayıları bodrum, asma ve çatı alanlarına uygulanır." />
                  </div>
                  <div className="flex items-center gap-2">
                    <button data-testid="construction-area-mode-toggle-button" type="button" onClick={() => updateInput("area.advancedMode", !activeScenario.inputs.area.advancedMode)} className={cn("rounded-full px-4 py-2 text-xs font-black", activeScenario.inputs.area.advancedMode ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-100")}>
                      {activeScenario.inputs.area.advancedMode ? "Gelişmiş giriş açık" : "Gelişmiş alan girişi"}
                    </button>
                    <ChevronUp className={cn("h-5 w-5 text-slate-400 transition-transform md:hidden", collapsedSections.has("area") && "rotate-180")} />
                  </div>
                </div>
                <div className={cn("grid gap-3 sm:grid-cols-2 overflow-hidden transition-all duration-300 ease-in-out md:max-h-[3000px] md:opacity-100 md:mt-4", collapsedSections.has("area") ? "max-h-0 opacity-0 mt-0 pointer-events-none" : "max-h-[3000px] opacity-100 mt-4")}>
                  {activeScenario.inputs.area.advancedMode ? (
                    <>
                      <label><span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Bodrum alanı</span><NumberField value={activeScenario.inputs.area.basementArea} onChange={(value) => updateInput("area.basementArea", value)} min={0} suffix="m²" /></label>
                      <label><span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Normal kat alanı</span><NumberField value={activeScenario.inputs.area.normalArea} onChange={(value) => updateInput("area.normalArea", value)} min={0} suffix="m²" error={areaError?.message ?? null} /></label>
                      <label><span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Asma kat alanı</span><NumberField value={activeScenario.inputs.area.mezzanineArea} onChange={(value) => updateInput("area.mezzanineArea", value)} min={0} suffix="m²" /></label>
                      <label><span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Çatı / teras alanı</span><NumberField value={activeScenario.inputs.area.roofTerraceArea} onChange={(value) => updateInput("area.roofTerraceArea", value)} min={0} suffix="m²" /></label>
                    </>
                  ) : (
                    <label className="sm:col-span-2">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Toplam inşaat alanı</span>
                      <NumberField data-testid="construction-total-area-input" value={activeScenario.inputs.area.totalArea} onChange={(value) => updateInput("area.totalArea", value)} min={50} max={50000} suffix="m²" error={areaError?.message ?? null} />
                    </label>
                  )}
                  <label><span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Otopark alanı</span><NumberField value={activeScenario.inputs.area.parkingArea} onChange={(value) => updateInput("area.parkingArea", value)} min={0} suffix="m²" /></label>
                  <label><span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Peyzaj alanı</span><NumberField value={activeScenario.inputs.area.landscapeArea} onChange={(value) => updateInput("area.landscapeArea", value)} min={0} suffix="m²" /></label>
                </div>
                <div className="tool-note mt-4 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-100">
                  Eşdeğer inşaat alanı: {formatSayi(activeSnapshot.equivalentArea, 0)} m² · Fiziksel alan: {formatSayi(activeSnapshot.physicalArea, 0)} m²
                </div>
              </div>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <div id="construction-section-commercial" className="tool-panel scroll-mt-28 rounded-[1.75rem] p-5">
                <div className="flex items-center justify-between cursor-pointer md:cursor-default group" onClick={() => toggleSection("commercial")}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <h2 className="text-xl font-black text-slate-950 group-active:scale-95 transition-transform dark:text-white">Ticari çarpanlar</h2>
                    <InfoTip content="Kâr, KDV, overhead ve contingency toplam maliyet bandını doğrudan etkiler." />
                  </div>
                  <ChevronUp className={cn("h-5 w-5 text-slate-400 transition-transform md:hidden", collapsedSections.has("commercial") && "rotate-180")} />
                </div>
                <div className={cn("overflow-hidden transition-all duration-300 ease-in-out md:max-h-[3000px] md:opacity-100", collapsedSections.has("commercial") ? "max-h-0 opacity-0 pointer-events-none" : "max-h-[3000px] opacity-100")}>
                  <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Müteahhit kârı</span>
                    <span className="rounded-md bg-white px-2 py-1 text-sm font-black text-slate-950 shadow-sm ring-1 ring-slate-200 dark:bg-slate-950 dark:text-white dark:ring-slate-700">%{Math.round(activeScenario.inputs.commercial.contractorMarginRate * 100)}</span>
                  </div>
                  <input type="range" min={5} max={30} step={1} value={Math.round(activeScenario.inputs.commercial.contractorMarginRate * 100)} onChange={(event) => updateInput("commercial.contractorMarginRate", Number.parseFloat(event.target.value) / 100)} className="h-3 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:ring-4 [&::-webkit-slider-thumb]:ring-slate-950/20 active:[&::-webkit-slider-thumb]:scale-110 active:[&::-webkit-slider-thumb]:duration-200" />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label><span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">KDV oranı</span><NumberField value={activeScenario.inputs.commercial.vatRate * 100} onChange={(value) => updateInput("commercial.vatRate", value / 100)} min={0} max={25} suffix="%" /></label>
                  <label><span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Overhead</span><NumberField value={activeScenario.inputs.commercial.overheadRate * 100} onChange={(value) => updateInput("commercial.overheadRate", value / 100)} min={0} max={25} suffix="%" /></label>
                  <label><span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Contingency</span><NumberField value={activeScenario.inputs.commercial.contingencyRate * 100} onChange={(value) => updateInput("commercial.contingencyRate", value / 100)} min={0} max={20} suffix="%" /></label>
                  <label><span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Hedef satış fiyatı</span><NumberField value={activeScenario.inputs.commercial.targetSalePrice} onChange={(value) => updateInput("commercial.targetSalePrice", value)} min={0} suffix="TL/m²" /></label>
                  <label><span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Termin</span><NumberField value={activeScenario.inputs.commercial.durationMonths} onChange={(value) => updateInput("commercial.durationMonths", value)} min={1} max={48} suffix="ay" /></label>
                  <label><span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Aylık enflasyon</span><NumberField value={activeScenario.inputs.commercial.monthlyInflationRate * 100} onChange={(value) => updateInput("commercial.monthlyInflationRate", value / 100)} min={0} max={10} digits={1} suffix="%" /></label>
                  <label className="sm:col-span-2">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Yüklenici profili</span>
                    <select value={activeScenario.inputs.commercial.contractorProfile} onChange={(event) => updateInput("commercial.contractorProfile", event.target.value)} className="tool-input w-full rounded-2xl border px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      <option value="bireysel">Bireysel / küçük müteahhit</option>
                      <option value="ortaOlcekli">Orta ölçekli</option>
                      <option value="kurumsal">Kurumsal</option>
                    </select>
                  </label>
                </div>
                </div>
              </div>

              <div id="construction-section-site" className="tool-panel scroll-mt-28 rounded-[1.75rem] p-5">
                <div className="flex items-center justify-between cursor-pointer md:cursor-default group" onClick={() => toggleSection("site")}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <h2 className="text-xl font-black text-slate-950 group-active:scale-95 transition-transform dark:text-white">Saha ve referans</h2>
                    <InfoTip content="Zemin, saha zorluğu, mekanik seviyesi ve resmi benchmark seçimi açıklanabilirliği güçlendirir." />
                  </div>
                  <ChevronUp className={cn("h-5 w-5 text-slate-400 transition-transform md:hidden", collapsedSections.has("site") && "rotate-180")} />
                </div>
                <div className={cn("grid gap-4 sm:grid-cols-2 overflow-hidden transition-all duration-300 ease-in-out md:max-h-[3000px] md:opacity-100 md:mt-4", collapsedSections.has("site") ? "max-h-0 opacity-0 mt-0 pointer-events-none" : "max-h-[3000px] opacity-100 mt-4")}>
                  <label><span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Zemin sınıfı</span><select value={activeScenario.inputs.site.soilClass} onChange={(event) => updateInput("site.soilClass", event.target.value)} className="tool-input w-full rounded-2xl border px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-sky-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:text-slate-100"><option value="ZA">ZA</option><option value="ZB">ZB</option><option value="ZC">ZC</option><option value="ZD">ZD</option><option value="ZE">ZE</option></select><p className="mt-1 text-[11px] text-slate-400">Temel maliyetini %11&apos;e kadar değiştirebilir.</p></label>
                  <label><span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Saha zorluğu</span><select value={activeScenario.inputs.site.siteDifficulty} onChange={(event) => updateInput("site.siteDifficulty", event.target.value)} className="tool-input w-full rounded-2xl border px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-sky-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:text-slate-100"><option value="dusuk">Düşük</option><option value="orta">Orta</option><option value="yuksek">Yüksek</option><option value="cokYuksek">Çok yüksek</option></select><p className="mt-1 text-[11px] text-slate-400">Lojistik ve şantiye riskleri</p></label>
                  <label><span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">İklim</span><select value={activeScenario.inputs.site.climateZone} onChange={(event) => updateInput("site.climateZone", event.target.value)} className="tool-input w-full rounded-2xl border px-4 py-3 text-sm font-semibold text-slate-900 focus:border-sky-500 dark:text-slate-100"><option value="iliman">Ilıman</option><option value="sert">Sert kış</option><option value="sicakNemli">Sıcak / nemli</option></select></label>
                  <label><span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Isıtma sistemi</span><select value={activeScenario.inputs.site.heatingSystem} onChange={(event) => updateInput("site.heatingSystem", event.target.value)} className="tool-input w-full rounded-2xl border px-4 py-3 text-sm font-semibold text-slate-900 focus:border-sky-500 dark:text-slate-100"><option value="bireyselKombi">Bireysel kombi</option><option value="merkeziKazan">Merkezi kazan</option><option value="yerdenIsitma">Yerden ısıtma</option><option value="vrf">VRF / fan-coil</option></select></label>
                  <label><span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Cephe sistemi</span><select value={activeScenario.inputs.site.facadeSystem} onChange={(event) => updateInput("site.facadeSystem", event.target.value)} className="tool-input w-full rounded-2xl border px-4 py-3 text-sm font-semibold text-slate-900 focus:border-sky-500 dark:text-slate-100"><option value="klasik">Klasik</option><option value="kompozit">Kompozit</option><option value="premiumCam">Premium cam</option><option value="tasCephe">Taş kaplama</option></select></label>
                  <label><span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">MEP seviyesi</span><select value={activeScenario.inputs.site.mepLevel} onChange={(event) => updateInput("site.mepLevel", event.target.value)} className="tool-input w-full rounded-2xl border px-4 py-3 text-sm font-semibold text-slate-900 focus:border-sky-500 dark:text-slate-100"><option value="dusuk">Düşük</option><option value="orta">Orta</option><option value="yuksek">Yüksek</option><option value="premium">Premium</option></select></label>
                  <label><span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Otopark tipi</span><select value={activeScenario.inputs.site.parkingType} onChange={(event) => updateInput("site.parkingType", event.target.value)} className="tool-input w-full rounded-2xl border px-4 py-3 text-sm font-semibold text-slate-900 focus:border-sky-500 dark:text-slate-100"><option value="yok">Yok</option><option value="acik">Açık</option><option value="kapali">Kapalı</option></select></label>
                  <label><span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Islak hacim yoğunluğu</span><select value={activeScenario.inputs.site.wetAreaDensity} onChange={(event) => updateInput("site.wetAreaDensity", event.target.value)} className="tool-input w-full rounded-2xl border px-4 py-3 text-sm font-semibold text-slate-900 focus:border-sky-500 dark:text-slate-100"><option value="dusuk">Düşük</option><option value="orta">Orta</option><option value="yuksek">Yüksek</option></select></label>
                  <label><span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Resmî grup</span><select value={benchmarkGroup ?? ""} onChange={(event) => updateInput("reference.officialSelection", event.target.value ? { yil: 2026, grup: event.target.value, sinif: benchmarkClasses[0] ?? "A" } : null)} className="tool-input w-full rounded-2xl border px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100"><option value="">Otomatik eşleştir</option>{officialGroups.map((group) => <option key={group} value={group}>{group}</option>)}</select></label>
                  <label><span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Resmî sınıf</span><select value={activeScenario.inputs.reference.officialSelection?.sinif ?? ""} onChange={(event) => benchmarkGroup ? updateInput("reference.officialSelection", { yil: 2026, grup: benchmarkGroup, sinif: event.target.value }) : undefined} className="tool-input w-full rounded-2xl border px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100" disabled={!benchmarkGroup}><option value="">Otomatik</option>{benchmarkClasses.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                </div>
                <details className="tool-note mt-4 rounded-2xl px-4 py-3">
                  <summary className="cursor-pointer text-sm font-black text-slate-800 dark:text-slate-100">Hesaplama metodolojisi</summary>
                  <div className="mt-3 space-y-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    <p>Base maliyetler 2026 resmî yaklaşık birim maliyetleri, piyasa düzeltmeleri ve saha katsayıları ile hibritlenir.</p>
                    <p>Formül: <code className="rounded bg-slate-900/90 px-2 py-1 text-xs text-white">(Temel maliyet × kalite × bölge × saha) + yumuşak maliyet + contingency + kâr + KDV</code></p>
                  </div>
                </details>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-950/60">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Benchmark ve güven</p>
                  <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">{activeSnapshot.benchmark.label}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {activeSnapshot.benchmark.reasons.join(" · ")}
                  </p>
                  <div className="mt-4 grid gap-2">
                    {activeSnapshot.assumptions.slice(0, 3).map((assumption) => (
                      <div key={assumption} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                        {assumption}
                      </div>
                    ))}
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-12 items-stretch">
            <div className="min-w-0 space-y-4 lg:col-span-7 xl:col-span-8">
              <div className="rounded-[1.85rem] border border-slate-200/80 bg-white/75 px-5 py-5 shadow-lg shadow-sky-500/5 dark:border-slate-700/80 dark:bg-slate-950/50">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Karar çerçevesi</p>
                <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                  <div>
                    <p className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                      {activeScenario.name}
                    </p>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {activeSnapshot.benchmark.reasons[0] ??
                        "Hibrit motor; eşdeğer alan, saha etkisi, ticari katman ve resmî kıyası aynı akışta birleştirir."}
                    </p>
                  </div>
                  <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50/90 px-4 py-4 dark:border-slate-700 dark:bg-slate-950/60">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Canlı özet</p>
                    <p className="mt-2 text-xl font-black text-slate-950 dark:text-white">
                      {formatTL(activeSnapshot.grandTotal)}
                    </p>
                    <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-300">
                      {formatM2Fiyat(activeSnapshot.costPerM2)} · {formatTL(activeSnapshot.range.expected)} beklenen band
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {heroQuickLinks.map((link) => (
                    <button
                      key={link.id}
                      type="button"
                      onClick={() => scrollToSection(link.targetId)}
                      className="rounded-full border border-slate-300 bg-white/80 px-3 py-2 text-xs font-black text-slate-700 transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-sm hover:text-sky-700 active:translate-y-0 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-100 dark:hover:border-sky-500/30 dark:hover:text-sky-200"
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="min-w-0 rounded-[1.9rem] border border-slate-200/80 bg-slate-950 px-5 py-5 text-white shadow-2xl shadow-slate-950/20 dark:border-slate-700/70 dark:bg-slate-950/70 lg:col-span-5 xl:col-span-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-200">Motor özeti</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight">Hibrit maliyet çekirdeği</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Resmî birim maliyet referansı, saha katsayıları, ticari çarpanlar ve manuel override katmanı tek snapshot üretir.
              </p>
              <div className="mt-5 grid gap-3">
                <div className="rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">Veri kaynağı</p>
                  <p className="mt-2 text-sm font-black text-white">{activeSnapshot.dataSourceLine}</p>
                </div>
                <div className="rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">Risk bandı</p>
                  <p className="mt-2 text-sm font-black text-white">
                    {formatTL(activeSnapshot.range.optimistic)} - {formatTL(activeSnapshot.range.pessimistic)}
                  </p>
                  <p className="mt-2 text-xs leading-6 text-slate-300">
                    Varyans {formatYuzde(activeSnapshot.range.variancePct)} · {formatSayi(activeSnapshot.equivalentArea, 0)} m² eşdeğer alan
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">Satış potansiyeli</p>
                  <p className="mt-2 text-sm font-black text-white">
                    {formatTL(activeSnapshot.inputs.commercial.targetSalePrice * activeSnapshot.saleableArea - activeSnapshot.grandTotal)}
                  </p>
                  <p className="mt-2 text-xs leading-6 text-slate-300">
                    {formatM2Fiyat(activeSnapshot.inputs.commercial.targetSalePrice)} hedef satış fiyatı ile hesaplandı
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
          </div>

          <div className="hidden lg:block lg:col-span-4 xl:col-span-3">
            <div className="sticky top-24">
              <SummaryPanelContent snapshot={activeSnapshot} busyAction={busyAction} animatedTotal={animatedTotal} hasBlockingErrors={hasBlockingErrors} isRefreshing={isRefreshing} exportError={exportError} toastMessage={toastMessage} actionLog={actionLog} onPdfPreview={handlePdfPreview} onPdfDownload={handlePdfDownload} onPrint={handlePrint} onExcel={handleExcel} onCopyLink={handleCopyLink} onJsonExport={handleJsonExport} onJsonImport={handleJsonImport} onLoadExample={() => dispatch({ type: "applyPreset", scenarioId: activeScenario.id, presetId: "premium-residence" })} onReset={() => dispatch({ type: "reset", scenarioId: activeScenario.id })} />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[2rem] border border-sky-200/60 bg-gradient-to-br from-sky-50/50 to-white/50 p-6 dark:border-sky-900/50 dark:from-sky-950/20 dark:to-slate-950/50">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="md:w-1/3">
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                <Activity className="h-4 w-4" />
                Hassasiyet Analizi
              </div>
              <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Senaryo Simülasyonu</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Aşağıdaki parametreleri kaydırarak ana formunuzu bozmadan anlık maliyet sapmalarını (Delta TL) simüle edin.
              </p>
              
              {sensitivitySnapshot ? (
                <div className="mt-6 rounded-2xl border border-sky-200 bg-white p-5 shadow-sm dark:border-sky-900 dark:bg-slate-900">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Yeni Tahmini Bütçe</p>
                  <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{formatTL(sensitivitySnapshot.grandTotal)}</p>
                  <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <p className="flex items-center justify-between text-sm font-semibold">
                      <span className="text-slate-600 dark:text-slate-400">Mevcut maliyete fark:</span>
                      <span className={cn("font-black", sensitivitySnapshot.grandTotal >= activeSnapshot.grandTotal ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")}>
                        {sensitivitySnapshot.grandTotal >= activeSnapshot.grandTotal ? "+" : ""}
                        {formatTL(sensitivitySnapshot.grandTotal - activeSnapshot.grandTotal)}
                      </span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl bg-white/50 p-5 ring-1 ring-slate-200 dark:bg-slate-900/50 dark:ring-slate-800">
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Temel form parametreleri ile eşleşiyor.</p>
                </div>
              )}
            </div>

            <div className="grid gap-4 md:w-3/5">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-black text-slate-700 dark:text-slate-300">Müsteahhit Kârı Sapması</span>
                  <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-black text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                    {sensitivityDeltas.margin > 0 ? "+" : ""}{Math.round(sensitivityDeltas.margin * 100)}%
                  </span>
                </div>
                <input type="range" min={-0.10} max={0.20} step={0.01} value={sensitivityDeltas.margin} onChange={(e) => setSensitivityDeltas(s => ({ ...s, margin: parseFloat(e.target.value) }))} className="h-2.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-slate-700" />
                <div className="mt-2 flex justify-between text-[11px] font-semibold text-slate-400"><span>-10%</span><span>0%</span><span>+20%</span></div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-black text-slate-700 dark:text-slate-300">Birim Satış Fiyat Kestirimi</span>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                    {sensitivityDeltas.salePrice > 0 ? "+" : ""}{Math.round(sensitivityDeltas.salePrice * 100)}%
                  </span>
                </div>
                <input type="range" min={-0.30} max={0.30} step={0.05} value={sensitivityDeltas.salePrice} onChange={(e) => setSensitivityDeltas(s => ({ ...s, salePrice: parseFloat(e.target.value) }))} className="h-2.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-slate-700" />
                <div className="mt-2 flex justify-between text-[11px] font-semibold text-slate-400"><span>-30%</span><span>0%</span><span>+30%</span></div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-black text-slate-700 dark:text-slate-300">Beklenmeyen Gider (Contingency) Sapması</span>
                  <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-black text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
                    {sensitivityDeltas.overrideCost > 0 ? "+" : ""}{Math.round(sensitivityDeltas.overrideCost * 100)}%
                  </span>
                </div>
                <input type="range" min={-0.05} max={0.15} step={0.01} value={sensitivityDeltas.overrideCost} onChange={(e) => setSensitivityDeltas(s => ({ ...s, overrideCost: parseFloat(e.target.value) }))} className="h-2.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 dark:bg-slate-700" />
                <div className="mt-2 flex justify-between text-[11px] font-semibold text-slate-400"><span>-5%</span><span>0%</span><span>+15%</span></div>
              </div>
            </div>
          </div>
        </div>


        <div id="construction-breakdown" className="mt-6 tool-panel scroll-mt-28 rounded-[1.75rem] p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Maliyet kırılımı</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">Kalem bazlı analiz</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {hasAdvancedBreakdownFilters ? (
                <button
                  type="button"
                  onClick={resetBreakdownFilters}
                  className="rounded-full border border-rose-300 px-3 py-2 text-xs font-black text-rose-600 dark:border-rose-500/30 dark:text-rose-200"
                >
                  Filtreleri sıfırla
                </button>
              ) : null}
              {(["all", "direct", "indirect", "soft", "commercial"] as const).map((filter) => (
                <button key={filter} type="button" onClick={() => setBreakdownFilter(filter)} className={cn("rounded-full px-3 py-2 text-xs font-black", breakdownFilter === filter ? GROUP_STYLES[filter].badge : "border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300")}>
                  {filter === "all" ? "Tümü" : filter}
                </button>
              ))}
              <select value={breakdownSort} onChange={(event) => setBreakdownSort(event.target.value as BreakdownSort)} className="tool-input rounded-full border px-4 py-2 text-xs font-black text-slate-700 dark:text-slate-100">
                <option value="order">Varsayılan sıra</option>
                <option value="amount">Tutar</option>
                <option value="share">Pay</option>
                <option value="label">A-Z</option>
              </select>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {breakdownGroupCards.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() =>
                  setBreakdownFilter((current) => (current === group.id ? "all" : group.id))
                }
                className={cn(
                  "rounded-[1.35rem] border px-4 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg",
                  breakdownFilter === group.id
                    ? GROUP_STYLES[group.id].badge
                    : "border-slate-200 bg-white/75 dark:border-slate-700 dark:bg-slate-950/50"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                      {group.label}
                    </p>
                    <p className="mt-2 text-lg font-black text-slate-950 dark:text-white">
                      {formatTL(group.total)}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-300 px-2.5 py-1 text-[11px] font-black text-slate-600 dark:border-slate-700 dark:text-slate-200">
                    {formatYuzde(group.share)}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-300">
                  {group.itemCount} kalem · {group.overrideCount} özel · {group.highImpactCount} yüksek etki
                </p>
                <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-300">
                  Lider kalem: {group.leadItem?.label ?? "Veri yok"}
                </p>
              </button>
            ))}
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {breakdownHighlights.map((highlight) => (
              <div
                key={highlight.id}
                className={cn(
                  "rounded-[1.35rem] border border-slate-200 bg-slate-50/85 px-4 py-4 dark:border-slate-700 dark:bg-slate-950/50",
                  isRefreshing && "animate-tool-shimmer"
                )}
              >
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                  {highlight.eyebrow}
                </p>
                <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">
                  {highlight.title}
                </p>
                <p className="mt-3 text-lg font-black text-slate-950 dark:text-white">
                  {highlight.value}
                </p>
                <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-300">
                  {highlight.helper}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <label className="rounded-[1.35rem] border border-slate-200 bg-white/75 px-4 py-4 dark:border-slate-700 dark:bg-slate-950/50">
              <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                Kalem ara
              </span>
              <input
                data-testid="construction-breakdown-search-input"
                value={breakdownSearch}
                onChange={(event) => setBreakdownSearch(event.target.value)}
                placeholder="Betonarme, ruhsat, KDV, lojistik..."
                className="mt-3 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                data-testid="construction-overrides-toggle-button"
                type="button"
                onClick={() => setShowOverriddenOnly((current) => !current)}
                className={cn(
                  "rounded-[1.35rem] border px-4 py-4 text-left text-sm font-black transition",
                  showOverriddenOnly
                    ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
                    : "border-slate-200 bg-white/75 text-slate-700 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-100"
                )}
              >
                Özelleştirilenler
              </button>
              <button
                data-testid="construction-high-impact-toggle-button"
                type="button"
                onClick={() => setShowHighImpactOnly((current) => !current)}
                className={cn(
                  "rounded-[1.35rem] border px-4 py-4 text-left text-sm font-black transition",
                  showHighImpactOnly
                    ? "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100"
                    : "border-slate-200 bg-white/75 text-slate-700 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-100"
                )}
              >
                Yüksek etkili kalemler
              </button>
            </div>
          </div>
          <div className="mt-4 rounded-[1.35rem] border border-slate-200 bg-slate-50/85 px-4 py-4 text-sm dark:border-slate-700 dark:bg-slate-950/50">
            <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
              <p className="font-semibold text-slate-700 dark:text-slate-200">
                Görünen sonuç: {visibleBreakdownStats.groupCount} grup · {visibleBreakdownStats.itemCount} kalem · {formatTL(visibleBreakdownStats.total)}
              </p>
              <p className="text-slate-500 dark:text-slate-300">
                {visibleBreakdownStats.overrideCount} özel kalem · {visibleBreakdownStats.highImpactCount} yüksek etki · Baskın grup: {dominantBreakdownGroup?.label ?? "Veri yok"}
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {sortedGroups.length > 0 ? (
              sortedGroups.map((group) => (
                <div key={group.id} className="rounded-[1.5rem] border border-slate-200/80 bg-white/70 dark:border-slate-700/80 dark:bg-slate-950/50">
                  <button type="button" onClick={() => setExpandedGroups((current) => {
                    const next = new Set(current);
                    if (next.has(group.id)) next.delete(group.id);
                    else next.add(group.id);
                    return next;
                  })} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                    <div>
                      <p className="text-sm font-black text-slate-950 dark:text-white">{group.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">{group.description}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-black text-slate-950 dark:text-white">{formatTL(group.total)}</p>
                        <p className="text-[11px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">{group.items.length} KALEM</p>
                      </div>
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-110" style={{ background: `conic-gradient(#0ea5e9 ${group.share * 100}%, transparent 0)` }}>
                        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-inner dark:bg-slate-950">
                          <span className="text-[9px] font-black text-slate-700 dark:text-slate-300">{Math.round(group.share * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </button>
                  <div className={cn("grid transition-[grid-template-rows] duration-300 ease-in-out", expandedGroups.has(group.id) ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                    <div className="overflow-hidden">
                      <div className="space-y-4 border-t border-slate-200/80 px-4 py-5 dark:border-slate-700/80">
                        {group.items.map((item) => {
                          const isEditing = editingItemId === item.id;
                          const dataSourceLabel = item.isOverridden ? "Özel Veri" : (group.id === "direct" || group.id === "indirect") ? "Resmî Motor" : "Çarpan/Tahmin";
                          const dataSourceColor = item.isOverridden ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" : (group.id === "direct" || group.id === "indirect") ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300";

                          return (
                            <div key={item.id} className={cn("relative rounded-2xl border-l-4 border transition-all duration-300", isEditing ? "bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-2 ring-sky-500 scale-[1.02] z-10 dark:bg-slate-900" : "bg-slate-50/80 dark:bg-slate-950/60", GROUP_STYLES[group.id].border, item.isHighImpact && !isEditing && "shadow-md")}>
                              <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                  <div className="mb-2 flex flex-wrap items-center gap-2">
                                    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]", GROUP_STYLES[group.id].badge)}>{group.id}</span>
                                    <span className={cn("inline-flex rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wider", dataSourceColor)}>{dataSourceLabel}</span>
                                    {item.isOverridden ? <span data-testid="construction-line-item-overridden-badge" className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">Override</span> : null}
                                    {item.isHighImpact && <span className="inline-flex rounded-full bg-rose-100 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">Yüksek Etki</span>}
                                  </div>
                                  <p className="text-sm font-black text-slate-950 dark:text-white">{item.label}</p>
                                  <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">{item.description}</p>
                                </div>
                                <div className="min-w-[200px] shrink-0 text-left md:text-right">
                                  {isEditing ? (
                                    <div className="relative animate-in zoom-in-95 duration-200">
                                      <input data-testid="construction-line-item-edit-input" autoFocus value={editingValue} onChange={(event) => setEditingValue(event.target.value)} onBlur={commitInlineEdit} onKeyDown={(event) => { if (event.key === "Enter") commitInlineEdit(); if (event.key === "Escape") { setEditingItemId(null); setEditingValue(""); } }} className="tool-input w-full rounded-2xl border-2 border-sky-400 bg-sky-50 py-3 pl-4 pr-12 text-right text-base font-black text-sky-900 shadow-inner focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-500/20 dark:border-sky-500/50 dark:bg-sky-950/30 dark:text-sky-100" />
                                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-sky-600 dark:text-sky-400">TL</span>
                                      <div className="absolute -bottom-6 right-2 text-[10px] font-semibold text-sky-600/70 dark:text-sky-400/70">Enter ile kaydet, Esc ile iptal</div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-end justify-start gap-2 md:justify-end">
                                        <p className="text-lg font-black text-slate-950 dark:text-white">{formatTL(item.amount)}</p>
                                        <span className="mb-1 rounded bg-slate-200/60 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800/60 dark:text-slate-400">{formatYuzde(item.share)}</span>
                                      </div>
                                    </>
                                  )}
                                  {!isEditing && (
                                    <div className="mt-3 flex justify-start gap-2 md:justify-end">
                                      <button data-testid="construction-line-item-edit-button" type="button" onClick={() => { setEditingItemId(item.id); setEditingValue(String(Math.round(item.amount))); }} className="rounded-xl bg-white px-3 py-1.5 text-[11px] font-black text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:bg-slate-50 hover:shadow dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800">Düzenle</button>
                                      {item.isOverridden ? <button data-testid="construction-line-item-reset-button" type="button" onClick={() => dispatch({ type: "setOverride", scenarioId: activeScenario.id, itemId: item.id, amount: undefined })} className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-[11px] font-black text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20">Varsayılana Dön</button> : null}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-8 text-sm font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-300">
                Bu filtrelerle eşleşen kalem bulunamadı. Arama veya toggle seçimlerini gevşetebilirsiniz.
              </div>
            )}
          </div>
        </div>

        {collection.scenarios.length > 1 && collection.comparisonMode === "compare" ? (
          <div id="construction-compare" className="mt-6 tool-panel scroll-mt-28 rounded-[1.75rem] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Senaryo karşılaştırma</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">Karşılaştırma tablosu</h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-300">En düşük değerler yeşil vurgulanır.</p>
            </div>
            {comparisonInsights ? (
              <>
                <div className="mt-5 grid gap-3 xl:grid-cols-4">
                  {comparisonInsights.cards.map((card) => (
                    <div
                      key={card.id}
                      className={cn(
                        "rounded-[1.35rem] border border-slate-200 bg-slate-50/85 px-4 py-4 dark:border-slate-700 dark:bg-slate-950/50",
                        isRefreshing && "animate-tool-shimmer"
                      )}
                    >
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                        {card.eyebrow}
                      </p>
                      <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">
                        {card.title}
                      </p>
                      <p className="mt-3 text-lg font-black text-slate-950 dark:text-white">
                        {card.value}
                      </p>
                      <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-300">
                        {card.helper}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-[1.5rem] border border-sky-200 bg-sky-50/85 px-4 py-4 text-sm font-semibold text-sky-800 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-100">
                  {comparisonInsights.recommendation}
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  {(() => {
                    const bestScenarioId = report.scenarios.reduce((best, curr) => {
                      const currProfit = (curr.inputs.commercial.targetSalePrice * curr.saleableArea) - curr.grandTotal;
                      const bestProfit = (best.inputs.commercial.targetSalePrice * best.saleableArea) - best.grandTotal;
                      return currProfit > bestProfit ? curr : best;
                    }, report.scenarios[0])?.scenarioId;

                    return report.scenarios.map((scenario, index) => {
                      const meta = scenarioCardMeta[scenario.scenarioId];
                      const expectedRevenue =
                        scenario.inputs.commercial.targetSalePrice * scenario.saleableArea;
                      const expectedProfit = expectedRevenue - scenario.grandTotal;
                      const isRecommended = scenario.scenarioId === bestScenarioId;

                    return (
                        <div
                          key={scenario.scenarioId}
                          className={cn(
                            "relative rounded-[1.5rem] border px-4 py-4 transition",
                            scenario.scenarioId === collection.activeScenarioId
                              ? "border-sky-300 bg-sky-50/90 shadow-lg shadow-sky-500/10 dark:border-sky-500/30 dark:bg-sky-500/10"
                              : "border-slate-200 bg-white/70 dark:border-slate-700 dark:bg-slate-950/50",
                            isRecommended && "ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-950"
                          )}
                        >
                          {isRecommended && (
                            <div className="absolute -top-3 right-4 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-md">
                              TAVSİYE EDİLEN
                            </div>
                          )}
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-slate-950 dark:text-white">
                              {scenario.scenarioName}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                              {index === 0 ? "Baz senaryo" : "Kıyas senaryosu"}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-[11px] font-black",
                              getBenchmarkStatusClasses(scenario.benchmark.status)
                            )}
                          >
                            {getBenchmarkStatusLabel(scenario.benchmark.status)}
                          </span>
                        </div>
                        <p className="mt-4 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                          {formatTL(scenario.grandTotal)}
                        </p>
                        <div className="mt-3 grid gap-2 text-xs text-slate-500 dark:text-slate-300">
                          <div className="flex items-center justify-between gap-3">
                            <span>m² maliyet</span>
                            <span className="font-black text-slate-700 dark:text-slate-100">
                              {formatM2Fiyat(scenario.costPerM2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span>Satış potansiyeli</span>
                            <span className="font-black text-slate-700 dark:text-slate-100">
                              {formatTL(expectedProfit)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span>En ağır kalem</span>
                            <span className="font-black text-slate-700 dark:text-slate-100">
                              {meta?.topLineItem?.label ?? "Veri yok"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  });
                  })()}
                </div>
              </>
            ) : null}

            {report.scenarios.length > 1 && (
              <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <h3 className="mb-4 text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Senaryo Parametre Profili</h3>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={report.comparisonRows.slice(0, 6).map(row => {
                      const maxVal = Math.max(...row.values.map(v => v.value));
                      const point: Record<string, number | string> = { subject: row.label };
                      row.values.forEach((v, idx) => { point[`Senaryo ${idx + 1}`] = maxVal > 0 ? (v.value / maxVal) * 100 : 0; });
                      return point;
                    })}>
                      <PolarGrid strokeOpacity={0.2} />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Tooltip formatter={formatRadarTooltipValue} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      {report.scenarios.map((s, idx) => {
                        const colors = ["#0ea5e9", "#f43f5e", "#10b981", "#8b5cf6", "#f59e0b"];
                        const c = colors[idx % colors.length];
                        return <Radar key={s.scenarioId} name={s.scenarioName} dataKey={`Senaryo ${idx + 1}`} stroke={c} fill={c} fillOpacity={0.25} />;
                      })}
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-3 py-3">Metrik</th>
                    {report.scenarios.map((scenario) => <th key={scenario.scenarioId} className="px-3 py-3">{scenario.scenarioName}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {report.comparisonRows.map((row) => {
                    const maxRowValue = Math.max(...row.values.map(v => v.value));
                    return (
                      <tr key={row.id} className="border-t border-slate-200/80 dark:border-slate-700/80">
                        <td className="px-3 py-4 font-black text-slate-950 dark:text-white">{row.label}</td>
                        {row.values.map((value, index) => {
                          const baseline = row.values[0]?.value ?? 0;
                          const delta = index === 0 ? 0 : value.value - baseline;
                          const isBest = row.bestScenarioId === value.scenarioId;
                          const pct = maxRowValue > 0 ? (value.value / Math.max(maxRowValue, 1)) * 100 : 0;
                          return (
                            <td key={value.scenarioId} className="px-3 py-4">
                              <div
                                className={cn(
                                  "relative overflow-hidden rounded-2xl border px-4 py-3",
                                  isBest
                                    ? "border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                                    : "border-slate-200 dark:border-slate-700",
                                  value.scenarioId === collection.activeScenarioId &&
                                    "ring-2 ring-sky-500/20"
                                )}
                              >
                                <div className="absolute bottom-0 left-0 top-0 z-0 bg-slate-200/40 transition-all duration-700 dark:bg-slate-700/40" style={{ width: `${pct}%` }} />
                                <div className="relative z-10">
                                  <p className="font-black text-slate-950 dark:text-white">
                                {formatComparisonValue(value.value, row.unit)}
                              </p>
                              {index > 0 ? (
                                <p
                                  className={cn(
                                    "mt-1 inline-flex items-center gap-1 text-xs font-black",
                                    delta <= 0
                                      ? "text-emerald-600 dark:text-emerald-200"
                                      : "text-rose-600 dark:text-rose-200"
                                  )}
                                >
                                  {formatComparisonDelta(delta, baseline, row.unit)}
                                </p>
                              ) : (
                                <p className="mt-1 text-xs font-black text-slate-400 dark:text-slate-500">
                                  Baz referans
                                </p>
                                )}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        <div className="mt-6 tool-panel rounded-[1.75rem] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">İlgili araçlar</p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              { href: "/araclar/kolon-on-boyutlandirma", title: "Kolon Ön Boyutlandırma", description: "Taşıyıcı sistem için ön ebat kararını hızlandırın." },
              { href: "/araclar/imar-hesaplayici", title: "İmar Hesaplayıcı", description: "TAKS, KAKS ve yapılaşma hakkını hızlıca test edin." },
              { href: "/hesaplamalar/resmi-birim-maliyet-2026", title: "Resmî Birim Maliyet 2026", description: "Bakanlık referans tablosu ile maliyet bandını doğrulayın." },
            ].map((card) => (
              <Link key={card.href} href={card.href} className="rounded-[1.5rem] border border-slate-200 bg-white/70 px-5 py-5 transition hover:-translate-y-0.5 hover:shadow-xl dark:border-slate-700 dark:bg-slate-950/50">
                <p className="text-lg font-black text-slate-950 dark:text-white">{card.title}</p>
                <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-300">{card.description}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-sky-600 dark:text-sky-300">Aç <ArrowRight className="h-4 w-4" /></span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-3 md:hidden">
        <div className="mx-auto max-w-screen-sm rounded-[1.75rem] border border-slate-200 bg-white/92 shadow-2xl shadow-slate-950/10 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/92">
          <div className="px-4 pt-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Toplam</p>
                <p className="text-xl font-black tracking-tight text-slate-950 dark:text-white">{formatTL(activeSnapshot.grandTotal)}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                  {activeScenario.name} · {getBenchmarkStatusLabel(activeSnapshot.benchmark.status)}
                </p>
              </div>
              <button data-testid="construction-mobile-open-summary-button" type="button" onClick={() => setSummarySheetOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white dark:bg-white dark:text-slate-950">
                Karar paneli
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {mobileSummaryMetrics.map((metric) => (
                <div key={metric.id} className="rounded-2xl border border-slate-200 bg-slate-50/85 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/60">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{metric.label}</p>
                  <p className="mt-1 text-xs font-black text-slate-900 dark:text-white">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
            <button
              data-testid="construction-mobile-preview-button"
              type="button"
              onClick={handlePdfPreview}
              disabled={hasBlockingErrors || busyAction !== null}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-3 py-3 text-xs font-black text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-100"
            >
              <FileText className="h-4 w-4" />
              {busyAction === "preview" ? "Hazırlanıyor" : "PDF önizleme"}
            </button>
            <button
              data-testid="construction-mobile-copy-link-button"
              type="button"
              onClick={handleCopyLink}
              disabled={busyAction !== null}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-3 py-3 text-xs font-black text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-100"
            >
              <Share2 className="h-4 w-4" />
              {busyAction === "copy" ? "Kopyalanıyor" : "Bağlantı paylaş"}
            </button>
          </div>
        </div>
      </div>

      {summarySheetOpen ? (
        <div className="animate-sheet-backdrop fixed inset-0 z-40 bg-slate-950/70 px-3 py-6 md:hidden" onClick={() => setSummarySheetOpen(false)}>
          <div className="animate-summary-sheet absolute inset-x-0 bottom-0 max-h-[92vh] overflow-auto rounded-t-[2rem] bg-slate-950" style={{ transform: 'translateY(0)' }} onClick={(event) => event.stopPropagation()} onTouchStart={(event) => { touchStartYRef.current = event.touches[0].clientY; event.currentTarget.style.transition = 'none'; }} onTouchMove={(event) => { if (event.currentTarget.scrollTop > 0 || touchStartYRef.current === null) return; const delta = event.touches[0].clientY - touchStartYRef.current; if (delta > 0) { event.currentTarget.style.transform = `translateY(${delta}px)`; if (event.cancelable) event.preventDefault(); } }} onTouchEnd={(event) => { const delta = event.changedTouches[0].clientY - (touchStartYRef.current ?? 0); if (delta > 70) { setSummarySheetOpen(false); event.currentTarget.style.transform = `translateY(100%)`; } else { event.currentTarget.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'; event.currentTarget.style.transform = 'translateY(0)'; } touchStartYRef.current = null; }}>
            <div className="mx-auto max-w-screen-sm">
              <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-white/50" />
              <div className="mb-3 rounded-[1.85rem] border border-white/10 bg-slate-950/90 px-4 py-4 text-white shadow-2xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-200">Mobil özet</p>
                    <p className="mt-2 text-lg font-black">{activeScenario.name}</p>
                    <p className="mt-1 text-xs text-slate-300">
                      {getBenchmarkStatusLabel(activeSnapshot.benchmark.status)} · {formatM2Fiyat(activeSnapshot.costPerM2)}
                    </p>
                  </div>
                  <button
                    data-testid="construction-mobile-close-summary-button"
                    type="button"
                    onClick={() => setSummarySheetOpen(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-300">Toplam</p>
                    <p className="mt-1 text-xs font-black text-white">{formatTL(activeSnapshot.grandTotal)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-300">Risk</p>
                    <p className="mt-1 text-xs font-black text-white">{formatYuzde(activeSnapshot.range.variancePct)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-300">Satış</p>
                    <p className="mt-1 text-xs font-black text-white">
                      {formatTL(activeSnapshot.inputs.commercial.targetSalePrice * activeSnapshot.saleableArea - activeSnapshot.grandTotal)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    data-testid="construction-mobile-sheet-preview-button"
                    type="button"
                    onClick={handlePdfPreview}
                    disabled={hasBlockingErrors || busyAction !== null}
                    className="rounded-2xl bg-white px-4 py-3 text-xs font-black text-slate-950 disabled:opacity-50"
                  >
                    {busyAction === "preview" ? "Hazırlanıyor" : "PDF önizleme"}
                  </button>
                  <button
                    data-testid="construction-mobile-sheet-copy-link-button"
                    type="button"
                    onClick={handleCopyLink}
                    disabled={busyAction !== null}
                    className="rounded-2xl border border-white/20 px-4 py-3 text-xs font-black text-white disabled:opacity-50"
                  >
                    {busyAction === "copy" ? "Kopyalanıyor" : "Bağlantı paylaş"}
                  </button>
                </div>
              </div>
            </div>
            <SummaryPanelContent snapshot={activeSnapshot} busyAction={busyAction} animatedTotal={animatedTotal} hasBlockingErrors={hasBlockingErrors} isRefreshing={isRefreshing} exportError={exportError} toastMessage={toastMessage} actionLog={actionLog} onPdfPreview={handlePdfPreview} onPdfDownload={handlePdfDownload} onPrint={handlePrint} onExcel={handleExcel} onCopyLink={handleCopyLink} onJsonExport={handleJsonExport} onJsonImport={handleJsonImport} onLoadExample={() => dispatch({ type: "applyPreset", scenarioId: activeScenario.id, presetId: "premium-residence" })} onReset={() => dispatch({ type: "reset", scenarioId: activeScenario.id })} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
