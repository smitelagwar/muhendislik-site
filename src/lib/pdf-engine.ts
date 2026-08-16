import { PDFDocument, PDFName, PDFNumber, PDFString } from "pdf-lib";
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
  yer: "YOZGAT İli AKDAĞMADENİ İlçesi İSTANBULLUOĞLU Mahallesi 666 ada 6 parsel",
  yibf: "1234567",
  olay_aciklamasi:
    "Yukarıda belirtilen şantiye adresinde gerçekleştirilen beton dökümü sırasında, E-Devlet sisteminden kaynaklanan hata nedeniyle; şantiye şefi olarak beton dökümü mahallinde hazır bulunmama rağmen sistem üzerinden gerekli onay işlemi gerçekleştirilememiştir.",
  gozlem_notlar:
    "Beton dökümü gerçekleştirilmiştir. E-Devlet giriş sorunu nedeniyle sistem üzerinden onay işlemi yapılamamıştır.",
  laboratuvar: "MEREN BETON LABORATUVAR HİZMETLERİ SAN. VE TİC. LTD. ŞTİ",
  muteahhit: "ABC İNŞAAT",
  santiye_sefi: "İnş. Müh. Hüseyin GÜNAYDIN",
  yapi_denetim: "XYZ YAPI DENETİM LTD. ŞTİ.",
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
  oda_sicil_no: "123456",
  tc_kimlik_no: "12345678901",
  unvan: "İNŞAAT MÜHENDİSİ",
  adres: "Akdağmadeni / YOZGAT",
  telefon: "0546 414 57 13",
  il_ilce: "YOZGAT/AKDAĞMADENİ",
  ilgili_idare: "AKDAĞMADENİ BELEDİYESİ",
  pafta_ada_parsel: "Pafta: 14, Ada: 666, Parsel: 6",
  yapi_adresi: "İSTANBULLUOĞLU MAH. /AKDAĞMADENİ / YOZGAT",
  yapi_sahibi: "ABC İNŞAAT SAN. VE TİC. LTD. ŞTİ.",
  yapi_sahibi_adresi: "AKDAĞMADENİ/YOZGAT",
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
  santiye_sefi_ad_soyad: { size: 6.7, bold: true, q: 1 },
  unvan_imza: { size: 7.2, bold: false, q: 1 },
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
  hitap_2: "AKDAĞMADENİ",
  ana_paragraf:
    "        Arsa sahibi HSME İNŞAAT adına kayıtlı, Yozgat ili, Akdağmadeni ilçesi,\nYenimahalle Mahallesi, 725 ada 12 parselde bulunan inşaatta üstlenmiş olduğum\nşantiye şefliği görevimden, gördüğüm lüzum üzerine bu tarihten itibaren\nistifa ediyorum.",
  sonuc_cumlesi: "İstifa ettiğimi bildirir, gereğinin yapılmasını dilerim.",
  tarih: "29.12.2025",
  ad_soyad: "HÜSEYİN GÜNAYDIN",
  adres_etiket: "ADRES :",
  adres_deger: "Akdağmadeni / YOZGAT",
  tc_etiket: "T.C. :",
  tc_deger: "65242265136",
  iletisim_etiket: "İletişim :",
  iletisim_deger: "0546 414 57 13",
};

const ISTIFA_FIELD_SPECS: Record<keyof IstifaDilekcesiData, { size: number; bold?: boolean; q?: number }> = {
  hitap_1: { size: 11.8, bold: true, q: 1 },
  hitap_2: { size: 11.8, bold: true, q: 1 },
  // ana_paragraf: regular (not bold), left-aligned as a formal letter body
  ana_paragraf: { size: 9.15, bold: false, q: 0 },
  // sonuc_cumlesi: regular (not bold), left-aligned
  sonuc_cumlesi: { size: 9.15, bold: false, q: 0 },
  tarih: { size: 9.1, bold: true, q: 1 },
  ad_soyad: { size: 10.3, bold: true, q: 1 },
  adres_etiket: { size: 9.0, bold: true, q: 0 },
  adres_deger: { size: 9.0, bold: false, q: 0 },
  tc_etiket: { size: 9.0, bold: true, q: 0 },
  tc_deger: { size: 9.0, bold: false, q: 0 },
  iletisim_etiket: { size: 9.0, bold: false, q: 0 },
  iletisim_deger: { size: 9.0, bold: false, q: 0 },
};

