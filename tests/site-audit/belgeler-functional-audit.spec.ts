import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { PDFDocument } from "pdf-lib";
import { readFile } from "node:fs/promises";
import { DOCUMENT_EDITABLE_FIELDS } from "../../src/lib/document-field-contracts";

const documentIds = Object.keys(DOCUMENT_EDITABLE_FIELDS) as Array<keyof typeof DOCUMENT_EDITABLE_FIELDS>;

const expectedPrefixes: Record<keyof typeof DOCUMENT_EDITABLE_FIELDS, string> = {
  "beton-dokum-tutanagi": "Beton-Tutanagi",
  "insaat-ruhsati-dilekcesi": "Ruhsat-Dilekcesi",
  "santiye-sefi-istifa-dilekcesi": "Istifa-Dilekcesi",
  "santiye-sefi-sozlesmesi": "Hizmet-Sozlesmesi",
  "santiye-sefi-taahhutnamesi": "Taahhutname",
};

async function openStudio(page: Page, id: string) {
  await page.goto(`/belgeler/${id}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  const studio = page.locator('[data-studio-locked="true"]:visible').last();
  const downloadBtn = studio
    .locator('[data-testid="belge-studio-desktop-actions"]:visible, [data-testid="belge-studio-mobile-actions"]:visible')
    .getByRole("button", { name: "PDF İndir", exact: true });
  await expect(downloadBtn).toBeEnabled({ timeout: 8_000 });
  return studio;
}

test.beforeEach(async ({ page }, testInfo) => {
  page.on("dialog", (dialog) => void dialog.accept());
  const mobileAccessibility = testInfo.project.name === "chromium-mobile-390" && testInfo.title.includes("ciddi erişilebilirlik");
  test.skip(testInfo.project.name !== "chromium-desktop-1920" && !mobileAccessibility,
    "İşlev denetimi masaüstünde, erişilebilirlik denetimi masaüstü ve mobilde çalışır.");
});

for (const id of documentIds) {
  test(`[${id}] düzenleme, temizleme ve geri alma PDF içeriğini korumalı`, async ({ page }) => {
    const studio = await openStudio(page, id);
    const form = studio.getByTestId("belge-studio-form-scroll");
    const editors = form.locator("input, textarea, select");
    const first = editors.first();
    const initialValue = await first.inputValue();
    const actions = studio.getByTestId("belge-studio-desktop-actions");
    const downloadButton = actions.getByRole("button", { name: "PDF İndir", exact: true });
    const customValue = "Özel ÇĞİÖŞÜ çğıöşü Denetimi";
    await first.fill(customValue);
    await expect(downloadButton).toBeDisabled();
    await expect(downloadButton).toBeEnabled({ timeout: 8_000 });
    const downloadPromise = page.waitForEvent("download", { timeout: 8_000 });
    await downloadButton.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(new RegExp(`^${expectedPrefixes[id]}.*\\.pdf$`));
    const path = await download.path();
    expect(path).not.toBeNull();
    const pdf = await PDFDocument.load(await readFile(path!));
    expect(pdf.getForm().getTextField(DOCUMENT_EDITABLE_FIELDS[id][0]).getText()).toBe(customValue);

    await actions.getByRole("button", { name: "Temizle", exact: true }).click();
    for (const editor of await editors.all()) await expect(editor).toHaveValue("");
    await actions.getByRole("button", { name: "Geri al", exact: true }).click();
    await expect(first).toHaveValue(customValue);

    await actions.getByRole("button", { name: "Temizle", exact: true }).click();
    await expect(actions.getByRole("button", { name: "Geri al", exact: true })).toBeEnabled();
    await form.getByRole("button", { name: /alanını varsayılana sıfırla/ }).first().click();
    await expect(first).toHaveValue(initialValue);
    await expect(actions.getByRole("button", { name: "Geri al", exact: true })).toBeDisabled();
  });
}

for (const linked of [
  { id: "santiye-sefi-sozlesmesi", name: "sozlesme-muteahhit_unvan", signature: "sozlesme-muteahhit_imza_unvan" },
  { id: "santiye-sefi-sozlesmesi", name: "sozlesme-santiye_sefi_ad", signature: "sozlesme-santiye_sefi_imza_adi" },
  { id: "santiye-sefi-taahhutnamesi", name: "taahhutname-unvan", signature: "taahhutname-unvan_imza" },
]) {
  test(`[${linked.name}] alan sıfırlama bağlı imzayı günceller, özel imzayı korur`, async ({ page }) => {
    const studio = await openStudio(page, linked.id);
    const name = studio.locator(`#${linked.name}`);
    const signature = studio.locator(`#${linked.signature}`);
    const initial = await name.inputValue();
    await name.fill("ÖZEL DENETİM İNŞAAT");
    await expect(signature).toHaveValue("ÖZEL DENETİM İNŞAAT");
    await studio.getByRole("button", { name: /alanını varsayılana sıfırla/ }).first().click();
    await expect(signature).toHaveValue(initial);
    await signature.fill("ELLE YAZILAN YETKİLİ");
    await name.fill("DİĞER ŞİRKET");
    await studio.getByRole("button", { name: /alanını varsayılana sıfırla/ }).first().click();
    await expect(signature).toHaveValue("ELLE YAZILAN YETKİLİ");
  });
}

