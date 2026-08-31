import { CadReviewStore, isCadMeasurementReviewItem } from "./store";
import { saveLocalCadReview, type CadReviewDocument } from "./schema";
import { CadReviewPersistenceCoordinator, type SaveState } from "./persistence";
import {
  applyCadReviewSaveStateToRibbon,
  CAD_REVIEW_SAVE_RETRY_EVENT,
} from "./save-state-ui";
import { installCadStudioUiPreferencesBridge } from "./ui-preferences";

let currentCadReviewStore: CadReviewStore | null = null;
let bridgeInstalled = false;
let currentSaveState: SaveState = { status: "dirty" };
const saveStateListeners = new Set<(state: SaveState) => void>();
const coordinators = new WeakMap<CadReviewStore, CadReviewPersistenceCoordinator>();

const CAD_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const baseGetDocument = CadReviewStore.prototype.getDocument;
const baseGetItems = CadReviewStore.prototype.getItems;
const baseSubscribe = CadReviewStore.prototype.subscribe;
const baseSetActiveTool = CadReviewStore.prototype.setActiveTool;
const baseSetSelectedItems = CadReviewStore.prototype.setSelectedItems;
const baseSetMeasurementUnitSettings = CadReviewStore.prototype.setMeasurementUnitSettings;
const baseAddItem = CadReviewStore.prototype.addItem;
const baseRemoveItem = CadReviewStore.prototype.removeItem;
const baseUpdateItem = CadReviewStore.prototype.updateItem;
const baseUpdateItemsStyle = CadReviewStore.prototype.updateItemsStyle;
const baseClearMarkupItems = CadReviewStore.prototype.clearMarkupItems;
const baseUndo = CadReviewStore.prototype.undo;
const baseRedo = CadReviewStore.prototype.redo;

function cloneDocument(document: Readonly<CadReviewDocument>): CadReviewDocument {
  return {
    ...document,
    items: document.items.map((item) => ({ ...item, style: { ...item.style } })) as CadReviewDocument["items"],
  };
}

export function createCadReviewItemId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  let seed = Date.now() ^ Math.floor(Math.random() * 0xffffffff);
  const nibble = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed & 0xf;
  };
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (token) => {
    const value = nibble();
    return (token === "x" ? value : (value & 0x3) | 0x8).toString(16);
  });
}

function publishSaveState(state: SaveState): void {
  currentSaveState = state;
  applyCadReviewSaveStateToRibbon(state);
  for (const listener of saveStateListeners) listener(state);
}

function replaceStoreDocument(
  store: CadReviewStore,
  document: CadReviewDocument,
  serverRevisionId: string
): void {
  const target = baseGetDocument.call(store) as CadReviewDocument & { serverRevisionId?: string };
  const next = cloneDocument(document) as CadReviewDocument & { serverRevisionId?: string };
  next.serverRevisionId = serverRevisionId;
  target.schemaVersion = next.schemaVersion;
  target.fileId = next.fileId;
  target.sourceVersionKey = next.sourceVersionKey;
  target.sourceSha256 = next.sourceSha256;
  target.revision = next.revision;
  target.items.splice(0, target.items.length, ...next.items);
  target.createdAt = next.createdAt;
  target.updatedAt = next.updatedAt;
  target.serverRevisionId = serverRevisionId;
  baseSetSelectedItems.call(store, []);
}

function acknowledgeStoreSave(
  store: CadReviewStore,
  document: CadReviewDocument,
  serverRevisionId: string
): void {
  // Only server metadata is acknowledged here. Newer local items that may have
  // arrived while the request was in flight stay untouched and remain queued.
  const target = baseGetDocument.call(store) as CadReviewDocument & { serverRevisionId?: string };
  target.revision = document.revision;
  target.updatedAt = document.updatedAt;
  target.sourceVersionKey = document.sourceVersionKey;
  target.sourceSha256 = document.sourceSha256;
  target.serverRevisionId = serverRevisionId;
  saveLocalCadReview(target.fileId, target);
}

function ensurePersistence(store: CadReviewStore): CadReviewPersistenceCoordinator | null {
  if (typeof window === "undefined") return null;
  const existing = coordinators.get(store);
  if (existing) return existing;

  const initial = baseGetDocument.call(store);
  const coordinator = new CadReviewPersistenceCoordinator({
    fileId: initial.fileId,
    getDocument: () => cloneDocument(baseGetDocument.call(store)),
    applyServerDocument: (document, serverRevisionId) =>
      replaceStoreDocument(store, document, serverRevisionId),
    acknowledgeServerSave: (document, serverRevisionId) =>
      acknowledgeStoreSave(store, document, serverRevisionId),
    saveLocal: (document) => saveLocalCadReview(document.fileId, document),
    debounceMs: 600,
  });
  coordinators.set(store, coordinator);
  coordinator.subscribe(publishSaveState);
  void coordinator.hydrate();
  return coordinator;
}

function markDocumentMutation(store: CadReviewStore): void {
  currentCadReviewStore = store;
  const document = cloneDocument(baseGetDocument.call(store));
  saveLocalCadReview(document.fileId, document);
  ensurePersistence(store)?.markDocumentChanged();
}

