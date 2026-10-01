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
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    "<< /Length 44 >>\nstream\nBT /F1 12 Tf 50 150 Td (muhendislik test) Tj ET\nendstream",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
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
      formData.append("pathname", `dok_storage/faz-i-${crypto.randomUUID()}.pdf`);
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

test.describe.serial("PDF Viewer v2 — FAZ I: Erişilebilirlik ve Mobil Düzen", () => {
  let fileId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page);
    fileId = await uploadPdf(page, "faz-i-accessibility-test.pdf");
    await page.close();
  });

  test("1. Klavye ile tam akış: Ctrl+F aç, Esc kapat ve odak tetikleyiciye döner", async ({ page }) => {
    await login(page);
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const toolbar = page.getByTestId("pdf-viewer-toolbar");
    await expect(toolbar).toBeVisible({ timeout: 15000 });

    // Toolbar role='toolbar' olmalı
    await expect(toolbar).toHaveAttribute("role", "toolbar");

    // Ctrl+F ile arama açma
    await page.keyboard.press("Control+f");

    const searchBar = page.getByTestId("pdf-search-bar");
    await expect(searchBar).toBeVisible();
    await expect(searchBar).toHaveAttribute("role", "search");

    const searchInput = page.getByPlaceholder("Dokümanda ara...");
    await expect(searchInput).toBeFocused();

    // Arama yazısı yaz
    await searchInput.fill("test");

    // Esc ile aramayı kapat
    await page.keyboard.press("Escape");
    await expect(searchBar).toBeHidden();

    // Kapanınca odak tetikleyici arama butonuna dönmeli
    const searchButton = page.locator('button[data-command-id="pdf.search.open"]').first();
    await expect(searchButton).toBeFocused();
  });

  test("2. Ekran okuyucu bildirimleri (aria-live='polite', aria-atomic='true')", async ({ page }) => {
    await login(page);
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const toolbar = page.getByTestId("pdf-viewer-toolbar");
    await expect(toolbar).toBeVisible({ timeout: 15000 });

    // Arama butonuna basarak aç
    const searchButton = page.locator('button[data-command-id="pdf.search.open"]').first();
    await searchButton.click();

    const searchBar = page.getByTestId("pdf-search-bar");
    await expect(searchBar).toBeVisible();

    // aria-live polite alanı bağlı olmalı ve atomic='true' taşımalı
    const liveRegion = searchBar.locator('[aria-live="polite"]');
    await expect(liveRegion).toBeAttached();
    await expect(liveRegion).toHaveAttribute("aria-atomic", "true");

    const searchInput = page.getByPlaceholder("Dokümanda ara...");
    await searchInput.fill("test");

    // Arama yapıldıktan sonra sayaç/bilgi görünür olmalı
    await expect(liveRegion).toBeVisible();

    // sr-only metninin varlığı ve duyurulması
    const srOnly = liveRegion.locator(".sr-only");
    await expect(srOnly).toBeAttached();

    // Aramayı kapat
    await page.keyboard.press("Escape");
  });

  test("3. Kısayollar modalı odak tuzağı (focus trap) ve Esc ile kapanış", async ({ page }) => {
    await login(page);
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const toolbar = page.getByTestId("pdf-viewer-toolbar");
    await expect(toolbar).toBeVisible({ timeout: 15000 });

    // '?' tuşuna basarak veya menüden kısayollar modalını aç
    const modal = page.getByTestId("pdf-shortcuts-modal");
    await page.keyboard.press("Shift+/");
    const isOpened = await modal.waitFor({ state: "visible", timeout: 2000 }).then(() => true).catch(() => false);
    if (!isOpened) {
      await page.getByTestId("pdf-viewer-more-menu-trigger").click();
      await page.getByTestId("pdf-shortcuts-btn").click();
      await expect(modal).toBeVisible();
    }

    await expect(modal).toHaveAttribute("role", "dialog");
    await expect(modal).toHaveAttribute("aria-modal", "true");

    // Tab tuşu ile odakta gezin ve modal dışına çıkmadığını doğrula
    await page.keyboard.press("Tab");
    const activeIsInside = await page.evaluate(() => {
      const modalEl = document.querySelector('[data-testid="pdf-shortcuts-modal"]');
      return modalEl ? modalEl.contains(document.activeElement) : false;
    });
    expect(activeIsInside).toBe(true);

    // Esc tuşu ile kapat
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
  });

  test("4. 360 px mobil görünüm: taşma yok ve dokunma hedefleri ≥ 44 px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await login(page);
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const toolbar = page.getByTestId("pdf-viewer-toolbar");
    await expect(toolbar).toBeVisible({ timeout: 15000 });

    // Taşma kontrolü: scrollWidth <= clientWidth (0 piksel taşma)
    const overflowInfo = await toolbar.evaluate((el) => {
      return {
        clientWidth: el.clientWidth,
        scrollWidth: el.scrollWidth,
        overflow: el.scrollWidth > el.clientWidth,
      };
    });
    expect(overflowInfo.overflow).toBe(false);

    // Öncelikli mobil butonların görünür olduğunu doğrula
    const prevBtn = page.locator('button[data-command-id="pdf.page.previous"]').first();
    const nextBtn = page.locator('button[data-command-id="pdf.page.next"]').first();
    const searchBtn = page.locator('button[data-command-id="pdf.search.open"]').first();
    const zoomInBtn = page.locator('button[data-command-id="pdf.zoom.in"]').first();
    const moreBtn = page.getByTestId("pdf-viewer-more-menu-trigger").first();

    await expect(prevBtn).toBeVisible();
    await expect(nextBtn).toBeVisible();
    await expect(searchBtn).toBeVisible();
    await expect(zoomInBtn).toBeVisible();
    await expect(moreBtn).toBeVisible();

    // Dokunma hedeflerinin boyutu: WCAG / Apple HIG gereğince en az 43.5x43.5 px (~44px)
    const buttons = [prevBtn, nextBtn, searchBtn, zoomInBtn, moreBtn];
    for (const btn of buttons) {
      const box = await btn.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(43.5);
        expect(box.height).toBeGreaterThanOrEqual(43.5);
      }
    }

    // İkincil işlemlerin '⋮' menüsünden erişilebilir olduğunu doğrula
    await moreBtn.click();
    await expect(page.locator('[role="menuitem"][data-command-id="pdf.zoom.out"]')).toBeVisible();
    await expect(page.locator('[role="menuitem"][data-command-id="pdf.zoom.100"]')).toBeVisible();
    await expect(page.locator('[data-command-id="pdf.settings.nightMode"]')).toBeVisible();
    await page.keyboard.press("Escape");
  });
});
