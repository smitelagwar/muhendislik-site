import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  addStoredShareLink,
  checkStorageHealth,
  clearStoredShareLinks,
  clearStoredShareLinksAsync,
  getSafeLocalStorage,
  getStoredShareLink,
  getStoredShareLinks,
  getStoredShareLinksPaged,
  isIndexedDbAvailable,
  isLocalStorageAvailable,
  markStoredLinkRevoked,
  migrateLegacyLocalStorage,
  openRegistryDB,
  resetRegistryForTesting,
  type StoredBelgeShareLink,
} from "../../src/lib/belge-paylasim/local-link-registry";

// ----------------------------------------------------------------------------
// Bellek İçi IndexedDB Mock'u (Node.js Test Ortamında IDB Simülasyonu)
// ----------------------------------------------------------------------------

class MockIDBRequest {
  result: unknown = null;
  error: Error | null = null;
  onsuccess: ((ev: { target: MockIDBRequest }) => void) | null = null;
  onerror: ((ev: { target: MockIDBRequest }) => void) | null = null;
  transaction: MockIDBTransaction | null = null;

  triggerSuccess(result: unknown): void {
    this.result = result;
    if (this.onsuccess) this.onsuccess({ target: this });
  }

  triggerError(err: Error): void {
    this.error = err;
    if (this.onerror) this.onerror({ target: this });
  }
}

class MockIDBIndex {
  constructor(private store: MockIDBObjectStore, public name: string) {}

  openCursor(range?: unknown, direction?: "next" | "prev"): MockIDBRequest {
    const req = new MockIDBRequest();
    queueMicrotask(() => {
      const items = Array.from(this.store.records.values());
      // createdAt'e göre sırala
      items.sort((a, b) => {
        const timeA = new Date(a.createdAt as string).getTime();
        const timeB = new Date(b.createdAt as string).getTime();
        return direction === "prev" ? timeB - timeA : timeA - timeB;
      });

      let currentIndex = 0;
      const makeCursor = (): unknown => {
        if (currentIndex >= items.length) return null;
        return {
          value: items[currentIndex],
          continue: () => {
            currentIndex++;
            req.triggerSuccess(makeCursor());
          },
          advance: (count: number) => {
            currentIndex += count;
            req.triggerSuccess(makeCursor());
          },
        };
      };

      req.triggerSuccess(makeCursor());
    });
    return req;
  }
}

class MockIDBObjectStore {
  records = new Map<string, Record<string, unknown>>();
  indexes = new Map<string, MockIDBIndex>();

  constructor(public name: string, public keyPath: string, public tx: MockIDBTransaction) {}

  createIndex(name: string): MockIDBIndex {
    const idx = new MockIDBIndex(this, name);
    this.indexes.set(name, idx);
    return idx;
  }

  index(name: string): MockIDBIndex {
    const idx = this.indexes.get(name);
    if (!idx) throw new Error(`Index ${name} not found`);
    return idx;
  }

  get(key: string): MockIDBRequest {
    const req = new MockIDBRequest();
    queueMicrotask(() => {
      req.triggerSuccess(this.records.get(key) ?? undefined);
    });
    return req;
  }

  put(value: Record<string, unknown>): MockIDBRequest {
    const req = new MockIDBRequest();
    queueMicrotask(() => {
      const key = value[this.keyPath] as string;
      this.records.set(key, { ...value });
      req.triggerSuccess(key);
    });
    return req;
  }

  count(): MockIDBRequest {
    const req = new MockIDBRequest();
    queueMicrotask(() => {
      req.triggerSuccess(this.records.size);
    });
    return req;
  }

  getAll(): MockIDBRequest {
    const req = new MockIDBRequest();
    queueMicrotask(() => {
      req.triggerSuccess(Array.from(this.records.values()));
    });
    return req;
  }

  clear(): MockIDBRequest {
    const req = new MockIDBRequest();
    queueMicrotask(() => {
      this.records.clear();
      req.triggerSuccess(undefined);
    });
    return req;
  }
}

class MockIDBTransaction {
  stores = new Map<string, MockIDBObjectStore>();
  oncomplete: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;

  constructor(public db: MockIDBDatabase, public mode: string) {}

  objectStore(name: string): MockIDBObjectStore {
    let store = this.db.stores.get(name);
    if (!store) {
      store = new MockIDBObjectStore(name, "viewToken", this);
      this.db.stores.set(name, store);
    }
    return store;
  }
}

class MockIDBDatabase {
  stores = new Map<string, MockIDBObjectStore>();
  objectStoreNames = {
    contains: (name: string) => this.stores.has(name),
  };

