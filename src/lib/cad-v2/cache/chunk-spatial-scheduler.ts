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
  /** Exact emitted line and triangle vertex count, used as a pre-fetch visual-complexity hint. */
  renderableVertexCount?: number;
  sha256: string;
}

/**
 * Her adımda yeni viewport kapsaması ve derleyicinin ölçtüğü çizilebilir vertex/byte
 * oranı en yüksek chunk'ı seçer. Eski manifestlerde vertex ipucu yoksa önceki
 * kapsama/byte sezgisi korunur. Son sıra chunk kimliğiyle deterministiktir.
 */
export function prioritizeChunksByViewportCoverage<T extends Pick<ChunkMetadata, "chunkId" | "byteLength" | "renderableVertexCount"> & { bbox?: CadBBox2D }>(
  chunks: readonly T[],
  viewportBBox: CadBBox2D,
  requestedGridSize = 20,
): T[] {
  const gridSize = Math.max(1, Math.min(64, Math.floor(requestedGridSize) || 1));
  const [minX, minY, maxX, maxY] = viewportBBox;
  const width = maxX - minX;
  const height = maxY - minY;
  const viewportCenterX = (minX + maxX) / 2;
  const viewportCenterY = (minY + maxY) / 2;
  type CoverageCandidate = {
    chunk: T;
    cells: number[];
    centerDistance: number;
    marginalCoverage: number;
    heapIndex: number;
  };
  const visibleCandidates: CoverageCandidate[] = [];
  const chunksByCell = new Map<number, CoverageCandidate[]>();
  const offscreenChunks: T[] = [];

  for (const chunk of chunks) {
    // Missing legacy bbox is conservatively treated as filling the viewport.
    const [chunkMinX, chunkMinY, chunkMaxX, chunkMaxY] = chunk.bbox ?? viewportBBox;
    if (chunkMaxX < minX || chunkMinX > maxX || chunkMaxY < minY || chunkMinY > maxY) {
      offscreenChunks.push(chunk);
      continue;
    }

    const clippedMinX = Math.max(minX, chunkMinX);
    const clippedMinY = Math.max(minY, chunkMinY);
    const clippedMaxX = Math.min(maxX, chunkMaxX);
    const clippedMaxY = Math.min(maxY, chunkMaxY);
    const startColumn = width > 0
      ? Math.max(0, Math.min(gridSize - 1, Math.floor(((clippedMinX - minX) / width) * gridSize)))
      : 0;
    const endColumn = width > 0
      ? clippedMinX === clippedMaxX
        ? startColumn
        : Math.max(0, Math.min(gridSize - 1, Math.ceil(((clippedMaxX - minX) / width) * gridSize) - 1))
      : 0;
    const startRow = height > 0
      ? Math.max(0, Math.min(gridSize - 1, Math.floor(((clippedMinY - minY) / height) * gridSize)))
      : 0;
    const endRow = height > 0
      ? clippedMinY === clippedMaxY
        ? startRow
        : Math.max(0, Math.min(gridSize - 1, Math.ceil(((clippedMaxY - minY) / height) * gridSize) - 1))
      : 0;
    const cells: number[] = [];
    for (let row = startRow; row <= endRow; row++) {
      for (let column = startColumn; column <= endColumn; column++) {
        cells.push(row * gridSize + column);
      }
    }
    const chunkCenterX = (clippedMinX + clippedMaxX) / 2;
    const chunkCenterY = (clippedMinY + clippedMaxY) / 2;
    const candidate: CoverageCandidate = {
      chunk,
      cells,
      centerDistance: (chunkCenterX - viewportCenterX) ** 2 + (chunkCenterY - viewportCenterY) ** 2,
      marginalCoverage: cells.length,
      heapIndex: -1,
    };
    visibleCandidates.push(candidate);
    for (const cell of cells) {
      const owners = chunksByCell.get(cell);
      if (owners) owners.push(candidate);
      else chunksByCell.set(cell, [candidate]);
    }
  }

  const ordered: T[] = [];
  const coveredCells = new Set<number>();
  const hasHigherPriority = (left: CoverageCandidate, right: CoverageCandidate): boolean => {
    // The bbox grid alone overvalues sparse, large-bounds chunks. New compiler indexes
    // carry exact emitted drawable vertices, so compare visible geometry per transfer byte.
    // Legacy scenes lack the hint and retain their previous coverage-per-byte behavior.
    const leftVertices = Number.isSafeInteger(left.chunk.renderableVertexCount) &&
      left.chunk.renderableVertexCount! >= 0 ? left.chunk.renderableVertexCount! : 1;
    const rightVertices = Number.isSafeInteger(right.chunk.renderableVertexCount) &&
      right.chunk.renderableVertexCount! >= 0 ? right.chunk.renderableVertexCount! : 1;
    const leftCoveragePerByte = left.marginalCoverage * leftVertices / Math.max(1, left.chunk.byteLength);
    const rightCoveragePerByte = right.marginalCoverage * rightVertices / Math.max(1, right.chunk.byteLength);
    if (leftCoveragePerByte !== rightCoveragePerByte) return leftCoveragePerByte > rightCoveragePerByte;
    if (left.marginalCoverage !== right.marginalCoverage) return left.marginalCoverage > right.marginalCoverage;
    if (left.marginalCoverage === 0 && leftVertices !== rightVertices) return leftVertices > rightVertices;
    if (left.marginalCoverage === 0 && left.chunk.byteLength !== right.chunk.byteLength) {
      return left.chunk.byteLength < right.chunk.byteLength;
    }
    if (left.centerDistance !== right.centerDistance) return left.centerDistance < right.centerDistance;
    return left.chunk.chunkId < right.chunk.chunkId;
  };
  const heap: CoverageCandidate[] = [];
  const swapHeapEntries = (leftIndex: number, rightIndex: number) => {
    const left = heap[leftIndex]!;
    const right = heap[rightIndex]!;
    heap[leftIndex] = right;
    heap[rightIndex] = left;
    right.heapIndex = leftIndex;
    left.heapIndex = rightIndex;
  };
  const siftHeapUp = (startIndex: number) => {
    let index = startIndex;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (!hasHigherPriority(heap[index]!, heap[parent]!)) break;
      swapHeapEntries(index, parent);
      index = parent;
    }
  };
  const siftHeapDown = (startIndex: number) => {
    let index = startIndex;
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      let highest = index;
      if (left < heap.length && hasHigherPriority(heap[left]!, heap[highest]!)) highest = left;
      if (right < heap.length && hasHigherPriority(heap[right]!, heap[highest]!)) highest = right;
      if (highest === index) return;
      swapHeapEntries(index, highest);
      index = highest;
    }
  };
  const pushHeap = (candidate: CoverageCandidate) => {
    candidate.heapIndex = heap.length;
    heap.push(candidate);
    siftHeapUp(candidate.heapIndex);
  };
  const popHeap = (): CoverageCandidate | undefined => {
    const first = heap[0];
    if (!first) return undefined;
    const last = heap.pop()!;
    first.heapIndex = -1;
    if (heap.length > 0) {
      heap[0] = last;
      last.heapIndex = 0;
      siftHeapDown(0);
    }
    return first;
  };

  for (const candidate of visibleCandidates) pushHeap(candidate);
  while (heap.length > 0) {
    const selected = popHeap();
    if (!selected) break;
    ordered.push(selected.chunk);
    const newlyCoveredCells: number[] = [];
    for (const cell of selected.cells) {
      if (coveredCells.has(cell)) continue;
      coveredCells.add(cell);
      newlyCoveredCells.push(cell);
    }
    if (newlyCoveredCells.length === 0) continue;

    const coverageReductionByCandidate = new Map<CoverageCandidate, number>();
    for (const cell of newlyCoveredCells) {
      for (const candidate of chunksByCell.get(cell) ?? []) {
        if (candidate.heapIndex < 0) continue;
        coverageReductionByCandidate.set(candidate, (coverageReductionByCandidate.get(candidate) ?? 0) + 1);
      }
    }
    for (const [candidate, reduction] of coverageReductionByCandidate) {
      candidate.marginalCoverage = Math.max(0, candidate.marginalCoverage - reduction);
      siftHeapDown(candidate.heapIndex);
    }
  }

  offscreenChunks.sort((a, b) => a.chunkId < b.chunkId ? -1 : a.chunkId > b.chunkId ? 1 : 0);
  return [...ordered, ...offscreenChunks];
}

