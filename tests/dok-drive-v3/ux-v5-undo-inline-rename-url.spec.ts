import { test, expect, type Page } from "@playwright/test";
import { mockExplorerData } from "./explorer-fixture";

async function setTheme(page: Page, mode: "dark" | "light") {
  await page.evaluate(async (targetMode) => {
    if (targetMode === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    );
  }, mode);
}

async function mockCommonEndpoints(page: Page) {
  await page.route("**/api/dokumantasyon/folders/tree", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        folders: [
          {
            id: "folder-mobile",
            name: "Mobil Klasör",
            parent_id: null,
            created_at: "2026-09-10T06:00:00.000Z",
            updated_at: "2026-09-10T06:00:00.000Z",
            deleted_at: null,
            starred_at: null,
          },
          {
            id: "folder-sub",
            name: "Alt Projeler",
            parent_id: "folder-mobile",
            created_at: "2026-09-10T06:00:00.000Z",
            updated_at: "2026-09-10T06:00:00.000Z",
            deleted_at: null,
            starred_at: null,
          },
        ],
      }),
    });
  });
}

test.describe("UX V5 Paket 4 — Inline Rename, Undo Toast, URL Deep-Link, Ctrl+V & Mobil 390", () => {
  test("S4.1 — F2 uzantı-korumalı satır içi adlandırma ve Esc iptali", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockExplorerData(page, 6);
    await mockCommonEndpoints(page);

    const patchBodies: Array<Record<string, unknown>> = [];
    await page.route("**/api/dokumantasyon/files/*", async (route) => {
      if (route.request().method() === "PATCH") {
        patchBodies.push(route.request().postDataJSON() as Record<string, unknown>);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    const firstFileRow = page.getByTestId("dok-file-row").first();
    await expect(firstFileRow).toBeVisible();

    await firstFileRow.click({ position: { x: 100, y: 20 } });
    await page.keyboard.press("F2");

    const renameInput = page.getByTestId("dok-inline-rename-input");
    await expect(renameInput).toBeVisible();

    // Yalnız uzantı öncesi taban ad seçili olmalı
    const selectionRange = await renameInput.evaluate((node) => {
      const el = node as HTMLInputElement;
      return {
        value: el.value,
        start: el.selectionStart,
        end: el.selectionEnd,
      };
    });
    expect(selectionRange.start).toBe(0);
    expect(selectionRange.end).toBe(selectionRange.value.lastIndexOf("."));

    // Esc ile iptal -> PATCH atılmamalı
    await renameInput.fill("Iptal_Edilen");
    await page.keyboard.press("Escape");
    await expect(renameInput).toBeHidden();
    expect(patchBodies).toHaveLength(0);

    // Tekrar F2 -> Enter ile .pdf uzantısı korunarak PATCH atılmalı
    await page.keyboard.press("F2");
    await expect(renameInput).toBeVisible();
    await renameInput.fill("Statik_Rapor_V5");
    await page.keyboard.press("Enter");
    await expect(renameInput).toBeHidden();

    expect(patchBodies.length).toBeGreaterThanOrEqual(1);
    expect(patchBodies[0].displayName).toBe("Statik_Rapor_V5.pdf");
  });

  test("S4.2 — Çöp Undo Toast (dok-toast-undo -> bulk/restore) ve Taşıma Ctrl+Z (bulk/move)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockExplorerData(page, 6);
    await mockCommonEndpoints(page);

    let trashCalled = 0;
    let restoreCalled = 0;
    const moveCalls: Array<{ targetFolderId: string | null }> = [];

    await page.route("**/api/dokumantasyon/files/*", async (route) => {
      if (route.request().method() === "DELETE") {
        trashCalled += 1;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
        return;
      }
      await route.continue();
    });

    await page.route("**/api/dokumantasyon/bulk/trash", async (route) => {
      trashCalled += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ succeeded: ["file-000"], failed: [] }),
      });
    });

    await page.route("**/api/dokumantasyon/bulk/restore", async (route) => {
      restoreCalled += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ succeeded: ["file-000"], failed: [] }),
      });
    });

    await page.route("**/api/dokumantasyon/bulk/move", async (route) => {
      const payload = route.request().postDataJSON() as { targetFolderId: string | null };
      moveCalls.push({ targetFolderId: payload.targetFolderId });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ succeeded: ["file-001"], failed: [] }),
      });
    });

    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    const firstFile = page.getByTestId("dok-file-row").first();
    await expect(firstFile).toBeVisible();

    // 1. Çöpe at -> Undo Toast -> Geri Al
    await firstFile.click({ position: { x: 100, y: 20 } });
    await page.getByTestId("dok-mobile-selection-dock").getByRole("button", { name: "Sil" }).click();
    const dialog = page.getByTestId("dok-dialog-content");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: /Çöp Kutusuna Taşı|Sil|Onayla/i }).click();

    await expect.poll(() => trashCalled).toBe(1);
    const undoBtn = page.getByTestId("dok-toast-undo");
    await expect(undoBtn).toBeVisible();
    await undoBtn.click();
    await expect.poll(() => restoreCalled).toBe(1);

    // 2. Kes + Yapıştır ile taşı -> Ctrl+Z ile eski klasöre döndür
    const secondFile = page.getByTestId("dok-file-row").nth(1);
    await secondFile.click({ position: { x: 100, y: 20 } });
    await page.getByTestId("dok-dock-cut").click();
    await page.getByTestId("dok-folder-row").first().dblclick();
    await expect.poll(() => page.url()).toContain("folderId=folder-mobile");

    await page.keyboard.press("Control+v");
    await expect.poll(() => moveCalls.length).toBe(1);
    expect(moveCalls[0].targetFolderId).toBe("folder-mobile");

    await expect(page.getByTestId("dok-toast-undo")).toBeVisible();
    await page.keyboard.press("Control+z");
    await expect.poll(() => moveCalls.length).toBe(2);
    expect(moveCalls[1].targetFolderId).toBeNull();
  });

  test("S4.3 — URL Deep-Link ve localStorage yoğunluk kalıcılığı (reload sonrası)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockExplorerData(page, 12);
    await mockCommonEndpoints(page);

    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    const folderRow = page.getByTestId("dok-folder-row").first();
    await expect(folderRow).toBeVisible();
    await folderRow.dblclick();

    await expect.poll(() => page.url()).toContain("folderId=folder-mobile");
    await expect(page.getByTestId("dok-file-row").first()).toBeVisible();

    const densityBtn = page.locator('button[aria-label^="Satır yoğunluğu:"]');
    await densityBtn.click();
    await expect(densityBtn).toHaveAttribute("aria-label", "Satır yoğunluğu: Sıkışık");

    const storedPrefs = await page.evaluate(() => localStorage.getItem("dok_workspace_prefs_v5"));
    expect(storedPrefs).toContain("compact");

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("dok-file-row").first()).toBeVisible();
    expect(page.url()).toContain("folderId=folder-mobile");
    await expect(page.locator('button[aria-label^="Satır yoğunluğu:"]')).toHaveAttribute(
      "aria-label",
      "Satır yoğunluğu: Sıkışık"
    );
  });

  test("S4.4 — Ctrl+V sistem panosu PNG dosya yapıştırma yükleme kuyruğunu tetikler", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockExplorerData(page, 4);
    await mockCommonEndpoints(page);

    let uploadIntentCalled = 0;
    await page.route("**/api/dokumantasyon/upload/intent", async (route) => {
      uploadIntentCalled += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          mode: "local",
          pathname: "tests/pasted.png",
          blobUrl: "https://example.invalid/pasted.png",
        }),
      });
    });
    await page.route("**/api/dokumantasyon/upload/local", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          file: {
            id: "file-pasted",
            folder_id: null,
            display_name: "ekran-goruntusu-test.png",
            size_bytes: 128,
            mime_type: "image/png",
            extension: "png",
            created_at: "2026-09-10T06:00:00.000Z",
            updated_at: "2026-09-10T06:00:00.000Z",
          },
        }),
      });
    });

    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("dok-file-row").first()).toBeVisible();

    await page.evaluate(() => {
      const dt = new DataTransfer();
      const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
      dt.items.add(new File([pngBytes], "image.png", { type: "image/png" }));
      const event = new ClipboardEvent("paste", {
        clipboardData: dt,
        bubbles: true,
        cancelable: true,
      });
      document.body.dispatchEvent(event);
    });

    await expect.poll(() => uploadIntentCalled).toBeGreaterThanOrEqual(1);
  });

  test("S4.5 & G1, G2, G6, G8 — Görsel kanıt kareleri (Dark tümü seçili, Light kısmi, Sidebar+Filtre, Mobil 390px)", async ({ page }, info) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockExplorerData(page, 28);
    await mockCommonEndpoints(page);

    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("dok-file-row").first()).toBeVisible();

    // G1: Dark, 28/28 seçili (turuncu kafes yok)
    await setTheme(page, "dark");
    await page.getByTestId("dok-select-all").first().click();
    await expect(page.getByTestId("dok-mobile-selection-dock")).toBeVisible();
    await page.screenshot({
      path: info.outputPath("v5-01-dark-all-selected.png"),
      animations: "disabled",
    });

    // G2: Light, 3 öğe kısmi seçili (tablo başlığında indeterminate)
    await page.keyboard.press("Escape");
    await setTheme(page, "light");
    const rows = page.getByTestId("dok-file-row");
    for (let i = 0; i < 3; i++) {
      await rows.nth(i).locator("[data-selection-control]").click();
    }
    await expect(page.getByTestId("dok-select-all").first()).toHaveAttribute("aria-checked", "mixed");
    await page.screenshot({
      path: info.outputPath("v5-02-light-partial-selected.png"),
      animations: "disabled",
    });

    // G6: Dark, Sidebar Klasör Ağacı + Belgeler & Tablolar + Tarih: Son 7 gün çipi
    await page.keyboard.press("Escape");
    await setTheme(page, "dark");
    await expect(page.getByTestId("dok-sidebar-folder-tree")).toBeVisible();
    await page.getByRole("button", { name: /Belgeler & Tablolar/i }).first().click();
    await page.getByRole("button", { name: "Dosya filtreleri" }).click();
    const filterSheet = page.getByTestId("workspace-filter-sheet");
    await expect(filterSheet).toBeVisible();
    await filterSheet.locator("select").nth(1).selectOption("week");
    await filterSheet.getByRole("button", { name: "Uygula" }).click();
    await expect(page.getByTestId("dok-filter-chips-bar").getByText("Tarih: Son 7 gün")).toBeVisible();
    await page.screenshot({
      path: info.outputPath("v5-06-dark-sidebar-tree-filters.png"),
      animations: "disabled",
    });
  });

  test("S4.5 & G8 — Mobil 390px açık Seç modu, 44x44 hedefler ve 3 eylemli bar", async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockExplorerData(page, 12);
    await mockCommonEndpoints(page);

    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("dok-file-row").first()).toBeVisible();
    await setTheme(page, "dark");

    await page.getByTestId("dok-phone-more").click();
    await page.getByTestId("dok-selection-mode").click();

    const firstMobileCheckbox = page.getByTestId("dok-file-row").first().locator("[data-selection-control]");
    await firstMobileCheckbox.click();
    const cbBox = await firstMobileCheckbox.boundingBox();
    expect(cbBox).not.toBeNull();
    expect(cbBox!.width).toBeGreaterThanOrEqual(44);
    expect(cbBox!.height).toBeGreaterThanOrEqual(44);

    const mobileDock = page.getByTestId("dok-mobile-selection-dock");
    await expect(mobileDock).toBeVisible();
    await expect(mobileDock.getByRole("button", { name: "Taşı" })).toBeVisible();
    await expect(mobileDock.getByRole("button", { name: "Paylaş" })).toBeVisible();
    await expect(mobileDock.getByRole("button", { name: "Sil" })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);

    await page.screenshot({
      path: info.outputPath("v5-08-mobile-390-selection.png"),
      animations: "disabled",
    });
  });
});
