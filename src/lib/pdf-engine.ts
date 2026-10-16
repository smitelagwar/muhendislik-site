import { PDFDict, PDFDocument, PDFName, PDFNumber, PDFString } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

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

const BETON_DOKUM_FIELD_SPECS: Record<keyof BetonDokumData, { size: number; bold?: boolean; q?: number }> = {
  tutanak_alt_baslik: { size: 11.0, bold: true, q: 1 },
  tarih: { size: 9.5, bold: false, q: 0 },
  yer: { size: 9.0, bold: false, q: 0 },
  yibf: { size: 9.5, bold: false, q: 0 },
  olay_aciklamasi: { size: 10.0, bold: false, q: 0 },
  gozlem_notlar: { size: 9.5, bold: false, q: 0 },
  laboratuvar: { size: 8.6, bold: false, q: 0 },
  muteahhit: { size: 8.6, bold: false, q: 0 },
  santiye_sefi: { size: 8.6, bold: false, q: 0 },
  yapi_denetim: { size: 8.6, bold: false, q: 0 },
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

const TAAHHUTNAME_FIELD_SPECS: Record<keyof TaahhutnameData, { size: number; bold?: boolean; q?: number }> = {
  oda_sicil_no: { size: 8.0, bold: false, q: 0 },
  tc_kimlik_no: { size: 8.0, bold: false, q: 0 },
  unvan: { size: 7.4, bold: false, q: 0 },
  adres: { size: 7.0, bold: false, q: 0 },
  telefon: { size: 8.0, bold: false, q: 0 },
  il_ilce: { size: 7.5, bold: false, q: 0 },
  ilgili_idare: { size: 7.2, bold: false, q: 0 },
  pafta_ada_parsel: { size: 7.2, bold: false, q: 0 },
  yapi_adresi: { size: 6.8, bold: false, q: 0 },
  yapi_sahibi: { size: 7.2, bold: false, q: 0 },
  yapi_sahibi_adresi: { size: 6.8, bold: false, q: 0 },
  tarih: { size: 7.8, bold: false, q: 0 },
  santiye_sefi_ad_soyad: { size: 7.2, bold: true, q: 2 },
  unvan_imza: { size: 7.2, bold: false, q: 2 },
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

const ISTIFA_FIELD_SPECS: Record<keyof IstifaDilekcesiData, { size: number; bold?: boolean; q?: number }> = {
  hitap_1: { size: 11.8, bold: true, q: 1 },
  hitap_2: { size: 11.8, bold: true, q: 1 },
  // Center every line of the body text inside its page-centered field.
  ana_paragraf: { size: 9.15, bold: false, q: 1 },
  // sonuc_cumlesi: regular (not bold), left-aligned
  sonuc_cumlesi: { size: 9.15, bold: false, q: 0 },
  tarih: { size: 9.1, bold: true, q: 2 },
  unvan: { size: 9.0, bold: false, q: 1 },
  ad_soyad: { size: 10.3, bold: true, q: 1 },
  adres_etiket: { size: 9.0, bold: true, q: 0 },
  adres_deger: { size: 8.0, bold: false, q: 0 },
  tc_etiket: { size: 9.0, bold: true, q: 0 },
  tc_deger: { size: 9.0, bold: false, q: 0 },
  iletisim_etiket: { size: 9.0, bold: false, q: 0 },
  iletisim_deger: { size: 9.0, bold: false, q: 0 },
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

const INSAAT_RUHSATI_FIELD_SPECS: Record<keyof InsaatRuhsatiData, { size: number; bold?: boolean; q?: number }> = {
  tarih: { size: 11.0, bold: true, q: 2 },
  belediye_adi: { size: 12.0, bold: true, q: 1 },
  mudurluk_adi: { size: 11.0, bold: true, q: 1 },
  ana_metin: { size: 11.0, bold: false, q: 0 },
  ad_soyad: { size: 11.0, bold: false, q: 1 },
  unvan: { size: 10.0, bold: false, q: 1 },
  adres: { size: 10.5, bold: false, q: 0 },
  tel: { size: 10.5, bold: false, q: 0 },
};

// ==========================================
// SHARED CACHES & UTILS
// ==========================================

const cachedPdfBytes: Record<string, Uint8Array> = {};
const pdfTemplatePromises = new Map<string, Promise<Uint8Array>>();
let cachedBoldFontBytes: Uint8Array | null = null;
let cachedRegularFontBytes: Uint8Array | null = null;
let boldFontPromise: Promise<Uint8Array> | null = null;
let regularFontPromise: Promise<Uint8Array> | null = null;

const DOCUMENT_RESOURCE_TIMEOUT_MS = 10_000;

function isPdf(bytes: Uint8Array): boolean {
  return bytes.byteLength >= 5 && new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-";
}

async function fetchDocumentResource(url: string): Promise<Uint8Array> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DOCUMENT_RESOURCE_TIMEOUT_MS);
  try {
    const response = await fetch(url, { cache: "no-store", signal: controller.signal });
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
      try {
        const apiBytes = await fetchDocumentResource(config.api);
        if (isPdf(apiBytes)) {
          cachedPdfBytes[docType] = apiBytes;
          return apiBytes;
        }
      } catch {
        // API erişilemezse yerel PDF şablonuna geç.
      }

      const directBytes = await fetchDocumentResource(config.direct);
      if (!isPdf(directBytes)) throw new Error("PDF şablonu geçerli bir PDF dosyası değil.");
      cachedPdfBytes[docType] = directBytes;
      return directBytes;
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

const SOZLESME_FIELD_SPECS: Record<keyof SozlesmeData, { size: number; bold?: boolean; q?: number }> = {
  muteahhit_unvan: { size: 8.5, bold: true, q: 1 },
  santiye_sefi_ad: { size: 8.5, bold: true, q: 1 },
  il: { size: 9.5, bold: true, q: 1 },
  ilce: { size: 9.5, bold: true, q: 1 },
  adres: { size: 7.5, bold: false, q: 1 },
  yibf: { size: 9.5, bold: false, q: 1 },
  pafta: { size: 9.5, bold: false, q: 1 },
  mahalle: { size: 7.8, bold: true, q: 1 },
  ada: { size: 9.5, bold: true, q: 1 },
  parsel: { size: 9.5, bold: true, q: 1 },
  ucret: { size: 9.5, bold: true, q: 1 },
  sozlesme_tarihi: { size: 9.5, bold: true, q: 1 },
  santiye_sefi_imza_adi: { size: 8.2, bold: false, q: 1 },
  muteahhit_imza_unvan: { size: 8.2, bold: false, q: 1 },
};

// Generic Form Populator
async function populateForm<T extends object>(
  docType: "beton-dokum" | "taahhutname" | "istifa" | "insaat-ruhsati" | "sozlesme",
  data: T,
  specs: Record<string, { size: number; bold?: boolean; q?: number }>,
  options: { flatten?: boolean } = { flatten: false }
): Promise<Uint8Array> {
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

  const form = pdfDoc.getForm();

  for (const [key, spec] of Object.entries(specs)) {
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

      const rawValue = (data as Record<string, unknown>)[key];
      const val = typeof rawValue === "string" ? rawValue : "";
      // Arayüz karakter sayısını kilitlemez; AcroForm şablonundaki eski sınırı
      // da kaldır ki uzun metin sessizce reddedilmesin.
      field.acroField.dict.delete(PDFName.of("MaxLen"));
      field.setText(val);

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
        const longestTokenWidth = val
          .split(/\s+/u)
          .reduce(
            (maximum, token) => Math.max(maximum, useFont.widthOfTextAtSize(token, fittedSize)),
            0
          );
        const tokenFitSize = longestTokenWidth > availableWidth
          ? fittedSize * (availableWidth / longestTokenWidth) * 0.99
          : fittedSize;
        const finalSize = Math.max(0.5, Math.min(spec.size, fittedSize, tokenFitSize));
        smallestWidgetFontSize = Math.min(smallestWidgetFontSize, finalSize);
        widget.dict.set(PDFName.of("DA"), makeDefaultAppearance(useFont.name, finalSize));
      }

      // Keep the field-level fallback explicit, then regenerate appearances at
      // the capped sizes (the automatic first pass may otherwise enlarge text).
      field.acroField.dict.set(
        PDFName.of("DA"),
        makeDefaultAppearance(useFont.name, smallestWidgetFontSize)
      );
      field.updateAppearances(useFont);
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

  return await pdfDoc.save();
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
  return populateForm("beton-dokum", data, BETON_DOKUM_FIELD_SPECS, options);
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
  return populateForm("taahhutname", data, TAAHHUTNAME_FIELD_SPECS, options);
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
  return populateForm("istifa", data, ISTIFA_FIELD_SPECS, options);
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
  return populateForm("insaat-ruhsati", data, INSAAT_RUHSATI_FIELD_SPECS, options);
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
  return populateForm("sozlesme", data, SOZLESME_FIELD_SPECS, options);
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
