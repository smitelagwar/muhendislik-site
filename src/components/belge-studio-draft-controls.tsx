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

import React, { useEffect, useId, useRef, useState } from "react";
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
import { BELGE_UX_FLAGS } from "@/lib/belge-ux-config";

export interface BelgeStudioDraftControlsProps {
  draftApi: UseBelgeAutoDraftReturn;
}

export function BelgeStudioDraftControls({ draftApi }: BelgeStudioDraftControlsProps) {
  if (!BELGE_UX_FLAGS.DRAFT) return null;

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
        className="[&_button]:min-h-11 shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-foreground flex flex-wrap items-center justify-between gap-2 transition-all"
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
        className="[&_button]:min-h-11 shrink-0 border-b border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs text-foreground flex flex-wrap items-center justify-between gap-2 transition-all"
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
        className="[&_button]:min-h-11 shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-foreground flex flex-wrap items-center justify-between gap-2 transition-all"
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
        className="[&_button]:min-h-11 shrink-0 border-b border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-foreground flex items-center justify-between gap-2"
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
 * Üst çubukta veya toolbar'da kompakt durum rozeti gösterici (F09, F10, F14)
 * - storageMode === "none" durumunda da görünür; kullanıcı sonradan kaydı açabilir.
 * - isPaused durumu saved durumundan önce değerlendirilir (R07, R11 düzeltmesi).
 * - Açılır menü: Kaydı aç, modu değiştir, duraklat/devam ettir, kalıcı kapat, sil, retry.
 * - Dokunma hedefi (touch target) >= 44px ve klavye/dış tıklama ile güvenli kapanış.
 */
export function BelgeStudioDraftStatusBadge({ draftApi }: BelgeStudioDraftControlsProps) {

  const {
    lifecycleState,
    storageMode,
    savedAt,
    isSaving,
    isPaused,
    errorMessage,
    deleteDraftAction,
    togglePause,
    setConsent,
    retrySave,
  } = draftApi;
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popupId = useId();

  // Dışa tıklama veya Escape basıldığında menüyü kapat
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        containerRef.current?.querySelector<HTMLButtonElement>('[data-testid="belge-draft-status-badge"]')?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!BELGE_UX_FLAGS.DRAFT) return null;
  // Rozet görünümü ve metin önceliği:
  // 1. isSaving -> "Kaydediliyor..."
  // 2. isPaused -> "Kayıt Duraklatıldı" (saved durumunu gölgeler)
  // 3. lifecycleState === "save-error" -> "Kayıt Hatası"
  // 4. storageMode === "none" || lifecycleState === "disabled" -> "Taslak (Kapalı)"
  // 5. lifecycleState === "saved" -> "Taslak (Cihaz)" veya "Taslak (Sekme)"
  // 6. varsayılan -> "Taslak"
  let badgeContent: React.ReactNode;

  if (isSaving) {
    badgeContent = (
      <>
        <Loader2 className="h-3 w-3 animate-spin text-amber-500 shrink-0" />
        <span className="font-medium text-foreground hidden sm:inline">Kaydediliyor...</span>
      </>
    );
  } else if (isPaused) {
    badgeContent = (
      <>
        <Clock className="h-3 w-3 text-amber-500 shrink-0" />
        <span className="font-medium text-amber-600 dark:text-amber-400 hidden sm:inline">Kayıt Duraklatıldı</span>
      </>
    );
  } else if (lifecycleState === "save-error") {
    badgeContent = (
      <>
        <AlertCircle className="h-3 w-3 text-red-500 shrink-0" />
        <span className="font-medium text-red-600 dark:text-red-400 hidden sm:inline">Kayıt Hatası</span>
      </>
    );
  } else if (storageMode === "none" || lifecycleState === "disabled") {
    badgeContent = (
      <>
        <HardDrive className="h-3 w-3 text-muted-foreground/70 shrink-0" />
        <span className="font-medium text-muted-foreground hidden sm:inline">Taslak (Kapalı)</span>
      </>
    );
  } else if (lifecycleState === "saved") {
    badgeContent = (
      <>
        <Check className="h-3 w-3 text-emerald-500 shrink-0" />
        <span className="font-medium text-foreground hidden sm:inline">
          Taslak {storageMode === "device" ? "(Cihaz)" : "(Sekme)"}
        </span>
      </>
    );
  } else {
    badgeContent = (
      <>
        <HardDrive className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="font-medium text-foreground hidden sm:inline">Taslak</span>
      </>
    );
  }

  const isClosed = storageMode === "none" || lifecycleState === "disabled";

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <span role="status" aria-live="polite" className="sr-only">{isPaused ? "Kayıt duraklatıldı" : lifecycleState === "saved" ? "Taslak kaydedildi" : lifecycleState === "save-error" ? "Taslak kayıt hatası" : ""}</span>
      <button
        type="button"
        data-testid="belge-draft-status-badge"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={open ? popupId : undefined}
        aria-label="Otomatik taslak durumu ve ayarları"
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 sm:gap-1.5 rounded-full border border-border/80 bg-background/90 px-2 sm:px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer"
        title="Otomatik taslak durumu ve ayarları"
      >
        {badgeContent}
      </button>

      {open && (
        <div
          data-testid="belge-draft-menu-popup"
          id={popupId}
          role="region"
          aria-label="Taslak ayarları"
          className="absolute right-0 top-full mt-1.5 z-50 w-56 max-w-[calc(100vw-1rem)] rounded-xl border border-border bg-popover text-popover-foreground p-1.5 shadow-xl text-xs space-y-1"
        >
          {/* Durum Özeti */}
          <div className="px-2.5 py-1.5 border-b border-border/60 text-[11px] text-muted-foreground">
            {isClosed ? (
              <span className="font-medium text-muted-foreground">Taslak kaydı: Kapalı</span>
            ) : (
              <div>
                <span className="font-semibold text-foreground">
                  {storageMode === "device" ? "Cihaz Depolaması" : "Sekme Depolaması"}
                </span>
                {savedAt && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Son kayıt: {new Date(savedAt).toLocaleTimeString()}
                  </div>
                )}
              </div>
            )}
            {lifecycleState === "save-error" && errorMessage && (
              <div className="text-[10px] text-red-600 dark:text-red-400 mt-1 font-medium">
                {errorMessage}
              </div>
            )}
          </div>

          {/* Kapalıysa: Kaydı açma seçenekleri */}
          {isClosed ? (
            <>
              <button
                type="button"
                data-testid="belge-draft-enable-device"
                onClick={() => {
                  setConsent("device");
                  setOpen(false);
                }}
                className="w-full text-left rounded-lg px-2.5 py-2 hover:bg-secondary text-foreground text-xs min-h-[44px] flex items-center transition"
              >
                Bu cihazda kaydı aç
              </button>
              <button
                type="button"
                data-testid="belge-draft-enable-session"
                onClick={() => {
                  setConsent("session");
                  setOpen(false);
                }}
                className="w-full text-left rounded-lg px-2.5 py-2 hover:bg-secondary text-foreground text-xs min-h-[44px] flex items-center transition"
              >
                Yalnız bu sekmede kaydı aç
              </button>
              {savedAt !== null && (
                <button type="button" data-testid="belge-draft-delete-disabled" className="min-h-11 w-full rounded-lg px-2.5 text-left text-red-600" onClick={() => {
                  if (window.confirm("Otomatik kayıt kapalı kalacak; saklanan taslak silinsin mi?")) deleteDraftAction();
                  setOpen(false);
                }}>Saklanan taslağı sil</button>
              )}
            </>
          ) : (
            <>
              {/* Duraklat / Devam Ettir */}
              <button
                type="button"
                data-testid="belge-draft-toggle-pause"
                onClick={() => {
                  togglePause();
                  setOpen(false);
                }}
                className="w-full text-left rounded-lg px-2.5 py-2 hover:bg-secondary text-foreground text-xs min-h-[44px] flex items-center transition"
              >
                {isPaused ? "Otomatik Kaydı Devam Ettir" : "Otomatik Kaydı Duraklat"}
              </button>

              {/* Mod Geçişi */}
              {storageMode === "device" ? (
                <button
                  type="button"
                  data-testid="belge-draft-switch-session"
                  onClick={() => {
                    setConsent("session");
                    setOpen(false);
                  }}
                  className="w-full text-left rounded-lg px-2.5 py-2 hover:bg-secondary text-foreground text-xs min-h-[44px] flex items-center transition"
                >
                  Yalnız bu sekmeye geçir
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="belge-draft-switch-device"
                  onClick={() => {
                    setConsent("device");
                    setOpen(false);
                  }}
                  className="w-full text-left rounded-lg px-2.5 py-2 hover:bg-secondary text-foreground text-xs min-h-[44px] flex items-center transition"
                >
                  Bu cihaza geçir
                </button>
              )}

              {/* Hata durumunda Retry */}
              {lifecycleState === "save-error" && (
                <button
                  type="button"
                  data-testid="belge-draft-retry-btn"
                  onClick={() => {
                    retrySave();
                    setOpen(false);
                  }}
                  className="w-full text-left rounded-lg px-2.5 py-2 hover:bg-red-500/10 text-red-600 dark:text-red-400 text-xs min-h-[44px] flex items-center transition font-semibold"
                >
                  Tekrar Dene
                </button>
              )}

              {/* Kalıcı Otomatik Kaydı Kapat (Opt-out) */}
              <button
                type="button"
                data-testid="belge-draft-disable-btn"
                onClick={() => {
                  setConsent("dismissed");
                  setOpen(false);
                }}
                className="w-full text-left rounded-lg px-2.5 py-2 hover:bg-secondary text-muted-foreground hover:text-foreground text-xs min-h-[44px] flex items-center transition"
              >
                Otomatik Kaydı Kapat
              </button>

              {/* Taslağı Sil */}
              <button
                type="button"
                data-testid="belge-draft-delete-btn"
                onClick={() => {
                  if (typeof window !== "undefined" && window.confirm("Bu belgenin taslağını silmek istediğinize emin misiniz?")) {
                    deleteDraftAction();
                  }
                  setOpen(false);
                }}
                className="w-full text-left rounded-lg px-2.5 py-2 hover:bg-red-500/10 text-red-600 dark:text-red-400 text-xs min-h-[44px] flex items-center transition font-medium"
              >
                Taslağı Sil
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
