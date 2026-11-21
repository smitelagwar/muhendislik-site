import { test, expect, type Page } from "@playwright/test";

const NOW = "2026-10-10T10:00:00.000Z";

interface MockFolder {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  starred_at: string | null;
}

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

async function setupS4Mock(page: Page, options?: { failUpload?: boolean; slowUpload?: boolean }) {
  const folders: MockFolder[] = [
    {
      id: "folder-root-a",
      name: "Mimari Klasör",
      parent_id: null,
      created_at: NOW,
      updated_at: NOW,
      deleted_at: null,
      starred_at: null,
    },
    {
      id: "folder-child-a",
      name: "Alt Kat Planları",
      parent_id: "folder-root-a",
      created_at: NOW,
      updated_at: NOW,
      deleted_at: null,
      starred_at: null,
    },
  ];
  let files: MockFile[] = [
    {
      id: "file-plan",
      folder_id: null,
      display_name: "TemelKalip.dwg",
      blob_pathname: "tests/temel.dwg",
      blob_url: "https://example.invalid/temel.dwg",
      size_bytes: 4096,
      mime_type: "application/acad",
      extension: "dwg",
      created_at: NOW,
      updated_at: NOW,
      deleted_at: null,
      starred_at: null,
    },
  ];
  let trashFolders: MockFolder[] = [];
  let trashFiles: MockFile[] = [
    {
      id: "trash-pdf-1",
      folder_id: null,
      display_name: "Silinen Rapor.pdf",
      blob_pathname: "tests/silinen-1.pdf",
      blob_url: "https://example.invalid/silinen-1.pdf",
      size_bytes: 1024,
      mime_type: "application/pdf",
      extension: "pdf",
      created_at: NOW,
      updated_at: NOW,
      deleted_at: NOW,
      starred_at: null,
    },
    {
      id: "trash-dwg-2",
      folder_id: null,
      display_name: "Silinen Çizim.dwg",
      blob_pathname: "tests/silinen-2.dwg",
      blob_url: "https://example.invalid/silinen-2.dwg",
      size_bytes: 2048,
      mime_type: "application/acad",
      extension: "dwg",
      created_at: NOW,
      updated_at: NOW,
      deleted_at: NOW,
      starred_at: null,
    },
  ];

  const shares = [
    {
      id: "share-1",
      token: "tok-active-1",
      shareUrl: "https://example.invalid/paylas/tok-active-1",
      title: "Aktif Paylaşım",
      target_type: "file",
      target_id: "file-plan",
      target_name: "TemelKalip.dwg",
      expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      created_at: NOW,
      revoked_at: null,
      download_count: 2,
      max_downloads: 10,
      has_password: false,
      is_active: true,
      total_files: 1,
      total_size_bytes: 4096,
    },
  ];

  let folderSeq = 1;
  let bulkRestoreCalled = false;
  let revokeCalled = false;
  let uploadAttempts = 0;

  await page.route("**/api/dokumantasyon/readiness", (route) =>
    route.fulfill({ json: { ok: true, storageMode: "local_dev" } })
  );

  await page.route("**/api/dokumantasyon/items**", async (route) => {
    const url = new URL(route.request().url());
    const folderId = url.searchParams.get("folderId") || null;
    return route.fulfill({
      json: {
        folder: folderId ? folders.find((f) => f.id === folderId) ?? null : null,
        breadcrumbs: [{ id: null, name: "Kök Dizin" }],
        folders: folders.filter((f) => f.parent_id === folderId && !f.deleted_at),
        files: files.filter((f) => f.folder_id === folderId && !f.deleted_at),
        summary: {
          totalFiles: files.length,
          totalFolders: folders.length,
          totalSizeBytes: files.reduce((a, f) => a + f.size_bytes, 0),
          starredCount: 0,
        },
      },
    });
  });

  await page.route("**/api/dokumantasyon/folders/tree", (route) =>
    route.fulfill({ json: { folders } })
  );

  await page.route("**/api/dokumantasyon/folders", async (route) => {
    if (route.request().method() === "POST") {
      const body = (await route.request().postDataJSON()) as { name: string; parentId?: string | null };
      const created: MockFolder = {
        id: `folder-real-${folderSeq++}`,
        name: body.name,
        parent_id: body.parentId ?? null,
        created_at: NOW,
        updated_at: NOW,
        deleted_at: null,
        starred_at: null,
      };
      folders.push(created);
      return route.fulfill({ status: 201, json: { folder: created } });
    }
    return route.fulfill({ json: { folders } });
  });

  await page.route("**/api/dokumantasyon/files/*", async (route) => {
    if (route.request().method() === "PATCH") {
      const id = route.request().url().split("/").pop()!;
      const body = (await route.request().postDataJSON()) as { displayName?: string };
      files = files.map((f) => (f.id === id && body.displayName ? { ...f, display_name: body.displayName } : f));
      return route.fulfill({ json: { file: files.find((f) => f.id === id) } });
    }
    return route.fulfill({ json: { ok: true } });
  });

  await page.route("**/api/dokumantasyon/search**", async (route) => {
    const url = new URL(route.request().url());
    const q = (url.searchParams.get("q") || "").toLowerCase();
    const type = url.searchParams.get("type") || "all";
    const matchedFiles = files.filter(
      (f) => f.display_name.toLowerCase().includes(q) && (type === "all" || type === "cad")
    );
    return route.fulfill({
      json: {
        folders: folders.filter((f) => f.name.toLowerCase().includes(q)),
        files: matchedFiles,
      },
    });
  });

  await page.route("**/api/dokumantasyon/trash", (route) => {
    const items = [
      ...trashFolders.map((folder) => ({
        id: folder.id,
        type: "folder" as const,
        name: folder.name,
        deleted_at: folder.deleted_at || NOW,
        parent_id: folder.parent_id,
      })),
      ...trashFiles.map((file) => ({
        id: file.id,
        type: "file" as const,
        name: file.display_name,
        extension: file.extension,
        mime_type: file.mime_type,
        size_bytes: file.size_bytes,
        deleted_at: file.deleted_at || NOW,
        folder_id: file.folder_id,
      })),
    ];
    return route.fulfill({ json: { items } });
  });

  await page.route("**/api/dokumantasyon/bulk/restore", async (route) => {
    bulkRestoreCalled = true;
    const body = (await route.request().postDataJSON()) as { items?: Array<{ id: string }> };
    const ids = (body.items ?? []).map((i) => i.id);
    files.push(...trashFiles.map((f) => ({ ...f, deleted_at: null })));
    trashFiles = [];
    return route.fulfill({ json: { ok: true, succeeded: ids, failed: [] } });
  });

  await page.route("**/api/dokumantasyon/trash/*", (route) => {
    const id = route.request().url().split("/").pop()!;
    trashFiles = trashFiles.filter((f) => f.id !== id);
    trashFolders = trashFolders.filter((f) => f.id !== id);
    return route.fulfill({ json: { ok: true } });
  });

  await page.route("**/api/dokumantasyon/shares**", async (route) => {
    const url = route.request().url();
    if (route.request().method() === "DELETE" || url.includes("/revoke")) {
      revokeCalled = true;
      shares[0] = { ...shares[0], revoked_at: NOW, is_active: false };
      return route.fulfill({ json: { ok: true } });
    }
    if (route.request().method() === "POST") {
      const body = (route.request().postDataJSON() as { title?: string } | null) ?? {};
      const created = {
        id: `share-${shares.length + 1}`,
        token: `tok-${shares.length + 1}`,
        shareUrl: `https://example.invalid/paylas/tok-${shares.length + 1}`,
        title: body.title || "Yeni Paylaşım",
        target_type: "file",
        target_id: "file-plan",
        target_name: "TemelKalip.dwg",
        expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
        created_at: NOW,
        revoked_at: null,
        download_count: 0,
        max_downloads: null,
        has_password: false,
        is_active: true,
        total_files: 1,
        total_size_bytes: 4096,
      };
      shares.unshift(created);
      return route.fulfill({
        status: 201,
        json: {
          shareLink: created,
          shareUrl: created.shareUrl,
          rawToken: created.token,
        },
      });
    }
    return route.fulfill({ json: { links: shares } });
  });

  await page.route("**/api/dokumantasyon/upload**", async (route) => {
    uploadAttempts += 1;
    if (options?.slowUpload && uploadAttempts === 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }
    if (options?.failUpload && uploadAttempts <= 2) {
      return route.fulfill({ status: 500, json: { error: "Yükleme başarısız" } });
    }
    return route.fulfill({
      status: 201,
      json: {
        file: {
          id: `uploaded-${uploadAttempts}`,
          folder_id: null,
          display_name: `yuklenen-${uploadAttempts}.pdf`,
          blob_pathname: `tests/yuklenen-${uploadAttempts}.pdf`,
          blob_url: `https://example.invalid/yuklenen-${uploadAttempts}.pdf`,
          size_bytes: 512,
          mime_type: "application/pdf",
          extension: "pdf",
          created_at: NOW,
          updated_at: NOW,
          deleted_at: null,
          starred_at: null,
        },
      },
    });
  });

  return {
    getBulkRestoreCalled: () => bulkRestoreCalled,
    getRevokeCalled: () => revokeCalled,
    getUploadAttempts: () => uploadAttempts,
  };
}

