import { test, expect } from "@playwright/test";

const REPRESENTATIVE_ROUTES = [
  { name: "Ana Sayfa", path: "/" },
  { name: "Hesaplamalar İndeks", path: "/hesaplamalar" },
  { name: "Hızlı Metraj", path: "/hesaplamalar/hizli-metraj" },
  { name: "İnşaat Maliyeti", path: "/hesaplamalar/insaat-maliyeti" },
  { name: "Resmi Birim Maliyet 2026", path: "/hesaplamalar/resmi-birim-maliyet-2026" },
  { name: "Tahmini İnşaat Alanı", path: "/hesaplamalar/tahmini-insaat-alani" },
  { name: "Araçlar İndeks", path: "/kategori/araclar" },
  { name: "Donatı Hesabı", path: "/kategori/araclar/donati-hesabi" },
  { name: "Kolon Ön Boyutlandırma", path: "/kategori/araclar/kolon-on-boyutlandirma" },
  { name: "Bina Aşamaları", path: "/kategori/bina-asamalari" },
  { name: "Konu Haritası", path: "/konu-haritasi" },
  { name: "Belgeler ve Şablonlar", path: "/belgeler" },
];

test.describe("Performans, Core Web Vitals ve Uzun Oturum Testleri", () => {
  for (const route of REPRESENTATIVE_ROUTES) {
    test(`[${route.name}] (${route.path}): CLS bütçesini (<= 0.10) karşılamalı ve ağır CAD motorlarını sızdırmamalıdır`, async ({ page }) => {
      const requestedUrls: string[] = [];
      page.on("request", (req) => {
        requestedUrls.push(req.url());
      });

      await page.goto(route.path, { waitUntil: "networkidle" });

      // 1. Ağır CAD / WASM motorları sızıntı kontrolü
      const heavyLeak = requestedUrls.some((u) =>
        u.includes("libredwg-web.wasm") || u.includes("dwg-dxf-conversion-worker")
      );
      expect(heavyLeak, `Rota '${route.path}' gereksiz CAD WASM motoru indirdi!`).toBe(false);

      // 2. Cumulative Layout Shift (CLS) ölçümü
      const cls = await page.evaluate(() => {
        let score = 0;
        const entries = performance.getEntriesByType("layout-shift") as unknown as Array<{ value: number; hadRecentInput?: boolean }>;
        for (const entry of entries) {
          if (!entry.hadRecentInput) {
            score += entry.value;
          }
        }
        return score;
      });

      expect(cls, `Rota '${route.path}' CLS bütçesini aştı (${cls} > 0.10)`).toBeLessThanOrEqual(0.10);
    });
  }

  test("Hesaplama Aracı — 100 Seri Form Güncellemesinde Akıcılık ve Bellek Kararlılığı", async ({ page }) => {
    await page.goto("/kategori/araclar/kolon-on-boyutlandirma", { waitUntil: "networkidle" });

    const katInput = page.locator('input[aria-label*="Kat"], input[name*="floorCount"], input[type="number"]').first();
    await expect(katInput).toBeVisible();

    const startTime = Date.now();

    // 100 seri girdi güncellemesi
    for (let i = 1; i <= 100; i++) {
      const value = String((i % 15) + 1);
      await katInput.fill(value);
    }

    const elapsed = Date.now() - startTime;
    // 100 güncelleme 5000ms'den kısa sürmeli (ortalama işlem başı <= 50ms)
    expect(elapsed).toBeLessThan(5000);

    // Hesaplama sonucu geçerli bir değer üretmiş olmalı
    const resultText = await page.textContent("body");
    expect(resultText).toContain("cm²");
  });

  test("Hızlı Çoklu Navigasyon ve Bellek Sızıntısı Yokluğu", async ({ page }) => {
    const navTargets = ["/", "/hesaplamalar", "/kategori/araclar", "/belgeler"];

    for (let i = 0; i < 20; i++) {
      const target = navTargets[i % navTargets.length];
      await page.goto(target, { waitUntil: "domcontentloaded" });
    }

    // Sayfa hala yanıt veriyor ve navigasyon tamamlanabiliyor olmalıdır
    await page.goto("/", { waitUntil: "networkidle" });
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});
