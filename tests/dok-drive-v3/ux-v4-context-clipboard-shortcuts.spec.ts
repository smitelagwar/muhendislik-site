import { test, expect, type Page } from "@playwright/test";

const NOW = "2026-10-05T12:00:00.000Z";

interface MockFile {
  id: string;
  folder_id: string | null;
  display_name: string;
  blob_pathname: string;
  blob_url: string;
  size_bytes: number;
  mime_type: string;
  extension: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  starred_at: string | null;
}

interface MockFolder {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  starred_at: string | null;
}

async function setupS3Mock(page: Page) {
  const folders: MockFolder[] = [
    {
      id: "folder-target",
      name: "Hedef Klasör",
      parent_id: null,
      created_at: NOW,
      updated_at: NOW,
      deleted_at: null,
      starred_at: null,
    },
  ];
  let files: MockFile[] = [
    {
      id: "file-dwg",
      folder_id: null,
      display_name: "Mimari Plan.dwg",
      blob_pathname: "tests/mimari.dwg",
      blob_url: "https://example.invalid/mimari.dwg",
      size_bytes: 2048,
      mime_type: "application/acad",
      extension: "dwg",
      created_at: NOW,
      updated_at: NOW,
      deleted_at: null,
      starred_at: null,
    },
    {
      id: "file-pdf",
      folder_id: null,
      display_name: "Hesap Raporu.pdf",
      blob_pathname: "tests/hesap.pdf",
      blob_url: "https://example.invalid/hesap.pdf",
      size_bytes: 1024,
      mime_type: "application/pdf",
      extension: "pdf",
      created_at: NOW,
      updated_at: NOW,
      deleted_at: null,
      starred_at: null,
    },
    {
      id: "file-md",
      folder_id: null,
      display_name: "Notlar.md",
      blob_pathname: "tests/notlar.md",
      blob_url: "https://example.invalid/notlar.md",
      size_bytes: 512,
      mime_type: "text/markdown",
      extension: "md",
      created_at: NOW,
      updated_at: NOW,
      deleted_at: null,
      starred_at: null,
    },
    {
      id: "file-4",
      folder_id: null,
      display_name: "Kesit.png",
      blob_pathname: "tests/kesit.png",
      blob_url: "https://example.invalid/kesit.png",
      size_bytes: 3072,
      mime_type: "image/png",
      extension: "png",
      created_at: NOW,
      updated_at: NOW,
      deleted_at: null,
      starred_at: null,
    },
  ];

  let copyCalls = 0;
  let moveCalls = 0;
  let starCalls = 0;

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
    route.fulfill({ json: { folders } })
  );

  await page.route("**/api/dokumantasyon/items**", async (route) => {
    const url = new URL(route.request().url());
    const folderId = url.searchParams.get("folderId") || null;
    const currentFolders = folders.filter((f) => f.parent_id === folderId && !f.deleted_at);
    const currentFiles = files.filter((f) => f.folder_id === folderId && !f.deleted_at);
    await route.fulfill({
      json: {
        folder: folderId ? folders.find((f) => f.id === folderId) ?? null : null,
        breadcrumbs: folderId
          ? [
              { id: null, name: "Kök Dizin" },
              { id: folderId, name: "Hedef Klasör" },
            ]
          : [{ id: null, name: "Kök Dizin" }],
        folders: currentFolders,
        files: currentFiles,
        summary: {
          totalFiles: files.filter((f) => !f.deleted_at).length,
          totalFolders: folders.filter((f) => !f.deleted_at).length,
          totalSizeBytes: files.reduce((a, f) => a + f.size_bytes, 0),
          starredCount: files.filter((f) => Boolean(f.starred_at)).length,
        },
      },
    });
  });

  await page.route("**/api/dokumantasyon/bulk/copy", async (route) => {
    copyCalls += 1;
    const body = (await route.request().postDataJSON()) as {
      items?: Array<{ id: string; type: string }>;
      fileIds?: string[];
      targetFolderId?: string | null;
    };
    const targetFolderId = body.targetFolderId ?? null;
    const ids = body.items ? body.items.map((i) => i.id) : (body.fileIds ?? []);
    for (const fid of ids) {
      const src = files.find((f) => f.id === fid);
      if (src) {
        const sameFolder = src.folder_id === targetFolderId;
        files.push({
          ...src,
          id: `${src.id}-copy-${copyCalls}`,
          folder_id: targetFolderId,
          display_name: sameFolder ? `${src.display_name.replace(/\.([^.]+)$/, "")} (Kopya).$1` : src.display_name,
        });
      }
    }
    return route.fulfill({ json: { ok: true, succeeded: ids, failed: [] } });
  });

  await page.route("**/api/dokumantasyon/bulk/move", async (route) => {
    moveCalls += 1;
    const body = (await route.request().postDataJSON()) as {
      items?: Array<{ id: string; type: string }>;
      fileIds?: string[];
      targetFolderId?: string | null;
    };
    const idList = body.items ? body.items.map((i) => i.id) : (body.fileIds ?? []);
    const ids = new Set(idList);
    files = files.map((f) => (ids.has(f.id) ? { ...f, folder_id: body.targetFolderId ?? null } : f));
    return route.fulfill({ json: { ok: true, succeeded: idList, failed: [] } });
  });

  await page.route("**/api/dokumantasyon/bulk/star", async (route) => {
    starCalls += 1;
    const body = (await route.request().postDataJSON()) as {
      items?: Array<{ id: string; type: string }>;
      fileIds?: string[];
      starred?: boolean;
    };
    const idList = body.items ? body.items.map((i) => i.id) : (body.fileIds ?? []);
    const ids = new Set(idList);
    files = files.map((f) => (ids.has(f.id) ? { ...f, starred_at: body.starred ? NOW : null } : f));
    return route.fulfill({ json: { ok: true, succeeded: idList, failed: [] } });
  });

  return {
    getCopyCalls: () => copyCalls,
    getMoveCalls: () => moveCalls,
    getStarCalls: () => starCalls,
  };
}

