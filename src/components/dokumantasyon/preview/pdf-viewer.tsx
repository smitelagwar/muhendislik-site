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
}

export function DokPdfViewer({ accessUrl, displayName, onAccessExpired }: DokPdfViewerProps) {
  return <PdfJsStudio accessUrl={accessUrl} displayName={displayName} onAccessExpired={onAccessExpired} />;
}
