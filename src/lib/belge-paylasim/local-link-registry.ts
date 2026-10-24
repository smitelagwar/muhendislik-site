// ============================================================================
// BELGE PAYLAŞIM — KULLANICI CİHAZ KAYIT DEFTERİ (LOCAL LINK REGISTRY)
// V3 ASAMA_08: Kalıcı yönetim geçmişi, IndexedDB desteği ve eski depolama geçişi
// ============================================================================

export interface StoredBelgeShareLink {
  viewToken: string;
  manageToken: string;
  documentId: string;
  url: string;
  createdAt: string; // ISO dizesi
  expiresAt: string; // ISO dizesi
  revokedAt?: string; // İptal edildiyse ISO dizesi
}

export interface PagedStoredLinks {
  items: StoredBelgeShareLink[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

export type StorageHealth = {
  isAvailable: boolean;
  isPersistent: boolean;
  engine: "indexeddb" | "localstorage" | "memory" | "disabled";
  warning?: string;
};

const LEGACY_STORAGE_KEY = "belge_paylasim_user_registry_v1";
const DB_NAME = "belge_paylasim_db";
const DB_VERSION = 1;
const STORE_NAME = "links";
const SYNC_CHANNEL_NAME = "belge_paylasim_registry_sync";

// Oturum içi hafıza önbelleği — Depolama tamamen kapalı veya çökmüş olsa dahi
// bu oturumda oluşturulan bağlantıların ve iptallerin kaybolmamasını sağlar.
let inMemoryLinks: StoredBelgeShareLink[] = [];
let memoryInitialized = false;
let dbPromise: Promise<IDBDatabase | null> | null = null;
let broadcastChannel: BroadcastChannel | null = null;

// ----------------------------------------------------------------------------
// Güvenli Getter ve Depolama Varlık Kontrolleri (N06 Koruması)
// ----------------------------------------------------------------------------

export function getSafeLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    const storage = window.localStorage;
    if (!storage) return null;
    const testKey = "__test_storage_avail__";
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return storage;
  } catch {
    return null;
  }
}

export function isLocalStorageAvailable(): boolean {
  return getSafeLocalStorage() !== null;
}

export function getSafeIndexedDB(): IDBFactory | null {
  try {
    if (typeof window !== "undefined" && window.indexedDB) {
      return window.indexedDB;
    }
    if (typeof globalThis !== "undefined" && (globalThis as unknown as { indexedDB?: IDBFactory }).indexedDB) {
      return (globalThis as unknown as { indexedDB: IDBFactory }).indexedDB;
    }
  } catch {
    return null;
  }
  return null;
}

export function isIndexedDbAvailable(): boolean {
  return getSafeIndexedDB() !== null;
}

export function checkStorageHealth(): StorageHealth {
  if (isIndexedDbAvailable()) {
    return {
      isAvailable: true,
      isPersistent: true,
      engine: "indexeddb",
    };
  }
  if (isLocalStorageAvailable()) {
    return {
      isAvailable: true,
      isPersistent: true,
      engine: "localstorage",
      warning: "Tarayıcıda IndexedDB kullanılamıyor; bağlantılar yerel depolamada saklanıyor.",
    };
  }
  return {
    isAvailable: false,
    isPersistent: false,
    engine: "disabled",
    warning: "Tarayıcınızın kalıcı saklama alanı kapalı veya kullanılamıyor. Oluşturulan bağlantı yönetim anahtarları tarayıcı kapatıldığında kaybolabilir; lütfen bağlantıyı hemen kopyalayın.",
  };
}

// ----------------------------------------------------------------------------
// Sekmeler Arası Eşitleme (Multi-tab Broadcast & Stale Event Koruması)
// ----------------------------------------------------------------------------

