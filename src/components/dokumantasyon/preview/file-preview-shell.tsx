// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — ORTAK ÖNİZLEME KABUĞU (VIEWER SHELL)
// ============================================================================

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Download,
  Share2,
  Maximize,
  Minimize,
  MoreVertical,
  Edit3,
  Trash2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { formatBytes, formatDate, getFileIcon } from "../ui-helpers";
import { PreviewKind } from "@/lib/dokumantasyon/preview-capabilities";
import { CreateShareModal } from "../modals/create-share-modal";
import { ShareResultModal } from "../modals/share-result-modal";
import { RenameModal } from "../modals/rename-modal";
import { DeleteConfirmModal } from "../modals/delete-confirm-modal";
import { UnsupportedPreview } from "./unsupported-preview";
import { requestDokMutation } from "@/lib/dokumantasyon/client-mutation";

const DokPdfViewer = dynamic(() => import("./pdf-viewer").then((module) => module.DokPdfViewer), { ssr: false });
const DokImageViewer = dynamic(() => import("./image-viewer").then((module) => module.DokImageViewer), { ssr: false });
const DokTextViewer = dynamic(() => import("./text-viewer").then((module) => module.DokTextViewer), { ssr: false });
const DokMarkdownViewer = dynamic(() => import("./markdown-viewer").then((module) => module.DokMarkdownViewer), { ssr: false });
export const loadCadRuntimeModule = () => import("./cad-runtime-orchestrator");
const DokCadViewer = dynamic(() => loadCadRuntimeModule().then((module) => module.DokCadRuntimeOrchestrator), { ssr: false });

import type { DwgFastPreviewHint } from "./cad-runtime-orchestrator";

interface FilePreviewShellProps {
  file: {
    id: string;
    display_name: string;
    size_bytes: number;
    mime_type: string;
    extension: string;
    created_at: string;
    updated_at?: string;
    current_version_number?: number;
    folder_id: string | null;
  };
  accessUrl: string;
  previewKind: PreviewKind;
  expiresAt: string;
  isLocal: boolean;
  dwgFastPreviewHint?: DwgFastPreviewHint;
  children?: React.ReactNode;
}

type ShareResult = {
  shareUrl: string;
  rawToken: string;
  expiresAt: string;
  totalFiles: number;
  totalSizeBytes: number;
  title?: string | null;
};

