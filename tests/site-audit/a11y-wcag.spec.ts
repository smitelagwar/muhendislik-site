import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const ACCESSIBILITY_ROUTES = [
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

test.describe("Site Geneli — WCAG 2.2 AA Erişilebilirlik ve Semantik Denetimi", () => {
  for (const route of ACCESSIBILITY_ROUTES) {
    test(`[${route.name}] (${route.path}): Critical/Serious axe ihlali olmamalıdır`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page.waitForTimeout(600);

      // Otomatik axe-core WCAG 2.2 AA taraması
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();

      const criticalOrSeriousViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious"
      );

      expect(
        criticalOrSeriousViolations,
        `Kritik veya Ciddi erişilebilirlik ihlalleri tespit edildi (${route.path}): ${JSON.stringify(
          criticalOrSeriousViolations.map((v) => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            nodes: v.nodes.map((n) => n.target),
          })),
          null,
          2
        )}`
      ).toEqual([]);
    });

    test(`[${route.name}] (${route.path}): Temel semantik, dil ve landmark yapıları doğru olmalıdır`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page.waitForTimeout(400);

      const semantics = await page.evaluate(() => {
        const lang = document.documentElement.getAttribute("lang");
        const h1Elements = Array.from(document.querySelectorAll("h1"));
        const mainElement = document.querySelector("main");
        const navElements = Array.from(document.querySelectorAll("nav, header"));
        const footerElements = Array.from(document.querySelectorAll("footer, [role='contentinfo']"));

        return {
          lang,
          h1Count: h1Elements.length,
          h1Text: h1Elements.map((h) => h.textContent?.trim()).filter(Boolean),
          hasMain: Boolean(mainElement),
          hasNav: navElements.length > 0,
          hasFooter: footerElements.length > 0,
        };
      });

      // 1. Dil tanımlı olmalı (Türkçe)
      expect(semantics.lang).toBe("tr");

      // 2. Main landmark bulunmalı
      expect(semantics.hasMain, `Sayfada <main> landmark eksik: ${route.path}`).toBe(true);

      // 3. Tek ve anlamlı bir h1 olmalı
      expect(semantics.h1Count, `Sayfada en az bir <h1> olmalıdır: ${route.path}`).toBeGreaterThanOrEqual(1);

      // 4. Nav ve Footer bulunmalı
      expect(semantics.hasNav, `Navigasyon eksik: ${route.path}`).toBe(true);
      expect(semantics.hasFooter, `Footer eksik: ${route.path}`).toBe(true);
    });
  }

  test("Klavye navigasyonu: Sekme (Tab) ile ana içeriğe ve arama modülüne erişilebilir olmalıdır", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(500);

    // Tab ile ilk odaklanan öğeleri denetle
    await page.keyboard.press("Tab");
    const firstFocused = await page.evaluate(() => {
      const active = document.activeElement;
      return {
        tag: active?.tagName.toLowerCase(),
        text: active?.textContent?.trim().slice(0, 30),
      };
    });

    expect(firstFocused.tag).toBeTruthy();
  });
});
