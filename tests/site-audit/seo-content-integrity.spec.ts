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
  { name: "Hakkımızda", path: "/hakkimizda" },
  { name: "Gizlilik Politikası", path: "/gizlilik" },
  { name: "Kullanım Koşulları", path: "/kullanim-kosullari" },
  { name: "İletişim", path: "/iletisim" },
];

test.describe("SEO, Metadata ve İçerik Bütünlüğü Testleri", () => {
  for (const route of REPRESENTATIVE_ROUTES) {
    test(`[${route.name}] (${route.path}): Meta title, description, canonical ve Open Graph etiketleri eksiksiz olmalıdır`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "networkidle" });

      // Title doğrulaması
      const title = await page.title();
      expect(title.length, `Rota '${route.path}' title çok kısa`).toBeGreaterThanOrEqual(10);

      // Description doğrulaması
      const description = await page.locator('meta[name="description"]').getAttribute("content");
      expect(description, `Rota '${route.path}' meta description eksik`).toBeTruthy();
      expect(description!.length, `Rota '${route.path}' description çok kısa`).toBeGreaterThanOrEqual(30);

      // Canonical doğrulaması
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(canonical, `Rota '${route.path}' canonical link eksik`).toBeTruthy();
      if (route.path !== "/") {
        expect(canonical?.endsWith("/"), `Alt rota '${route.path}' kök dizini canonical olarak gösteremez`).toBe(false);
      }

      // H1 Hiyerarşisi
      const h1Count = await page.locator("h1").count();
      expect(h1Count, `Rota '${route.path}' tam olarak 1 adet h1 içermelidir`).toBe(1);

      // Open Graph ve Twitter etiketleri
      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
      expect(ogTitle, `Rota '${route.path}' og:title eksik`).toBeTruthy();

      const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute("content");
      expect(twitterCard, `Rota '${route.path}' twitter:card eksik`).toBeTruthy();
    });
  }

  test("Site İçi Arama — Türkçe Karakter ve Filtreleme Desteği", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Arama butonunu aç
    const searchTrigger = page.locator('button:has-text("Ara..."), button[aria-label*="Ara"], [data-testid="search-trigger"]').first();
    if (await searchTrigger.isVisible()) {
      await searchTrigger.click();

      const searchInput = page.locator('input[placeholder*="ara" i], input[type="search"]').first();
      await expect(searchInput).toBeVisible();

      // Türkçe karakterli arama terimi ("donatı")
      await searchInput.fill("donatı");
      await page.waitForTimeout(300);

      // Sonuçların listelenmesini doğrula
      const results = page.locator('[role="dialog"] a, [role="listbox"] [role="option"]');
      const count = await results.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test("Sitemap ve Robots.txt — Güvenlik ve İndekslenebilirlik Kuralları", async ({ request }) => {
    // robots.txt kontrolü
    const robotsRes = await request.get("/robots.txt");
    expect(robotsRes.ok()).toBe(true);
    const robotsText = await robotsRes.text();
    expect(robotsText).toContain("Disallow: /api/");
    expect(robotsText).toContain("Disallow: /dokumantasyon");
    expect(robotsText).toContain("sitemap.xml");

    // sitemap.xml kontrolü
    const sitemapRes = await request.get("/sitemap.xml");
    expect(sitemapRes.ok()).toBe(true);
    const sitemapText = await sitemapRes.text();
    expect(sitemapText).not.toContain("/dokumantasyon");
    expect(sitemapText).not.toContain("/p/");
    expect(sitemapText).toContain("/kategori/araclar");
  });
});