function getBroadcast(): BroadcastChannel | null {
  if (broadcastChannel) return broadcastChannel;
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  try {
    broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    if (typeof (broadcastChannel as unknown as { unref?: () => void }).unref === "function") {
      (broadcastChannel as unknown as { unref: () => void }).unref();
    }
    broadcastChannel.onmessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; link?: StoredBelgeShareLink; viewToken?: string; revokedAt?: string } | undefined;
      if (!data || typeof data !== "object") return;

      if (data.type === "revoke" && typeof data.viewToken === "string") {
        applyRevokeToMemory(data.viewToken, data.revokedAt);
      } else if (data.type === "upsert" && data.link && typeof data.link.viewToken === "string") {
        applyUpsertToMemory(data.link);
      }
    };
    return broadcastChannel;
  } catch {
    return null;
  }
}

function broadcastEvent(message: unknown): void {
  try {
    const channel = getBroadcast();
    channel?.postMessage(message);
  } catch {
    // broadcast hatası ana akışı engellemez
  }
}

// ----------------------------------------------------------------------------
// Hafıza İşlemleri ve Stale Event Koruması
// ----------------------------------------------------------------------------

function applyUpsertToMemory(link: StoredBelgeShareLink): void {
  const existingIndex = inMemoryLinks.findIndex((item) => item.viewToken === link.viewToken);
  if (existingIndex >= 0) {
    const existing = inMemoryLinks[existingIndex];
    // Stale Event Koruması: Zaten iptal edilmiş bir bağlantı gelen eski/stale olayla tekrar 'aktif' yapılamaz!
    const effectiveRevokedAt = existing.revokedAt || link.revokedAt;
    const merged: StoredBelgeShareLink = {
      ...existing,
      ...link,
      ...(effectiveRevokedAt ? { revokedAt: effectiveRevokedAt } : {}),
    };
    inMemoryLinks[existingIndex] = merged;
  } else {
    inMemoryLinks = [link, ...inMemoryLinks];
  }
}

function applyRevokeToMemory(viewToken: string, revokedAt?: string): void {
  const existingIndex = inMemoryLinks.findIndex((item) => item.viewToken === viewToken);
  if (existingIndex >= 0) {
    const existing = inMemoryLinks[existingIndex];
    if (!existing.revokedAt) {
      inMemoryLinks[existingIndex] = {
        ...existing,
        revokedAt: revokedAt || new Date().toISOString(),
      };
    }
  }
}

// ----------------------------------------------------------------------------
// IndexedDB Yönetimi
// ----------------------------------------------------------------------------

export function openRegistryDB(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;

  const idb = getSafeIndexedDB();
  if (!idb) {
    return Promise.resolve(null);
  }

  dbPromise = new Promise((resolve) => {
    try {
      const request = idb.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        try {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: "viewToken" });
            store.createIndex("createdAt", "createdAt", { unique: false });
            store.createIndex("documentId", "documentId", { unique: false });
          }
        } catch {
          // upgrade hatası yoksay
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        resolve(null);
      };

      request.onblocked = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
}

// ----------------------------------------------------------------------------
// Eski localStorage Verisini IndexedDB'ye Taşıma (Migration)
// ----------------------------------------------------------------------------

/**
 * Eski `belge_paylasim_user_registry_v1` verisini doğrular ve kalıcı IndexedDB'ye aktarır.
 * Kural: Kalıcı yazma başarıyla doğrulanmadan eski localStorage verisi ASLA silinmez.
 */
