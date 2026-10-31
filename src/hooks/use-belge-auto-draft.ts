"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  BELGE_UX_FLAGS,
  BELGE_UX_LIMITS,
  DOCUMENT_EDITABLE_FIELDS,
  getKeyForMode,
  getScopedRecoveryKey,
  type BelgeDraftScope,
  type AutoDraftLifecycleState,
  type BelgeDocumentId,
  type DraftConsentDecision,
  type DraftStorageMode,
} from "@/lib/belge-ux-config";
import { mergeStoredDraftWithBase } from "@/lib/belge-hesap/document-draft";
import {
  createDraftEnvelope,
  deleteDraft,
  draftAgeStatus,
  getSafeBrowserStorage,
  loadDraft,
  parseDraft,
  saveDraft,
  type BelgeDraftEnvelope,
  type DraftAgeStatus,
  type StorageLike,
} from "@/lib/belge-draft-storage";

export interface UseBelgeAutoDraftOptions<T extends object> {
  documentId: BelgeDocumentId;
  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
  initialData: T;
  scope?: BelgeDraftScope;
  skipRestore?: boolean;
  setUndoData?: React.Dispatch<React.SetStateAction<T | null>>;
  enabled?: boolean;
  storageOverride?: StorageLike;
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
  setConsent: (decision: DraftConsentDecision) => void;
  restoreDraft: () => void;
  ignoreDraft: () => void;
  deleteDraftAction: () => void;
  dismissRestore: () => void;
  retrySave: () => void;
  togglePause: () => void;
  markFormMutated: () => void;
  markFieldEdited: (key: string) => void;
  clearManualField: (key: string) => void;
  markAllFieldsEdited: () => void;
  resolveConflictWithRemote: () => void;
  resolveConflictWithLocal: () => void;
  replaceAndPersist: <V extends object = Record<string, unknown>>(nextValues: V, reason?: string) => void;
}

const GUEST_SCOPE: BelgeDraftScope = { kind: "guest" };

interface DraftView {
  lifecycleState: AutoDraftLifecycleState;
  storageMode: DraftStorageMode;
  savedAt: number | null;
  ageStatus: DraftAgeStatus | null;
  errorMessage: string | null;
  isPaused: boolean;
  pendingDraft: BelgeDraftEnvelope | null;
}

/**
 * Belge Stüdyosu — Minimal Otomatik Taslak Motoru (V3)
 *
 * Sözleşme:
 * 1. İlk tuşla otomatik başlar; son değişiklikten 2.000 ms sonra yazılır. İzin / prompt sorulmaz.
 * 2. Geçerli cihaz taslağı açılışta sessizce geri yüklenir.
 * 3. `dirty → saving → saved` döngüsü gerçek depolama doğrulamasına bağlıdır.
 * 4. Çift sekmede çakışma durumunda kullanıcının yerel verisi sessizce ezilmez.
 * 5. `replaceAndPersist` ile Sıfırla/Temizle/Geri al gecikmesiz senkron kalıcılaştırılır.
 */
