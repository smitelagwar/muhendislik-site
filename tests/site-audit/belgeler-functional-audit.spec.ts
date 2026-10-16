import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { PDFDocument } from "pdf-lib";
import { readFile } from "node:fs/promises";
import { DOCUMENT_EDITABLE_FIELDS } from "../../src/lib/document-field-contracts";

const documentIds = Object.keys(DOCUMENT_EDITABLE_FIELDS) as Array<keyof typeof DOCUMENT_EDITABLE_FIELDS>;

async function openStudio(page: Page, id: string) {
  await page.goto(`/belgeler/${id}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  const studio = page.locator('[data-studio-locked="true"]:visible').last();
  await expect(studio.getByTestId("belge-studio-desktop-actions").getByRole("button", { name: "PDF İndir", exact: true })).toBeEnabled({ timeout: 8_000 });
  return studio;
}

test.beforeEach(async ({}, testInfo) => {
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

test("Belge kataloğunun tek ana içerik alanı ve sıralı başlıkları olmalı", async ({ page }) => {
  await page.goto("/belgeler", { waitUntil: "domcontentloaded", timeout: 30_000 });
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(5);
});

test("Geçersiz şablon kimlikleri 500 yerine 404 dönmeli", async ({ request }) => {
  for (const id of ["toString", "constructor", "__proto__", "olmayan-belge"]) {
    const response = await request.get(`/api/document-template/${id}`, { timeout: 8_000 });
    expect(response.status(), id).toBe(404);
  }
});

test("Belgeler ve beş stüdyoda ciddi erişilebilirlik ihlali olmamalı", async ({ page }) => {
  test.setTimeout(90_000);
  const scan = async (context: string) => {
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations.filter((item) => ["critical", "serious"].includes(item.impact ?? ""))
      .map((item) => ({ id: item.id, targets: item.nodes.map((node) => node.target) })), context).toEqual([]);
  };
  for (const path of ["/belgeler", ...documentIds.map((id) => `/belgeler/${id}`)]) {
    await page.goto(path, { waitUntil: "domcontentloaded", timeout: 30_000 });
    const studio = page.locator('[data-studio-locked="true"]:visible').last();
    if (path !== "/belgeler") {
      await expect(studio.getByTestId("belge-studio-form-scroll")).toBeVisible({ timeout: 8_000 });
    }
    await scan(path);
    if (path !== "/belgeler") {
      const previewTab = studio.getByRole("tab", { name: /Canlı PDF Önizle/i });
      if (await previewTab.isVisible()) {
        await previewTab.click();
        await expect(studio.getByTestId("belge-studio-preview-toolbar")).toBeVisible({ timeout: 8_000 });
        await scan(`${path} / PDF`);
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
