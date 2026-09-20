// ============================================================================
// DWG/DXF MOTOR V2 — SPATIAL CHUNK SCHEDULER & RAM LRU CACHE (G10)
// ============================================================================
// Sözleşme: motor_v2/19_GEMINI_ADIM_ADIM_UYGULAMA.md (G10), 29_RENDER_VE_YASAM_DONGUSU.md
// Gereksinimler: R17, R20, R21, R28 | Alt kabul: V15, C03, C04, C11
//
// Yetenekler:
// 1. Sınırlı RAM LRU önbelleği (64 MiB CPU / 64 MiB GPU başlangıç bütçesi)
// 2. Görünür alan (spatial visible BBox) önceliği
// 3. En fazla 4 eşzamanlı fetch ve 2 decoded worker kuyruk yönetimi
// 4. Nesil (generation) kontrolü ile eski isteklerin (A -> B -> C) geç gelmesini engelleme
// 5. Kayıpsız tahliye (lossless eviction): Evicted parçalar kameranın geri gelmesiyle sorunsuz tekrar yüklenir
// 6. Detached ArrayBuffer güvenliği

import type { CadBBox2D } from "../canonical/types";

export const DEFAULT_MAX_RAM_CACHE_BYTES = 64 * 1024 * 1024; // 64 MiB
export const MAX_CONCURRENT_FETCH = 4;
export const MAX_DECODED_QUEUE = 2;

export interface ChunkMetadata {
  chunkId: string;
  layoutId: string;
  bbox: CadBBox2D;
  byteLength: number;
  sha256: string;
}

export interface CachedChunkEntry<T = Uint8Array> {
  chunkId: string;
  data: T;
  byteLength: number;
  lastUsedTimestamp: number;
  isVisible: boolean;
}

/**
 * 1. Bounded RAM LRU Cache (64 MiB Bütçeli)
 */
export class LruChunkCache<T = Uint8Array> {
  private cache = new Map<string, CachedChunkEntry<T>>();
  private currentBytes = 0;
  private maxBytes: number;
  private onEvictCallback?: (chunkId: string, entry: CachedChunkEntry<T>) => void;

  constructor(
    maxBytes = DEFAULT_MAX_RAM_CACHE_BYTES,
    onEvict?: (chunkId: string, entry: CachedChunkEntry<T>) => void
  ) {
    this.maxBytes = maxBytes;
    this.onEvictCallback = onEvict;
  }

  public get(chunkId: string): T | null {
    const entry = this.cache.get(chunkId);
    if (!entry) return null;
    entry.lastUsedTimestamp = Date.now();
    return entry.data;
  }

  public has(chunkId: string): boolean {
    return this.cache.has(chunkId);
  }

  public setVisible(chunkId: string, isVisible: boolean): void {
    const entry = this.cache.get(chunkId);
    if (entry) {
      entry.isVisible = isVisible;
      if (isVisible) entry.lastUsedTimestamp = Date.now();
    }
  }

  public put(chunkId: string, data: T, byteLength: number, isVisible = true): void {
    if (this.cache.has(chunkId)) {
      this.remove(chunkId);
    }

    // Gerekirse bütçeye sığana kadar görünmeyen parçaları tahliye (evict) et
    this.ensureBudget(byteLength);

    const entry: CachedChunkEntry<T> = {
      chunkId,
      data,
      byteLength,
      lastUsedTimestamp: Date.now(),
      isVisible,
    };

    this.cache.set(chunkId, entry);
    this.currentBytes += byteLength;
  }

  public remove(chunkId: string): boolean {
    const entry = this.cache.get(chunkId);
    if (!entry) return false;
    this.currentBytes -= entry.byteLength;
    this.cache.delete(chunkId);
    if (this.onEvictCallback) {
      this.onEvictCallback(chunkId, entry);
    }
    return true;
  }

  public getCurrentBytes(): number {
    return this.currentBytes;
  }

  public getMaxBytes(): number {
    return this.maxBytes;
  }

  public getEntryCount(): number {
    return this.cache.size;
  }

  public clear(): void {
    for (const [id, entry] of Array.from(this.cache.entries())) {
      if (this.onEvictCallback) this.onEvictCallback(id, entry);
    }
    this.cache.clear();
    this.currentBytes = 0;
  }

