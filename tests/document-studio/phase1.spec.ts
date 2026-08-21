import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/dokumantasyon");
  await page.locator("input#username").first().fill("admin");
  await page.locator("input#password").first().fill("admin");
  await page.getByRole("button", { name: "Giriş Yap" }).first().click();
  await expect(page.locator("input#username").first()).toBeHidden();
}

async function createLocalFixture(page: import("@playwright/test").Page, name: string) {
  return page.evaluate(async (fileName) => {
    const formData = new FormData();
    formData.append("file", new File(["phase 1 fixture"], fileName, { type: "text/plain" }));
    formData.append("pathname", `phase1-${crypto.randomUUID()}.txt`);
    const response = await fetch("/api/dokumantasyon/upload/local", { method: "POST", body: formData });
    const payload = await response.json();
    if (!response.ok || !payload.file?.id) throw new Error(payload.error || "Fixture upload failed");
    return payload.file.id as string;
  }, name);
}

test("mobile menu opens, closes with Escape/backdrop, locks scrolling, and restores focus", async ({ page }) => {
  await login(page);

  const menuButton = page.getByRole("button", { name: "Dokümantasyon menüsünü aç" });
  await menuButton.click();
  const drawer = page.getByRole("dialog", { name: "Dokümantasyon gezintisi" });
  await expect(drawer).toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");

  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(menuButton).toBeFocused();

  await menuButton.click();
  const drawerBox = await drawer.boundingBox();
  if (!drawerBox) throw new Error("Mobile drawer geometry is unavailable");
  await page.mouse.click(drawerBox.x + drawerBox.width + 12, drawerBox.y + drawerBox.height / 2);
  await expect(drawer).toBeHidden();
});

test("documentation manager has no horizontal overflow at required viewports", async ({ page }) => {
  await login(page);

  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    const layout = await page.evaluate(() => {
      const clientWidth = document.documentElement.clientWidth;
      const offenders = Array.from(document.querySelectorAll<HTMLElement>("body *"))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return { tag: element.tagName, className: element.className, right: Math.round(rect.right), width: Math.round(rect.width) };
        })
        .filter((item) => item.right > clientWidth + 1)
        .slice(0, 4);
      return { scrollWidth: document.documentElement.scrollWidth, clientWidth, offenders };
    });
    expect(layout.scrollWidth, `${viewport.width}px overflow: ${JSON.stringify(layout.offenders)}`).toBeLessThanOrEqual(layout.clientWidth);
    const menuButton = page.getByRole("button", { name: "Dokümantasyon menüsünü aç" });
    if (viewport.width < 1024) await expect(menuButton).toBeVisible();
    else await expect(menuButton).toBeHidden();
  }
});

test("preview stays in-app by default and new-tab open is explicit", async ({ page }) => {
  await login(page);
  const fileId = await createLocalFixture(page, "phase1-preview.txt");
  await page.reload();

  const fileLink = page.locator(`a[href="/dokumantasyon/dosya/${fileId}"]`).first();
  await expect(fileLink).toBeVisible();
  await expect(fileLink).not.toHaveAttribute("target", "_blank");
  await fileLink.click();
  await expect(page).toHaveURL(new RegExp(`/dokumantasyon/dosya/${fileId}$`));

  await page.goto("/dokumantasyon");
  const fileRow = page
    .locator(`a[href="/dokumantasyon/dosya/${fileId}"]`)
    .first()
    .locator("xpath=ancestor::div[contains(@class, 'grid-cols-12')][1]");
  await fileRow.getByLabel("Dosya İşlemleri").click();
  const popupPromise = page.waitForEvent("popup");
  await page.getByText("Yeni Sekmede Aç", { exact: true }).click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL(new RegExp(`/dokumantasyon/dosya/${fileId}$`));
});

test("delete failure stays visible and upload waits for metadata confirmation", async ({ page }) => {
  await login(page);
  const fileId = await createLocalFixture(page, "phase1-delete.txt");
  await page.reload();

  let deleteRequests = 0;
  await page.route("**/api/dokumantasyon/files/**", async (route) => {
    if (route.request().method() === "DELETE") {
      deleteRequests += 1;
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Silme engellendi" }) });
      return;
    }
    await route.continue();
  });
  const fileRow = page
    .locator(`a[href="/dokumantasyon/dosya/${fileId}"]`)
    .first()
    .locator("xpath=ancestor::div[contains(@class, 'grid-cols-12')][1]");
  await fileRow.getByLabel("Dosya İşlemleri").click();
  await page.getByText("Çöp Kutusuna At", { exact: true }).click();
  await page.getByRole("button", { name: "Çöp Kutusuna Taşı", exact: true }).click();
  await expect.poll(() => deleteRequests).toBe(1);
  await expect(page.getByRole("alert").filter({ hasText: "Silme engellendi" })).toBeVisible();

  let metadataChecks = 0;
  await page.route("**/api/dokumantasyon/upload/status?*", async (route) => {
    metadataChecks += 1;
    if (metadataChecks === 1) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ finalized: false }) });
      return;
    }
    await route.continue();
  });
  await page.locator('input[type="file"]').setInputFiles({
    name: "phase1-confirmation.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("metadata confirmation"),
  });
  await expect(page.getByText("Liste kaydı doğrulanıyor...")).toBeVisible();
  await expect(page.getByText("Tamamlandı", { exact: true })).toBeVisible({ timeout: 10_000 });
  expect(metadataChecks).toBeGreaterThanOrEqual(1);
});
