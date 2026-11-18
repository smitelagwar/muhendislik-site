/**
 * Hsyncad Structural Reporting - PDF Renderer (P16 / Unified IDE)
 *
 * Two-pass deterministic PDF renderer using jsPDF and IBM Plex Serif font.
 * - Pass 1 & Pass 2 share the exact same layout pass (`dryRun: true` then `false`)
 *   so section start pages and multi-page TOC pagination never drift.
 * - Supports standard P16/P17 layout (15/15/28/276 mm) as well as true ideCAD .tmp
 *   compact metrics (`idecad_compact`: Left=13 mm, Right=11 mm, Top=8 mm, Bottom=15 mm,
 *   5 font tiers [11.3, 9.3, 9.3, 7.6, 7.1] pt).
 * - Supports `{ type: "image" }` blocks, company logos on cover, and deferred
 *   in-bounds TOC link annotations.
 */

import { jsPDF } from "jspdf";
import {
  PDF_SERIF_REGULAR_BASE64,
  PDF_SERIF_BOLD_BASE64
} from "@/lib/calculations/pdf-fonts.generated";
import type {
  ReportDocument,
  ReportSection,
  ReportBlock,
  ReportTable,
  TableRowCell,
  ReportTableCell,
  CheckItem
} from "./report-document";
import { validateReportDocument } from "./report-document";

const FONT_NAME = "IBMPlexSerif";
const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;

export interface RenderPdfOptions {
  layoutMode?: "standard" | "idecad_compact";
  marginLeftMm?: number;
  marginRightMm?: number;
  marginTopMm?: number;
  marginBottomMm?: number;
}

export interface RenderResult {
  pdfBytes: Uint8Array;
  pageCount: number;
  sectionPages: Record<string, number>;
}

interface LayoutMetrics {
  mode: "standard" | "idecad_compact";
  marginLeftMm: number;
  marginRightMm: number;
  contentWidthMm: number;
  marginTopMm: number;
  marginBottomMm: number;
  headerLineY: number;
  headerTextY: number;
  footerLineY: number;
  footerTextY: number;
  sectionTitlePt: number;
  leadPt: number;
  bodyPt: number;
  tablePt: number;
  footnotePt: number;
}

interface TocLinkSpec {
  sourcePage: number;
  x: number;
  y: number;
  w: number;
  h: number;
  targetPage: number;
}

function resolveMetrics(options?: RenderPdfOptions): LayoutMetrics {
  const mode = options?.layoutMode ?? "standard";
  if (mode === "idecad_compact") {
    // True MS1 .tmp geometry (#80 Flag B):
    // Left=13 mm, Right=11 mm, Top=8 mm (running header ends at y=16 mm), Bottom=15 mm (282 mm)
    // 5 font tiers [4.0, 3.3, 3.3, 2.7, 2.5] mm -> [11.3, 9.3, 9.3, 7.6, 7.1] pt
    const marginLeftMm = options?.marginLeftMm ?? 13;
    const marginRightMm = options?.marginRightMm ?? 11;
    const marginTopMm = options?.marginTopMm ?? 18;
    const marginBottomMm = options?.marginBottomMm ?? (PAGE_HEIGHT_MM - 15);
    return {
      mode,
      marginLeftMm,
      marginRightMm,
      contentWidthMm: PAGE_WIDTH_MM - marginLeftMm - marginRightMm, // 186 mm
      marginTopMm,
      marginBottomMm,
      headerTextY: 11,
      headerLineY: 13.5,
      footerLineY: PAGE_HEIGHT_MM - 12.5,
      footerTextY: PAGE_HEIGHT_MM - 8.5,
      sectionTitlePt: 11.3,
      leadPt: 9.3,
      bodyPt: 9.3,
      tablePt: 7.6,
      footnotePt: 7.1
    };
  }

  const marginLeftMm = options?.marginLeftMm ?? 15;
  const marginRightMm = options?.marginRightMm ?? 15;
  const marginTopMm = options?.marginTopMm ?? 28;
  const marginBottomMm = options?.marginBottomMm ?? 276;
  return {
    mode,
    marginLeftMm,
    marginRightMm,
    contentWidthMm: PAGE_WIDTH_MM - marginLeftMm - marginRightMm, // 180 mm
    marginTopMm,
    marginBottomMm,
    headerTextY: 14,
    headerLineY: 18,
    footerLineY: 283,
    footerTextY: 287,
    sectionTitlePt: 12,
    leadPt: 10.5,
    bodyPt: 8.5,
    tablePt: 7.5,
    footnotePt: 7
  };
}

