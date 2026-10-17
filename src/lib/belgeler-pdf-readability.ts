/**
 * Belgeler PDF Readability & Print Risk Engine (ASAMA_06)
 *
 * Amaç:
 * - Gerçek PDF şablonlarındaki AcroForm widget geometrisini ve basım davranışı sınırlarını analiz etmek.
 * - Runtime tarafında PDF parse veya render maliyeti üretmeden, saf ve ucuz offline kalibrasyonla
 *   baskı okunabilirlik riskini ('none' | 'possible' | 'serious' | 'unknown') belirlemek.
 * - Kullanıcıya dürüst rehberlik sunmak; veri kaybı yapmadan (0 sessiz kesme) uzun metnin
 *   fiziksel A4 baskıda ne kadar küçüleceğini öngörmek.
 */

import { PDFDocument } from "pdf-lib";
import type { BelgeDocumentId } from "./belge-studio-inline-field-map";

export type ReadabilityRisk = "none" | "possible" | "serious" | "unknown";

export interface FieldReadabilityAssessment {
  documentId: BelgeDocumentId;
  fieldKey: string;
  charCount: number;
  isMultiline: boolean;
  nominalWidthPt: number;
  estimatedFontSizePt: number | null;
  risk: ReadabilityRisk;
  code: string;
  message: string | null;
}

export interface PhysicalFieldGeometry {
  widthPt: number;
  heightPt: number;
  isMultiline: boolean;
  nominalFontSize: number;
  /** Yüksek baskı riski taşıyan dar tek satırlı alan mı? */
  isNarrowSingleLine: boolean;
  /** Karakter eşikleri: [possibleThreshold, seriousThreshold] */
  thresholds: [number, number];
}

/**
 * Beş belgedeki adres ve kritik metin alanlarının fiziksel AcroForm geometri envanteri.
 * Gerçek şablon PDF'lerindeki Widget /Rect ve /DA değerleriyle kalibre edilmiştir.
 */
export const CRITICAL_READABILITY_GEOMETRIES: Record<
  string,
  PhysicalFieldGeometry
> = {
  // 1. İstifa Dilekçesi - Genişletilmiş ve çok satırlı adres alanı (225 x 36 pt, multiline: true)
  "santiye-sefi-istifa-dilekcesi:adres_deger": {
    widthPt: 225.0,
    heightPt: 36.0,
    isMultiline: true,
    nominalFontSize: 8.0,
    isNarrowSingleLine: false,
    thresholds: [130, 220], // Çok satırlı düzende 125+ karaktere kadar 8 pt nominal font korunur
  },

  // 2. Taahhütname - Tek satırlı düşük puntolu (5 pt) adres alanları (9.6 pt yükseklik)
  "santiye-sefi-taahhutnamesi:adres": {
    widthPt: 325.5,
    heightPt: 9.6,
    isMultiline: false,
    nominalFontSize: 5.0,
    isNarrowSingleLine: true,
    thresholds: [65, 110],
  },
  "santiye-sefi-taahhutnamesi:yapi_adresi": {
    widthPt: 310.0,
    heightPt: 9.6,
    isMultiline: false,
    nominalFontSize: 5.0,
    isNarrowSingleLine: true,
    thresholds: [60, 105],
  },
  "santiye-sefi-taahhutnamesi:yapi_sahibi_adresi": {
    widthPt: 310.0,
    heightPt: 9.6,
    isMultiline: false,
    nominalFontSize: 5.0,
    isNarrowSingleLine: true,
    thresholds: [60, 105],
  },

  // 3. Sözleşme - Tek satırlı adres alanı (170 x 11.5 pt, 7 pt font)
  "santiye-sefi-sozlesmesi:adres": {
    widthPt: 170.0,
    heightPt: 11.5,
    isMultiline: false,
    nominalFontSize: 7.0,
    isNarrowSingleLine: true,
    thresholds: [50, 80],
  },

  // 4. İnşaat Ruhsatı - Çok satırlı geniş adres alanı (451 x 44 pt, multiline: true)
  "insaat-ruhsati-dilekcesi:adres": {
    widthPt: 451.0,
    heightPt: 44.0,
    isMultiline: true,
    nominalFontSize: 10.5,
    isNarrowSingleLine: false,
    thresholds: [110, 200],
  },

  // 5. Beton Döküm Tutanağı - Çok satırlı geniş yer alanı (352.28 x 36 pt, multiline: true)
  "beton-dokum-tutanagi:yer": {
    widthPt: 352.28,
    heightPt: 36.0,
    isMultiline: true,
    nominalFontSize: 9.0,
    isNarrowSingleLine: false,
    thresholds: [90, 160],
  },
};

/**
 * Saf, hafif ve hızlı çalışma zamanı okunabilirlik risk değerlendiricisi.
 * Ağ çağrısı, PDF parse veya canvas işlemi yapmaz.
 *
 * @param documentId Beş resmî belgeden biri
 * @param fieldKey AcroForm alan adı
 * @param rawValue Kullanıcının girdiği ham metin
 */
