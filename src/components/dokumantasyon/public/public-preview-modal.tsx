// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PUBLIC ÖNİZLEME MODALI (PUBLIC PREVIEW MODAL)
// ============================================================================

"use client";

import React from "react";
import { X, Download, Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DokShareItem } from "@/lib/dokumantasyon/types";
import { DokPdfViewer } from "../preview/pdf-viewer";
import { DokImageViewer } from "../preview/image-viewer";
import { DokTextViewer } from "../preview/text-viewer";
import { DokMarkdownViewer } from "../preview/markdown-viewer";
import { DokCadViewer } from "../preview/cad-viewer";
import { UnsupportedPreview } from "../preview/unsupported-preview";
import { getPreviewKind } from "@/lib/dokumantasyon/preview-capabilities";
import { formatBytes } from "../ui-helpers";

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
  if (!isOpen || !item) return null;

  const ext = item.file_extension || `.${item.snapshot_name.split(".").pop()?.toLowerCase()}`;
  const previewKind = getPreviewKind(ext);
  const accessUrl = `/api/dokumantasyon/public/download/${rawToken}/${item.id}`;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = accessUrl;
    link.download = item.snapshot_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-md animate-in fade-in">
      <div className="flex h-[92vh] w-full max-w-6xl flex-col rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden text-zinc-100">
        {/* Üst Bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <span className="truncate text-xs sm:text-sm font-bold text-zinc-100 max-w-sm sm:max-w-md">
              {item.snapshot_name}
            </span>
            <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-amber-400 uppercase">
              {ext}
            </span>
            <span className="hidden sm:inline text-xs text-zinc-500 font-mono">
              {formatBytes(item.snapshot_size_bytes)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleDownload}
              className="gap-1.5 bg-amber-500 text-xs font-bold text-zinc-950 hover:bg-amber-400"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">İndir</span>
            </Button>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
              aria-label="Kapat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Ana İçerik */}
        <main className="relative flex-1 overflow-hidden bg-zinc-950 flex flex-col">
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
              createdAt={(item as any).created_at || new Date().toISOString()}
              accessUrl={accessUrl}
            />
          )}
        </main>
      </div>
    </div>
  );
}
