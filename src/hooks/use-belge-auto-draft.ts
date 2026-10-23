"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { BELGE_UX_FLAGS, BELGE_UX_LIMITS, DOCUMENT_EDITABLE_FIELDS, getConsentKeyForMode, getKeyForMode, type AutoDraftLifecycleState, type BelgeDocumentId, type DraftConsentDecision, type DraftStorageMode } from "@/lib/belge-ux-config";
import { createDraftEnvelope, deleteDraft, getSafeBrowserStorage, loadDraft, loadDraftConsent, saveDraft, saveDraftConsent, type StorageLike, type BelgeDraftEnvelope, type DraftAgeStatus } from "@/lib/belge-draft-storage";

export interface UseBelgeAutoDraftOptions<T extends object> {
  documentId: BelgeDocumentId;
  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
  initialData: T;
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
  resolveConflictWithRemote: () => void;
  resolveConflictWithLocal: () => void;
}
type Mode = Exclude<DraftStorageMode, "none">;
interface DraftView {
  lifecycleState: AutoDraftLifecycleState;
  storageMode: DraftStorageMode;
  savedAt: number | null;
  ageStatus: DraftAgeStatus | null;
  errorMessage: string | null;
  isPaused: boolean;
  pendingDraft: BelgeDraftEnvelope | null;
}