export function assessFieldReadability(
  documentId: BelgeDocumentId,
  fieldKey: string,
  rawValue: string
): FieldReadabilityAssessment {
  const trimmed = rawValue.trim();
  const charCount = trimmed.length;

  const key = `${documentId}:${fieldKey}`;
  const geometry = CRITICAL_READABILITY_GEOMETRIES[key];

  // Geometrisi kritik olarak izlenmeyen alanlar için
  if (!geometry) {
    return {
      documentId,
      fieldKey,
      charCount,
      isMultiline: false,
      nominalWidthPt: 0,
      estimatedFontSizePt: null,
      risk: "none",
      code: "readability-untracked",
      message: null,
    };
  }

  // Boş veya nötr '-' değerler
  if (charCount === 0 || trimmed === "-") {
    return {
      documentId,
      fieldKey,
      charCount,
      isMultiline: geometry.isMultiline,
      nominalWidthPt: geometry.widthPt,
      estimatedFontSizePt: geometry.nominalFontSize,
      risk: "none",
      code: "readability-empty",
      message: null,
    };
  }

  const [possibleThreshold, seriousThreshold] = geometry.thresholds;

  // Tek satırlı dar alanlar için font punto tahmini (Arial fontu ortalama glif genişliği ~0.52 em)
  let estimatedFontSize = geometry.nominalFontSize;
  if (!geometry.isMultiline) {
    const estimatedTextWidthAtNominal = charCount * (geometry.nominalFontSize * 0.52);
    if (estimatedTextWidthAtNominal > geometry.widthPt) {
      estimatedFontSize = Math.max(
        1.0,
        Number((geometry.nominalFontSize * (geometry.widthPt / estimatedTextWidthAtNominal)).toFixed(1))
      );
    }
  }

  if (charCount > seriousThreshold) {
    return {
      documentId,
      fieldKey,
      charCount,
      isMultiline: geometry.isMultiline,
      nominalWidthPt: geometry.widthPt,
      estimatedFontSizePt: estimatedFontSize,
      risk: "serious",
      code: "readability-critical-reduction",
      message: geometry.isNarrowSingleLine
        ? `Adres metni çok uzun (${charCount} karakter); PDF şablonundaki dar tek satırda (~${Math.round(geometry.widthPt)} pt) yazı yaklaşık ${estimatedFontSize} puntoya kadar küçülecek ve basımda okunması zorlaşacaktır. Kısaltmanız önerilir.`
        : `Metin alan kapasitesine göre çok uzundur (${charCount} karakter); basımda yazı boyutu ciddi oranda küçülebilir.`,
    };
  }

  if (charCount > possibleThreshold) {
    return {
      documentId,
      fieldKey,
      charCount,
      isMultiline: geometry.isMultiline,
      nominalWidthPt: geometry.widthPt,
      estimatedFontSizePt: estimatedFontSize,
      risk: "possible",
      code: "readability-small-font",
      message: geometry.isNarrowSingleLine
        ? `Adres metni tek satırlı dar alanda (~${Math.round(geometry.widthPt)} pt) küçülebilir (~${estimatedFontSize} pt); standart A4 baskıda küçük çıkabilir.`
        : `Metin uzunluğu nedeniyle yazı boyutu baskıda biraz küçülebilir.`,
    };
  }

  return {
    documentId,
    fieldKey,
    charCount,
    isMultiline: geometry.isMultiline,
    nominalWidthPt: geometry.widthPt,
    estimatedFontSizePt: estimatedFontSize,
    risk: "none",
    code: "readability-ok",
    message: null,
  };
}

/**
 * Üretilmiş gerçek bir PDF ikili tamponunu doğrudan analiz eden test yardımcısı.
 * Çıktıdaki gerçek AcroForm Default Appearance (DA), font boyutu ve metin bütünlüğünü doğrular.
 */
export async function inspectPdfFieldAppearance(
  pdfBytes: Uint8Array,
  fieldKey: string
): Promise<{
  fieldName: string;
  storedValue: string | null;
  storedLength: number;
  defaultAppearance: string | null;
  appearanceFontSizePt: number | null;
  isMultiline: boolean;
  rect: { width: number; height: number };
}> {
  const doc = await PDFDocument.load(pdfBytes);
  const form = doc.getForm();
  const field = form.getTextField(fieldKey);
  const widgets = field.acroField.getWidgets();
  const firstWidget = widgets[0];
  const rectangle = firstWidget ? firstWidget.getRectangle() : { width: 0, height: 0 };
  const da = field.acroField.getDefaultAppearance() ?? firstWidget?.getDefaultAppearance() ?? null;

  let fontSize: number | null = null;
  if (da) {
    const match = da.match(/(?:^|\s)(\d+(?:\.\d+)?)\s+Tf\b/);
    if (match) {
      fontSize = parseFloat(match[1]);
    }
  }

  const storedValue = field.getText() ?? null;

  return {
    fieldName: fieldKey,
    storedValue,
    storedLength: storedValue?.length ?? 0,
    defaultAppearance: da,
    appearanceFontSizePt: fontSize,
    isMultiline: field.isMultiline(),
    rect: {
      width: Number(rectangle.width.toFixed(2)),
      height: Number(rectangle.height.toFixed(2)),
    },
  };
}