function attachDialogAndErrorGuard(page: Page) {
  const errors: string[] = [];
  let nativeDialogTriggered = false;
  page.on("dialog", async (dialog) => {
    nativeDialogTriggered = true;
    await dialog.dismiss();
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return { errors, hasNativeDialog: () => nativeDialogTriggered };
}

test.describe("UX V4 — S4: Modallar, Çöp Kutusu, Paylaşımlar & Yükleme Kuyruğu", () => {
  test("S4.1–S4.4: Tek kapatma düğmesi, NewFolder, Rename gövde seçimi, Move ağaç & döngü koruması", async ({ page }) => {
    const guard = attachDialogAndErrorGuard(page);
    await setupS4Mock(page);
    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("dok-file-row").first()).toBeVisible();

    // S4.2: NewFolderModal -> tek kapatma düğmesi + pending->gerçek ID + tekrar açılışta boş input
    await page.getByRole("button", { name: "Yeni Klasör Oluştur", exact: true }).click();
    const dialog = page.getByTestId("dok-dialog-content");
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("dialog").getByRole("button", { name: "Pencereyi kapat" })).toHaveCount(1);

    const folderInput = dialog.getByPlaceholder("Örn: 2026 Statik Projeleri");
    await folderInput.fill("Yeni Şantiye Klasörü");
    await dialog.getByRole("button", { name: /Oluştur/i }).click();
    await expect(page.getByTestId("dok-explorer-viewport").getByText("Yeni Şantiye Klasörü")).toBeVisible();

    await page.getByRole("button", { name: "Yeni Klasör Oluştur", exact: true }).click();
    await expect(dialog.getByPlaceholder("Örn: 2026 Statik Projeleri")).toHaveValue("");
    await page.keyboard.press("Escape");

    // S4.3: F2 Satır İçi Yeniden Adlandırma (V5-10) -> uzantısız gövde seçili + kaydetme
    const fileRow = page.locator('[data-file-id="file-plan"]');
    await fileRow.click({ position: { x: 10, y: 10 } });
    await page.keyboard.press("F2");
    const renameInput = page.getByTestId("dok-inline-rename-input");
    await expect(renameInput).toBeVisible();

    const selectedRange = await renameInput.evaluate((el) => {
      const input = el as HTMLInputElement;
      return { start: input.selectionStart, end: input.selectionEnd, value: input.value };
    });
    expect(selectedRange.value).toBe("TemelKalip.dwg");
    expect(selectedRange.start).toBe(0);
    expect(selectedRange.end).toBe("TemelKalip".length);

    await renameInput.fill("RevizeTemel");
    await page.keyboard.press("Enter");
    await expect(page.getByText("RevizeTemel.dwg")).toBeVisible();

    // S4.4: MoveModal -> hiyerarşik ağaç + arama + döngüsel hedef hariç
    const rootFolderRow = page.locator('[data-folder-id="folder-root-a"]');
    await rootFolderRow.click({ position: { x: 10, y: 10 } });
    await page.keyboard.press("m");
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("dialog").getByRole("button", { name: "Pencereyi kapat" })).toHaveCount(1);
    await expect(dialog.getByText("Alt Kat Planları")).toHaveCount(0);

    await dialog.getByLabel("Hedef klasör ara").fill("Yeni Şantiye");
    await expect(dialog.getByText("Yeni Şantiye Klasörü")).toBeVisible();
    await page.keyboard.press("Escape");

    expect(guard.hasNativeDialog()).toBe(false);
    expect(
      guard.errors.filter(
        (msg) =>
          !msg.includes("500 (Internal Server Error)") &&
          !msg.includes("status of 500") &&
          !msg.includes("Yükleme hatası:")
      )
    ).toEqual([]);
  });

  test("S4.5 & S4.6: SearchModal (klavye + çip) ve TrashModal (gerçek ikon + toplu geri yükle + 2 adımlı silme)", async ({ page }) => {
    const guard = attachDialogAndErrorGuard(page);
    const mock = await setupS4Mock(page);
    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("dok-file-row").first()).toBeVisible();

    // S4.5: SearchModal
    await page.keyboard.press("/");
    const dialog = page.getByTestId("dok-dialog-content");
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("dialog").getByRole("button", { name: "Pencereyi kapat" })).toHaveCount(1);

    const searchInput = dialog.getByLabel("Dosya veya klasör ara");
    await searchInput.fill("Temel");
    await expect(dialog.getByText("TemelKalip.dwg")).toBeVisible();
    await dialog.getByRole("group", { name: "Dosya türü filtresi" }).getByRole("button", { name: /CAD/i }).click();
    await searchInput.press("ArrowDown");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.waitForTimeout(250);

    // S4.6: TrashModal -> 0 window.confirm + 2 adımlı silme + 2+ öğe seçip Seçilenleri Geri Yükle
    const trashBtn = page.getByRole("button", { name: /Çöp Kutusu/i }).first();
    await trashBtn.scrollIntoViewIfNeeded();
    await trashBtn.click();
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("dialog").getByRole("button", { name: "Pencereyi kapat" })).toHaveCount(1);

    await expect(dialog.getByText("Silinen Rapor.pdf")).toBeVisible();
    await expect(dialog.getByText("Silinen Çizim.dwg")).toBeVisible();

    // 2 öğeyi seç ve toplu geri yükle
    await dialog.getByLabel("Silinen Rapor.pdf seç").check();
    await dialog.getByLabel("Silinen Çizim.dwg seç").check();
    await dialog.getByRole("button", { name: /Seçilenleri Geri Yükle \(2\)/i }).click();
    await expect.poll(() => mock.getBulkRestoreCalled()).toBe(true);
    await page.keyboard.press("Escape");

    expect(guard.hasNativeDialog()).toBe(false);
    expect(
      guard.errors.filter(
        (msg) =>
          !msg.includes("500 (Internal Server Error)") &&
          !msg.includes("status of 500") &&
          !msg.includes("Yükleme hatası:")
      )
    ).toEqual([]);
  });

  test("S4.7 & S4.8: Paylaşım akışı (temiz form, QR Escape, satır içi iptal) ve Yükleme kuyruğu (İptal Et / Tekrar dene)", async ({ page }) => {
    const guard = attachDialogAndErrorGuard(page);
    const mock = await setupS4Mock(page, { failUpload: true });
    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("dok-file-row").first()).toBeVisible();

    // S4.7a: CreateShareModal -> ShareResultModal -> QR Göster
    await page.locator('[data-file-id="file-plan"]').click({ position: { x: 10, y: 10 } });
    await page.getByTestId("dok-mobile-selection-dock").locator('[data-mobile-action="share"]').click();
    const dialog = page.getByTestId("dok-dialog-content");
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("dialog").getByRole("button", { name: "Pencereyi kapat" })).toHaveCount(1);

    await dialog.getByRole("button", { name: /Link Oluştur/i }).click();
    await expect(dialog.getByRole("button", { name: /QR Göster/i })).toBeVisible();
    await dialog.getByRole("button", { name: /QR Göster/i }).click();
    await expect(dialog.getByAltText("Paylaşım QR Kodu")).toBeVisible();
    await page.keyboard.press("Escape");

    // S4.7b: ActiveSharesModal -> durum sekmeleri + QR Escape yalnız QR kapatır + satır içi iptal
    await page.getByRole("button", { name: /Aktif Paylaşımlar/i }).click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole("tablist", { name: "Paylaşım durumu filtresi" }).getByRole("tab").first().click();

    await dialog.getByRole("button", { name: "QR Kod Göster" }).first().click();
    await expect(dialog.getByAltText("QR Kod")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog.getByAltText("QR Kod")).toHaveCount(0);
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "İptal Et" }).first().click();
    const confirmRevoke = dialog.getByRole("button", { name: /Onayla|Evet/i });
    if ((await confirmRevoke.count()) > 0) {
      await confirmRevoke.first().click();
    }
    await expect.poll(() => mock.getRevokeCalled()).toBe(true);
    await page.keyboard.press("Escape");

    // S4.8: Çoklu dosya yükleme kuyruğu -> hata durumunda Tekrar dene + Tümünü Tekrar Dene
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles([
      { name: "dosya-a.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 a") },
      { name: "dosya-b.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 b") },
    ]);

    const uploadToast = page.getByLabel("Yükleme durumu");
    await expect(uploadToast).toBeVisible();
    await expect(uploadToast.getByRole("button", { name: /Tümünü Tekrar Dene/i })).toBeVisible();
    await uploadToast.getByRole("button", { name: /Tekrar dene/i }).first().click();
    await expect.poll(() => mock.getUploadAttempts()).toBeGreaterThan(2);

    expect(guard.hasNativeDialog()).toBe(false);
    expect(
      guard.errors.filter(
        (msg) =>
          !msg.includes("500 (Internal Server Error)") &&
          !msg.includes("status of 500") &&
          !msg.includes("Yükleme hatası:")
      )
    ).toEqual([]);
  });
});