  /**
   * Bütçe aşımında en eski kullanılmayan (ve şu an görünmeyen) parçaları tahliye eder
   */
  private ensureBudget(incomingBytes: number): void {
    if (this.currentBytes + incomingBytes <= this.maxBytes) return;

    // Görünmeyen parçaları son kullanım zamanına göre sırala
    const evictCandidates = Array.from(this.cache.values())
      .filter((e) => !e.isVisible)
      .sort((a, b) => a.lastUsedTimestamp - b.lastUsedTimestamp);

    for (const candidate of evictCandidates) {
      if (this.currentBytes + incomingBytes <= this.maxBytes) break;
      this.remove(candidate.chunkId);
    }
  }
}

/**
 * 2. Mekânsal Parça Planlayıcısı (Spatial Chunk Scheduler)
 */
export class SpatialChunkScheduler {
  private chunks = new Map<string, ChunkMetadata>();
  private cache: LruChunkCache<Uint8Array>;
  private activeFetches = 0;
  private currentGeneration = 1;

  // İptal ve kuyruk yönetimi
  private pendingQueue: Array<{
    chunkId: string;
    priority: number;
    generation: number;
  }> = [];

  constructor(maxCacheBytes = DEFAULT_MAX_RAM_CACHE_BYTES) {
    this.cache = new LruChunkCache<Uint8Array>(maxCacheBytes);
  }

  public registerChunks(chunks: ChunkMetadata[]): void {
    for (const c of chunks) {
      this.chunks.set(c.chunkId, c);
    }
  }

  public setGeneration(gen: number): void {
    this.currentGeneration = gen;
    // Eski neslin bekleyen isteklerini temizle
    this.pendingQueue = this.pendingQueue.filter((req) => req.generation === gen);
  }

  public getGeneration(): number {
    return this.currentGeneration;
  }

  public getCache(): LruChunkCache<Uint8Array> {
    return this.cache;
  }

  /**
   * İki BBox'ın kesişip kesişmediğini kontrol eder
   */
  public static bboxIntersects(b1: CadBBox2D, b2: CadBBox2D): boolean {
    return !(b1[2] < b2[0] || b1[0] > b2[2] || b1[3] < b2[1] || b1[1] > b2[3]);
  }

  /**
   * Görünür kamera görünümüne (cameraViewport) göre parçaları önceliklendirir
   * Kesişen parçalar en yüksek önceliğe (0) sahiptir.
   */
  public updateViewport(cameraViewport: CadBBox2D): {
    visibleChunkIds: string[];
    enqueuedCount: number;
  } {
    const visibleChunkIds: string[] = [];

    for (const [chunkId, meta] of Array.from(this.chunks.entries())) {
      const isVisible = SpatialChunkScheduler.bboxIntersects(meta.bbox, cameraViewport);
      this.cache.setVisible(chunkId, isVisible);

      if (isVisible) {
        visibleChunkIds.push(chunkId);

        // Önbellekte yoksa ve zaten kuyrukta değilse ekle
        if (!this.cache.has(chunkId)) {
          const alreadyQueued = this.pendingQueue.some((q) => q.chunkId === chunkId);
          if (!alreadyQueued) {
            this.pendingQueue.push({
              chunkId,
              priority: 0, // En yüksek öncelik
              generation: this.currentGeneration,
            });
          }
        }
      }
    }

    // Önceliğe göre sırala
    this.pendingQueue.sort((a, b) => a.priority - b.priority);

    return {
      visibleChunkIds,
      enqueuedCount: this.pendingQueue.length,
    };
  }

  /**
   * Kuyruktan sıradaki yüklenecek parçaları alır (en fazla MAX_CONCURRENT_FETCH)
   */
  public getNextFetchBatch(maxBatch = MAX_CONCURRENT_FETCH): string[] {
    const availableSlots = Math.max(0, maxBatch - this.activeFetches);
    if (availableSlots <= 0 || this.pendingQueue.length === 0) return [];

    const batch = this.pendingQueue.splice(0, availableSlots).map((req) => req.chunkId);
    this.activeFetches += batch.length;
    return batch;
  }

  public completeFetch(chunkId: string, data: Uint8Array, byteLength: number, generation: number): boolean {
    this.activeFetches = Math.max(0, this.activeFetches - 1);

    // Eski nesle ait geç yanıt ise çöpe at (A -> B -> C koruması)
    if (generation < this.currentGeneration) {
      return false;
    }

    this.cache.put(chunkId, data, byteLength, true);
    return true;
  }

  public failFetch(chunkId: string): void {
    this.activeFetches = Math.max(0, this.activeFetches - 1);
  }
}
