import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/dokumantasyon");
  const username = page.locator("input#username").first();
  const loginVisible = await username
    .waitFor({ state: "visible", timeout: 2000 })
    .then(() => true)
    .catch(() => false);

  if (loginVisible) {
    await username.fill("admin");
    await page.locator("input#password").first().fill("admin");
    await page.getByRole("button", { name: "Giriş Yap" }).first().click();
    await expect(page.locator("input#username").first()).toBeHidden();
  }
}

async function uploadPng(page: import("@playwright/test").Page, fileName: string) {
  return page.evaluate(async (name) => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context is unavailable");
    ctx.fillStyle = "#334155";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png")
    );
    const formData = new FormData();
    formData.append("file", new File([blob], name, { type: "image/png" }));
    formData.append("pathname", `toolbar-parity-${crypto.randomUUID()}.png`);
    const response = await fetch("/api/dokumantasyon/upload/local", { method: "POST", body: formData });
    const payload = await response.json();
    if (!response.ok || !payload.file?.id) throw new Error(payload.error || "upload failed");
    return payload.file.id as string;
  }, fileName);
}

test("belge stüdyosunda görsel için tek toolbar + fullscreen/rename/delete erişilebilir", async ({ page }) => {
  await login(page);
  const fileId = await uploadPng(page, "toolbar-parity-studio.png");
  await page.goto(`/dokumantasyon/dosya/${fileId}`);

  // Tek toolbar doğrulaması: image toolbar görünür, studio-topbar DOM'da yok
  await expect(page.getByTestId("image-viewer-toolbar")).toBeVisible();
  await expect(page.getByTestId("document-studio-topbar")).toHaveCount(0);

  // Tam ekran ikonu (masaüstü genişlikte görünür)
  await expect(page.getByTestId("image-viewer-fullscreen-toggle")).toBeVisible();

  // Yeniden adlandır / sil menüsü açılıp kapanabilmeli
  await page.getByTestId("image-viewer-more-menu-trigger").click();
  await expect(page.getByText("Yeniden Adlandır", { exact: true })).toBeVisible();
  await expect(page.getByText("Çöp Kutusuna At", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");

  // Meta bilgi satırı (uzantı rozeti ve piksel boyutu)
  await expect(page.locator("text=PNG").first()).toBeVisible();
  await expect(page.getByText("640 × 480 px")).toBeVisible();
});

test("genel paylaşım önizlemesinde görsel için tek toolbar (çift üst çubuk yok)", async ({ page }) => {
  await login(page);
  const fileId = await uploadPng(page, "toolbar-parity-public.png");
  await page.goto(`/dokumantasyon/dosya/${fileId}`);

  // Paylaşım bağlantısı oluştur
  await page.locator('[data-command-id="studio.share"]').first().click();
  await expect(page.getByText("Süreli Paylaşım Linki Oluştur")).toBeVisible();
  await page.getByRole("button", { name: "Link Oluştur" }).click();

  // Paylaşım linkini yakala
  await expect(page.getByText("Paylaşım Linki Hazır!")).toBeVisible();
  const shareInput = page.locator('input[readonly]').first();
  const shareUrl = await shareInput.inputValue();
  expect(shareUrl).toContain("/p/");

  // Modal'ı kapat ve paylaşım sayfasına git
  await page.keyboard.press("Escape");
  const sharePath = new URL(shareUrl).pathname;
  await page.goto(sharePath);

  // Önizleme butonunun hazır olmasını bekle ve tıkla
  const previewBtn = page.getByRole("button", { name: "Önizle" }).first();
  await expect(previewBtn).toBeVisible();
  await previewBtn.click();

  // Modal içinde yalnızca image-viewer-toolbar görünmeli
  await expect(page.getByTestId("image-viewer-toolbar")).toBeVisible({ timeout: 15000 });
  // Public modalın kendi header'ı görsel için render edilmemeli
  await expect(page.locator("header").filter({ hasText: "toolbar-parity-public" })).toHaveCount(0);

  // Toolbar'daki geri butonu modalı kapatmalı
  await page.locator('[data-command-id="studio.back"]').first().click();
  await expect(page.getByTestId("image-viewer-toolbar")).toHaveCount(0);
});
