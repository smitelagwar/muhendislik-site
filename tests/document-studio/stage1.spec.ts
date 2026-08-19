import { expect, test } from "@playwright/test";

function createFixturePdfBase64(): string {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Length 39 >>\nstream\nBT /F1 18 Tf 45 100 Td (Studio QA) Tj ET\nendstream",
  ];
  let document = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(document, "utf8"));
    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(document, "utf8");
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  document += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(document, "utf8").toString("base64");
}

test("new-tab studio inherits theme, fills the viewport, and preserves PDF pixels", async ({ page }) => {
  await page.goto("/dokumantasyon");
  await page.getByLabel("Kullanıcı Adı").fill("admin");
  await page.locator("input#password").fill("admin");
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  await expect(page.getByLabel("Kullanıcı Adı")).toBeHidden();

  const fileId = await page.evaluate(async (pdfBase64) => {
    const bytes = Uint8Array.from(atob(pdfBase64), (character) => character.charCodeAt(0));
    const formData = new FormData();
    formData.append("file", new File([bytes], "stage1-studio-fixture.pdf", { type: "application/pdf" }));
    formData.append("pathname", `stage1-${crypto.randomUUID()}.pdf`);
    const response = await fetch("/api/dokumantasyon/upload/local", { method: "POST", body: formData });
    const payload = await response.json();
    if (!response.ok || !payload.file?.id) throw new Error(payload.error || "Fixture upload failed");
    return payload.file.id as string;
  }, createFixturePdfBase64());

  await page.reload();
  const fileLink = page.locator(`a[href="/dokumantasyon/dosya/${fileId}"]`).first();
  await expect(fileLink).toBeVisible();

  // Start light so the popup must inherit state from its opener.
  await page.getByTestId("theme-toggle").first().click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);

  const popupPromise = page.waitForEvent("popup");
  await fileLink.click();
  const studio = await popupPromise;
  await studio.waitForLoadState("domcontentloaded");
  await expect(studio).toHaveURL(new RegExp(`/dokumantasyon/dosya/${fileId}$`));

  await expect(studio.locator('[data-testid="document-studio-shell"]')).toBeVisible();
  await expect(studio.locator('[data-testid="document-studio-topbar"]')).toBeVisible();
  await expect(studio.locator('[data-testid="pdf-viewer-toolbar"]').first()).toBeVisible();
  await expect(studio.locator("html")).not.toHaveClass(/dark/);
  await expect(studio.getByRole("navigation")).toHaveCount(0);
  await expect(studio.locator("footer")).toHaveCount(0);

  const shellBox = await studio.locator('[data-testid="document-studio-shell"]').boundingBox();
  const viewport = studio.viewportSize();
  expect(shellBox?.width).toBe(viewport?.width);
  expect(shellBox?.height).toBe(viewport?.height);

  const canvas = studio.locator("canvas").first();
  await expect(canvas).toBeVisible();
  await studio.waitForTimeout(750);
  const beforeThemeChange = await canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL());
  await studio.getByTestId("theme-toggle").click();
  await expect(studio.locator("html")).toHaveClass(/dark/);
  await studio.waitForTimeout(250);
  const afterThemeChange = await canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL());
  expect(afterThemeChange).toBe(beforeThemeChange);

  await studio.reload();
  await expect(studio.locator("html")).toHaveClass(/dark/);
  await expect(studio.locator('[data-testid="pdf-viewer-toolbar"]').first()).toBeVisible();
});
