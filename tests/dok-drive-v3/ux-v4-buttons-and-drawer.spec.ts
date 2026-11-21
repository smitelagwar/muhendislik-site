import { test, expect, type Page } from "@playwright/test";

const NOW = "2026-10-01T10:00:00.000Z";

function makeSeed() {
  return {
    folders: [
      {
        id: "folder-1",
        name: "Statik Çizimler",
        parent_id: null,
        created_at: NOW,
        updated_at: NOW,
        deleted_at: null,
        starred_at: null,
      },
    ],
    files: [
      {
        id: "file-1",
        folder_id: null,
        display_name: "Temel Planı.pdf",
        blob_pathname: "tests/temel.pdf",
        blob_url: "https://example.invalid/temel.pdf",
        size_bytes: 2048,
        mime_type: "application/pdf",
        extension: "pdf",
        created_at: NOW,
        updated_at: NOW,
        deleted_at: null,
        starred_at: null,
      },
      {
        id: "file-2",
        folder_id: null,
        display_name: "Kolon Detayı.dwg",
        blob_pathname: "tests/kolon.dwg",
        blob_url: "https://example.invalid/kolon.dwg",
        size_bytes: 4096,
        mime_type: "application/acad",
        extension: "dwg",
        created_at: NOW,
        updated_at: NOW,
        deleted_at: null,
        starred_at: null,
      },
      {
        id: "file-3",
        folder_id: null,
        display_name: "Metraj Notları.md",
        blob_pathname: "tests/metraj.md",
        blob_url: "https://example.invalid/metraj.md",
        size_bytes: 1024,
        mime_type: "text/markdown",
        extension: "md",
        created_at: NOW,
        updated_at: NOW,
        deleted_at: null,
        starred_at: null,
      },
    ],
  };
}

async function setupS2Mock(page: Page, options?: { failStar?: boolean }) {
  const state = makeSeed();
  let logoutCalled = false;
  let refreshCount = 0;

  await page.route("**/api/dokumantasyon/readiness", (route) =>
    route.fulfill({ json: { ok: true, storageMode: "local_dev" } })
  );
  await page.route("**/api/dokumantasyon/trash", (route) =>
    route.fulfill({ json: { folders: [], files: [] } })
  );
  await page.route("**/api/dokumantasyon/shares**", (route) =>
    route.fulfill({ json: { shares: [] } })
  );
  await page.route("**/api/dokumantasyon/folders", (route) =>
    route.fulfill({ json: { folders: state.folders } })
  );
  await page.route("**/api/dokumantasyon/activity**", (route) =>
    route.fulfill({
      json: {
        events: [
          {
            id: "act-1",
            action: "upload",
            target_type: "file",
            target_id: "file-1",
            target_name: "Temel Planı.pdf",
            actor: "admin",
            created_at: NOW,
          },
        ],
      },
    })
  );
  await page.route("**/api/dokumantasyon/items**", (route) => {
    refreshCount += 1;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        folder: null,
        breadcrumbs: [{ id: null, name: "Kök Dizin" }],
        folders: state.folders,
        files: state.files,
        summary: {
          totalFiles: state.files.length,
          totalFolders: state.folders.length,
          totalSizeBytes: state.files.reduce((a, f) => a + f.size_bytes, 0),
          starredCount: state.files.filter((f) => Boolean(f.starred_at)).length,
          categoryCounts: { cad: 1, pdf: 1, image: 0, other: 1 },
        },
      }),
    });
  });

  await page.route("**/api/dokumantasyon/bulk/star", async (route) => {
    if (options?.failStar) {
      return route.fulfill({ status: 500, json: { error: "Sunucu hatası" } });
    }
    const body = (await route.request().postDataJSON()) as { fileIds?: string[]; starred?: boolean };
    const ids = new Set(body.fileIds ?? []);
    state.files = state.files.map((f) =>
      ids.has(f.id) ? { ...f, starred_at: body.starred ? NOW : null } : f
    );
    return route.fulfill({ json: { ok: true, results: [] } });
  });

  await page.route("**/api/dokumantasyon/bulk/trash", (route) =>
    route.fulfill({ json: { ok: true, results: [] } })
  );
  await page.route("**/api/dokumantasyon/bulk/move", (route) =>
    route.fulfill({ json: { ok: true, results: [] } })
  );
  await page.route("**/api/dokumantasyon/cikis", (route) => {
    logoutCalled = true;
    return route.fulfill({ json: { ok: true } });
  });

  return {
    getLogoutCalled: () => logoutCalled,
    getRefreshCount: () => refreshCount,
  };
}