function createConfiguredPdf(title: string): jsPDF {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true
  });

  pdf.addFileToVFS("IBMPlexSerif-Regular.ttf", PDF_SERIF_REGULAR_BASE64);
  pdf.addFont("IBMPlexSerif-Regular.ttf", FONT_NAME, "normal");
  pdf.addFileToVFS("IBMPlexSerif-Bold.ttf", PDF_SERIF_BOLD_BASE64);
  pdf.addFont("IBMPlexSerif-Bold.ttf", FONT_NAME, "bold");
  pdf.setFont(FONT_NAME, "normal");
  pdf.setProperties({
    title,
    creator: "Hsyncad Luna v4 Structural Report Engine"
  });

  return pdf;
}

function normalizeCell(cell: TableRowCell): {
  text: string;
  align: "left" | "center" | "right";
  bold: boolean;
  highlight: boolean;
} {
  if (typeof cell === "object" && cell !== null && "text" in cell) {
    const c = cell as ReportTableCell;
    return {
      text: String(c.text ?? ""),
      align: c.align ?? "left",
      bold: !!c.bold,
      highlight: !!c.highlight
    };
  }
  return {
    text: cell !== undefined && cell !== null ? String(cell) : "-",
    align: "left",
    bold: false,
    highlight: false
  };
}

function computeFittedColumnWidths(
  headers: string[],
  contentWidthMm: number,
  explicitWidths?: number[]
): number[] {
  let widths = explicitWidths && explicitWidths.length === headers.length
    ? [...explicitWidths]
    : headers.map(() => contentWidthMm / headers.length);

  const totalW = widths.reduce((sum, w) => sum + w, 0);
  if (totalW > 0 && Math.abs(totalW - contentWidthMm) > 0.01) {
    const scale = contentWidthMm / totalW;
    widths = widths.map((w) => w * scale);
  }
  return widths;
}

function detectImageFormat(dataUrl: string): "PNG" | "JPEG" | "WEBP" {
  const head = dataUrl.slice(0, 40).toUpperCase();
  if (head.includes("JPEG") || head.includes("JPG")) return "JPEG";
  if (head.includes("WEBP")) return "WEBP";
  return "PNG";
}

class PdfPassRunner {
  private pdf: jsPDF;
  private metrics: LayoutMetrics;
  private currentY: number;
  private currentPage: number = 1;
  private dryRun: boolean;
  private knownSectionPages: Record<string, number>;
  public recordedSectionPages: Record<string, number> = {};
  public pendingTocLinks: TocLinkSpec[] = [];

  constructor(
    pdf: jsPDF,
    metrics: LayoutMetrics,
    dryRun: boolean,
    knownSectionPages: Record<string, number>
  ) {
    this.pdf = pdf;
    this.metrics = metrics;
    this.currentY = metrics.marginTopMm;
    this.dryRun = dryRun;
    this.knownSectionPages = knownSectionPages;
  }

  private ensureSpace(heightMm: number): boolean {
    if (this.currentY + heightMm > this.metrics.marginBottomMm) {
      this.pageBreak();
      return true;
    }
    return false;
  }

  private pageBreak(): void {
    this.pdf.addPage();
    this.currentPage++;
    this.currentY = this.metrics.marginTopMm;
  }

  public runDocument(doc: ReportDocument): void {
    for (let i = 0; i < doc.sections.length; i++) {
      const sec = doc.sections[i];

      if (i > 0 && sec.pageBreakBefore !== false) {
        this.pageBreak();
      }

      this.recordedSectionPages[sec.id] = this.currentPage;

      if (sec.family === "cover") {
        this.renderCover(doc, sec);
        continue;
      }

      if (sec.family === "toc") {
        this.renderToc(doc, sec);
        continue;
      }

      // Section heading
      this.ensureSpace(14);
      if (!this.dryRun) {
        this.pdf.setFont(FONT_NAME, "bold");
        this.pdf.setFontSize(this.metrics.sectionTitlePt);
        this.pdf.setTextColor(20, 35, 60);
        this.pdf.text(sec.title, this.metrics.marginLeftMm, this.currentY);
      }
      this.currentY += 4;
      if (!this.dryRun) {
        this.pdf.setDrawColor(200, 205, 215);
        this.pdf.setLineWidth(0.4);
        this.pdf.line(
          this.metrics.marginLeftMm,
          this.currentY,
          this.metrics.marginLeftMm + this.metrics.contentWidthMm,
          this.currentY
        );
      }
      this.currentY += 6;

      for (const block of sec.blocks) {
        this.renderBlock(block);
      }
    }
  }

