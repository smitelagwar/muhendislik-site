import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/dokumantasyon");
  await page.locator("input#username").first().fill("admin");
  await page.locator("input#password").first().fill("admin");
  await page.getByRole("button", { name: "Giriş Yap" }).first().click();
  await expect(page.locator("input#username").first()).toBeHidden();
}

async function createFileFixture(page: import("@playwright/test").Page, name: string) {
  return page.evaluate(async (fileName) => {
    const formData = new FormData();
    formData.append("file", new File([`phase 4 fixture: ${fileName}`], fileName, { type: "text/plain" }));
    formData.append("pathname", `dok_storage/phase4-${crypto.randomUUID()}.txt`);
    const response = await fetch("/api/dokumantasyon/upload/local", { method: "POST", body: formData });
    const payload = await response.json();
    if (!response.ok || !payload.file?.id) throw new Error(payload.error || "Fixture upload failed");
    return payload.file.id as string;
  }, name);
}

async function createFolderFixture(page: import("@playwright/test").Page, name: string) {
  return page.evaluate(async (folderName) => {
    const response = await fetch("/api/dokumantasyon/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: folderName, parentId: null }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.folder?.id) throw new Error(payload.error || "Folder fixture failed");
    return payload.folder.id as string;
  }, name);
}

function fileRow(page: import("@playwright/test").Page, fileId: string) {
  return page.locator(`a[href="/dokumantasyon/dosya/${fileId}"]`).first().locator("xpath=ancestor::div[contains(@class, 'grid-cols')][1]");
}

test("server-side stars, true recent items, filters, and bulk move remain usable", async ({ page }) => {
  await login(page);
  const marker = crypto.randomUUID().slice(0, 8);
  const firstId = await createFileFixture(page, `phase4-first-${marker}.txt`);
  const secondId = await createFileFixture(page, `phase4-second-${marker}.txt`);
  const targetFolderName = `phase4-target-${marker}`;
  await createFolderFixture(page, targetFolderName);
  await page.reload();

  const firstRow = fileRow(page, firstId);
  await expect(firstRow).toBeVisible();
  const starResponse = page.waitForResponse((response) =>
    response.url().endsWith(`/api/dokumantasyon/files/${firstId}`) && response.request().method() === "PATCH"
  );
  await firstRow.getByRole("button", { name: "Yıldızla" }).click();
  expect((await starResponse).ok()).toBe(true);
  // Tarayıcı state'i silinse de yıldız server metadata'sından gelmelidir.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const starredFilter = page.getByRole("button", { name: "Yıldızlı Dosyalar" });
  await starredFilter.scrollIntoViewIfNeeded();
  await starredFilter.click();
  await expect(page.locator(`a[href="/dokumantasyon/dosya/${firstId}"]`).first()).toBeVisible();

  await page.locator(`a[href="/dokumantasyon/dosya/${firstId}"]`).first().click();
  await expect(page).toHaveURL(new RegExp(`/dokumantasyon/dosya/${firstId}$`));
  await page.goBack();
  await page.getByText("Son Açılanlar", { exact: true }).click();
  await expect(page.locator(`a[href="/dokumantasyon/dosya/${firstId}"]`).first()).toBeVisible();

  await page.getByText("Tüm Dosyalarım", { exact: true }).click();
  await page.getByRole("button", { name: "Dosya filtreleri" }).click();
  const filters = page.getByTestId("workspace-filter-sheet");
  await filters.getByLabel("Tür").selectOption("other");
  await filters.getByLabel("Kapsam").selectOption("all");
  await filters.getByRole("button", { name: "Uygula" }).click();
  await expect(page.getByText("Etkin filtreler:")).toBeVisible();
  await page.getByText("Etkin filtreler:").locator("..").getByRole("button", { name: "Temizle" }).click();

  const refreshedFirstRow = fileRow(page, firstId);
  const secondRow = fileRow(page, secondId);
  await refreshedFirstRow.getByRole("button", { name: "Dosya Seç" }).click();
  // İlk seçim detay drawer'ını açar; ikinci satırın pointer hedefi olarak
  // kalmaması için kapatıp bulk seçim akışını gerçek kullanıcı gibi sürdür.
  await page.getByRole("button", { name: "Kapat", exact: true }).click();
  await secondRow.getByRole("button", { name: "Dosya Seç" }).click();
  await page.getByRole("button", { name: "Taşı", exact: true }).click();
  const moveDialog = page.getByRole("dialog");
  const targetFolder = moveDialog.getByRole("button", { name: targetFolderName, exact: true });
  await targetFolder.scrollIntoViewIfNeeded();
  await expect(targetFolder).toBeVisible();
  await targetFolder.click();
  await moveDialog.getByRole("button", { name: "Buraya Taşı" }).click();
  await expect(page.locator(`a[href="/dokumantasyon/dosya/${firstId}"]`).first()).toBeHidden();
  await expect(page.locator(`a[href="/dokumantasyon/dosya/${secondId}"]`).first()).toBeHidden();
  const activityActions = await page.evaluate(async () => {
    const response = await fetch("/api/dokumantasyon/activity");
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Activity fetch failed");
    return payload.events.map((event: { action: string }) => event.action);
  });
  expect(activityActions).toContain("upload");
  expect(activityActions).toContain("move");
});

test("retryable queue and mobile bulk/filter controls fit the Phase 4 viewport contract", async ({ page }) => {
  await login(page);
  const marker = crypto.randomUUID().slice(0, 8);
  const mobileFileId = await createFileFixture(page, `phase4-mobile-${marker}.txt`);
  await page.reload();

  let interceptedIntent = false;
  await page.route("**/api/dokumantasyon/upload/intent", (route) => {
    interceptedIntent = true;
    return route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Geçici yükleme hatası", code: "TEMPORARY_UPLOAD_FAILURE" }),
    });
  }, { times: 1 });
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Dosya yükle", exact: true }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles({ name: `phase4-retry-${marker}.txt`, mimeType: "text/plain", buffer: Buffer.from("retry fixture") });
  await expect.poll(() => interceptedIntent).toBe(true);
  await expect(page.getByRole("button", { name: "Tekrar dene" })).toBeVisible();
  await page.getByRole("button", { name: "Tekrar dene" }).click();
  await expect(page.getByText(/Yükleme Tamamlandı/)).toBeVisible();

  await page.setViewportSize({ width: 320, height: 568 });
  await page.reload();
  const row = fileRow(page, mobileFileId);
  await row.getByRole("button", { name: "Dosya Seç" }).click();
  const details = page.getByRole("dialog");
  await expect(details).toBeVisible();
  await page.getByRole("button", { name: "Detayları kapat" }).click();
  await expect(page.getByRole("button", { name: "Taşı", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Link Oluştur", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Dosya filtreleri" }).click();
  await expect(page.getByTestId("workspace-filter-sheet")).toBeVisible();
  await page.getByRole("button", { name: "Filtreleri kapat" }).click();

  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    const geometry = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
    expect(geometry.scrollWidth, `${viewport.width}px yatay taşma`).toBeLessThanOrEqual(geometry.clientWidth);
  }
});
