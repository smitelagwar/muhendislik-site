// ============================================================================
// PDF v4 MOTOR — BAYT BÜTÇELİ LRU BELLEK TAMPONU (Plan 03 P3.1.3)
// ----------------------------------------------------------------------------
// Canvas yaşam döngüsünden ve DOM'dan bağımsız saf veri yapısı.
// Korunan anahtarlar (görünür parçalar) asla tahliye edilmez.
// ============================================================================

export class ByteLru<K, V> {
  private m = new Map<K, { v: V; bytes: number }>();
  private total = 0;

  constructor(
    private budget: number,
    private onEvict: (k: K, v: V) => void = () => {}
  ) {}

  get bytes(): number {
    return this.total;
  }

  get size(): number {
    return this.m.size;
  }

  has(k: K): boolean {
    return this.m.has(k);
  }

  get(k: K): V | undefined {
    const e = this.m.get(k);
    if (!e) return undefined;
    // LRU tazeleme: sil ve sona ekle
    this.m.delete(k);
    this.m.set(k, e);
    return e.v;
  }

  set(k: K, v: V, bytes: number): void {
    this.delete(k);
    this.m.set(k, { v, bytes });
    this.total += bytes;
  }

  delete(k: K): void {
    const e = this.m.get(k);
    if (!e) return;
    this.m.delete(k);
    this.total -= e.bytes;
    this.onEvict(k, e.v);
  }

  setBudget(b: number): void {
    this.budget = Math.max(0, b);
  }

  /**
   * Bütçeyi aşıyorsa en eskiden başlayarak tahliye eder.
   * protect(k) === true olan anahtarlar atlanır.
   */
  trim(protect: (k: K) => boolean = () => false): void {
    for (const k of this.m.keys()) {
      if (this.total <= this.budget) break;
      if (!protect(k)) {
        this.delete(k);
      }
    }
  }

  clear(): void {
    for (const k of [...this.m.keys()]) {
      this.delete(k);
    }
    this.total = 0;
  }
}
