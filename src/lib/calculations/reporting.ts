import { jsPDF } from "jspdf";
import { formatM2Fiyat, formatTL } from "./core";
import type { OfficialCostResultSnapshot } from "./official-unit-costs";
import type { CalculationResultSnapshot } from "./types";

export interface PdfExportSectionRow {
  label: string;
  value: string;
}

export interface PdfExportSection {
  title: string;
  rows: PdfExportSectionRow[];
}

export interface PdfExportSnapshot {
  title: string;
  subtitle: string;
  generatedAt: string;
  sections: PdfExportSection[];
  footnotes: string[];
}

function sanitizePdfText(input: string): string {
  return input
    .replace(/[Çç]/g, (match) => (match === "Ç" ? "C" : "c"))
    .replace(/[Ğğ]/g, (match) => (match === "Ğ" ? "G" : "g"))
    .replace(/[İIı]/g, (match) => (match === "ı" ? "i" : "I"))
    .replace(/[Öö]/g, (match) => (match === "Ö" ? "O" : "o"))
    .replace(/[Şş]/g, (match) => (match === "Ş" ? "S" : "s"))
    .replace(/[Üü]/g, (match) => (match === "Ü" ? "U" : "u"));
}

function addSectionRows(
  pdf: jsPDF,
  title: string,
  rows: PdfExportSectionRow[],
  startY: number
): number {
  let y = startY;
  const pageHeight = pdf.internal.pageSize.getHeight();

  if (y > pageHeight - 28) {
    pdf.addPage();
    y = 20;
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text(sanitizePdfText(title), 14, y);
  y += 6;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);

  rows.forEach((row) => {
    if (y > pageHeight - 18) {
      pdf.addPage();
      y = 20;
    }

    const label = sanitizePdfText(row.label);
    const value = sanitizePdfText(row.value);
    const wrappedLabel = pdf.splitTextToSize(label, 110);
    const wrappedValue = pdf.splitTextToSize(value, 60);
    const lineHeight = Math.max(wrappedLabel.length, wrappedValue.length) * 5;

    pdf.text(wrappedLabel, 14, y);
    pdf.text(wrappedValue, 136, y, { align: "left" });
    y += lineHeight;
  });

  return y + 4;
}

export function buildCalculationPdfSnapshot(
  snapshot: CalculationResultSnapshot,
  officialBaseline?: OfficialCostResultSnapshot | null
): PdfExportSnapshot {
  const summaryRows: PdfExportSectionRow[] = [
    { label: "Yapi turu", value: snapshot.project.yapiTuru },
    { label: "Toplam insaat alani", value: `${snapshot.project.insaatAlani.toLocaleString("tr-TR")} m2` },
    { label: "Kat adedi", value: String(snapshot.project.katAdedi) },
    { label: "Bagimsiz bolum", value: String(snapshot.project.bagimsizBolumSayisi) },
    { label: "Kalite seviyesi", value: snapshot.project.kaliteSeviyesi },
  ];

  const totalsRows: PdfExportSectionRow[] = [
    { label: "Net insaat maliyeti", value: formatTL(snapshot.genelToplam) },
    { label: "Kaba isler", value: `${formatTL(snapshot.kabaIsToplamı)} (${(snapshot.kabaIsPct * 100).toFixed(1)}%)` },
    { label: "Ince isler", value: `${formatTL(snapshot.inceIsToplamı)} (${(snapshot.inceIsPct * 100).toFixed(1)}%)` },
    { label: "Diger giderler", value: `${formatTL(snapshot.digerToplamı)} (${(snapshot.digerPct * 100).toFixed(1)}%)` },
    { label: "Muteahhit kari", value: formatTL(snapshot.muteahhitKariTutari) },
    { label: "KDV", value: formatTL(snapshot.kdvTutari) },
    { label: "Anahtar teslim satis", value: formatTL(snapshot.anahtarTeslimSatisFiyati) },
    { label: "m2 basina maliyet", value: formatM2Fiyat(snapshot.m2BasinaFiyat) },
  ];

  const categoryRows: PdfExportSectionRow[] = snapshot.categories.map((category) => ({
    label: category.label,
    value: formatTL(category.altToplam),
  }));

  const sections: PdfExportSection[] = [
    { title: "Proje ozeti", rows: summaryRows },
    { title: "Toplamlar", rows: totalsRows },
    { title: "Kategori dagilimi", rows: categoryRows },
  ];

  if (officialBaseline) {
    const fark = snapshot.genelToplam - officialBaseline.resmiToplamMaliyet;
    const farkPct =
      officialBaseline.resmiToplamMaliyet > 0
        ? (fark / officialBaseline.resmiToplamMaliyet) * 100
        : 0;

    sections.push({
      title: "Resmi birim maliyet karsilastirmasi",
      rows: [
        { label: "Secilen resmi sinif", value: officialBaseline.row.sinifAdi },
        { label: "Resmi m2 birim maliyeti", value: formatM2Fiyat(officialBaseline.row.m2BirimMaliyet) },
        { label: "Resmi toplam", value: formatTL(officialBaseline.resmiToplamMaliyet) },
        { label: "Detayli hesap farki", value: `${formatTL(fark)} (${farkPct.toFixed(1)}%)` },
      ],
    });
  }

  return {
    title: "Insaat Maliyeti Raporu",
    subtitle: "Detayli kategori dagilimi ve toplu maliyet ozeti",
    generatedAt: new Date().toLocaleString("tr-TR"),
    sections,
    footnotes: [
      "Bu rapor referans amaclidir; piyasa tekliflerinin ve saha kosullarinin yerini almaz.",
      "PDF raporu structured veri uzerinden uretilmistir; ekran goruntusu kullanilmaz.",
    ],
  };
}

