import { expect, test, type Page } from "@playwright/test";

async function ensureSignedIn(page: Page) {
  await page.goto("/dokumantasyon");
  const username = page.locator("input#username");
  const dashboard = page.getByRole("button", { name: "Yeni Dosya Yükle" });
  await expect.poll(async () => {
    if (await username.isVisible()) return "login";
    if (await dashboard.isVisible()) return "dashboard";
    return "pending";
  }, { timeout: 12_000 }).not.toBe("pending");

  if (await username.isVisible()) {
    await username.fill("admin");
    await page.locator("input#password").fill("admin");
    await page.getByRole("button", { name: "Giriş Yap" }).click();
  }
  await expect(dashboard).toBeVisible();
}

test("APS yapılandırılmamışsa orchestrator DWG'yi kontrollü terminal hata ve indirme eylemine taşır", async ({ page }) => {
  await ensureSignedIn(page);

  const fileId = await page.evaluate(async () => {
    const content = new Uint8Array([0x41, 0x43, 0x31, 0x30, 0x32, 0x37, 0x00, 0x00]);
    const formData = new FormData();
    formData.append("file", new File([content], "aps-yapilandirma-smoke.dwg", { type: "application/acad" }));
    formData.append("pathname", `cad-dwg-${crypto.randomUUID()}.dwg`);
    const response = await fetch("/api/dokumantasyon/upload/local", { method: "POST", body: formData });
    const payload = await response.json() as { file?: { id?: string }; error?: string };
    if (!response.ok || !payload.file?.id) throw new Error(payload.error || "DWG fixture yüklenemedi.");
    return payload.file.id;
  });

  await page.goto(`/dokumantasyon/dosya/${fileId}`);
  await expect(page.locator('[data-cad-runtime="orchestrator"]').first()).toBeVisible();
  await expect(page.getByTestId("cad-dwg-aps-only")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText("DWG açılamadı").first()).toBeVisible();
  await expect(page.getByText("DWG görüntüleme servisi yapılandırılmamış.").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Tekrar dene" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Dosyayı indir" }).first()).toBeVisible();
});