/** Tüm kayıt yolları aynı izin, karar, sürüm ve generation kapısından geçer. */
export function useBelgeAutoDraft<T extends object>({ documentId, formData, setFormData, setUndoData, enabled = BELGE_UX_FLAGS.DRAFT, storageOverride }: UseBelgeAutoDraftOptions<T>): UseBelgeAutoDraftReturn {
  const [view, setView] = useState<DraftView>({ lifecycleState: enabled ? "booting" : "disabled", storageMode: "none", savedAt: null, ageStatus: null, errorMessage: null, isPaused: false, pendingDraft: null });
  const state = useRef(view);
  const latest = useRef(formData);
  const runtime = useRef({ authorized: false, declined: false, dirty: false, deleted: false, blocked: false, generation: 0, observed: null as string | null, pendingRaw: null as string | null, pendingMode: "device" as Mode, lastSaved: "", writer: "", mounted: false });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channel = useRef<BroadcastChannel | null>(null);
  useLayoutEffect(() => { latest.current = formData; }, [formData]);
  const update = useCallback((patch: Partial<DraftView>) => {
    state.current = { ...state.current, ...patch };
    if (runtime.current.mounted) setView(state.current);
  }, []);
  const cancel = useCallback(() => {
    runtime.current.generation++;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  const storageFor = useCallback((mode: Mode) => storageOverride ?? getSafeBrowserStorage(mode), [storageOverride]);
  const fail = useCallback((message: string) => {
    runtime.current.blocked = true;
    cancel();
    update({ lifecycleState: "save-error", errorMessage: message });
  }, [cancel, update]);
  const values = useCallback(() => Object.fromEntries(DOCUMENT_EDITABLE_FIELDS[documentId].map(key => [key, String((latest.current as Record<string, unknown>)[key] ?? "")])), [documentId]);
  const read = useCallback((mode: Mode) => {
    const storage = storageFor(mode);
    if (!storage) { fail("Tarayıcı depolamasına erişilemiyor. Formu kullanmaya devam edebilirsiniz."); return null; }
    try {
      const raw = storage.getItem(getKeyForMode(mode, documentId));
      const loaded = loadDraft(storage, mode, documentId);
      if (!loaded.ok) { fail(loaded.details); return null; }
      return { storage, raw, ...loaded };
    } catch { fail("Taslak okunamadı; mevcut kayıt korunuyor."); return null; }
  }, [documentId, fail, storageFor]);
  const offer = useCallback((mode: Mode, loaded: NonNullable<ReturnType<typeof read>>, phase: "restore-decision" | "conflict" = "restore-decision") => {
    cancel();
    runtime.current.pendingMode = mode;
    runtime.current.pendingRaw = loaded.raw;
    update({ storageMode: mode, pendingDraft: loaded.draft, savedAt: loaded.draft?.savedAt ?? null, ageStatus: loaded.ageStatus, lifecycleState: phase, errorMessage: null, isPaused: false });
  }, [cancel, update]);

  // Web Locks aynı origin/belge için read-check-write ve silmeyi sıralar.
  // Destek yoksa synchronous yeniden okuma ve conflict durdurması kullanılır;
  // bu fallback mutlak atomiklik garantisi taşımaz.
  const exclusive = useCallback((mode: Mode, action: () => void) => {
    const generation = runtime.current.generation;
    const guarded = () => { if (generation === runtime.current.generation) action(); };
    if (mode === "device" && typeof navigator !== "undefined" && navigator.locks) {
      void navigator.locks.request(getKeyForMode(mode, documentId), guarded).catch(() => fail("Taslak kayıt kilidi alınamadı. Tekrar deneyin."));
    } else guarded();
  }, [documentId, fail]);
  const canWrite = useCallback(() => enabled && runtime.current.authorized && runtime.current.dirty && !runtime.current.deleted && !runtime.current.blocked && !state.current.isPaused && state.current.storageMode !== "none" && !["booting", "restore-decision", "conflict", "consent-pending"].includes(state.current.lifecycleState), [enabled]);
  const save = useCallback(() => {
    if (!canWrite()) return;
    const mode = state.current.storageMode as Mode;
    exclusive(mode, () => {
      if (!canWrite() || state.current.storageMode !== mode) return;
      const loaded = read(mode);
      if (!loaded) return;
      if (loadDraftConsent(loaded.storage, mode) !== mode) {
        cancel(); runtime.current.authorized = false;
        update({ lifecycleState: "disabled", storageMode: "none" });
        return;
      }
      if (loaded.raw !== runtime.current.observed) {
        if (loaded.draft) offer(mode, loaded, "conflict");
        else { cancel(); runtime.current.deleted = true; runtime.current.dirty = false; update({ savedAt: null, lifecycleState: "enabled-idle" }); }
        return;
      }
      const snapshot = values();
      const serialized = JSON.stringify(snapshot);
      if (serialized === runtime.current.lastSaved && loaded.draft && JSON.stringify(loaded.draft.values) === serialized) {
        runtime.current.dirty = false;
        update({ lifecycleState: "saved" });
        return;
      }
      const envelope = createDraftEnvelope({ documentId, values: snapshot, writerId: runtime.current.writer, revision: (loaded.draft?.revision ?? 0) + 1 });
      if (!envelope.ok) { fail(envelope.details); return; }
      const result = saveDraft(loaded.storage, mode, envelope.envelope);
      if (!result.ok) { fail(result.details); return; }
      runtime.current.observed = JSON.stringify(envelope.envelope);
      runtime.current.lastSaved = serialized;
      runtime.current.dirty = false;
      update({ lifecycleState: "saved", savedAt: envelope.envelope.savedAt, ageStatus: null, errorMessage: null });
      if (mode === "device") channel.current?.postMessage({ type: "DRAFT_SAVED", documentId });
    });
  }, [canWrite, cancel, documentId, exclusive, fail, offer, read, update, values]);
  const saveRef = useRef(save);
  useLayoutEffect(() => { saveRef.current = save; }, [save]);

  useEffect(() => {
    const currentRuntime = runtime.current;
    currentRuntime.mounted = true;
    currentRuntime.writer ||= crypto.randomUUID();
    if (!enabled) return () => { currentRuntime.mounted = false; };
    const boot = setTimeout(() => {
      const session = storageFor("session");
      const device = storageFor("device");
      const sessionChoice = session && loadDraftConsent(session, "session");
      const choice = sessionChoice ?? (device && loadDraftConsent(device, "device"));
      runtime.current.declined = choice === "dismissed";
      runtime.current.authorized = choice === "device" || choice === "session";
      let mode: Mode = choice === "session" ? "session" : "device";
      if (choice !== "session" && choice !== "device" && session) {
        try { if (session.getItem(getKeyForMode("session", documentId)) !== null) mode = "session"; }
        catch { mode = "session"; }
      }
      const loaded = read(mode);
      if (!loaded) { runtime.current.pendingMode = mode; update({ storageMode: mode }); return; }
      runtime.current.observed = loaded.raw;
      if (loaded.draft) offer(mode, loaded);
      else update({ lifecycleState: runtime.current.authorized ? "enabled-idle" : runtime.current.dirty && !runtime.current.declined ? "consent-pending" : "disabled", storageMode: runtime.current.authorized ? mode : "none" });
    }, 0);
    return () => {
      clearTimeout(boot);
      if (timer.current) clearTimeout(timer.current);
      currentRuntime.mounted = false;
      saveRef.current(); // SPA/modal ayrılışı: yalnız izinli ve çözümlenmiş durum.
    };
  }, [documentId, enabled, offer, read, storageFor, update]);

  useEffect(() => {
    if (!enabled) return;
    const refresh = () => {
      if (state.current.storageMode !== "device" || !runtime.current.authorized) return;
      const loaded = read("device");
      if (!loaded || loaded.raw === runtime.current.observed) return;
      if (loaded.draft) offer("device", loaded, "conflict");
      else {
        cancel(); runtime.current.deleted = true; runtime.current.dirty = false; runtime.current.observed = null; runtime.current.lastSaved = "";
        update({ pendingDraft: null, savedAt: null, lifecycleState: "enabled-idle" });
      }
    };
    const onStorage = (e: StorageEvent) => {
      if (e.storageArea !== window.localStorage || state.current.storageMode !== "device") return;
      if (e.key === getConsentKeyForMode("device") && e.newValue !== "device") {
        cancel(); runtime.current.authorized = false; runtime.current.declined = true;
        update({ storageMode: "none", lifecycleState: "disabled" });
      } else if (e.key === null || e.key === getKeyForMode("device", documentId)) refresh();
    };
    if (typeof BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel(`belgeler:ux:draft:${documentId}`);
      channel.current = bc;
      bc.onmessage = refresh; // Mesaja güvenmek yerine güncel depo tekrar okunur.
    }
    const flush = () => saveRef.current();
    const visibility = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener("pagehide", flush);
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("storage", onStorage); window.removeEventListener("pagehide", flush); window.removeEventListener("pageshow", refresh); document.removeEventListener("visibilitychange", visibility);
      channel.current?.close(); channel.current = null;
    };
  }, [cancel, documentId, enabled, offer, read, update]);
  useEffect(() => {
    if (!canWrite()) return;
    timer.current = setTimeout(save, BELGE_UX_LIMITS.AUTOSAVE_DEBOUNCE_MS);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [canWrite, formData, save, view]);

  const setConsent = useCallback((decision: DraftConsentDecision) => {
    if (!enabled) return;
    cancel();
    if (decision === "dismissed") {
      const oldMode = state.current.storageMode;
      runtime.current.authorized = false; runtime.current.declined = true;
      update({ storageMode: "none", lifecycleState: "disabled", isPaused: false });
      const session = storageFor("session");
      const result = session && saveDraftConsent(session, "session", "dismissed");
      if (oldMode === "device") { const device = storageFor("device"); if (device) saveDraftConsent(device, "device", "dismissed"); }
      if (!result || !result.ok) fail("Kayıt bu sayfada kapatıldı, ancak tercih depolanamadı.");
      return;
    }
    const target = storageFor(decision);
    if (!target) { fail("Kayıt tercihi kaydedilemedi; depolamaya erişilemiyor."); return; }
    const result = saveDraftConsent(target, decision, decision);
    if (!result.ok) { fail(result.details); return; }
    const session = storageFor("session");
    if (session) saveDraftConsent(session, "session", decision); // Sekmeye özgü açık mod seçimi.
    runtime.current.authorized = true; runtime.current.declined = false; runtime.current.blocked = false;
    runtime.current.pendingMode = decision;
    update({ storageMode: decision, isPaused: false, errorMessage: null });
    const loaded = read(decision);
    if (!loaded) return;
    runtime.current.observed = loaded.raw;
    runtime.current.lastSaved = "";
    if (loaded.draft) offer(decision, loaded);
    else update({ pendingDraft: null, lifecycleState: "enabled-idle" });
  }, [cancel, enabled, fail, offer, read, storageFor, update]);
  const acceptRemote = useCallback((confirmLoss: boolean) => {
    if (confirmLoss && runtime.current.dirty && !window.confirm("Kaydedilmemiş form değişiklikleri değiştirilecek. Taslak yüklensin mi?")) return;
    const mode = runtime.current.pendingMode;
    const loaded = read(mode);
    if (!loaded?.draft) return;
    cancel();
    setUndoData?.({ ...latest.current });
    setFormData(prev => ({ ...prev, ...loaded.draft!.values }));
    runtime.current.observed = loaded.raw; runtime.current.lastSaved = JSON.stringify(loaded.draft.values); runtime.current.dirty = false; runtime.current.deleted = false;
    update({ pendingDraft: null, lifecycleState: runtime.current.authorized ? "saved" : "disabled", storageMode: mode, savedAt: loaded.draft.savedAt, ageStatus: loaded.ageStatus, isPaused: false });
  }, [cancel, read, setFormData, setUndoData, update]);
  const useLocal = useCallback(() => {
    if (!runtime.current.authorized) { update({ lifecycleState: "consent-pending" }); return; }
    if (!window.confirm("Bu form, kayıtlı taslağın yerine kaydedilecek. Devam edilsin mi?")) return;
    const mode = runtime.current.pendingMode;
    const expected = runtime.current.pendingRaw;
    exclusive(mode, () => {
      const loaded = read(mode);
      if (!loaded) return;
      if (loaded.raw !== expected) { offer(mode, loaded, "conflict"); return; }
      cancel(); runtime.current.observed = loaded.raw; runtime.current.dirty = true; runtime.current.deleted = false;
      update({ pendingDraft: null, lifecycleState: "enabled-idle", storageMode: mode, isPaused: false });
      saveRef.current();
    });
  }, [cancel, exclusive, offer, read, update]);
  const deleteDraftAction = useCallback(() => {
    if (!enabled) return;
    const mode = state.current.storageMode === "none" ? runtime.current.pendingMode : state.current.storageMode;
    const target = storageFor(mode);
    if (!target) { fail("Taslak silinemedi; depolama kullanılamıyor."); return; }
    let expected: string | null;
    try { expected = target.getItem(getKeyForMode(mode, documentId)); }
    catch { fail("Taslak silinmeden önce doğrulanamadı."); return; }
    cancel();
    exclusive(mode, () => {
      try {
        if (target.getItem(getKeyForMode(mode, documentId)) !== expected) {
          const loaded = read(mode);
          if (loaded) offer(mode, loaded, "conflict");
          return;
        }
      } catch { fail("Taslak silinmeden önce doğrulanamadı."); return; }
      const result = deleteDraft(target, mode, documentId);
      if (!result.ok) { fail(result.details); return; }
      runtime.current.deleted = true; runtime.current.dirty = false; runtime.current.blocked = false; runtime.current.observed = null; runtime.current.lastSaved = "";
      update({ pendingDraft: null, savedAt: null, ageStatus: null, errorMessage: null, lifecycleState: runtime.current.authorized ? "enabled-idle" : "disabled" });
      if (mode === "device") channel.current?.postMessage({ type: "DRAFT_DELETED", documentId });
    });
  }, [cancel, documentId, enabled, exclusive, fail, offer, read, storageFor, update]);
  const dismissRestore = useCallback(() => { cancel(); update({ isPaused: true, lifecycleState: "enabled-idle" }); }, [cancel, update]);
  const togglePause = useCallback(() => {
    cancel();
    if (state.current.pendingDraft) { update({ lifecycleState: "restore-decision", isPaused: false }); return; }
    update({ isPaused: !state.current.isPaused });
  }, [cancel, update]);
  const markFormMutated = useCallback(() => {
    if (!enabled) return;
    cancel(); runtime.current.dirty = true; runtime.current.deleted = false;
    if (state.current.lifecycleState === "booting") return;
    if (!runtime.current.authorized && !runtime.current.declined && !state.current.pendingDraft) update({ lifecycleState: "consent-pending" });
    else if (canWrite()) update({ lifecycleState: "enabled-idle" });
  }, [canWrite, cancel, enabled, update]);
  const retrySave = useCallback(() => {
    const mode = state.current.storageMode;
    if (mode === "none") return;
    runtime.current.blocked = false;
    const loaded = read(mode);
    if (!loaded) return;
    if (loaded.raw !== runtime.current.observed && loaded.draft) { offer(mode, loaded); return; }
    update({ lifecycleState: "enabled-idle", errorMessage: null });
    saveRef.current();
  }, [offer, read, update]);
  return { ...view, isSaving: view.lifecycleState === "saving", setConsent, restoreDraft: () => acceptRemote(true), ignoreDraft: useLocal, deleteDraftAction, dismissRestore, retrySave, togglePause, markFormMutated, resolveConflictWithRemote: () => acceptRemote(true), resolveConflictWithLocal: useLocal };
}
