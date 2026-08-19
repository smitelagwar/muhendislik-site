"use client";

import { useState } from "react";
import {
  Download,
  FolderArchive,
  Clock,
  FileCheck,
  Loader2,
  HardDrive,
  CheckCircle2,
  Share2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DokShareLink, DokShareItem } from "@/lib/dokumantasyon/types";
import { formatBytes, formatDate, getFileIcon } from "../ui-helpers";
import { PublicPreviewModal } from "./public-preview-modal";

interface DownloadViewProps {
  rawToken: string;
  link: DokShareLink;
  items: Array<DokShareItem & { file_extension?: string }>;
  totalFiles: number;
  totalSizeBytes: number;
}

export function PublicShareDownloadView({
  rawToken,
  link,
  items,
  totalFiles,
  totalSizeBytes,
}: DownloadViewProps) {
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadingItemId, setDownloadingItemId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<(DokShareItem & { file_extension?: string }) | null>(null);

  const handleDownloadZip = async () => {
    if (downloadingZip) return;
    setDownloadingZip(true);

    try {
      const zipUrl = `/api/dokumantasyon/public/zip/${rawToken}`;
      // Native tarayıcı indirme tetikle
      const linkEl = document.createElement("a");
      linkEl.href = zipUrl;
      linkEl.download = `${link.title || "arsiv"}.zip`;
      document.body.appendChild(linkEl);
      linkEl.click();
      document.body.removeChild(linkEl);
    } catch (err) {
      console.error("ZIP indirme hatası:", err);
    } finally {
      setTimeout(() => setDownloadingZip(false), 2000);
    }
  };

  const handleDownloadSingle = (itemId: string, filename: string) => {
    setDownloadingItemId(itemId);
    try {
      const fileUrl = `/api/dokumantasyon/public/download/${rawToken}/${itemId}`;
      const linkEl = document.createElement("a");
      linkEl.href = fileUrl;
      linkEl.download = filename;
      document.body.appendChild(linkEl);
      linkEl.click();
      document.body.removeChild(linkEl);
    } catch (err) {
      console.error("Tekil indirme hatası:", err);
    } finally {
      setTimeout(() => setDownloadingItemId(null), 2000);
    }
  };

  return (
    <div className="mx-auto max-w-4xl w-full space-y-6">
      {/* Üst Kart / Başlık ve Birincil İndirme Butonu */}
      <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-2xl backdrop-blur-md sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-500">
                <FolderArchive className="h-3.5 w-3.5" />
                <span>Güvenli Dosya Paylaşımı</span>
              </span>
            </div>

            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {link.title || "Mühendislik & Mimarlık Dokümanları"}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {totalFiles} Dosya ({formatBytes(totalSizeBytes)})
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <span>Son Geçerlilik: {formatDate(link.expires_at)}</span>
              </span>
            </div>
          </div>

          {/* Ana ZIP İndirme Butonu */}
          <div className="shrink-0">
            <Button
              size="lg"
              onClick={handleDownloadZip}
              disabled={downloadingZip}
              className="w-full sm:w-auto gap-2 bg-amber-500 px-6 py-6 text-sm font-bold text-zinc-950 shadow-lg hover:bg-amber-400"
            >
              {downloadingZip ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Arşiv Hazırlanıyor...</span>
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  <span>{totalFiles === 1 ? "Dosyayı İndir" : "Tümünü İndir (.ZIP)"}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Dosya Listesi */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-secondary/30 px-6 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Paylaşılan Dosyalar ({totalFiles})
        </div>

        <div className="divide-y divide-border/60">
          {items.map((item) => {
            const isDownloading = downloadingItemId === item.id;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 px-6 transition-colors hover:bg-secondary/30"
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-4">
                  <div className="shrink-0">
                    {getFileIcon(item.file_extension || "", item.snapshot_mime_type)}
                  </div>

                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-foreground truncate max-w-sm sm:max-w-md">
                      {item.snapshot_name}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {item.relative_path && item.relative_path !== item.snapshot_name && (
                        <span className="text-amber-500/80 mr-1.5">
                          {item.relative_path.split("/").slice(0, -1).join(" / ")} /
                        </span>
                      )}
                      <span>{formatBytes(item.snapshot_size_bytes)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPreviewItem(item)}
                    className="gap-1.5 text-xs text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Önizle</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadSingle(item.id, item.snapshot_name)}
                    disabled={isDownloading}
                    className="gap-1.5 border-border text-xs font-semibold hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-foreground"
                  >
                    {isDownloading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    <span className="hidden sm:inline">İndir</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Public Önizleme Modalı */}
      <PublicPreviewModal
        isOpen={previewItem !== null}
        rawToken={rawToken}
        item={previewItem}
        onClose={() => setPreviewItem(null)}
      />
    </div>
  );
}