function installActiveStoreBridge(): void {
  if (bridgeInstalled) return;
  bridgeInstalled = true;
  installCadStudioUiPreferencesBridge();
  applyCadReviewSaveStateToRibbon(currentSaveState);

  if (typeof window !== "undefined") {
    window.addEventListener(CAD_REVIEW_SAVE_RETRY_EVENT, retryCurrentCadReviewSave);
  }

  CadReviewStore.prototype.getDocument = function (this: CadReviewStore) {
    currentCadReviewStore = this;
    queueMicrotask(() => ensurePersistence(this));
    return baseGetDocument.call(this);
  };

  CadReviewStore.prototype.getItems = function (this: CadReviewStore) {
    currentCadReviewStore = this;
    queueMicrotask(() => ensurePersistence(this));
    return baseGetItems.call(this);
  };

  CadReviewStore.prototype.subscribe = function (
    this: CadReviewStore,
    listener: Parameters<CadReviewStore["subscribe"]>[0]
  ) {
    currentCadReviewStore = this;
    queueMicrotask(() => ensurePersistence(this));
    return baseSubscribe.call(this, listener);
  };

  CadReviewStore.prototype.setActiveTool = function (
    this: CadReviewStore,
    tool: Parameters<CadReviewStore["setActiveTool"]>[0]
  ) {
    currentCadReviewStore = this;
    return baseSetActiveTool.call(this, tool);
  };

  CadReviewStore.prototype.setSelectedItems = function (
    this: CadReviewStore,
    ids: Parameters<CadReviewStore["setSelectedItems"]>[0]
  ) {
    currentCadReviewStore = this;
    return baseSetSelectedItems.call(this, ids);
  };

  CadReviewStore.prototype.setMeasurementUnitSettings = function (
    this: CadReviewStore,
    settings: Parameters<CadReviewStore["setMeasurementUnitSettings"]>[0]
  ) {
    const before = baseGetDocument.call(this).updatedAt;
    const result = baseSetMeasurementUnitSettings.call(this, settings);
    if (baseGetDocument.call(this).updatedAt !== before) markDocumentMutation(this);
    return result;
  };

  CadReviewStore.prototype.addItem = function (
    this: CadReviewStore,
    item: Parameters<CadReviewStore["addItem"]>[0]
  ) {
    const normalized = CAD_UUID_RE.test(item.id)
      ? item
      : ({ ...item, id: createCadReviewItemId() } as typeof item);
    const result = baseAddItem.call(this, normalized);
    markDocumentMutation(this);
    return result;
  };

  CadReviewStore.prototype.removeItem = function (
    this: CadReviewStore,
    id: Parameters<CadReviewStore["removeItem"]>[0]
  ) {
    const before = baseGetItems.call(this).length;
    const result = baseRemoveItem.call(this, id);
    if (baseGetItems.call(this).length !== before) markDocumentMutation(this);
    return result;
  };

  CadReviewStore.prototype.updateItem = function (
    this: CadReviewStore,
    id: Parameters<CadReviewStore["updateItem"]>[0],
    patch: Parameters<CadReviewStore["updateItem"]>[1]
  ) {
    const before = baseGetDocument.call(this).updatedAt;
    const result = baseUpdateItem.call(this, id, patch);
    if (baseGetDocument.call(this).updatedAt !== before) markDocumentMutation(this);
    return result;
  };

  CadReviewStore.prototype.updateItemsStyle = function (
    this: CadReviewStore,
    ids: Parameters<CadReviewStore["updateItemsStyle"]>[0],
    style: Parameters<CadReviewStore["updateItemsStyle"]>[1]
  ) {
    const result = baseUpdateItemsStyle.call(this, ids, style);
    if (result > 0) markDocumentMutation(this);
    return result;
  };

  CadReviewStore.prototype.clearMarkupItems = function (this: CadReviewStore) {
    const result = baseClearMarkupItems.call(this);
    if (result > 0) markDocumentMutation(this);
    return result;
  };

  CadReviewStore.prototype.undo = function (this: CadReviewStore) {
    const result = baseUndo.call(this);
    if (result) markDocumentMutation(this);
    return result;
  };

  CadReviewStore.prototype.redo = function (this: CadReviewStore) {
    const result = baseRedo.call(this);
    if (result) markDocumentMutation(this);
    return result;
  };
}

installActiveStoreBridge();

export function setCurrentCadReviewStore(store: CadReviewStore): void {
  currentCadReviewStore = store;
  ensurePersistence(store);
}

export function clearCurrentCadReviewStore(store: CadReviewStore): void {
  if (currentCadReviewStore === store) currentCadReviewStore = null;
  coordinators.get(store)?.dispose();
  coordinators.delete(store);
}

export function getCurrentCadReviewStore(): CadReviewStore | null {
  if (currentCadReviewStore) ensurePersistence(currentCadReviewStore);
  return currentCadReviewStore;
}

export function getCurrentCadReviewSaveState(): SaveState {
  return currentSaveState;
}

export function subscribeCadReviewSaveState(listener: (state: SaveState) => void): () => void {
  saveStateListeners.add(listener);
  listener(currentSaveState);
  return () => saveStateListeners.delete(listener);
}

export function retryCurrentCadReviewSave(): void {
  if (currentCadReviewStore) ensurePersistence(currentCadReviewStore)?.retry();
}

export function clearCurrentCadReviewMeasurements(): number {
  const store = currentCadReviewStore;
  if (!store) return 0;
  const ids = baseGetItems.call(store).filter(isCadMeasurementReviewItem).map((item) => item.id);
  for (const id of ids) store.removeItem(id);
  return ids.length;
}
