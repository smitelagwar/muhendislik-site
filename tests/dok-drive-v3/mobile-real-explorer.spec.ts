// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — REAL MOBILE EXPLORER DOM / TOUCH ACCEPTANCE
// ============================================================================

import { test, expect, Page } from "@playwright/test";

const NOW = "2026-09-10T06:00:00.000Z";

function makeFile(index: number, folderId: string | null = null) {
  const suffix = String(index).padStart(3, "0");
  return {
    id: `file-${suffix}`,
    folder_id: folderId,
    display_name: `Dosya ${suffix} — mobil görünürlük kontrolü.pdf`,
    blob_pathname: `tests/file-${suffix}.pdf`,
    blob_url: `https://example.invalid/file-${suffix}.pdf`,
    size_bytes: 1024 + index,
    mime_type: "application/pdf",
    extension: "pdf",
    created_at: NOW,
    updated_at: NOW,
    deleted_at: null,
    starred_at: null,
  };
}

async function mockExplorerData(page: Page) {
  await page.route("**/api/dokumantasyon/items**", async (route) => {
    const url = new URL(route.request().url());
    const folderId = url.searchParams.get("folderId");

    if (folderId === "folder-mobile") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          folder: {
            id: "folder-mobile",
            name: "Mobil Klasör",
            parent_id: null,
            created_at: NOW,
            updated_at: NOW,
            deleted_at: null,
            starred_at: null,
          },
          breadcrumbs: [
            { id: null, name: "Kök Dizin" },
            { id: "folder-mobile", name: "Mobil Klasör" },
          ],
          folders: [],
          files: Array.from({ length: 12 }, (_, index) => makeFile(index, "folder-mobile")),
          summary: { totalFiles: 12, totalSizeBytes: 12_000, starredCount: 0 },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        folder: null,
        breadcrumbs: [{ id: null, name: "Kök Dizin" }],
        folders: [
          {
            id: "folder-mobile",
            name: "Mobil Klasör",
            parent_id: null,
            created_at: NOW,
            updated_at: NOW,
            deleted_at: null,
            starred_at: null,
          },
        ],
        files: Array.from({ length: 80 }, (_, index) => makeFile(index)),
        summary: { totalFiles: 80, totalSizeBytes: 100_000, starredCount: 0 },
      }),
    });
  });
}

async function getScrollViewport(page: Page) {
  const firstRow = page.locator('[data-testid="dok-file-row"]').first();
  await expect(firstRow).toBeVisible();

  return firstRow.evaluateHandle((row) => {
    let node = row.parentElement;
    while (node) {
      const style = window.getComputedStyle(node);
      if (style.overflowY === "auto" || style.overflowY === "scroll") {
        return node;
      }
      node = node.parentElement;
    }
    return null;
  });
}

test.describe("Drive V3.1 — Real mobile explorer acceptance", () => {
  test.beforeEach(async ({ page }) => {
    await mockExplorerData(page);
    await page.goto("/dokumantasyon");
    await expect(page.locator('[data-testid="dok-file-row"]').first()).toBeVisible();
  });

  test("1. Mobil seçim hedefi en az 44x44 ve checkbox tap parent row'u açmaz", async ({ page }) => {
    const initialUrl = page.url();
    const selectButton = page.getByRole("button", { name: "Dosya Seç" }).first();
    const box = await selectButton.boundingBox();

    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);

    await selectButton.tap();

    await expect(page.getByRole("button", { name: "Taşı" })).toBeVisible();
    expect(page.url()).toBe(initialUrl);
    await expect(page.locator('[data-testid="dok-file-row"]').first()).toHaveClass(/Selected|amber|border/);
  });

  test("2. Satır gövdesine tek tap klasörü açar; seçim modu yanlışlıkla başlamaz", async ({ page }) => {
    const folderRow = page.locator('[data-testid="dok-folder-row"]').first();
    await expect(folderRow).toBeVisible();

    const box = await folderRow.boundingBox();
    expect(box).not.toBeNull();

    // Sol seçim kutusundan ve sağ işlem menüsünden uzakta, satır gövdesine dokun.
    await folderRow.tap({
      position: {
        x: Math.min(Math.max(90, box!.width * 0.55), box!.width - 60),
        y: box!.height / 2,
      },
    });

    await expect(page).toHaveURL(/folderId=folder-mobile/);
    await expect(page.getByRole("button", { name: "Taşı" })).toHaveCount(0);
    await expect(page.locator('[data-testid="dok-folder-row"]')).toHaveCount(0);
  });

  test("3. Selection dock explorer'ın üstüne binmez ve en son sanal dosya tamamen görünür", async ({ page }) => {
    await page.getByRole("button", { name: "Dosya Seç" }).first().tap();
    const moveButton = page.getByRole("button", { name: "Taşı" });
    await expect(moveButton).toBeVisible();

    const viewportHandle = await getScrollViewport(page);
    const hasViewport = await viewportHandle.evaluate((node) => node !== null);
    expect(hasViewport).toBe(true);

    const viewportMetrics = await viewportHandle.evaluate((node) => {
      if (!(node instanceof HTMLElement)) throw new Error("Scrollable explorer viewport bulunamadı");
      return {
        clientHeight: node.clientHeight,
        scrollHeight: node.scrollHeight,
        overflowY: window.getComputedStyle(node).overflowY,
      };
    });
    expect(viewportMetrics.overflowY === "auto" || viewportMetrics.overflowY === "scroll").toBe(true);
    expect(viewportMetrics.scrollHeight).toBeGreaterThan(viewportMetrics.clientHeight);

    await viewportHandle.evaluate((node) => {
      if (!(node instanceof HTMLElement)) throw new Error("Scrollable explorer viewport bulunamadı");
      node.scrollTop = node.scrollHeight;
      node.dispatchEvent(new Event("scroll", { bubbles: true }));
    });

    const lastRow = page.locator('[data-file-id="file-079"]');
    await expect(lastRow).toBeVisible();

    const lastBox = await lastRow.boundingBox();
    const viewportBox = await viewportHandle.evaluate((node) => {
      if (!(node instanceof HTMLElement)) return null;
      const rect = node.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
    });
    const selectionDock = moveButton.locator('xpath=ancestor::div[contains(@class,"fixed")][1]');
    const dockBox = await selectionDock.boundingBox();
    const dockPosition = await selectionDock.evaluate((node) => window.getComputedStyle(node).position);
    const dockFlexWrap = await selectionDock.evaluate((node) => window.getComputedStyle(node).flexWrap);

    expect(lastBox).not.toBeNull();
    expect(viewportBox).not.toBeNull();
    expect(dockBox).not.toBeNull();
    const lastBottom = lastBox!.y + lastBox!.height;
    const dockTop = dockBox!.y;
    expect(lastBottom).toBeLessThanOrEqual(viewportBox!.bottom + 1);
    expect(viewportBox!.bottom).toBeLessThanOrEqual(dockTop + 1);
    expect(dockPosition).toBe("static");
    expect(dockFlexWrap).toBe("nowrap");
  });

  test("4. 320px dahil mobil viewport'ta seçim dock'u yatay sayfa taşması üretmez", async ({ page }) => {
    await page.getByRole("button", { name: "Dosya Seç" }).first().tap();
    await expect(page.getByRole("button", { name: "Taşı" })).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      viewportWidth: document.documentElement.clientWidth,
      pageWidth: document.documentElement.scrollWidth,
    }));

    expect(dimensions.pageWidth).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
  });
});
