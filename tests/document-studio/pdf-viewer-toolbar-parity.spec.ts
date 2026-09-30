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

function createFixturePdfBase64(): string {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Resources << >> >>",
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

async function uploadPdf(page: import("@playwright/test").Page, fileName: string) {
  const base64 = createFixturePdfBase64();
  return page.evaluate(
    async ({ name, content }) => {
      const bytes = Uint8Array.from(atob(content), (c) => c.charCodeAt(0));
      const formData = new FormData();
      formData.append("file", new File([bytes], name, { type: "application/pdf" }));
      formData.append("pathname", `dok_storage/toolbar-parity-${crypto.randomUUID()}.pdf`);
      const response = await fetch("/api/dokumantasyon/upload/local", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok || !payload.file?.id) throw new Error(payload.error || "upload failed");
      return payload.file.id as string;
    },
    { name: fileName, content: base64 }
  );
}

test.describe.serial("PDF Viewer Toolbar Parity", () => {
  let fileId: string;
  let sharePath: string;

  test("belge stüdyosunda PDF için tek toolbar + fullscreen/rename/delete erişilebilir", async ({ page }) => {
    await login(page);
    fileId = await uploadPdf(page, "toolbar-parity-studio.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    // Tek toolbar doğrulaması: pdf toolbar görünür, studio-topbar DOM'da yok
    await expect(page.getByTestId("pdf-viewer-toolbar")).toBeVisible();
    await expect(page.getByTestId("document-studio-topbar")).toHaveCount(0);

    // Tam ekran butonu masaüstünde görünür
    await expect(page.getByTestId("pdf-viewer-fullscreen-toggle")).toBeVisible();

    // Yeniden adlandır ve çöp kutusu menüsü açılabilmeli
    await page.getByTestId("pdf-viewer-more-menu-trigger").click();
    await expect(page.getByText("Yeniden Adlandır", { exact: true })).toBeVisible();
    await expect(page.getByText("Çöp Kutusuna At", { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");

    // Meta bilgi satırı (PDF rozeti)
    await expect(page.locator("text=PDF").first()).toBeVisible();

    // Paylaşım bağlantısını bu aşamada oluşturarak ikinci yükleme ihtiyacını ortadan kaldır
    await page.locator('[data-command-id="studio.share"]').first().click();
    await expect(page.getByText("Süreli Paylaşım Linki Oluştur")).toBeVisible();
    await page.getByRole("button", { name: "Link Oluştur" }).click();

    await expect(page.getByText("Paylaşım Linki Hazır!")).toBeVisible();
    const shareInput = page.locator("input[readonly]").first();
    const shareUrl = await shareInput.inputValue();
    expect(shareUrl).toContain("/p/");
    sharePath = new URL(shareUrl).pathname;
    await page.keyboard.press("Escape");
  });

  test("genel paylaşım önizlemesinde PDF için tek toolbar (çift üst çubuk yok)", async ({ page }) => {
    expect(sharePath).toBeTruthy();

    // Paylaşım sayfasına git (dev server derlemesine karşı dayanıklı)
    try {
      await page.goto(sharePath, { waitUntil: "domcontentloaded" });
    } catch {
      await page.waitForTimeout(1000);
      await page.goto(sharePath, { waitUntil: "domcontentloaded" });
    }

    const previewBtn = page.getByRole("button", { name: "Önizle" }).first();
    await expect(previewBtn).toBeVisible({ timeout: 15000 });
    await previewBtn.click();

    // Dev server Fast Refresh yeniden yükleme yaparsa modalı yeniden açma koruması
    const pdfToolbar = page.getByTestId("pdf-viewer-toolbar");
    const isReady = await pdfToolbar
      .waitFor({ state: "visible", timeout: 8000 })
      .then(() => true)
      .catch(() => false);

    if (!isReady) {
      await previewBtn.waitFor({ state: "visible", timeout: 10000 });
      await previewBtn.click();
    }

    // Modal içinde yalnızca pdf-viewer-toolbar görünmeli
    await expect(page.getByTestId("pdf-viewer-toolbar")).toBeVisible({ timeout: 15000 });
    // Public modalın kendi header'ı PDF için render edilmemeli
    await expect(page.locator("header").filter({ hasText: "toolbar-parity-studio" })).toHaveCount(0);

    // Toolbar'daki geri butonu modalı kapatmalı
    await page.locator('[data-command-id="studio.back"]').first().click();
    await expect(page.getByTestId("pdf-viewer-toolbar")).toHaveCount(0);
  });
});
