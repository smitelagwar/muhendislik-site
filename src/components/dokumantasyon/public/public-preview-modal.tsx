// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PUBLIC ÖNİZLEME MODALI (PUBLIC PREVIEW MODAL)
// ============================================================================

"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DokShareItem } from "@/lib/dokumantasyon/types";
import { UnsupportedPreview } from "../preview/unsupported-preview";
import { getPreviewKind } from "@/lib/dokumantasyon/preview-capabilities";
import { formatBytes } from "../ui-helpers";

const DokPdfViewer = dynamic(() => import("../preview/pdf-viewer").then((module) => module.DokPdfViewer), { ssr: false });
const DokImageViewer = dynamic(() => import("../preview/image-viewer").then((module) => module.DokImageViewer), { ssr: false });
const DokTextViewer = dynamic(() => import("../preview/text-viewer").then((module) => module.DokTextViewer), { ssr: false });
const DokMarkdownViewer = dynamic(() => import("../preview/markdown-viewer").then((module) => module.DokMarkdownViewer), { ssr: false });
const DokCadViewer = dynamic(() => import("../preview/cad-viewer").then((module) => module.DokCadViewer), { ssr: false });

interface PublicPreviewModalProps {
  isOpen: boolean;
  rawToken: string;
  item: (DokShareItem & { file_extension?: string }) | null;
  onClose: () => void;
}

export function PublicPreviewModal({
  isOpen,
  rawToken,
  item,
  onClose,
}: PublicPreviewModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const ext = item.file_extension || `.${item.snapshot_name.split(".").pop()?.toLowerCase()}`;
  const previewKind = getPreviewKind(ext);
  const accessUrl = `/api/dokumantasyon/public/download/${rawToken}/${item.id}?inline=1`;
  const downloadUrl = `/api/dokumantasyon/public/download/${rawToken}/${item.id}`;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = item.snapshot_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-2 sm:p-4 backdrop-blur-md animate-in fade-in"
    >
      <div className="flex h-[92vh] w-full max-w-6xl flex-col rounded-2xl border border-border/80 bg-card/95 shadow-2xl overflow-hidden text-foreground backdrop-blur-xl">
        {/* Üst Bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/70 bg-card/85 px-4 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <span className="truncate text-xs sm:text-sm font-bold text-foreground max-w-sm sm:max-w-md">
              {item.snapshot_name}
            </span>
            <span className="inline-flex items-center rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase font-mono">
              {ext}
            </span>
            <span className="hidden sm:inline text-xs text-muted-foreground font-mono">
              {formatBytes(item.snapshot_size_bytes)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleDownload}
              className="gap-1.5 bg-amber-500 text-xs font-bold text-zinc-950 hover:bg-amber-400 rounded-xl h-9 px-3.5 shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">İndir</span>
            </Button>

            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              aria-label="Kapat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Ana İçerik */}
        <main className="relative flex-1 overflow-hidden bg-background flex flex-col">
          {previewKind === "pdf" ? (
            <DokPdfViewer accessUrl={accessUrl} displayName={item.snapshot_name} />
          ) : previewKind === "image" ? (
            <DokImageViewer accessUrl={accessUrl} displayName={item.snapshot_name} />
          ) : previewKind === "markdown" ? (
            <DokMarkdownViewer accessUrl={accessUrl} displayName={item.snapshot_name} />
          ) : previewKind === "cad" ? (
            <DokCadViewer
              accessUrl={accessUrl}
              displayName={item.snapshot_name}
              fileId={item.file_id || item.id}
              extension={ext}
              sizeBytes={Number(item.snapshot_size_bytes)}
            />
          ) : previewKind === "text" || previewKind === "json" || previewKind === "csv" ? (
            <DokTextViewer
              accessUrl={accessUrl}
              displayName={item.snapshot_name}
              extension={ext}
            />
          ) : (
            <UnsupportedPreview
              displayName={item.snapshot_name}
              extension={ext}
              sizeBytes={Number(item.snapshot_size_bytes)}
              mimeType={item.snapshot_mime_type}
              createdAt={new Date().toISOString()}
              accessUrl={accessUrl}
            />
          )}
        </main>
      </div>
    </div>
  );
}
