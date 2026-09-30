// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — GÜVENLİ TAM PDF GÖRÜNTÜLEYİCİ (PDF VIEWER ADAPTER)
// ============================================================================

"use client";

import React from "react";
import { PdfJsStudio } from "../studio/pdf/pdfjs-studio";

interface DokPdfViewerProps {
  accessUrl: string;
  displayName: string;
  onAccessExpired?: () => Promise<unknown>;
  fileId?: string;
  versionNo?: number;
  sizeBytes?: number;
  extension?: string;
  createdAt?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onBack?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}

export function DokPdfViewer(props: DokPdfViewerProps) {
  return <PdfJsStudio {...props} />;
}
