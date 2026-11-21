import { test, expect, type Page } from "@playwright/test";

const NOW = "2026-09-10T06:00:00.000Z";

const DEEP_FOLDERS = [
  { id: "f-l1", name: "Projeler", parent_id: null, created_at: NOW, updated_at: NOW, deleted_at: null, starred_at: null },
  { id: "f-l2", name: "Blok A", parent_id: "f-l1", created_at: NOW, updated_at: NOW, deleted_at: null, starred_at: null },
  { id: "f-l3", name: "Statik", parent_id: "f-l2", created_at: NOW, updated_at: NOW, deleted_at: null, starred_at: null },
];

const MIXED_FILES = [
  {
    id: "doc-1",
    folder_id: null,
    display_name: "Betonarme_Notlari.md",
    blob_pathname: "tests/doc-1.md",
    blob_url: "https://example.invalid/doc-1.md",
    size_bytes: 24_000,
    mime_type: "text/markdown",
    extension: "md",
    created_at: NOW,
    updated_at: NOW,
    deleted_at: null,
    starred_at: null,
  },
  {
    id: "pdf-1",
    folder_id: null,
    display_name: "Ruhsat_Projesi.pdf",
    blob_pathname: "tests/pdf-1.pdf",
    blob_url: "https://example.invalid/pdf-1.pdf",
    size_bytes: 512_000,
    mime_type: "application/pdf",
    extension: "pdf",
    created_at: NOW,
    updated_at: NOW,
    deleted_at: null,
    starred_at: null,
  },
  {
    id: "dwg-1",
    folder_id: null,
    display_name: "Kat_Plani.dwg",
    blob_pathname: "tests/dwg-1.dwg",
    blob_url: "https://example.invalid/dwg-1.dwg",
    size_bytes: 1_024_000,
    mime_type: "application/acad",
    extension: "dwg",
    created_at: NOW,
    updated_at: NOW,
    deleted_at: null,
    starred_at: null,
  },
];

async function setupMockDrive(page: Page) {
  let starredIds = new Set<string>();
  let trashedIds = new Set<string>();
  const apiHits = { star: 0, trash: 0 };

  await page.route("**/api/dokumantasyon/readiness", (route) =>
    route.fulfill({ json: { ok: true, storageMode: "local_dev" } })
  );

  await page.route("**/api/dokumantasyon/folders/tree", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ folders: DEEP_FOLDERS }),
    })
  );

  await page.route("**/api/dokumantasyon/bulk/star", async (route) => {
    apiHits.star += 1;
    const body = (await route.request().postDataJSON()) as {
      items?: Array<{ id: string; type: "file" | "folder" }>;
      isStarred?: boolean;
    };
    const items = body.items ?? [];
    for (const item of items) {
      if (body.isStarred) starredIds.add(item.id);
      else starredIds.delete(item.id);
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ succeeded: items.map((i) => i.id), failed: [] }),
    });
  });

  await page.route("**/api/dokumantasyon/bulk/trash", async (route) => {
    apiHits.trash += 1;
    const body = (await route.request().postDataJSON()) as {
      items?: Array<{ id: string; type: "file" | "folder" }>;
    };
    const items = body.items ?? [];
    for (const item of items) {
      trashedIds.add(item.id);
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ succeeded: items.map((i) => i.id), failed: [] }),
    });
  });

  await page.route("**/api/dokumantasyon/items**", async (route) => {
    const url = new URL(route.request().url());
    const folderId = url.searchParams.get("folderId");
    const typeFilter = url.searchParams.get("type") || "all";

    let breadcrumbs: Array<{ id: string | null; name: string }> = [
      { id: null, name: "Kök Dizin" },
    ];
    let currentFolder: (typeof DEEP_FOLDERS)[number] | null = null;
    let folders: typeof DEEP_FOLDERS = [];

    if (!folderId) {
      folders = [DEEP_FOLDERS[0]];
    } else if (folderId === "f-l1") {
      currentFolder = DEEP_FOLDERS[0];
      breadcrumbs = [{ id: null, name: "Kök Dizin" }, { id: "f-l1", name: "Projeler" }];
      folders = [DEEP_FOLDERS[1]];
    } else if (folderId === "f-l2") {
      currentFolder = DEEP_FOLDERS[1];
      breadcrumbs = [
        { id: null, name: "Kök Dizin" },
        { id: "f-l1", name: "Projeler" },
        { id: "f-l2", name: "Blok A" },
      ];
      folders = [DEEP_FOLDERS[2]];
    } else if (folderId === "f-l3") {
      currentFolder = DEEP_FOLDERS[2];
      breadcrumbs = [
        { id: null, name: "Kök Dizin" },
        { id: "f-l1", name: "Projeler" },
        { id: "f-l2", name: "Blok A" },
        { id: "f-l3", name: "Statik" },
      ];
      folders = [];
    }

    const activeFiles = MIXED_FILES.filter((f) => {
      if (trashedIds.has(f.id)) return false;
      if (folderId) return false;
      if (typeFilter === "document") return f.extension === "md";
      if (typeFilter === "pdf") return f.extension === "pdf";
      if (typeFilter === "cad") return f.extension === "dwg";
      return true;
    }).map((f) => ({
      ...f,
      starred_at: starredIds.has(f.id) ? NOW : null,
    }));

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        folder: currentFolder,
        breadcrumbs,
        folders: typeFilter !== "all" ? [] : folders,
        files: activeFiles,
        summary: {
          totalFiles: MIXED_FILES.length - trashedIds.size,
          totalFolders: 1,
          totalSizeBytes: 1_560_000,
          starredCount: starredIds.size,
          trashCount: trashedIds.size,
          categoryCounts: { cad: 1, pdf: 1, image: 0, document: 1, other: 0 },
        },
      }),
    });
  });

  return {
    apiHits,
    reset: () => {
      starredIds = new Set();
      trashedIds = new Set();
    },
  };
}

