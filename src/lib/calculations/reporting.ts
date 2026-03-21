import { jsPDF } from "jspdf";
import { formatM2Fiyat, formatTL } from "./core";
import type { OfficialCostResultSnapshot } from "./official-unit-costs";
import type { CalculationResultSnapshot } from "./types";

type PdfVariant = "calculation" | "official";
type PdfHighlightTone = "amber" | "blue" | "emerald" | "violet" | "slate";
type RgbColor = [number, number, number];

export interface PdfExportSectionRow {
  label: string;
  value: string;
}

export interface PdfExportSection {
  title: string;
  rows: PdfExportSectionRow[];
}

export interface PdfHighlight {
  label: string;
  value: string;
  helper?: string;
  tone?: PdfHighlightTone;
}

export interface PdfExportSnapshot {
  variant: PdfVariant;
  title: string;
  subtitle: string;
  generatedAt: string;
  highlights: PdfHighlight[];
  sections: PdfExportSection[];
  footnotes: string[];
}

const PAGE_MARGIN = 12;
const PAGE_TOP = 12;
const PAGE_BOTTOM = 14;
const SECTION_GAP = 7;
const COLORS = {
  background: [243, 247, 252] as RgbColor,
  card: [255, 255, 255] as RgbColor,
  border: [217, 226, 239] as RgbColor,
  ink: [15, 23, 42] as RgbColor,
  body: [51, 65, 85] as RgbColor,
  muted: [100, 116, 139] as RgbColor,
  softBlue: [232, 240, 254] as RgbColor,
  softAmber: [255, 243, 217] as RgbColor,
  softEmerald: [223, 248, 235] as RgbColor,
  softViolet: [239, 232, 255] as RgbColor,
  softSlate: [233, 238, 246] as RgbColor,
  accentBlue: [37, 99, 235] as RgbColor,
  accentAmber: [217, 119, 6] as RgbColor,
  accentEmerald: [5, 150, 105] as RgbColor,
  accentViolet: [124, 58, 237] as RgbColor,
  accentSlate: [71, 85, 105] as RgbColor,
  darkBlue: [15, 23, 42] as RgbColor,
  white: [255, 255, 255] as RgbColor,
} as const;