export interface CachedChunkEntry<T = Uint8Array> {
  chunkId: string;
  data: T;
  byteLength: number;
  lastUsedTimestamp: number;
  isVisible: boolean;
}

/**
 * Tracks deferred rejections and accepted chunks removed by LRU until capacity
 * changes. A viewport change alone does not make the same visible set admissible.
 */
export class ChunkAdmissionRetryGate {
  private capacityRevision = 0;
  private rejectedAtRevision = new Map<string, {
    revision: number;
    requiredBytes: { cpuBytes: number; gpuBufferBytes: number } | null;
  }>();

  public noteCapacityOpportunity(): void {
    this.capacityRevision++;
  }

  public markRejected(
    chunkId: string,
    requiredBytes: { cpuBytes: number; gpuBufferBytes: number },
  ): void {
    this.rejectedAtRevision.set(chunkId, {
      revision: this.capacityRevision,
      requiredBytes: { ...requiredBytes },
    });
  }

  /** Defers work that has not been measured until the renderer reports new capacity. */
  public markDeferred(chunkId: string): void {
    if (this.rejectedAtRevision.has(chunkId)) return;
    this.rejectedAtRevision.set(chunkId, {
      revision: this.capacityRevision,
      requiredBytes: null,
    });
  }

  public markEvicted(
    chunkId: string,
    requiredBytes: { cpuBytes: number; gpuBufferBytes: number },
  ): void {
    this.rejectedAtRevision.set(chunkId, {
      revision: this.capacityRevision,
      requiredBytes: { ...requiredBytes },
    });
  }

