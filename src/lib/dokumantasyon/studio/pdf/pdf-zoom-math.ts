/** PDF görüntüleyicide Acrobat ile aynı CSS-piksel ölçeğini kullanır. */
export const CSS_UNITS = 96 / 72;
export const PDF_PAGE_GAP = 8;
export const PDF_PAGE_PADDING = 12;
export const MIN_PDF_ZOOM = 0.25;
export const MAX_PDF_ZOOM = 5;

/** Kullanıcıya gösterilen oranlar; birim oran %100 gerçek boyuttur. */
export const PDF_ZOOM_STEPS = [
  0.25, 1 / 3, 0.5, 2 / 3, 0.75, 1, 1.25, 1.5, 2, 3, 4, 5,
] as const;

export type PdfFitMode = "fit-width" | "fit-page";

export function zoomToPdfScale(zoom: number): number {
  return zoom * CSS_UNITS;
}

export function pdfScaleToZoom(scale: number): number {
  return scale / CSS_UNITS;
}

export function getMaxPdfScale(coarsePointer?: boolean): number {
  const coarse =
    coarsePointer ??
    (typeof window !== "undefined" &&
      !!window.matchMedia?.("(pointer: coarse)").matches);
  return zoomToPdfScale(coarse ? 3 : MAX_PDF_ZOOM);
}

export function getNextPdfScale(scale: number, direction: 1 | -1, max = getMaxPdfScale()): number {
  const zoom = pdfScaleToZoom(scale);
  const next = direction > 0
    ? PDF_ZOOM_STEPS.find((step) => step > zoom + 0.01)
    : [...PDF_ZOOM_STEPS].reverse().find((step) => step < zoom - 0.01);
  const fallback = direction > 0 ? MAX_PDF_ZOOM : MIN_PDF_ZOOM;
  return Math.min(max, Math.max(zoomToPdfScale(MIN_PDF_ZOOM), zoomToPdfScale(next ?? fallback)));
}

/** Kullanıcı rotasyonu intrinsic PDF rotasyonundan ayrı olarak tam bir kez uygulanır. */
export function rotatePdfPageSize(
  size: { width: number; height: number },
  rotation: number
): { width: number; height: number } {
  return Math.abs(rotation % 180) === 90
    ? { width: size.height, height: size.width }
    : size;
}

/** Fit ölçeğini 1e-4 hassasiyetle aşağı yuvarlayarak yatay taşmayı önler. */
export function computePdfFitScale(options: {
  mode: PdfFitMode;
  containerWidth: number;
  containerHeight: number;
  pageWidth: number;
  pageHeight: number;
  padding?: number;
  topInset?: number;
}): number {
  const padding = options.padding ?? PDF_PAGE_PADDING;
  const availableWidth = Math.max(1, options.containerWidth - padding * 2);
  const availableHeight = Math.max(
    1,
    options.containerHeight - padding * 2 - (options.topInset ?? 0)
  );
  const widthScale = availableWidth / Math.max(1, options.pageWidth);
  const pageScale = Math.min(widthScale, availableHeight / Math.max(1, options.pageHeight));
  const scale = options.mode === "fit-width" ? widthScale : pageScale;
  return Math.floor(scale * 1e4) / 1e4;
}

export interface WheelLike { deltaY: number; deltaMode: number }
export const WHEEL_NOTCH_FACTOR = 1.1;      // bir fare çentiği = %10 (S3 ölçütü 1,05–1,15)
export const WHEEL_TRACKPAD_K = 0.01;       // trackpad pinch: exp(-deltaY·k)
export const WHEEL_TRACKPAD_CLAMP = 40;     // tek olayda en fazla ±40 px eşdeğeri

/** Fare çentiği mi? deltaMode=1 (satır) veya piksel modunda tamsayı ve |deltaY|≥50 (Chrome/Edge ±100, bazı sürücüler ±120). */
export function isWheelNotch(e: WheelLike): boolean {
  return e.deltaMode === 1 || (e.deltaMode === 0 && Number.isInteger(e.deltaY) && Math.abs(e.deltaY) >= 50);
}

export function wheelZoomFactor(e: WheelLike): number {
  if (isWheelNotch(e)) return Math.pow(WHEEL_NOTCH_FACTOR, -Math.sign(e.deltaY || 1));
  const px = e.deltaMode === 2 ? e.deltaY * 100 : e.deltaY;       // sayfa modu (nadir)
  const d = Math.max(-WHEEL_TRACKPAD_CLAMP, Math.min(WHEEL_TRACKPAD_CLAMP, px));
  return Math.exp(-d * WHEEL_TRACKPAD_K);
}