  private renderCover(doc: ReportDocument, sec: ReportSection): void {
    const meta = doc.metadata;
    const ml = this.metrics.marginLeftMm;
    const cw = this.metrics.contentWidthMm;
    let y = this.metrics.mode === "idecad_compact" ? 24 : 35;

    if (!this.dryRun && meta.logoDataUrl?.trim().startsWith("data:image/")) {
      try {
        const fmt = detectImageFormat(meta.logoDataUrl);
        this.pdf.addImage(meta.logoDataUrl, fmt, ml + cw - 36, y - 10, 36, 18);
      } catch {
        // Ignore malformed logo bytes cleanly
      }
    }

    if (!this.dryRun) {
      this.pdf.setFont(FONT_NAME, "bold");
      this.pdf.setFontSize(18);
      this.pdf.setTextColor(25, 45, 80);
      this.pdf.text(meta.coverBrandLabel || "HSYNCAD LUNA v4", ml, y);
    }
    y += 6;

    if (!this.dryRun) {
      this.pdf.setFont(FONT_NAME, "normal");
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(110, 115, 125);
      this.pdf.text(
        meta.coverSubBrandLabel || "BAĞIMSIZ BETONARME STATİK HESAP VE METRAJ MOTORU",
        ml,
        y
      );
    }
    y += 10;

    if (!this.dryRun) {
      this.pdf.setDrawColor(40, 80, 150);
      this.pdf.setLineWidth(1.2);
      this.pdf.line(ml, y, ml + cw, y);
    }
    y += 14;

    this.pdf.setFont(FONT_NAME, "bold");
    this.pdf.setFontSize(16);
    const titleLines = this.pdf.splitTextToSize(meta.documentTitle, cw) as string[];
    if (!this.dryRun) {
      this.pdf.setTextColor(20, 25, 35);
      this.pdf.text(titleLines, ml, y);
    }
    y += titleLines.length * 7 + 4;

    this.pdf.setFont(FONT_NAME, "bold");
    this.pdf.setFontSize(13);
    const projLines = this.pdf.splitTextToSize(`PROJE: ${meta.projectName}`, cw) as string[];
    if (!this.dryRun) {
      this.pdf.setTextColor(45, 75, 130);
      this.pdf.text(projLines, ml, y);
    }
    y += projLines.length * 5.8 + 4;

    if (meta.documentSubtitle) {
      this.pdf.setFont(FONT_NAME, "normal");
      this.pdf.setFontSize(10);
      const subLines = this.pdf.splitTextToSize(meta.documentSubtitle, cw) as string[];
      if (!this.dryRun) {
        this.pdf.setTextColor(80, 85, 95);
        this.pdf.text(subLines, ml, y);
      }
      y += subLines.length * 4.5 + 4;
    }

    y += 4;
    this.currentY = y;

    for (const b of sec.blocks) {
      if (b.type === "keyValueGrid") {
        this.currentY = this.renderKeyValueGridAt(b.items, b.title, this.currentY);
        this.currentY += 3;
      } else if (b.type === "callout") {
        this.currentY = this.renderCalloutAt(b.title, b.message, b.tone, this.currentY);
        this.currentY += 4;
      } else if (b.type === "paragraph" || b.type === "image") {
        this.renderBlock(b);
      }
    }

    if (!this.dryRun) {
      this.pdf.setFont(FONT_NAME, "normal");
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(120, 125, 135);
      this.pdf.text(
        `Revizyon: ${meta.revisionId} | Tarih: ${meta.date} | Motor: ${doc.provenance.calculationEngine}`,
        ml,
        Math.min(280, this.metrics.footerTextY)
      );
    }
  }