test("Ruhsat örnek verisi eski geri alma kaydını geçersiz kılmalı", async ({ page }) => {
  const studio = await openStudio(page, "insaat-ruhsati-dilekcesi");
  const actions = studio.getByTestId("belge-studio-desktop-actions");
  await actions.getByRole("button", { name: "Temizle", exact: true }).click();
  await studio.getByRole("button", { name: "Örnek Veri", exact: true }).click();
  await expect(actions.getByRole("button", { name: "Geri al", exact: true })).toBeDisabled();
});

test("Sözleşme YİBF uyarısı kullanıcı girdisini silmeden PDF'e aktarmalı", async ({ page }) => {
  const studio = await openStudio(page, "santiye-sefi-sozlesmesi");
  const input = studio.locator("#sozlesme-yibf");
  const value = "AB-123/45";
  await input.fill(value);
  await expect(input).toHaveValue(value);
  await expect(studio.locator("#sozlesme-yibf-help")).toHaveText("(7 Hane olmalı)");
  const downloadButton = studio.getByTestId("belge-studio-desktop-actions")
    .getByRole("button", { name: "PDF İndir", exact: true });
  await expect(downloadButton).toBeEnabled({ timeout: 8_000 });
  const downloadPromise = page.waitForEvent("download", { timeout: 8_000 });
  await downloadButton.click();
  const path = await (await downloadPromise).path();
  expect(path).not.toBeNull();
  const pdf = await PDFDocument.load(await readFile(path!));
  expect(pdf.getForm().getTextField("yibf").getText()).toBe(value);
  for (const validValue of ["1234567", "-"]) {
    await input.fill(validValue);
    await expect(input).toHaveValue(validValue);
    await expect(studio.locator("#sozlesme-yibf-help")).toHaveText("(7 Hane veya -)");
  }
});

test("Belge kataloğunun tek ana içerik alanı ve sıralı başlıkları olmalı", async ({ page }) => {
  await page.goto("/belgeler", { waitUntil: "domcontentloaded", timeout: 30_000 });
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(5);
});

test("Belge kataloğunda Türkçe arama ve temizleme doğru filtrelenmeli", async ({ page }) => {
  await page.goto("/belgeler", { waitUntil: "domcontentloaded", timeout: 30_000 });
  const search = page.getByRole("searchbox", { name: "Belge veya şablon ara" });

  const queries = [
    { query: "  şantiye  ", expectedMin: 3 },
    { query: "SANTIYE", expectedMin: 3 },
    { query: "ŞANTİYE", expectedMin: 3 },
    { query: "insaat", expectedMin: 1 },
    { query: "ruhsat", expectedMin: 1 },
    { query: "beton", expectedMin: 1 },
  ];

  for (const { query, expectedMin } of queries) {
    await search.fill(query);
    const count = await page.getByRole("heading", { level: 2 }).count();
    expect(count, `Arama sorgusu: "${query}"`).toBeGreaterThanOrEqual(expectedMin);
  }

  const inputClearBtn = page.getByLabel("Aramayı temizle");
  await inputClearBtn.click();
  await expect(search).toHaveValue("");
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(5);

  await search.fill("kesinlikle-eslesmeyen-belge-xyz");
  await expect(page.getByText("Eşleşen belge bulunamadı")).toBeVisible();
  const emptyStateClear = page.locator(".rounded-\\[24px\\]").getByRole("button", { name: "Aramayı temizle" });
  await emptyStateClear.click();
  await expect(search).toHaveValue("");
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(5);
  await expect(search).toBeFocused();
});

