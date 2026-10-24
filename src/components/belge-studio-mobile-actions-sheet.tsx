"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Edit3, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useBelgeStudioMobileContext } from "@/components/belge-studio-mobile-context";
import { useBelgeStudioTheme } from "@/hooks/use-belge-studio-theme";
import type { BelgeStudioFormViewControls } from "@/hooks/use-belge-studio-form-view";
import { BelgeStudioFormViewMenu } from "@/components/belge-studio-form-view-menu";
import {
  BelgeBackIcon,
  BelgeBlankFormIcon,
  BelgeClearIcon,
  BelgeDownloadPdfIcon,
  BelgeFormEditIcon,
  BelgeMoonIcon,
  BelgeOpenExternalIcon,
  BelgePreviewEyeIcon,
  BelgePrintIcon,
  BelgeResetIcon,
  BelgeShareIcon,
  BelgeSunIcon,
  BelgeUndoIcon,
} from "@/components/belge-studio-icons";

export interface BelgeStudioMobileActionsSheetProps {
  activeTab: "form" | "preview";
  onToggleTab: () => void;
  onReset: () => void;
  onClear: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onPrint: () => void;
  onShare?: () => void;
  onDownload: () => void;
  ready: boolean;
  downloading: boolean;
  downloadBlank: () => Promise<void>;
  blankDownloading: boolean;
  formView?: BelgeStudioFormViewControls;
}

/**
 * Belge Stüdyosu — Mobil "Belge İşlemleri" Çekmecesi (V1 Sözleşmesi)
 *
 * Hedef: Mobilde tüm ikincil ve birincil aksiyonları tek, erişilebilir alt çekmecede toplar.
 * Radix Dialog primitive tabanlı, alta sabit, safe-area destekli.
 */
