// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — FULL-VIEWPORT DOCUMENT STUDIO SHELL
// ============================================================================

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, SlidersHorizontal, Maximize2, Minimize2 } from "lucide-react";
import { PreviewKind } from "@/lib/dokumantasyon/preview-capabilities";
import { StudioTopbar } from "./studio-topbar";
import { CreateShareModal } from "../modals/create-share-modal";
import { ShareResultModal } from "../modals/share-result-modal";
import { RenameModal } from "../modals/rename-modal";
import { DeleteConfirmModal } from "../modals/delete-confirm-modal";
import { UnsupportedPreview } from "../preview/unsupported-preview";
import { refreshDocumentAccessLease, isAccessLeaseExpiring, DocumentAccessLease } from "@/lib/dokumantasyon/studio/access-lease";

// Viewer motorları yalnız gerekli preview türü açıldığında indirilsin; Explorer
// ve başka bir viewer türü PDF.js/CAD kodunu ilk JS'e taşımamalıdır.
const DokPdfViewer = dynamic(() => import("../preview/pdf-viewer").then((module) => module.DokPdfViewer), { ssr: false });
const DokImageViewer = dynamic(() => import("../preview/image-viewer").then((module) => module.DokImageViewer), { ssr: false });
const DokTextViewer = dynamic(() => import("../preview/text-viewer").then((module) => module.DokTextViewer), { ssr: false });
const DokMarkdownViewer = dynamic(() => import("../preview/markdown-viewer").then((module) => module.DokMarkdownViewer), { ssr: false });
const DokCadViewer = dynamic(() => import("../preview/cad-runtime-orchestrator").then((module) => module.DokCadRuntimeOrchestrator), { ssr: false });

import type { DwgFastPreviewHint } from "../preview/cad-runtime-orchestrator";

interface DocumentStudioShellProps {
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
  versionNo?: number;
  dwgFastPreviewHint?: DwgFastPreviewHint;
}

type ShareResult = {
  shareUrl: string;
  rawToken: string;
  expiresAt: string;
  totalFiles: number;
  totalSizeBytes: number;
  title?: string | null;
};