export function buildOfficialCostPdfSnapshot(
  result: OfficialCostResultSnapshot
): PdfExportSnapshot {
  return {
    title: "Resmi Birim Maliyet Raporu",
    subtitle: result.row.sinifAdi,
    generatedAt: new Date().toLocaleString("tr-TR"),
    sections: [
      {
        title: "Resmi secim",
        rows: [
          { label: "Yil", value: String(result.selection.yil) },
          { label: "Grup", value: result.row.anaGrupAdi },
          { label: "Sinif", value: result.row.sinifAdi },
          { label: "Resmi m2 birim maliyeti", value: formatM2Fiyat(result.row.m2BirimMaliyet) },
          { label: "Toplam insaat alani", value: `${result.toplamInsaatAlani.toLocaleString("tr-TR")} m2` },
          { label: "Toplam resmi maliyet", value: formatTL(result.resmiToplamMaliyet) },
        ],
      },
      {
        title: "Ornek yapilar",
        rows: result.row.ornekYapilar.map((item, index) => ({
          label: `${index + 1}. ornek`,
          value: item,
        })),
      },
    ],
    footnotes: [
      "Bu deger resmi yaklasik birim maliyettir; piyasa teklifi degildir.",
      "KDV haric, genel gider (%15) ve yuklenici kari (%10) dahil resmi referanstir.",
    ],
  };
}

export function exportPdf(snapshot: PdfExportSnapshot, filename: string): void {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text(sanitizePdfText(snapshot.title), 14, 18);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text(sanitizePdfText(snapshot.subtitle), 14, 25);
  pdf.text(sanitizePdfText(`Uretim tarihi: ${snapshot.generatedAt}`), 14, 31);

  let y = 40;
  snapshot.sections.forEach((section) => {
    y = addSectionRows(pdf, section.title, section.rows, y);
  });

  if (snapshot.footnotes.length > 0) {
    const pageHeight = pdf.internal.pageSize.getHeight();
    if (y > pageHeight - 30) {
      pdf.addPage();
      y = 20;
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("Notlar", 14, y);
    y += 6;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    snapshot.footnotes.forEach((note) => {
      const wrapped = pdf.splitTextToSize(sanitizePdfText(note), 180);
      pdf.text(wrapped, 14, y);
      y += wrapped.length * 4.5;
    });
  }

  pdf.save(filename);
}
