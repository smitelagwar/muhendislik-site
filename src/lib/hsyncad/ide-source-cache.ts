/**
 * Açık ideCAD kaynağının baytlarını tarayıcıda (IndexedDB) saklar.
 *
 * Neden: native kaydetme, `.hsyncad` modelinin içinde taşınmayan özgün dosya
 * baytlarına ihtiyaç duyar. Sayfa yenilenince oturum kaybolduğu için kullanıcı
 * aynı dosyayı tekrar seçmek zorunda kalıyordu. Bu önbellek, seçilen kaynağı
 * proje kimliğiyle eşleştirir; başarısız ortamda (gizli mod, kota) sessizce
 * devre dışı kalır ve akış dosya seçimine düşer.
 */

const DB_NAME = "hsyncad-ide-source";
const STORE = "sources";
const DB_VERSION = 1;

export type IdeSourceIdentity = { filename: string; byteLength: number };

/** Proje kaynağı için kararlı anahtar: dosya adı + boyut. */
export function ideSourceCacheKey(source: IdeSourceIdentity): string {
  return `${source.filename}::${source.byteLength}`;
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise(resolve => {
    let request: IDBOpenDBRequest;
    try { request = indexedDB.open(DB_NAME, DB_VERSION); }
    catch { resolve(null); return; }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

/** Kaynağı önbelleğe yazar; başarısız ortamda `false` döner. */
export async function cacheIdeSource(key: string, file: File): Promise<boolean> {
  const db = await openDatabase();
  if (!db) return false;
  try {
    const blob = new Blob([await file.arrayBuffer()], { type: "application/octet-stream" });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ name: file.name, type: file.type, lastModified: file.lastModified, blob }, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    return true;
  } catch { return false; }
  finally { db.close(); }
}

/** Önbellekteki kaynağı `File` olarak döndürür; yoksa `null`. */
export async function readCachedIdeSource(key: string): Promise<File | null> {
  const db = await openDatabase();
  if (!db) return null;
  type Stored = { name?: string; type?: string; lastModified?: number; blob?: Blob };
  try {
    const record = await new Promise<Stored | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).get(key);
      request.onsuccess = () => resolve((request.result as Stored | undefined) ?? null);
      request.onerror = () => reject(request.error);
    });
    if (!record?.blob) return null;
    return new File([record.blob], record.name ?? "kaynak.ide11", {
      type: record.type || "application/octet-stream",
      lastModified: record.lastModified ?? Date.now(),
    });
  } catch { return null; }
  finally { db.close(); }
}

/** Önbellek kaydını siler (kaynak değişince eski baytlar kullanılmasın). */
export async function dropCachedIdeSource(key: string): Promise<void> {
  const db = await openDatabase();
  if (!db) return;
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch { /* önbellek yoksa sessiz geç */ }
  finally { db.close(); }
}
