import { expect, test } from "@playwright/test";

test.describe("Belgeler Stüdyosu — Form Tab Gezinmesi ve Üst Araç Çubuğu Düzeni", () => {
  test("Tab tuşu bölüm başlıklarını ve Sıfırla butonlarını atlayıp doğrudan sonraki form alanına geçer", async ({ page }) => {
    await page.goto("/belgeler/santiye-sefi-sozlesmesi", { waitUntil: "domcontentloaded" });

    const formScroll = page.getByTestId("belge-studio-form-scroll");
    await expect(formScroll).toBeVisible();

    // Ada alanını değiştirerek "Sıfırla" butonunun görünmesini sağla
    const adaInput = page.locator("#sozlesme-ada");
    await adaInput.fill("999");

    // Şantiye Şefi Adı Soyadı alanından Tab ile doğrudan İl alanına geçilmeli
    const santiyeSefiAd = page.locator("#sozlesme-santiye_sefi_ad");
    await santiyeSefiAd.focus();
    await expect(santiyeSefiAd).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator("#sozlesme-il")).toBeFocused();

    // Shift+Tab ile tekrar Şantiye Şefi Adı Soyadı alanına dönülmeli
    await page.keyboard.press("Shift+Tab");
    await expect(santiyeSefiAd).toBeFocused();

    // Mahalle alanından Tab ile Sıfırla butonunu atlayıp doğrudan Ada alanına geçilmeli
    await page.locator("#sozlesme-mahalle").focus();
    await page.keyboard.press("Tab");
    await expect(adaInput).toBeFocused();

    // Son alandan (Müteahhit İmza) Tab ile ilk alana (Yapı Müteahhidi Unvanı) döngü yapılmalı
    const firstField = page.locator("#sozlesme-muteahhit_unvan");
    const lastField = page.locator("#sozlesme-muteahhit_imza_unvan");
    await lastField.focus();
    await page.keyboard.press("Tab");
    await expect(firstField).toBeFocused();

    // İlk alandan Shift+Tab ile son alana dönülmeli
    await page.keyboard.press("Shift+Tab");
    await expect(lastField).toBeFocused();
  });

  test("Üst kısımda Yeni Sekme ve PDF'ye Odaklan butonları yok; Sığdır ve Genişliğe Sığdır zoom sağında ayrı grupta", async ({ page }) => {
    await page.goto("/belgeler/santiye-sefi-sozlesmesi", { waitUntil: "domcontentloaded" });

    const toolbar = page.getByTestId("belge-studio-preview-toolbar");
    await expect(toolbar).toBeVisible();

    await expect(page.getByTestId("belge-preview-open-external-btn")).toHaveCount(0);
    await expect(page.getByTestId("belge-pdf-focus-toggle")).toHaveCount(0);
    await expect(page.getByTestId("belge-panel-collapse-btn")).toHaveCount(0);

    const zoomGroup = toolbar.locator(".belge-preview-zoom");
    const fitGroup = toolbar.locator(".belge-preview-fit");
    await expect(zoomGroup).toBeVisible();
    await expect(fitGroup).toBeVisible();

    await expect(fitGroup.getByTestId("belge-preview-fit-page-btn")).toBeVisible();
    await expect(fitGroup.getByTestId("belge-preview-fit-width-btn")).toBeVisible();

    const zoomBox = await zoomGroup.boundingBox();
    const fitBox = await fitGroup.boundingBox();
    expect(zoomBox).not.toBeNull();
    expect(fitBox).not.toBeNull();
    expect(fitBox!.x).toBeGreaterThanOrEqual(zoomBox!.x + zoomBox!.width);
  });
});
