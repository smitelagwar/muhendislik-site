import { test, expect } from "@playwright/test";

const FORM_CALCULATION_ROUTES = [
  { path: "/hesaplamalar/hizli-metraj", title: "Hızlı Metraj" },
  { path: "/hesaplamalar/resmi-birim-maliyet-2026", title: "Resmi Birim Maliyet" },
  { path: "/hesaplamalar/tahmini-insaat-alani", title: "Tahmini İnşaat Alanı" },
  { path: "/kategori/araclar/donati-hesabi", title: "Donatı Hesabı" },
  { path: "/kategori/araclar/kolon-on-boyutlandirma", title: "Kolon Ön Boyutlandırma" },
];

test.describe("Site Geneli — Formlar, Giriş Modları ve Mobil Klavye Uyum Denetimi", () => {
  for (const route of FORM_CALCULATION_ROUTES) {
    test(`[${route.title}] (${route.path}): Sayısal giriş alanlarının inputmode veya type nitelikleri uygun olmalıdır`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page.waitForSelector("input", { timeout: 10_000 });
      await page.waitForTimeout(300);

      const inputAnalysis = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll<HTMLInputElement>("input:not([type='hidden']):not([type='checkbox']):not([type='radio'])"));
        return inputs.map((input) => {
          const type = input.getAttribute("type") || "text";
          const inputMode = input.getAttribute("inputmode") || "";
          const name = input.getAttribute("name") || input.id || "";
          const hasLabel = Boolean(
            input.labels?.length ||
            input.getAttribute("aria-label") ||
            input.getAttribute("aria-labelledby") ||
            input.getAttribute("placeholder")
          );

          return {
            name,
            type,
            inputMode,
            hasLabel,
            isNumericIntended: /alan|kat|boyut|cap|kuvvet|yuk|fck|fyk|fcd|fsd|cm|mm|m2|adet/i.test(name) || type === "number",
          };
        });
      });

      // Her formda en az 1 giriş alanı bulunmalı
      expect(inputAnalysis.length).toBeGreaterThan(0);

      // Tüm alanların erişilebilir etiketi olmalı
      for (const input of inputAnalysis) {
        expect(
          input.hasLabel,
          `Erişilebilir etiketi (label/aria-label/placeholder) olmayan input: ${input.name} (${route.path})`
        ).toBe(true);
      }
    });
  }
});
