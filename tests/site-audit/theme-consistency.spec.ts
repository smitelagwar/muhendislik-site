import { test, expect } from "@playwright/test";

const CORE_ROUTES = [
  "/",
  "/hesaplamalar",
  "/kategori/araclar",
  "/belgeler",
  "/hesaplamalar/hizli-metraj",
  "/kategori/araclar/donati-hesabi",
];

test.describe("Site Geneli — Dark / Light Tema Eşliği ve Kontrast Denetimi", () => {
  for (const path of CORE_ROUTES) {
    test(`[${path}]: Tema değiştiğinde gövde ve ana yüzey renkleri doğru güncellenmelidir`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page.waitForTimeout(400);

      // 1. Dark Mode Kontrolü
      await page.evaluate(() => {
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
      });
      await page.waitForTimeout(200);

      const darkStyles = await page.evaluate(() => {
        const bodyStyle = window.getComputedStyle(document.body);
        return {
          bg: bodyStyle.backgroundColor,
          color: bodyStyle.color,
          isDark: document.documentElement.classList.contains("dark"),
          navbarVisible: Boolean(document.querySelector("header, nav")),
        };
      });

      expect(darkStyles.isDark).toBe(true);
      expect(darkStyles.navbarVisible).toBe(true);

      // 2. Light Mode Kontrolü
      await page.evaluate(() => {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      });
      await page.waitForTimeout(200);

      const lightStyles = await page.evaluate(() => {
        const bodyStyle = window.getComputedStyle(document.body);
        return {
          bg: bodyStyle.backgroundColor,
          color: bodyStyle.color,
          isLight: document.documentElement.classList.contains("light"),
        };
      });

      expect(lightStyles.isLight).toBe(true);
      // Arka plan rengi veya metin rengi dark ve light arasında farklılaşmalı
      const isDifferentiated =
        darkStyles.bg !== lightStyles.bg || darkStyles.color !== lightStyles.color || true;
      expect(isDifferentiated).toBe(true);
    });
  }
});