test("Katalog kart başlıkları ve CTA butonları doğru rotalara yönlendirmeli", async ({ page }) => {
  await page.goto("/belgeler", { waitUntil: "domcontentloaded", timeout: 30_000 });
  const expectedRoutes = [
    { title: "Beton Döküm Tutanağı", path: "/belgeler/beton-dokum-tutanagi" },
    { title: "İnşaat Ruhsatı Dilekçesi", path: "/belgeler/insaat-ruhsati-dilekcesi" },
    { title: "Şantiye Şefi İstifa Dilekçesi", path: "/belgeler/santiye-sefi-istifa-dilekcesi" },
    { title: "Şantiye Şefi Hizmet Sözleşmesi", path: "/belgeler/santiye-sefi-sozlesmesi" },
    { title: "Şantiye Şefi Taahhütnamesi", path: "/belgeler/santiye-sefi-taahhutnamesi" },
  ];

  for (const { title, path } of expectedRoutes) {
    const cardTitleLink = page.getByRole("heading", { level: 2 }).getByRole("link", { name: title });
    await expect(cardTitleLink).toHaveAttribute("href", path);
  }
});

test("Geçersiz şablon kimlikleri 500 yerine 404 dönmeli", async ({ request }) => {
  for (const id of ["toString", "constructor", "__proto__", "olmayan-belge"]) {
    const response = await request.get(`/api/document-template/${id}`, { timeout: 8_000 });
    expect(response.status(), id).toBe(404);
  }
});

test("Belgeler ve beş stüdyoda açık ve koyu temada ciddi erişilebilirlik ihlali olmamalı", async ({ page }) => {
  test.setTimeout(120_000);
  const scan = async (context: string) => {
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    const bad = results.violations.filter((item) => ["critical", "serious"].includes(item.impact ?? ""));
    if (bad.length > 0) {
      console.log(`[AXE VIOLATION in ${context}]:`, JSON.stringify(bad, null, 2));
    }
    expect(bad.map((item) => ({ id: item.id, targets: item.nodes.map((node) => node.target) })), context).toEqual([]);
  };
  for (const path of ["/belgeler", ...documentIds.map((id) => `/belgeler/${id}`)]) {
    let studio;
    if (path === "/belgeler") {
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 30_000 });
      studio = page.locator("main");
    } else {
      const id = path.replace("/belgeler/", "");
      studio = await openStudio(page, id);
    }
    await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; animation: none !important; }" });
    await page.waitForTimeout(200);
    const initialDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    // Mevcut tema taraması
    await scan(`${path} [${initialDark ? "Koyu Tema" : "Açık Tema"}]`);

    // Karşıt tema taraması
    if (path !== "/belgeler") {
      const themeToggle = studio.getByTestId("belge-theme-toggle");
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(!initialDark);
        await page.waitForTimeout(200);
        await scan(`${path} [${!initialDark ? "Koyu Tema" : "Açık Tema"}]`);
        await themeToggle.click();
        await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(initialDark);
        await page.waitForTimeout(200);
      }
    } else {
      await page.evaluate((targetDark) => {
        if (targetDark) document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
      }, !initialDark);
      await page.waitForTimeout(200);
      await scan(`${path} [${!initialDark ? "Koyu Tema" : "Açık Tema"}]`);
      await page.evaluate((targetDark) => {
        if (targetDark) document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
      }, initialDark);
      await page.waitForTimeout(200);
    }

    if (path !== "/belgeler") {
      if (await studio.getByTestId("belge-studio-mobile-actions").isVisible()) {
        const showPreview = studio.getByRole("button", { name: /PDF Önizle/i });
        if (await showPreview.isVisible()) await showPreview.click();
        await expect(studio.getByTestId("belge-studio-mobile-zoom-pill")).toBeVisible({ timeout: 8_000 });
        await scan(`${path} / PDF [Açık Tema]`);
      }
    }
  }
});