// ==========================================
// SHARED CACHES & UTILS
// ==========================================

const cachedPdfBytes: Record<string, Uint8Array> = {};
let cachedBoldFontBytes: Uint8Array | null = null;
let cachedRegularFontBytes: Uint8Array | null = null;

async function getPdfTemplateBytes(docType: "beton-dokum" | "taahhutname" | "istifa"): Promise<Uint8Array> {
  if (cachedPdfBytes[docType]) return cachedPdfBytes[docType].slice(0);

  const fileMap = {
    "beton-dokum": { api: "/api/document-template/beton-dokum", direct: "/belgeler/beton-dokum-tutanagi.pdf", disk: "beton-dokum-tutanagi.pdf" },
    "taahhutname": { api: "/api/document-template/santiye-sefi-taahhutnamesi", direct: "/belgeler/santiye-sefi-taahhutnamesi.pdf", disk: "santiye-sefi-taahhutnamesi.pdf" },
    "istifa": { api: "/api/document-template/santiye-sefi-istifa-dilekcesi", direct: "/belgeler/santiye-sefi-istifa-dilekcesi.pdf", disk: "santiye-sefi-istifa-dilekcesi.pdf" },
  };

  const config = fileMap[docType];

  if (typeof window !== "undefined") {
    try {
      const response = await fetch(config.api);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        cachedPdfBytes[docType] = new Uint8Array(arrayBuffer);
        return cachedPdfBytes[docType].slice(0);
      }
    } catch {
      // ignore
    }

    const directResponse = await fetch(config.direct);
    if (!directResponse.ok) {
      throw new Error(`PDF şablonu yüklenemedi: HTTP ${directResponse.status}`);
    }
    const arrayBuffer = await directResponse.arrayBuffer();
    cachedPdfBytes[docType] = new Uint8Array(arrayBuffer);
    return cachedPdfBytes[docType].slice(0);
  } else {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.join(process.cwd(), "public", "belgeler", config.disk);
    cachedPdfBytes[docType] = new Uint8Array(fs.readFileSync(filePath));
    return cachedPdfBytes[docType].slice(0);
  }
}

/** Load the Bold variant of the embedded font (Arial-Bold or fallback). */
async function getBoldFontBytes(): Promise<Uint8Array> {
  if (cachedBoldFontBytes) return cachedBoldFontBytes.slice(0);

  if (typeof window !== "undefined") {
    const r = await fetch("/fonts/Arial-Bold.ttf");
    if (r.ok) {
      cachedBoldFontBytes = new Uint8Array(await r.arrayBuffer());
      return cachedBoldFontBytes.slice(0);
    }
    const fb = await fetch("/fonts/IBMPlexSerif-Bold.ttf");
    if (!fb.ok) throw new Error("Bold yazı tipi yüklenemedi.");
    cachedBoldFontBytes = new Uint8Array(await fb.arrayBuffer());
    return cachedBoldFontBytes.slice(0);
  } else {
    const fs = await import("fs");
    const path = await import("path");
    let fontPath = path.join(process.cwd(), "public", "fonts", "Arial-Bold.ttf");
    if (!fs.existsSync(fontPath)) {
      fontPath = path.join(process.cwd(), "public", "fonts", "IBMPlexSerif-Bold.ttf");
    }
    cachedBoldFontBytes = new Uint8Array(fs.readFileSync(fontPath));
    return cachedBoldFontBytes.slice(0);
  }
}

