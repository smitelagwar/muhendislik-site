import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  addStoredShareLink,
  clearStoredShareLinks,
  getStoredShareLink,
  getStoredShareLinks,
  markStoredLinkRevoked,
  type StoredBelgeShareLink,
} from "../../src/lib/belge-paylasim/local-link-registry";
import {
  formatShareExpiryTr,
  validateShareLinkSecurity,
} from "../../src/hooks/use-belge-share";

// Basit Memory Storage Mock'u
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

describe("ASAMA_07: Kullanıcı Bağlantı Geçmişi (Registry) ve Paylaşım Kancası Testleri", () => {
  let mockStorage: MockLocalStorage;

  beforeEach(() => {
    mockStorage = new MockLocalStorage();
    const globalContext = globalThis as unknown as {
      window?: { localStorage: unknown; location: { origin: string } };
    };
    globalContext.window = {
      localStorage: mockStorage,
      location: { origin: "https://muhendislik-site.vercel.app" },
    };
  });

  afterEach(() => {
    clearStoredShareLinks();
    const globalContext = globalThis as unknown as {
      window?: unknown;
    };
    delete globalContext.window;
  });

  // --------------------------------------------------------------------------
  // 1. Yerel Kayıt Defteri (Local Link Registry) Birim Testleri
  // --------------------------------------------------------------------------
  describe("1. Yerel Kayıt Defteri (Local Link Registry)", () => {
    it("1.1 Başlangıçta boş kayıt defteri boş dizi dönmelidir", () => {
      const links = getStoredShareLinks();
      assert.deepStrictEqual(links, []);
    });

    it("1.2 addStoredShareLink yeni bağlantıyı eklemeli ve getStoredShareLinks ile okunabilmelidir", () => {
      const sampleLink: StoredBelgeShareLink = {
        viewToken: "token-1",
        manageToken: "manage-1",
        documentId: "beton-dokum-tutanagi",
        url: "https://muhendislik-site.vercel.app/b/token-1",
        createdAt: "2026-10-23T12:00:00.000Z",
        expiresAt: "2027-01-21T12:00:00.000Z",
      };

      const updated = addStoredShareLink(sampleLink);
      assert.strictEqual(updated.length, 1);
      assert.strictEqual(updated[0].viewToken, "token-1");

      const readBack = getStoredShareLinks();
      assert.strictEqual(readBack.length, 1);
      assert.strictEqual(readBack[0].manageToken, "manage-1");
      assert.strictEqual(readBack[0].documentId, "beton-dokum-tutanagi");
    });

    it("1.3 Aynı viewToken tekrar eklendiğinde çoğaltılmamalı, güncellenmelidir", () => {
      const link1: StoredBelgeShareLink = {
        viewToken: "same-token",
        manageToken: "manage-old",
        documentId: "taahhutname",
        url: "https://muhendislik-site.vercel.app/b/same-token",
        createdAt: "2026-10-23T10:00:00.000Z",
        expiresAt: "2027-01-21T10:00:00.000Z",
      };

      const linkUpdated: StoredBelgeShareLink = {
        ...link1,
        manageToken: "manage-new",
      };

      addStoredShareLink(link1);
      addStoredShareLink(linkUpdated);

      const all = getStoredShareLinks();
      assert.strictEqual(all.length, 1);
      assert.strictEqual(all[0].manageToken, "manage-new");
    });

    it("1.4 Azami 20 bağlantı sınırı korunmalıdır (21. bağlantı eski kaydı düşürmelidir)", () => {
      for (let i = 1; i <= 25; i++) {
        addStoredShareLink({
          viewToken: `token-${i}`,
          manageToken: `manage-${i}`,
          documentId: "beton-dokum-tutanagi",
          url: `https://muhendislik-site.vercel.app/b/token-${i}`,
          createdAt: new Date(Date.now() + i * 1000).toISOString(),
          expiresAt: "2027-01-21T12:00:00.000Z",
        });
      }

      const all = getStoredShareLinks();
      assert.strictEqual(all.length, 20);
      // En son eklenen en başta olmalı
      assert.strictEqual(all[0].viewToken, "token-25");
      // 1..5 arasındaki eski bağlantılar düşmüş olmalı
      assert.strictEqual(all.some((l) => l.viewToken === "token-1"), false);
      assert.strictEqual(all.some((l) => l.viewToken === "token-5"), false);
      assert.strictEqual(all.some((l) => l.viewToken === "token-6"), true);
    });

    it("1.5 markStoredLinkRevoked belirtilen bağlantıya revokedAt damgası vurmalıdır", () => {
      const link: StoredBelgeShareLink = {
        viewToken: "token-to-revoke",
        manageToken: "manage-rev",
        documentId: "istifa",
        url: "https://muhendislik-site.vercel.app/b/token-to-revoke",
        createdAt: "2026-10-23T12:00:00.000Z",
        expiresAt: "2027-01-21T12:00:00.000Z",
      };

      addStoredShareLink(link);
      assert.strictEqual(getStoredShareLink("token-to-revoke")?.revokedAt, undefined);

      markStoredLinkRevoked("token-to-revoke");
      const revoked = getStoredShareLink("token-to-revoke");
      assert.ok(revoked?.revokedAt);
      assert.strictEqual(typeof revoked?.revokedAt, "string");
    });

    it("1.6 Bozuk veya geçersiz JSON durumunda çökmeden boş dizi dönmelidir", () => {
      mockStorage.setItem("belge_paylasim_user_registry_v1", "geçersiz bozuk JSON {{{{");
      const links = getStoredShareLinks();
      assert.deepStrictEqual(links, []);
    });

    it("1.7 localStorage devre dışı olduğunda (hata fırlattığında) güvenle çalışmalıdır", () => {
      const globalContext = globalThis as unknown as {
        window: { localStorage: unknown };
      };
      globalContext.window.localStorage = {
        getItem() {
          throw new Error("QuotaExceeded or StorageDisabled");
        },
        setItem() {
          throw new Error("QuotaExceeded or StorageDisabled");
        },
      };

      const links = getStoredShareLinks();
      assert.deepStrictEqual(links, []);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Güvenlik, URL ve Kapsam Kilitleri
  // --------------------------------------------------------------------------
  describe("2. Güvenlik, URL ve Kapsam Kilitleri", () => {
    it("2.1 formatShareExpiryTr Türkiye saat dilimi (+03:00) ile formatlamalıdır", () => {
      const formatted = formatShareExpiryTr("2026-11-20T12:00:00.000Z");
      assert.ok(formatted.includes("20.11.2026"));
      assert.ok(formatted.includes("15:00"));
    });

    it("2.2 validateShareLinkSecurity yetkisiz paylaşım kanallarını reddetmelidir", () => {
      assert.strictEqual(validateShareLinkSecurity("https://muhendislik-site.vercel.app/b/xyz123"), true);
      assert.strictEqual(validateShareLinkSecurity("http://localhost:3000/b/xyz123"), true);
      assert.strictEqual(validateShareLinkSecurity("https://wa.me/905551234567"), false);
      assert.strictEqual(validateShareLinkSecurity("https://api.whatsapp.com/send"), false);
      assert.strictEqual(validateShareLinkSecurity("mailto:info@muhendis.com"), false);
      assert.strictEqual(validateShareLinkSecurity("https://t.me/share"), false);
    });
  });
});
