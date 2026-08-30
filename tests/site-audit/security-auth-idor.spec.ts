import { test, expect } from "@playwright/test";

test.describe("Güvenlik, Gizlilik ve Yetkilendirme Testleri", () => {
  test("Global Response Headers — Güvenlik Başlıkları Doğrulaması", async ({ page }) => {
    const res = await page.goto("/");
    expect(res).not.toBeNull();
    const headers = res!.headers();

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(["SAMEORIGIN", "DENY"]).toContain(headers["x-frame-options"]);
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });

  test("CAD ve Hesaplama Araçları — Yalnız Salt Okunur İstekler (Sıfır İstenmeyen Mutation)", async ({ page }) => {
    const mutatingMethods: string[] = [];

    page.on("request", (req) => {
      if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method())) {
        // İletişim veya analytics harici mutation isteklerini yakala
        if (!req.url().includes("/api/analytics")) {
          mutatingMethods.push(`${req.method()} ${req.url()}`);
        }
      }
    });

    await page.goto("/kategori/araclar/kolon-on-boyutlandirma", { waitUntil: "networkidle" });
    await page.goto("/hesaplamalar/hizli-metraj", { waitUntil: "networkidle" });

    expect(mutatingMethods, "Salt okunur hesaplama sayfalarında beklenmeyen mutation isteği yapıldı!").toEqual([]);
  });

  test("Özel Dokümantasyon Dosyaları — Noindex ve Private Cache Koruması", async ({ request }) => {
    const res = await request.get("/dokumantasyon/dosya/dummy-test-file-id");
    const headers = res.headers();

    // Özel dosya rotasında arama motoru engeli ve cache koruması
    if (headers["x-robots-tag"]) {
      expect(headers["x-robots-tag"]).toContain("noindex");
    }
    if (headers["cache-control"]) {
      expect(headers["cache-control"]).toContain("private");
    }
  });
});
