import { z } from "zod";
import {
  isLiveSimulationSlug,
  SIMULATIONS_HUB_HREF,
  type SimulationSceneSlug,
} from "../catalog";
import type {
  CameraPresetId,
  ColumnPresetId,
  DetailModel,
  LayerVisibilityMask,
  SimulationLayerId,
} from "../core/types";
import {
  buildColumnDetailModel,
  getDefaultColumnExperimentInput,
  validateAndBuildCustomColumnSpec,
  type ColumnParameterExperimentInput,
} from "../scenes/column-c1";
import {
  createInitialSimulationViewState,
  DEFAULT_LAYER_VISIBILITY,
  isPartVisibleInLayers,
  type SimulationViewState,
  type WorkspaceLayoutMode,
} from "./view-reducer";

export const MAX_SIMULATION_URL_LENGTH = 2_048;
export const SIMULATION_URL_VERSION = 1 as const;

export const LAYER_MASK_KEYS: readonly SimulationLayerId[] = [
  "concrete",
  "longitudinal",
  "stirrup",
  "dowel",
  "crosstie",
  "dimensions",
] as const;

const CameraPresetSchema = z.enum(["isometric", "front", "right", "top"]);
const ViewModeSchema = z.enum(["split", "3d", "2d"]);
const SectionAxisSchema = z.enum(["z", "x"]);
const ColumnPresetSchema = z.enum([
  "c1-referans",
  "c1-cirozlu-ogretim",
  "k1-referans",
  "d1-dis-birlesim",
  "t1-tekil-temel",
  "p1-perde",
  "r1-radye-temel",
]);

export function encodeLayerMaskBitstring(layers: LayerVisibilityMask): string {
  return LAYER_MASK_KEYS.map((key) => (layers[key] ? "1" : "0")).join("");
}

export function decodeLayerMaskBitstring(
  raw: string | null | undefined,
): LayerVisibilityMask | null {
  if (typeof raw !== "string" || !/^[01]{6}$/.test(raw)) {
    return null;
  }
  const mask: LayerVisibilityMask = { ...DEFAULT_LAYER_VISIBILITY };
  LAYER_MASK_KEYS.forEach((key, idx) => {
    mask[key] = raw[idx] === "1";
  });
  return mask;
}

export function computeNormalizedSectionPosition(
  elevationOrPosMm: number,
  model: DetailModel,
): number {
  const isBeam = model.slug === "kiris-detayi" || model.primaryAxis === "x";
  const minCoord = isBeam ? model.boundsMm.min.x : model.boundsMm.min.z;
  const maxCoord = isBeam ? model.boundsMm.max.x : model.boundsMm.max.z;
  const span = Math.max(1, maxCoord - minCoord);
  const clamped = Math.max(minCoord, Math.min(maxCoord, elevationOrPosMm));
  return Number(((clamped - minCoord) / span).toFixed(4));
}

export function resolveElevationFromNormalizedPosition(
  normalizedRatio: number,
  model: DetailModel,
): number {
  const isBeam = model.slug === "kiris-detayi" || model.primaryAxis === "x";
  const minCoord = isBeam ? model.boundsMm.min.x : model.boundsMm.min.z;
  const maxCoord = isBeam ? model.boundsMm.max.x : model.boundsMm.max.z;
  const clampedRatio = Math.max(0, Math.min(1, normalizedRatio));
  return Math.round(minCoord + clampedRatio * (maxCoord - minCoord));
}

export interface EncodeSimulationShareUrlOptions {
  slug: SimulationSceneSlug;
  viewState: SimulationViewState;
  model: DetailModel;
  columnParams?: ColumnParameterExperimentInput | null;
  origin?: string;
}

/**
 * Sürümlü izin listesiyle (v=1) paylaşılabilir simülasyon URL'i üretir.
 * Serbest kamera matrisleri taşınmaz; yalnız hazır kamera yönü (`cam`) taşınır.
 */