export function useBelgeAutoDraft<T extends object>({
  documentId,
  formData,
  setFormData,
  setUndoData,
  initialData,
  scope = GUEST_SCOPE,
  skipRestore = false,
  enabled = BELGE_UX_FLAGS.DRAFT,
  storageOverride,
}: UseBelgeAutoDraftOptions<T>): UseBelgeAutoDraftReturn {
  const [view, setView] = useState<DraftView>({
    lifecycleState: enabled ? "booting" : "disabled",
    storageMode: enabled ? "device" : "none",
    savedAt: null,
    ageStatus: null,
    errorMessage: null,
    isPaused: false,
    pendingDraft: null,
  });

  const baselineRef = useRef<T>(initialData);
  const manualFieldsRef = useRef<Set<string>>(new Set());
  const undoManualFieldsRef = useRef<Set<string> | null>(null);
  const stateRef = useRef(view);
  const latestValuesRef = useRef<T>(formData);
  useLayoutEffect(() => {
    latestValuesRef.current = formData;
  }, [formData]);

  const runtimeRef = useRef({
    mounted: false,
    booted: false,
    dirty: false,
    generation: 0,
    lastSavedSnapshot: "",
    lastObservedRaw: null as string | null,
    lastRevision: 0,
    writerId: "",
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const update = useCallback((patch: Partial<DraftView>) => {
    stateRef.current = { ...stateRef.current, ...patch };
    if (runtimeRef.current.mounted) {
      setView(stateRef.current);
    }
  }, []);

  const getStorage = useCallback(
    (mode: "device" | "session" = "device"): StorageLike | null => {
      if (storageOverride) return storageOverride;
      return getSafeBrowserStorage(mode);
    },
    [storageOverride]
  );

  const getEditableSnapshot = useCallback(
    (source: unknown): Record<string, string> => {
      const fields = DOCUMENT_EDITABLE_FIELDS[documentId] || [];
      const rec = (source && typeof source === "object" ? source : {}) as Record<string, unknown>;
      const snapshot: Record<string, string> = Object.create(null);
      for (const field of fields) {
        snapshot[field] = String(rec[field] ?? "");
      }
      return snapshot;
    },
    [documentId]
  );

  /** Preserve manual (including emptied) account fields across profile changes. */
  const materializeDraft = useCallback(
    (draft: BelgeDraftEnvelope): Record<string, string> => {
      if (scope.kind === "account") {
        const manual = draft.manualFields ?? [...DOCUMENT_EDITABLE_FIELDS[documentId]];
        manualFieldsRef.current = new Set(manual);
      }
      return mergeStoredDraftWithBase(
        documentId, getEditableSnapshot(baselineRef.current), draft, scope,
      );
    },
    [documentId, getEditableSnapshot, scope],
  );

  useEffect(() => {
    const oldBase = getEditableSnapshot(baselineRef.current);
    const nextBase = getEditableSnapshot(initialData);
    if (JSON.stringify(oldBase) === JSON.stringify(nextBase)) return;
    baselineRef.current = initialData;
    const current = getEditableSnapshot(latestValuesRef.current);
    const next: Record<string, unknown> = { ...(latestValuesRef.current as Record<string, unknown>) };
    let changed = false;
    for (const field of DOCUMENT_EDITABLE_FIELDS[documentId]) {
      if (manualFieldsRef.current.has(field) || current[field] !== oldBase[field]) continue;
      if (current[field] === nextBase[field]) continue;
      next[field] = nextBase[field];
      changed = true;
    }
    if (changed) {
      latestValuesRef.current = next as T;
      setFormData(next as T);
    }
  }, [documentId, initialData, getEditableSnapshot, setFormData]);

  // Senkron, doğrulanmış depolama yazımı (hem debounce save hem replaceAndPersist hem unmount flush kullanır)
  const persistSnapshotSync = useCallback(
    (snapshot: Record<string, string>, overrideWriterId?: string): boolean => {
      const storage = getStorage("device");
      if (!storage) {
        update({
          lifecycleState: "save-error",
          errorMessage: "Tarayıcı depolamasına erişilemiyor.",
        });
        return false;
      }

      const writer = overrideWriterId || runtimeRef.current.writerId;
      const nextRev = (runtimeRef.current.lastRevision || 0) + 1;

      const envelopeResult = createDraftEnvelope({
        documentId,
        values: snapshot,
        writerId: writer,
        revision: nextRev,
        savedAt: Date.now(),
        ...(scope.kind === "account" ? { manualFields: [...manualFieldsRef.current] } : {}),
      });

      if (!envelopeResult.ok) {
        update({
          lifecycleState: "save-error",
          errorMessage: envelopeResult.details,
        });
        return false;
      }

      const envelope = envelopeResult.envelope;
      const saveResult = saveDraft(storage, "device", envelope, { scope });
      if (!saveResult.ok) {
        update({
          lifecycleState: "save-error",
          errorMessage: saveResult.details,
        });
        return false;
      }

      // Read-back kontrolü ile gerçek yazım garantisi
      const rawInStore = storage.getItem(getKeyForMode("device", documentId, scope));
      const serialized = JSON.stringify(envelope);
      if (rawInStore !== serialized) {
        update({
          lifecycleState: "save-error",
          errorMessage: "Taslak depolama doğrulama eşleşmesi başarısız oldu.",
        });
        return false;
      }

      runtimeRef.current.lastObservedRaw = rawInStore;
      runtimeRef.current.lastSavedSnapshot = JSON.stringify(snapshot);
      runtimeRef.current.lastRevision = nextRev;
      runtimeRef.current.dirty = false;

      update({
        lifecycleState: "saved",
        savedAt: envelope.savedAt,
        ageStatus: null,
        errorMessage: null,
        storageMode: "device",
        isPaused: false,
      });

      // Diğer sekmelere yayın yap
      channelRef.current?.postMessage({
        type: "DRAFT_SAVED",
        documentId,
        revision: nextRev,
        writerId: writer,
      });

      return true;
    },
    [documentId, getStorage, scope, update]
  );

  // Asenkron debounce kayıt tetikleyicisi
  const performSave = useCallback(() => {
    if (!enabled) return;
    const currentGeneration = runtimeRef.current.generation;
    if (!runtimeRef.current.dirty) return;

    const storage = getStorage("device");
    if (!storage) {
      update({
        lifecycleState: "save-error",
        errorMessage: "Tarayıcı depolamasına erişilemiyor.",
      });
      return;
    }

    // Yazmadan önce depodaki mevcut durumu kontrol et (başka sekme araya girdiyse)
    const currentRaw = storage.getItem(getKeyForMode("device", documentId, scope));
    if (
      currentRaw !== null &&
      currentRaw !== runtimeRef.current.lastObservedRaw
    ) {
      const parsed = parseDraft(currentRaw, documentId);
      if (
        parsed.ok &&
        parsed.draft.writerId !== runtimeRef.current.writerId &&
        parsed.draft.revision > runtimeRef.current.lastRevision
      ) {
        // Çakışma tespit edildi: sessizce üzerine yazma!
        update({
          lifecycleState: "conflict",
          pendingDraft: parsed.draft,
          errorMessage: "Başka bir sekmede daha yeni bir taslak kaydedildi.",
        });
        return;
      }
    }

    update({ lifecycleState: "saving" });
    const snapshot = getEditableSnapshot(latestValuesRef.current);

    if (runtimeRef.current.generation !== currentGeneration) {
      // Bekleme sırasında yeni bir tuş vuruşu olduysa bu işlemi atla
      return;
    }

    persistSnapshotSync(snapshot);
  }, [documentId, enabled, getEditableSnapshot, getStorage, persistSnapshotSync, scope, update]);

  // Sıfırla / Temizle / Geri al için anında gecikmesiz persist API'si
  const replaceAndPersist = useCallback(
    <V extends object = Record<string, unknown>>(nextValues: V, reason?: string) => {
      if (scope.kind === "account") {
        if (reason === "reset" || reason === "clear" || reason === "sample") {
          undoManualFieldsRef.current = new Set(manualFieldsRef.current);
          manualFieldsRef.current = reason === "reset"
            ? new Set()
            : new Set(DOCUMENT_EDITABLE_FIELDS[documentId]);
        } else if (reason === "undo" && undoManualFieldsRef.current) {
          manualFieldsRef.current = new Set(undoManualFieldsRef.current);
          undoManualFieldsRef.current = null;
        }
      }
      // 1. Bekleyen gecikmeli debounce timer'ı iptal et
      runtimeRef.current.generation++;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      // 2. Ref'i ve React state'ini derhal güncelle (stale ref kalmasın)
      latestValuesRef.current = nextValues as unknown as T;
      setFormData(nextValues as unknown as T);

      // 3. Anında senkron doğrulanmış depolama yazımı gerçekleştir
      const snapshot = getEditableSnapshot(nextValues);
      persistSnapshotSync(snapshot);
    },
    [documentId, getEditableSnapshot, persistSnapshotSync, scope.kind, setFormData]
  );

  // 1. Boot / Hydration Effect
  useEffect(() => {
    const runtime = runtimeRef.current;
    runtime.mounted = true;
    if (!runtime.writerId) {
      runtime.writerId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `w_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }

    if (!enabled) {
      update({ lifecycleState: "disabled", storageMode: "none" });
      return () => {
        runtime.mounted = false;
      };
    }

    // Hydration işlemi: önce geçerli cihaz taslağı, yoksa legacy session taslağı
    const bootTimer = setTimeout(() => {
      const deviceStorage = getStorage("device");
      const sessionStorage = getStorage("session");

      let hydrated = false;

      if (!skipRestore && deviceStorage) {
        const rawDevice = deviceStorage.getItem(getKeyForMode("device", documentId, scope));
        const loadedDevice = loadDraft(deviceStorage, "device", documentId, Date.now(), { scope });
        if (loadedDevice.ok && loadedDevice.draft) {
          const draft = loadedDevice.draft;
          // Kullanıcı boot tamamlanmadan henüz yazmadıysa geri yükle
          if (!runtime.dirty) {
            const restored = materializeDraft(draft);
            setFormData((prev) => ({ ...prev, ...restored }));
            latestValuesRef.current = {
              ...latestValuesRef.current,
              ...restored,
            };
            runtime.lastSavedSnapshot = JSON.stringify(restored);
            runtime.lastObservedRaw = rawDevice;
            runtime.lastRevision = draft.revision;

            update({
              lifecycleState: "saved",
              savedAt: draft.savedAt,
              ageStatus: loadedDevice.ageStatus,
              storageMode: "device",
              pendingDraft: null,
              errorMessage: null,
            });
            hydrated = true;
          }

          // Eğer session storage'da farklı bir taslak varsa kurtarma anahtarına taşı
          if (sessionStorage) {
            const rawSession = sessionStorage.getItem(getKeyForMode("session", documentId, scope));
            const loadedSession = loadDraft(sessionStorage, "session", documentId, Date.now(), { scope });
            if (
              loadedSession.ok &&
              loadedSession.draft &&
              JSON.stringify(loadedSession.draft.values) !== JSON.stringify(draft.values)
            ) {
              try {
                sessionStorage.setItem(
                  getScopedRecoveryKey(documentId, scope),
                  rawSession || JSON.stringify(loadedSession.draft)
                );
              } catch {
                // Kurtarma yazımı best-effort
              }
            }
          }
        }
      }

      // Cihaz taslağı yoksa legacy session taslağını güvenle device'a taşı
      if (!skipRestore && !hydrated && sessionStorage && deviceStorage) {
        const loadedSession = loadDraft(sessionStorage, "session", documentId, Date.now(), { scope });
        if (loadedSession.ok && loadedSession.draft) {
          const draft = loadedSession.draft;
          if (!runtime.dirty) {
            const restored = materializeDraft(draft);
            saveDraft(deviceStorage, "device", draft, { scope });
            setFormData((prev) => ({ ...prev, ...restored }));
            latestValuesRef.current = {
              ...latestValuesRef.current,
              ...restored,
            };
            runtime.lastSavedSnapshot = JSON.stringify(restored);
            runtime.lastObservedRaw = JSON.stringify(draft);
            runtime.lastRevision = draft.revision;

            update({
              lifecycleState: "saved",
              savedAt: draft.savedAt,
              ageStatus: loadedSession.ageStatus,
              storageMode: "device",
              pendingDraft: null,
              errorMessage: null,
            });
            hydrated = true;
          }
        }
      }

      if (!hydrated && !runtime.dirty) {
        // Taslak yok; mevcut form değerlerini başlangıç snapshot'ı olarak kaydet
        runtime.lastSavedSnapshot = JSON.stringify(
          getEditableSnapshot(latestValuesRef.current)
        );
        update({
          lifecycleState: "idle",
          savedAt: null,
          ageStatus: null,
          storageMode: "device",
          pendingDraft: null,
          errorMessage: null,
        });
      }

      runtime.booted = true;
    }, 0);

    return () => {
      clearTimeout(bootTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
      runtime.mounted = false;

      // SPA / sayfa ayrılışı: dirty varsa derhal senkron flush
      if (runtime.dirty && enabled) {
        const snapshot = getEditableSnapshot(latestValuesRef.current);
        persistSnapshotSync(snapshot);
      }
    };
  }, [
    documentId,
    enabled,
    getEditableSnapshot,
    getStorage,
    materializeDraft,
    persistSnapshotSync,
    scope,
    skipRestore,
    setFormData,
    update,
  ]);

  // 2. Çoklu Sekme ve Storage Event Dinleyicisi
  useEffect(() => {
    if (!enabled) return;

    const handleExternalChange = () => {
      const storage = getStorage("device");
      if (!storage) return;

      const raw = storage.getItem(getKeyForMode("device", documentId, scope));
      if (raw === runtimeRef.current.lastObservedRaw) return;

      if (raw === null) {
        // Başka sekme sildiyse
        runtimeRef.current.lastObservedRaw = null;
        runtimeRef.current.lastSavedSnapshot = "";
        runtimeRef.current.dirty = false;
        update({
          lifecycleState: "idle",
          savedAt: null,
          pendingDraft: null,
          errorMessage: null,
        });
        return;
      }

      const parsed = parseDraft(raw, documentId);
      if (!parsed.ok || !parsed.draft) return;

      if (!runtimeRef.current.dirty) {
        const restored = materializeDraft(parsed.draft);
        // Bu sekmede kaydedilmemiş yerel düzenleme yok; yeni taslağı sessizce yükle
        setFormData((prev) => ({ ...prev, ...restored }));
        latestValuesRef.current = {
          ...latestValuesRef.current,
          ...restored,
        };
        runtimeRef.current.lastObservedRaw = raw;
        runtimeRef.current.lastSavedSnapshot = JSON.stringify(restored);
        runtimeRef.current.lastRevision = parsed.draft.revision;

        update({
          lifecycleState: "saved",
          savedAt: parsed.draft.savedAt,
          ageStatus: draftAgeStatus(parsed.draft.savedAt),
          pendingDraft: null,
          errorMessage: null,
        });
      } else {
        // Bu sekmede kaydedilmemiş veri var; sessiz overwrite yapma, conflict durumuna al
        update({
          lifecycleState: "conflict",
          pendingDraft: parsed.draft,
          errorMessage: "Başka bir sekmede taslak güncellendi.",
        });
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (e.storageArea !== window.localStorage) return;
      if (e.key === null || e.key === getKeyForMode("device", documentId, scope)) {
        handleExternalChange();
      }
    };

    if (typeof BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel(`belgeler:ux:draft:${scope.kind === "account" ? `${scope.accountId}:` : ""}${documentId}`);
      channelRef.current = bc;
      bc.onmessage = (msg) => {
        if (msg.data?.documentId === documentId) {
          handleExternalChange();
        }
      };
    }

    const flushOnExit = () => {
      if (runtimeRef.current.dirty && enabled) {
        const snapshot = getEditableSnapshot(latestValuesRef.current);
        persistSnapshotSync(snapshot);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushOnExit();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("pagehide", flushOnExit);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pagehide", flushOnExit);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, [
    documentId,
    enabled,
    getEditableSnapshot,
    getStorage,
    materializeDraft,
    persistSnapshotSync,
    scope,
    setFormData,
    update,
  ]);

  // 3. Form Değişikliği ve 2.000 ms Debounce Tetikleyicisi
  useEffect(() => {
    if (!enabled || !runtimeRef.current.booted) return;

    const currentSnapshot = getEditableSnapshot(formData);
    const serialized = JSON.stringify(currentSnapshot);

    // Kayıtlı olanla birebir aynıysa hiçbir şey yapma
    if (serialized === runtimeRef.current.lastSavedSnapshot) {
      return;
    }

    // Yeni değişiklik var: 2.000 ms debounce başlat
    runtimeRef.current.dirty = true;
    runtimeRef.current.generation++;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    update({ lifecycleState: "dirty" });

    timerRef.current = setTimeout(() => {
      performSave();
    }, BELGE_UX_LIMITS.AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, formData, getEditableSnapshot, performSave, update]);

  // Geriye dönük uyumluluk ve kullanıcı aksiyonları
  const markFormMutated = useCallback(() => {
    runtimeRef.current.dirty = true;
    if (runtimeRef.current.booted && stateRef.current.lifecycleState === "idle") {
      update({ lifecycleState: "dirty" });
    }
  }, [update]);

  const markFieldEdited = useCallback((field: string) => {
    if (DOCUMENT_EDITABLE_FIELDS[documentId].some((key) => key === field)) {
      manualFieldsRef.current.add(field);
      if (documentId === "santiye-sefi-sozlesmesi" && field === "santiye_sefi_ad") {
        manualFieldsRef.current.add("santiye_sefi_imza_adi");
      }
      if (documentId === "santiye-sefi-sozlesmesi" && field === "muteahhit_unvan") {
        manualFieldsRef.current.add("muteahhit_imza_unvan");
      }
      if (documentId === "santiye-sefi-taahhutnamesi" && field === "unvan") {
        manualFieldsRef.current.add("unvan_imza");
      }
    }
    markFormMutated();
  }, [documentId, markFormMutated]);

  const clearManualField = useCallback((field: string) => {
    manualFieldsRef.current.delete(field);
  }, []);

  const markAllFieldsEdited = useCallback(() => {
    manualFieldsRef.current = new Set(DOCUMENT_EDITABLE_FIELDS[documentId]);
    markFormMutated();
  }, [documentId, markFormMutated]);

  const deleteDraftAction = useCallback(() => {
    const storage = getStorage("device");
    if (!storage) return;

    runtimeRef.current.generation++;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    deleteDraft(storage, "device", documentId, { scope });
    runtimeRef.current.lastObservedRaw = null;
    runtimeRef.current.lastSavedSnapshot = "";
    runtimeRef.current.dirty = false;

    update({
      pendingDraft: null,
      savedAt: null,
      ageStatus: null,
      errorMessage: null,
      lifecycleState: "idle",
    });

    channelRef.current?.postMessage({
      type: "DRAFT_DELETED",
      documentId,
    });
  }, [documentId, getStorage, scope, update]);

  const resolveConflictWithRemote = useCallback(() => {
    const pending = stateRef.current.pendingDraft;
    if (!pending) return;

    setUndoData?.({ ...latestValuesRef.current });
    const restored = materializeDraft(pending);
    setFormData((prev) => ({ ...prev, ...restored }));
    latestValuesRef.current = {
      ...latestValuesRef.current,
      ...restored,
    };
    runtimeRef.current.lastSavedSnapshot = JSON.stringify(restored);
    runtimeRef.current.lastObservedRaw = JSON.stringify(pending);
    runtimeRef.current.lastRevision = pending.revision;
    runtimeRef.current.dirty = false;

    update({
      pendingDraft: null,
      lifecycleState: "saved",
      savedAt: pending.savedAt,
      ageStatus: draftAgeStatus(pending.savedAt),
      errorMessage: null,
    });
  }, [materializeDraft, setFormData, setUndoData, update]);

  const resolveConflictWithLocal = useCallback(() => {
    // Yerel veriyi güncel revizyonla depoya zorla yaz
    const snapshot = getEditableSnapshot(latestValuesRef.current);
    persistSnapshotSync(snapshot);
  }, [getEditableSnapshot, persistSnapshotSync]);

  const restoreDraft = useCallback(() => {
    resolveConflictWithRemote();
  }, [resolveConflictWithRemote]);

  const ignoreDraft = useCallback(() => {
    update({ pendingDraft: null, lifecycleState: "idle" });
  }, [update]);

  const dismissRestore = useCallback(() => {
    update({ pendingDraft: null, lifecycleState: "idle" });
  }, [update]);

  const retrySave = useCallback(() => {
    update({ lifecycleState: "saving", errorMessage: null });
    performSave();
  }, [performSave, update]);

  const togglePause = useCallback(() => {
    // V3 sözleşmesinde duraklatma özelliği kalkmıştır; çağrı güvenle no-op'tur
  }, []);

  const setConsent = useCallback((_decision: DraftConsentDecision) => {
    // V3 sözleşmesinde onay kapısı kalkmıştır; çağrı güvenle no-op'tur
  }, []);

  return {
    ...view,
    isSaving: view.lifecycleState === "saving",
    setConsent,
    restoreDraft,
    ignoreDraft,
    deleteDraftAction,
    dismissRestore,
    retrySave,
    togglePause,
    markFormMutated,
    markFieldEdited,
    clearManualField,
    markAllFieldsEdited,
    resolveConflictWithRemote,
    resolveConflictWithLocal,
    replaceAndPersist,
  };
}
