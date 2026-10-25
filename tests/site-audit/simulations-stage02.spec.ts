import { test, expect } from "@playwright/test";

test.describe("Aşama 02 — Kolon Geometrisi, Katmanlar, Önayarlar ve Parça Seçimi", () => {
  test("Katman filtreleri, parça seçimi + bilgi kartı eşleşmesi, instanced kimlik doğrulaması, 20 katman/önayar döngüsü ve iki tema yakın plan kontrolü", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    await page.goto("/kategori/araclar/simulasyonlar/kolon-detayi", {
      timeout: 45_000,
    });

    const canvasHost = page.locator('[data-testid="simulation-canvas-host"]');
    await canvasHost.waitFor({ state: "visible", timeout: 15_000 });

    // 1. Instanced seçim kimliklerinin (instanceId -> partId) doğrulaması
    const instancedIdentityCheck = await page.evaluate(() => {
      const ctrl = window.__simulationController;
      if (!ctrl) return { ok: false, reason: "no-controller" };
      const firstStirrupId = ctrl.resolveInstancePartId("stirrup", 0);
      const firstLongId = ctrl.resolveInstancePartId("longitudinal", 0);
      const concreteId = ctrl.resolveInstancePartId("concrete", 0);
      return {
        ok:
          firstStirrupId === "stirrup-1-alt-sarilma-z50" &&
          firstLongId === "longitudinal-bar-1-sw" &&
          concreteId === "concrete-column-body",
        firstStirrupId,
        firstLongId,
        concreteId,
      };
    });
    expect(instancedIdentityCheck.ok).toBe(true);

    // 2. HTML parça listesinden etriye seçimi ve bilgi kartı eşleşmesi
    const stirrupItemBtn = page.locator(
      '[data-testid="part-list-item-stirrup-1-alt-sarilma-z50"]',
    );
    await stirrupItemBtn.waitFor({ state: "visible", timeout: 8_000 });
    await stirrupItemBtn.click();

    await expect(canvasHost).toHaveAttribute(
      "data-selected-part-id",
      "stirrup-1-alt-sarilma-z50",
    );
    await expect(page.locator('[data-testid="selected-part-title"]')).toContainText(
      "Etriye #1",
    );
    await expect(page.locator('[data-testid="selected-part-what"]')).toContainText(
      "135° deprem kancalı",
    );
    await expect(page.locator('[data-testid="selected-part-where"]')).toContainText(
      "Z = 50 mm",
    );

    // Seçili parçaya odaklan (yakın plan)
    const distBeforeFocus = Number(
      (await canvasHost.getAttribute("data-camera-distance")) || "0",
    );
    await page.locator('[data-testid="focus-selected-part-btn"]').click();
    await expect
      .poll(async () => {
        const distAfter = Number(
          (await canvasHost.getAttribute("data-camera-distance")) || "0",
        );
        return distAfter < distBeforeFocus;
      })
      .toBe(true);

    // 3. İki temada yakın plan görsel/kontrast doğrulaması (dark ve light tema)
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    });
    await expect(page.locator('[data-testid="simulation-3d-canvas"]')).toBeVisible();

    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      document.documentElement.style.colorScheme = "light";
    });
    await expect(page.locator('[data-testid="simulation-3d-canvas"]')).toBeVisible();

    // 4. Katmanlar sekmesine geç: "Sadece Etriye" / "Sadece Boyuna" / "Tümü" ve seçili katman gizlenince seçimin temizlenmesi
    await page.locator('[data-testid="inspector-tab-layers"]').click();
    const onlyLongBtn = page.locator('[data-testid="quick-filter-only-longitudinal"]');
    await onlyLongBtn.waitFor({ state: "visible", timeout: 8_000 });
    await onlyLongBtn.click();

    // Sadece boyuna filtresi etriyeyi gizlediği için seçili etriye otomatik temizlenmeli
    await expect(canvasHost).toHaveAttribute("data-selected-part-id", "");
    await expect(canvasHost).toHaveAttribute("data-concrete-visible", "false");

    await page.locator('[data-testid="quick-filter-only-stirrup"]').click();
    await expect(canvasHost).toHaveAttribute("data-concrete-visible", "false");

    await page.locator('[data-testid="quick-filter-all"]').click();
    await expect(canvasHost).toHaveAttribute("data-concrete-visible", "true");

    // 5. 20 katman ve önayar (C1 <-> Çirozlu) değişim döngüsü; tek canvas korunmalı ve hata olmamalı
    const presetC1Btn = page.locator('[data-testid="preset-btn-c1-referans"]');
    const presetCrosstieBtn = page.locator(
      '[data-testid="preset-btn-c1-cirozlu-ogretim"]',
    );
    const toggleConcreteBtn = page.locator('[data-testid="toggle-concrete-btn"]');

    for (let i = 0; i < 20; i++) {
      if (i % 2 === 0) {
        await presetCrosstieBtn.click();
      } else {
        await presetC1Btn.click();
      }
      await toggleConcreteBtn.click();
    }

    // Son durumda C1'e dön ve Çirozlu önayarla karışmadığını doğrula
    await presetCrosstieBtn.click();
    await expect(page.locator('[data-testid="simulation-scene-title"]')).toContainText(
      "400×400",
    );

    await presetC1Btn.click();
    await expect(page.locator('[data-testid="simulation-scene-title"]')).toContainText(
      "300×300",
    );
    expect(await page.locator('[data-testid="simulation-3d-canvas"]').count()).toBe(1);
    expect(pageErrors).toEqual([]);
  });
});