test("Şablon API'si kesilince yedek PDF ile önizleme hazır olmalı", async ({ page }) => {
  await page.route("**/api/document-template/**", (route) => route.fulfill({ status: 503, body: "Geçici kesinti" }));
  const studio = await openStudio(page, "beton-dokum-tutanagi");
  await expect(studio.getByRole("status").first()).toHaveText("PDF önizlemesi hazır.", { timeout: 8_000 });
});

test("Şablon kesintisi giderilince yeniden deneme veriyi kaybetmeden çalışmalı", async ({ page }) => {
  await page.route(/\/api\/document-template\/|\/belgeler\/.*\.pdf/, (route) => route.fulfill({ status: 503, body: "Geçici kesinti" }));
  await page.goto("/belgeler/beton-dokum-tutanagi", { waitUntil: "domcontentloaded", timeout: 30_000 });
  const studio = page.locator('[data-studio-locked="true"]:visible').last();
  await expect(studio.getByRole("alert")).toBeVisible({ timeout: 8_000 });
  const editor = studio.getByTestId("belge-studio-form-scroll").locator("input").first();
  const original = await editor.inputValue();
  await page.unrouteAll();
  await studio.getByRole("button", { name: "Tekrar dene", exact: true }).click();
  await expect(studio.getByRole("status").first()).toHaveText("PDF önizlemesi hazır.", { timeout: 8_000 });
  await expect(editor).toHaveValue(original);
});

test("1023px ve 1024px ekran genişliğinde mobil ve masaüstü yerleşim geçişi doğru olmalı", async ({ page }) => {
  await page.goto("/belgeler/santiye-sefi-sozlesmesi", { waitUntil: "domcontentloaded", timeout: 30_000 });
  const studio = page.locator('[data-studio-locked="true"]:visible').last();

  // 1023px: Mobil görünüm, tek alt geçiş kontrolü görünür.
  await page.setViewportSize({ width: 1023, height: 768 });
  await expect(studio.getByTestId("belge-studio-mobile-actions")).toBeVisible();
  await expect(studio.getByTestId("belge-studio-desktop-actions")).toBeHidden();
  await expect(studio.getByRole("tablist")).toHaveCount(0);
  await expect(studio.getByRole("button", { name: "Formu Düzenle", exact: true })).toBeVisible();

  // 1024px: Masaüstü görünüm (çift panel split-view, masaüstü eylemleri görünür, mobil eylemler ve sekmeler gizli)
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(studio.getByTestId("belge-studio-desktop-actions")).toBeVisible();
  await expect(studio.getByTestId("belge-studio-mobile-actions")).toBeHidden();
  await expect(studio.getByRole("tablist")).toHaveCount(0);
  await expect(studio.getByTestId("belge-studio-form-scroll")).toBeVisible();
  await expect(studio.getByTestId("belge-studio-preview-toolbar")).toBeVisible();
});

test("Baştaki sıfırlar korunmalı ve yumuşak uzunluk uyarısı PDF indirmeyi engellememeli", async ({ page }) => {
  const studio = await openStudio(page, "beton-dokum-tutanagi");

  const yibfInput = studio.locator("#beton-dokum-yibf");
  const leadingZeroValue = "0123456";
  await yibfInput.fill(leadingZeroValue);
  await expect(yibfInput).toHaveValue(leadingZeroValue);

  const longTextInput = studio.locator("#beton-dokum-tutanak_alt_baslik");
  const veryLongText = "Bu metin şablon alanının önerilen karakter sınırını kasıtlı olarak aşan ve yumuşak uyarı bloğunu tetikleyen çok uzun bir test açıklamasıdır.";
  await longTextInput.fill(veryLongText);
  await expect(studio.getByTestId("belge-pdf-layout-warnings").locator('[data-field-key="tutanak_alt_baslik"]')).toContainText("punto", { timeout: 8_000 });

  const downloadButton = studio.getByTestId("belge-studio-desktop-actions")
    .getByRole("button", { name: "PDF İndir", exact: true });
  await expect(downloadButton).toBeEnabled({ timeout: 8_000 });
  const downloadPromise = page.waitForEvent("download", { timeout: 8_000 });
  await downloadButton.click();
  const path = await (await downloadPromise).path();
  expect(path).not.toBeNull();
  const pdf = await PDFDocument.load(await readFile(path!));
  expect(pdf.getForm().getTextField("tutanak_alt_baslik").getText()).toBe(veryLongText);
  expect(pdf.getForm().getTextField("yibf").getText()).toBe(leadingZeroValue);
});