function sanitizePdfText(input: string): string {
  let output = input;
  const replacements: Array<[RegExp, string]> = [
    [/Ã‡/g, "C"],
    [/Ã§/g, "c"],
    [/Ä/g, "G"],
    [/ÄŸ/g, "g"],
    [/Ä°/g, "I"],
    [/Ä±/g, "i"],
    [/Ã–/g, "O"],
    [/Ã¶/g, "o"],
    [/Å/g, "S"],
    [/ÅŸ/g, "s"],
    [/Ãœ/g, "U"],
    [/Ã¼/g, "u"],
    [/Â²/g, "2"],
    [/²/g, "2"],
    [/×/g, "x"],
    [/–|—/g, "-"],
    [/’|‘/g, "'"],
    [/“|”/g, '"'],
    [/İ/g, "I"],
    [/İ/g, "I"],
    [/ı/g, "i"],
    [/Ş/g, "S"],
    [/ş/g, "s"],
    [/Ğ/g, "G"],
    [/ğ/g, "g"],
    [/Ü/g, "U"],
    [/ü/g, "u"],
    [/Ö/g, "O"],
    [/ö/g, "o"],
    [/Ç/g, "C"],
    [/ç/g, "c"],
  ];

  for (const [pattern, replacement] of replacements) {
    output = output.replace(pattern, replacement);
  }

  return output
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getTonePalette(tone: PdfHighlightTone | undefined): {
  fill: RgbColor;
  text: RgbColor;
  accent: RgbColor;
} {
  switch (tone) {
    case "amber":
      return { fill: COLORS.softAmber, text: COLORS.ink, accent: COLORS.accentAmber };
    case "emerald":
      return { fill: COLORS.softEmerald, text: COLORS.ink, accent: COLORS.accentEmerald };
    case "violet":
      return { fill: COLORS.softViolet, text: COLORS.ink, accent: COLORS.accentViolet };
    case "slate":
      return { fill: COLORS.softSlate, text: COLORS.ink, accent: COLORS.accentSlate };
    case "blue":
    default:
      return { fill: COLORS.softBlue, text: COLORS.ink, accent: COLORS.accentBlue };
  }
}

function setFill(pdf: jsPDF, color: RgbColor) {
  pdf.setFillColor(color[0], color[1], color[2]);
}

function setStroke(pdf: jsPDF, color: RgbColor) {
  pdf.setDrawColor(color[0], color[1], color[2]);
}

function setText(pdf: jsPDF, color: RgbColor) {
  pdf.setTextColor(color[0], color[1], color[2]);
}

function paintPageBackground(pdf: jsPDF, pageNumber: number) {
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();

  setFill(pdf, COLORS.background);
  pdf.rect(0, 0, width, height, "F");

  setText(pdf, COLORS.muted);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text(`PAGE ${pageNumber}`, width - PAGE_MARGIN, height - 6, { align: "right" });
}

function drawHero(pdf: jsPDF, snapshot: PdfExportSnapshot): number {
  const width = pdf.internal.pageSize.getWidth() - PAGE_MARGIN * 2;
  const heroY = PAGE_TOP;
  const heroHeight = 40;
  const accent = snapshot.variant === "official" ? COLORS.accentBlue : COLORS.accentAmber;

  setFill(pdf, COLORS.darkBlue);
  pdf.roundedRect(PAGE_MARGIN, heroY, width, heroHeight, 8, 8, "F");

  setFill(pdf, accent);
  pdf.roundedRect(PAGE_MARGIN + 6, heroY + 6, 34, 8, 4, 4, "F");

  setText(pdf, COLORS.white);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.text(snapshot.variant === "official" ? "OFFICIAL REFERENCE" : "CALCULATION REPORT", PAGE_MARGIN + 11, heroY + 11.5);

  pdf.setFontSize(20);
  pdf.text(sanitizePdfText(snapshot.title), PAGE_MARGIN + 6, heroY + 23);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  pdf.text(
    pdf.splitTextToSize(sanitizePdfText(snapshot.subtitle), width - 24),
    PAGE_MARGIN + 6,
    heroY + 30
  );

  setText(pdf, [210, 222, 255]);
  pdf.setFontSize(8.5);
  pdf.text(
    sanitizePdfText(`Generated ${snapshot.generatedAt}`),
    PAGE_MARGIN + width - 6,
    heroY + 11.5,
    { align: "right" }
  );

  return heroY + heroHeight + 8;
}

function drawContinuationHeader(pdf: jsPDF, snapshot: PdfExportSnapshot, pageNumber: number): number {
  paintPageBackground(pdf, pageNumber);

  const width = pdf.internal.pageSize.getWidth() - PAGE_MARGIN * 2;
  const accent = snapshot.variant === "official" ? COLORS.accentBlue : COLORS.accentAmber;

  setFill(pdf, COLORS.darkBlue);
  pdf.roundedRect(PAGE_MARGIN, PAGE_TOP, width, 16, 6, 6, "F");

  setFill(pdf, accent);
  pdf.roundedRect(PAGE_MARGIN + 4, PAGE_TOP + 4, 3, 8, 2, 2, "F");

  setText(pdf, COLORS.white);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text(sanitizePdfText(snapshot.title), PAGE_MARGIN + 11, PAGE_TOP + 10);

  setText(pdf, [210, 222, 255]);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text(
    sanitizePdfText(snapshot.subtitle),
    PAGE_MARGIN + width - 5,
    PAGE_TOP + 10,
    { align: "right" }
  );

  return PAGE_TOP + 22;
}

function drawHighlightCards(pdf: jsPDF, highlights: PdfHighlight[], startY: number): number {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const cardGap = 5;
  const cardWidth = (pageWidth - PAGE_MARGIN * 2 - cardGap) / 2;
  const cardHeight = 23;
  const y = startY;

  highlights.slice(0, 4).forEach((highlight, index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const x = PAGE_MARGIN + col * (cardWidth + cardGap);
    const top = y + row * (cardHeight + cardGap);
    const palette = getTonePalette(highlight.tone);

    setFill(pdf, palette.fill);
    pdf.roundedRect(x, top, cardWidth, cardHeight, 6, 6, "F");

    setFill(pdf, palette.accent);
    pdf.roundedRect(x + 3.5, top + 4, 2.5, cardHeight - 8, 1.5, 1.5, "F");

    setText(pdf, COLORS.muted);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.text(sanitizePdfText(highlight.label.toUpperCase()), x + 9, top + 8);

    setText(pdf, palette.text);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(
      pdf.splitTextToSize(sanitizePdfText(highlight.value), cardWidth - 16),
      x + 9,
      top + 15
    );

    if (highlight.helper) {
      setText(pdf, COLORS.muted);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.text(
        pdf.splitTextToSize(sanitizePdfText(highlight.helper), cardWidth - 16),
        x + 9,
        top + 20
      );
    }
  });

  return y + Math.ceil(Math.min(highlights.length, 4) / 2) * (cardHeight + cardGap);
}

function getRowHeight(pdf: jsPDF, row: PdfExportSectionRow, labelWidth: number, valueWidth: number) {
  const labelLines = pdf.splitTextToSize(sanitizePdfText(row.label), labelWidth);
  const valueLines = pdf.splitTextToSize(sanitizePdfText(row.value), valueWidth);
  const maxLines = Math.max(labelLines.length, valueLines.length);

  return 5 + maxLines * 4.6;
}

function getSectionHeight(pdf: jsPDF, section: PdfExportSection, cardWidth: number) {
  const innerWidth = cardWidth - 18;
  const labelWidth = innerWidth * 0.34;
  const valueWidth = innerWidth - labelWidth - 8;
  let height = 18;

  for (const row of section.rows) {
    height += getRowHeight(pdf, row, labelWidth, valueWidth);
  }

  return height + Math.max(section.rows.length - 1, 0) * 4 + 10;
}

function drawSectionCard(pdf: jsPDF, section: PdfExportSection, y: number, variant: PdfVariant): number {
  const width = pdf.internal.pageSize.getWidth() - PAGE_MARGIN * 2;
  const height = getSectionHeight(pdf, section, width);
  const accent = variant === "official" ? COLORS.accentBlue : COLORS.accentAmber;
  const innerWidth = width - 18;
  const labelWidth = innerWidth * 0.34;
  const valueWidth = innerWidth - labelWidth - 8;

  setFill(pdf, COLORS.card);
  setStroke(pdf, COLORS.border);
  pdf.roundedRect(PAGE_MARGIN, y, width, height, 7, 7, "FD");

  setFill(pdf, accent);
  pdf.roundedRect(PAGE_MARGIN + 6, y + 3, width - 12, 2.5, 1.2, 1.2, "F");

  setText(pdf, COLORS.muted);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.text(sanitizePdfText(section.title.toUpperCase()), PAGE_MARGIN + 9, y + 11);

  let cursorY = y + 18;

  section.rows.forEach((row, index) => {
    const labelLines = pdf.splitTextToSize(sanitizePdfText(row.label), labelWidth);
    const valueLines = pdf.splitTextToSize(sanitizePdfText(row.value), valueWidth);
    const lineCount = Math.max(labelLines.length, valueLines.length);
    const rowHeight = 5 + lineCount * 4.6;

    if (index > 0) {
      setStroke(pdf, COLORS.border);
      pdf.setLineWidth(0.2);
      pdf.line(PAGE_MARGIN + 8, cursorY, PAGE_MARGIN + width - 8, cursorY);
      cursorY += 4;
    }

    setText(pdf, COLORS.muted);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.text(labelLines, PAGE_MARGIN + 9, cursorY + 4.5);

    setText(pdf, COLORS.ink);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.text(valueLines, PAGE_MARGIN + 9 + labelWidth + 8, cursorY + 4.5);

    cursorY += rowHeight;
  });

  return y + height + SECTION_GAP;
}

function drawFootnotes(pdf: jsPDF, footnotes: string[], y: number, variant: PdfVariant) {
  if (footnotes.length === 0) {
    return;
  }

  const width = pdf.internal.pageSize.getWidth() - PAGE_MARGIN * 2;
  const accent = variant === "official" ? COLORS.accentBlue : COLORS.accentAmber;
  let height = 18;

  footnotes.forEach((note) => {
    height += pdf.splitTextToSize(sanitizePdfText(note), width - 18).length * 4.6;
  });

  setFill(pdf, COLORS.card);
  setStroke(pdf, COLORS.border);
  pdf.roundedRect(PAGE_MARGIN, y, width, height, 7, 7, "FD");

  setFill(pdf, accent);
  pdf.roundedRect(PAGE_MARGIN + 5, y + 5, 3, height - 10, 1.5, 1.5, "F");

  setText(pdf, COLORS.ink);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text("NOTES", PAGE_MARGIN + 12, y + 11);

  let cursorY = y + 17;
  footnotes.forEach((note) => {
    const wrapped = pdf.splitTextToSize(sanitizePdfText(note), width - 22);
    setText(pdf, COLORS.body);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.text(wrapped, PAGE_MARGIN + 12, cursorY);
    cursorY += wrapped.length * 4.6 + 2.5;
  });
}

export function buildCalculationPdfSnapshot(
  snapshot: CalculationResultSnapshot,
  officialBaseline?: OfficialCostResultSnapshot | null
): PdfExportSnapshot {
  const summaryRows: PdfExportSectionRow[] = [
    { label: "Yapi turu", value: snapshot.project.yapiTuru },
    {
      label: "Toplam insaat alani",
      value: `${snapshot.project.insaatAlani.toLocaleString("tr-TR")} m2`,
    },
    { label: "Kat adedi", value: String(snapshot.project.katAdedi) },
    { label: "Bagimsiz bolum", value: String(snapshot.project.bagimsizBolumSayisi) },
    { label: "Kalite seviyesi", value: snapshot.project.kaliteSeviyesi },
    { label: "Fiyat veri tarihi", value: snapshot.priceDate },
  ];

  const totalsRows: PdfExportSectionRow[] = [
    { label: "Net insaat maliyeti", value: formatTL(snapshot.genelToplam) },
    {
      label: "Kaba isler",
      value: `${formatTL(snapshot.kabaIsToplamı)} (${(snapshot.kabaIsPct * 100).toFixed(1)}%)`,
    },
    {
      label: "Ince isler",
      value: `${formatTL(snapshot.inceIsToplamı)} (${(snapshot.inceIsPct * 100).toFixed(1)}%)`,
    },
    {
      label: "Diger giderler",
      value: `${formatTL(snapshot.digerToplamı)} (${(snapshot.digerPct * 100).toFixed(1)}%)`,
    },
    { label: "Muteahhit kari", value: formatTL(snapshot.muteahhitKariTutari) },
    { label: "KDV", value: formatTL(snapshot.kdvTutari) },
    { label: "Anahtar teslim satis", value: formatTL(snapshot.anahtarTeslimSatisFiyati) },
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
        {
          label: "Resmi m2 birim maliyeti",
          value: formatM2Fiyat(officialBaseline.row.m2BirimMaliyet),
        },
        { label: "Resmi toplam", value: formatTL(officialBaseline.resmiToplamMaliyet) },
        {
          label: "Detayli hesap farki",
          value: `${formatTL(fark)} (${farkPct.toFixed(1)}%)`,
        },
      ],
    });
  }

  return {
    variant: "calculation",
    title: "Insaat Maliyeti Raporu",
    subtitle: "Detayli kategori dagilimi ve toplu maliyet ozeti",
    generatedAt: new Date().toLocaleString("tr-TR"),
    highlights: [
      {
        label: "Net maliyet",
        value: formatTL(snapshot.genelToplam),
        helper: "Sadece net proje toplamı",
        tone: "amber",
      },
      {
        label: "Anahtar teslim",
        value: formatTL(snapshot.anahtarTeslimSatisFiyati),
        helper: "Kar ve KDV dahil",
        tone: "blue",
      },
      {
        label: "m2 birim",
        value: formatM2Fiyat(snapshot.m2BasinaFiyat),
        helper: `${snapshot.project.insaatAlani.toLocaleString("tr-TR")} m2 proje`,
        tone: "emerald",
      },
      {
        label: "Bolum basi",
        value:
          snapshot.project.bagimsizBolumSayisi > 0
            ? formatTL(snapshot.bolumBasinaFiyat)
            : "Takip disi",
        helper:
          snapshot.project.bagimsizBolumSayisi > 0
            ? `${snapshot.project.bagimsizBolumSayisi} bagimsiz bolum`
            : "Bolum verisi girilmedi",
        tone: "violet",
      },
    ],
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
    variant: "official",
    title: "Resmi Birim Maliyet Raporu",
    subtitle: `${result.row.sinifKodu} / ${result.row.sinifAdi}`,
    generatedAt: new Date().toLocaleString("tr-TR"),
    highlights: [
      {
        label: "Resmi sinif",
        value: result.row.sinifKodu,
        helper: result.row.anaGrupAdi,
        tone: "blue",
      },
      {
        label: "m2 birim maliyeti",
        value: formatM2Fiyat(result.row.m2BirimMaliyet),
        helper: "Resmi teblig referansi",
        tone: "amber",
      },
      {
        label: "Toplam alan",
        value: `${result.toplamInsaatAlani.toLocaleString("tr-TR")} m2`,
        helper: "Kullanici girdisi",
        tone: "emerald",
      },
      {
        label: "Toplam resmi maliyet",
        value: formatTL(result.resmiToplamMaliyet),
        helper: "Alan x resmi m2 birim maliyeti",
        tone: "violet",
      },
    ],
    sections: [
      {
        title: "Resmi secim",
        rows: [
          { label: "Yil", value: String(result.selection.yil) },
          { label: "Grup", value: result.row.anaGrupAdi },
          { label: "Sinif", value: result.row.sinifAdi },
          {
            label: "Resmi m2 birim maliyeti",
            value: formatM2Fiyat(result.row.m2BirimMaliyet),
          },
          {
            label: "Toplam insaat alani",
            value: `${result.toplamInsaatAlani.toLocaleString("tr-TR")} m2`,
          },
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
      {
        title: "Kaynak bilgisi",
        rows: [
          { label: "Teblig", value: result.row.kaynakPdf },
          { label: "Kaynak bolum", value: result.row.kaynakSayfaVeyaBolum },
          { label: "Aciklama", value: result.row.not },
        ],
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

  let pageNumber = 1;
  paintPageBackground(pdf, pageNumber);

  let y = drawHero(pdf, snapshot);
  y = drawHighlightCards(pdf, snapshot.highlights, y);
  y += 4;

  const pageHeight = pdf.internal.pageSize.getHeight();

  snapshot.sections.forEach((section) => {
    const needed = getSectionHeight(pdf, section, pdf.internal.pageSize.getWidth() - PAGE_MARGIN * 2);
    if (y + needed > pageHeight - PAGE_BOTTOM - 28) {
      pdf.addPage();
      pageNumber += 1;
      y = drawContinuationHeader(pdf, snapshot, pageNumber);
    }

    y = drawSectionCard(pdf, section, y, snapshot.variant);
  });

  const notesHeight = snapshot.footnotes.reduce((total, note) => {
    return total + pdf.splitTextToSize(sanitizePdfText(note), pdf.internal.pageSize.getWidth() - PAGE_MARGIN * 2 - 18).length * 4.6;
  }, 24);

  if (y + notesHeight > pageHeight - PAGE_BOTTOM) {
    pdf.addPage();
    pageNumber += 1;
    y = drawContinuationHeader(pdf, snapshot, pageNumber);
  }

  drawFootnotes(pdf, snapshot.footnotes, y, snapshot.variant);
  pdf.save(filename);
}
