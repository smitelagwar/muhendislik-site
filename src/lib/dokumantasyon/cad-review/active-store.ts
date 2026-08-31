import type { CadReviewStore } from "./store";

let currentCadReviewStore: CadReviewStore | null = null;

export function setCurrentCadReviewStore(store: CadReviewStore): void {
  currentCadReviewStore = store;
}

export function clearCurrentCadReviewStore(store: CadReviewStore): void {
  if (currentCadReviewStore === store) currentCadReviewStore = null;
}

export function getCurrentCadReviewStore(): CadReviewStore | null {
  return currentCadReviewStore;
}
