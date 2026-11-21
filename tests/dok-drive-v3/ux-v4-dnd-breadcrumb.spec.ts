import { test, expect, type Locator, type Page } from "@playwright/test";

async function pddDragAndDrop(page: Page, source: Locator, target: Locator) {
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  await source.dispatchEvent("dragstart", { dataTransfer });
  await target.dispatchEvent("dragenter", { dataTransfer });
  await target.dispatchEvent("dragover", { dataTransfer });
  await target.dispatchEvent("drop", { dataTransfer });
  await source.dispatchEvent("dragend", { dataTransfer });
}

const NOW = "2026-11-20T10:00:00.000Z";

interface MockItemState {
  folders: Array<{
    id: string;
    name: string;
    parent_id: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: null;
    starred_at: null;
  }>;
  files: Array<{
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
    deleted_at: null;
    starred_at: null;
  }>;
  moveRequests: Array<{
    items: Array<{ id: string; type: "file" | "folder" }>;
    targetFolderId: string | null;
  }>;
}

async function setupDndMocks(page: Page): Promise<MockItemState> {
  const state: MockItemState = {
    folders: [
      {
        id: "folder-target",
        name: "Hedef Klasör",
        parent_id: null,
        created_at: NOW,
        updated_at: NOW,
        deleted_at: null,
        starred_at: null,
      },
      {
        id: "folder-sub",
        name: "Alt Klasör",
        parent_id: "folder-target",
        created_at: NOW,
        updated_at: NOW,
        deleted_at: null,
        starred_at: null,
      },
    ],
    files: [
      {
        id: "file-dnd-1",
        folder_id: null,
        display_name: "Mimari-Plan.pdf",
        blob_pathname: "tests/file-dnd-1.pdf",
        blob_url: "https://example.invalid/file-dnd-1.pdf",
        size_bytes: 2048,
        mime_type: "application/pdf",
        extension: "pdf",
        created_at: NOW,
        updated_at: NOW,
        deleted_at: null,
        starred_at: null,
      },
      {
        id: "file-dnd-2",
        folder_id: null,
        display_name: "Statik-Hesap.pdf",
        blob_pathname: "tests/file-dnd-2.pdf",
        blob_url: "https://example.invalid/file-dnd-2.pdf",
        size_bytes: 4096,
        mime_type: "application/pdf",
        extension: "pdf",
        created_at: NOW,
        updated_at: NOW,
        deleted_at: null,
        starred_at: null,
      },
      {
        id: "file-in-sub",
        folder_id: "folder-target",
        display_name: "Kat-Kesiti.dxf",
        blob_pathname: "tests/file-in-sub.dxf",
        blob_url: "https://example.invalid/file-in-sub.dxf",
        size_bytes: 8192,
        mime_type: "image/vnd.dxf",
        extension: "dxf",
        created_at: NOW,
        updated_at: NOW,
        deleted_at: null,
        starred_at: null,
      },
    ],
    moveRequests: [],
  };

  await page.route("**/api/dokumantasyon/readiness", (route) =>
    route.fulfill({ json: { ok: true, storageMode: "local_dev" } })
  );

  await page.route("**/api/dokumantasyon/items**", async (route) => {
    const url = new URL(route.request().url());
    const folderId = url.searchParams.get("folderId");
    const currentFolder = folderId ? state.folders.find((f) => f.id === folderId) ?? null : null;

    const breadcrumbs: Array<{ id: string | null; name: string }> = [{ id: null, name: "Kök Dizin" }];
    if (currentFolder) {
      if (currentFolder.parent_id) {
        const parent = state.folders.find((f) => f.id === currentFolder.parent_id);
        if (parent) breadcrumbs.push({ id: parent.id, name: parent.name });
      }
      breadcrumbs.push({ id: currentFolder.id, name: currentFolder.name });
    }

    const visibleFolders = state.folders.filter((f) => f.parent_id === (folderId ?? null));
    const visibleFiles = state.files.filter((f) => f.folder_id === (folderId ?? null));

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        folder: currentFolder,
        breadcrumbs,
        folders: visibleFolders,
        files: visibleFiles,
        summary: {
          totalFiles: state.files.length,
          totalFolders: state.folders.length,
          totalSizeBytes: state.files.reduce((sum, f) => sum + f.size_bytes, 0),
          starredCount: 0,
          trashCount: 0,
          activeSharesCount: 0,
          categoryCounts: { cad: 1, pdf: 2, image: 0, other: 0 },
        },
      }),
    });
  });

  await page.route("**/api/dokumantasyon/bulk/move", async (route) => {
    const body = (await route.request().postDataJSON()) as {
      items: Array<{ id: string; type: "file" | "folder" }>;
      targetFolderId: string | null;
    };
    state.moveRequests.push(body);
    for (const item of body.items) {
      if (item.type === "file") {
        const file = state.files.find((f) => f.id === item.id);
        if (file) file.folder_id = body.targetFolderId;
      } else {
        const folder = state.folders.find((f) => f.id === item.id);
        if (folder && folder.id !== body.targetFolderId) {
          folder.parent_id = body.targetFolderId;
        }
      }
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        succeeded: body.items.map((i) => ({ id: i.id, type: i.type })),
        failed: [],
      }),
    });
  });

  return state;
}