/** Load the Regular (non-bold) variant of the embedded font. */
async function getRegularFontBytes(): Promise<Uint8Array> {
  if (cachedRegularFontBytes) return cachedRegularFontBytes.slice(0);

  if (typeof window !== "undefined") {
    const r = await fetch("/fonts/Arial-Regular.ttf");
    if (r.ok) {
      cachedRegularFontBytes = new Uint8Array(await r.arrayBuffer());
      return cachedRegularFontBytes.slice(0);
    }
    const fb = await fetch("/fonts/IBMPlexSerif-Regular.ttf");
    if (!fb.ok) throw new Error("Regular yazı tipi yüklenemedi.");
    cachedRegularFontBytes = new Uint8Array(await fb.arrayBuffer());
    return cachedRegularFontBytes.slice(0);
  } else {
    const fs = await import("fs");
    const path = await import("path");
    let fontPath = path.join(process.cwd(), "public", "fonts", "Arial-Regular.ttf");
    if (!fs.existsSync(fontPath)) {
      fontPath = path.join(process.cwd(), "public", "fonts", "IBMPlexSerif-Regular.ttf");
    }
    cachedRegularFontBytes = new Uint8Array(fs.readFileSync(fontPath));
    return cachedRegularFontBytes.slice(0);
  }
}

// Generic Form Populator
async function populateForm<T extends Record<string, any>>(
  docType: "beton-dokum" | "taahhutname" | "istifa",
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
      if (!field) continue;

      // Choose the correct font weight for this field
      const useFont = spec.bold === false ? regularFont : boldFont;

      // 1. Override the Default Appearance (DA) — sets font & size for viewer rendering
      field.acroField.dict.set(
        PDFName.of("DA"),
        PDFString.of(`/${useFont.name} ${spec.size} Tf 0 0 0 rg`)
      );

      // 2. Set text alignment (Quadding): 0=left, 1=center, 2=right
      if (spec.q !== undefined) {
        field.acroField.dict.set(PDFName.of("Q"), PDFNumber.of(spec.q));
      }

      // 3. *** CRITICAL: Delete the stale pre-baked AP (Appearance) streams ***
      //    These are the cause of "lekeler" (stains/ghost artifacts) — when a
      //    field has a pre-rendered AP stream, the viewer shows BOTH the old
      //    baked image AND the new dynamic rendering. Deleting AP forces the
      //    viewer to freshly render using our new DA string.
      field.acroField.dict.delete(PDFName.of("AP"));

      // 4. Set the field value
      const val = data[key] ?? "";
      field.setText(val);
    } catch {
      // Silently skip unknown fields
    }
  }

  // Update appearances with the bold font as fallback (covers any fields not in specs)
  try {
    form.updateFieldAppearances(boldFont);
  } catch (err) {
    console.warn("Field appearance notice:", err);
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
  fileName?: string
): Promise<void> {
  if (typeof window === "undefined") return;

  const pdfBytes = await generateBetonDokumPdf(data, { flatten: false });
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const cleanYibf = (data.yibf || "1234567").replace(/[^a-zA-Z0-9_-]/g, "_");
  const cleanDate = (data.tarih || "10.08.2026").replace(/[^a-zA-Z0-9_-]/g, ".");
  const finalFileName =
    fileName || `BETON_DOKUM_TUTANAGI_${cleanYibf}_${cleanDate}.pdf`;

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
  fileName?: string
): Promise<void> {
  if (typeof window === "undefined") return;

  const pdfBytes = await generateTaahhutnamePdf(data, { flatten: false });
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const cleanName = (data.santiye_sefi_ad_soyad || "Santiye_Sefi").replace(/[^a-zA-Z0-9_-]/g, "_");
  const cleanDate = (data.tarih || "16.08.2026").replace(/[^a-zA-Z0-9_-]/g, ".");
  const finalFileName =
    fileName || `SANTIYE_SEFI_TAAHHUTNAMESI_${cleanName}_${cleanDate}.pdf`;

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
  fileName?: string
): Promise<void> {
  if (typeof window === "undefined") return;

  const pdfBytes = await generateIstifaDilekcesiPdf(data, { flatten: false });
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const cleanName = (data.ad_soyad || "Santiye_Sefi").replace(/[^a-zA-Z0-9_-]/g, "_");
  const cleanDate = (data.tarih || "29.12.2025").replace(/[^a-zA-Z0-9_-]/g, ".");
  const finalFileName =
    fileName || `SANTIYE_SEFI_ISTIFA_DILEKCESI_${cleanName}_${cleanDate}.pdf`;

  const link = document.createElement("a");
  link.href = url;
  link.download = finalFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
