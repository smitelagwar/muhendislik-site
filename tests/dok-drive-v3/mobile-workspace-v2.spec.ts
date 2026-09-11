import { expect, test } from "@playwright/test";
import { mockExplorerData } from "./explorer-fixture";

test.beforeEach(async ({ page }) => {
  await mockExplorerData(page, 5000);
  await page.goto("/dokumantasyon");
  await expect(page.getByTestId("dok-phone-appbar")).toBeVisible();
  await expect(page.getByTestId("dok-file-row").first()).toBeVisible();
});

test("telefon tek başlık, yoğun liste ve sınırlı DOM", async ({ page }) => {
  await expect(page.locator("[data-site-header]")).toBeHidden();
  const bounds = await page.getByTestId("dok-phone-appbar").boundingBox();
  expect(bounds?.y).toBeLessThanOrEqual(1);
  expect(bounds?.height).toBeLessThanOrEqual(57);
  expect(await page.locator("[data-mobile-item]").count()).toBeLessThan(250);
  const fullRows = await page.locator("[data-mobile-item]").evaluateAll(
    (rows) =>
      rows.filter((row) => {
        const box = row.getBoundingClientRect();
        return box.top >= 56 && box.bottom <= window.innerHeight;
      }).length,
  );
  expect(fullRows).toBeGreaterThanOrEqual(8);
});

test("ayarları uygulamak geçmişteki eski görünümü geri getirmez", async ({
  page,
}) => {
  await page.getByTestId("dok-phone-more").click();
  await page
    .getByRole("button", { name: "Görünüm ve düzen", exact: true })
    .click();
  await page.getByLabel("Görünüm", { exact: true }).selectOption("grid");
  await page.getByRole("button", { name: "Uygula", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("[data-mobile-item]").first()).toHaveCSS(
    "min-height",
    "160px",
  );
  await page.getByTestId("dok-phone-more").click();
  await page.goBack();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("[data-mobile-item]").first()).toHaveCSS(
    "min-height",
    "160px",
  );
});

test("seçim menüden açılır, geri düğmesi seçimi kapatır", async ({ page }) => {
  await page.getByTestId("dok-phone-more").click();
  await page.getByRole("button", { name: "Öğeleri seç", exact: true }).click();
  await page.locator("[data-selection-control]").first().click();
  await expect(page.getByTestId("dok-selection-count")).toHaveText(
    "1 öğe seçildi",
  );
  await page.goBack();
  await expect(page.getByTestId("dok-phone-more")).toBeVisible();
});

test("5000 öğede gruplama, son öğe ve yüzde 200 metin", async ({
  page,
}, info) => {
  await page.getByTestId("dok-phone-more").click();
  await page
    .getByRole("button", { name: "Görünüm ve düzen", exact: true })
    .click();
  await page.getByLabel("Grupla", { exact: true }).selectOption("type");
  await page.getByRole("button", { name: "Uygula", exact: true }).click();
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  const viewport = page.getByTestId("dok-explorer-viewport");
  await viewport.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await expect
    .poll(async () => {
      await viewport.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      const last = await page
        .locator('[data-file-id="file-999"]')
        .boundingBox();
      const area = await viewport.boundingBox();
      return (
        !!last &&
        !!area &&
        last.y >= area.y &&
        last.y + last.height <= area.y + area.height + 1
      );
    })
    .toBe(true);
  expect(await page.locator("[data-mobile-item]").count()).toBeLessThan(250);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(page.viewportSize()!.width);
  await expect
    .poll(() =>
      page.locator("[data-mobile-item]").evaluateAll((rows) => {
        const rects = rows
          .map((row) => row.getBoundingClientRect())
          .sort((a, b) => a.y - b.y);
        return rects.some(
          (rect, i) => i > 0 && rect.top < rects[i - 1].bottom - 1,
        );
      }),
    )
    .toBe(false);
  await page.screenshot({ path: info.outputPath("grouped-text-200.png") });
});

test("arama sonucu menüsünde geri yalnız menüyü kapatır", async ({ page }) => {
  await page.route("**/api/dokumantasyon/search?**", (route) =>
    route.fulfill({
      json: {
        folders: [],
        files: [
          {
            id: "search-file",
            display_name: "Aranan proje.pdf",
            folder_id: "folder-mobile",
            extension: "pdf",
            size_bytes: 1024,
            updated_at: "2026-09-10",
          },
        ],
      },
    }),
  );
  await page.getByRole("button", { name: "Dosya ara", exact: true }).click();
  await page.getByLabel("Tüm dosyalarda ara").fill("proje");
  await page
    .getByRole("button", {
      name: "Aranan proje.pdf arama işlemleri",
      exact: true,
    })
    .click();
  await page.goBack();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByLabel("Tüm dosyalarda ara")).toHaveValue("proje");
  await page.goBack();
  await expect(page.getByLabel("Tüm dosyalarda ara")).toHaveCount(0);
});

