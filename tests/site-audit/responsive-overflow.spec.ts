import { test, expect } from "@playwright/test";

const REPRESENTATIVE_ROUTES = [
  { name: "Ana Sayfa", path: "/" },
  { name: "Hesaplamalar Ana Sayfa", path: "/hesaplamalar" },
  { name: "Hızlı Metraj", path: "/hesaplamalar/hizli-metraj" },
  { name: "İnşaat Maliyeti", path: "/hesaplamalar/insaat-maliyeti" },
  { name: "Resmi Birim Maliyet 2026", path: "/hesaplamalar/resmi-birim-maliyet-2026" },
  { name: "Tahmini İnşaat Alanı", path: "/hesaplamalar/tahmini-insaat-alani" },
  { name: "Araçlar Ana Sayfa", path: "/kategori/araclar" },
  { name: "Donatı Hesabı Aracı", path: "/kategori/araclar/donati-hesabi" },
  { name: "Kolon Ön Boyutlandırma", path: "/kategori/araclar/kolon-on-boyutlandirma" },
  { name: "Bina Aşamaları", path: "/kategori/bina-asamalari" },
  { name: "Konu Haritası", path: "/konu-haritasi" },
  { name: "Belgeler ve Şablonlar", path: "/belgeler" },
];

test.describe("Site Geneli — Responsive Düzen ve Yatay Taşma Denetimi", () => {
  for (const route of REPRESENTATIVE_ROUTES) {
    test(`[${route.name}] (${route.path}): yatay taşma ve layout taşması olmamalıdır`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page.waitForTimeout(500);

      const overflowData = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const hasOverflow = docWidth > winWidth + 1.5;

        // Viewport dışına taşan elementleri listele
        const leakingElements: Array<{ tag: string; id: string; className: string; right: number; winWidth: number }> = [];
        if (hasOverflow) {
          const allElements = document.querySelectorAll("body *");
          for (const el of allElements) {
            const rect = el.getBoundingClientRect();
            if (rect.right > winWidth + 2 && rect.width > 0 && rect.height > 0) {
              leakingElements.push({
                tag: el.tagName.toLowerCase(),
                id: el.id,
                className: typeof el.className === "string" ? el.className.slice(0, 80) : "",
                right: Math.round(rect.right),
                winWidth,
              });
              if (leakingElements.length >= 5) break;
            }
          }
        }

        return {
          hasOverflow,
          docWidth,
          winWidth,
          leakingElements,
        };
      });

      expect(
        overflowData.hasOverflow,
        `Yatay taşma tespit edildi: ${route.path} (scrollWidth: ${overflowData.docWidth}px, innerWidth: ${overflowData.winWidth}px, taşan öğeler: ${JSON.stringify(overflowData.leakingElements)})`
      ).toBe(false);
    });
  }
});