  createObjectStore(name: string, options: { keyPath: string }): MockIDBObjectStore {
    const dummyTx = new MockIDBTransaction(this, "versionchange");
    const store = new MockIDBObjectStore(name, options.keyPath, dummyTx);
    this.stores.set(name, store);
    return store;
  }

  transaction(storeNames: string | string[], mode: string): MockIDBTransaction {
    const tx = new MockIDBTransaction(this, mode);
    // Microtask bitiminde tamamlandı tetikle
    queueMicrotask(() => {
      if (this._shouldFailTx) {
        if (tx.onerror) tx.onerror();
      } else {
        if (tx.oncomplete) tx.oncomplete();
      }
    });
    return tx;
  }

  _shouldFailTx = false;
}

class MockIDBFactory {
  databases = new Map<string, MockIDBDatabase>();

  open(name: string): MockIDBRequest & { onupgradeneeded?: (ev: unknown) => void; onblocked?: () => void } {
    const req = new MockIDBRequest() as MockIDBRequest & { onupgradeneeded?: (ev: unknown) => void; onblocked?: () => void };
    queueMicrotask(() => {
      let db = this.databases.get(name);
      if (!db) {
        db = new MockIDBDatabase();
        this.databases.set(name, db);
        if (req.onupgradeneeded) {
          req.result = db;
          req.onupgradeneeded({ target: req });
        }
      }
      req.triggerSuccess(db);
    });
    return req;
  }
}

// Basit LocalStorage Mock'u
class MockLocalStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// ----------------------------------------------------------------------------
// ASAMA_08 Kapsamlı Test Paketi
// ----------------------------------------------------------------------------

