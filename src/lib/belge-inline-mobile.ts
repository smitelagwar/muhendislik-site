import type { BelgeDocumentId, InlineFieldDescriptor } from "./belge-studio-inline-field-map";

/** Mobil dokunma hedefi alt sınırı (WCAG / Apple HIG). */
export const BELGE_INLINE_MIN_TOUCH_TARGET = 44;
/** Bir alanın dokunma toleransı için her yönde en fazla genişletme miktarı. */
export const BELGE_INLINE_MAX_TOUCH_EXPAND = 14;
/** Bu mesafeden fazla kayan parmak dokunuş değil, kaydırmadır. */
export const BELGE_INLINE_TAP_MAX_MOVE = 8;
/** Bu süreden uzun basış dokunuş sayılmaz. */
export const BELGE_INLINE_TAP_MAX_MS = 500;
/** Aynı satır kabul edilen üst kenar farkı. */
export const BELGE_INLINE_ROW_TOLERANCE = 4;
/** Alt sayfa tutamacından bu kadar aşağı çekilirse kapatma istenir. */
export const BELGE_INLINE_SHEET_DISMISS_DRAG = 80;

type Rect = { top: number; bottom: number; left: number; right: number };

/**
 * Çerçeveye göre (CSS px) verilen noktadaki düzenlenebilir alanı bulur.
 * Küçük alanlar 44px hedefe tamamlanacak kadar (en fazla 14px) genişletilir.
 * İç isabette en küçük alan, dış isabette kenara en yakın alan seçilir.
 */
export function findInlineFieldAtPoint(
  fields: readonly InlineFieldDescriptor[],
  x: number,
  y: number,
  minTarget = BELGE_INLINE_MIN_TOUCH_TARGET,
  maxExpand = BELGE_INLINE_MAX_TOUCH_EXPAND
): InlineFieldDescriptor | null {
  let best: InlineFieldDescriptor | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const field of fields) {
    if (field.readOnly) continue;
    const r = field.viewportRect;
    const expandX = Math.min(maxExpand, Math.max(0, (minTarget - r.width) / 2));
    const expandY = Math.min(maxExpand, Math.max(0, (minTarget - r.height) / 2));
    if (x < r.left - expandX || x > r.right + expandX || y < r.top - expandY || y > r.bottom + expandY) {
      continue;
    }
    const dx = Math.max(r.left - x, 0, x - r.right);
    const dy = Math.max(r.top - y, 0, y - r.bottom);
    const inside = dx === 0 && dy === 0;
    const score = inside ? (r.width * r.height) / 1e9 : 1 + Math.hypot(dx, dy);
    if (score < bestScore) {
      bestScore = score;
      best = field;
    }
  }
  return best;
}

/** Salt okunur olmayan alanları okuma sırasına (üstten alta, satır içinde soldan sağa) dizer. */
export function orderInlineFields(fields: readonly InlineFieldDescriptor[]): InlineFieldDescriptor[] {
  return fields
    .filter((field) => !field.readOnly)
    .slice()
    .sort((a, b) => {
      const dt = a.viewportRect.top - b.viewportRect.top;
      if (Math.abs(dt) > BELGE_INLINE_ROW_TOLERANCE) return dt;
      return a.viewportRect.left - b.viewportRect.left;
    });
}

/** Yazılım klavyesinin layout viewport altında kapladığı yükseklik (px). Pinch-zoom sırasında 0. */
export function computeKeyboardInset(input: {
  innerHeight: number;
  viewportHeight: number;
  viewportOffsetTop: number;
  viewportScale: number;
}): number {
  if (input.viewportScale > 1.01) return 0;
  const inset = input.innerHeight - (input.viewportHeight + input.viewportOffsetTop);
  return inset > 0 ? Math.round(inset) : 0;
}

/** Alanı görünür bölgeye sokmak için gereken kaydırma farkı (istemci koordinatları). */
export function getInlineFieldRevealDelta(input: {
  field: Rect;
  visible: Rect;
  margin?: number;
}): { dx: number; dy: number } {
  const margin = input.margin ?? 12;
  const top = input.visible.top + margin;
  const bottom = input.visible.bottom - margin;
  const left = input.visible.left + margin;
  const right = input.visible.right - margin;
  const f = input.field;

  let dy = 0;
  if (f.bottom - f.top > bottom - top) dy = f.top - top;
  else if (f.bottom > bottom) dy = f.bottom - bottom;
  else if (f.top < top) dy = f.top - top;

  let dx = 0;
  if (f.right - f.left > right - left) dx = f.left - left;
  else if (f.right > right) dx = f.right - right;
  else if (f.left < left) dx = f.left - left;

  return { dx: Math.round(dx), dy: Math.round(dy) };
}

export type InlineFieldInputProps = {
  inputMode: "text" | "numeric" | "tel";
  autoComplete: string;
  autoCapitalize: "off" | "sentences" | "words";
};

// Sol formdaki inputMode/autoComplete değerlerinin birebir aynasıdır.
const NUMERIC_FIELDS = new Set([
  "beton-dokum-tutanagi:yibf",
  "santiye-sefi-sozlesmesi:ada",
  "santiye-sefi-sozlesmesi:parsel",
  "santiye-sefi-sozlesmesi:yibf",
  "santiye-sefi-istifa-dilekcesi:tc_deger",
  "santiye-sefi-taahhutnamesi:oda_sicil_no",
  "santiye-sefi-taahhutnamesi:tc_kimlik_no",
]);
const TEL_FIELDS = new Set([
  "insaat-ruhsati-dilekcesi:tel",
  "santiye-sefi-istifa-dilekcesi:iletisim_deger",
  "santiye-sefi-taahhutnamesi:telefon",
]);
const NAME_FIELDS = new Set([
  "insaat-ruhsati-dilekcesi:ad_soyad",
  "santiye-sefi-istifa-dilekcesi:ad_soyad",
  "santiye-sefi-sozlesmesi:santiye_sefi_ad",
  "santiye-sefi-taahhutnamesi:santiye_sefi_ad_soyad",
]);
const ADDRESS_FIELDS = new Set([
  "insaat-ruhsati-dilekcesi:adres",
  "santiye-sefi-istifa-dilekcesi:adres_deger",
  "santiye-sefi-taahhutnamesi:adres",
]);

export function getInlineFieldInputProps(documentId: BelgeDocumentId, fieldKey: string): InlineFieldInputProps {
  const key = `${documentId}:${fieldKey}`;
  if (NUMERIC_FIELDS.has(key)) return { inputMode: "numeric", autoComplete: "off", autoCapitalize: "off" };
  if (TEL_FIELDS.has(key)) return { inputMode: "tel", autoComplete: "tel", autoCapitalize: "off" };
  if (NAME_FIELDS.has(key)) return { inputMode: "text", autoComplete: "name", autoCapitalize: "words" };
  if (ADDRESS_FIELDS.has(key)) return { inputMode: "text", autoComplete: "street-address", autoCapitalize: "sentences" };
  return { inputMode: "text", autoComplete: "off", autoCapitalize: "sentences" };
}