test.describe("UX V5 Paket 2 — Araç Çubuğu, Breadcrumb Geçmişi, Filtreler & Sidebar Ağacı", () => {
  test("S2.1 — 1366px tek satır toolbar, ←/→ + Alt+←/→ geçmiş ve 4+ derinlikte … dropdown", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await setupMockDrive(page);
    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });

    await expect(page.locator('[data-folder-id="f-l1"]')).toBeVisible({ timeout: 8000 });

    // 1366px toolbar yüksekliği tek satırda kalmalı (<= 64px)
    const toolbarBox = await page.locator("nav[aria-label='Klasör yolu']").boundingBox();
    expect(toolbarBox).not.toBeNull();
    expect(toolbarBox!.height).toBeLessThanOrEqual(52);

    // 3 seviye derine in (Root -> Projeler -> Blok A -> Statik = 4 öğeli breadcrumb)
    await page.locator('[data-folder-id="f-l1"]').dblclick();
    await expect(page.locator('[data-folder-id="f-l2"]')).toBeVisible({ timeout: 8000 });
    await page.locator('[data-folder-id="f-l2"]').dblclick();
    await expect(page.locator('[data-folder-id="f-l3"]')).toBeVisible({ timeout: 8000 });
    await page.locator('[data-folder-id="f-l3"]').dblclick();
    await expect(page.getByRole("button", { name: "Statik" })).toBeVisible({ timeout: 8000 });

    // 4+ derinlikte tıklanabilir "…" menüsü görünür ve gizlenen "Projeler" klasörüne atlar
    const ellipsisBtn = page.getByRole("button", { name: "Gizlenen üst klasörler" });
    await expect(ellipsisBtn).toBeVisible();
    await ellipsisBtn.click();
    await page.getByRole("menuitem", { name: "Projeler" }).click();
    await expect(page.locator('[data-folder-id="f-l2"]')).toBeVisible({ timeout: 8000 });

    // ← Geri ve → İleri butonları + Alt+← / Alt+→
    await page.getByRole("button", { name: "Geri", exact: true }).click();
    await expect(page.getByRole("button", { name: "Statik" })).toBeVisible({ timeout: 8000 });
    await page.getByRole("button", { name: "İleri", exact: true }).click();
    await expect(page.locator('[data-folder-id="f-l2"]')).toBeVisible({ timeout: 8000 });

    await page.getByTestId("dok-explorer-viewport").focus();
    await page.keyboard.press("Alt+ArrowLeft");
    await expect(page.getByRole("button", { name: "Statik" })).toBeVisible({ timeout: 8000 });
    await page.keyboard.press("Alt+ArrowRight");
    await expect(page.locator('[data-folder-id="f-l2"]')).toBeVisible({ timeout: 8000 });
  });

  test("S2.2 — FilterChipsBar 'Son 7 gün' etiketi ('Tarih: week' asla yok)", async ({ page }) => {
    await setupMockDrive(page);
    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("dok-file-row").first()).toBeVisible({ timeout: 8000 });

    await page.getByRole("button", { name: "Dosya filtreleri" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 8000 });

    const dateSelect = dialog.locator("select").filter({ has: page.locator('option[value="week"]') });
    await dateSelect.selectOption("week");
    await dialog.getByRole("button", { name: /Uygula|Kapat/i }).first().click();

    await expect(page.getByText("Tarih: Son 7 gün")).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("Tarih: week")).toHaveCount(0);
  });

  test("S2.3 — Belgeler & Tablolar kategorisi ve tıklanabilir depolama barı dilimi", async ({ page }) => {
    await setupMockDrive(page);
    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("dok-file-row")).toHaveCount(3, { timeout: 8000 });

    await page.getByRole("button", { name: /Belgeler & Tablolar/i }).first().click();
    await expect(page.getByTestId("dok-file-row")).toHaveCount(1, { timeout: 8000 });
    await expect(page.locator('[data-file-id="doc-1"]')).toBeVisible();

    const pdfSlice = page.locator('button[aria-label^="PDF:"]').first();
    await expect(pdfSlice).toBeVisible();
    await pdfSlice.click();
    await expect(page.getByTestId("dok-file-row")).toHaveCount(1, { timeout: 8000 });
    await expect(page.locator('[data-file-id="pdf-1"]')).toBeVisible();
  });

  test("S2.4 — Katlanabilir Sidebar Klasör Ağacı ve Yıldızlı/Çöp DnD drop hedefleri", async ({ page }) => {
    const state = await setupMockDrive(page);
    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("dok-file-row").first()).toBeVisible({ timeout: 8000 });

    // Klasör ağacı görünür ve klasöre tıklayınca oraya gider
    const tree = page.getByTestId("dok-sidebar-folder-tree");
    await expect(tree).toBeVisible({ timeout: 8000 });
    await tree.getByRole("button", { name: "Projeler" }).click();
    await expect(page.locator('[data-folder-id="f-l2"]')).toBeVisible({ timeout: 8000 });

    // Kök dizine dön
    await page.getByRole("button", { name: "Kök Dizin" }).click();
    await expect(page.locator('[data-file-id="doc-1"]')).toBeVisible({ timeout: 8000 });

    // Dosyayı sürükleyip Yıldızlı Dosyalar üzerine bırak
    const docRow = page.locator('[data-file-id="doc-1"]');
    const starredTarget = page.getByRole("button", { name: /Yıldızlı Dosyalar/i }).first();
    await docRow.dragTo(starredTarget);
    await expect.poll(() => state.apiHits.star, { timeout: 8000 }).toBeGreaterThanOrEqual(1);

    // Dosyayı sürükleyip Çöp Kutusu üzerine bırak
    const pdfRow = page.locator('[data-file-id="pdf-1"]');
    const trashTarget = page.getByRole("button", { name: /Çöp Kutusu/i }).first();
    await pdfRow.dragTo(trashTarget);
    await expect.poll(() => state.apiHits.trash, { timeout: 8000 }).toBeGreaterThanOrEqual(1);
    await expect(page.locator('[data-file-id="pdf-1"]')).toHaveCount(0);
  });
});