function attachErrorGuard(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

test.describe("UX V4 — S3: Sağ Tık Menüsü, Pano & Klavye Kısayolları", () => {
  test("S3.1–S3.4: Tekil/çoklu/boş alan sağ tık menüsü, viewport sınırı ve touch/pen koruması", async ({ page }) => {
    const errors = attachErrorGuard(page);
    await setupS3Mock(page);
    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("dok-file-row").first()).toBeVisible();

    const dwgRow = page.locator('[data-file-id="file-dwg"]');
    const pdfRow = page.locator('[data-file-id="file-pdf"]');
    const mdRow = page.locator('[data-file-id="file-md"]');
    const pngRow = page.locator('[data-file-id="file-4"]');

    // S3.1: Tekil CAD dosyaya sağ tık -> Motor V2 ile Aç görünür, viewport dışına taşmaz
    const rowBox = (await dwgRow.boundingBox())!;
    await dwgRow.click({ button: "right", position: { x: Math.max(10, rowBox.width - 20), y: 10 } });
    const menu = page.getByTestId("dok-context-menu");
    await expect(menu).toBeVisible();
    await expect(menu.getByTestId("dok-ctx-open-cad-v2")).toBeVisible();

    const menuBox = (await menu.boundingBox())!;
    const vp = page.viewportSize()!;
    expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(vp.width + 8);
    expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(vp.height + 8);
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);

    // S3.2: 3 öğe seçiliyken seçili 2. öğeye sağ tık -> seçim korunur
    await dwgRow.click({ position: { x: 10, y: 10 } });
    await pdfRow.click({ position: { x: 10, y: 10 }, modifiers: ["Control"] });
    await mdRow.click({ position: { x: 10, y: 10 }, modifiers: ["Control"] });
    await expect(page.locator('[data-selected="true"]')).toHaveCount(3);

    await pdfRow.click({ button: "right", position: { x: 10, y: 10 } });
    await expect(menu).toBeVisible();
    await expect(menu).toContainText("3 öğe seçili");
    await expect(page.locator('[data-selected="true"]')).toHaveCount(3);
    await page.keyboard.press("Escape");

    // Seçimsiz 4. öğeye sağ tık -> seçim yalnız 4. öğeye geçer
    await pngRow.click({ button: "right", position: { x: 10, y: 10 } });
    await expect(page.locator('[data-selected="true"]')).toHaveCount(1);
    await expect(pngRow).toHaveAttribute("data-selected", "true");
    await page.keyboard.press("Escape");

    // S3.3: Boş alana sağ tık -> seçim temizlenir, boş alan menüsü açılır
    await page.keyboard.press("Escape");
    const viewportEl = page.getByTestId("dok-explorer-viewport");
    const box = (await viewportEl.boundingBox())!;
    const clientX = Math.round(box.x + 24);
    const clientY = Math.round(box.y + box.height - 24);
    expect(Number.isFinite(clientX) && Number.isFinite(clientY)).toBe(true);
    await page.mouse.click(clientX, clientY, { button: "right" });
    await expect(menu).toBeVisible();
    await expect(menu.getByTestId("dok-ctx-new-folder")).toBeVisible();
    await expect(page.locator('[data-selected="true"]')).toHaveCount(0);
    await page.keyboard.press("Escape");

    // S3.4: Touch/pen contextmenu menü açmaz ve seçmez
    await dwgRow.dispatchEvent("pointerdown", { pointerType: "touch", pointerId: 31, button: 0 });
    await dwgRow.dispatchEvent("contextmenu", { pointerType: "touch", button: 2 });
    await dwgRow.dispatchEvent("pointerup", { pointerType: "touch", pointerId: 31, button: 0 });
    await expect(menu).toHaveCount(0);
    await expect(page.locator('[data-selected="true"]')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("S3.5 & S3.6: Gerçek Kopyala/Yapıştır (aynı klasör Kopya + hedef klasör) ve Kes/Yapıştır", async ({ page }) => {
    const errors = attachErrorGuard(page);
    const mock = await setupS3Mock(page);
    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("dok-file-row").first()).toBeVisible();

    // S3.5: Ctrl+C -> ClipboardBar -> aynı klasöre Ctrl+V ((Kopya) çakışma çözümü)
    const pdfRow = page.locator('[data-file-id="file-pdf"]');
    await pdfRow.click({ position: { x: 10, y: 10 } });
    await page.keyboard.press("Control+c");

    const clipBar = page.getByTestId("dok-clipboard-bar");
    await expect(clipBar).toBeVisible();
    await expect(clipBar).toContainText("1 öğe kopyalandı");

    await page.keyboard.press("Control+v");
    await expect.poll(() => mock.getCopyCalls()).toBe(1);
    await expect(page.getByText(/\(Kopya\)/)).toBeVisible();

    // S3.6: Ctrl+X -> data-clipboard-cut="true" -> hedef klasöre Ctrl+V -> bulk/move
    const mdRow = page.locator('[data-file-id="file-md"]');
    await mdRow.click({ position: { x: 10, y: 10 } });
    await page.keyboard.press("Control+x");
    await expect(mdRow).toHaveAttribute("data-clipboard-cut", "true");
    await expect(clipBar).toContainText("kesildi");

    await page.locator('[data-folder-id="folder-target"]').dblclick({ position: { x: 10, y: 10 } });
    await expect(page.getByText("Hedef Klasör")).toBeVisible();
    await page.keyboard.press("Control+v");
    await expect.poll(() => mock.getMoveCalls()).toBe(1);
    await expect(page.locator('[data-file-id="file-md"]')).toBeVisible();
    await expect(clipBar).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("S3.7: Klavye kısayolları ve input içinde kısayol bastırma", async ({ page }) => {
    const errors = attachErrorGuard(page);
    const mock = await setupS3Mock(page);
    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("dok-file-row").first()).toBeVisible();

    // Input içinde V/I/S/M/? tetiklenmemeli
    const inlineFilter = page.getByTestId("dok-inline-filter");
    await inlineFilter.click();
    await inlineFilter.type("vism?");
    await expect(page.getByTestId("dok-shortcuts-modal")).toHaveCount(0);
    await expect(page.getByTestId("dok-drawer-tab-info")).toHaveCount(0);
    await inlineFilter.fill("");
    await inlineFilter.blur();

    // Odak toolbar butonundayken Ctrl+A tümünü seçer
    await page.getByTestId("dok-refresh-btn").focus();
    await page.keyboard.press("Control+a");
    expect(await page.locator('[data-selected="true"]').count()).toBeGreaterThanOrEqual(4);

    // Escape seçimi temizler
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-selected="true"]')).toHaveCount(0);

    // V -> Liste <-> Grid
    await page.keyboard.press("v");
    await expect(page.getByTestId("dok-file-card").first()).toBeVisible();
    await page.keyboard.press("v");
    await expect(page.getByTestId("dok-file-row").first()).toBeVisible();

    // I -> Detay çekmecesi
    await page.keyboard.press("i");
    await expect(page.getByTestId("dok-drawer-tab-info")).toBeVisible();
    await page.keyboard.press("i");

    // ? -> Kısayol rehberi
    await page.keyboard.press("Shift+?");
    await expect(page.getByTestId("dok-shortcuts-modal")).toBeVisible();
    await page.keyboard.press("Escape");

    // Shift+N -> Yeni Klasör modalı
    await page.keyboard.press("Shift+N");
    await expect(page.getByTestId("dok-dialog-content")).toBeVisible();
    await page.keyboard.press("Escape");

    // / -> Arama modalı
    await page.keyboard.press("/");
    await expect(page.getByTestId("dok-dialog-content")).toBeVisible();
    await page.keyboard.press("Escape");

    // Tek dosya seçiliyken S (yıldızla), F2 (adlandır), M (taşı), Delete (çöp onayı)
    await page.locator('[data-file-id="file-pdf"]').click({ position: { x: 10, y: 10 } });
    await page.keyboard.press("s");
    await expect.poll(() => mock.getStarCalls()).toBe(1);

    await page.keyboard.press("F2");
    await expect(page.getByTestId("dok-inline-rename-input")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("dok-inline-rename-input")).toHaveCount(0);

    await page.keyboard.press("m");
    await expect(page.getByTestId("dok-dialog-content")).toBeVisible();
    await page.keyboard.press("Escape");

    await page.keyboard.press("Delete");
    await expect(page.getByTestId("dok-dialog-content")).toBeVisible();
    await page.keyboard.press("Escape");

    expect(errors).toEqual([]);
  });
});