test("yükleme görüntüleyiciye geçişte sürer ve dönüşte konum korunur", async ({
  page,
}) => {
  let release: () => void = () => {};
  const uploading = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/dokumantasyon/upload/intent", (route) =>
    route.fulfill({
      json: {
        isLocalMode: true,
        pathname: "test/proje.pdf",
        intentToken: "test",
      },
    }),
  );
  await page.route("**/api/dokumantasyon/upload/local", async (route) => {
    await uploading;
    await route.fulfill({ json: { ok: true } });
  });
  await page.route("**/api/dokumantasyon/upload/status?**", (route) =>
    route.fulfill({ json: { finalized: true } }),
  );
  try {
    await page.locator('input[type="file"]').setInputFiles({
      name: "proje.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("test"),
    });
    await expect(page.getByTestId("dok-upload-summary")).toContainText("0/1");
    const viewport = page.getByTestId("dok-explorer-viewport");
    await viewport.evaluate((el) => {
      el.scrollTop = 2800;
    });
    await expect
      .poll(() => viewport.evaluate((el) => el.scrollTop))
      .toBeGreaterThan(2000);
    const file = page
      .locator("[data-mobile-item][data-file-id]")
      .filter({ visible: true });
    const viewportBox = (await viewport.boundingBox())!;
    const getVisibleId = () =>
      file.evaluateAll(
        (items, top) =>
          items
            .find((item) => {
              const rect = item.getBoundingClientRect();
              return rect.top >= top && rect.bottom <= innerHeight - 44;
            })
            ?.getAttribute("data-file-id"),
        viewportBox.y,
      );
    await expect.poll(getVisibleId).toBeTruthy();
    const id = await getVisibleId();
    await page
      .locator(`[data-file-id="${id}"]`)
      .getByTestId("dok-file-name")
      .click();
    await expect(page).toHaveURL(/dokumantasyon\/dosya\//);
    release();
    await page.goBack();
    await expect(page.getByTestId("dok-upload-summary")).toContainText("1/1");
    await expect
      .poll(() => viewport.evaluate((el) => el.scrollTop))
      .toBeGreaterThan(2000);
  } finally {
    release();
  }
});

test("paylaşım sonucu geri ile kapanır ve seçim korunur", async ({ page }) => {
  await page.route("**/api/dokumantasyon/shares", (route) =>
    route.fulfill({
      json: {
        shareUrl: "https://example.invalid/p/test",
        rawToken: "test",
        shareLink: { expires_at: "2026-10-01T00:00:00Z", title: "Test" },
        totalFiles: 1,
        totalSizeBytes: 1024,
      },
    }),
  );
  await page.getByTestId("dok-phone-more").click();
  await page.getByRole("button", { name: "Öğeleri seç", exact: true }).click();
  await page
    .locator('[data-file-id="file-000"] [data-selection-control]')
    .click();
  await page.locator('[data-mobile-action="share"]').click();
  await page.getByRole("button", { name: "Link Oluştur", exact: true }).click();
  await expect(
    page.getByText("Paylaşım Linki Hazır!", { exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByTestId("dok-selection-count")).toHaveText(
    "1 öğe seçildi",
  );
});

test("aramadan dosyaya gidip dönünce sorgu ve sonuç konumu korunur", async ({
  page,
}) => {
  await page.route("**/api/dokumantasyon/search?**", (route) =>
    route.fulfill({
      json: {
        folders: [],
        files: Array.from({ length: 100 }, (_, i) => ({
          id: `search-${i}`,
          display_name: `Proje ${i}.pdf`,
          folder_id: null,
          extension: "pdf",
          size_bytes: 1024,
          updated_at: "2026-09-10",
        })),
      },
    }),
  );
  await page.getByRole("button", { name: "Dosya ara", exact: true }).click();
  await page.getByLabel("Tüm dosyalarda ara").fill("proje");
  const result = page
    .getByRole("button", { name: "Proje 40.pdf PDF", exact: false })
    .first();
  await result.scrollIntoViewIfNeeded();
  const results = page.getByTestId("dok-search-results");
  await expect
    .poll(() => results.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(500);
  await result.click();
  await expect(page).toHaveURL(/dosya\/search-40/);
  await page.goBack();
  await expect(page.getByLabel("Tüm dosyalarda ara")).toHaveValue("proje");
  await expect
    .poll(() => results.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(500);
});
