// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF SAYFA GEOMETRİSİ TEK DOĞRULUK KAYNAĞI (FAZ R2)
// ============================================================================

export interface PageGeometryInput {
  pageWidthPt: number;
  pageHeightPt: number;
  scale: number;
  dpr?: number;
  maxPixelBudget?: number;
}

export interface PageGeometryOutput {
  cssWidth: number;
  cssHeight: number;
  bitmapWidth: number;
  bitmapHeight: number;
  outputScale: number;
  isQualityReduced: boolean;
}

export const DEFAULT_PIXEL_BUDGET = 16 * 1024 * 1024; // 16 Megapiksel bütçe

/**
 * PDF Sayfa Geometrisi Hesabı — Tek Doğruluk Kaynağı (Single Source of Truth)
 *
 * Container, canvas (style.width/height ve bitmap width/height), text layer,
 * highlight overlay ve annotation layer hepsi bu hesaba uyar.
 */
export function computePageGeometry(input: PageGeometryInput): PageGeometryOutput {
  const {
    pageWidthPt,
    pageHeightPt,
    scale,
    dpr = 1,
    maxPixelBudget = DEFAULT_PIXEL_BUDGET,
  } = input;

  const validScale = Math.max(0.1, Number.isFinite(scale) ? scale : 1.0);
  const validDpr = Math.max(1, Number.isFinite(dpr) ? dpr : 1);
  const targetDpr = Math.min(validDpr, 2.0);

  const cssWidth = Math.max(1, Math.floor(pageWidthPt * validScale));
  const cssHeight = Math.max(1, Math.floor(pageHeightPt * validScale));

  // Piksel bütçesi kontrolü
  let outputScale = targetDpr;
  let isQualityReduced = false;

  const unconstrainedPixels = cssWidth * targetDpr * (cssHeight * targetDpr);
  if (unconstrainedPixels > maxPixelBudget) {
    const budgetScaleFactor = Math.sqrt(maxPixelBudget / (cssWidth * cssHeight));
    // Asla 1.0'ın altına düşmez (alt sınır: 1.0)
    outputScale = Math.max(1.0, budgetScaleFactor);
    isQualityReduced = outputScale < targetDpr;
  }

  const bitmapWidth = Math.max(1, Math.floor(cssWidth * outputScale));
  const bitmapHeight = Math.max(1, Math.floor(cssHeight * outputScale));

  return {
    cssWidth,
    cssHeight,
    bitmapWidth,
    bitmapHeight,
    outputScale: Number(outputScale.toFixed(3)),
    isQualityReduced,
  };
}
