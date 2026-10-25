import { test, expect } from "@playwright/test";

const SLUGS = [
  "kolon-detayi",
  "kiris-detayi",
  "kolon-kiris-birlesimi",
  "tekil-temel",
  "perde-detayi",
  "radye-temel",
] as const;

test.describe("Aşama 08 — Stüdyo Etkileşim, Kamera Hassasiyeti ve Regresyon Doğrulaması", () => {
  test("Altı sahnede görünürlük, tek WebGL canvas, çizim çağrısı ve sıfır yatay taşma", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.setViewportSize({ width: 1920, height: 1080 });

    for (const slug of SLUGS) {
      await page.goto(`/kategori/araclar/simulasyonlar/${slug}`, {
        waitUntil: "domcontentloaded",
      });

      const canvasHost = page.getByTestId("simulation-canvas-host");
      await expect(canvasHost).toBeVisible({ timeout: 25_000 });
      await expect(page.locator("canvas")).toHaveCount(1);

      // Çizim çağrısı doğrulaması (geometri gerçekten GPU'ya iletiliyor)
      await expect
        .poll(async () => {
          const calls = Number(await canvasHost.getAttribute("data-draw-calls") || "0");
          return calls;
        })
        .toBeGreaterThan(3);

      // Viewport içi görünürlük kontrolü
      const hostBox = await canvasHost.boundingBox();
      expect(hostBox).not.toBeNull();
      if (hostBox) {
        expect(hostBox.width).toBeGreaterThanOrEqual(1200);
        expect(hostBox.height).toBeGreaterThanOrEqual(500);
        expect(hostBox.y).toBeLessThanOrEqual(450); // İlk ekranda (Fold-1)
      }

      // Yatay taşma kontrolü (0 px tolerans)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${slug} 1920px overflow`).toBeLessThanOrEqual(1);
    }

    expect(pageErrors).toEqual([]);
  });

  test("Kamera döndürme hassasiyetinin azaldığı doğrulaması (0.55 rotateSpeed hedefi)", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/kategori/araclar/simulasyonlar/kolon-detayi", {
      waitUntil: "domcontentloaded",
    });

    const canvasHost = page.getByTestId("simulation-canvas-host");
    await expect(canvasHost).toBeVisible({ timeout: 25_000 });

    const canvas = page.locator('[data-testid="simulation-3d-canvas"]');
    await canvas.scrollIntoViewIfNeeded();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    const initialAzimuth = Number(
      (await canvasHost.getAttribute("data-orbit-azimuth")) || "0",
    );

    const startX = box.x + box.width * 0.5;
    const startY = box.y + box.height * 0.5;

    // 100px yatay fare sürüklemesi
    await page.mouse.move(startX, startY);
    await page.mouse.down({ button: "left" });
    await page.mouse.move(startX + 100, startY, { steps: 10 });
    await page.mouse.up({ button: "left" });

    // Baseline'da 100px drag ~0.856 rad (-49°) idi.
    // %45 duyarlılık azaltımı (rotateSpeed = 0.55) ile azimuth farkı ~0.47 rad civarında olmalıdır.
    const deltaAzimuth = await page.evaluate(() => {
      const host = document.querySelector('[data-testid="simulation-canvas-host"]');
      return Number(host?.getAttribute("data-orbit-azimuth") || "0");
    });

    const diff = Math.abs(deltaAzimuth - initialAzimuth);
    // 0.35 rad < diff < 0.65 rad (baseline 0.856'dan belirgin biçimde daha sakin ve kontrollü)
    expect(diff).toBeGreaterThanOrEqual(0.35);
    expect(diff).toBeLessThanOrEqual(0.65);

    expect(pageErrors).toEqual([]);
  });

  test("Denetçi panelinde scroll yapılırken 3B sahne kamerasının sabit kalması", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/kategori/araclar/simulasyonlar/kolon-detayi", {
      waitUntil: "domcontentloaded",
    });

    const canvasHost = page.getByTestId("simulation-canvas-host");
    await expect(canvasHost).toBeVisible({ timeout: 25_000 });

    const inspector = page.getByTestId("simulation-inspector-panel");
    await expect(inspector).toBeVisible();

    const initialAzimuth = Number(
      (await canvasHost.getAttribute("data-orbit-azimuth")) || "0",
    );
    const initialDistance = Number(
      (await canvasHost.getAttribute("data-camera-distance")) || "0",
    );

    // Inspector paneli üzerine git ve tekerlek hareketi yap
    const inspectorBox = await inspector.boundingBox();
    expect(inspectorBox).not.toBeNull();
    if (inspectorBox) {
      await page.mouse.move(
        inspectorBox.x + inspectorBox.width * 0.5,
        inspectorBox.y + inspectorBox.height * 0.5,
      );
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(200);
    }

    // Kamera azimuth ve distance değişmemelidir (scroll izolasyonu)
    const afterAzimuth = Number(
      (await canvasHost.getAttribute("data-orbit-azimuth")) || "0",
    );
    const afterDistance = Number(
      (await canvasHost.getAttribute("data-camera-distance")) || "0",
    );

    expect(Math.abs(afterAzimuth - initialAzimuth)).toBeLessThan(0.001);
    expect(Math.abs(afterDistance - initialDistance)).toBeLessThan(0.001);

    expect(pageErrors).toEqual([]);
  });

  test("Klavye kısayolları ve yardım modalı: 1/2/3 görünüm, F odak modu, ? kısayollar, ESC önceliği", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/kategori/araclar/simulasyonlar/kolon-detayi", {
      waitUntil: "domcontentloaded",
    });

    const workspace = page.getByTestId("simulation-workspace");
    await expect(workspace).toBeVisible({ timeout: 25_000 });

    // 1. '1' tuşuna bas -> 3B moduna geçer
    await page.keyboard.press("1");
    await page.waitForTimeout(150);
    await expect(page.getByTestId("simulation-2d-preview")).toHaveCount(0);

    // 2. '2' tuşuna bas -> Split moduna döner
    await page.keyboard.press("2");
    await page.waitForTimeout(150);
    await expect(page.getByTestId("simulation-2d-preview")).toBeVisible();

    // 3. '?' tuşuna bas -> Kısayollar modalı açılır
    await page.keyboard.press("?");
    const modal = page.getByTestId("simulation-shortcuts-modal");
    await expect(modal).toBeVisible();

    // 4. 'ESC' tuşuna bas -> Kısayollar modalı kapanır
    await page.keyboard.press("Escape");
    await expect(modal).toHaveCount(0);

    // 5. Odak modunu aç
    const focusToggle = page.getByTestId("simulation-focus-mode-toggle");
    await focusToggle.click();
    await expect(workspace).toHaveAttribute("data-focus-mode", "true");

    // 6. Tekrar 'ESC' tuşuna bas -> Odak modundan çıkılır
    await page.keyboard.press("Escape");
    await expect(workspace).toHaveAttribute("data-focus-mode", "false");

    // 7. 'F' tuşuna bas -> Odaklanma/Sığdırma tetikleyicisi çalışır
    await page.keyboard.press("f");
    await page.waitForTimeout(100);

    // WebGL canvas yine tektir
    await expect(page.locator("canvas")).toHaveCount(1);

    expect(pageErrors).toEqual([]);
  });
});