export function FilePreviewShell({
  file,
  accessUrl,
  previewKind,
  dwgFastPreviewHint,
  children,
}: FilePreviewShellProps) {
  const router = useRouter();
  const shellContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Modallar
  const [isCreateShareOpen, setIsCreateShareOpen] = useState(false);
  const [shareResult, setShareResult] = useState<ShareResult | null>(null);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Tam Ekran Değişim Dinleyicisi
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = () => {
    if (!shellContainerRef.current) return;

    if (!document.fullscreenElement) {
      shellContainerRef.current.requestFullscreen?.().catch((err) => {
        console.error("Tam ekran başlatılamadı:", err);
      });
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = accessUrl;
    link.download = file.display_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBack = () => {
    if (file.folder_id) {
      router.push(`/dokumantasyon?folder=${file.folder_id}`);
    } else {
      router.push("/dokumantasyon");
    }
  };

  const handleDeleteSuccess = () => {
    setIsDeleteOpen(false);
    handleBack();
  };

  return (
    <div
      ref={shellContainerRef}
      className={`flex flex-col bg-background text-foreground transition-all duration-200 ${
        isFullscreen
          ? "fixed inset-0 z-50 h-screen w-screen"
          : "min-h-[85vh] rounded-2xl border border-border bg-card/60 shadow-2xl backdrop-blur-md"
      }`}
    >
      {/* 1. Üst Başlık ve Aksiyon Çubuğu (Top Bar) */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/80 bg-card/80 px-3 sm:px-5 backdrop-blur-md">
        {/* Sol Alan: Geri Butonu ve Dosya Başlığı */}
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleBack}
            className="h-8 w-8 p-0 text-muted-foreground hover:bg-secondary hover:text-foreground shrink-0"
            title="Dosya Yöneticisine Dön"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="shrink-0">
            {getFileIcon(file.extension, file.mime_type)}
          </div>

          <div className="min-w-0">
            <h1 className="text-xs font-bold text-foreground truncate sm:text-sm max-w-[180px] sm:max-w-md lg:max-w-xl">
              {file.display_name}
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>{formatBytes(file.size_bytes)}</span>
              <span>•</span>
              <span className="uppercase font-semibold text-amber-500/90">
                {file.extension.replace(".", "") || "BİLİNMİYOR"}
              </span>
            </div>
          </div>
        </div>

        {/* Sağ Alan: Aksiyon Butonları */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsCreateShareOpen(true)}
            className="h-8 gap-1.5 border-border text-xs font-semibold text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/40"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Paylaş</span>
          </Button>

          <Button
            size="sm"
            onClick={handleDownload}
            className="h-8 gap-1.5 bg-amber-500 text-xs font-bold text-zinc-950 hover:bg-amber-400 shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">İndir</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleToggleFullscreen}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            title={isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran Yap"}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>

          {/* 3 Nokta Menüsü */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-card border-border shadow-xl">
              <DropdownMenuItem
                onClick={() => setIsRenameOpen(true)}
                className="flex items-center gap-2 text-xs text-blue-500 focus:text-blue-500 cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5 text-blue-500" />
                <span>Yeniden Adlandır</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsDeleteOpen(true)}
                className="flex items-center gap-2 text-xs text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                <span>Çöp Kutusuna At</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* 2. Ana Önizleme Alanı (Viewer Body Container) */}
      <main className="relative flex-1 overflow-hidden bg-background/50 flex flex-col">
        {children ? (
          children
        ) : previewKind === "pdf" ? (
          <DokPdfViewer accessUrl={accessUrl} displayName={file.display_name} />
        ) : previewKind === "image" ? (
          <DokImageViewer accessUrl={accessUrl} displayName={file.display_name} />
        ) : previewKind === "markdown" ? (
          <DokMarkdownViewer accessUrl={accessUrl} displayName={file.display_name} />
        ) : previewKind === "cad" ? (
          <DokCadViewer
            accessUrl={accessUrl}
            displayName={file.display_name}
            fileId={file.id}
            extension={file.extension}
            sizeBytes={file.size_bytes}
            sourceVersionKey={`${file.id}:${file.current_version_number || 1}:${file.updated_at || file.created_at}:${file.size_bytes}`}
            dwgFastPreviewHint={dwgFastPreviewHint}
          />
        ) : previewKind === "text" || previewKind === "json" || previewKind === "csv" ? (
          <DokTextViewer
            accessUrl={accessUrl}
            displayName={file.display_name}
            extension={file.extension}
          />
        ) : (
          <UnsupportedPreview
            displayName={file.display_name}
            extension={file.extension}
            sizeBytes={file.size_bytes}
            mimeType={file.mime_type}
            createdAt={file.created_at}
            accessUrl={accessUrl}
          />
        )}
      </main>

      {/* 3. Durum ve Bilgi Çubuğu (Footer Bar) */}
      {!isFullscreen && (
        <footer className="flex h-9 shrink-0 items-center justify-between border-t border-border/70 bg-card/60 px-4 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-amber-500/80" />
              <span>Yüklenme: {formatDate(file.created_at)}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground">
              {previewKind.toUpperCase()} MOTORU
            </span>
          </div>
        </footer>
      )}

      {/* Modallar */}
      <CreateShareModal
        isOpen={isCreateShareOpen}
        selectedItems={[
          {
            id: file.id,
            type: "file",
            name: file.display_name,
            size: file.size_bytes,
          },
        ]}
        onClose={() => setIsCreateShareOpen(false)}
        onSuccess={(res) => setShareResult(res)}
      />

      <ShareResultModal
        isOpen={shareResult !== null}
        result={shareResult}
        onClose={() => setShareResult(null)}
      />

      <RenameModal
        isOpen={isRenameOpen}
        item={{
          id: file.id,
          name: file.display_name,
          type: "file",
        }}
        onClose={() => setIsRenameOpen(false)}
        onSuccess={() => router.refresh()}
      />

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        item={{
          id: file.id,
          name: file.display_name,
          type: "file",
        }}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={async () => {
          const result = await requestDokMutation(`/api/dokumantasyon/files/${file.id}`, { method: "DELETE" });
          if (!result.ok) throw new Error(result.message);
          handleDeleteSuccess();
        }}
      />
    </div>
  );
}