export function encodeSimulationShareUrl(
  options: EncodeSimulationShareUrlOptions,
): string {
  const { slug, viewState, model, columnParams, origin = "" } = options;
  const params = new URLSearchParams();

  params.set("v", String(SIMULATION_URL_VERSION));
  params.set("preset", viewState.presetId);
  params.set("cam", viewState.cameraPreset);
  params.set("layers", encodeLayerMaskBitstring(viewState.layers));

  if (viewState.selectedPartId) {
    params.set("part", viewState.selectedPartId);
  }

  params.set("mode", viewState.viewTab);

  const axis: "z" | "x" =
    model.slug === "kiris-detayi" || model.primaryAxis === "x" ? "x" : "z";
  params.set("sec", viewState.section.enabled ? "1" : "0");
  params.set("saxis", axis);
  params.set(
    "spos",
    String(computeNormalizedSectionPosition(viewState.section.elevationZMm, model)),
  );
  params.set(
    "exp",
    String(Math.max(0, Math.min(100, Math.round(viewState.explodePercent)))),
  );

  if (viewState.learning.mode === "guided") {
    params.set("step", String(viewState.learning.stepIndex));
  }

  if (slug === "kolon-detayi" && columnParams) {
    params.set("cw", String(Math.round(columnParams.sectionWidthMm)));
    params.set("cd", String(Math.round(columnParams.sectionDepthMm)));
    params.set("cb", String(Math.round(columnParams.longitudinalDiameterMm)));
    params.set("sc", String(Math.round(columnParams.confinementSpacingMm)));
    params.set("sm", String(Math.round(columnParams.middleSpacingMm)));
  }

  const basePath = `${origin}${SIMULATIONS_HUB_HREF}/${slug}`;
  const fullUrl = `${basePath}?${params.toString()}`;
  if (fullUrl.length > MAX_SIMULATION_URL_LENGTH) {
    params.delete("part");
    return `${basePath}?${params.toString()}`;
  }
  return fullUrl;
}

export interface AppliedSimulationUrlStateResult {
  fellBackToDefault: boolean;
  reason: string | null;
  model: DetailModel;
  viewState: SimulationViewState;
  columnParams: ColumnParameterExperimentInput;
}