describe("ASAMA_08: Kalıcı Yönetim Geçmişi, IndexedDB ve Eski Depolama Geçişi", () => {
  let mockStorage: MockLocalStorage;
  let mockIDB: MockIDBFactory;

  beforeEach(async () => {
    resetRegistryForTesting();
    mockStorage = new MockLocalStorage();
    mockIDB = new MockIDBFactory();

    const globalContext = globalThis as unknown as {
      window?: { localStorage: unknown; location: { origin: string }; indexedDB?: unknown };
      indexedDB?: unknown;
    };

    globalContext.window = {
      localStorage: mockStorage,
      location: { origin: "https://muhendislik-site.vercel.app" },
      indexedDB: mockIDB,
    };
    globalContext.indexedDB = mockIDB;
  });

  afterEach(async () => {
    await clearStoredShareLinksAsync();
    resetRegistryForTesting();
    const globalContext = globalThis as unknown as {
      window?: unknown;
      indexedDB?: unknown;
    };
    delete globalContext.window;
    delete globalContext.indexedDB;
  });

  // --------------------------------------------------------------------------
  // 1. N06: localStorage Getter Hata Yönetimi
  // --------------------------------------------------------------------------
  describe("1. N06: Depolama Getter Hata Yönetimi", () => {
    it("1.1 window.localStorage getter SecurityError fırlattığında uygulama çökmemelidir", () => {
      const globalContext = globalThis as unknown as {
        window: { location: { origin: string } };
      };

      // SecurityError fırlatan getter tanımla (Safari gizli mod veya çerez engeli)
      Object.defineProperty(globalContext.window, "localStorage", {
        get() {
          throw new Error("SecurityError: Access to localStorage is denied");
        },
        configurable: true,
      });

      assert.doesNotThrow(() => {
        const available = isLocalStorageAvailable();
        assert.strictEqual(available, false);
      });

      assert.doesNotThrow(() => {
        const links = getStoredShareLinks();
        assert.ok(Array.isArray(links));
      });
    });

    it("1.2 getSafeLocalStorage getter hatasını yakalayarak güvenle null dönmelidir", () => {
      const globalContext = globalThis as unknown as {
        window: { location: { origin: string } };
      };

      Object.defineProperty(globalContext.window, "localStorage", {
        get() {
          throw new DOMException("Access is denied", "SecurityError");
        },
        configurable: true,
      });

      const safe = getSafeLocalStorage();
      assert.strictEqual(safe, null);
    });
  });

  // --------------------------------------------------------------------------
  // 2. F31: 4.500 Aktif Kaydın Sayısal Sınırla Atılmaması ve Sayfalama
  // --------------------------------------------------------------------------
  describe("2. F31: 4.500 Aktif Kayıt ve Sayfalı Erişim", () => {
    it("2.1 4.500 aktif bağlantı eklendiğinde hiçbir anahtar sessizce atılmamalıdır", () => {
      // 4.500 kayıt üret
      const totalCount = 4500;
      for (let i = 1; i <= totalCount; i++) {
        addStoredShareLink({
          viewToken: `vtoken-${i}`,
          manageToken: `mtoken-${i}`,
          documentId: i % 2 === 0 ? "beton-dokum-tutanagi" : "istifa-dilekcesi",
          url: `https://muhendislik-site.vercel.app/b/vtoken-${i}`,
          createdAt: new Date(Date.now() - (totalCount - i) * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 90 * 86400 * 1000).toISOString(),
        });
      }

      const all = getStoredShareLinks();
      assert.strictEqual(all.length, totalCount);

      // İlk ve son kayıtların varlığını doğrula
      assert.ok(getStoredShareLink("vtoken-1"));
      assert.ok(getStoredShareLink("vtoken-4500"));
      assert.strictEqual(all[0].viewToken, "vtoken-4500"); // En yeni en başta
    });

    it("2.2 getStoredShareLinksPaged sayfalı sorgu doğru offset ve limit dönmelidir", async () => {
      clearStoredShareLinks();
      for (let i = 1; i <= 50; i++) {
        addStoredShareLink({
          viewToken: `page-tok-${i}`,
          manageToken: `manage-tok-${i}`,
          documentId: "taahhutname",
          url: `https://muhendislik-site.vercel.app/b/page-tok-${i}`,
          createdAt: new Date(Date.now() - (50 - i) * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 90 * 86400 * 1000).toISOString(),
        });
      }

      // Sayfa 1: ilk 10 kayıt
      const page1 = await getStoredShareLinksPaged({ offset: 0, limit: 10 });
      assert.strictEqual(page1.items.length, 10);
      assert.strictEqual(page1.total, 50);
      assert.strictEqual(page1.hasMore, true);
      assert.strictEqual(page1.items[0].viewToken, "page-tok-50");

      // Sayfa 2: sonraki 10 kayıt
      const page2 = await getStoredShareLinksPaged({ offset: 10, limit: 10 });
      assert.strictEqual(page2.items.length, 10);
      assert.strictEqual(page2.offset, 10);
      assert.strictEqual(page2.items[0].viewToken, "page-tok-40");

      // Son sayfa: offset 45, limit 10 -> 5 kayıt dönmeli
      const lastPage = await getStoredShareLinksPaged({ offset: 45, limit: 10 });
      assert.strictEqual(lastPage.items.length, 5);
      assert.strictEqual(lastPage.hasMore, false);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Eski Depolama Geçişi (Legacy Migration) ve Kesinti Güvenliği
  // --------------------------------------------------------------------------
  describe("3. Eski Depolama Geçişi (Legacy Migration)", () => {
    it("3.1 Eski localStorage'daki 20 kayıt IndexedDB'ye aktarılmalı ve işlem tamamlanınca silinmelidir", async () => {
      const legacyRecords: StoredBelgeShareLink[] = [];
      for (let i = 1; i <= 20; i++) {
        legacyRecords.push({
          viewToken: `legacy-token-${i}`,
          manageToken: `legacy-manage-${i}`,
          documentId: "beton-dokum-tutanagi",
          url: `https://muhendislik-site.vercel.app/b/legacy-token-${i}`,
          createdAt: new Date(Date.now() - i * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 90 * 86400 * 1000).toISOString(),
        });
      }
      mockStorage.setItem("belge_paylasim_user_registry_v1", JSON.stringify(legacyRecords));

      const db = (await openRegistryDB()) as MockIDBDatabase;
      assert.ok(db);

      const migrationResult = await migrateLegacyLocalStorage(db as unknown as IDBDatabase);
      assert.strictEqual(migrationResult.success, true);
      assert.strictEqual(migrationResult.migratedCount, 20);

      // Kalıcı aktarım doğrulandıktan sonra eski localStorage kaydı silinmiş olmalıdır
      assert.strictEqual(mockStorage.getItem("belge_paylasim_user_registry_v1"), null);

      // IndexedDB store'unda 20 kayıt var mı?
      const store = db.stores.get("links");
      assert.ok(store);
      assert.strictEqual(store.records.size, 20);
      assert.ok(store.records.get("legacy-token-1"));
    });

    it("3.2 Kalıcı yazma başarısız olursa veya kesilirse eski localStorage verisi SİLİNMEMELİDİR", async () => {
      const legacyRecords = [
        {
          viewToken: "safe-token-1",
          manageToken: "safe-manage-1",
          documentId: "istifa-dilekcesi",
          url: "https://muhendislik-site.vercel.app/b/safe-token-1",
          createdAt: new Date().toISOString(),
          expiresAt: new Date().toISOString(),
        },
      ];
      mockStorage.setItem("belge_paylasim_user_registry_v1", JSON.stringify(legacyRecords));

      const db = (await openRegistryDB()) as MockIDBDatabase;
      // Hata enjekte et (transaction başarısız olsun)
      db._shouldFailTx = true;

      const migrationResult = await migrateLegacyLocalStorage(db as unknown as IDBDatabase);
      assert.strictEqual(migrationResult.success, false);

      // Kural: Kalıcı yazma doğrulanmadığı için eski veri localStorage'da korunmalıdır!
      const stillThere = mockStorage.getItem("belge_paylasim_user_registry_v1");
      assert.ok(stillThere);
      assert.ok(stillThere.includes("safe-token-1"));
    });

    it("3.3 Bozuk JSON içeren legacy veri çökmeye neden olmadan temizlenmelidir", async () => {
      mockStorage.setItem("belge_paylasim_user_registry_v1", "INVALID_JSON_CORRUPT{{{{");
      const db = (await openRegistryDB()) as MockIDBDatabase;
      const res = await migrateLegacyLocalStorage(db as unknown as IDBDatabase);
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.migratedCount, 0);
    });
  });

  // --------------------------------------------------------------------------
  // 4. İki Sekme Yarışı ve Stale Event ile Revoke Koruması
  // --------------------------------------------------------------------------
  describe("4. İki Sekme Yarışı ve Stale Event Koruması", () => {
    it("4.1 İptal edilmiş bir kayıt, gelen eski bir upsert veya stale event ile tekrar aktifleşemez", () => {
      const sampleLink: StoredBelgeShareLink = {
        viewToken: "race-token-1",
        manageToken: "race-manage-1",
        documentId: "sozlesme",
        url: "https://muhendislik-site.vercel.app/b/race-token-1",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 90 * 86400 * 1000).toISOString(),
      };

      // 1. Sekme bağlantıyı ekler
      addStoredShareLink(sampleLink);
      assert.strictEqual(getStoredShareLink("race-token-1")?.revokedAt, undefined);

      // 2. Sekme bağlantıyı iptal eder
      markStoredLinkRevoked("race-token-1");
      const revokedLink = getStoredShareLink("race-token-1");
      assert.ok(revokedLink?.revokedAt);
      const originalRevokedAt = revokedLink.revokedAt;

      // 3. Sekme 1'den gecikmiş/stale bir upsert gelir (revokedAt bilgisi yok)
      addStoredShareLink({
        ...sampleLink,
        manageToken: "race-manage-stale-update",
      });

      // Kural: İptal durumu silinemez, revokedAt korunmalıdır!
      const afterStale = getStoredShareLink("race-token-1");
      assert.ok(afterStale?.revokedAt, "Stale event iptal edilmiş bağlantıyı tekrar aktif yapmamalıdır!");
      assert.strictEqual(afterStale.revokedAt, originalRevokedAt);
    });

    it("4.2 Kayıt verisinde hiçbir ham form verisi veya PDF baytı bulunmamalıdır", () => {
      const link: StoredBelgeShareLink = {
        viewToken: "clean-token",
        manageToken: "clean-manage",
        documentId: "beton-dokum-tutanagi",
        url: "https://muhendislik-site.vercel.app/b/clean-token",
        createdAt: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
      };

      addStoredShareLink(link);
      const retrieved = getStoredShareLink("clean-token") as Record<string, unknown>;

      // Hassas alan kontrolleri
      assert.strictEqual(retrieved.values, undefined);
      assert.strictEqual(retrieved.formData, undefined);
      assert.strictEqual(retrieved.pdfBytes, undefined);
      assert.strictEqual(retrieved.rawPdf, undefined);
      assert.strictEqual(retrieved.contractorName, undefined);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Depolama Durumu ve Uyarılar
  // --------------------------------------------------------------------------
  describe("5. Depolama Durumu ve Ön Bilgilendirme", () => {
    it("5.1 IndexedDB mevcut olduğunda persistent ve available dönmelidir", () => {
      assert.strictEqual(isIndexedDbAvailable(), true);
      const health = checkStorageHealth();
      assert.strictEqual(health.isAvailable, true);
      assert.strictEqual(health.isPersistent, true);
      assert.strictEqual(health.engine, "indexeddb");
    });

    it("5.2 Depolama tamamen kapalı olduğunda kullanıcıyı önceden uyaran bildirim üretmelidir", () => {
      const globalContext = globalThis as unknown as {
        window: { location: { origin: string }; indexedDB?: unknown };
        indexedDB?: unknown;
      };

      delete globalContext.indexedDB;
      delete globalContext.window.indexedDB;
      Object.defineProperty(globalContext.window, "localStorage", {
        get() {
          throw new Error("Storage disabled");
        },
        configurable: true,
      });

      const health = checkStorageHealth();
      assert.strictEqual(health.isAvailable, false);
      assert.strictEqual(health.isPersistent, false);
      assert.strictEqual(health.engine, "disabled");
      assert.ok(health.warning && health.warning.includes("kalıcı saklama"));
    });
  });
});
