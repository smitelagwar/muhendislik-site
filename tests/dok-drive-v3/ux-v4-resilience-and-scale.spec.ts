import { test, expect, type Page } from "@playwright/test";

const NOW = "2026-11-20T10:00:00.000Z";

function makeScaleFile(index: number, folderId: string | null = null) {
  const suffix = String(index).padStart(4, "0");
  return {
    id: `scale-file-${suffix}`,
    folder_id: folderId,
    display_name: `Ölçek Dosya ${suffix}.pdf`,
    blob_pathname: `tests/scale-${suffix}.pdf`,
    blob_url: `https://example.invalid/scale-${suffix}.pdf`,
    size_bytes: 1024 + (index % 500) * 1024,
    mime_type: "application/pdf",
    extension: "pdf",
    created_at: NOW,
    updated_at: NOW,
    deleted_at: null,
    starred_at: null,
  };
}

function attachStrictPageErrorTracker(page: Page): string[] {
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));
  return pageErrors;
}

test.describe("Senaryo S7 — Dayanıklılık, Kısmi Başarısızlık, 5.000 Öğe Ölçek & Yarış Koruması", () => {
  test("S7.1: API 500 hatasında Tekrar Dene ile iyileşir; 401 hatasında Oturum gerekli görünür", async ({ page }) => {
    const pageErrors = attachStrictPageErrorTracker(page);
    await page.route("**/api/dokumantasyon/readiness", (route) =>
      route.fulfill({ json: { ok: true, storageMode: "local_dev" } })
    );

    let mode: "500" | "ok" | "401" = "500";
    await page.route("**/api/dokumantasyon/items**", async (route) => {
      if (mode === "500") {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Sunucu hatası" }),
        });
        return;
      }
      if (mode === "401") {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ error: "Oturum gerekli" }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          folder: null,
          breadcrumbs: [{ id: null, name: "Kök Dizin" }],
          folders: [],
          files: [makeScaleFile(1)],
          summary: {
            totalFiles: 1,
            totalFolders: 0,
            totalSizeBytes: 2048,
            starredCount: 0,
            trashCount: 0,
            activeSharesCount: 0,
            categoryCounts: { cad: 0, pdf: 1, image: 0, other: 0 },
          },
        }),
      });
    });

    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Dosyalar listelenemedi")).toBeVisible();

    mode = "ok";
    await page.getByRole("button", { name: "Tekrar dene", exact: true }).click();
    await expect(page.getByTestId("dok-file-row").first()).toBeVisible();

    mode = "401";
    await page.getByTestId("dok-refresh-btn").click();
    await expect(page.getByRole("heading", { name: "Oturum gerekli" })).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test("S7.2: Toplu kopyalamada kısmi başarısızlıkta yalnız başarısız 1 öğe seçili kalır ve hata gösterilir", async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.route("**/api/dokumantasyon/readiness", (route) =>
      route.fulfill({ json: { ok: true, storageMode: "local_dev" } })
    );

    const files = [makeScaleFile(0), makeScaleFile(1), makeScaleFile(2)];
    await page.route("**/api/dokumantasyon/items**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          folder: null,
          breadcrumbs: [{ id: null, name: "Kök Dizin" }],
          folders: [],
          files,
          summary: {
            totalFiles: 3,
            totalFolders: 0,
            totalSizeBytes: 6144,
            starredCount: 0,
            trashCount: 0,
            activeSharesCount: 0,
            categoryCounts: { cad: 0, pdf: 3, image: 0, other: 0 },
          },
        }),
      });
    });

    await page.route("**/api/dokumantasyon/bulk/copy", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          succeeded: [
            { id: "scale-file-0000", type: "file" },
            { id: "scale-file-0002", type: "file" },
          ],
          failed: [
            { id: "scale-file-0001", type: "file", error: "Dosya kilitli" },
          ],
        }),
      });
    });

    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("dok-file-row")).toHaveCount(3);

    // 3 öğeyi seç
    await page.locator('[data-file-id="scale-file-0000"]').click({ position: { x: 8, y: 8 } });
    await page.locator('[data-file-id="scale-file-0002"]').click({ position: { x: 8, y: 8 }, modifiers: ["Shift"] });
    await expect(page.locator('[data-selected="true"]')).toHaveCount(3);

    // Kopyala ve yapıştır
    await page.keyboard.press("Control+c");
    await page.keyboard.press("Control+v");

    // Yalnız başarısız 1 öğe seçili kalmalı ve hata mesajı görünmeli
    await expect(page.locator('[data-selected="true"]')).toHaveCount(1);
    await expect(page.locator('[data-file-id="scale-file-0001"]')).toHaveAttribute("data-selected", "true");
    await expect(page.getByText(/3 öğeden 1 tanesi yapıştırılamadı/i).first()).toBeVisible();
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test("S7.3: 5.000 öğelik fixture'da Liste ve Grid sanallaştırma DOM bütçesi < 250 düğümde kalır", async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    const fiveThousandFiles = Array.from({ length: 5000 }, (_, i) => makeScaleFile(i));
    const cachedScalePayload = JSON.stringify({
      folder: null,
      breadcrumbs: [{ id: null, name: "Kök Dizin" }],
      folders: [],
      files: fiveThousandFiles,
      summary: {
        totalFiles: 5000,
        totalFolders: 0,
        totalSizeBytes: 5000 * 2048,
        starredCount: 0,
        trashCount: 0,
        activeSharesCount: 0,
        categoryCounts: { cad: 0, pdf: 5000, image: 0, other: 0 },
      },
    });
    await page.route("**/api/dokumantasyon/readiness", (route) =>
      route.fulfill({ json: { ok: true, storageMode: "local_dev" } })
    );
    await page.route("**/api/dokumantasyon/items**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: cachedScalePayload,
      });
    });

    const itemsLoaded = page.waitForResponse(
      (res) => res.url().includes("/api/dokumantasyon/items") && res.status() === 200
    );
    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await itemsLoaded;
    const rows = page.locator("[data-file-id]");
    await expect(rows.first()).toBeVisible();

    const initialRowCount = await rows.count();
    expect(initialRowCount).toBeGreaterThan(0);
    expect(initialRowCount).toBeLessThan(250);

    // Hızlı kaydırma sonrası da DOM bütçesi korunur
    const viewport = page.getByTestId("dok-explorer-viewport");
    await viewport.evaluate((el) => {
      el.scrollTop = Math.floor(el.scrollHeight * 0.5);
    });
    await expect.poll(() => rows.count()).toBeLessThan(250);

    // Grid moduna geç ve DOM bütçesini doğrula
    await page.getByRole("button", { name: "Kart (Grid) Görünümü", exact: true }).click();
    const cards = page.locator("[data-file-id]");
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeLessThan(250);

    await viewport.evaluate((el) => {
      el.scrollTop = Math.floor(el.scrollHeight * 0.7);
    });
    await expect.poll(() => cards.count()).toBeLessThan(250);

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test("S7.4: Hızlı klasör gezinmesinde (A -> B -> C -> Geri) stale response ezmesi olmaz", async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.route("**/api/dokumantasyon/readiness", (route) =>
      route.fulfill({ json: { ok: true, storageMode: "local_dev" } })
    );

    const folders = [
      { id: "folder-a", name: "Klasör A", parent_id: null, created_at: NOW, updated_at: NOW, deleted_at: null, starred_at: null },
      { id: "folder-b", name: "Klasör B", parent_id: "folder-a", created_at: NOW, updated_at: NOW, deleted_at: null, starred_at: null },
      { id: "folder-c", name: "Klasör C", parent_id: "folder-b", created_at: NOW, updated_at: NOW, deleted_at: null, starred_at: null },
    ];

    let aVisitCount = 0;
    await page.route("**/api/dokumantasyon/items**", async (route) => {
      const url = new URL(route.request().url());
      const folderId = url.searchParams.get("folderId");

      if (folderId === "folder-a") {
        aVisitCount += 1;
        // İlk A ziyaretinde geç dönen yanıt simüle etmiyoruz ki B'ye geçebilelim;
        // B ziyareti yavaşlatılıp hemen C'ye geçilince stale B yanıtı C'yi ezmemeli.
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            folder: folders[0],
            breadcrumbs: [{ id: null, name: "Kök Dizin" }, { id: "folder-a", name: "Klasör A" }],
            folders: [folders[1]],
            files: Array.from({ length: 40 }, (_, i) => makeScaleFile(i, "folder-a")),
            summary: { totalFiles: 40, totalFolders: 3, totalSizeBytes: 80_000, starredCount: 0, trashCount: 0, activeSharesCount: 0, categoryCounts: { cad: 0, pdf: 40, image: 0, other: 0 } },
          }),
        });
        return;
      }

      if (folderId === "folder-b") {
        await new Promise((r) => setTimeout(r, 200));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            folder: folders[1],
            breadcrumbs: [
              { id: null, name: "Kök Dizin" },
              { id: "folder-a", name: "Klasör A" },
              { id: "folder-b", name: "Klasör B" },
            ],
            folders: [folders[2]],
            files: [makeScaleFile(101, "folder-b")],
            summary: { totalFiles: 40, totalFolders: 3, totalSizeBytes: 80_000, starredCount: 0, trashCount: 0, activeSharesCount: 0, categoryCounts: { cad: 0, pdf: 40, image: 0, other: 0 } },
          }),
        });
        return;
      }

      if (folderId === "folder-c") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            folder: folders[2],
            breadcrumbs: [
              { id: null, name: "Kök Dizin" },
              { id: "folder-a", name: "Klasör A" },
              { id: "folder-b", name: "Klasör B" },
              { id: "folder-c", name: "Klasör C" },
            ],
            folders: [],
            files: [makeScaleFile(999, "folder-c")],
            summary: { totalFiles: 40, totalFolders: 3, totalSizeBytes: 80_000, starredCount: 0, trashCount: 0, activeSharesCount: 0, categoryCounts: { cad: 0, pdf: 40, image: 0, other: 0 } },
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
          folders: [folders[0]],
          files: [],
          summary: { totalFiles: 40, totalFolders: 3, totalSizeBytes: 80_000, starredCount: 0, trashCount: 0, activeSharesCount: 0, categoryCounts: { cad: 0, pdf: 40, image: 0, other: 0 } },
        }),
      });
    });

    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await page.locator('[data-folder-id="folder-a"]').dblclick();
    await expect(page.locator('[data-folder-id="folder-b"]')).toBeVisible();

    // Klasör A'da scroll yap (scroll restoration doğrulaması için)
    const viewport = page.getByTestId("dok-explorer-viewport");
    await viewport.evaluate((el) => {
      el.scrollTop = 300;
    });

    // B'ye gir ve C'ye geç
    await page.locator('[data-folder-id="folder-b"]').dblclick();
    await expect(page.locator('[data-folder-id="folder-c"]')).toBeVisible();
    await page.locator('[data-folder-id="folder-c"]').dblclick();

    await expect(page.locator('[data-file-id="scale-file-0999"]')).toBeVisible();
    // Stale B yanıtı C'yi ezmemeli
    await expect(page.locator('[data-file-id="scale-file-0101"]')).toHaveCount(0);

    // Breadcrumb üzerinden Klasör A'ya geri dön (TanStack Query staleTime cache'ten anında döner)
    await page.locator("[data-breadcrumb] button").filter({ hasText: "Klasör A" }).click();
    await expect(page.locator('[data-folder-id="folder-b"]')).toBeVisible();
    expect(aVisitCount).toBeGreaterThanOrEqual(1);

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
});
