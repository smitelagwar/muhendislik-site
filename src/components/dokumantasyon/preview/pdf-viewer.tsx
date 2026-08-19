// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — GÜVENLİ TAM PDF GÖRÜNTÜLEYİCİ (PDF VIEWER ADAPTER)
// ============================================================================

"use client";

import React from "react";
import { PdfJsStudio } from "../studio/pdf/pdfjs-studio";

interface DokPdfViewerProps {
  accessUrl: string;
  displayName: string;
}

export function DokPdfViewer({ accessUrl, displayName }: DokPdfViewerProps) {
  return <PdfJsStudio accessUrl={accessUrl} displayName={displayName} />;
}
