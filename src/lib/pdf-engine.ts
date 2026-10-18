import { componentsToColor, defaultTextFieldAppearanceProvider, drawTextField, PDFDict, PDFDocument, PDFName, PDFNumber, PDFString, rgb, setTextMatrix, type PDFFont, type PDFTextField } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { getDocumentPdfProfiles, getBlankDocumentData, normalizePdfFieldValue, type BelgeDocumentId } from "./belgeler-pdf-profiles";
import { measurePdfAppearance, type BelgePdfResult, type PdfFieldLayout, type PdfFieldLayouts, type PdfWidgetLayout } from "./belgeler-pdf-layout";

// ==========================================
// 1. BETON DÖKÜM TUTANAĞI
// ==========================================

export interface BetonDokumData {
  tutanak_alt_baslik?: string;
  tarih?: string;
  yer?: string;
  yibf?: string;
  olay_aciklamasi?: string;
  gozlem_notlar?: string;
  laboratuvar?: string;
  muteahhit?: string;
  santiye_sefi?: string;
  yapi_denetim?: string;
}

export const BETON_DOKUM_DEFAULT_DATA: BetonDokumData = {
  tutanak_alt_baslik: "Beton Dökümü Sistem Onay Sorunu",
  tarih: "10.08.2026",
  yer: "ANKARA İli ÇANKAYA İlçesi Örnek Mahallesi 1234 ada 56 parsel",
  yibf: "1234567",
  olay_aciklamasi:
    "Yukarıda belirtilen şantiye adresinde gerçekleştirilen beton dökümü sırasında, E-Devlet sisteminden kaynaklanan hata nedeniyle; şantiye şefi olarak beton dökümü mahallinde hazır bulunmama rağmen sistem üzerinden gerekli onay işlemi gerçekleştirilememiştir.",
  gozlem_notlar:
    "Beton dökümü gerçekleştirilmiştir. E-Devlet giriş sorunu nedeniyle sistem üzerinden onay işlemi yapılamamıştır.",
  laboratuvar: "XYZ BETON LABORATUVARI A.Ş.",
  muteahhit: "ABC İNŞAAT TAAHHÜT LTD. ŞTİ.",
  santiye_sefi: "İnş. Müh. Hüseyin GÜNAYDIN",
  yapi_denetim: "GÜVEN YAPI DENETİM LTD. ŞTİ.",
};


// ==========================================
// 2. ŞANTİYE ŞEFİ TAAHHÜTNAMESİ
// ==========================================

export interface TaahhutnameData {
  oda_sicil_no?: string;
  tc_kimlik_no?: string;
  unvan?: string;
  adres?: string;
  telefon?: string;
  il_ilce?: string;
  ilgili_idare?: string;
  pafta_ada_parsel?: string;
  yapi_adresi?: string;
  yapi_sahibi?: string;
  yapi_sahibi_adresi?: string;
  tarih?: string;
  santiye_sefi_ad_soyad?: string;
  unvan_imza?: string;
}

export const TAAHHUTNAME_DEFAULT_DATA: TaahhutnameData = {
  oda_sicil_no: "12345",
  tc_kimlik_no: "11111111110",
  unvan: "İNŞAAT MÜHENDİSİ",
  adres: "Örnek Mah. Mühendisler Cad. No:1/A Çankaya / ANKARA",
  telefon: "0566 666 66 66",
  il_ilce: "ANKARA / ÇANKAYA",
  ilgili_idare: "ÇANKAYA BELEDİYESİ",
  pafta_ada_parsel: "Pafta: 12, Ada: 345, Parsel: 6",
  yapi_adresi: "Örnek Mah. Yapı Cad. No:10 Çankaya / ANKARA",
  yapi_sahibi: "ABC YAPI İNŞAAT LTD. ŞTİ.",
  yapi_sahibi_adresi: "Çankaya / ANKARA",
  tarih: "16.08.2026",
  santiye_sefi_ad_soyad: "Hüseyin GÜNAYDIN",
  unvan_imza: "İNŞAAT MÜHENDİSİ",
};


// ==========================================
// 3. ŞANTİYE ŞEFİ İSTİFA DİLEKÇESİ
// ==========================================

export interface IstifaDilekcesiData {
  hitap_1?: string;
  hitap_2?: string;
  ana_paragraf?: string;
  sonuc_cumlesi?: string;
  tarih?: string;
  unvan?: string;
  ad_soyad?: string;
  adres_etiket?: string;
  adres_deger?: string;
  tc_etiket?: string;
  tc_deger?: string;
  iletisim_etiket?: string;
  iletisim_deger?: string;
}