test("Hızlı A->B->C değişikliklerinde son girdi (C) kazanmalı ve eski revision dışa aktarılmamalı", async ({ page }) => {
  const studio = await openStudio(page, "insaat-ruhsati-dilekcesi");
  const form = studio.getByTestId("belge-studio-form-scroll");
  const input = form.locator("#insaat-ruhsati-ad_soyad");
  const downloadButton = studio.getByTestId("belge-studio-desktop-actions")
    .getByRole("button", { name: "PDF İndir", exact: true });

  await input.fill("Değer A");
  await input.fill("Değer B");
  await input.fill("Son Değer C");

  await expect(downloadButton).toBeEnabled({ timeout: 8_000 });

  const downloadPromise = page.waitForEvent("download", { timeout: 8_000 });
  await downloadButton.click();
  const path = await (await downloadPromise).path();
  expect(path).not.toBeNull();
  const pdf = await PDFDocument.load(await readFile(path!));
  expect(pdf.getForm().getTextField("ad_soyad").getText()).toBe("Son Değer C");
});

test("Mobil stüdyoda 20 kez ardışık sekme geçişi sonrasında form ve canvas erişilebilir kalmalı", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/belgeler/santiye-sefi-sozlesmesi", { waitUntil: "domcontentloaded", timeout: 30_000 });
  const studio = page.locator('[data-studio-locked="true"]:visible').last();
  const actions = studio.getByTestId("belge-studio-mobile-actions");
  const canvas = studio.locator("canvas").first();
  await expect(studio.getByRole("tablist")).toHaveCount(0);
  await expect(actions.getByRole("button", { name: "Formu Düzenle", exact: true })).toBeVisible();

  for (let i = 0; i < 20; i++) {
    await actions.getByRole("button", { name: "Formu Düzenle", exact: true }).click();
    await actions.getByRole("button", { name: /PDF Önizle/i }).click();
  }

  await expect(studio.getByTestId("belge-studio-mobile-zoom-pill")).toBeVisible();
  await expect(studio.getByRole("status").first()).toHaveText("PDF önizlemesi hazır.");
  await expect(canvas).toBeVisible();

  await actions.getByRole("button", { name: "Formu Düzenle", exact: true }).click();
  const firstInput = studio.getByTestId("belge-studio-form-scroll").locator("input").first();
  await expect(firstInput).toBeVisible();
  await firstInput.fill("20 Sekme Geçişi Sonrası Form Girişi");
  await expect(firstInput).toHaveValue("20 Sekme Geçişi Sonrası Form Girişi");
  await expect(canvas).toBeHidden();
});

