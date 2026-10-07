// ============================================================================
// PDF v4 MOTOR — SANAL SAYFA LİSTESİ (Plan 03 P3.3.6)
// ----------------------------------------------------------------------------
// Motorun belirlediği görünür aralıktaki (range) sayfaları DOM'a mount eder.
// Sayfa kutularının yerleşimi doğrudan motor tarafından kontrol edilir.
// ============================================================================

"use client";

import React, { useMemo } from "react";
import type { PdfEngine } from "@/lib/dokumantasyon/studio/pdf/engine/engine";
import { useEngineRange } from "@/lib/dokumantasyon/studio/pdf/engine/use-pdf-engine";
import { PdfPageHost, PdfPageHostProps } from "./pdf-page-host";

export interface PdfVirtualPagesProps {
  engine: PdfEngine;
  pdfDoc: any;
  overlayProps?: (pageNumber: number) => PdfPageHostProps["overlayProps"];
  nightMode?: boolean;
  sizerRef?: React.RefObject<HTMLDivElement | null>;
}

export function PdfVirtualPages({
  engine,
  pdfDoc,
  overlayProps,
  nightMode,
  sizerRef,
}: PdfVirtualPagesProps) {
  const range = useEngineRange(engine);

  const pages = useMemo(() => {
    if (!range || range.first <= 0 || range.last <= 0 || range.first > range.last) {
      return [];
    }
    const list: number[] = [];
    for (let p = range.first; p <= range.last; p++) {
      list.push(p);
    }
    return list;
  }, [range]);

  const content = (
    <>
      {pages.map((p) => (
        <PdfPageHost
          key={p}
          engine={engine}
          pdfDoc={pdfDoc}
          pageNumber={p}
          overlayProps={overlayProps?.(p)}
          nightMode={nightMode}
        />
      ))}
    </>
  );

  if (sizerRef) {
    return (
      <div
        ref={sizerRef}
        className="pdf-content relative"
        data-testid="pdf-content"
        style={{ overflowAnchor: "none" }}
      >
        {content}
      </div>
    );
  }

  return content;
}
