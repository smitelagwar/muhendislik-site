import { PDFDocument, PDFName, PDFString } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

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

// Exact default values from original reference PDF
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

// Exact font size specifications from original PDF's /DA dictionary
const FIELD_FONT_SPECS: Record<keyof BetonDokumData, { size: number }> = {
  tutanak_alt_baslik: { size: 11.0 },
  tarih: { size: 9.5 },
  yer: { size: 9.0 },
  yibf: { size: 9.5 },
  olay_aciklamasi: { size: 10.0 },
  gozlem_notlar: { size: 9.5 },
  laboratuvar: { size: 8.6 },
  muteahhit: { size: 8.6 },
  santiye_sefi: { size: 8.6 },
  yapi_denetim: { size: 8.6 },
};

// In-memory cache for fast interactive typing
let cachedPdfBytes: Uint8Array | null = null;
let cachedFontBytes: Uint8Array | null = null;

async function getPdfTemplateBytes(): Promise<Uint8Array> {
  if (cachedPdfBytes) return cachedPdfBytes;

  if (typeof window !== "undefined") {
    try {
      const response = await fetch("/api/document-template/beton-dokum");
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        cachedPdfBytes = new Uint8Array(arrayBuffer);
        return cachedPdfBytes;
      }
    } catch {
      // ignore
    }

    const directResponse = await fetch("/belgeler/beton-dokum-tutanagi.pdf");
    if (!directResponse.ok) {
      throw new Error(`PDF şablonu yüklenemedi: HTTP ${directResponse.status}`);
    }
    const arrayBuffer = await directResponse.arrayBuffer();
    cachedPdfBytes = new Uint8Array(arrayBuffer);
    return cachedPdfBytes;
  } else {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.join(
      process.cwd(),
      "public",
      "belgeler",
      "beton-dokum-tutanagi.pdf"
    );
    cachedPdfBytes = new Uint8Array(fs.readFileSync(filePath));
    return cachedPdfBytes;
  }
}

async function getFontBytes(): Promise<Uint8Array> {
  if (cachedFontBytes) return cachedFontBytes;

  if (typeof window !== "undefined") {
    // Try Arial-Bold first (matches /FormBold in PDF)
    const response = await fetch("/fonts/Arial-Bold.ttf");
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      cachedFontBytes = new Uint8Array(arrayBuffer);
      return cachedFontBytes;
    }
    // Fallback to Arial Regular
    const regResponse = await fetch("/fonts/Arial-Regular.ttf");
    if (regResponse.ok) {
      const regBuffer = await regResponse.arrayBuffer();
      cachedFontBytes = new Uint8Array(regBuffer);
      return cachedFontBytes;
    }
    // Final fallback to IBMPlexSerif
    const fbResponse = await fetch("/fonts/IBMPlexSerif-Regular.ttf");
    if (!fbResponse.ok) {
      throw new Error("Yazı tipi dosyası yüklenemedi.");
    }
    const fbBuffer = await fbResponse.arrayBuffer();
    cachedFontBytes = new Uint8Array(fbBuffer);
    return cachedFontBytes;
  } else {
    const fs = await import("fs");
    const path = await import("path");
    let fontPath = path.join(process.cwd(), "public", "fonts", "Arial-Bold.ttf");
    if (!fs.existsSync(fontPath)) {
      fontPath = path.join(process.cwd(), "public", "fonts", "Arial-Regular.ttf");
    }
    if (!fs.existsSync(fontPath)) {
      fontPath = path.join(process.cwd(), "public", "fonts", "IBMPlexSerif-Regular.ttf");
    }
    cachedFontBytes = new Uint8Array(fs.readFileSync(fontPath));
    return cachedFontBytes;
  }
}

/**
 * Fills the official Beton Döküm Tutanağı PDF template with exact font sizes,
 * matching the reference PDF default appearance.
 */
export async function generateBetonDokumPdf(
  data: BetonDokumData,
  options: { flatten?: boolean } = { flatten: false }
): Promise<Uint8Array> {
  const [templateBytes, fontBytes] = await Promise.all([
    getPdfTemplateBytes(),
    getFontBytes(),
  ]);

  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);

  const customFont = await pdfDoc.embedFont(fontBytes);
  const form = pdfDoc.getForm();

  for (const [key, spec] of Object.entries(FIELD_FONT_SPECS) as [
    keyof BetonDokumData,
    { size: number },
  ][]) {
    try {
      const field = form.getTextField(key);
      if (field) {
        // Normalize /DA in the field dictionary to exact font and size (prevents auto-scaling blowout)
        field.acroField.dict.set(
          PDFName.of("DA"),
          PDFString.of(`/${customFont.name} ${spec.size} Tf 0 0 0 rg`)
        );
        const val = data[key] ?? "";
        field.setText(val);
      }
    } catch {
      // ignore individual field issues
    }
  }

  try {
    form.updateFieldAppearances(customFont);
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

/**
 * Triggers download of the filled PDF.
 */
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