export const ISTIFA_DILEKCESI_DEFAULT_DATA: IstifaDilekcesiData = {
  hitap_1: "BELEDİYE BAŞKANLIĞINA",
  hitap_2: "ÇANKAYA",
  ana_paragraf:
    "Arsa sahibi ABC İNŞAAT adına kayıtlı, Ankara ili, Çankaya ilçesi,\nÖrnek Mahallesi, 1234 ada 56 parselde bulunan inşaatta üstlenmiş olduğum\nşantiye şefliği görevimden, gördüğüm lüzum üzerine bu tarihten itibaren\nistifa ediyorum.",
  sonuc_cumlesi: "İstifa ettiğimi bildirir, gereğinin yapılmasını dilerim.",
  tarih: "29.12.2025",
  unvan: "İNŞAAT MÜHENDİSİ",
  ad_soyad: "HÜSEYİN GÜNAYDIN",
  adres_etiket: "ADRES :",
  adres_deger: "Örnek Mah. İnşaat Cad. No:12/4 Çankaya / ANKARA",
  tc_etiket: "T.C. :",
  tc_deger: "11111111110",
  iletisim_etiket: "İletişim :",
  iletisim_deger: "0566 666 66 66",
};


// ==========================================
// 4. İNŞAAT RUHSATI DİLEKÇESİ
// ==========================================

export interface InsaatRuhsatiData {
  tarih?: string;
  belediye_adi?: string;
  mudurluk_adi?: string;
  ana_metin?: string;
  ad_soyad?: string;
  unvan?: string;
  adres?: string;
  tel?: string;
}

export const INSAAT_RUHSATI_DEFAULT_DATA: InsaatRuhsatiData = {
  tarih: "08.12.2023",
  belediye_adi: "ÇANKAYA BELEDİYESİ",
  mudurluk_adi: "İmar ve Şehircilik Müdürlüğüne",
  ana_metin:
    "           İlçenin Örnek Mahallesi 1234 ada, 56 numaralı parselime yeni inşaat yapmak istiyorum, Yapı ruhsatının düzenlenerek tarafıma verilmesini arz ederim.",
  ad_soyad: "Hüseyin GÜNAYDIN",
  unvan: "Yapı Sahibi",
  adres: "Adres: Örnek Mah. Mühendisler Cad. No:24/6\nÇankaya / ANKARA",
  tel: "Tel: 0566 666 66 66",
};


// ==========================================
// SHARED CACHES & UTILS
// ==========================================

const cachedPdfBytes: Record<string, Uint8Array> = {};
const pdfTemplatePromises = new Map<string, Promise<Uint8Array>>();
let cachedBoldFontBytes: Uint8Array | null = null;
let cachedRegularFontBytes: Uint8Array | null = null;
let cachedBoldMetrics: fontkit.Font | null = null;
let cachedRegularMetrics: fontkit.Font | null = null;
let boldFontPromise: Promise<Uint8Array> | null = null;
let regularFontPromise: Promise<Uint8Array> | null = null;

const DOCUMENT_RESOURCE_TIMEOUT_MS = 30_000;

function isPdf(bytes: Uint8Array): boolean {
  return bytes.byteLength >= 5 && new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-";
}

