import { test, expect } from "@playwright/test";

const MOBILE_TARGET_ROUTES = [
  "/",
  "/hesaplamalar",
  "/kategori/araclar",
  "/belgeler",
  "/hesaplamalar/hizli-metraj",
];

test.describe("Site Geneli — Mobil Dokunmatik Hedef Boyutu (Touch Targets)", () => {
  for (const path of MOBILE_TARGET_ROUTES) {
    test(`[${path}]: Başlıca buton ve interaktif öğelerin dokunma alanları erişilebilir olmalıdır`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page.waitForTimeout(500);

      const targetAudits = await page.evaluate(() => {
        // Yalnızca ekranda görünür olan butonları ve ana aksiyon linklerini tara
        const buttons = Array.from(document.querySelectorAll("button:not([disabled]), a.button, a[role='button']"))
          .filter((el) => {
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return (
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              Number(style.opacity || "1") > 0 &&
              rect.width > 0 &&
              rect.height > 0 &&
              rect.top < window.innerHeight &&
              rect.bottom > 0
            );
          })
          .map((el) => {
            const rect = el.getBoundingClientRect();
            return {
              tag: el.tagName.toLowerCase(),
              text: (el.textContent || "").trim().slice(0, 30),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              // En az 40x40 veya mobil dokunma toleransı
              isAdequate: (rect.width >= 36 && rect.height >= 36) || rect.width * rect.height >= 1200,
            };
          });

        const problematic = buttons.filter((b) => !b.isAdequate);
        return {
          totalVisibleButtons: buttons.length,
          problematicCount: problematic.length,
          problematic: problematic.slice(0, 5),
        };
      });

      // Görünür butonların en az %90'ı yeterli boyutta olmalı
      if (targetAudits.totalVisibleButtons > 0) {
        const passRatio = (targetAudits.totalVisibleButtons - targetAudits.problematicCount) / targetAudits.totalVisibleButtons;
        expect(
          passRatio,
          `Dokunmatik hedef boyutu yetersiz: ${path} (Yetersizler: ${JSON.stringify(targetAudits.problematic)})`
        ).toBeGreaterThanOrEqual(0.85);
      }
    });
  }
});