export async function migrateLegacyLocalStorage(database?: IDBDatabase | null): Promise<{ migratedCount: number; success: boolean }> {
  const storage = getSafeLocalStorage();
  if (!storage) return { migratedCount: 0, success: false };

  let raw: string | null = null;
  try {
    raw = storage.getItem(LEGACY_STORAGE_KEY);
  } catch {
    return { migratedCount: 0, success: false };
  }
  if (!raw) return { migratedCount: 0, success: true };

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Bozuk JSON: temizlenmesi güvenlidir
    try {
      storage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // yoksay
    }
    return { migratedCount: 0, success: false };
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    try {
      storage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // yoksay
    }
    return { migratedCount: 0, success: true };
  }

  const validItems: StoredBelgeShareLink[] = parsed.filter(
    (item): item is StoredBelgeShareLink =>
      Boolean(
        item &&
          typeof item === "object" &&
          typeof item.viewToken === "string" &&
          typeof item.manageToken === "string" &&
          typeof item.url === "string" &&
          typeof item.createdAt === "string" &&
          typeof item.expiresAt === "string"
      )
  );

  if (validItems.length === 0) {
    try {
      storage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // yoksay
    }
    return { migratedCount: 0, success: true };
  }

  const db = database ?? (await openRegistryDB());
  if (!db) {
    // Kalıcı IndexedDB yoksa eski veri localStorage'da kalmaya devam eder!
    return { migratedCount: 0, success: false };
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      for (const item of validItems) {
        const getReq = store.get(item.viewToken);
        getReq.onsuccess = () => {
          const existing = getReq.result as StoredBelgeShareLink | undefined;
          if (existing && existing.revokedAt && !item.revokedAt) {
            item.revokedAt = existing.revokedAt;
          }
          store.put(item);
        };
      }

      tx.oncomplete = () => {
        // Kalıcı yazma kesin olarak tamamlandığında eski localStorage anahtarı silinir
        try {
          storage.removeItem(LEGACY_STORAGE_KEY);
        } catch {
          // yoksay
        }
        // Hafızaya da ekle
        for (const item of validItems) {
          applyUpsertToMemory(item);
        }
        resolve({ migratedCount: validItems.length, success: true });
      };

      tx.onerror = () => resolve({ migratedCount: 0, success: false });
      tx.onabort = () => resolve({ migratedCount: 0, success: false });
    } catch {
      resolve({ migratedCount: 0, success: false });
    }
  });
}

// ----------------------------------------------------------------------------
// İlk Başlatma ve Hafıza Eşitleme
// ----------------------------------------------------------------------------

function ensureMemoryLoaded(): void {
  if (memoryInitialized) return;
  memoryInitialized = true;

  // 1. Önce güvenli biçimde localStorage'dan oku
  const storage = getSafeLocalStorage();
  if (storage) {
    try {
      const raw = storage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (
              item &&
              typeof item === "object" &&
              typeof item.viewToken === "string" &&
              typeof item.manageToken === "string" &&
              typeof item.url === "string" &&
              typeof item.createdAt === "string" &&
              typeof item.expiresAt === "string"
            ) {
              applyUpsertToMemory(item as StoredBelgeShareLink);
            }
          }
        }
      }
    } catch {
      // yoksay
    }
  }

  // 2. Arka planda IndexedDB aç ve migration yap
  if (isIndexedDbAvailable()) {
    void openRegistryDB().then(async (db) => {
      if (!db) return;
      await migrateLegacyLocalStorage(db);

      // IndexedDB'den tüm kayıtları hafızaya senkronize et
      try {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          if (Array.isArray(req.result)) {
            for (const item of req.result) {
              applyUpsertToMemory(item as StoredBelgeShareLink);
            }
          }
        };
      } catch {
        // yoksay
      }
    });
  }

  // 3. Broadcast dinleyiciyi başlat
  getBroadcast();
}

// ----------------------------------------------------------------------------
// Dışa Açık API (Senkron & Asenkron)
// ----------------------------------------------------------------------------

/**
 * Bu tarayıcıda oluşturulmuş bağlantıları döner (en son oluşturulan ilk sırada).
 * Sayısal sınır yüzünden aktif bağlantılar silinmez.
 */
export function getStoredShareLinks(): StoredBelgeShareLink[] {
  ensureMemoryLoaded();
  return [...inMemoryLinks];
}

/**
 * Asenkron olarak IndexedDB'den en güncel bağlantı listesini döner.
 */
