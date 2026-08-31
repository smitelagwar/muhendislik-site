import { CadReviewStore, isCadMeasurementReviewItem } from "./store";
import { saveLocalCadReview } from "./schema";

let currentCadReviewStore: CadReviewStore | null = null;
let bridgeInstalled = false;

const CAD_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createCadReviewItemId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

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

function persistStore(store: CadReviewStore): void {
  if (typeof window === "undefined") return;
  try {
    const doc = store.getDocument();
    saveLocalCadReview(doc.fileId, doc as Parameters<typeof saveLocalCadReview>[1]);
  } catch {
    // Local recovery is best-effort. Store mutations must never fail because storage is unavailable.
  }
}

/**
 * Ribbon, overlay ve side-panel aynı CadReviewStore örneğini props zincirini
 * büyütmeden paylaşır. Background server sync viewer içinde store örneğini
 * değiştirebildiği için salt getter'lar da aktif örneği günceller. Böylece
 * yeni store ilk getItems/getDocument çağrısında stale global referansı düzeltir.
 *
 * Viewer'ın eski store subscription'ı server hydrate sonrasında geride kalsa
 * bile review mutation'ları local recovery'ye yazılır. Bu köprü source CAD
 * geometrisine dokunmaz; yalnız review document state'ini kalıcılaştırır.
 */
function installActiveStoreBridge(): void {
  if (bridgeInstalled) return;
  bridgeInstalled = true;

  const originalGetDocument = CadReviewStore.prototype.getDocument;
  CadReviewStore.prototype.getDocument = function (this: CadReviewStore) {
    currentCadReviewStore = this;
    return originalGetDocument.call(this);
  };

  const originalGetItems = CadReviewStore.prototype.getItems;
  CadReviewStore.prototype.getItems = function (this: CadReviewStore) {
    currentCadReviewStore = this;
    return originalGetItems.call(this);
  };

  const originalSubscribe = CadReviewStore.prototype.subscribe;
  CadReviewStore.prototype.subscribe = function (
    this: CadReviewStore,
    listener: Parameters<CadReviewStore["subscribe"]>[0]
  ) {
    currentCadReviewStore = this;
    return originalSubscribe.call(this, listener);
  };

  const originalSetActiveTool = CadReviewStore.prototype.setActiveTool;
  CadReviewStore.prototype.setActiveTool = function (
    this: CadReviewStore,
    tool: Parameters<CadReviewStore["setActiveTool"]>[0]
  ) {
    currentCadReviewStore = this;
    return originalSetActiveTool.call(this, tool);
  };

  const originalSetSelectedItems = CadReviewStore.prototype.setSelectedItems;
  CadReviewStore.prototype.setSelectedItems = function (
    this: CadReviewStore,
    ids: Parameters<CadReviewStore["setSelectedItems"]>[0]
  ) {
    currentCadReviewStore = this;
    return originalSetSelectedItems.call(this, ids);
  };

  const originalAddItem = CadReviewStore.prototype.addItem;
  CadReviewStore.prototype.addItem = function (
    this: CadReviewStore,
    item: Parameters<CadReviewStore["addItem"]>[0]
  ) {
    currentCadReviewStore = this;
    const normalized = CAD_UUID_RE.test(item.id)
      ? item
      : ({ ...item, id: createCadReviewItemId() } as typeof item);
    const result = originalAddItem.call(this, normalized);
    persistStore(this);
    return result;
  };

  const originalRemoveItem = CadReviewStore.prototype.removeItem;
  CadReviewStore.prototype.removeItem = function (
    this: CadReviewStore,
    id: Parameters<CadReviewStore["removeItem"]>[0]
  ) {
    currentCadReviewStore = this;
    const result = originalRemoveItem.call(this, id);
    persistStore(this);
    return result;
  };

  const originalUpdateItem = CadReviewStore.prototype.updateItem;
  CadReviewStore.prototype.updateItem = function (
    this: CadReviewStore,
    id: Parameters<CadReviewStore["updateItem"]>[0],
    patch: Parameters<CadReviewStore["updateItem"]>[1]
  ) {
    currentCadReviewStore = this;
    const result = originalUpdateItem.call(this, id, patch);
    persistStore(this);
    return result;
  };

  const originalUpdateItemsStyle = CadReviewStore.prototype.updateItemsStyle;
  CadReviewStore.prototype.updateItemsStyle = function (
    this: CadReviewStore,
    ids: Parameters<CadReviewStore["updateItemsStyle"]>[0],
    style: Parameters<CadReviewStore["updateItemsStyle"]>[1]
  ) {
    currentCadReviewStore = this;
    const result = originalUpdateItemsStyle.call(this, ids, style);
    persistStore(this);
    return result;
  };

  const originalClearMarkupItems = CadReviewStore.prototype.clearMarkupItems;
  CadReviewStore.prototype.clearMarkupItems = function (this: CadReviewStore) {
    currentCadReviewStore = this;
    const result = originalClearMarkupItems.call(this);
    persistStore(this);
    return result;
  };

  const originalUndo = CadReviewStore.prototype.undo;
  CadReviewStore.prototype.undo = function (this: CadReviewStore) {
    currentCadReviewStore = this;
    const result = originalUndo.call(this);
    if (result) persistStore(this);
    return result;
  };

  const originalRedo = CadReviewStore.prototype.redo;
  CadReviewStore.prototype.redo = function (this: CadReviewStore) {
    currentCadReviewStore = this;
    const result = originalRedo.call(this);
    if (result) persistStore(this);
    return result;
  };
}

installActiveStoreBridge();

export function setCurrentCadReviewStore(store: CadReviewStore): void {
  currentCadReviewStore = store;
}

export function clearCurrentCadReviewStore(store: CadReviewStore): void {
  if (currentCadReviewStore === store) currentCadReviewStore = null;
}

export function getCurrentCadReviewStore(): CadReviewStore | null {
  return currentCadReviewStore;
}

export function clearCurrentCadReviewMeasurements(): number {
  const store = currentCadReviewStore;
  if (!store) return 0;
  const ids = store.getItems().filter(isCadMeasurementReviewItem).map((item) => item.id);
  for (const id of ids) store.removeItem(id);
  return ids.length;
}
