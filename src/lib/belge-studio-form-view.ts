/**
 * Belge Stüdyosu — Form Görünümü, Ölçekleme ve Yoğunluk Motoru Politikası
 *
 * Yalnızca sol form görünümünü yönetir. PDF önizleme motoruna, PDF render
 * veya PDF bytes üretimine kesinlikle etki etmez.
 */

export type ManualScale = 0.90 | 1.00 | 1.10 | 1.25;

export const FORM_SCALE_PRESETS: readonly ManualScale[] = [0.90, 1.00, 1.10, 1.25] as const;

export const DEFAULT_FORM_SCALE: ManualScale = 1.00;

export type FormMode = "manual" | "fit";

export type Density = "normal" | "compact";

export type FitStatus = "idle" | "measuring" | "fitted" | "limited" | "unavailable";

export const FORM_VIEW_STORAGE_KEY = "belge-studio:form-view:v3";

export interface FormViewPersistedState {
  version: 3;
  mode: FormMode;
  manualScale: ManualScale;
  manualDensity: Density;
}

export const DEFAULT_FORM_VIEW_STATE: FormViewPersistedState = {
  version: 3,
  mode: "manual",
  manualScale: DEFAULT_FORM_SCALE,
  manualDensity: "normal",
};

/**
 * Sayısal ölçeği en yakın güvenli manuel presete eşler veya varsayılana döner.
 */
export function sanitizeManualScale(scale: unknown): ManualScale {
  if (typeof scale !== "number" || Number.isNaN(scale)) return DEFAULT_FORM_SCALE;
  const match = FORM_SCALE_PRESETS.find((p) => Math.abs(p - scale) < 0.01);
  return match ?? DEFAULT_FORM_SCALE;
}

/**
 * Depolanan veriyi sıkı allowlist ve versiyon kontrolüyle doğrular.
 * Kişisel veri, belge içeriği veya geçersiz tipleri kesinlikle reddeder.
 */
export function safeParseFormViewState(raw: unknown): FormViewPersistedState | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const candidate = raw as Record<string, unknown>;

  if (candidate.version !== 3) {
    return null;
  }

  const mode: FormMode = candidate.mode === "fit" ? "fit" : candidate.mode === "manual" ? "manual" : "manual";
  const manualDensity: Density = candidate.manualDensity === "compact" ? "compact" : "normal";
  const manualScale = sanitizeManualScale(candidate.manualScale);

  return {
    version: 3,
    mode,
    manualScale,
    manualDensity,
  };
}

/**
 * localStorage üzerinden form görünüm tercihini güvenle okur (SSR korumalı).
 */
export function loadFormViewPreference(): FormViewPersistedState {
  if (typeof window === "undefined") {
    return DEFAULT_FORM_VIEW_STATE;
  }

  try {
    const serialized = window.localStorage.getItem(FORM_VIEW_STORAGE_KEY);
    if (!serialized) return DEFAULT_FORM_VIEW_STATE;
    const parsed = JSON.parse(serialized);
    return safeParseFormViewState(parsed) ?? DEFAULT_FORM_VIEW_STATE;
  } catch {
    return DEFAULT_FORM_VIEW_STATE;
  }
}

/**
 * Form görünüm tercihini güvenle kaydeder.
 * Kişisel veri veya PDF bytes asla yazılmaz.
 */
export function saveFormViewPreference(state: {
  mode: FormMode;
  manualScale: ManualScale;
  manualDensity: Density;
}): void {
  if (typeof window === "undefined") return;

  try {
    const payload: FormViewPersistedState = {
      version: 3,
      mode: state.mode,
      manualScale: state.manualScale,
      manualDensity: state.manualDensity,
    };
    window.localStorage.setItem(FORM_VIEW_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Depolama kotası veya izin hatasında sessizce yut
  }
}

export const FIT_MAX_SCALE = 1.15;
export const FIT_MIN_SCALE = 0.90;
export const FIT_TOLERANCE_PX = 2;

export interface ViewportDimensions {
  clientWidth: number;
  clientHeight: number;
}

export interface ContentExtents {
  scrollWidth: number;
  scrollHeight: number;
  firstCardTop: number;
  lastCardBottom: number;
}

/**
 * Form içeriğinin scrollport dikdörtgenine her iki eksende (yatay ve dikey)
 * tam olarak sığıp sığmadığını teyit eder.
 *
 * İçerik alta kaydırılmışken ilk eleman ekran dışında kalmasın diye normalize
 * koordinatlar ve 2px piksel yuvarlama toleransı kullanır.
 */
export function fitsOnBothAxes(
  viewport: ViewportDimensions,
  content: ContentExtents,
  tolerance = FIT_TOLERANCE_PX
): boolean {
  if (viewport.clientWidth <= 0 || viewport.clientHeight <= 0) {
    return false;
  }

  const horizontalFit =
    content.scrollWidth <= viewport.clientWidth + tolerance;

  const verticalFit =
    content.scrollHeight <= viewport.clientHeight + tolerance &&
    content.lastCardBottom <= viewport.clientHeight + tolerance &&
    content.firstCardTop >= -tolerance;

  return horizontalFit && verticalFit;
}

/**
 * Formatlanmış ölçek etiketi (Örn: "%100", "%90")
 */
export function formatScaleLabel(scale: number): string {
  return `%${Math.round(scale * 100)}`;
}