  private renderToc(doc: ReportDocument, _sec: ReportSection): void {
    const ml = this.metrics.marginLeftMm;
    const cw = this.metrics.contentWidthMm;

    this.ensureSpace(20);
    if (!this.dryRun) {
      this.pdf.setFont(FONT_NAME, "bold");
      this.pdf.setFontSize(14);
      this.pdf.setTextColor(20, 35, 60);
      this.pdf.text(doc.metadata.tocTitle || "İÇİNDEKİLER", ml, this.currentY);
    }
    this.currentY += 4;
    if (!this.dryRun) {
      this.pdf.setDrawColor(200, 205, 215);
      this.pdf.setLineWidth(0.4);
      this.pdf.line(ml, this.currentY, ml + cw, this.currentY);
    }
    this.currentY += 8;

    if (!this.dryRun) {
      this.pdf.setFont(FONT_NAME, "normal");
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(100, 105, 115);
      this.pdf.text(
        doc.metadata.tocHint || "Aşağıdaki bölümlere tıklayarak doğrudan ilgili sayfaya ulaşabilirsiniz:",
        ml,
        this.currentY
      );
    }
    this.currentY += 7;

    const entries = doc.sections.filter((s) => s.family !== "cover" && s.family !== "toc");
    if (entries.length === 0) {
      this.ensureSpace(7);
      if (!this.dryRun) {
        this.pdf.setFont(FONT_NAME, "normal");
        this.pdf.setFontSize(9);
        this.pdf.setTextColor(90, 95, 105);
        this.pdf.text(
          doc.metadata.tocEmptyText || "Seçili ve projede mevcut rapor bölümü bulunamadı.",
          ml,
          this.currentY
        );
      }
      this.currentY += 7;
      return;
    }

    const tocPt = this.metrics.mode === "idecad_compact" ? this.metrics.leadPt : 9.5;
    const rowStep = this.metrics.mode === "idecad_compact" ? 6.0 : 7.0;

    for (const s of entries) {
      this.pdf.setFont(FONT_NAME, "bold");
      this.pdf.setFontSize(tocPt);
      const maxTitleW = Math.max(40, cw - 18);
      const titleLines = this.pdf.splitTextToSize(s.title, maxTitleW) as string[];
      const rowHeight = Math.max(rowStep, titleLines.length * 4.2 + 2.2);

      this.ensureSpace(rowHeight);

      const pageNum = this.knownSectionPages[s.id] || 1;
      const pageStr = `${pageNum}`;
      const rowTopY = this.currentY;

      if (!this.dryRun) {
        this.pdf.setFont(FONT_NAME, "bold");
        this.pdf.setFontSize(tocPt);
        this.pdf.setTextColor(30, 50, 90);
        for (let l = 0; l < titleLines.length; l++) {
          this.pdf.text(titleLines[l], ml, rowTopY + l * 4.2);
        }

        const lastLineY = rowTopY + (titleLines.length - 1) * 4.2;
        const lastTitleW = this.pdf.getTextWidth(titleLines[titleLines.length - 1] || "");
        const pageStrWidth = this.pdf.getTextWidth(pageStr);
        const pageX = ml + cw - pageStrWidth;
        this.pdf.text(pageStr, pageX, lastLineY);

        const dotsStart = ml + lastTitleW + 3;
        const dotsEnd = pageX - 3;
        if (dotsEnd > dotsStart) {
          this.pdf.setFont(FONT_NAME, "normal");
          this.pdf.setTextColor(160, 165, 175);
          let dotX = dotsStart;
          while (dotX < dotsEnd) {
            this.pdf.text(".", dotX, lastLineY);
            dotX += 2.5;
          }
        }

        this.pendingTocLinks.push({
          sourcePage: this.currentPage,
          x: ml,
          y: rowTopY - 3.8,
          w: cw,
          h: Math.max(4.8, rowHeight - 1.2),
          targetPage: pageNum
        });
      }

      this.currentY += rowHeight;
    }
  }

  private renderBlock(block: ReportBlock): void {
    switch (block.type) {
      case "paragraph": {
        const p = block.paragraph;
        const isLead = p.variant === "lead";
        const pt = isLead ? this.metrics.leadPt : this.metrics.bodyPt;
        const lineStep = this.metrics.mode === "idecad_compact" ? 3.8 : 4.3;
        this.pdf.setFont(FONT_NAME, isLead ? "bold" : "normal");
        this.pdf.setFontSize(pt);
        const lines = this.pdf.splitTextToSize(p.text, this.metrics.contentWidthMm) as string[];
        const height = lines.length * lineStep + 3;
        this.ensureSpace(height);
        if (!this.dryRun) {
          this.pdf.setTextColor(p.variant === "disclaimer" ? 100 : p.variant === "warning" ? 140 : 40);
          this.pdf.text(lines, this.metrics.marginLeftMm, this.currentY);
        }
        this.currentY += height;
        break;
      }
      case "keyValueGrid": {
        this.currentY = this.renderKeyValueGridAt(block.items, block.title, this.currentY);
        break;
      }
      case "callout": {
        this.currentY = this.renderCalloutAt(block.title, block.message, block.tone, this.currentY);
        break;
      }
      case "checkList": {
        this.renderCheckList(block.checks, block.title);
        break;
      }
      case "table": {
        this.renderTable(block.table);
        break;
      }
      case "image": {
        this.renderImage(block);
        break;
      }
    }
  }

