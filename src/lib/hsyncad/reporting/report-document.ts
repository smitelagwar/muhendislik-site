/**
 * Hsyncad Structural Reporting - Document Model (P16)
 *
 * Intermediate representation decoupled from rendering engines.
 * Holds verified structural calculation results, physical reinforcement
 * schedules, and explicit scope/readiness metadata.
 */

export type ReportFamily =
  | "cover"
  | "toc"
  | "readiness"
  | "calculation"
  | "schedule"
  | "appendix";

export type CheckStatus = "pass" | "fail" | "unsupported" | "needs_review";

export interface CheckItem {
  id: string;
  clause: string;
  description: string;
  observed: string | number;
  limit: string | number;
  utilization: number | null;
  status: CheckStatus;
  note?: string;
}

export interface ReportTableCell {
  text: string;
  align?: "left" | "center" | "right";
  bold?: boolean;
  highlight?: boolean;
  colSpan?: number;
}

export type TableRowCell = string | number | ReportTableCell;

export interface ReportTable {
  id: string;
  title?: string;
  headers: string[];
  rows: TableRowCell[][];
  columnWidths?: number[];
  columnAlignments?: ("left" | "center" | "right")[];
  footnote?: string;
  compact?: boolean;
}

export interface ReportKeyValue {
  key: string;
  value: string | number;
  unit?: string;
}

export interface ReportParagraph {
  text: string;
  variant?: "normal" | "lead" | "caption" | "disclaimer" | "warning";
}

export type ReportBlock =
  | { type: "paragraph"; paragraph: ReportParagraph }
  | { type: "keyValueGrid"; title?: string; items: ReportKeyValue[]; columns?: number }
  | { type: "table"; table: ReportTable }
  | { type: "checkList"; title?: string; checks: CheckItem[] }
  | { type: "callout"; tone: "info" | "warning" | "error" | "neutral"; title?: string; message: string }
  | { type: "image"; dataUrl: string; widthMm: number; heightMm: number; caption?: string; align?: "left" | "center" | "right" };

export interface ReportSection {
  id: string;
  title: string;
  family: ReportFamily;
  blocks: ReportBlock[];
  pageBreakBefore?: boolean;
}

export interface BuildingDescription {
  buildingType: string;
  structuralSystem: string;
  concreteGrade: string;
  rebarGrade: string;
  soilClass: string;
  earthquakeDts?: string;
}

export type ReviewStatus =
  | "taslak_muhendis_incelemesi_gerekli"
  | "onayli"
  | "reddedildi";

export interface ReportMetadata {
  projectName: string;
  documentTitle: string;
  documentSubtitle?: string;
  engineerName: string;
  organization?: string;
  date: string;
  softwareName: string;
  softwareVersion: string;
  standards: string[];
  disclaimer: string;
  revisionId: string;
  reviewStatus: ReviewStatus;
  buildingDescription?: BuildingDescription;
  logoDataUrl?: string;
  coverBrandLabel?: string;
  coverSubBrandLabel?: string;
  tocTitle?: string;
  tocHint?: string;
  tocEmptyText?: string;
  runningHeaderLeft?: string;
  runningFooterStandardLabel?: string;
}

export interface ReportProvenance {
  generatedAt: string;
  sourceModelHash?: string;
  layoutRevisionId: string;
  calculationEngine: string;
}

export interface ReportDocument {
  metadata: ReportMetadata;
  sections: ReportSection[];
  provenance: ReportProvenance;
}

/**
 * Validates structural integrity of a ReportDocument before rendering.
 * Throws descriptive errors if required invariants are violated.
 */
export function validateReportDocument(doc: ReportDocument): void {
  if (!doc) {
    throw new Error("ReportDocument cannot be null or undefined.");
  }
  if (!doc.metadata) {
    throw new Error("ReportDocument must have metadata.");
  }
  if (!doc.metadata.projectName?.trim()) {
    throw new Error("ReportDocument metadata must have non-empty projectName.");
  }
  if (!doc.metadata.documentTitle?.trim()) {
    throw new Error("ReportDocument metadata must have non-empty documentTitle.");
  }
  if (!doc.metadata.revisionId?.trim()) {
    throw new Error("ReportDocument metadata must have revisionId.");
  }
  if (!doc.metadata.disclaimer?.trim()) {
    throw new Error("ReportDocument metadata must include explicit engineering disclaimer.");
  }
  if (!doc.provenance || !doc.provenance.layoutRevisionId?.trim()) {
    throw new Error("ReportDocument provenance must define layoutRevisionId.");
  }
  if (doc.metadata.revisionId !== doc.provenance.layoutRevisionId) {
    throw new Error(
      `Revision mismatch: metadata.revisionId '${doc.metadata.revisionId}' does not match provenance.layoutRevisionId '${doc.provenance.layoutRevisionId}'`
    );
  }
  if (!Array.isArray(doc.sections) || doc.sections.length === 0) {
    throw new Error("ReportDocument must contain at least one section.");
  }

  const sectionIds = new Set<string>();
  for (const sec of doc.sections) {
    if (!sec.id?.trim()) {
      throw new Error("Every ReportSection must have a non-empty id.");
    }
    if (sectionIds.has(sec.id)) {
      throw new Error(`Duplicate section id detected in ReportDocument: '${sec.id}'`);
    }
    sectionIds.add(sec.id);

    if (!sec.title?.trim()) {
      throw new Error(`Section '${sec.id}' must have a non-empty title.`);
    }
    if (!Array.isArray(sec.blocks)) {
      throw new Error(`Section '${sec.id}' blocks must be an array.`);
    }

    const tableIds = new Set<string>();
    for (const b of sec.blocks) {
      if (b.type === "table") {
        if (!b.table.id?.trim()) {
          throw new Error(`Table in section '${sec.id}' must have an id.`);
        }
        if (tableIds.has(b.table.id)) {
          throw new Error(`Duplicate table id '${b.table.id}' in section '${sec.id}'`);
        }
        tableIds.add(b.table.id);
      } else if (b.type === "image") {
        if (!b.dataUrl?.trim()) {
          throw new Error(`Image block in section '${sec.id}' must have a non-empty dataUrl.`);
        }
        if (!Number.isFinite(b.widthMm) || b.widthMm <= 0 || !Number.isFinite(b.heightMm) || b.heightMm <= 0) {
          throw new Error(`Image block in section '${sec.id}' must have positive finite dimensions.`);
        }
      }
    }
  }
}