export function BelgeStudioMobileActionsSheet({
  activeTab,
  onToggleTab,
  onReset,
  onClear,
  onUndo,
  canUndo,
  onPrint,
  onShare,
  onDownload,
  ready,
  downloading,
  downloadBlank,
  blankDownloading,
  formView,
}: BelgeStudioMobileActionsSheetProps) {
  const { drawerOpen, closeDrawer, triggerElement, preview, extraActions } = useBelgeStudioMobileContext();
  const { isDark, toggle: toggleTheme } = useBelgeStudioTheme();
  const [otherActionsOpen, setOtherActionsOpen] = useState(false);
  const [prevDrawerOpen, setPrevDrawerOpen] = useState(drawerOpen);
  const closeReasonRef = useRef<"inline-edit" | "share" | "print" | "default">("default");
  const timerRef = useRef<number | null>(null);

  if (prevDrawerOpen !== drawerOpen) {
    setPrevDrawerOpen(drawerOpen);
    if (!drawerOpen) {
      setOtherActionsOpen(false);
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleInlineEditClick = () => {
    closeReasonRef.current = "inline-edit";
    closeDrawer();
    preview.inlineEdit.setActive(!preview.inlineEdit.active);
  };

  const handleShareClick = () => {
    closeReasonRef.current = "share";
    closeDrawer();
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      onShare?.();
    }, 50);
  };

  const handlePrintClick = () => {
    closeReasonRef.current = "print";
    closeDrawer();
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      onPrint();
    }, 50);
  };

  const handleBlankClick = () => {
    closeDrawer();
    void downloadBlank();
  };

  return (
    <DialogPrimitive.Root
      open={drawerOpen}
      onOpenChange={(open) => {
        if (!open) closeDrawer();
      }}
    >
      <DialogPrimitive.Portal>
        {/* Karartılmış arka plan — backdrop-blur yok (D2) */}
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/60 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none"
        />

        <DialogPrimitive.Content
          data-testid="belge-mobile-actions-drawer"
          className="fixed inset-x-0 bottom-0 z-50 flex flex-col max-h-[min(85dvh,640px)] rounded-t-2xl border-t border-border bg-background shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom motion-reduce:animate-none"
          onCloseAutoFocus={(e) => {
            const reason = closeReasonRef.current;
            closeReasonRef.current = "default";
            if (reason === "inline-edit") {
              e.preventDefault();
              const activeTag = document.activeElement?.tagName;
              if (activeTag !== "INPUT" && activeTag !== "TEXTAREA") {
                const canvas = document.querySelector<HTMLElement>('[data-testid="belge-studio-preview-canvas"]');
                canvas?.focus();
              }
            } else if (reason === "share" || reason === "print") {
              e.preventDefault();
            } else if (triggerElement) {
              e.preventDefault();
              triggerElement.focus();
            }
          }}
        >
          {/* Tutma çizgisi (görsel kılavuz) */}
          <div className="flex justify-center pt-2.5 pb-1 shrink-0" aria-hidden="true">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Çekmece Başlığı ve Kapat Butonu */}
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-2 shrink-0">
            <div className="flex items-center gap-2">
              <BelgeFormEditIcon className="h-4 w-4 text-amber-500 shrink-0" />
              <DialogPrimitive.Title className="text-sm font-bold text-foreground">
                Belge İşlemleri
              </DialogPrimitive.Title>
            </div>
            <DialogPrimitive.Description className="sr-only">
              Belge düzenleme, paylaşım, indirme, yazdırma ve ayar seçenekleri
            </DialogPrimitive.Description>
            <DialogPrimitive.Close
              type="button"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer"
              aria-label="Çekmeceyi Kapat"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          {/* Kaydırılabilir İçerik Alanı */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 space-y-3">
            {/* 1. PDF Üzerinde Düzenle Kartı */}
            <button
              type="button"
              onClick={handleInlineEditClick}
              data-testid="belge-drawer-inline-edit-btn"
              className="w-full flex items-center justify-between p-3 rounded-xl border border-border/80 bg-secondary/30 hover:bg-secondary/60 text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                  <Edit3 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-foreground truncate">
                    {preview.inlineEdit.active ? "PDF Düzenlemeyi Bitir" : "PDF Üzerinde Düzenle"}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {preview.inlineEdit.active ? "Düzenleme modundan çık" : "Alanlara dokunarak düzenleyin"}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>

            {/* 2. Dört Eşit Kart (Paylaş, Yazdır, Boş Form, Görünüm) */}
            <div className="grid grid-cols-4 gap-2">
              {/* Paylaş */}
              <button
                type="button"
                onClick={handleShareClick}
                disabled={!ready || !onShare}
                data-testid="belge-mobile-menu-share-btn"
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-border/70 bg-card hover:bg-secondary/50 text-center transition cursor-pointer disabled:pointer-events-none disabled:opacity-40 min-h-[64px] gap-1"
                title="Belgeyi Paylaş"
              >
                <BelgeShareIcon className="h-5 w-5 text-amber-500 shrink-0" />
                <span className="text-[11px] font-semibold text-foreground leading-tight">Paylaş</span>
              </button>

              {/* Yazdır */}
              <button
                type="button"
                onClick={handlePrintClick}
                disabled={!ready}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-border/70 bg-card hover:bg-secondary/50 text-center transition cursor-pointer disabled:pointer-events-none disabled:opacity-40 min-h-[64px] gap-1"
                title="Belgeyi Yazdır"
              >
                <BelgePrintIcon className="h-5 w-5 text-foreground shrink-0" />
                <span className="text-[11px] font-semibold text-foreground leading-tight">Yazdır</span>
              </button>

              {/* Boş Form */}
              <button
                type="button"
                onClick={handleBlankClick}
                disabled={blankDownloading}
                data-testid="belge-mobile-blank-download-btn"
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-border/70 bg-card hover:bg-secondary/50 text-center transition cursor-pointer disabled:pointer-events-none disabled:opacity-40 min-h-[64px] gap-1"
                title="Boş form şablonu indir"
              >
                <BelgeBlankFormIcon className="h-5 w-5 text-foreground shrink-0" />
                <span className="text-[11px] font-semibold text-foreground leading-tight">Boş Form</span>
              </button>

              {/* Görünüm (Tema — tek dokunuşla aç/kapa, çekmece açık kalır) */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-pressed={isDark}
                aria-label={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
                data-testid="belge-mobile-theme-card"
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-border/70 bg-card hover:bg-secondary/50 text-center transition cursor-pointer min-h-[64px] gap-0.5"
                title={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
              >
                <div className="flex items-center justify-center">
                  {isDark ? (
                    <BelgeMoonIcon className="h-5 w-5 text-amber-400 shrink-0" />
                  ) : (
                    <BelgeSunIcon className="h-5 w-5 text-amber-600 shrink-0" />
                  )}
                </div>
                <span className="text-[11px] font-bold text-foreground leading-tight">Görünüm</span>
                <span className="text-[9px] text-muted-foreground leading-none">
                  {isDark ? "Koyu tema" : "Açık tema"}
                </span>
              </button>
            </div>

            {/* 3. Diğer İşlemler Katlanır Bölümü */}
            <div className="rounded-xl border border-border/70 bg-card/60 overflow-hidden">
              <button
                type="button"
                onClick={() => setOtherActionsOpen((prev) => !prev)}
                className="w-full flex items-center justify-between p-3 text-xs font-semibold text-foreground hover:bg-secondary/40 transition cursor-pointer"
                aria-expanded={otherActionsOpen}
              >
                <span>Diğer işlemler</span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    otherActionsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {otherActionsOpen && (
                <div className="border-t border-border/60 divide-y divide-border/50 text-xs">
                  {/* Belgelere Dön */}
                  <Link
                    href="/belgeler"
                    onClick={closeDrawer}
                    className="flex min-h-11 items-center gap-2.5 px-3 py-2 text-foreground hover:bg-secondary/50 transition font-medium"
                  >
                    <BelgeBackIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>Belgelere dön</span>
                  </Link>

                  {/* PDF'yi Yeni Sekmede Aç */}
                  {preview.pdfUrl ? (
                    <a
                      href={preview.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={closeDrawer}
                      className="flex min-h-11 items-center gap-2.5 px-3 py-2 text-foreground hover:bg-secondary/50 transition font-medium"
                    >
                      <BelgeOpenExternalIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>PDF&apos;yi yeni sekmede aç</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full flex min-h-11 items-center gap-2.5 px-3 py-2 text-muted-foreground opacity-50 cursor-not-allowed font-medium text-left"
                    >
                      <BelgeOpenExternalIcon className="h-4 w-4 shrink-0" />
                      <span>PDF&apos;yi yeni sekmede aç (hazırlanıyor)</span>
                    </button>
                  )}

                  {/* Form Görünümü (Form sekmesinde etkili - Orijinal BelgeStudioFormViewMenu eşdeğerliği) */}
                  {formView && (
                    <div data-testid="belge-drawer-form-view-container" className="px-3 py-2 bg-muted/20">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-semibold text-foreground">Form Görünümü</div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {activeTab === "form"
                              ? "Ölçek ve sığdırma seçenekleri"
                              : "Form sekmesinde kullanılabilir"}
                          </div>
                        </div>
                        <BelgeStudioFormViewMenu
                          mode={formView.mode}
                          manualScale={formView.manualScale}
                          density={formView.density}
                          appliedScale={formView.appliedScale}
                          fitStatus={formView.fitStatus}
                          onChooseScale={(scale) => {
                            formView.onChooseScale(scale);
                            closeDrawer();
                          }}
                          onToggleCompact={() => {
                            formView.onToggleCompact();
                            closeDrawer();
                          }}
                          onFit={() => {
                            formView.onFit();
                            closeDrawer();
                          }}
                          onReset={() => {
                            formView.onReset();
                            closeDrawer();
                          }}
                          disabled={activeTab !== "form"}
                          side="top"
                          align="end"
                          iconOnly={false}
                          className="h-8 text-xs px-2.5"
                        />
                      </div>
                    </div>
                  )}

                  {/* Ek Stüdyo Aksiyonları (Örnek: Ruhsat Dilekçesi "Örnek Veri") */}
                  {extraActions && (
                    <div className="px-3 py-2">
                      <div className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                        Belgeye Özel İşlemler
                      </div>
                      <div onClick={closeDrawer}>{extraActions}</div>
                    </div>
                  )}

                  {/* Sıfırla */}
                  <button
                    type="button"
                    onClick={() => {
                      closeDrawer();
                      onReset();
                    }}
                    className="w-full flex min-h-11 items-center gap-2.5 px-3 py-2 text-foreground hover:bg-secondary/50 transition font-medium text-left cursor-pointer"
                  >
                    <BelgeResetIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>Örnek verilere sıfırla</span>
                  </button>

                  {/* Temizle */}
                  <button
                    type="button"
                    onClick={() => {
                      closeDrawer();
                      onClear();
                    }}
                    className="w-full flex min-h-11 items-center gap-2.5 px-3 py-2 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400 transition font-medium text-left cursor-pointer"
                  >
                    <BelgeClearIcon className="h-4 w-4 shrink-0 text-current" />
                    <span>Tüm alanları temizle</span>
                  </button>

                  {/* Geri Al */}
                  <button
                    type="button"
                    disabled={!canUndo}
                    onClick={() => {
                      closeDrawer();
                      onUndo();
                    }}
                    className="w-full flex min-h-11 items-center gap-2.5 px-3 py-2 text-foreground hover:bg-secondary/50 transition font-medium text-left disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
                  >
                    <BelgeUndoIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>Son işlemi geri al</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 4. Sabit Taban: Birincil Aksiyonlar (Formu Düzenle & PDF İndir) */}
          <div className="flex items-center gap-2 border-t border-border/80 bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shrink-0">
            <button
              type="button"
              onClick={() => {
                closeDrawer();
                onToggleTab();
              }}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-2 text-xs font-bold text-foreground hover:border-amber-500/50 hover:bg-secondary/50 transition cursor-pointer"
            >
              {activeTab === "form" ? (
                <>
                  <BelgePreviewEyeIcon className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>PDF Önizle</span>
                </>
              ) : (
                <>
                  <BelgeFormEditIcon className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Formu Düzenle</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                closeDrawer();
                onDownload();
              }}
              disabled={!ready || downloading}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-amber-700 bg-amber-700 px-3 py-2 text-xs font-extrabold text-white shadow-sm shadow-amber-500/20 hover:border-amber-800 hover:bg-amber-800 dark:border-amber-500 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400 transition cursor-pointer disabled:pointer-events-none disabled:opacity-50"
            >
              <BelgeDownloadPdfIcon className="h-4 w-4 shrink-0" />
              <span>PDF İndir</span>
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