  private renderImage(block: Extract<ReportBlock, { type: "image" }>): void {
    const ml = this.metrics.marginLeftMm;
    const cw = this.metrics.contentWidthMm;
    let drawW = block.widthMm;
    let drawH = block.heightMm;
    if (drawW > cw) {
      const scale = cw / drawW;
      drawW = cw;
      drawH *= scale;
    }

    const captionLines = block.caption
      ? (this.pdf.splitTextToSize(block.caption, cw) as string[])
      : [];
    const captionH = captionLines.length > 0 ? captionLines.length * 3.8 + 3 : 0;
    const totalH = drawH + captionH + 3;

    this.ensureSpace(totalH);

    let x = ml;
    if (block.align === "center") {
      x = ml + (cw - drawW) / 2;
    } else if (block.align === "right") {
      x = ml + cw - drawW;
    }

    if (!this.dryRun) {
      try {
        const fmt = detectImageFormat(block.dataUrl);
        this.pdf.addImage(block.dataUrl, fmt, x, this.currentY, drawW, drawH);
      } catch {
        this.pdf.setDrawColor(190, 195, 205);
        this.pdf.rect(x, this.currentY, drawW, drawH);
        this.pdf.setFont(FONT_NAME, "normal");
        this.pdf.setFontSize(this.metrics.footnotePt);
        this.pdf.setTextColor(120, 125, 135);
        this.pdf.text("Görsel yüklenemedi", x + 3, this.currentY + drawH / 2);
      }
    }

    this.currentY += drawH + 2;
    if (captionLines.length > 0) {
      if (!this.dryRun) {
        this.pdf.setFont(FONT_NAME, "normal");
        this.pdf.setFontSize(this.metrics.footnotePt);
        this.pdf.setTextColor(95, 100, 110);
        this.pdf.text(captionLines, ml, this.currentY + 2);
      }
      this.currentY += captionH;
    }
    this.currentY += 1;
  }

  private renderKeyValueGridAt(
    items: { key: string; value: string | number }[],
    title: string | undefined,
    startY: number
  ): number {
    const ml = this.metrics.marginLeftMm;
    const cw = this.metrics.contentWidthMm;
    this.currentY = startY;

    if (title) {
      this.ensureSpace(12);
      if (!this.dryRun) {
        this.pdf.setFont(FONT_NAME, "bold");
        this.pdf.setFontSize(9);
        this.pdf.setTextColor(70, 75, 85);
        this.pdf.text(title, ml, this.currentY);
      }
      this.currentY += 5.5;
    }

    const colW = cw / 2;

    this.pdf.setFont(FONT_NAME, "bold");
    this.pdf.setFontSize(8);
    let maxKeyW1 = 30;
    let maxKeyW2 = 30;
    for (let i = 0; i < items.length; i += 2) {
      const kw1 = this.pdf.getTextWidth(`${items[i].key}:`);
      if (kw1 > maxKeyW1) maxKeyW1 = kw1;
      if (items[i + 1]) {
        const kw2 = this.pdf.getTextWidth(`${items[i + 1].key}:`);
        if (kw2 > maxKeyW2) maxKeyW2 = kw2;
      }
    }
    const valOffset1 = maxKeyW1 + 3;
    const valOffset2 = maxKeyW2 + 3;
    const maxValW1 = Math.max(25, colW - valOffset1 - 2);
    const maxValW2 = Math.max(25, colW - valOffset2 - 2);

    for (let i = 0; i < items.length; i += 2) {
      const item1 = items[i];
      const item2 = items[i + 1];

      this.pdf.setFont(FONT_NAME, "normal");
      this.pdf.setFontSize(8);
      const val1Lines = this.pdf.splitTextToSize(String(item1.value), maxValW1) as string[];
      const val2Lines = item2 ? (this.pdf.splitTextToSize(String(item2.value), maxValW2) as string[]) : [];
      const lineCount = Math.max(1, val1Lines.length, val2Lines.length);
      const rowH = Math.max(5.2, lineCount * 3.8 + 1.4);

      this.ensureSpace(rowH + 1);

      if (!this.dryRun) {
        this.pdf.setFont(FONT_NAME, "bold");
        this.pdf.setFontSize(8);
        this.pdf.setTextColor(80, 85, 95);
        this.pdf.text(`${item1.key}:`, ml, this.currentY);
        this.pdf.setFont(FONT_NAME, "normal");
        this.pdf.setTextColor(25, 30, 40);
        for (let l = 0; l < val1Lines.length; l++) {
          this.pdf.text(val1Lines[l], ml + valOffset1, this.currentY + l * 3.8);
        }

        if (item2) {
          this.pdf.setFont(FONT_NAME, "bold");
          this.pdf.setTextColor(80, 85, 95);
          this.pdf.text(`${item2.key}:`, ml + colW, this.currentY);
          this.pdf.setFont(FONT_NAME, "normal");
          this.pdf.setTextColor(25, 30, 40);
          for (let l = 0; l < val2Lines.length; l++) {
            this.pdf.text(val2Lines[l], ml + colW + valOffset2, this.currentY + l * 3.8);
          }
        }
      }

      this.currentY += rowH;
    }
    return this.currentY + 2;
  }