test.describe("Senaryo S5 — Sürükle-Bırak, Breadcrumb Drop & Harici Dosya", () => {
  test("S5.1: Tekil ve çoklu seçim dosya hedef klasöre sürüklenip bırakıldığında taşınır", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    const state = await setupDndMocks(page);
    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });

    const file1 = page.locator('[data-file-id="file-dnd-1"]');
    const file2 = page.locator('[data-file-id="file-dnd-2"]');
    const targetFolder = page.locator('[data-folder-id="folder-target"]');
    await expect(file1).toBeVisible();
    await expect(targetFolder).toBeVisible();

    // Çoklu seçim yap (Ctrl + click)
    await file1.click({ position: { x: 10, y: 10 } });
    await file2.click({ position: { x: 10, y: 10 }, modifiers: ["Control"] });
    await expect(page.locator('[data-selected="true"]')).toHaveCount(2);

    // Seçili dosyayı hedef klasöre sürükle-bırak
    await pddDragAndDrop(page, file1, targetFolder);

    await expect.poll(() => state.moveRequests.length).toBe(1);
    expect(state.moveRequests[0].targetFolderId).toBe("folder-target");
    expect(state.moveRequests[0].items.map((i) => i.id).sort()).toEqual(["file-dnd-1", "file-dnd-2"]);
    await expect(page.getByText(/2 öğe taşındı/i)).toBeVisible();
    await expect(file1).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("S5.2: Alt klasör içindeyken dosya Breadcrumb Kök Dizin üzerine bırakıldığında taşınır", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    const state = await setupDndMocks(page);
    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });

    const targetFolder = page.locator('[data-folder-id="folder-target"]');
    await expect(targetFolder).toBeVisible();
    await targetFolder.dblclick();

    const fileInSub = page.locator('[data-file-id="file-in-sub"]');
    await expect(fileInSub).toBeVisible();

    const rootBreadcrumb = page.locator("[data-breadcrumb] button").filter({ hasText: "Kök Dizin" }).first();
    await expect(rootBreadcrumb).toBeVisible();

    await pddDragAndDrop(page, fileInSub, rootBreadcrumb);

    await expect.poll(() => state.moveRequests.length).toBe(1);
    expect(state.moveRequests[0].targetFolderId).toBeNull();
    expect(state.moveRequests[0].items[0]?.id).toBe("file-in-sub");
    await expect(page.getByText(/1 öğe taşındı/i)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("S5.3: Klasör kendi içine bırakılamaz (döngü koruması)", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    const state = await setupDndMocks(page);
    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });

    const folder = page.locator('[data-folder-id="folder-target"]');
    await expect(folder).toBeVisible();

    await pddDragAndDrop(page, folder, folder);

    // Kısa bir bekleme sonrası hiçbir move isteği gitmemeli
    await page.waitForTimeout(250);
    expect(state.moveRequests).toHaveLength(0);
    expect(errors).toEqual([]);
  });

  test("S5.4: Harici dosya dragover canlı dropzone overlay açar ve drop yükleme kuyruğunu tetikler", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    let uploadIntentCalled = false;
    await setupDndMocks(page);
    await page.route("**/api/dokumantasyon/upload/intent", async (route) => {
      uploadIntentCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          isLocalMode: true,
          pathname: "tests/harici-test.txt",
          intentToken: "mock-intent-token",
          mimeType: "text/plain",
        }),
      });
    });
    await page.route("**/api/dokumantasyon/upload/local", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          file: {
            id: "uploaded-dnd-1",
            folder_id: null,
            display_name: "harici-test.txt",
            blob_pathname: "tests/harici-test.txt",
            blob_url: "https://example.invalid/harici-test.txt",
            size_bytes: 11,
            mime_type: "text/plain",
            extension: "txt",
            created_at: NOW,
            updated_at: NOW,
            deleted_at: null,
            starred_at: null,
          },
        }),
      });
    });

    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    const dropHost = page.locator("[data-mobile-selection-mode]").first();
    await expect(dropHost).toBeVisible();
    await expect(page.locator('[data-file-id="file-dnd-1"]')).toBeVisible();

    await dropHost.evaluate((el) => {
      const dt = new DataTransfer();
      dt.items.add(new File(["test-icerik"], "harici-test.txt", { type: "text/plain" }));
      (window as unknown as Record<string, DataTransfer>).__s5ExternalDt = dt;
      el.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: dt }));
    });
    await expect(page.getByText("Dosyaları buraya bırakın")).toBeVisible();

    await dropHost.evaluate((el) => {
      const dt = (window as unknown as Record<string, DataTransfer>).__s5ExternalDt;
      el.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt }));
    });
    await expect(page.getByText("Dosyaları buraya bırakın")).toBeHidden();
    await expect.poll(() => uploadIntentCalled).toBe(true);
    expect(errors).toEqual([]);
  });
});