export async function getStoredShareLinksAsync(): Promise<StoredBelgeShareLink[]> {
  ensureMemoryLoaded();
  const db = await openRegistryDB();
  if (!db) return getStoredShareLinks();

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = Array.isArray(req.result) ? (req.result as StoredBelgeShareLink[]) : [];
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        // Hafızayı da güncelle
        inMemoryLinks = [...results];
        resolve(results);
      };
      req.onerror = () => resolve(getStoredShareLinks());
    } catch {
      resolve(getStoredShareLinks());
    }
  });
}

/**
 * Sayfalı bağlantı listesi sorgulama — 4.500 aktif bağlantıyı DOM'a boğmadan sayfalı erişim sağlar.
 */
export async function getStoredShareLinksPaged(options?: {
  offset?: number;
  limit?: number;
  documentId?: string;
}): Promise<PagedStoredLinks> {
  ensureMemoryLoaded();
  const offset = Math.max(0, options?.offset ?? 0);
  const limit = Math.max(1, Math.min(100, options?.limit ?? 10));
  const docId = options?.documentId;

  const db = await openRegistryDB();
  if (db) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const countReq = store.count();

        countReq.onsuccess = () => {
          const totalCount = countReq.result;
          if (totalCount === 0 && inMemoryLinks.length > 0) {
            resolve(getPagedFromMemory(offset, limit, docId));
            return;
          }
          const items: StoredBelgeShareLink[] = [];
          let skipped = 0;

          // createdAt indeksinde azalan sıra (en yeni ilk)
          const index = store.index("createdAt");
          const cursorReq = index.openCursor(null, "prev");

          cursorReq.onsuccess = () => {
            const cursor = cursorReq.result;
            if (!cursor) {
              resolve({
                items,
                total: docId ? items.length : totalCount,
                offset,
                limit,
                hasMore: offset + items.length < (docId ? items.length : totalCount),
              });
              return;
            }

            const val = cursor.value as StoredBelgeShareLink;
            if (docId && val.documentId !== docId) {
              cursor.continue();
              return;
            }

            if (skipped < offset) {
              skipped++;
              cursor.continue();
              return;
            }

            items.push(val);
            if (items.length < limit) {
              cursor.continue();
            } else {
              resolve({
                items,
                total: docId ? items.length : totalCount,
                offset,
                limit,
                hasMore: offset + items.length < (docId ? items.length : totalCount),
              });
            }
          };

          cursorReq.onerror = () => resolve(getPagedFromMemory(offset, limit, docId));
        };

        countReq.onerror = () => resolve(getPagedFromMemory(offset, limit, docId));
      } catch {
        resolve(getPagedFromMemory(offset, limit, docId));
      }
    });
  }

  return getPagedFromMemory(offset, limit, docId);
}

function getPagedFromMemory(offset: number, limit: number, docId?: string): PagedStoredLinks {
  const all = getStoredShareLinks();
  const filtered = docId ? all.filter((l) => l.documentId === docId) : all;
  const items = filtered.slice(offset, offset + limit);
  return {
    items,
    total: filtered.length,
    offset,
    limit,
    hasMore: offset + items.length < filtered.length,
  };
}

/**
 * Yeni oluşturulan bağlantıyı yerel kayıt defterine ekler.
 * Aktif bağlantılar hiçbir sayısal sınırla atılmaz.
 */
export function addStoredShareLink(link: StoredBelgeShareLink): StoredBelgeShareLink[] {
  ensureMemoryLoaded();

  // 1. Önce anında hafızayı güncelle
  applyUpsertToMemory(link);

  // 2. Diğer sekmelere bildir
  broadcastEvent({ type: "upsert", link });

  // 3. Kalıcı depolamaya transactional yaz
  if (isIndexedDbAvailable()) {
    void openRegistryDB().then((db) => {
      if (!db) return;
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get(link.viewToken);
        getReq.onsuccess = () => {
          const existing = getReq.result as StoredBelgeShareLink | undefined;
          const toSave = { ...link };
          // Stale event ve yarış koruması: Var olan iptal damgasını ASLA ezme!
          if (existing && existing.revokedAt && !toSave.revokedAt) {
            toSave.revokedAt = existing.revokedAt;
          }
          store.put(toSave);
        };
      } catch {
        // yoksay
      }
    });
  } else {
    // IndexedDB yoksa localStorage fallback
    const storage = getSafeLocalStorage();
    if (storage) {
      try {
        storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(inMemoryLinks));
      } catch (err) {
        console.warn("Yerel depolama kota aşımı veya erişim hatası:", err);
      }
    }
  }

  return [...inMemoryLinks];
}