  private renderCalloutAt(
    title: string | undefined,
    message: string,
    tone: "info" | "warning" | "error" | "neutral",
    startY: number
  ): number {
    const ml = this.metrics.marginLeftMm;
    const cw = this.metrics.contentWidthMm;
    this.currentY = startY;

    this.pdf.setFont(FONT_NAME, "normal");
    this.pdf.setFontSize(8.2);
    const lines = this.pdf.splitTextToSize(message, cw - 10) as string[];
    const boxH = (title ? 6 : 0) + lines.length * 3.8 + 6;

    this.ensureSpace(boxH + 2);
    const y = this.currentY;

    if (!this.dryRun) {
      let fill = [245, 247, 250];
      let stroke = [210, 215, 225];
      let textCol = [30, 35, 45];
      if (tone === "warning") {
        fill = [255, 251, 235];
        stroke = [245, 190, 80];
        textCol = [120, 70, 10];
      } else if (tone === "error") {
        fill = [254, 242, 242];
        stroke = [240, 110, 110];
        textCol = [150, 20, 20];
      }

      this.pdf.setFillColor(fill[0], fill[1], fill[2]);
      this.pdf.setDrawColor(stroke[0], stroke[1], stroke[2]);
      this.pdf.setLineWidth(0.4);
      this.pdf.roundedRect(ml, y, cw, boxH, 1.5, 1.5, "FD");

      let textY = y + 4.5;
      if (title) {
        this.pdf.setFont(FONT_NAME, "bold");
        this.pdf.setFontSize(8.5);
        this.pdf.setTextColor(textCol[0], textCol[1], textCol[2]);
        this.pdf.text(title, ml + 5, textY);
        textY += 4.5;
      }

      this.pdf.setFont(FONT_NAME, "normal");
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(textCol[0], textCol[1], textCol[2]);
      this.pdf.text(lines, ml + 5, textY);
    }

    this.currentY = y + boxH + 4;
    return this.currentY;
  }

  private renderCheckList(checks: CheckItem[], title?: string): void {
    const ml = this.metrics.marginLeftMm;
    const scale = this.metrics.contentWidthMm / 180;
    const colW = [26, 68, 30, 30, 26].map((w) => w * scale);

    if (title) {
      this.ensureSpace(10);
      if (!this.dryRun) {
        this.pdf.setFont(FONT_NAME, "bold");
        this.pdf.setFontSize(9.5);
        this.pdf.setTextColor(30, 45, 75);
        this.pdf.text(title, ml, this.currentY);
      }
      this.currentY += 5;
    }

    const renderChecklistHeader = () => {
      if (!this.dryRun) {
        this.renderRowBackground(this.currentY, 6, [238, 242, 248]);
        this.pdf.setFont(FONT_NAME, "bold");
        this.pdf.setFontSize(7.5);
        this.pdf.setTextColor(40, 50, 70);

        let hx = ml;
        const chkHeaders = ["Norm Maddesi", "Tahkik Açıklaması", "Mevcut Değer", "Sınır Değer", "Sonuç"];
        for (let c = 0; c < chkHeaders.length; c++) {
          this.pdf.text(chkHeaders[c], hx + 1.5, this.currentY + 4.2);
          hx += colW[c];
        }
      }
      this.currentY += 6.5;
    };

    this.ensureSpace(12);
    renderChecklistHeader();

    for (const chk of checks) {
      if (this.currentY + 6.5 > this.metrics.marginBottomMm) {
        this.pageBreak();
        renderChecklistHeader();
      }

      if (!this.dryRun) {
        let cx = ml;
        this.pdf.setFont(FONT_NAME, "normal");
        this.pdf.setFontSize(7.5);
        this.pdf.setTextColor(30, 35, 45);

        this.pdf.text(chk.clause, cx + 1.5, this.currentY + 4);
        cx += colW[0];

        const descLines = this.pdf.splitTextToSize(chk.description, colW[1] - 3) as string[];
        this.pdf.text(descLines[0] || "", cx + 1.5, this.currentY + 4);
        cx += colW[1];

        this.pdf.text(String(chk.observed), cx + 1.5, this.currentY + 4);
        cx += colW[2];

        this.pdf.text(String(chk.limit), cx + 1.5, this.currentY + 4);
        cx += colW[3];

        this.pdf.setFont(FONT_NAME, "bold");
        if (chk.status === "pass") {
          this.pdf.setTextColor(20, 130, 40);
          this.pdf.text("PASS", cx + 1.5, this.currentY + 4);
        } else if (chk.status === "fail") {
          this.pdf.setTextColor(190, 25, 25);
          this.pdf.text("FAIL", cx + 1.5, this.currentY + 4);
        } else if (chk.status === "unsupported") {
          this.pdf.setTextColor(170, 100, 10);
          this.pdf.text("KAPSAM DIŞI", cx + 1.5, this.currentY + 4);
        } else {
          this.pdf.setTextColor(90, 95, 105);
          this.pdf.text("İNCELEME", cx + 1.5, this.currentY + 4);
        }
      }

      this.currentY += 5.5;
    }
    this.currentY += 4;
  }

