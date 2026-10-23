/**
 * Belge Stüdyosu — Güvenilir Otomatik Taslak Kancası (ASAMA_02)
 *
 * Mimari Sözleşme:
 * 1. formData tek doğruluk kaynağıdır (single source of truth).
 * 2. İzin başlangıçta kapalıdır; ilk gerçek kullanıcı düzenlemesinde sorulur.
 * 3. initialData veya ilk render/hydration tek başına ASLA kaydedilmez.
 * 4. 800ms trailing debounce + snapshot karşılaştırma ile gereksiz yazmalar önlenir.
 * 5. Kaydedilmiş taslak bulunduğunda açık kullanıcı kararı (Restore/Ignore/Delete/Dismiss) beklenir.
 * 6. "Şimdilik Kapat" (dismissRestore) eski taslağı depoda SAKLAR, ancak mevcut formu onun üzerine yazmaz (autosave duraklatılır).
 * 7. Reset/Clear/Undo gibi bilinçli eylemler yeni snapshot olarak kaydedilir.
 * 8. 64 KiB veya kota hatalarında form/PDF kesintiye uğramaz; açık hata gösterilir.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BELGE_UX_FLAGS,
  BELGE_UX_LIMITS,
  DOCUMENT_EDITABLE_FIELDS,
  getConsentKeyForMode,
  getKeyForMode,
  type AutoDraftLifecycleState,
  type BelgeDocumentId,
  type DraftConsentDecision,
  type DraftStorageMode,
} from "@/lib/belge-ux-config";
import {
  StorageLike,
  BelgeDraftEnvelope,
  compareWriterRevision,
  createDraftEnvelope,
  deleteDraft,
  getSafeBrowserStorage,
  loadDraft,
  loadDraftConsent,
  saveDraft,
  saveDraftConsent,
  type DraftAgeStatus,
} from "@/lib/belge-draft-storage";

export interface UseBelgeAutoDraftOptions<T extends object> {
  documentId: BelgeDocumentId;
  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
  initialData: T;
  setUndoData?: React.Dispatch<React.SetStateAction<T | null>>;
  enabled?: boolean;
  storageOverride?: StorageLike; // Testler ve DI için
}

export interface UseBelgeAutoDraftReturn {
  lifecycleState: AutoDraftLifecycleState;
  storageMode: DraftStorageMode;
  savedAt: number | null;
  ageStatus: DraftAgeStatus | null;
  errorMessage: string | null;
  isSaving: boolean;
  isPaused: boolean;
  pendingDraft: BelgeDraftEnvelope | null;

  // Kullanıcı eylemleri
  setConsent: (decision: DraftConsentDecision) => void;
  restoreDraft: () => void;
  ignoreDraft: () => void;
  deleteDraftAction: () => void;
  dismissRestore: () => void;
  retrySave: () => void;
  togglePause: () => void;
  markFormMutated: () => void;
  resolveConflictWithRemote: () => void;
  resolveConflictWithLocal: () => void;
}

export function useBelgeAutoDraft<T extends object>({
  documentId,
  formData,
  setFormData,
  setUndoData,
  enabled = BELGE_UX_FLAGS.DRAFT,
  storageOverride,
}: UseBelgeAutoDraftOptions<T>): UseBelgeAutoDraftReturn {
  const [lifecycleState, setLifecycleState] = useState<AutoDraftLifecycleState>(() =>
    !enabled ? "disabled" : "booting"
  );
  const [storageMode, setStorageMode] = useState<DraftStorageMode>("none");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [ageStatus, setAgeStatus] = useState<DraftAgeStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<BelgeDraftEnvelope | null>(null);

  // Sekmeye özel benzersiz yazar kimliği
  const writerIdRef = useRef<string>("");

  useEffect(() => {
    if (!writerIdRef.current) {
      writerIdRef.current = `w_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }
  }, []);

  // Monotonik revizyon sayacı
  const revisionRef = useRef<number>(1);

  // Gerçek kullanıcı düzenlemesi yapıldı mı bayrağı (initialData'nın kaydedilmesini engeller)
  const hasUserMutatedRef = useRef(false);

  // Silinmiş taslak dirilme koruması
  const isDeletedRef = useRef(false);

  // Çoklu sekme kanalı
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // En son başarıyla depoya yazılan veya restore edilen form snapshot'ı
  const lastSavedSnapshotRef = useRef<string>("");

  // Debounce zamanlayıcısı ve yarış durumu (race condition) koruması
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generationRef = useRef<number>(0);

  // En güncel formData referansı (pagehide / unmount sırasında okumak için)
  const latestFormDataRef = useRef<T>(formData);
  useEffect(() => {
    latestFormDataRef.current = formData;
  }, [formData]);

  // Aktif depolama motorunu çözer
  const resolveStorage = useCallback(
    (mode: DraftStorageMode): StorageLike | null => {
      if (storageOverride) return storageOverride;
      if (mode === "none") return null;
      return getSafeBrowserStorage(mode);
    },
    [storageOverride]
  );

  // Çoklu sekme: BroadcastChannel ve storage event dinleyicileri
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. BroadcastChannel
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(`belgeler:ux:draft:${documentId}`);
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        const msg = event.data;
        if (!msg || typeof msg !== "object") return;
        if (msg.documentId !== documentId) return;

        if (msg.type === "DRAFT_SAVED" && msg.writerId !== writerIdRef.current) {
          generationRef.current += 1;
          if (debounceTimerRef.current !== null) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
          }
          const storage = resolveStorage("device");
          if (storage) {
            const loadRes = loadDraft(storage, "device", documentId);
            if (loadRes.ok && loadRes.draft) {
              setPendingDraft(loadRes.draft);
              setLifecycleState("conflict");
            }
          }
        } else if (msg.type === "DRAFT_DELETED" && msg.writerId !== writerIdRef.current) {
          generationRef.current += 1;
          if (debounceTimerRef.current !== null) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
          }
          isDeletedRef.current = true;
          setPendingDraft(null);
          setLifecycleState("enabled-idle");
        }
      };
    }

    // 2. Storage event
    const handleStorage = (e: StorageEvent) => {
      // 2.1 İzin senkronizasyonu
      if (e.key === getConsentKeyForMode("device")) {
        if (e.newValue === "device") {
          setStorageMode("device");
          setLifecycleState((prev) => (prev === "consent-pending" ? "enabled-idle" : prev));
        } else if (e.newValue === "dismissed") {
          setStorageMode("none");
          setLifecycleState("disabled");
        }
        return;
      }

      // 2.2 Taslak senkronizasyonu
      if (e.key === getKeyForMode("device", documentId)) {
        generationRef.current += 1;
        if (debounceTimerRef.current !== null) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }

        if (e.newValue === null) {
          isDeletedRef.current = true;
          setPendingDraft(null);
          setLifecycleState("enabled-idle");
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed?.writerId && parsed.writerId !== writerIdRef.current) {
              const storage = resolveStorage("device");
              if (storage) {
                const loadRes = loadDraft(storage, "device", documentId);
                if (loadRes.ok && loadRes.draft) {
                  setPendingDraft(loadRes.draft);
                  setLifecycleState("conflict");
                }
              }
            }
          } catch {
            // JSON ayrıştırma hatası
          }
        }
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
        broadcastChannelRef.current = null;
      }
    };
  }, [documentId, resolveStorage]);

  // 1. Başlangıç / Bootstrapping — Mount anında depolamayı kontrol et
  useEffect(() => {
    if (!enabled) return;

    const timer = setTimeout(() => {
      const devStorage = resolveStorage("device");
      const sessStorage = resolveStorage("session");

      let effectiveMode: DraftStorageMode = "none";
      let foundConsent: DraftConsentDecision | null = null;

      if (sessStorage) {
        const sessConsent = loadDraftConsent(sessStorage, "session");
        if (sessConsent === "session") {
          effectiveMode = "session";
          foundConsent = "session";
        }
      }

      if (effectiveMode === "none" && devStorage) {
        const devConsent = loadDraftConsent(devStorage, "device");
        if (devConsent === "device") {
          effectiveMode = "device";
          foundConsent = "device";
        } else if (devConsent === "dismissed") {
          foundConsent = "dismissed";
        }
      }

      setStorageMode(effectiveMode);

      // Eğer kayıtlı taslak varsa restore kararını bekle
      const targetStorage = resolveStorage(effectiveMode !== "none" ? effectiveMode : "device");
      if (targetStorage) {
        const loadRes = loadDraft(
          targetStorage,
          effectiveMode !== "none" ? effectiveMode : "device",
          documentId
        );
        if (loadRes.ok && loadRes.draft) {
          // Taslak mevcut! Kullanıcı onayını bekle
          setPendingDraft(loadRes.draft);
          setSavedAt(loadRes.draft.savedAt);
          setAgeStatus(loadRes.ageStatus);
          setLifecycleState("restore-decision");
          return;
        }
      }

      // Taslak yoksa izin durumuna göre bekle
      if (foundConsent === "dismissed") {
        setLifecycleState("disabled");
      } else if (effectiveMode !== "none") {
        setLifecycleState("enabled-idle");
      } else {
        setLifecycleState("disabled");
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [documentId, enabled, resolveStorage]);

  // Taslağı depoya kaydeden çekirdek fonksiyon
  const performSave = useCallback(
    (targetFormData: T, currentStorageMode: DraftStorageMode, isTakeover = false) => {
      let effectiveCurrentMode = currentStorageMode;
      if (effectiveCurrentMode === "none") {
        const devStorage = resolveStorage("device");
        if (devStorage && loadDraftConsent(devStorage, "device") === "device") {
          effectiveCurrentMode = "device";
          setStorageMode("device");
        }
      }
      if (!enabled || effectiveCurrentMode === "none") return;
      const storage = resolveStorage(effectiveCurrentMode);
      if (!storage) return;

      // Yalnızca bu belgenin düzenlenebilir alanlarını filtrele (İstifa PDF-only statik etiketlerini vb. dışla)
      const editableFields = DOCUMENT_EDITABLE_FIELDS[documentId] ?? [];
      const snapshotValues: Record<string, string> = {};
      const rawFormObj = targetFormData as Record<string, unknown>;
      for (const field of editableFields) {
        const val = rawFormObj[field];
        snapshotValues[field] = typeof val === "string" ? val : String(val ?? "");
      }

      const serializedCurrent = JSON.stringify(snapshotValues);
      if (serializedCurrent === lastSavedSnapshotRef.current && !isTakeover) {
        // Veri değişmemiş, gereksiz storage I/O atla
        setIsSaving(false);
        setLifecycleState("saved");
        return;
      }

      // Cihaz modunda çoklu sekme çakışma ön kontrolü
      if (!isTakeover && effectiveCurrentMode === "device") {
        const inStore = loadDraft(storage, "device", documentId);
        if (inStore.ok && inStore.draft) {
          const conflict = compareWriterRevision(
            inStore.draft,
            writerIdRef.current,
            revisionRef.current
          );
          if (conflict.isConflict) {
            setIsSaving(false);
            setPendingDraft(inStore.draft);
            setLifecycleState("conflict");
            return;
          }
        }
      }

      setIsSaving(true);
      setLifecycleState("saving");

      revisionRef.current += 1;
      const envelopeResult = createDraftEnvelope({
        documentId,
        values: snapshotValues,
        writerId: writerIdRef.current,
        revision: revisionRef.current,
        savedAt: Date.now(),
      });

      if (!envelopeResult.ok) {
        setIsSaving(false);
        setErrorMessage(envelopeResult.details);
        setLifecycleState("save-error");
        return;
      }

      const saveResult = saveDraft(storage, effectiveCurrentMode, envelopeResult.envelope);

      setIsSaving(false);
      if (!saveResult.ok) {
        setErrorMessage(saveResult.details);
        setLifecycleState("save-error");
      } else {
        lastSavedSnapshotRef.current = serializedCurrent;
        setSavedAt(envelopeResult.envelope.savedAt);
        setErrorMessage(null);
        setLifecycleState("saved");
        isDeletedRef.current = false;

        // Çoklu sekmeleri bilgilendir
        if (broadcastChannelRef.current && effectiveCurrentMode === "device") {
          try {
            broadcastChannelRef.current.postMessage({
              type: "DRAFT_SAVED",
              documentId,
              writerId: writerIdRef.current,
              revision: revisionRef.current,
              savedAt: envelopeResult.envelope.savedAt,
            });
          } catch {
            // postMessage hatası sessizce yutulur
          }
        }
      }
    },
    [documentId, enabled, resolveStorage]
  );

  // 2. Trailing Debounce ile Değişiklikleri İzleme
  useEffect(() => {
    // Form henüz kullanıcı tarafından değiştirilmediyse veya pasif/askıdaysa kaydetme
    if (!hasUserMutatedRef.current) return;
    if (isPaused) return;
    if (lifecycleState === "restore-decision" || lifecycleState === "conflict") return;

    // Eğer henüz izin verilmemişse kayıt başlatma (izin sorusu markFormMutated içinde yönetilir)
    if (storageMode === "none") {
      return;
    }

    // Debounce zamanlayıcısını başlat (800ms)
    generationRef.current += 1;
    const currentGen = generationRef.current;

    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (currentGen !== generationRef.current) return;
      performSave(latestFormDataRef.current, storageMode);
    }, BELGE_UX_LIMITS.AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [formData, isPaused, lifecycleState, performSave, resolveStorage, storageMode]);

  // 3. Pagehide / visibilitychange anında bekleyen değişikliği best-effort kaydetme
  useEffect(() => {
    if (typeof window === "undefined") return;

    const flushPending = () => {
      if (
        isDeletedRef.current ||
        !hasUserMutatedRef.current ||
        isPaused ||
        storageMode === "none" ||
        lifecycleState === "restore-decision" ||
        lifecycleState === "conflict"
      ) {
        return;
      }
      performSave(latestFormDataRef.current, storageMode);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        flushPending();
      }
    };

    window.addEventListener("pagehide", flushPending);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("pagehide", flushPending);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isPaused, lifecycleState, performSave, storageMode]);

  // --- KULLANICI EYLEMLERİ ---

  const markFormMutated = useCallback(() => {
    hasUserMutatedRef.current = true;
    if (storageMode === "none") {
      const devStorage = resolveStorage("device");
      const devConsent = devStorage ? loadDraftConsent(devStorage, "device") : null;
      if (devConsent === "device") {
        setStorageMode("device");
        setLifecycleState("enabled-idle");
      } else if (devConsent !== "dismissed") {
        setLifecycleState("consent-pending");
      }
    }
  }, [resolveStorage, storageMode]);

  const setConsent = useCallback(
    (decision: DraftConsentDecision) => {
      if (decision === "device") {
        const storage = resolveStorage("device");
        if (storage) saveDraftConsent(storage, "device", "device");
        setStorageMode("device");
        setLifecycleState("enabled-idle");
        // Bekleyen değişikliği hemen kaydet
        if (hasUserMutatedRef.current) {
          performSave(latestFormDataRef.current, "device");
        }
      } else if (decision === "session") {
        const storage = resolveStorage("session");
        if (storage) saveDraftConsent(storage, "session", "session");
        setStorageMode("session");
        setLifecycleState("enabled-idle");
        if (hasUserMutatedRef.current) {
          performSave(latestFormDataRef.current, "session");
        }
      } else {
        // "dismissed" (Kaydetme)
        const storage = resolveStorage("device");
        if (storage) saveDraftConsent(storage, "device", "dismissed");
        setStorageMode("none");
        setLifecycleState("disabled");
        if (debounceTimerRef.current !== null) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
      }
    },
    [performSave, resolveStorage]
  );

  const restoreDraft = useCallback(() => {
    if (!pendingDraft) return;

    // Tek atomik setFormData (mevcut statik/etiket alanlarını koruyarak)
    if (setUndoData) {
      setUndoData({ ...latestFormDataRef.current });
    }

    setFormData((prev) => ({
      ...prev,
      ...(pendingDraft.values as unknown as T),
    }));
    lastSavedSnapshotRef.current = JSON.stringify(pendingDraft.values);
    hasUserMutatedRef.current = true;
    setSavedAt(pendingDraft.savedAt);
    setPendingDraft(null);
    setLifecycleState("saved");
  }, [pendingDraft, setFormData, setUndoData]);

  const ignoreDraft = useCallback(() => {
    // Taslağı yüklemeden mevcut formla devam et
    setPendingDraft(null);
    setLifecycleState(storageMode !== "none" ? "enabled-idle" : "disabled");
  }, [storageMode]);

  const deleteDraftAction = useCallback(() => {
    isDeletedRef.current = true;
    const currentMode = storageMode !== "none" ? storageMode : "device";
    const storage = resolveStorage(currentMode);
    if (storage) {
      deleteDraft(storage, currentMode, documentId);
    }
    // Bekleyen zamanlayıcıyı iptal et
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setPendingDraft(null);
    setSavedAt(null);
    lastSavedSnapshotRef.current = "";
    hasUserMutatedRef.current = false;
    setLifecycleState("enabled-idle");

    if (broadcastChannelRef.current && currentMode === "device") {
      try {
        broadcastChannelRef.current.postMessage({
          type: "DRAFT_DELETED",
          documentId,
          writerId: writerIdRef.current,
        });
      } catch {
        // Sessiz hata
      }
    }
  }, [documentId, resolveStorage, storageMode]);

  const dismissRestore = useCallback(() => {
    // Eski taslağı depoda SAKLA, ancak üzerine yazmamak için autosave'i duraklat
    setPendingDraft(null);
    setIsPaused(true);
    setLifecycleState("disabled");
  }, []);

  const resolveConflictWithRemote = useCallback(() => {
    if (!pendingDraft) return;
    if (storageMode === "none") {
      setStorageMode("device");
    }
    if (setUndoData) {
      setUndoData({ ...latestFormDataRef.current });
    }
    setFormData((prev) => ({
      ...prev,
      ...(pendingDraft.values as unknown as T),
    }));
    lastSavedSnapshotRef.current = JSON.stringify(pendingDraft.values);
    setSavedAt(pendingDraft.savedAt);
    revisionRef.current = pendingDraft.revision;
    setPendingDraft(null);
    setLifecycleState("saved");
  }, [pendingDraft, setFormData, setUndoData, storageMode]);

  const resolveConflictWithLocal = useCallback(() => {
    let modeToUse = storageMode;
    if (modeToUse === "none") {
      const devStorage = resolveStorage("device");
      const devConsent = devStorage ? loadDraftConsent(devStorage, "device") : null;
      if (devConsent === "device") {
        modeToUse = "device";
        setStorageMode("device");
      }
    }
    const targetRev = pendingDraft
      ? Math.max(revisionRef.current, pendingDraft.revision) + 1
      : revisionRef.current + 1;
    revisionRef.current = targetRev;
    setPendingDraft(null);
    performSave(latestFormDataRef.current, modeToUse, true);
  }, [pendingDraft, performSave, resolveStorage, storageMode]);

  const retrySave = useCallback(() => {
    if (storageMode === "none") return;
    performSave(latestFormDataRef.current, storageMode);
  }, [performSave, storageMode]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  return {
    lifecycleState,
    storageMode,
    savedAt,
    ageStatus,
    errorMessage,
    isSaving,
    isPaused,
    pendingDraft,
    setConsent,
    restoreDraft,
    ignoreDraft,
    deleteDraftAction,
    dismissRestore,
    retrySave,
    togglePause,
    markFormMutated,
    resolveConflictWithRemote,
    resolveConflictWithLocal,
  };
}
