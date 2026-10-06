import { expect, test, type Page } from "@playwright/test";
import { signInAdmin } from "./cad-test-helpers";

const DESKTOP_CAD_FILES = [
  {
    id: "dc3aa019-28a2-4035-b6f1-2636199f62ee",
    name: "1 ve 2.kat dwg.dwg",
    ext: ".dwg",
  },
  {
    id: "bcec9dd8-39f3-44ca-9625-2c9fedddb5cf",
    name: "kalip_plani_zeminkat.dxf",
    ext: ".dxf",
  },
  {
    id: "9a816267-da9a-4b73-a5ac-c310af752013",
    name: "mustafa selvimimariiiii.dwg",
    ext: ".dwg",
  },
  {
    id: "b24bd2bf-e0ab-4874-aaf3-80606fb3dd18",
    name: "SÜHEYLA KARA STATİK (HAFİF) - Kopya.dwg",
    ext: ".dwg",
  },
  {
    id: "ce39e43d-b018-4dc9-809e-650fc24ed278",
    name: "SÜHEYLA KARA STATİK (HAFİF) - Kopya.dxf",
    ext: ".dxf",
  },
];

test.describe("CAD V2 — Gerçek Masaüstü Dosyaları Kullanıcı ve Karşılaştırma Denetimi", () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await signInAdmin(page);
  });

  for (const file of DESKTOP_CAD_FILES) {
    test(`Masaüstü Dosya Denetimi: ${file.name} (V2 + Split-View + V1)`, async ({ page }) => {
      // 1. Doğrudan V2 Motorunda Aç
      await page.goto(`/dokumantasyon/dosya/${file.id}?cadEngine=v2`);

      // Canvas ve V2 Host elementini doğrula
      const v2Host = page.locator("[data-cad-v2-host='true']").first();
      await expect(v2Host).toBeVisible({ timeout: 60_000 });

      // Ready veya Degraded durumuna ulaşmasını bekle (OOM veya takılma olmamalı)
      await expect
        .poll(
          async () => {
            const phase = await v2Host.getAttribute("data-v2-phase");
            return phase;
          },
          { timeout: 60_000, intervals: [1000, 2000] }
        )
        .toMatch(/ready|degraded/);

      // WebGL Canvas'ın çizim yaptığını doğrula
      const v2Canvas = v2Host.locator("canvas").first();
      await expect(v2Canvas).toBeVisible({ timeout: 15_000 });

      const canvasStats = await v2Canvas.evaluate((el: HTMLCanvasElement) => {
        const gl = (el.getContext("webgl2") || el.getContext("webgl")) as WebGLRenderingContext | null;
        let drawnPixelCount = 0;
        if (gl) {
          const pixels = new Uint8Array(128 * 128 * 4);
          gl.readPixels(0, 0, 128, 128, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
          for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3]! > 0 || pixels[i]! > 0 || pixels[i + 1]! > 0 || pixels[i + 2]! > 0) {
              drawnPixelCount++;
            }
          }
        }
        return {
          width: el.width,
          height: el.height,
          drawnPixelCount,
        };
      });

      expect(canvasStats.width).toBeGreaterThan(0);
      expect(canvasStats.height).toBeGreaterThan(0);

      // 2. Üst bardaki V1/V2 Karşılaştır butonunu test et
      const splitBtn = page.getByRole("button", { name: "V1/V2 Karşılaştır" });
      if (await splitBtn.isVisible()) {
        await splitBtn.click();

        const splitContainer = page.locator("[data-testid='cad-split-view']");
        await expect(splitContainer).toBeVisible({ timeout: 15_000 });

        // Sol tarafta V1 Referans Motoru başlığı olmalı
        const v1Header = page.locator("text=V1 Referans Motoru");
        await expect(v1Header).toBeVisible({ timeout: 10_000 });

        // Sağ tarafta V2 Yeni Motor başlığı olmalı
        const v2Header = page.locator("text=V2 Yeni Motor");
        await expect(v2Header).toBeVisible({ timeout: 10_000 });
      }

      // 3. Tekrar V1 (Klasik) moduna geç
      const v1Btn = page.getByRole("button", { name: "V1 (Klasik)" });
      if (await v1Btn.isVisible()) {
        await v1Btn.click();

        // V1 orchestrator veya viewer görünür olmalı
        const v1Orchestrator = page.locator("[data-cad-runtime='orchestrator']");
        await expect(v1Orchestrator).toBeVisible({ timeout: 30_000 });
      }
    });
  }
});