function parseFiniteNum(raw: string | null): number | null {
  if (raw === null || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Aynı sıra ile: parse → validate → model → view uygular.
 * Bozuk sürüm, aşırı uzun URL (> 2 KB), NaN/Infinity, negatif kesit veya geçersiz kolonda
 * kırılma/donma olmadan güvenli varsayılan sahneye döner.
 */
export function parseAndApplySimulationUrlState(options: {
  slug: string;
  searchOrUrl: string;
  initialModel: DetailModel;
}): AppliedSimulationUrlStateResult {
  const { slug, searchOrUrl, initialModel } = options;

  const buildSafeDefault = (reason: string | null): AppliedSimulationUrlStateResult => {
    const defaultPreset = initialModel.presetId;
    return {
      fellBackToDefault: reason !== null,
      reason,
      model: initialModel,
      viewState: createInitialSimulationViewState(defaultPreset),
      columnParams: getDefaultColumnExperimentInput(
        defaultPreset === "c1-cirozlu-ogretim" ? "c1-cirozlu-ogretim" : "c1-referans",
      ),
    };
  };

  if (!isLiveSimulationSlug(slug)) {
    return buildSafeDefault(`Geçersiz sahne kimliği: ${slug}`);
  }

  if (typeof searchOrUrl !== "string" || searchOrUrl.length > MAX_SIMULATION_URL_LENGTH) {
    return buildSafeDefault("URL uzunluğu 2 KB güvenlik sınırını aştığı için varsayılan görünüm yüklendi.");
  }

  let queryString = searchOrUrl.trim();
  try {
    if (queryString.startsWith("http://") || queryString.startsWith("https://")) {
      const parsedUrl = new URL(queryString);
      queryString = parsedUrl.search;
    } else if (queryString.includes("?")) {
      queryString = queryString.slice(queryString.indexOf("?"));
    }
  } catch {
    return buildSafeDefault("Bozuk URL biçimi nedeniyle varsayılan görünüm yüklendi.");
  }

  if (!queryString || queryString === "?") {
    return buildSafeDefault(null);
  }

  const sp = new URLSearchParams(
    queryString.startsWith("?") ? queryString.slice(1) : queryString,
  );

  // Sürüm kontrolü
  const vRaw = sp.get("v");
  if (vRaw !== null && vRaw !== String(SIMULATION_URL_VERSION)) {
    return buildSafeDefault(`Desteklenmeyen bağlantı sürümü (v=${vRaw}); güvenli varsayılana dönüldü.`);
  }

  // 1. Önayar & Kolon parametreleri -> Model üretimi (parse -> validate -> model)
  let targetPresetId: ColumnPresetId = initialModel.presetId;
  const presetRaw = sp.get("preset");
  if (presetRaw !== null) {
    const parsedPreset = ColumnPresetSchema.safeParse(presetRaw);
    if (!parsedPreset.success) {
      return buildSafeDefault(`Geçersiz önayar parametresi (${presetRaw}); güvenli varsayılana dönüldü.`);
    }
    if (slug === "kolon-detayi") {
      if (
        parsedPreset.data !== "c1-referans" &&
        parsedPreset.data !== "c1-cirozlu-ogretim"
      ) {
        return buildSafeDefault("Kolon sahnesi için uyumsuz önayar; varsayılan C1 yüklendi.");
      }
      targetPresetId = parsedPreset.data;
    } else if (parsedPreset.data !== initialModel.presetId) {
      return buildSafeDefault("Sahne ile önayar kimliği uyuşmadığı için varsayılan görünüm yüklendi.");
    }
  }

  let resolvedModel: DetailModel = initialModel;
  let resolvedColumnParams: ColumnParameterExperimentInput =
    getDefaultColumnExperimentInput(targetPresetId);

  if (slug === "kolon-detayi") {
    const baseInput = getDefaultColumnExperimentInput(targetPresetId);
    const hasCustomColParams =
      sp.has("cw") || sp.has("cd") || sp.has("cb") || sp.has("sc") || sp.has("sm");

    if (hasCustomColParams || targetPresetId !== initialModel.presetId) {
      const cw = sp.has("cw") ? parseFiniteNum(sp.get("cw")) : baseInput.sectionWidthMm;
      const cd = sp.has("cd") ? parseFiniteNum(sp.get("cd")) : baseInput.sectionDepthMm;
      const cb = sp.has("cb")
        ? parseFiniteNum(sp.get("cb"))
        : baseInput.longitudinalDiameterMm;
      const sc = sp.has("sc")
        ? parseFiniteNum(sp.get("sc"))
        : baseInput.confinementSpacingMm;
      const sm = sp.has("sm") ? parseFiniteNum(sp.get("sm")) : baseInput.middleSpacingMm;

      if (cw === null || cd === null || cb === null || sc === null || sm === null) {
        return buildSafeDefault(
          "URL içindeki kolon parametrelerinden biri sayısal/sonlu olmadığı için varsayılan sahne yüklendi.",
        );
      }

      const validation = validateAndBuildCustomColumnSpec({
        presetId:
          targetPresetId === "c1-cirozlu-ogretim"
            ? "c1-cirozlu-ogretim"
            : "c1-referans",
        sectionWidthMm: cw,
        sectionDepthMm: cd,
        longitudinalDiameterMm: cb,
        confinementSpacingMm: sc,
        middleSpacingMm: sm,
      });

      if (!validation.valid || !validation.spec || !validation.normalizedParams) {
        return buildSafeDefault(
          validation.reason ??
            "URL kolon parametreleri teknik aralıklardan geçmediği için varsayılan sahne yüklendi.",
        );
      }

      resolvedColumnParams = validation.normalizedParams;
      resolvedModel = buildColumnDetailModel(validation.spec);
    }
  }

  // 2. ViewState alanlarının doğrulanması ve uygulanması (model -> view)
  const nextView: SimulationViewState = createInitialSimulationViewState(targetPresetId);

  // Hazır kamera yönü
  const camRaw = sp.get("cam");
  if (camRaw !== null) {
    const parsedCam = CameraPresetSchema.safeParse(camRaw);
    if (!parsedCam.success) {
      return buildSafeDefault(`Geçersiz kamera yönü (${camRaw}); güvenli varsayılana dönüldü.`);
    }
    nextView.cameraPreset = parsedCam.data as CameraPresetId;
  }

  // Görünüm modu
  const modeRaw = sp.get("mode");
  if (modeRaw !== null) {
    const parsedMode = ViewModeSchema.safeParse(modeRaw);
    if (!parsedMode.success) {
      return buildSafeDefault(`Geçersiz görünüm modu (${modeRaw}); güvenli varsayılana dönüldü.`);
    }
    nextView.viewTab = parsedMode.data as WorkspaceLayoutMode;
  }

  // Katman maskesi
  const layersRaw = sp.get("layers");
  if (layersRaw !== null) {
    const decodedMask = decodeLayerMaskBitstring(layersRaw);
    if (!decodedMask) {
      return buildSafeDefault("Geçersiz katman maskesi biçimi nedeniyle varsayılan görünüm yüklendi.");
    }
    nextView.layers = decodedMask;
  }

  // Öğrenme adımı
  const stepRaw = sp.get("step");
  if (stepRaw !== null) {
    const stepNum = parseFiniteNum(stepRaw);
    if (stepNum === null || stepNum < 0 || stepNum > 4) {
      return buildSafeDefault("Geçersiz öğrenme adımı parametresi nedeniyle varsayılan görünüm yüklendi.");
    }
    nextView.learning = {
      mode: "guided",
      stepIndex: Math.round(stepNum),
      isPlaying: false,
      layerProgressT: 1,
    };
  }

  // Kesit durumu ve normalize konumu (spos = 0..1)
  const expectedAxis =
    resolvedModel.slug === "kiris-detayi" || resolvedModel.primaryAxis === "x"
      ? "x"
      : "z";
  const saxisRaw = sp.get("saxis");
  if (saxisRaw !== null) {
    if (!SectionAxisSchema.safeParse(saxisRaw).success || saxisRaw !== expectedAxis) {
      return buildSafeDefault("Kesit ekseni sahne ile uyuşmadığı için varsayılan görünüm yüklendi.");
    }
  }

  const sposRaw = sp.get("spos");
  if (sposRaw !== null) {
    const sposNum = parseFiniteNum(sposRaw);
    if (sposNum === null || sposNum < 0 || sposNum > 1) {
      return buildSafeDefault(
        "Kesit konumu (spos) [0, 1] aralığı dışında veya sayısal olmadığı için varsayılan sahne yüklendi.",
      );
    }
    nextView.section.elevationZMm = resolveElevationFromNormalizedPosition(
      sposNum,
      resolvedModel,
    );
  }

  const secRaw = sp.get("sec");
  if (secRaw !== null) {
    if (secRaw === "1") {
      nextView.section.enabled = true;
    } else if (secRaw === "0") {
      nextView.section.enabled = false;
    } else {
      return buildSafeDefault("Geçersiz kesit bayrağı (sec) nedeniyle varsayılan görünüm yüklendi.");
    }
  }

  // Patlatma (kesit açıksa patlatma 0'da kalır)
  const expRaw = sp.get("exp");
  if (expRaw !== null) {
    const expNum = parseFiniteNum(expRaw);
    if (expNum === null || expNum < 0 || expNum > 100) {
      return buildSafeDefault(
        "Patlatma yüzdesi (exp) [0, 100] aralığı dışında veya sayısal olmadığı için varsayılan sahne yüklendi.",
      );
    }
    if (!nextView.section.enabled) {
      nextView.explodePercent = Math.round(expNum);
    }
  }

  // Seçili parça ID: yalnız modelde var olan ve aktif katmanda görünür olan parça seçilebilir!
  const partRaw = sp.get("part");
  if (partRaw !== null && partRaw.length <= 96 && /^[a-z0-9-]+$/i.test(partRaw)) {
    const foundPart = resolvedModel.parts.find((item) => item.id === partRaw);
    if (foundPart && isPartVisibleInLayers(foundPart, nextView.layers)) {
      nextView.selectedPartId = foundPart.id;
    } else {
      nextView.selectedPartId = null;
    }
  }

  return {
    fellBackToDefault: false,
    reason: null,
    model: resolvedModel,
    viewState: nextView,
    columnParams: resolvedColumnParams,
  };
}
