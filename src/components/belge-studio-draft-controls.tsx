"use client";

import React from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import type { UseBelgeAutoDraftReturn } from "@/hooks/use-belge-auto-draft";
import { BELGE_UX_FLAGS } from "@/lib/belge-ux-config";

export interface BelgeStudioDraftControlsProps {
  draftApi: UseBelgeAutoDraftReturn;
}

/**
 * Belge Stüdyosu — Minimal Taslak Şeridi (V3)
 *
 * V3 Sözleşmesi:
 * - Normal kullanımda hiçbir izin / geri yükleme banner'ı gösterilmez.
 * - Yalnızca engellemeyen hata veya çakışma durumunda minimal bilgi sağlar.
 */
export function BelgeStudioDraftControls(_props: BelgeStudioDraftControlsProps) {
  // V3 kuralları: Üstte banner veya izin şeridi bulunmaz, durum üst barda tek rozetle gösterilir.
  return null;
}

/**
 * Belge Stüdyosu — Üst Bar Minimal Taslak Durum Rozeti (V3 Sözleşmesi)
 *
 * Kurallar:
 * 1. Başarılı depolama yazımından sonra: "✓ Kaydedildi"
 * 2. Yazım sürerken: Düşük vurgulu "Kaydediliyor…"
 * 3. Hata durumunda: "Kaydedilemedi" + "Tekrar dene"
 * 4. Çakışma durumunda: "Çakışma"
 * 5. Başlangıçta / boş durumda: Sessiz ve boş (yükseklik/başlık itmez).
 * 6. Açılır menü, taslak aç/kapat/duraklat/sil seçenekleri tamamen kaldırılmıştır.
 */
export function BelgeStudioDraftStatusBadge({ draftApi }: BelgeStudioDraftControlsProps) {
  if (!BELGE_UX_FLAGS.DRAFT) return null;

  const { lifecycleState, isSaving, errorMessage, retrySave } = draftApi;

  if (isSaving || lifecycleState === "saving") {
    return (
      <div
        data-testid="belge-draft-status-badge"
        className="inline-flex min-h-[36px] sm:min-h-[44px] items-center gap-1 px-1.5 sm:px-2 py-1 text-xs select-none"
        title="Taslak kaydediliyor"
      >
        <Loader2 className="h-3 w-3 animate-spin text-amber-500 shrink-0" />
        <span className="hidden sm:inline font-medium text-muted-foreground text-[11px]">
          Kaydediliyor…
        </span>
      </div>
    );
  }

  if (lifecycleState === "dirty") {
    return (
      <div
        data-testid="belge-draft-status-badge"
        className="inline-flex min-h-[36px] sm:min-h-[44px] items-center gap-1 px-1.5 sm:px-2 py-1 text-xs select-none"
      >
        <span className="hidden sm:inline font-medium text-muted-foreground/60 text-[11px]">
          Kaydediliyor…
        </span>
      </div>
    );
  }

  if (lifecycleState === "saved") {
    return (
      <div
        data-testid="belge-draft-status-badge"
        className="inline-flex min-h-[36px] sm:min-h-[44px] items-center gap-1 px-1.5 sm:px-2 py-1 text-xs select-none"
        title="Taslak bu tarayıcıda güvenle kaydedildi"
      >
        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-[11px] sm:text-xs">
          Kaydedildi
        </span>
        <span role="status" aria-live="polite" className="sr-only">
          Taslak kaydedildi
        </span>
      </div>
    );
  }

  if (lifecycleState === "save-error") {
    return (
      <div
        data-testid="belge-draft-status-badge"
        className="inline-flex min-h-[36px] sm:min-h-[44px] items-center gap-1 px-1.5 sm:px-2 py-1 text-xs text-destructive select-none"
        title={errorMessage || "Taslak kaydedilemedi"}
      >
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span className="font-semibold text-[11px]">Kaydedilemedi</span>
        <button
          type="button"
          onClick={retrySave}
          className="ml-1 underline text-[10px] font-bold text-destructive hover:opacity-85 cursor-pointer"
        >
          Tekrar dene
        </button>
      </div>
    );
  }

  if (lifecycleState === "conflict") {
    return (
      <div
        data-testid="belge-draft-status-badge"
        className="inline-flex min-h-[36px] sm:min-h-[44px] items-center gap-1 px-1.5 sm:px-2 py-1 text-xs text-amber-600 dark:text-amber-400 select-none"
        title="Başka bir sekmede taslak güncellendi"
      >
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span className="font-semibold text-[11px]">Çakışma</span>
      </div>
    );
  }

  // Varsayılan / booting / idle: Nötr ve sessiz boş eleman (düzeni ve yüksekliği bozmaz)
  return (
    <div
      data-testid="belge-draft-status-badge"
      className="inline-flex items-center text-xs text-muted-foreground/0 select-none"
      aria-hidden="true"
    />
  );
}
