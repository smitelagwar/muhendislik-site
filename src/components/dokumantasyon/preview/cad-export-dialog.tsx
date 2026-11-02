"use client";

import { useState } from "react";
import { Download, FileCode, FileText, Image as ImageIcon, Layers, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CadReviewDocument } from "@/lib/dokumantasyon/cad-review/schema";
import { exportReviewToJson, filterReviewItems, type CadExportFilters } from "@/lib/dokumantasyon/cad-review/export-json";
import { exportReviewToDxf } from "@/lib/dokumantasyon/cad-review/export-dxf";
import { captureReviewPngBlob, exportCanvasToPdfBlob, downloadFileBlob } from "@/lib/dokumantasyon/cad-review/export-image";

import type { CadSourceUnitContext } from "@/lib/dokumantasyon/cad-review/units";

export type CadExportFormat = "json" | "dxf" | "png" | "pdf" | "original";

export interface CadExportDialogProps {
  open: boolean;
  onClose: () => void;
  document: CadReviewDocument;
  sourceFileName: string;
  sourceUnitContext?: CadSourceUnitContext;
  originalFileUrl?: string;
  getCanvasElement?: () => HTMLCanvasElement | null;
  getSvgOverlayElement?: () => SVGElement | null;
}

export function CadExportDialog({
  open,
  onClose,
  document,
  sourceFileName,
  sourceUnitContext,
  originalFileUrl,
  getCanvasElement,
  getSvgOverlayElement,
}: CadExportDialogProps) {
  const [format, setFormat] = useState<CadExportFormat>("json");
  const [filters, setFilters] = useState<CadExportFilters>({
    includeMeasurements: true,
    includeComments: true,
    includeMarkup: true,
    includeSketc¶»§q«^