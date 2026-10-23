import { expect, test, type Page } from "@playwright/test";
import { DOCUMENT_EDITABLE_FIELDS } from "../../src/lib/document-field-contracts";

const documentIds = Object.keys(DOCUMENT_EDITABLE_FIELDS) as Array<keyof typeof DOCUMENT_EDITABLE_FIELDS>;

async function openStudio(page: Page, id: string) {
  await page.goto(`/belgeler/${id}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  const studio = page.locator('[data-studio-locked="true"]:visible').last();
  const shareBtn = studio
    .locator('[data-testid="belge-studio-desktop-actions"]:visible, [data-testid="belge-studio-mobile-actions"]:visible')
    .getByRole("button", { name: "Paylaş", exact: true });
  await expect(shareBtn).toBeEnabled({ timeout: 10_000 });
  return { studio, shareBtn };
}

test.describe("Belgeler — Paylaşım E2E Entegrasyon ve Güvenlik Denetimi", () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-desktop-1366" && testInfo.project.name !== "chromium-desktop-1920",
      "Paylaşım uçtan uca kabul testi masaüstü projelerinde çalıştırılır."
    );
  });

  documentIds.forEach((id, index) => {
    test(`[${id}] Paylaş diyaloğu açılmalı, bağlantı oluşturulmalı, WhatsApp/QR bulunmamalı ve iptal edilebilmelidir`, async ({
      page,
    }) => {
      await page.setExtraHTTPHeaders({
        "x-forwarded-for": `192.168.10.${index + 1}`,
      });
      const { shareBtn } = await openStudio(page, id);

      // 1. Paylaş modalını aç
      await shareBtn.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 5_000 });

      // 2. KESİN KAPSAM KORUMASI: WhatsApp, wa.me, QR, navigator.share veya mailto kesinlikle OLMAMALIDIR
      const htmlContent = await dialog.innerHTML();
      expect(htmlContent.toLowerCase()).not.toContain("whatsapp");
      expect(htmlContent.toLowerCase()).not.toContain("wa.me");
      expect(htmlContent.toLowerCase()).not.toContain("qr");
      expect(htmlContent.toLowerCase()).not.toContain("mailto:");

      // 3. Bağlantı oluştur butonuna tıkla
      const createLinkBtn = dialog.getByRole("button", { name: /Bağlantı oluştur/i });
      await expect(createLinkBtn).toBeEnabled();
      await createLinkBtn.click();

      // 4. Bağlantı kartının oluşmasını ve Kopyala butonunu bekle
      const copyBtn = dialog.getByRole("button", { name: /Kopyala/i });
      await expect(copyBtn).toBeVisible({ timeout: 15_000 });

      // Link URL'sini al
      const linkInput = dialog.locator("input[readonly]");
      await expect(linkInput).toBeVisible();
      const shareUrl = await linkInput.inputValue();
      expect(shareUrl).toMatch(/\/b\/[a-zA-Z0-9_-]+/);

      // 5. Oluşturulan bağlantıyı yeni sekme/sayfada aç
      const token = shareUrl.split("/b/")[1];
      const viewerPage = await page.context().newPage();
      await viewerPage.goto(`/b/${token}`, { waitUntil: "domcontentloaded", timeout: 20_000 });

      // 6. KABUK İZOLASYONU: Navbar ve ana site başlığı DOM'da dahi bulunmamalıdır
      const siteHeaderCount = await viewerPage.locator("header[data-site-header], nav").count();
      expect(siteHeaderCount).toBe(0);

      // 7. Salt-okunur PDF Canvas görünür olmalı
      const pdfCanvas = viewerPage.locator("canvas").first();
      await expect(pdfCanvas).toBeVisible({ timeout: 15_000 });

      // Görüntüleyicide form düzenleme, indirme veya yazdırma düğmesi bulunmamalı
      await expect(viewerPage.getByRole("button", { name: /İndir/i })).toHaveCount(0);
      await expect(viewerPage.getByRole("button", { name: /Yazdır/i })).toHaveCount(0);
      await expect(viewerPage.locator("input:not([type='hidden']), textarea")).toHaveCount(0);

      await viewerPage.close();

      // 8. Ana sayfadaki diyalogtan bağlantıyı iptal et
      const cancelBtn = dialog.getByRole("button", { name: /Bu bağlantıyı iptal et/i });
      await expect(cancelBtn).toBeVisible({ timeout: 8_000 });
      await cancelBtn.click();

      // Onay butonuna tıkla
      const confirmBtn = dialog.getByRole("button", { name: /Evet, Bağlantıyı İptal Et/i });
      await expect(confirmBtn).toBeVisible({ timeout: 5_000 });
      await confirmBtn.click();

      // Durumun iptal edildiğini doğrula
      await expect(dialog.getByText(/Bağlantı İptal Edildi/i)).toBeVisible({ timeout: 8_000 });

      // 9. İptal edilen linke tekrar gidildiğinde anında HTTP 410 / İptal Edildi ekranı görünmeli
      const revokedPage = await page.context().newPage();
      const response = await revokedPage.goto(`/b/${token}`, { waitUntil: "domcontentloaded" });
      expect([200, 410]).toContain(response?.status() ?? 0);
      await expect(revokedPage.getByText(/Bağlantı İptal Edildi/i)).toBeVisible({
        timeout: 10_000,
      });

      await revokedPage.close();
    });
  });
});
