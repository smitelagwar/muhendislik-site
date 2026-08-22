// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — DESTEKLENMEYEN / İNDİRME ODAKLI ÖNİZLEME BİLEŞENİ
// ============================================================================

"use client";

import { Download, HardDrive, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes, formatDate, getFileIcon } from "../ui-helpers";

interface UnsupportedPreviewProps {
  displayName: string;
  extension: string;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
  accessUrl: string;
  message?: string;
}

export function UnsupportedPreview({
  displayName,
  extension,
  sizeBytes,
  mimeType,
  createdAt,
  accessUrl,
  message,
}: UnsupportedPreviewProps) {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = accessUrl;
    link.download = displayName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div className="mx-auto max-w-md w-full rounded-2xl border border-border/80 bg-card/95 p-6 text-center shadow-2xl backdrop-blur-xl sm:p-8 space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 shadow-sm">
          {getFileIcon(extension, mimeType)}
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl truncate max-w-sm mx-auto">
            {displayName}
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm leading-relaxed">
            {message || "Bu dosya biçimi için doğrudan tarayıcı önizlemesi desteklenmiyor veya hazırlık aşamasında."}
          </p>
        </div>

        {/* Dosya Metadata Kartı */}
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/80 bg-secondary/30 p-3.5 text-left text-xs shadow-inner">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
              <HardDrive className="h-3.5 w-3.5 text-amber-500" />
              <span>Boyut</span>
            </span>
            <p className="font-mono font-bold text-foreground">{formatBytes(sizeBytes)}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-blue-500" />
              <span>Uzantı</span>
            </span>
            <p className="font-mono font-bold text-foreground uppercase">{extension.replace(".", "") || "Bilinmiyor"}</p>
          </div>

          <div className="col-span-2 space-y-1 border-t border-border/60 pt-2.5">
            <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-purple-500" />
              <span>Yüklenme Tarihi</span>
            </span>
            <p className="font-medium text-foreground">{formatDate(createdAt)}</p>
          </div>
        </div>

        <div>
          <Button
            onClick={handleDownload}
            className="w-full gap-2 bg-amber-500 h-11 text-sm font-bold text-zinc-950 hover:bg-amber-400 rounded-xl shadow-md"
          >
            <Download className="h-4 w-4" />
            <span>Dosyayı İndir</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