  private renderTable(table: ReportTable): void {
    const ml = this.metrics.marginLeftMm;
    const cw = this.metrics.contentWidthMm;
    const compact = !!table.compact || this.metrics.mode === "idecad_compact";
    const cellPt = table.compact ? this.metrics.footnotePt : this.metrics.tablePt;
    const lineStep = table.compact ? 3.1 : 3.6;
    const minRowH = table.compact ? 4.4 : 5.2;
    const headerH = table.compact ? 5.6 : 6.8;

    if (table.title) {
      this.ensureSpace(table.compact ? 11 : 14);
      if (!this.dryRun) {
        this.pdf.setFont(FONT_NAME, "bold");
        this.pdf.setFontSize(table.compact ? 8.2 : 9);
        this.pdf.setTextColor(30, 45, 75);
        this.pdf.text(table.title, ml, this.currentY);
      }
      this.currentY += table.compact ? 4.2 : 5;
    } else {
      this.ensureSpace(12);
    }

    const colWidths = computeFittedColumnWidths(table.headers, cw, table.columnWidths);

    const renderHeader = () => {
      if (!this.dryRun) {
        this.renderRowBackground(this.currentY, headerH - 0.3, [235, 240, 247]);
        if (compact) {
          this.pdf.setDrawColor(180, 188, 200);
          this.pdf.setLineWidth(0.25);
          this.pdf.line(ml, this.currentY, ml + cw, this.currentY);
          this.pdf.line(ml, this.currentY + headerH - 0.3, ml + cw, this.currentY + headerH - 0.3);
        }
        this.pdf.setFont(FONT_NAME, "bold");
        this.pdf.setFontSize(cellPt);
        this.pdf.setTextColor(30, 45, 70);

        let x = ml;
        const baseline = this.currentY + (table.compact ? 3.8 : 4.5);
        for (let c = 0; c < table.headers.length; c++) {
          const align = table.columnAlignments ? table.columnAlignments[c] : "left";
          const w = colWidths[c];
          const text = table.headers[c];
          if (align === "right") {
            const tw = this.pdf.getTextWidth(text);
            this.pdf.text(text, x + w - tw - 1.2, baseline);
          } else if (align === "center") {
            const tw = this.pdf.getTextWidth(text);
            this.pdf.text(text, x + (w - tw) / 2, baseline);
          } else {
            this.pdf.text(text, x + 1.2, baseline);
          }
          x += w;
        }
      }
      this.currentY += headerH;
    };

    renderHeader();

    let rowIndex = 0;
    for (const row of table.rows) {
      rowIndex++;
      let maxLines = 1;
      this.pdf.setFontSize(cellPt);
      const cellsNormalized = row.map((cell, cIdx) => {
        const norm = normalizeCell(cell);
        const w = colWidths[cIdx] || 20;
        const lines = this.pdf.splitTextToSize(norm.text, Math.max(4, w - 2.4)) as string[];
        if (lines.length > maxLines) maxLines = lines.length;
        return { norm, lines, w };
      });

      const rowH = Math.max(minRowH, maxLines * lineStep + (table.compact ? 1.2 : 1.8));

      if (this.currentY + rowH > this.metrics.marginBottomMm) {
        this.pageBreak();
        renderHeader();
      }

      if (!this.dryRun) {
        if (rowIndex % 2 === 0) {
          this.renderRowBackground(this.currentY, rowH, [250, 251, 253]);
        }

        let x = ml;
        for (let c = 0; c < cellsNormalized.length; c++) {
          const { norm, lines, w } = cellsNormalized[c];
          const align = table.columnAlignments ? table.columnAlignments[c] : norm.align;

          this.pdf.setFont(FONT_NAME, norm.bold ? "bold" : "normal");
          this.pdf.setFontSize(cellPt);

          if (norm.highlight) {
            this.pdf.setTextColor(200, 30, 30);
          } else {
            this.pdf.setTextColor(30, 35, 45);
          }

          let lineY = this.currentY + (table.compact ? 3.2 : 3.8);
          for (const line of lines) {
            if (align === "right") {
              const tw = this.pdf.getTextWidth(line);
              this.pdf.text(line, x + w - tw - 1.2, lineY);
            } else if (align === "center") {
              const tw = this.pdf.getTextWidth(line);
              this.pdf.text(line, x + (w - tw) / 2, lineY);
            } else {
              this.pdf.text(line, x + 1.2, lineY);
            }
            lineY += lineStep;
          }

          x += w;
        }
      }

      this.currentY += rowH;
    }

    if (table.footnote) {
      this.ensureSpace(5);
      if (!this.dryRun) {
        this.pdf.setFont(FONT_NAME, "normal");
        this.pdf.setFontSize(this.metrics.footnotePt);
        this.pdf.setTextColor(110, 115, 125);
        this.pdf.text(`* ${table.footnote}`, ml, this.currentY + 3.5);
      }
      this.currentY += 5;
    }

    this.currentY += table.compact ? 2.5 : 4;
  }

