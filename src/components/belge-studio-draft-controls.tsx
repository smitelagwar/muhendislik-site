/**
 * Belge Stüdyosu — Otomatik Taslak Kontrolleri ve Bildirim Şeridi (ASAMA_02)
 *
 * Erişilebilirlik ve UI Kuralları:
 * - Panel dışından (üst şerit olarak) erişilir; sol form gizliyken ve mobil PDF sekmesindeyken kaybolmaz.
 * - Küçük ve kompakt tasarımla PDF canvas alanını zıplatmaz / gereksiz kaydırma üretmez.
 * - Net data-testid seçicileriyle E2E testlerine hazırdır.
 * - 'Şifreli', 'buluta kaydedildi' gibi yanıltıcı ifadeler içermez; yerel tarayıcı depolamasını doğru anlatır.
 */

"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  Check,
  Clock,
  HardDrive,
  Info,
  Loader2,
  Save,
  X,
} from "lucide-react";
import type { UseBelgeAutoDraftReturn } from "@/hooks/use-belge-auto-draft";

export interface BelgeStudioDraftControlsProps {
  draftApi: UseBelgeAutoDraftReturn;
}

export function BelgeStudioDraftControls({ draftApi }: BelgeStudioDraftControlsProps) {
  const {
    lifecycleState,
    ageStatus,
    errorMessage,
    setConsent,
    restoreDraft,
    ignoreDraft,
    deleteDraftAction,
    dismissRestore,
    retrySave,
    resolveConflictWithRemote,
    resolveConflictWithLocal,
  } = draftApi;

  // 1. İzin Bekleme Şeridi (consent-pending)
  if (lifecycleState === "consent-pending") {
    return (
      <div
        role="region"
        aria-label="Taslak kayıt tercihi"
        data-testid="belge-draft-consent-banner"
        className="shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-foreground flex flex-wrap items-center justify-between gap-2 transition-all"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Save className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            Form taslağı otomatik kaydedilsin mi? (Tarayıcınızda yerel tutulur)
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            data-testid="belge-draft-consent-device"
            onClick={() => setConsent("device")}
            className="rounded bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400 transition"
          >
            Bu cihazda kaydet
          </button>
          <button
            type="button"
            data-testid="belge-draft-consent-session"
            onClick={() => setConsent("session")}
            className="rounded border border-amber-600/40 bg-background/80 px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-secondary transition"
          >
            Yalnız bu sekmede
          </button>
          <button
            type="button"
            data-testid="belge-draft-consent-dismiss"
            onClick={() => setConsent("dismissed")}
            className="rounded px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition"
          >
            Kaydetme
          </button>
        </div>
      </div>
    );
  }

  // 2. Taslak Geri Yükleme Kararı Şeridi (restore-decision)
  if (lifecycleState === "restore-decision") {
    return (
      <div
        role="alert"
        aria-live="polite"
        data-testid="belge-draft-restore-banner"
        className="shrink-0 border-b border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs text-foreground flex flex-wrap items-center justify-between gap-2 transition-all"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            Kaydedilmiş taslak bulundu.
            {ageStatus?.isStale && (
              <span className="ml-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                (30 günden eski olabilir)
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <button
            type="button"
            data-testid="belge-draft-restore-confirm"
            onClick={restoreDraft}
            className="rounded bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 transition"
          >
            Taslağı Yükle
          </button>
          <button
            type="button"
            data-testid="belge-draft-restore-ignore"
            onClick={ignoreDraft}
            className="rounded border border-border bg-background/80 px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-secondary transition"
          >
            Bu Formla Devam Et
          </button>
          <button
            type="button"
            data-testid="belge-draft-restore-delete"
            onClick={() => {
              if (window.confirm("Kaydedilmiş taslak silinecektir. Emin misiniz?")) {
                deleteDraftAction();
              }
            }}
            className="rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] font-medium text-red-600 dark:text-red-400 hover:bg-red-500/20 transition"
          >
            Taslağı Sil
          </button>
          <button
            type="button"
            data-testid="belge-draft-restore-dismiss"
            onClick={dismissRestore}
            className="rounded p-1 text-muted-foreground hover:text-foreground transition"
            title="Şimdilik Kapat (Taslağı saklar, formu üzerine yazmaz)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // 3. Çoklu Sekme Çakışma Şeridi (conflict)
  if (lifecycleState === "conflict") {
    return (
      <div
        role="alert"
        aria-live="assertive"
        data-testid="belge-draft-conflict-banner"
        className="shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-foreground flex flex-wrap items-center justify-between gap-2 transition-all"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            Başka bir sekmede bu belgenin taslağı güncellendi.
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <button
            type="button"
            data-testid="belge-draft-conflict-reload"
            onClick={resolveConflictWithRemote}
            className="rounded bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-zinc-950 transition"
          >
            Diğer Sekmedekini Yükle
          </button>
          <button
            type="button"
            data-testid="belge-draft-conflict-takeover"
            onClick={resolveConflictWithLocal}
            className="rounded border border-border bg-background/80 px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-secondary transition"
          >
            Bu Sekmedekiyle Devam Et
          </button>
        </div>
      </div>
    );
  }

  // 4. Hata Şeridi (save-error)
  if (lifecycleState === "save-error") {
    return (
      <div
        role="alert"
        aria-live="assertive"
        data-testid="belge-draft-error-banner"
        className="shrink-0 border-b border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-foreground flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
          <span className="text-[11px] text-red-700 dark:text-red-300">
            {errorMessage || "Taslak kaydedilemedi (Depolama dolu veya sınır aşıldı). Form ve PDF çalışmaya devam eder."}
          </span>
        </div>
        <button
          type="button"
          data-testid="belge-draft-retry"
          onClick={retrySave}
          className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-red-700 transition shrink-0"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  // 4. Normal Durum: Kompakt Durum / Menü Alanı (Yalnız header/toolbar için minimal veya null)
  return null;
}

/**
 * Üst çubukta veya toolbar'da kompakt durum rozeti gösterici
 */
export function BelgeStudioDraftStatusBadge({ draftApi }: BelgeStudioDraftControlsProps) {
  const { lifecycleState, storageMode, savedAt, isSaving, isPaused, deleteDraftAction, togglePause } = draftApi;
  const [open, setOpen] = useState(false);

  if (storageMode === "none") {
    return null;
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        data-testid="belge-draft-status-badge"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-background/80 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground transition"
        title="Otomatik taslak durumu ve ayarları"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-2.5 w-2.5 animate-spin text-amber-500" />
            <span className="font-medium">Kaydediliyor...</span>
          </>
        ) : lifecycleState === "saved" ? (
          <>
            <Check className="h-2.5 w-2.5 text-emerald-500" />
            <span className="font-medium">
              Taslak {storageMode === "device" ? "(Cihaz)" : "(Sekme)"}
            </span>
          </>
        ) : isPaused ? (
          <>
            <Clock className="h-2.5 w-2.5 text-amber-500" />
            <span className="font-medium">Kayıt Duraklatıldı</span>
          </>
        ) : (
          <>
            <HardDrive className="h-2.5 w-2.5 text-muted-foreground" />
            <span className="font-medium">Taslak</span>
          </>
        )}
      </button>

      {open && (
        <div
          data-testid="belge-draft-menu-popup"
          className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-border bg-popover p-1 shadow-lg text-xs"
        >
          <div className="px-2 py-1 border-b border-border/60 text-[10px] text-muted-foreground">
            Taslak: {storageMode === "device" ? "Bu cihazda" : "Yalnız bu sekmede"}
            {savedAt ? ` (${new Date(savedAt).toLocaleTimeString()})` : ""}
          </div>
          <button
            type="button"
            data-testid="belge-draft-toggle-pause"
            onClick={() => {
              togglePause();
              setOpen(false);
            }}
            className="w-full text-left rounded px-2 py-1.5 hover:bg-secondary text-foreground text-[11px]"
          >
            {isPaused ? "Otomatik Kaydı Devam Ettir" : "Otomatik Kaydı Duraklat"}
          </button>
          <button
            type="button"
            data-testid="belge-draft-delete-btn"
            onClick={() => {
              if (window.confirm("Bu belgenin taslağını silmek istediğinize emin misiniz?")) {
                deleteDraftAction();
              }
              setOpen(false);
            }}
            className="w-full text-left rounded px-2 py-1.5 hover:bg-red-500/10 text-red-600 dark:text-red-400 text-[11px]"
          >
            Taslağı Sil
          </button>
        </div>
      )}
    </div>
  );
}
