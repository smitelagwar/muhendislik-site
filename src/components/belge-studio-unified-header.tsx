"use client";

import type { ReactNode, Ref } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, X } from "lucide-react";
import { BelgeBackIcon } from "@/components/belge-studio-icons";
import { BelgeStudioDraftStatusBadge } from "@/components/belge-studio-draft-controls";
import { BelgeStudioThemeToggle } from "@/components/belge-studio-theme-toggle";
import type { UseBelgeAutoDraftReturn } from "@/hooks/use-belge-auto-draft";

export type BelgeStudioUnifiedHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  isModal?: boolean;
  onClose?: () => void;
  draftApi: UseBelgeAutoDraftReturn;
  syncStatus: "synced" | "updating" | "error";
  toolbarSlotRef?: Ref<HTMLDivElement>;
  extraActions?: ReactNode;
  className?: string;
};

/**
 * Belge Stüdyosu — Tek Ortak Üst Bar (V3 Sözleşmesi)
 *
 * Yerleşim Sırası (Görsel ve DOM):
 * [Geri/Başlık/İkon] [Orta Slot: PDF Zoom & Navigasyon] [Ek Aksiyonlar] [✓ Kaydedildi] [gerekliyse Modal X] [TEMA ANAHTARI]
 *
 * Kurallar:
 * - Tema anahtarı üst barın EN SAĞINDA yer alır.
 * - Modal X varsa tema anahtarının SOLUNDA kalır.
 * - "Canlı Önizleme Hazır" yazısı ve yeşil nabız rozeti tamamen kaldırılmıştır.
 */
export function BelgeStudioUnifiedHeader({
  title,
  subtitle,
  icon,
  isModal = false,
  onClose,
  draftApi,
  syncStatus,
  toolbarSlotRef,
  extraActions,
  className,
}: BelgeStudioUnifiedHeaderProps) {
  return (
    <header
      data-testid="belge-studio-top-header"
      className={`shrink-0 flex items-center justify-between border-b border-border/80 bg-background/95 px-2 sm:px-3 py-1 sm:py-1.5 h-14 lg:h-16 box-border gap-1.5 sm:gap-2 flex-nowrap min-w-0 ${
        className || ""
      }`}
    >
      {/* Sol Bölge: Gezinme / Kapatma + Belge Kimliği (İkon, Başlık, Alt Başlık) */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
        {!isModal && (
          <nav aria-label="Belge stüdyosu gezinme" className="flex items-center shrink-0">
            <Link
              href="/belgeler"
              aria-label="Tüm belgelere dön"
              className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1 rounded-lg border border-border/70 bg-secondary/40 px-2 sm:px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:hover:text-amber-400"
            >
              <BelgeBackIcon className="h-4 w-4 shrink-0" />
              <span className="hidden min-[540px]:inline">Belgeler</span>
            </Link>
          </nav>
        )}

        {icon && (
          <span
            aria-hidden="true"
            className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0"
          >
            {icon}
          </span>
        )}

        <div className="min-w-0">
          {isModal ? (
            <h2
              className="text-xs sm:text-sm font-bold text-foreground leading-tight truncate max-w-[90px] min-[400px]:max-w-[140px] sm:max-w-none"
              title={title}
            >
              {title}
            </h2>
          ) : (
            <h1
              className="text-xs sm:text-sm font-bold text-foreground leading-tight truncate max-w-[90px] min-[400px]:max-w-[140px] sm:max-w-none"
              title={title}
            >
              {title}
            </h1>
          )}
          {subtitle && (
            <p
              className="text-[10px] text-muted-foreground hidden xl:block truncate"
              title={subtitle}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Orta Bölge: PDF Toolbar Portal Slotu (PreviewToolbar buraya createPortal ile yansıtılır) */}
      <div
        ref={toolbarSlotRef}
        data-testid="belge-unified-toolbar-slot"
        className="flex min-w-0 flex-1 items-center justify-center shrink"
      />

      {/* Sağ Bölge: Ek Aksiyonlar + Taslak Minimal Durum + Süreç İndikatörü + Modal Kapatma + TEMA ANAHTARI */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {extraActions}
        <BelgeStudioDraftStatusBadge draftApi={draftApi} />

        {syncStatus === "updating" && (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400"
            role="status"
          >
            <Loader2 className="h-3 w-3 animate-spin shrink-0" />
            <span className="hidden sm:inline">Derleniyor...</span>
          </span>
        )}

        {syncStatus === "error" && (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive"
            role="status"
          >
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span className="hidden sm:inline">Önizleme Hatası</span>
          </span>
        )}

        {/* Modal Kapanış (X) — V3: TEMA SWITCH'IN SOLUNDA */}
        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer"
            aria-label="Pencereyi Kapat"
            title="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* TEMA SWITCH — V3: ÜST BARIN GÖRSEL VE DOM OLARAK EN SAĞINDA */}
        <BelgeStudioThemeToggle />
      </div>
    </header>
  );
}
