import { test, expect, type Page } from "@playwright/test";

function attachErrorTracker(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

async function cleanupStampData(page: Page, stamp: string, createdFolderIds: string[], createdFileIds: string[]) {
  const itemsRes = await page.request.get("/api/dokumantasyon/items?scope=all");
  if (itemsRes.ok()) {
    const data = (await itemsRes.json()) as {
      folders?: Array<{ id: string; name: string }>;
      files?: Array<{ id: string; display_name: string }>;
    };
    const cleanupItems: Array<{ id: string; type: "file" | "folder" }> = [];
    for (const f of data.folders ?? []) {
      if (f.name.includes(stamp) || createdFolderIds.includes(f.id)) {
        cleanupItems.push({ id: f.id, type: "folder" });
      }
    }
    for (const file of data.files ?? []) {
      if (file.display_name.includes(stamp) || createdFileIds.includes(file.id)) {
        cleanupItems.push({ id: file.id, type: "file" });
      }
    }
    if (cleanupItems.length > 0) {
      await page.request.post("/api/dokumantasyon/bulk/trash", {
        data: { items: cleanupItems },
      });
    }
  }
  await page.request.post("/api/dokumantasyon/trash/empty");
}

async function openWorkspaceReady(page: Page) {
  const initialItemsLoaded = page.waitForResponse(
    (res) => res.url().includes("/api/dokumantasyon/items") && res.status() === 200
  );
  await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
  await initialItemsLoaded;
  await expect(page.getByTestId("dok-explorer-viewport")).toBeVisible();
  await expect(page.getByText(/Yerel Geliştirme/i)).toBeVisible();
}

async function createFolderViaUi(page: Page, name: string): Promise<string | null> {
  await page.getByRole("button", { name: "Yeni Klasör", exact: true }).first().click();
  const dialog = page.getByTestId("dok-dialog-content");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("textbox").fill(name);
  const resPromise = page.waitForResponse(
    (res) => res.url().includes("/api/dokumantasyon/folders") && res.request().method() === "POST"
  );
  await dialog.getByRole("button", { name: "Oluştur", exact: true }).click();
  const res = await resPromise;
  expect(res.ok()).toBe(true);
  const json = (await res.json()) as { folder?: { id: string } };
  await expect(page.getByTestId("dok-folder-row").filter({ hasText: name })).toBeVisible();
  return json.folder?.id ?? null;
}

test.describe("Senaryo S8 — Gerçek Backend Entegrasyon Testi (Mock'suz Yerel Depolama)", () => {
  test("S8.1a: Klasör, çoklu tür yükleme, scope=all+other filtre, yıldız ve kopya", async ({ page }) => {
    const errors = attachErrorTracker(page);
    const stamp = `a-${Date.now().toString(36)}`;
    const rootFolderName = `S8-Klasor-${stamp}`;
    const subFolderName = `S8-Alt-${stamp}`;
    const createdFolderIds: string[] = [];
    const createdFileIds: string[] = [];

    try {
      await openWorkspaceReady(page);

      const rootId = await createFolderViaUi(page, rootFolderName);
      if (rootId) createdFolderIds.push(rootId);

      await page.getByTestId("dok-folder-row").filter({ hasText: rootFolderName }).first().dblclick();
      const subId = await createFolderViaUi(page, subFolderName);
      if (subId) createdFolderIds.push(subId);

      await page.getByTestId("dok-folder-row").filter({ hasText: subFolderName }).first().dblclick();
      const fileInput = page.locator('input[type="file"]').first();
      const uploadSeeds = [
        { name: `plan-${stamp}.dxf`, mimeType: "application/dxf", buffer: Buffer.from("0\nSECTION\n2\nENTITIES\n0\nENDSEC\n0\nEOF\n") },
        { name: `rapor-${stamp}.pdf`, mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF") },
        { name: `notlar-${stamp}.md`, mimeType: "text/markdown", buffer: Buffer.from("# Test Notu\nE2E icerik") },
      ];
      for (const seed of uploadSeeds) {
        const localRes = page.waitForResponse(
          (res) => res.url().includes("/api/dokumantasyon/upload/local") && res.request().method() === "POST"
        );
        await fileInput.setInputFiles([seed]);
        expect((await localRes).ok()).toBe(true);
        await expect(page.getByTestId("dok-file-row").filter({ hasText: seed.name })).toBeVisible();
      }

      // Kök dizine dön ve scope=all + type=other uygula -> .md alt klasörden gelmeli
      await page.locator("[data-breadcrumb] button").filter({ hasText: "Kök Dizin" }).first().click();
      await page.getByRole("button", { name: /Filtre/i }).first().click();
      const filterSheet = page.getByRole("dialog");
      await expect(filterSheet).toBeVisible();
      const selects = filterSheet.locator("select");
      await selects.nth(0).selectOption("other");
      await selects.nth(3).selectOption("all");
      await page.keyboard.press("Escape");

      const mdRow = page.getByTestId("dok-file-row").filter({ hasText: `notlar-${stamp}.md` }).first();
      await expect(mdRow).toBeVisible();
      const mdId = await mdRow.getAttribute("data-file-id");
      if (mdId) createdFileIds.push(mdId);

      // Yıldızla -> Yıldızlılar'da gör -> Kopyala
      await mdRow.click({ position: { x: 8, y: 8 } });
      await page.keyboard.press("s");
      await expect(page.getByText(/Yıldızlılara eklendi/i)).toBeVisible();

      await page.getByRole("button", { name: /Yıldızlı/i }).first().click();
      const starredMd = page.getByTestId("dok-file-row").filter({ hasText: `notlar-${stamp}.md` }).first();
      await expect(starredMd).toBeVisible();
      await starredMd.click({ position: { x: 8, y: 8 } });
      await page.keyboard.press("Control+c");
      await page.keyboard.press("Control+v");
      await expect(page.getByText(/öğe yapıştırıldı/i)).toBeVisible();

      expect(errors).toEqual([]);
    } finally {
      await cleanupStampData(page, stamp, createdFolderIds, createdFileIds);
    }
  });

  test("S8.1b: Adlandır, paylaş/iptal, çöpe at, geri yükle ve kalıcı temizle", async ({ page }) => {
    const errors = attachErrorTracker(page);
    const stamp = `b-${Date.now().toString(36)}`;
    const folderName = `S8-Klasor-${stamp}`;
    const originalFileName = `belge-${stamp}.md`;
    const renamedFileName = `guncel-${stamp}.md`;
    const createdFolderIds: string[] = [];
    const createdFileIds: string[] = [];

    try {
      await openWorkspaceReady(page);

      const folderId = await createFolderViaUi(page, folderName);
      if (folderId) createdFolderIds.push(folderId);

      await page.getByTestId("dok-folder-row").filter({ hasText: folderName }).first().dblclick();
      const fileInput = page.locator('input[type="file"]').first();
      const localRes = page.waitForResponse(
        (res) => res.url().includes("/api/dokumantasyon/upload/local") && res.request().method() === "POST"
      );
      await fileInput.setInputFiles([
        { name: originalFileName, mimeType: "text/markdown", buffer: Buffer.from("# Test\nS8.1b") },
      ]);
      expect((await localRes).ok()).toBe(true);

      const fileRow = page.getByTestId("dok-file-row").filter({ hasText: originalFileName }).first();
      await expect(fileRow).toBeVisible();
      const fileId = await fileRow.getAttribute("data-file-id");
      if (fileId) createdFileIds.push(fileId);

      // Yeniden adlandır
      await fileRow.click({ position: { x: 8, y: 8 } });
      await page.keyboard.press("F2");
      const renameModal = page.getByRole("dialog");
      await expect(renameModal).toBeVisible();
      await renameModal.getByRole("textbox").fill(renamedFileName);
      await renameModal.getByRole("button", { name: /Kaydet/i }).click();
      const renamedRow = page.getByTestId("dok-file-row").filter({ hasText: renamedFileName }).first();
      await expect(renamedRow).toBeVisible();

      // Paylaşım oluştur ve Aktif Paylaşımlar'da iptal et
      await renamedRow.click({ button: "right", position: { x: 10, y: 10 } });
      await page.getByRole("menuitem", { name: /Süreli Link Oluştur|Paylaş/i }).click();
      const shareDialog = page.getByRole("dialog");
      await expect(shareDialog).toBeVisible();
      await shareDialog.getByRole("button", { name: /Link Oluştur|Paylaşım Oluştur/i }).click();
      await expect(page.getByText(/Paylaşım Linki Hazır|Paylaşım oluşturuldu/i).first()).toBeVisible();
      await page.keyboard.press("Escape");

      await page.getByRole("button", { name: /Aktif Paylaşımlar/i }).first().click();
      const activeSharesModal = page.getByRole("dialog");
      await expect(activeSharesModal).toBeVisible();
      const revokeBtn = activeSharesModal.getByRole("button", { name: /İptal Et/i }).first();
      if (await revokeBtn.isVisible()) {
        await revokeBtn.click();
        const confirmRevoke = activeSharesModal.getByRole("button", { name: /Onayla|Evet/i }).first();
        if (await confirmRevoke.isVisible()) {
          await confirmRevoke.click();
        }
      }
      await page.keyboard.press("Escape");

      // Kök dizine dön, klasörü çöpe at ve Çöp Kutusu'ndan geri yükle
      await page.locator("[data-breadcrumb] button").filter({ hasText: "Kök Dizin" }).first().click();
      const rootFolderRow = page.getByTestId("dok-folder-row").filter({ hasText: folderName }).first();
      await expect(rootFolderRow).toBeVisible();
      await rootFolderRow.click({ position: { x: 8, y: 8 } });
      await page.keyboard.press("Delete");
      const deleteDialog = page.getByTestId("dok-dialog-content");
      await expect(deleteDialog).toBeVisible();
      const trashResPromise = page.waitForResponse(
        (res) =>
          (res.url().includes("/api/dokumantasyon/folders/") || res.url().includes("/api/dokumantasyon/bulk/trash")) &&
          (res.request().method() === "DELETE" || res.request().method() === "POST")
      );
      await deleteDialog.getByRole("button", { name: /Çöp|Sil/i }).last().click();
      expect((await trashResPromise).ok()).toBe(true);
      await expect(page.getByTestId("dok-folder-row").filter({ hasText: folderName })).toHaveCount(0);

      await page.getByRole("button", { name: /Çöp Kutusu/i }).first().click();
      const trashDialog = page.getByRole("dialog");
      await expect(trashDialog).toBeVisible();
      await expect(trashDialog.getByText(folderName)).toBeVisible();
      await trashDialog.getByRole("button", { name: /Geri Yükle/i }).first().click();
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("dok-folder-row").filter({ hasText: folderName })).toBeVisible();

      expect(errors).toEqual([]);
    } finally {
      await cleanupStampData(page, stamp, createdFolderIds, createdFileIds);
    }
  });
});