  public markAccepted(chunkId: string): void {
    this.rejectedAtRevision.delete(chunkId);
  }

  public hasDeferredAdmission(chunkId: string): boolean {
    return this.rejectedAtRevision.has(chunkId);
  }

  public canRetry(
    chunkId: string,
    reclaimableCapacity: { cpuBytes: number; gpuBufferBytes: number },
  ): boolean {
    const rejection = this.rejectedAtRevision.get(chunkId);
    if (!rejection) return true;
    if (rejection.revision >= this.capacityRevision) return false;
    if (!rejection.requiredBytes) return true;
    return reclaimableCapacity.cpuBytes >= rejection.requiredBytes.cpuBytes &&
      reclaimableCapacity.gpuBufferBytes >= rejection.requiredBytes.gpuBufferBytes;
  }

  /**
   * Selects a retry cohort whose combined estimated costs fit the available
   * capacity. This prevents individually eligible chunks from racing for the
   * same invisible LRU bytes in one concurrent load batch.
   */
  public selectRetryCandidates(
    chunkIds: string[],
    reclaimableCapacity: { cpuBytes: number; gpuBufferBytes: number },
  ): Set<string> {
    const selected = new Set<string>();
    let reservedCpuBytes = 0;
    let reservedGpuBufferBytes = 0;

    for (const chunkId of chunkIds) {
      const rejection = this.rejectedAtRevision.get(chunkId);
      if (!rejection) {
        selected.add(chunkId);
        continue;
      }
      if (rejection.revision >= this.capacityRevision) continue;
      if (!rejection.requiredBytes) {
        selected.add(chunkId);
        rejection.revision = this.capacityRevision;
        continue;
      }

      const fitsIndividually = rejection.requiredBytes.cpuBytes <= reclaimableCapacity.cpuBytes &&
        rejection.requiredBytes.gpuBufferBytes <= reclaimableCapacity.gpuBufferBytes;
      const fitsWithSelected = fitsIndividually &&
        reservedCpuBytes + rejection.requiredBytes.cpuBytes <= reclaimableCapacity.cpuBytes &&
        reservedGpuBufferBytes + rejection.requiredBytes.gpuBufferBytes <= reclaimableCapacity.gpuBufferBytes;
      if (!fitsWithSelected) {
        // Avoid reconsidering a deferred item on every viewport callback.
        rejection.revision = this.capacityRevision;
        continue;
      }

      selected.add(chunkId);
      reservedCpuBytes += rejection.requiredBytes.cpuBytes;
      reservedGpuBufferBytes += rejection.requiredBytes.gpuBufferBytes;
    }

    return selected;
  }
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

  /** Updates an admitted resident's weight without invoking eviction cleanup. */
  public updateByteLength(chunkId: string, byteLength: number): boolean {
    if (!Number.isSafeInteger(byteLength) || byteLength < 0) return false;
    const entry = this.cache.get(chunkId);
    if (!entry) return false;
    this.currentBytes += byteLength - entry.byteLength;
    entry.byteLength = byteLength;
    entry.lastUsedTimestamp = Date.now();
    return true;
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

  public getInvisibleChunkIds(): string[] {
    return Array.from(this.cache.values())
      .filter((entry) => !entry.isVisible)
      .map((entry) => entry.chunkId);
  }

  /** Releases the least recently used chunk outside the current visible set. */
  public evictOldestInvisible(): string | null {
    let oldest: CachedChunkEntry<T> | null = null;
    for (const entry of this.cache.values()) {
      if (entry.isVisible) continue;
      if (!oldest || entry.lastUsedTimestamp < oldest.lastUsedTimestamp) oldest = entry;
    }
    if (!oldest) return null;
    this.remove(oldest.chunkId);
    return oldest.chunkId;
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
