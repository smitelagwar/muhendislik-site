import { expect, test, type Locator, type Page } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

const DOC = "beton-dokum-tutanagi";
const SHEET = '[data-testid="belge-inline-edit-sheet"]';

type HotspotBox = { key: string; label: string; x: number; y: number; w: number; h: number };

async function openMobileEditing(page: Page) {
  await page.goto(`/belgeler/${DOC}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  const studio = page.locator('[data-studio-locked="true"]:visible').last();
  await expect(
    studio.locator('[data-testid="belge-studio-mobile-actions"]').getByRole("button", { name: "PDF İndir", exact: true })
  ).toBeEnabled({ timeout: 15_000 });
  await expect(studio.getByRole("tablist")).toHaveCount(0);
  await expect(studio.getByRole("region", { name: "PDF önizleme paneli" })).toBeVisible();
  await expect(studio.getByRole("status").first()).toHaveText("PDF önizlemesi hazır.", { timeout: 30_000 });
  const directToggle = studio.locator('[data-testid="belge-inline-edit-toggle"]');
  if (await directToggle.isVisible()) {
    await directToggle.click();
  } else {
    // Mobil v1 arayüzü: Çekmece üzerinden PDF üzerinde düzenleme modunu aç
    const menuBtn = studio.locator('[data-testid="belge-mobile-header-menu-btn"]');
    await menuBtn.click();
    const drawerBtn = page.locator('[data-testid="belge-drawer-inline-edit-btn"]');
    await expect(drawerBtn).toBeVisible({ timeout: 5_000 });
    await drawerBtn.click();
    await expect(page.getByTestId("belge-mobile-actions-drawer")).toBeHidden({ timeout: 5_000 });
  }
  const toggle = studio.locator('[data-testid="belge-inline-edit-toggle"]');
  await expect(toggle).toBeVisible({ timeout: 10_000 });
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  const layer = studio.locator('[data-testid="belge-inline-edit-layer"]');
  await expect(layer.locator('[data-testid^="belge-inline-hotspot-"]').first()).toBeVisible({ timeout: 12_000 });
  const container = studio.locator('[data-testid="belge-studio-preview-canvas"]');
  return { studio, layer, toggle, container };
}

async function tapCenter(page: Page, locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  await page.touchscreen.tap(box!.x + box!.width / 2, box!.y + box!.height / 2);
}

async function hotspotBoxes(layer: Locator): Promise<HotspotBox[]> {
  return layer.locator('[data-testid^="belge-inline-hotspot-"]').evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        key: (element.getAttribute("data-testid") ?? "").replace("belge-inline-hotspot-", ""),
        label: (element.getAttribute("aria-label") ?? "").replace(/ alanını düzenle$/, ""),
        x: rect.left,
        y: rect.top,
        w: rect.width,
        h: rect.height,
      };
    })
  );
}

function distanceToBox(box: HotspotBox, px: number, py: number) {
  const dx = Math.max(box.x - px, 0, px - (box.x + box.w));
  const dy = Math.max(box.y - py, 0, py - (box.y + box.h));
  return Math.hypot(dx, dy);
}

async function openFirstField(page: Page, layer: Locator) {
  await tapCenter(page, layer.locator('[data-testid="belge-inline-hotspot-tutanak_alt_baslik"]'));
  const sheet = page.locator(SHEET);
  await expect(sheet).toBeVisible();
  await page.waitForTimeout(350);
  return sheet;
}

test.describe("Belgeler mobil PDF üzerinde düzenleme", () => {
  test("gerçek dokunuş alt sayfayı açar, input odaklanır ve 16px yazı kullanır", async ({ page }) => {
    const { layer } = await openMobileEditing(page);
    const sheet = await openFirstField(page, layer);
    const input = sheet.locator('[data-testid="belge-inline-edit-input"]');
    await expect(input).toBeFocused();
    expect(await input.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
    await expect(page.locator('[data-testid="belge-inline-edit-popover"]')).toHaveCount(0);
    const box = await sheet.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(391);
  });

  test("küçük alanın hemen altına dokunmak toleransla doğru alanı açar", async ({ page }) => {
    const { layer } = await openMobileEditing(page);
    const boxes = await hotspotBoxes(layer);
    const candidate = boxes.find((b) => {
      if (b.h >= 30 || b.y + b.h + 4 > 600) return false;
      const px = b.x + b.w / 2;
      const py = b.y + b.h + 4;
      return boxes.every((o) => o.key === b.key || distanceToBox(o, px, py) > 18);
    });
    expect(candidate, "Toleransı sınamaya uygun alan bulunamadı").toBeTruthy();
    await page.touchscreen.tap(candidate!.x + candidate!.w / 2, candidate!.y + candidate!.h + 4);
    await expect(page.locator(SHEET).locator('[data-testid="belge-inline-sheet-title"]')).toHaveText(candidate!.label);
  });

  test("Kaydet sol formu günceller ve alt sayfayı kapatır", async ({ page }) => {
    const { layer } = await openMobileEditing(page);
    const sheet = await openFirstField(page, layer);
    await sheet.locator('[data-testid="belge-inline-edit-input"]').fill("MOBİL KAYDET TESTİ");
    await expect(sheet.getByText("Değiştirildi")).toBeVisible();
    await tapCenter(page, sheet.locator('[data-testid="belge-inline-edit-apply"]'));
    await expect(page.locator(SHEET)).toHaveCount(0);
    await expect(page.locator("#beton-dokum-tutanak_alt_baslik")).toHaveValue("MOBİL KAYDET TESTİ");
  });

  test("kirli taslakla Sonraki/Önceki kaydeder, alanı değiştirir ve odağı korur", async ({ page }) => {
    const { layer } = await openMobileEditing(page);
    const sheet = await openFirstField(page, layer);
    const counter = sheet.locator('[data-testid="belge-inline-sheet-counter"]');
    const match = /^(\d+) \/ (\d+)/.exec((await counter.textContent()) ?? "");
    expect(match).not.toBeNull();
    const k = Number(match![1]);
    const n = Number(match![2]);
    expect(n).toBeGreaterThan(1);
    const direction = k < n ? "next" : "prev";
    await sheet.locator('[data-testid="belge-inline-edit-input"]').fill("SONRAKİ İLE KAYIT");
    await tapCenter(page, sheet.locator(`[data-testid="belge-inline-sheet-${direction}"]`));
    const expected = direction === "next" ? k + 1 : k - 1;
    await expect(counter).toHaveText(new RegExp(`^${expected} / ${n}`));
    await expect(page.locator("#beton-dokum-tutanak_alt_baslik")).toHaveValue("SONRAKİ İLE KAYIT");
    await expect(sheet.locator('[data-testid="belge-inline-edit-input"], [data-testid="belge-inline-edit-textarea"]')).toBeFocused();
  });

  test("kirli taslak varken başka alana dokunmak uyarır ve taslağı korur", async ({ page }) => {
    const { layer, container } = await openMobileEditing(page);
    const sheet = await openFirstField(page, layer);
    const input = sheet.locator('[data-testid="belge-inline-edit-input"]');
    await input.fill("KİRLİ TASLAK");
    const title = sheet.locator('[data-testid="belge-inline-sheet-title"]');
    const originalTitle = await title.textContent();
    const sheetBox = (await sheet.boundingBox())!;
    const containerBox = (await container.boundingBox())!;
    const boxes = await hotspotBoxes(layer);
    const other = boxes.find(
      (b) =>
        b.key !== "tutanak_alt_baslik" &&
        b.y + b.h / 2 < sheetBox.y - 12 &&
        b.y + b.h / 2 > containerBox.y + 8
    );
    expect(other, "Alt sayfanın üstünde dokunulabilir ikinci alan bulunamadı").toBeTruthy();
    await page.touchscreen.tap(other!.x + other!.w / 2, other!.y + other!.h / 2);
    await expect(sheet.locator('[data-testid="belge-inline-sheet-attention"]')).toBeVisible();
    await expect(title).toHaveText(originalTitle ?? "");
    await expect(input).toHaveValue("KİRLİ TASLAK");
    await tapCenter(page, sheet.locator('[data-testid="belge-inline-edit-cancel"]'));
    await expect(page.locator(SHEET)).toHaveCount(0);
    expect(await page.locator("#beton-dokum-tutanak_alt_baslik").inputValue()).not.toBe("KİRLİ TASLAK");
  });

  test("temiz durumda boş alana dokunmak alt sayfayı kapatır", async ({ page }) => {
    const { layer, container } = await openMobileEditing(page);
    await openFirstField(page, layer);
    const containerBox = (await container.boundingBox())!;
    await page.touchscreen.tap(containerBox.x + 4, containerBox.y + 4);
    await expect(page.locator(SHEET)).toHaveCount(0);
  });

  test("Escape alt sayfayı kapatır, ardından Formu Düzenle açılır", async ({ page }) => {
    const { layer, studio } = await openMobileEditing(page);
    await openFirstField(page, layer);
    await page.keyboard.press("Escape");
    await expect(page.locator(SHEET)).toHaveCount(0);
    await openFirstField(page, layer);
    // Close the inline sheet before using the single bottom switch.
    await page.keyboard.press("Escape");
    await expect(page.locator(SHEET)).toHaveCount(0);
    await studio.getByTestId("belge-studio-mobile-actions")
      .getByRole("button", { name: "Formu Düzenle", exact: true }).click();
    await expect(studio.getByRole("region", { name: "Belge form alanları" })).toBeVisible();
  });

  test("alt sayfa açıkken seçili alan vurgusu alt sayfanın üstünde kalır", async ({ page }) => {
    const { layer, toggle, container } = await openMobileEditing(page);
    const toggleBox = await toggle.boundingBox();
    const containerBox = (await container.boundingBox())!;
    const inToggle = (px: number, py: number) =>
      toggleBox !== null &&
      px >= toggleBox.x - 4 &&
      px <= toggleBox.x + toggleBox.width + 4 &&
      py >= toggleBox.y - 4 &&
      py <= toggleBox.y + toggleBox.height + 4;
    const boxes = (await hotspotBoxes(layer))
      .filter((b) => {
        const cx = b.x + b.w / 2;
        const cy = b.y + b.h / 2;
        return !inToggle(cx, cy) && cy > containerBox.y + 8 && cy < containerBox.y + containerBox.height - 8;
      })
      .sort((a, b) => b.y - a.y);
    expect(boxes.length).toBeGreaterThan(0);
    const bottomMost = boxes[0];
    await page.touchscreen.tap(bottomMost.x + bottomMost.w / 2, bottomMost.y + bottomMost.h / 2);
    const sheet = page.locator(SHEET);
    await expect(sheet).toBeVisible();
    await expect
      .poll(
        async () => {
          const highlight = await page.locator('[data-testid="belge-inline-selected-highlight"]').boundingBox();
          const sheetBox = await sheet.boundingBox();
          return highlight !== null && sheetBox !== null && highlight.y + highlight.height <= sheetBox.y + 1;
        },
        { timeout: 5_000 }
      )
      .toBe(true);
  });

  test("320px ekranda taşma yok ve tüm düğmeler 44px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    const { layer } = await openMobileEditing(page);
    const sheet = await openFirstField(page, layer);
    const box = (await sheet.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(321);
    const metrics = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 2);
    for (const id of ["belge-inline-edit-apply", "belge-inline-edit-cancel", "belge-inline-sheet-next", "belge-inline-sheet-prev", "belge-inline-sheet-close"]) {
      const buttonBox = await sheet.locator(`[data-testid="${id}"]`).boundingBox();
      expect(buttonBox, id).not.toBeNull();
      expect(buttonBox!.height, id).toBeGreaterThanOrEqual(43.5);
      expect(buttonBox!.x + buttonBox!.width, id).toBeLessThanOrEqual(321);
    }
  });
});
