// ============================================================================
// BELGELER PAYLAŞIM — SALT-OKUNUR GERÇEK PDF.JS GÖRÜNTÜLEYİCİ (V4)
// ============================================================================

"use client";

import React, { useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { formatShareViewerExpiry } from "@/lib/belge-paylasim/viewer-geometry";
import { downloadSharedPdf } from "@/lib/belge-paylasim/download-client";
import { Loader2 } from "lucide-react";

export interface BelgeShareViewerProps {
  viewToken: string;
  documentTitle?: string;
  initialExpiresAt?: string;
  onDownload?: () => void;
}

const DynamicPdfJsStudio = dynamic(
  () =>
    import("@/components/dokumantasyon/studio/pdf/pdfjs-studio").then(
      (mod) => mod.PdfJsStudio
    ),
  {
    ssr: false,
    loading: () => (
      <div
        data-testid="share-viewer-loading"
        className="flex h-dvh w-full items-center justify-center bg-background text-foreground"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin text-amber-500" />
          <span>Belge yükleniyor…</span>
        </div>
      </div>
    ),
  }
);

export function BelgeShareViewer({
  viewToken,
  documentTitle = "Paylaşılan PDF Belgesi",
  initialExpiresAt,
  onDownload,
}: BelgeShareViewerProps) {
  const formattedExpiry = useMemo(
    () => (initialExpiresAt ? formatShareViewerExpiry(initialExpiresAt) : null),
    [initialExpiresAt]
  );

  const accessUrl = `/api/belgeler/paylasim/${encodeURIComponent(viewToken)}/pdf`;

  const handleDownload = useCallback(() => {
    if (onDownload) {
      onDownload();
      return;
    }
    void downloadSharedPdf(viewToken, { fallbackFilename: documentTitle });
  }, [onDownload, viewToken, documentTitle]);

  return (
    <div
      data-testid="share-viewer"
      className="flex h-dvh w-full min-w-0 flex-col overflow-hidden bg-background text-foreground antialiased"
    >
      <DynamicPdfJsStudio
        accessUrl={accessUrl}
        displayName={documentTitle}
        variant="public-share"
        expiresAt={formattedExpiry ?? undefined}
        statusBadge="Salt Okunur"
        onDownload={handleDownload}
      />
    </div>
  );
}