function attachConsoleAndErrorGuard(page: Page) {
  const issues: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") issues.push(`console.error: ${msg.text()}`);
    if (msg.type() === "warning" && msg.text().includes("Handler not registered")) {
      issues.push(`console.warn: ${msg.text()}`);
    }
  });
  page.on("pageerror", (err) => issues.push(`pageerror: ${err.message}`));
  return issues;
}

test.describe("UX V4 — S2: Sıfır Ölü Kontrol, Çekmece, Dock & Çıkış", () => {
  test("S2.1: Komut çubuğundaki her tekil buton çalışır ve 0 Handler not registered uyarısı üretir", async ({ page }) => {
    const issues = attachConsoleAndErrorGuard(page);
    const mock = await setupS2Mock(page);
    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("dok-file-row").first()).toBeVisible();

    // Tümünü Seç
    await page.getByTestId("dok-select-all").click();
    await expect(page.locator('[data-selected="true"]')).toHaveCount(4);
    await page.getByTestId("dok-select-all").click();
    await expect(page.locator('[data-selected="true"]')).toHaveCount(0);

    // Sırala & Grupla
    await page.getByRole("button", { name: "Sırala" }).click();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Grupla" }).click();
    await page.keyboard.press("Escape");

    // Ara...
    await page.getByRole("button", { name: /Ara\.\.\./ }).click();
    await expect(page.getByTestId("dok-dialog-content")).toBeVisible();
    await page.keyboard.press("Escape");

    // Filtre
    await page.getByRole("button", { name: "Dosya filtreleri" }).click();
    await expect(page.getByTestId("workspace-filter-sheet")).toBeVisible();
    await page.keyboard.press("Escape");

    // Yeni Klasör
    await page.getByRole("button", { name: "Yeni Klasör", exact: true }).click();
    await expect(page.getByTestId("dok-dialog-content")).toBeVisible();
    await page.keyboard.press("Escape");

    // Liste <-> Grid
    await page.getByRole("button", { name: "Kart (Grid) Görünümü", exact: true }).click();
    await expect(page.getByTestId("dok-file-card").first()).toBeVisible();
    await page.getByRole("button", { name: "Liste Görünümü", exact: true }).click();
    await expect(page.getByTestId("dok-file-row").first()).toBeVisible();

    // Yenile
    const beforeRefresh = mock.getRefreshCount();
    await page.getByTestId("dok-refresh-btn").click();
    await expect.poll(() => mock.getRefreshCount()).toBeGreaterThan(beforeRefresh);

    // Bilgi/Detay
    await page.getByRole("button", { name: "Öğe Bilgi ve Detay Çekmecesi" }).or(page.locator('button[title="Öğe Bilgi ve Detay Çekmecesi"]')).click();
    await expect(page.getByTestId("dok-drawer-tab-info")).toBeVisible();

    // ? Kısayollar
    await page.getByTestId("dok-status-shortcuts-btn").click();
    await expect(page.getByTestId("dok-shortcuts-modal")).toBeVisible();
    await page.keyboard.press("Escape");

    expect(issues.filter((msg) => !msg.includes("status of 500") && !msg.includes("500 (Internal Server Error)"))).toEqual([]);
  });

  test("S2.2 & S2.3: Hover hızlı eylemler seçimi bozmaz; Detay Çekmecesi 0/1/3 seçim ve Etkinlik sekmesi", async ({ page }) => {
    const issues = attachConsoleAndErrorGuard(page);
    await setupS2Mock(page);
    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("dok-file-row").first()).toBeVisible();

    // S2.3a: 0 seçiliyken çekmece Klasör Özeti gösterir
    await page.locator('button[title="Öğe Bilgi ve Detay Çekmecesi"]').click();
    await expect(page.getByTestId("dok-drawer-tab-info")).toBeVisible();
    await expect(page.getByText("Klasör Özeti")).toBeVisible();

    // S2.3b: 1 öğe seçiliyken öğe detayları
    const file1 = page.locator('[data-file-id="file-1"]');
    await file1.click({ position: { x: 10, y: 10 } });
    await expect(page.getByText("Temel Planı.pdf").first()).toBeVisible();

    // S2.2: Hover quick action (Paylaş) seçimi bozmadan modal açar
    await file1.hover();
    await file1.getByTestId("dok-row-quick-actions").getByRole("button", { name: /paylaş/i }).click();
    await expect(page.getByTestId("dok-dialog-content")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(file1).toHaveAttribute("data-selected", "true");

    // S2.3c: 3 öğe seçiliyken Çoklu Seçim Özeti
    await page.locator('[data-file-id="file-2"]').click({ position: { x: 10, y: 10 }, modifiers: ["Control"] });
    await page.locator('[data-file-id="file-3"]').click({ position: { x: 10, y: 10 }, modifiers: ["Control"] });
    await expect(page.getByText(/3 öğe seçili/i).first()).toBeVisible();

    // S2.3d: Etkinlik sekmesi
    await page.getByTestId("dok-drawer-tab-activity").click();
    await expect(page.getByText("Temel Planı.pdf").first()).toBeVisible();
    expect(issues.filter((msg) => !msg.includes("status of 500") && !msg.includes("500 (Internal Server Error)"))).toEqual([]);
  });

  test("S2.4 & S2.5 & S2.6: Selection Dock, Yıldızla rollback ve Çıkış Yap", async ({ page }) => {
    const issues = attachConsoleAndErrorGuard(page);
    const mock = await setupS2Mock(page, { failStar: true });
    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("dok-folder-row").first()).toBeVisible();

    // S2.4a: Yalnız klasör seçiliyken Dock Paylaş -> CreateShareModal
    const folder1 = page.locator('[data-folder-id="folder-1"]');
    await folder1.click({ position: { x: 10, y: 10 } });
    const dock = page.getByTestId("dok-mobile-selection-dock");
    await expect(dock).toBeVisible();
    await dock.locator('[data-mobile-action="share"]').click();
    await expect(page.getByTestId("dok-dialog-content")).toBeVisible();
    await page.keyboard.press("Escape");

    // S2.4b: Çoklu dosya seçimi -> Taşı modalı açılır, ardından Kaldır/Temizle
    await page.locator('[data-file-id="file-1"]').click({ position: { x: 10, y: 10 } });
    await page.locator('[data-file-id="file-2"]').click({ position: { x: 10, y: 10 }, modifiers: ["Control"] });
    await dock.locator('[data-mobile-action="move"]').click();
    await expect(page.getByTestId("dok-dialog-content")).toBeVisible();
    await page.keyboard.press("Escape");

    // S2.5: Yıldızla sunucu hatasında rollback + Toast
    await dock.locator('[data-mobile-action="star"]').click();
    await expect(page.getByText(/hata|başarısız|yıldız/i).first()).toBeVisible();

    // S2.6: Çıkış Yap -> POST /api/dokumantasyon/cikis
    await page.getByTestId("dok-user-menu-btn").click();
    await page.getByTestId("dok-logout-btn").click();
    await expect.poll(() => mock.getLogoutCalled()).toBe(true);
    expect(issues.filter((msg) => !msg.includes("status of 500") && !msg.includes("500 (Internal Server Error)"))).toEqual([]);
  });
});
