// ============================================================================
// BELGE PAYLAŞIM — KULLANICI CİHAZ KAYIT DEFTERİ (LOCAL LINK REGISTRY)
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

const REGISTRY_STORAGE_KEY = "belge_paylasim_user_registry_v1";
const MAX_STORED_LINKS = 20;

function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }
  try {
    const testKey = "__test_storage_avail__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Bu tarayıcıda oluşturulmuş bağlantıları döner (en son oluşturulan ilk sırada).
 */
export function getStoredShareLinks(): StoredBelgeShareLink[] {
  if (!isLocalStorageAvailable()) return [];

  try {
    const raw = window.localStorage.getItem(REGISTRY_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Veri bütünlüğü doğrulaması
    return parsed.filter(
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
  } catch (err) {
    console.warn("Yerel bağlantı geçmişi okunamadı:", err);
    return [];
  }
}

/**
 * Yeni oluşturulan bağlantıyı yerel kayıt defterine ekler.
 * Azami 20 bağlantı sınırını korur (eski kayıtları temizler).
 */
export function addStoredShareLink(link: StoredBelgeShareLink): StoredBelgeShareLink[] {
  if (!isLocalStorageAvailable()) return [link];

  try {
    const current = getStoredShareLinks();

    // Aynı viewToken zaten varsa güncelle, yoksa başa ekle
    const filtered = current.filter((item) => item.viewToken !== link.viewToken);
    const updated = [link, ...filtered].slice(0, MAX_STORED_LINKS);

    window.localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn("Yerel bağlantı kaydedilemedi:", err);
    return [link];
  }
}

/**
 * Belirtilen bağlantıyı yerelde 'revoked' olarak işaretler.
 */
export function markStoredLinkRevoked(viewToken: string): StoredBelgeShareLink[] {
  if (!isLocalStorageAvailable()) return [];

  try {
    const current = getStoredShareLinks();
    const updated = current.map((item) => {
      if (item.viewToken === viewToken) {
        return {
          ...item,
          revokedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    window.localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn("Yerel bağlantı iptal durumu güncellenemedi:", err);
    return [];
  }
}

/**
 * Belirtilen viewToken'a ait kaydı döner.
 */
export function getStoredShareLink(viewToken: string): StoredBelgeShareLink | null {
  const current = getStoredShareLinks();
  return current.find((item) => item.viewToken === viewToken) || null;
}

/**
 * Test ve temizlik amaçlı tüm kayıtları siler.
 */
export function clearStoredShareLinks(): void {
  if (!isLocalStorageAvailable()) return;
  try {
    window.localStorage.removeItem(REGISTRY_STORAGE_KEY);
  } catch {
    // yoksay
  }
}
