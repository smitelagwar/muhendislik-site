import { CadReviewStore } from "./store";

let currentCadReviewStore: CadReviewStore | null = null;
let bridgeInstalled = false;

/**
 * Ribbon ile viewer aynı CadReviewStore örneğini props zincirini büyütmeden
 * paylaşır. Viewer ilk store'u kurduğunda subscribe(), araç değiştirirken
 * setActiveTool() ve seçim yaparken setSelectedItems() zaten çağrıldığı için
 * bu üç public giriş noktası aktif örneği güvenilir biçimde güncel tutar.
 *
 * Özellikle background server sync sonrasında viewer yeni bir store örneğine
 * geçerse ilk kullanıcı etkileşimi stale store referansını otomatik düzeltir.
 */
function installActiveStoreBridge(): void {
  if (bridgeInstalled) return;
  bridgeInstalled = true;

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