async function fetchDocumentResource(url: string): Promise<Uint8Array> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DOCUMENT_RESOURCE_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Kaynak yüklenemedi: HTTP ${response.status}`);
    return new Uint8Array(await response.arrayBuffer());
  } finally {
    clearTimeout(timeout);
  }
}

function getNodeFileModules() {
  const fs = process.getBuiltinModule("node:fs") as typeof import("node:fs") | undefined;
  const path = process.getBuiltinModule("node:path") as typeof import("node:path") | undefined;
  if (!fs || !path) throw new Error("Yerel PDF kaynağı için Node.js dosya sistemi kullanılamıyor.");
  return { fs, path };
}

async function getPdfTemplateBytes(docType: "beton-dokum" | "taahhutname" | "istifa" | "insaat-ruhsati" | "sozlesme"): Promise<Uint8Array> {
  if (cachedPdfBytes[docType]) return cachedPdfBytes[docType].slice(0);
  const pending = pdfTemplatePromises.get(docType);
  if (pending) return (await pending).slice(0);

  const fileMap = {
    "beton-dokum": { api: "/api/document-template/beton-dokum", direct: "/belgeler/beton-dokum-tutanagi.pdf", disk: "beton-dokum-tutanagi.pdf" },
    "taahhutname": { api: "/api/document-template/santiye-sefi-taahhutnamesi", direct: "/belgeler/santiye-sefi-taahhutnamesi.pdf", disk: "santiye-sefi-taahhutnamesi.pdf" },
    "istifa": { api: "/api/document-template/santiye-sefi-istifa-dilekcesi", direct: "/belgeler/santiye-sefi-istifa-dilekcesi.pdf", disk: "santiye-sefi-istifa-dilekcesi.pdf" },
    "insaat-ruhsati": { api: "/api/document-template/insaat-ruhsati-dilekcesi", direct: "/belgeler/insaat-ruhsati-dilekcesi.pdf", disk: "insaat-ruhsati-dilekcesi.pdf" },
    "sozlesme": {
      api: "/api/document-template/santiye-sefi-sozlesmesi?v=default-location-20260816",
      direct: "/belgeler/santiye-sefi-sozlesmesi.pdf?v=default-location-20260816",
      disk: "santiye-sefi-sozlesmesi.pdf",
    },
  };

  const config = fileMap[docType];
  const promise = (async () => {
    if (typeof window !== "undefined") {
      // 1. Doğrudan CDN üzerinden statik dosya birincil yoldur: sıfır cold start, yüksek hız.
      try {
        const directBytes = await fetchDocumentResource(config.direct);
        if (isPdf(directBytes)) {
          cachedPdfBytes[docType] = directBytes;
          return directBytes;
        }
      } catch (directError) {
        console.warn(`Direct PDF template fetch failed for ${docType}, falling back to API:`, directError);
      }

      // 2. Statik dosya doğrudan gelmediyse API rotasını dene.
      const apiBytes = await fetchDocumentResource(config.api);
      if (!isPdf(apiBytes)) throw new Error("PDF şablonu geçerli bir PDF dosyası değil.");
      cachedPdfBytes[docType] = apiBytes;
      return apiBytes;
    }

    const { fs, path } = getNodeFileModules();
    const filePath = path.join(process.cwd(), "public", "belgeler", config.disk);
    const diskBytes = new Uint8Array(fs.readFileSync(filePath));
    if (!isPdf(diskBytes)) throw new Error("Yerel PDF şablonu geçersiz.");
    cachedPdfBytes[docType] = diskBytes;
    return diskBytes;
  })();

  pdfTemplatePromises.set(docType, promise);
  try {
    return (await promise).slice(0);
  } catch (error) {
    pdfTemplatePromises.delete(docType);
    throw error;
  }
}

/** Load the Bold variant of the embedded font (Arial-Bold or fallback). */
async function getBoldFontBytes(): Promise<Uint8Array> {
  if (cachedBoldFontBytes) return cachedBoldFontBytes.slice(0);
  if (boldFontPromise) return (await boldFontPromise).slice(0);
  boldFontPromise = (async () => {
    if (typeof window !== "undefined") {
      try {
        return await fetchDocumentResource("/fonts/Arial-Bold.ttf");
      } catch {
        return fetchDocumentResource("/fonts/IBMPlexSerif-Bold.ttf");
      }
    }
    const { fs, path } = getNodeFileModules();
    let fontPath = path.join(process.cwd(), "public", "fonts", "Arial-Bold.ttf");
    if (!fs.existsSync(fontPath)) fontPath = path.join(process.cwd(), "public", "fonts", "IBMPlexSerif-Bold.ttf");
    return new Uint8Array(fs.readFileSync(fontPath));
  })();
  try {
    cachedBoldFontBytes = await boldFontPromise;
    try {
      cachedBoldMetrics = fontkit.create(cachedBoldFontBytes);
    } catch {
      // Fontkit hatası durumunda yerinde oluşturulur.
    }
    return cachedBoldFontBytes.slice(0);
  } catch (error) {
    boldFontPromise = null;
    throw error;
  }
}

/** Load the Regular (non-bold) variant of the embedded font. */
async function getRegularFontBytes(): Promise<Uint8Array> {
  if (cachedRegularFontBytes) return cachedRegularFontBytes.slice(0);
  if (regularFontPromise) return (await regularFontPromise).slice(0);
  regularFontPromise = (async () => {
    if (typeof window !== "undefined") {
      try {
        return await fetchDocumentResource("/fonts/Arial-Regular.ttf");
      } catch {
        return fetchDocumentResource("/fonts/IBMPlexSerif-Regular.ttf");
      }
    }
    const { fs, path } = getNodeFileModules();
    let fontPath = path.join(process.cwd(), "public", "fonts", "Arial-Regular.ttf");
    if (!fs.existsSync(fontPath)) fontPath = path.join(process.cwd(), "public", "fonts", "IBMPlexSerif-Regular.ttf");
    return new Uint8Array(fs.readFileSync(fontPath));
  })();
  try {
    cachedRegularFontBytes = await regularFontPromise;
    try {
      cachedRegularMetrics = fontkit.create(cachedRegularFontBytes);
    } catch {
      // Fontkit hatası durumunda yerinde oluşturulur.
    }
    return cachedRegularFontBytes.slice(0);
  } catch (error) {
    regularFontPromise = null;
    throw error;
  }
}

// ==========================================
// 5. ŞANTİYE ŞEFİ HİZMET SÖZLEŞMESİ
// ==========================================

export interface SozlesmeData {
  muteahhit_unvan?: string;
  santiye_sefi_ad?: string;
  il?: string;
  ilce?: string;
  adres?: string;
  yibf?: string;
  pafta?: string;
  mahalle?: string;
  ada?: string;
  parsel?: string;
  ucret?: string;
  sozlesme_tarihi?: string;
  santiye_sefi_imza_adi?: string;
  muteahhit_imza_unvan?: string;
}

export const SOZLESME_DEFAULT_DATA: SozlesmeData = {
  muteahhit_unvan: "ABC İNŞAAT",
  santiye_sefi_ad: "HÜSEYİN GÜNAYDIN",
  il: "YOZGAT",
  ilce: "AKDAĞMADENİ",
  adres: "-",
  yibf: "-",
  pafta: "-",
  mahalle: "EMEK MAHALLESİ",
  ada: "666",
  parsel: "66",
  ucret: "40.000,00 TL",
  sozlesme_tarihi: "01.05.2026",
  santiye_sefi_imza_adi: "Hüseyin GÜNAYDIN",
  muteahhit_imza_unvan: "ABC İNŞAAT",
};


/** Dar satırlarda paragraf satır aralığı uygulanmaz; değer etiketiyle aynı tabana oturur. */
function updateInlineFieldAppearance(field: PDFTextField, font: PDFFont, metrics: fontkit.Font, preferredSize: number, baseline: number, onLayout: (layout: PdfWidgetLayout) => void) {
  let smallestSize = preferredSize;
  field.updateAppearances(font, (textField, widget) => {
    const { width, height } = widget.getRectangle();
    const text = textField.getText() ?? "";
    const inset = 0.1;
    const textWidth = font.widthOfTextAtSize(text, 1);
    const run = metrics.layout(text);
    const bounds = run.glyphs.reduce((result, glyph, index) => ({
      top: Math.max(result.top, glyph.bbox.maxY + run.positions[index].yOffset),
      bottom: Math.max(result.bottom, -glyph.bbox.minY - run.positions[index].yOffset),
    }), { top: 1, bottom: 1 });
    const ascent = bounds.top / metrics.unitsPerEm;
    const descent = bounds.bottom / metrics.unitsPerEm;
    // Türkçe büyük harfler ve aşağı uzanan glifler kutunun içinde kalır.
    const size = Math.min(preferredSize, (width - 2) / Math.max(textWidth, 0.001),
      (height - baseline - inset) / ascent, (baseline - inset) / descent);
    const lineWidth = font.widthOfTextAtSize(text, size);
    const alignment = textField.getAlignment();
    const x = alignment === 1 ? (width - lineWidth) / 2 : alignment === 2 ? width - 1 - lineWidth : 1;
    smallestSize = Math.min(smallestSize, size);
    widget.dict.set(PDFName.of("DA"), makeDefaultAppearance(font.name, size));
    const appearance = widget.getAppearanceCharacteristics();
    const operations = drawTextField({
      x: 0, y: 0, width, height, borderWidth: 0, padding: inset,
      color: componentsToColor(appearance?.getBackgroundColor()),
      borderColor: undefined, textColor: rgb(0, 0, 0), font: font.name, fontSize: size,
      textLines: [{ encoded: font.encodeText(text), x, y: baseline }],
    });
    onLayout(measurePdfAppearance(operations, metrics, widget.getRectangle(), inset));
    return operations;
  });
  field.acroField.dict.set(PDFName.of("DA"), makeDefaultAppearance(font.name, smallestSize));
}

// Generic Form Populator
async function populateForm<T extends object>(
  docType: "beton-dokum" | "taahhutname" | "istifa" | "insaat-ruhsati" | "sozlesme",
  data: T,
  documentId: BelgeDocumentId,
  options: { flatten?: boolean; onlyField?: string } = { flatten: false }
): Promise<BelgePdfResult> {
  const [templateBytes, boldFontBytes, regularFontBytes] = await Promise.all([
    getPdfTemplateBytes(docType),
    getBoldFontBytes(),
    getRegularFontBytes(),
  ]);

  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);

  // Embed both font weights so we can pick per-field
  const boldFont = await pdfDoc.embedFont(boldFontBytes);
  const regularFont = await pdfDoc.embedFont(regularFontBytes);
  const fontMetrics = {
    bold: cachedBoldMetrics ?? fontkit.create(boldFontBytes),
    regular: cachedRegularMetrics ?? fontkit.create(regularFontBytes),
  };
  const specs = getDocumentPdfProfiles(documentId);
  const layouts: PdfFieldLayouts = {};

  const form = pdfDoc.getForm();

  for (const [key, spec] of Object.entries(specs)) {
    if (options.onlyField && options.onlyField !== key) continue;
    try {
      const field = form.getTextField(key);
      if (!field) {
        throw new Error(`PDF şablonunda "${key}" alanı bulunamadı.`);
      }

      // Choose the correct font weight for this field
      const useFont = spec.bold === false ? regularFont : boldFont;

      // 1. Override the Default Appearance (DA) — sets font & size for viewer rendering
      // First render pass asks pdf-lib to calculate the largest size that fits
      // each widget. The second pass caps that result at the template's
      // preferred size so short values keep the intended typography.
      field.acroField.dict.set(PDFName.of("DA"), makeDefaultAppearance(useFont.name, 0));

      // 2. Set text alignment (Quadding): 0=left, 1=center, 2=right
      if (spec.q !== undefined) {
        field.acroField.dict.set(PDFName.of("Q"), PDFNumber.of(spec.q));
      }

      // 3. *** CRITICAL FIX: Delete stale AP + DV from the AcroField dict AND
      //    all widget annotations. Inspection showed AP lives on widget[0], not
      //    on the field dict — so we must iterate widgets explicitly.
      //    DV (Default Value) is also cleared to prevent bleed-through on empty fields.
      field.acroField.dict.delete(PDFName.of("AP"));
      field.acroField.dict.delete(PDFName.of("DV"));

      const widgets = field.acroField.getWidgets();
      for (const widget of widgets) {
        widget.setRectangle(spec.rect);
        widget.dict.delete(PDFName.of("AP"));
        widget.dict.delete(PDFName.of("DV"));
        // Sözleşme şablonu metin alanlarını belgenin doğal bir parçası gibi
        // gösterir. Diğer şablonlarda ise beyaz widget zemini, kaynak PDF'ye
        // gömülü örnek metni örtmek için zorunludur; onu kaldırmak iki metnin
        // üst üste çizilmesine neden olur.
        if (docType === "sozlesme") {
          widget.dict.delete(PDFName.of("Border"));
          const appearance = widget.dict.lookup(PDFName.of("MK"), PDFDict);
          appearance.delete(PDFName.of("BC"));
          appearance.delete(PDFName.of("BG"));
        }
        // Also sync DA and Q to each widget so they render consistently
        widget.dict.set(PDFName.of("DA"), makeDefaultAppearance(useFont.name, 0));
        if (spec.q !== undefined) {
          widget.dict.set(PDFName.of("Q"), PDFNumber.of(spec.q));
        }
      }

      const rawValue = spec.fixedValue ?? (data as Record<string, unknown>)[key];
      const val = normalizePdfFieldValue(rawValue, spec.multiline);
      if (spec.multiline) field.enableMultiline(); else field.disableMultiline();
      // Arayüz karakter sayısını kilitlemez; AcroForm şablonundaki eski sınırı
      // da kaldır ki uzun metin sessizce reddedilmesin.
      field.acroField.dict.delete(PDFName.of("MaxLen"));
      field.setText(val);

      const widgetLayouts: PdfWidgetLayout[] = [];
      const metrics = spec.bold ? fontMetrics.bold : fontMetrics.regular;
      const recordLayout = (widgetLayout: PdfWidgetLayout) => widgetLayouts.push(widgetLayout);
      const saveLayout = () => {
        layouts[key] = {
          documentId, fieldKey: key, value: val, nominalFontSize: spec.size,
          fontSize: Math.min(...widgetLayouts.map((widget) => widget.fontSize)),
          lineCount: widgetLayouts.reduce((count, widget) => count + widget.lineCount, 0),
          overflow: widgetLayouts.some((widget) => widget.overflow), widgets: widgetLayouts,
        };
        field.acroField.dict.set(PDFName.of("DA"), makeDefaultAppearance(useFont.name, layouts[key].fontSize));
      };
      if (spec.renderer === "inline") {
        updateInlineFieldAppearance(field, useFont, metrics, spec.size, spec.baseline - spec.rect.y, recordLayout);
        saveLayout();
        continue;
      }

      // Let pdf-lib wrap multiline values and shrink single-line values against
      // each widget's actual rectangle. The full AcroForm value remains intact.
      field.updateAppearances(useFont);

      let smallestWidgetFontSize = spec.size;
      for (const widget of widgets) {
        const fittedSize = readAppearanceFontSize(widget.getDefaultAppearance(), spec.size);
        const rectangle = widget.getRectangle();
        const rotation = widget.getAppearanceCharacteristics()?.getRotation() ?? 0;
        const quarterTurn = rotation === 90 || rotation === 270;
        const borderWidth = docType === "sozlesme" ? 0 : widget.getBorderStyle()?.getWidth() ?? 0;
        const availableWidth = Math.max(
          1,
          (quarterTurn ? rectangle.height : rectangle.width) - 2 * (borderWidth + 1)
        );
        const longestTokenWidth = (field.isMultiline() ? val.split(/\s+/u) : [val])
          .reduce(
            (maximum, token) => Math.max(maximum, useFont.widthOfTextAtSize(token, fittedSize)),
            0
          );
        const tokenFitSize = longestTokenWidth > availableWidth
          ? fittedSize * (availableWidth / longestTokenWidth) * 0.99
          : fittedSize;
        const finalSize = Math.min(spec.size, fittedSize, tokenFitSize);
        smallestWidgetFontSize = Math.min(smallestWidgetFontSize, finalSize);
        widget.dict.set(PDFName.of("DA"), makeDefaultAppearance(useFont.name, finalSize));
      }

      // Keep the field-level fallback explicit, then regenerate appearances at
      // the capped sizes (the automatic first pass may otherwise enlarge text).
      field.acroField.dict.set(
        PDFName.of("DA"),
        makeDefaultAppearance(useFont.name, smallestWidgetFontSize)
      );
      field.updateAppearances(useFont, (textField, widget, font) => {
        const rectangle = widget.getRectangle();
        const inset = (widget.getBorderStyle()?.getWidth() ?? 0) + 1;
        const render = () => {
          const appearance = defaultTextFieldAppearanceProvider(textField, widget, font);
          let operations = Array.isArray(appearance) ? appearance : appearance.normal;
          if (spec.anchorFirstLine) {
            const first = operations.find((operation) => operation.toString().endsWith(" Tm"));
            const initialY = Number(first?.toString().split(" ")[5]);
            const offset = Number.isFinite(initialY) ? spec.baseline - rectangle.y - initialY : 0;
            operations = operations.map((operation) => {
              const command = operation.toString();
              if (!command.endsWith(" Tm")) return operation;
              const [a, b, c, d, x, y] = command.split(" ").map(Number);
              return setTextMatrix(a, b, c, d, x, y + offset);
            });
          }
          return operations;
        };
        let operations = render();
        let measured = measurePdfAppearance(operations, metrics, rectangle, inset);
        // pdf-lib çok küçük alanlarda 3 pt'de durabilir. Gerçek glif taşması
        // varsa kesmek yerine sürekli ölçekte sığdır; normal çizim değişmez.
        for (let attempt = 0; measured.overflow && measured.glyphBounds && attempt < 8; attempt++) {
          const bounds = measured.glyphBounds;
          const clipBottom = rectangle.y + inset;
          const clipTop = rectangle.y + rectangle.height - inset;
          const availableWidth = rectangle.width - 2 * inset;
          let ratio = bounds.width > availableWidth ? availableWidth / bounds.width * 0.99 : 1;
          if (bounds.y < clipBottom - 0.025) {
            const anchor = spec.anchorFirstLine ? spec.baseline : clipTop;
            ratio = Math.min(ratio, (anchor - clipBottom) / (anchor - bounds.y) * 0.99);
          }
          if (bounds.y + bounds.height > clipTop + 0.025) ratio = Math.min(ratio, 0.9);
          if (ratio < 1) {
            widget.dict.set(PDFName.of("DA"), makeDefaultAppearance(font.name, measured.fontSize * ratio));
            operations = render();
          } else {
            // j gibi sola uzanan glifler için bütün metni küçültmek gerekmez.
            const shiftX = Math.max(0, rectangle.x + inset - bounds.x) -
              Math.max(0, bounds.x + bounds.width - (rectangle.x + rectangle.width - inset));
            operations = operations.map((operation) => {
              const command = operation.toString();
              if (!command.endsWith(" Tm")) return operation;
              const [a, b, c, d, x, y] = command.split(" ").map(Number);
              return setTextMatrix(a, b, c, d, x + shiftX, y);
            });
          }
          measured = measurePdfAppearance(operations, metrics, rectangle, inset);
        }
        recordLayout(measured);
        return operations;
      });
      saveLayout();
    } catch (error) {
      throw new Error(`PDF alanı "${key}" doldurulamadı.`, { cause: error });
    }
  }

  if (options.flatten) {
    try {
      form.flatten();
    } catch {
      // ignore
    }
  }

  return { bytes: options.onlyField ? new Uint8Array() : await pdfDoc.save(), layouts };
}


// ==========================================
function sanitizePdfFilenamePart(value: string | undefined): string {
  return (value ?? "")
    .replace(/[çÇ]/g, (character) => character === "Ç" ? "C" : "c")
    .replace(/[ğĞ]/g, (character) => character === "Ğ" ? "G" : "g")
    .replace(/[ıİ]/g, (character) => character === "İ" ? "I" : "i")
    .replace(/[öÖ]/g, (character) => character === "Ö" ? "O" : "o")
    .replace(/[şŞ]/g, (character) => character === "Ş" ? "S" : "s")
    .replace(/[üÜ]/g, (character) => character === "Ü" ? "U" : "u")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^[_ .-]+|[_ .-]+$/g, "")
    .slice(0, 64);
}

function buildPdfFilename(prefix: string, ...parts: string[]): string {
  const suffix = parts.filter(Boolean).join("_");
  return `${prefix}${suffix ? `_${suffix}` : ""}.pdf`;
}

function readAppearanceFontSize(appearance: string | undefined, fallback: number): number {
  const match = appearance?.match(/(?:^|\s)(\d+(?:\.\d+)?)\s+Tf\b/);
  const parsed = match ? Number(match[1]) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function makeDefaultAppearance(fontName: string, fontSize: number): PDFString {
  return PDFString.of(`/${fontName} ${fontSize} Tf 0 0 0 rg`);
}

// EXPORTED GENERATORS & DOWNLOADERS
// ==========================================

export async function generateBetonDokumPdf(
  data: BetonDokumData,
  options: { flatten?: boolean } = { flatten: false }
): Promise<Uint8Array> {
  return (await populateForm("beton-dokum", data, "beton-dokum-tutanagi", options)).bytes;
}

export async function downloadFilledBetonDokumPdf(
  data: BetonDokumData,
  fileName?: string,
  generatedBytes?: Uint8Array
): Promise<void> {
  if (typeof window === "undefined") return;

  const pdfBytes = generatedBytes ?? await generateBetonDokumPdf(data, { flatten: false });
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const cleanYibf = sanitizePdfFilenamePart(data.yibf);
  const cleanDate = sanitizePdfFilenamePart(data.tarih);
  const finalFileName = fileName || buildPdfFilename("BETON_DOKUM_TUTANAGI", cleanYibf, cleanDate);

  const link = document.createElement("a");
  link.href = url;
  link.download = finalFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export async function generateTaahhutnamePdf(
  data: TaahhutnameData,
  options: { flatten?: boolean } = { flatten: false }
): Promise<Uint8Array> {
  return (await populateForm("taahhutname", data, "santiye-sefi-taahhutnamesi", options)).bytes;
}

export async function downloadFilledTaahhutnamePdf(
  data: TaahhutnameData,
  fileName?: string,
  generatedBytes?: Uint8Array
): Promise<void> {
  if (typeof window === "undefined") return;

  const pdfBytes = generatedBytes ?? await generateTaahhutnamePdf(data, { flatten: false });
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const cleanName = sanitizePdfFilenamePart(data.santiye_sefi_ad_soyad);
  const cleanDate = sanitizePdfFilenamePart(data.tarih);
  const finalFileName = fileName || buildPdfFilename("SANTIYE_SEFI_TAAHHUTNAMESI", cleanName, cleanDate);

  const link = document.createElement("a");
  link.href = url;
  link.download = finalFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export async function generateIstifaDilekcesiPdf(
  data: IstifaDilekcesiData,
  options: { flatten?: boolean } = { flatten: false }
): Promise<Uint8Array> {
  return (await populateForm("istifa", data, "santiye-sefi-istifa-dilekcesi", options)).bytes;
}

export async function downloadFilledIstifaDilekcesiPdf(
  data: IstifaDilekcesiData,
  fileName?: string,
  generatedBytes?: Uint8Array
): Promise<void> {
  if (typeof window === "undefined") return;

  const pdfBytes = generatedBytes ?? await generateIstifaDilekcesiPdf(data, { flatten: false });
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const cleanName = sanitizePdfFilenamePart(data.ad_soyad);
  const cleanDate = sanitizePdfFilenamePart(data.tarih);
  const finalFileName = fileName || buildPdfFilename("SANTIYE_SEFI_ISTIFA_DILEKCESI", cleanName, cleanDate);

  const link = document.createElement("a");
  link.href = url;
  link.download = finalFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export async function generateInsaatRuhsatiPdf(
  data: InsaatRuhsatiData,
  options: { flatten?: boolean } = { flatten: false }
): Promise<Uint8Array> {
  return (await populateForm("insaat-ruhsati", data, "insaat-ruhsati-dilekcesi", options)).bytes;
}

export async function downloadFilledInsaatRuhsatiPdf(
  data: InsaatRuhsatiData,
  fileName?: string,
  generatedBytes?: Uint8Array
): Promise<void> {
  if (typeof window === "undefined") return;

  const pdfBytes = generatedBytes ?? await generateInsaatRuhsatiPdf(data, { flatten: false });
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const cleanName = sanitizePdfFilenamePart(data.ad_soyad);
  const cleanDate = sanitizePdfFilenamePart(data.tarih);
  const finalFileName = fileName || buildPdfFilename("INSAAT_RUHSATI_DILEKCESI", cleanName, cleanDate);

  const link = document.createElement("a");
  link.href = url;
  link.download = finalFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export async function generateSozlesmePdf(
  data: SozlesmeData,
  options: { flatten?: boolean } = { flatten: false }
): Promise<Uint8Array> {
  return (await populateForm("sozlesme", data, "santiye-sefi-sozlesmesi", options)).bytes;
}

export async function downloadFilledSozlesmePdf(
  data: SozlesmeData,
  fileName?: string,
  generatedBytes?: Uint8Array
): Promise<void> {
  if (typeof window === "undefined") return;

  const pdfBytes = generatedBytes ?? await generateSozlesmePdf(data, { flatten: false });
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const cleanName = sanitizePdfFilenamePart(data.santiye_sefi_ad);
  const cleanDate = sanitizePdfFilenamePart(data.sozlesme_tarihi);
  const finalFileName = fileName || buildPdfFilename("SANTIYE_SEFI_SOZLESMESI", cleanName, cleanDate);

  const link = document.createElement("a");
  link.href = url;
  link.download = finalFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// Stüdyo PDF'si ve ölçüm raporu aynı üretimden gelir; eski byte API'leri korunur.
const DOCUMENT_TEMPLATE_TYPES = {
  "beton-dokum-tutanagi": "beton-dokum", "santiye-sefi-taahhutnamesi": "taahhutname",
  "santiye-sefi-istifa-dilekcesi": "istifa", "insaat-ruhsati-dilekcesi": "insaat-ruhsati",
  "santiye-sefi-sozlesmesi": "sozlesme",
} as const;
export async function generateBelgeDocument(id: BelgeDocumentId, data: object): Promise<BelgePdfResult> {
  return populateForm(DOCUMENT_TEMPLATE_TYPES[id], data, id);
}
export const BELGE_DOCUMENT_GENERATORS = Object.fromEntries(
  (Object.keys(DOCUMENT_TEMPLATE_TYPES) as BelgeDocumentId[]).map((id) => [id, (data: object) => generateBelgeDocument(id, data)])
) as Record<BelgeDocumentId, (data: object) => Promise<BelgePdfResult>>;

export async function measureBelgeDraft(id: BelgeDocumentId, fieldKey: string, value: string): Promise<PdfFieldLayout> {
  if (!getDocumentPdfProfiles(id)[fieldKey]) throw new Error("PDF alanı bulunamadı.");
  const result = await populateForm(DOCUMENT_TEMPLATE_TYPES[id], { [fieldKey]: value }, id, { onlyField: fieldKey });
  return result.layouts[fieldKey];
}
export async function generateBlankBelgePdf(id: BelgeDocumentId): Promise<Uint8Array> {
  return (await generateBelgeDocument(id, getBlankDocumentData(id))).bytes;
}

/** Sayfa açıldığında şablon ve fontları arka planda önceden önbelleğe alır. */
export function prewarmBelgeDocument(id: BelgeDocumentId): void {
  if (typeof window === "undefined") return;
  const docType = DOCUMENT_TEMPLATE_TYPES[id];
  if (!docType) return;
  void Promise.all([
    getPdfTemplateBytes(docType),
    getBoldFontBytes(),
    getRegularFontBytes(),
  ]).catch(() => {
    // Arka plan ön-ısıtma hatası sessizce yutulur.
  });
}
