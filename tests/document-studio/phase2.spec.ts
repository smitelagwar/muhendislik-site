import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/dokumantasyon");
  await page.locator("input#username").fill("admin");
  await page.locator("input#password").fill("admin");
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  await expect(page.locator("input#username")).toBeHidden();
}

async function createFixture(page: import("@playwright/test").Page) {
  return page.evaluate(async () => {
    const formData = new FormData();
    formData.append("file", new File(["phase 2 layout fixture"], "phase2-layout.txt", { type: "text/plain" }));
    formData.append("pathname", `phase2-${crypto.randomUUID()}.txt`);
    const response = await fetch("/api/dokumantasyon/upload/local", { method: "POST", body: formData });
    const payload = await response.json();
    if (!response.ok || !payload.file?.id) throw new Error(payload.error || "Fixture upload failed");
    return payload.file.id as string;
  });
}

test("workspace stays balanced across the Phase 2 viewport matrix", async ({ page }) => {
  await login(page);

  for (const viewport of [
    { width: 320, height: 568 }, { width: 360, height: 800 }, { width: 390, height: 844 },
    { width: 412, height: 915 }, { width: 768, height: 1024 }, { width: 1024, height: 768 },
    { width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    const geometry = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      workspace: document.querySelector<HTMLElement>("[class*='workspace']")?.getBoundingClientRect().width ?? 0,
    }));
    expect(geometry.scrollWidth, `${viewport.width}px horizontal overflow`).toBeLessThanOrEqual(geometry.clientWidth);
    expect(geometry.workspace).toBeGreaterThan(0);
    const menu = page.getByRole("button", { name: "Dokümantasyon menüsünü aç" });
    if (viewport.width < 1024) await expect(menu).toBeVisible();
    else await expect(menu).toBeHidden();
  }
});

test("mobile details is an accessible sheet with focus return", async ({ page }) => {
  await login(page);
  const fileId = await createFixture(page);
  await page.reload();
  await page.setViewportSize({ width: 390, height: 844 });

  const row = page.locator(`a[href="/dokumantasyon/dosya/${fileId}"]`).first().locator("xpath=ancestor::div[contains(@class, 'grid-cols')][1]");
  const select = row.getByLabel("Dosya Seç");
  await select.click();
  const sheet = page.getByRole("dialog");
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText("phase2-layout");
  await expect(page.getByRole("button", { name: "Detayları kapat" })).toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");

  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(select).toBeFocused();
});