  private renderRowBackground(y: number, h: number, rgb: [number, number, number]): void {
    this.pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
    this.pdf.rect(this.metrics.marginLeftMm, y, this.metrics.contentWidthMm, h, "F");
  }

  public applyDeferredTocLinks(totalPages: number): void {
    for (const lnk of this.pendingTocLinks) {
      if (lnk.sourcePage < 1 || lnk.sourcePage > totalPages) continue;
      if (lnk.targetPage < 1 || lnk.targetPage > totalPages) continue;
      this.pdf.setPage(lnk.sourcePage);
      this.pdf.link(lnk.x, lnk.y, lnk.w, lnk.h, { pageNumber: lnk.targetPage });
    }
  }

  public decorateHeadersAndFooters(doc: ReportDocument, totalPages: number): void {
    const meta = doc.metadata;
    const ml = this.metrics.marginLeftMm;
    const cw = this.metrics.contentWidthMm;

    for (let p = 1; p <= totalPages; p++) {
      this.pdf.setPage(p);

      if (p === 1 && doc.sections[0]?.family === "cover") {
        continue;
      }

      this.pdf.setFont(FONT_NAME, "bold");
      this.pdf.setFontSize(7.5);
      this.pdf.setTextColor(80, 90, 110);
      this.pdf.text(
        meta.runningHeaderLeft || "Hsyncad - TASLAK / MÜHENDİS İNCELEMESİ GEREKLİ",
        ml,
        this.metrics.headerTextY
      );

      this.pdf.setFont(FONT_NAME, "normal");
      this.pdf.setFontSize(7);
      this.pdf.setTextColor(120, 125, 135);
      const projText = meta.projectName.length > 50 ? meta.projectName.slice(0, 47) + "..." : meta.projectName;
      const projW = this.pdf.getTextWidth(projText);
      this.pdf.text(projText, ml + cw - projW, this.metrics.headerTextY);

      this.pdf.setDrawColor(215, 220, 230);
      this.pdf.setLineWidth(0.3);
      this.pdf.line(ml, this.metrics.headerLineY, ml + cw, this.metrics.headerLineY);
      this.pdf.line(ml, this.metrics.footerLineY, ml + cw, this.metrics.footerLineY);

      this.pdf.setFont(FONT_NAME, "normal");
      this.pdf.setFontSize(7);
      this.pdf.setTextColor(120, 125, 135);
      const stdText = meta.runningFooterStandardLabel || meta.standards[0] || "TS 500";
      this.pdf.text(
        `Revizyon: ${meta.revisionId} | Standart: ${stdText}`,
        ml,
        this.metrics.footerTextY
      );

      const pageText = `Sayfa ${p} / ${totalPages}`;
      const pageW = this.pdf.getTextWidth(pageText);
      this.pdf.text(pageText, ml + cw - pageW, this.metrics.footerTextY);
    }
  }
}

/**
 * Main export: Renders a ReportDocument to PDF bytes using unified two-pass pagination.
 */
export function renderReportDocumentToPdf(
  doc: ReportDocument,
  options?: RenderPdfOptions
): RenderResult {
  validateReportDocument(doc);
  const metrics = resolveMetrics(options);

  // Pass 1: Exact dry-run layout measurement to compute section start pages
  const measurePdf = createConfiguredPdf(doc.metadata.documentTitle);
  const pass1 = new PdfPassRunner(measurePdf, metrics, true, {});
  pass1.runDocument(doc);
  const sectionPages = pass1.recordedSectionPages;

  // Pass 2: Final rendering with verified section page numbers and deferred links
  const renderPdf = createConfiguredPdf(doc.metadata.documentTitle);
  const pass2 = new PdfPassRunner(renderPdf, metrics, false, sectionPages);
  pass2.runDocument(doc);

  const totalPages = renderPdf.getNumberOfPages();
  pass2.applyDeferredTocLinks(totalPages);
  pass2.decorateHeadersAndFooters(doc, totalPages);

  const arrayBuffer = renderPdf.output("arraybuffer");
  return {
    pdfBytes: new Uint8Array(arrayBuffer),
    pageCount: totalPages,
    sectionPages
  };
}
