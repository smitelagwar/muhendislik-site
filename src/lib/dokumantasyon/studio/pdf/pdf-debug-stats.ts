// PDF görüntüleyici hafif ölçü kaydı. Üretimde maliyet: Map.set. Debug HUD ve testler okur.
export type StatValue = number | string | boolean;

const store = new Map<string, StatValue>();

export const pdfStats = {
  set(key: string, value: StatValue): void {
    store.set(key, value);
  },
  add(key: string, delta = 1): void {
    const v = store.get(key);
    store.set(key, (typeof v === "number" ? v : 0) + delta);
  },
  snapshot(): Record<string, StatValue> {
    return Object.fromEntries(store);
  },
  reset(): void {
    store.clear();
  },
};

if (typeof window !== "undefined") {
  (window as unknown as { __pdfStats?: () => Record<string, StatValue> }).__pdfStats = () => pdfStats.snapshot();
}