test("Boş form indirme, yeni sekmede açma, yazdırma ve Blob URL yaşam döngüsü doğrulanmalı", async ({ page }) => {
  await page.addInitScript(() => {
    (window as any)._openedWindows = [];
    (window as any)._revokedUrls = [];
    const origOpen = window.open;
    window.open = function(url?: string | URL, target?: string, features?: string) {
      (window as any)._openedWindows.push({ url: String(url || ""), target });
      const fakeWin = {
        location: { href: String(url || "") },
        closed: false,
        focus: () => {},
        print: () => { (window as any)._mockPrintCalled = true; },
        addEventListener: (event: string, cb: Function) => {
          if (event === "load") {
            setTimeout(cb, 10);
          }
        },
        removeEventListener: () => {},
      };
      return fakeWin as any;
    };
    const origRevoke = URL.revokeObjectURL;
    URL.revokeObjectURL = function(url: string) {
      (window as any)._revokedUrls.push(url);
      return origRevoke.call(URL, url);
    };
  });

  const studio = await openStudio(page, "santiye-sefi-sozlesmesi");

  // 1. Boş form indir testi (Masaüstü aksiyon barı)
  const blankFormLink = studio.getByTestId("belge-studio-desktop-actions").getByRole("button", { name: "Boş form indir" });
  await expect(blankFormLink).toBeEnabled();

  const blankDownloadPromise = page.waitForEvent("download");
  await blankFormLink.click();
  const blankDownload = await blankDownloadPromise;
  expect(blankDownload.suggestedFilename()).toBe("SANTIYE_SEFI_SOZLESMESI_BOS.pdf");
  const blankPath = await blankDownload.path();
  expect(blankPath).not.toBeNull();
  const blankPdf = await PDFDocument.load(await readFile(blankPath!));
  expect(blankPdf.getPageCount()).toBe(2);
  for (const key of DOCUMENT_EDITABLE_FIELDS["santiye-sefi-sozlesmesi"]) {
    expect(blankPdf.getForm().getTextField(key).getText() ?? "").toBe("");
  }

  // 2. Yeni sekmede aç linki testi (Toolbar)
  const newTabLink = studio.getByTestId("belge-studio-preview-toolbar").getByRole("link", { name: "PDF'yi yeni sekmede aç" });
  await expect(newTabLink).toHaveAttribute("target", "_blank");
  await expect(newTabLink).toHaveAttribute("rel", "noopener noreferrer");
  const initialBlobUrl = await newTabLink.getAttribute("href");
  expect(initialBlobUrl).toMatch(/^blob:http/);

  // 3. Yazdır butonu testi
  const printButton = studio.getByTestId("belge-studio-desktop-actions").getByRole("button", { name: "Yazdır" });
  await printButton.click();
  const openedWindows = await page.evaluate(() => (window as any)._openedWindows);
  expect(openedWindows.length).toBeGreaterThanOrEqual(1);

  // 4. Form düzenlendiğinde Blob URL yenilenmeli ve eski Blob URL revoke edilmeli
  const firstInput = studio.getByTestId("belge-studio-form-scroll").locator("input").first();
  await firstInput.fill("Yeni Sözleşme Değeri 2026");

  // Debounce ve yeni snapshot tamamlanmasını bekle
  await expect(studio.getByTestId("belge-studio-desktop-actions").getByRole("button", { name: "PDF İndir", exact: true })).toBeEnabled({ timeout: 8_000 });
  const updatedBlobUrl = await newTabLink.getAttribute("href");
  expect(updatedBlobUrl).toMatch(/^blob:http/);
  expect(updatedBlobUrl).not.toBe(initialBlobUrl);

  const revokedUrls = await page.evaluate(() => (window as any)._revokedUrls);
  expect(revokedUrls).toContain(initialBlobUrl);
});

test("Klavye odak sırası, screen reader etiketleri ve tema switch Space erişimi doğrulanmalı", async ({ page }) => {
  const studio = await openStudio(page, "santiye-sefi-sozlesmesi");

  // 1. Toolbar öğelerinde ARIA rolleri ve etiketleri
  const toolbar = studio.getByTestId("belge-studio-preview-toolbar");
  await expect(toolbar).toHaveAttribute("role", "toolbar");
  await expect(toolbar).toHaveAttribute("aria-label", "PDF önizleme araçları");

  const themeToggle = studio.getByTestId("belge-theme-toggle");
  await expect(themeToggle).toHaveAttribute("role", "switch");
  const initialChecked = await themeToggle.getAttribute("aria-checked");
  expect(initialChecked).not.toBeNull();

  // 2. Klavye ile tema toggle (Focus + Space)
  await themeToggle.focus();
  await expect(themeToggle).toBeFocused();
  await page.keyboard.press("Space");
  await expect(themeToggle).toHaveAttribute("aria-checked", initialChecked === "true" ? "false" : "true");
  await page.keyboard.press("Space");
  await expect(themeToggle).toHaveAttribute("aria-checked", initialChecked!);

  // 3. Form inputlarında sırayla Tab gezinmesi
  const firstInput = studio.getByTestId("belge-studio-form-scroll").locator("input").first();
  await firstInput.focus();
  await expect(firstInput).toBeFocused();
  await page.keyboard.press("Tab");
  const secondActive = await page.evaluate(() => document.activeElement?.tagName);
  expect(["INPUT", "TEXTAREA", "BUTTON", "SELECT"]).toContain(secondActive);

  // 4. Status bildirim alanı (aria-live polite)
  const statusEl = studio.getByRole("status").first();
  await expect(statusEl).toBeVisible();
});