/**
 * Belirtilen bağlantıyı yerelde 'revoked' olarak işaretler.
 * Transactional işlem: İptal edilmiş bir bağlantı asla geriye döndürülemez.
 */
export function markStoredLinkRevoked(viewToken: string): StoredBelgeShareLink[] {
  ensureMemoryLoaded();
  const nowIso = new Date().toISOString();

  // 1. Hafızada güncelle
  applyRevokeToMemory(viewToken, nowIso);

  // 2. Sekmeler arası yay
  broadcastEvent({ type: "revoke", viewToken, revokedAt: nowIso });

  // 3. Kalıcı depolamada güncelle
  if (isIndexedDbAvailable()) {
    void openRegistryDB().then((db) => {
      if (!db) return;
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get(viewToken);
        getReq.onsuccess = () => {
          const existing = getReq.result as StoredBelgeShareLink | undefined;
          if (existing) {
            if (!existing.revokedAt) {
              existing.revokedAt = nowIso;
            }
            store.put(existing);
          }
        };
      } catch {
        // yoksay
      }
    });
  } else {
    const storage = getSafeLocalStorage();
    if (storage) {
      try {
        storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(inMemoryLinks));
      } catch (err) {
        console.warn("Yerel depolama iptal damgası kaydedilemedi:", err);
      }
    }
  }

  return [...inMemoryLinks];
}

/**
 * Belirtilen viewToken'a ait kaydı döner.
 */
export function getStoredShareLink(viewToken: string): StoredBelgeShareLink | null {
  ensureMemoryLoaded();
  return inMemoryLinks.find((item) => item.viewToken === viewToken) || null;
}

/**
 * Test ve temizlik amaçlı tüm kayıtları asenkron olarak siler.
 */
export async function clearStoredShareLinksAsync(): Promise<void> {
  inMemoryLinks = [];
  memoryInitialized = false;
  if (broadcastChannel) {
    try {
      broadcastChannel.close();
    } catch {
      // yoksay
    }
    broadcastChannel = null;
  }

  const storage = getSafeLocalStorage();
  if (storage) {
    try {
      storage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // yoksay
    }
  }

  if (isIndexedDbAvailable()) {
    const db = await openRegistryDB();
    if (db) {
      await new Promise<void>((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, "readwrite");
          tx.objectStore(STORE_NAME).clear();
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
          tx.onabort = () => resolve();
        } catch {
          resolve();
        }
      });
    }
  }
}

/**
 * Test ve temizlik amaçlı tüm kayıtları siler.
 */
export function clearStoredShareLinks(): void {
  inMemoryLinks = [];
  memoryInitialized = false;
  if (broadcastChannel) {
    try {
      broadcastChannel.close();
    } catch {
      // yoksay
    }
    broadcastChannel = null;
  }

  const storage = getSafeLocalStorage();
  if (storage) {
    try {
      storage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // yoksay
    }
  }

  if (isIndexedDbAvailable()) {
    void clearStoredShareLinksAsync();
  }
}

/**
 * Test izolasyonu için kayıt defteri durumunu sıfırlar.
 */
export function resetRegistryForTesting(): void {
  inMemoryLinks = [];
  memoryInitialized = false;
  dbPromise = null;
  if (broadcastChannel) {
    try {
      broadcastChannel.close();
    } catch {
      // yoksay
    }
    broadcastChannel = null;
  }
}
