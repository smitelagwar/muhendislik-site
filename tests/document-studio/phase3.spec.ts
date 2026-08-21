import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/dokumantasyon");
  await page.locator("input#username").first().fill("admin");
  await page.locator("input#password").first().fill("admin");
  await page.getByRole("button", { name: "Giriş Yap" }).first().click();
  await expect(page.locator("input#username").first()).toBeHidden();
}

async function createImageFixture(page: import("@playwright/test").Page) {
  return page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 800;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas context is unavailable");
    context.fillStyle = "#0f172a";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#f59e0b";
    context.fillRect(100, 100, 1400, 600);
    const image = await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG creation failed")), "image/png"));
    const formData = new FormData();
    formData.append("file", new File([image], "phase3-landscape.png", { type: "image/png" }));
    formData.append("pathname", `phase3-${crypto.randomUUID()}.png`);
    const response = await fetch("/api/dokumantasyon/upload/local", { method: "POST", body: formData });
    const payload = await response.json();
    if (!response.ok || !payload.file?.id) throw new Error(payload.error || "Fixture upload failed");
    return payload.file.id as string;
  });
}

test("image studio keeps fit available, pans after zoom, and adapts to rotation", async ({ page }) => {
  await login(page);
  const fileId = await createImageFixture(page);
  await page.reload();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(`a[href="/dokumantasyon/dosya/${fileId}"]`).first().click();

  const viewport = page.getByTestId("image-viewer-viewport");
  await expect(viewport).toBeVisible();
  await expect(page.locator('[data-command-id="image.zoom.fit"]')).toBeVisible();
  await expect(page.locator('[data-zoom-mode="fit"]')).toBeVisible();

  await page.locator('[data-command-id="image.zoom.in"]').click();
  await expect(page.locator('[data-zoom-mode="custom"]')).toBeVisible();
  const beforePan = await viewport.evaluate((element) => ({ width: element.scrollWidth, clientWidth: element.clientWidth, left: element.scrollLeft }));
  expect(beforePan.width).toBeGreaterThan(beforePan.clientWidth);
  const box = await viewport.boundingBox();
  if (!box) throw new Error("Image viewport geometry is unavailable");
  await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.65);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.35);
  await page.mouse.up();
  await expect.poll(() => viewport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(beforePan.left);

  await page.locator('[data-command-id="image.zoom.fit"]').click();
  await page.getByRole("button", { name: "Görsel ek işlemleri" }).click();
  await page.getByText("Sağa döndür", { exact: true }).click();
  await expect(page.locator('[data-rotation="90"]')).toBeVisible();
  await expect(page.locator('[data-zoom-mode="fit"]')).toBeVisible();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('[data-zoom-mode="fit"]')).toBeVisible();
});