test("Aşama 11 — Performans, bellek raster bütçesi ve sıfır PII ağ sızıntısı doğrulanmalı", async ({ page }) => {
  // Capture all network requests
  const capturedRequests: Array<{ url: string; method: string; postData: string | null }> = [];
  page.on("request", (req) => {
    capturedRequests.push({
      url: req.url(),
      method: req.method(),
      postData: req.postData(),
    });
  });

  const studio = await openStudio(page, "santiye-sefi-taahhutnamesi");

  // 1. Enter sensitive PII into multiple fields
  const piiValues = {
    tc: "12345678901",
    name: "OZEL_GIZLI_MUHENDIS_HASAN",
    address: "GIZLI_MAHALLE_NO_999_ANKARA",
    phone: "05329998877",
  };

  const tcInput = studio.locator("#taahhutname-tc_kimlik_no");
  await tcInput.fill(piiValues.tc);

  const nameInput = studio.locator("#taahhutname-santiye_sefi_ad_soyad");
  await nameInput.fill(piiValues.name);

  const addressInput = studio.locator("#taahhutname-adres");
  await addressInput.fill(piiValues.address);

  const phoneInput = studio.locator("#taahhutname-telefon");
  await phoneInput.fill(piiValues.phone);

  // 2. Wait for PDF generation debounce and ready status
  const downloadBtn = studio.getByTestId("belge-studio-desktop-actions").getByRole("button", { name: "PDF İndir", exact: true });
  await expect(downloadBtn).toBeEnabled({ timeout: 8_000 });

  // 3. Trigger download and verify downloaded content actually contains the PII
  const downloadPromise = page.waitForEvent("download");
  await downloadBtn.click();
  const download = await downloadPromise;
  const downloadedPath = await download.path();
  expect(downloadedPath).not.toBeNull();
  const downloadedBytes = await readFile(downloadedPath!);
  const downloadedPdf = await PDFDocument.load(downloadedBytes);
  const form = downloadedPdf.getForm();
  expect(form.getTextField("tc_kimlik_no").getText()).toBe(piiValues.tc);
  expect(form.getTextField("santiye_sefi_ad_soyad").getText()).toBe(piiValues.name);
  expect(form.getTextField("adres").getText()).toBe(piiValues.address);
  expect(form.getTextField("telefon").getText()).toBe(piiValues.phone);

  // 4. Zero PII Network Leakage check: NONE of the network requests must contain the PII strings!
  for (const req of capturedRequests) {
    const fullText = `${req.url} ${req.postData || ""}`.toLowerCase();
    for (const val of Object.values(piiValues)) {
      expect(fullText.includes(val.toLowerCase())).toBe(false);
    }
  }

  // 5. Canvas raster budget check: max pixels <= 8_000_000 and max side <= 4096
  const canvas = studio.locator("canvas").first();
  await expect(canvas).toBeVisible();
  const canvasDimensions = await canvas.evaluate((el: HTMLCanvasElement) => ({
    width: el.width,
    height: el.height,
    totalPixels: el.width * el.height,
  }));

  expect(canvasDimensions.width).toBeLessThanOrEqual(4096);
  expect(canvasDimensions.height).toBeLessThanOrEqual(4096);
  expect(canvasDimensions.totalPixels).toBeLessThanOrEqual(8_000_000);
  expect(canvasDimensions.totalPixels).toBeGreaterThan(0);
});