export function DocumentStudioShell({
  file,
  accessUrl: initialAccessUrl,
  previewKind,
  expiresAt: initialExpiresAt,
  isLocal,
  versionNo = 1,
  dwgFastPreviewHint,
}: DocumentStudioShellProps) {
  const router = useRouter();
  const studioRootRef = useRef<HTMLDivElement>(null);
  const leaseRefreshPromiseRef = useRef<Promise<DocumentAccessLease> | null>(null);

  // Erişim Kiralaması (Access Lease State)
  const [currentLease, setCurrentLease] = useState<DocumentAccessLease>({
    url: initialAccessUrl,
    expiresAt: initialExpiresAt,
    isLocal,
    fileId: file.id,
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [editedContent, setEditedContent] = useState<string | null>(null);
  const [currentVersionNo, setCurrentVersionNo] = useState<number>(versionNo);
  const [isSaving, setIsSaving] = useState(false);

  // Mobil Yatay (Landscape) Modu Takibi
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  const [isLandscapeBarsHidden, setIsLandscapeBarsHidden] = useState(true);

  useEffect(() => {
    const checkMobileLandscape = () => {
      if (typeof window === "undefined") return false;
      const isLandscape = window.innerWidth > window.innerHeight;
      const isSmallHeight = window.innerHeight <= 560;
      const isMobileWidth = window.innerWidth <= 1024;
      return isLandscape && isSmallHeight && isMobileWidth;
    };

    const handleResizeOrOrientation = () => {
      const nowLandscape = checkMobileLandscape();
      setIsMobileLandscape((prev) => {
        if (!prev && nowLandscape) {
          setIsLandscapeBarsHidden(true);
        }
        if (!nowLandscape) {
          setIsLandscapeBarsHidden(false);
        }
        return nowLandscape;
      });
    };

    handleResizeOrOrientation();

    window.addEventListener("resize", handleResizeOrOrientation);
    window.addEventListener("orientationchange", handleResizeOrOrientation);
    if (typeof screen !== "undefined" && screen.orientation) {
      screen.orientation.addEventListener("change", handleResizeOrOrientation);
    }

    return () => {
      window.removeEventListener("resize", handleResizeOrOrientation);
      window.removeEventListener("orientationchange", handleResizeOrOrientation);
      if (typeof screen !== "undefined" && screen.orientation) {
        screen.orientation.removeEventListener("change", handleResizeOrOrientation);
      }
    };
  }, []);

  // Modallar
  const [isCreateShareOpen, setIsCreateShareOpen] = useState(false);
  const [shareResult, setShareResult] = useState<ShareResult | null>(null);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Tarayıcı Tam Ekran (F11 / Fullscreen API) Dinleyicisi
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Stüdyo sabit bir viewport olarak çalışır. Alttaki sayfanın kaymasını
  // engellerken, kapatıldığında önceki inline değerleri birebir geri yükle.
  useEffect(() => {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    const previousHtmlOverflow = htmlElement.style.overflow;
    const previousBodyOverflow = bodyElement.style.overflow;
    const previousHtmlOverscrollBehavior = htmlElement.style.overscrollBehavior;
    const previousBodyOverscrollBehavior = bodyElement.style.overscrollBehavior;

    htmlElement.style.overflow = "hidden";
    bodyElement.style.overflow = "hidden";
    htmlElement.style.overscrollBehavior = "none";
    bodyElement.style.overscrollBehavior = "none";

    return () => {
      htmlElement.style.overflow = previousHtmlOverflow;
      bodyElement.style.overflow = previousBodyOverflow;
      htmlElement.style.overscrollBehavior = previousHtmlOverscrollBehavior;
      bodyElement.style.overscrollBehavior = previousBodyOverscrollBehavior;
    };
  }, []);

  // Kaydedilmemiş değişiklik varken sekmeyi kapatmayı engelle
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleToggleFullscreen = useCallback(() => {
    if (!studioRootRef.current) return;

    if (!document.fullscreenElement) {
      studioRootRef.current.requestFullscreen?.().catch((err) => {
        console.error("Tarayıcı tam ekran modu başlatılamadı:", err);
      });
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  const refreshCurrentLease = useCallback(async () => {
    if (isLocal) throw new Error("Yerel dosya erişim bağlantısı yenilenemez.");
    if (!leaseRefreshPromiseRef.current) {
      leaseRefreshPromiseRef.current = refreshDocumentAccessLease(file.id)
        .then((freshLease) => {
          setCurrentLease(freshLease);
          return freshLease;
        })
        .finally(() => {
          leaseRefreshPromiseRef.current = null;
        });
    }
    return leaseRefreshPromiseRef.current;
  }, [file.id, isLocal]);

  // Erişim Kiralama Süresini Arka Planda İzleme ve Gerekirse Yenileme
  useEffect(() => {
    if (isLocal) return;

    const interval = setInterval(async () => {
      if (isAccessLeaseExpiring(currentLease, 120)) {
        try {
          await refreshCurrentLease();
        } catch (err) {
          console.warn("Document access lease refresh failed:", err);
        }
      }
    }, 60 * 1000); // Her 60 saniyede bir kontrol et

    return () => clearInterval(interval);
  }, [currentLease, isLocal, refreshCurrentLease]);

  const handleDownload = useCallback(async () => {
    try {
      let downloadUrl = currentLease.url;
      if (!isLocal && isAccessLeaseExpiring(currentLease, 30)) {
        const fresh = await refreshCurrentLease();
        downloadUrl = fresh.url;
      }

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = file.display_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("İndirme başlatılamadı:", err);
    }
  }, [currentLease, isLocal, refreshCurrentLease, file.display_name]);

  const handleBack = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm(
        "Kaydedilmemiş değişiklikleriniz var. Ayrılmak istediğinizden emin misiniz?"
      );
      if (!confirmed) return;
    }

    if (file.folder_id) {
      router.push(`/dokumantasyon?folderId=${file.folder_id}`);
    } else {
      router.push("/dokumantasyon");
    }
  }, [isDirty, file.folder_id, router]);

  // Yeni Sürüm Olarak Kaydetme (Versioned Save)
  const handleSaveVersion = useCallback(async () => {
    if (!isDirty || editedContent === null || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/dokumantasyon/files/${file.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editedContent,
          comment: "Stüdyo düzenlemesi",
          mimeType: file.mime_type,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Versiyon kaydedilemedi.");
      }

      setIsDirty(false);
      if (data.version?.version_number) {
        setCurrentVersionNo(data.version.version_number);
      }
    } catch (err: unknown) {
      console.error("Versiyon kaydetme hatası:", err);
      alert(err instanceof Error ? err.message : "Versiyon kaydedilirken bir hata oluştu.");
    } finally {
      setIsSaving(false);
    }
  }, [isDirty, editedContent, isSaving, file.id, file.mime_type]);

  const handleDeleteSuccess = useCallback(() => {
    setIsDeleteOpen(false);
    handleBack();
  }, [handleBack]);

  // Önizleme İçerik Motoru Seçimi
  const renderViewerContent = () => {
    switch (previewKind) {
      case "pdf":
        return (
          <DokPdfViewer
            accessUrl={currentLease.url}
            displayName={file.display_name}
            onAccessExpired={refreshCurrentLease}
          />
        );

      case "image":
        return (
          <DokImageViewer
            accessUrl={currentLease.url}
            displayName={file.display_name}
          />
        );

      case "text":
        return (
          <DokTextViewer
            accessUrl={currentLease.url}
            displayName={file.display_name}
            extension={file.extension}
            onContentChange={(newText) => {
              setEditedContent(newText);
              setIsDirty(true);
            }}
          />
        );

      case "markdown":
        return (
          <DokMarkdownViewer
            accessUrl={currentLease.url}
            displayName={file.display_name}
            onContentChange={(newMd) => {
              setEditedContent(newMd);
              setIsDirty(true);
            }}
          />
        );

      case "cad":
        return (
          <DokCadViewer
            accessUrl={currentLease.url}
            displayName={file.display_name}
            fileId={file.id}
            extension={file.extension}
            sizeBytes={file.size_bytes}
            sourceVersionKey={`${file.id}:${file.current_version_number || currentVersionNo || 1}:${file.updated_at || file.created_at}:${file.size_bytes}`}
            dwgFastPreviewHint={dwgFastPreviewHint}
          />
        );

      default:
        return (
          <UnsupportedPreview
            displayName={file.display_name}
            extension={file.extension}
            sizeBytes={file.size_bytes}
            mimeType={file.mime_type}
            createdAt={file.created_at}
            accessUrl={currentLease.url}
          />
        );
    }
  };

  const isEditableKind = previewKind === "text" || previewKind === "markdown";

  return (
    <div
      ref={studioRootRef}
      id="document-studio-shell"
      data-testid="document-studio-shell"
      data-studio-locked="true"
      data-mobile-landscape={isMobileLandscape ? "true" : "false"}
      data-mobile-landscape-hidden={isMobileLandscape && isLandscapeBarsHidden ? "true" : "false"}
      className="fixed inset-0 z-[200] flex h-[100dvh] w-[100dvw] flex-col overflow-hidden overscroll-none bg-background text-foreground select-none"
    >
      {/* 1. Minimal Stüdyo Üst Çubuğu */}
      <StudioTopbar
        file={file}
        previewKind={previewKind}
        isDirty={isDirty}
        versionNo={currentVersionNo}
        isFullscreen={isFullscreen}
        isMobileLandscape={isMobileLandscape}
        onHideLandscapeBars={() => setIsLandscapeBarsHidden(true)}
        onBack={handleBack}
        onShare={() => setIsCreateShareOpen(true)}
        onDownload={handleDownload}
        onToggleFullscreen={handleToggleFullscreen}
        onRename={() => setIsRenameOpen(true)}
        onDelete={() => setIsDeleteOpen(true)}
        onSave={isEditableKind ? handleSaveVersion : undefined}
        isSaving={isSaving}
      />

      {/* Mobil Yatayda Çubuklar Gizliyken Gösterilen Yüzen Hızlı Kontrol Kapsülü */}
      {isMobileLandscape && isLandscapeBarsHidden && (
        <div
          data-testid="mobile-landscape-quick-controls"
          className="fixed top-2.5 right-2.5 z-[250] flex items-center gap-1.5 rounded-full bg-card/90 border border-border/80 p-1 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2"
        >
          <button
            type="button"
            onClick={handleBack}
            className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
            title="Geri Dön"
            aria-label="Geri Dön"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsLandscapeBarsHidden(false)}
            className="flex h-8 items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 text-xs font-bold text-amber-500 hover:bg-amber-500/25 transition-colors cursor-pointer shadow-sm"
            title="Üst araç çubuğunu ve başlığı geçici olarak göster"
            aria-label="Araçları Göster"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Araçlar</span>
          </button>

          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
            title={isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran Yap"}
            aria-label="Tam Ekran"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      )}

      {/* 2. Tam Görünüm (Full-Viewport) İçerik Alanı */}
      <main className="relative flex flex-1 min-h-0 min-w-0 overflow-hidden">
        {renderViewerContent()}
      </main>

      {/* 3. Aksiyon Modalları */}
      <CreateShareModal
        isOpen={isCreateShareOpen}
        onClose={() => setIsCreateShareOpen(false)}
        selectedItems={[
          {
            id: file.id,
            type: "file",
            name: file.display_name,
            size: file.size_bytes,
          },
        ]}
        onSuccess={(result) => {
          setIsCreateShareOpen(false);
          setShareResult(result);
        }}
      />

      <ShareResultModal
        isOpen={!!shareResult}
        onClose={() => setShareResult(null)}
        result={shareResult}
      />

      <RenameModal
        isOpen={isRenameOpen}
        onClose={() => setIsRenameOpen(false)}
        item={{ id: file.id, name: file.display_name, type: "file" }}
        onSuccess={() => {
          setIsRenameOpen(false);
          router.refresh();
        }}
      />

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        item={{ id: file.id, name: file.display_name, type: "file" }}
        onConfirm={async () => {
          await fetch(`/api/dokumantasyon/files/${file.id}`, {
            method: "DELETE",
          });
          handleDeleteSuccess();
        }}
      />
    </div>
  );
}
