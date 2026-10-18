import { expect, test, type Page, type Locator } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { DOCUMENT_EDITABLE_FIELDS, DOCUMENT_PDF_ONLY_FIELDS } from "../../src/lib/document-field-contracts";
import { getDocumentPdfProfiles } from "../../src/lib/belgeler-pdf-profiles";

const ids = Object.keys(DOCUMENT_EDITABLE_FIELDS) as Array<keyof typeof DOCUMENT_EDITABLE_FIELDS>;
test.use({ actionTimeout: 8_000 });
async function action(page: Page, studio: Locator, desktop: string, mobile: string) {
  if (await studio.getByTestId("belge-studio-desktop-actions").isVisible()) {
    return studio.getByTestId("belge-studio-desktop-actions").getByRole("button", { name: desktop, exact: true });
  }
  await studio.getByRole("button", { name: "Diğer belge işlemleri", exact: true }).click();
  return page.getByRole("menuitem", { name: mobile, exact: true });
}
async function openStudio(page: Page, id: string) {
  await page.goto(`/belgeler/${id}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  const studio = page.locator('[data-studio-locked="true"]:visible').last();
  const download = studio.getByRole("button", { name: "PDF İndir", exact: true }).filter({ visible: true });
  await expect(download).toBeEnabled({ timeout: 8_000 });
  return { studio, download };
}

for (const id of ids) {
  test(`${id}: boş PDF, mevcut veriyi ve geri alma kaydını değiştirmemeli`, async ({ page }) => {
    const { studio, download } = await openStudio(page, id);
    const first = studio.getByTestId("belge-studio-form-scroll").locator("input, textarea").first();
    const custom = "ÖZEL ÇĞİÖŞÜ";
    await first.fill(custom);
    await expect(download).toBeEnabled({ timeout: 8_000 });
    await (await action(page, studio, "Temizle", "Tüm alanları temizle")).click();
    await expect(first).toHaveValue("");
    const blankButton = await action(page, studio, "Boş form indir", "Boş form indir");
    const blankPromise = page.waitForEvent("download", { timeout: 8_000 });
    await blankButton.click();
    const blank = await blankPromise;
    expect(blank.suggestedFilename()).toMatch(/_BOS(?:_SABLON)?\.pdf$/);
    const blankPdf = await PDFDocument.load(await readFile((await blank.path())!));
    for (const key of DOCUMENT_EDITABLE_FIELDS[id]) expect(blankPdf.getForm().getTextField(key).getText() ?? "").toBe("");
    for (const key of DOCUMENT_PDF_ONLY_FIELDS[id]) expect(blankPdf.getForm().getTextField(key).getText()).toBe(getDocumentPdfProfiles(id)[key].fixedValue);
    const undo = await action(page, studio, "Geri al", "Son işlemi geri al");
    await expect(undo).toBeEnabled();
    await undo.click();
    await expect(first).toHaveValue(custom);
    await expect(download).toBeEnabled({ timeout: 8_000 });
    const filledPromise = page.waitForEvent("download", { timeout: 8_000 });
    await download.click();
    const filled = await filledPromise;
    const filledPdf = await PDFDocument.load(await readFile((await filled.path())!));
    expect(filledPdf.getForm().getTextField(DOCUMENT_EDITABLE_FIELDS[id][0]).getText()).toBe(custom);
    await (await action(page, studio, "Sıfırla", "Örnek verilere sıfırla")).click();
    await expect(first).not.toHaveValue(custom);
    await expect(first).not.toHaveValue("");
  });

  test(`${id}: yazdırma ve indirme önizlemedeki aynı PDF verisini kullanmalı`, async ({ page }) => {
    await page.addInitScript(() => {
      const state = window as Window & { __belgePrintUrl?: string; __belgePrinted?: boolean };
      let href = "";
      let loaded: (() => void) | undefined;
      const popup = {
        closed: false,
        location: {
          get href() { return href; },
          set href(value: string) { href = value; state.__belgePrintUrl = value; window.setTimeout(() => loaded?.(), 0); },
        },
        addEventListener: (_event: string, callback: () => void) => { loaded = callback; },
        removeEventListener: () => {},
        focus: () => {},
        print: () => { state.__belgePrinted = true; },
      };
      window.open = () => popup as unknown as Window;
    });
    const { studio, download } = await openStudio(page, id);
    await expect(studio.getByRole("status").first()).toHaveText("PDF önizlemesi hazır.", { timeout: 8_000 });
    const previewUrl = await studio.locator('[data-testid="belge-studio-preview-toolbar"] a[target="_blank"]').getAttribute("href");
    const downloadPromise = page.waitForEvent("download", { timeout: 8_000 });
    await download.click();
    const downloaded = await downloadPromise;
    await (await action(page, studio, "Yazdır", "Yazdır")).click();
    await expect.poll(() => page.evaluate(() => (window as Window & { __belgePrinted?: boolean }).__belgePrinted), { timeout: 8_000 }).toBe(true);
    const printUrl = await page.evaluate(() => (window as Window & { __belgePrintUrl?: string }).__belgePrintUrl);
    expect(printUrl).toBe(previewUrl);
    const printedHash = await page.evaluate(async (url) => {
      const bytes = await (await fetch(url!)).arrayBuffer();
      return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))).map((value) => value.toString(16).padStart(2, "0")).join("");
    }, printUrl);
    expect(printedHash).toBe(createHash("sha256").update(await readFile((await downloaded.path())!)).digest("hex"));
  });
}

test("Sözleşme taslağı ve sol form aynı gerçek 4.06 pt uyarısını gösterir; vazgeç veriyi değiştirmez", async ({ page }) => {
  const { studio, download } = await openStudio(page, "santiye-sefi-sozlesmesi");
  const editor = studio.locator("#sozlesme-muteahhit_unvan");
  const original = await editor.inputValue();
  const previewTab = studio.getByRole("tab", { name: /Canlı PDF Önizle/i });
  if (await previewTab.isVisible()) await previewTab.click();
  await studio.getByTestId("belge-inline-edit-toggle").click();
  await studio.getByTestId("belge-inline-hotspot-muteahhit_unvan").click({ timeout: 8_000 });
  const popover = studio.getByTestId("belge-inline-edit-popover");
  const value = "ÖRNEK İNŞAAT MÜHENDİSLİK MİMARLIK SANAYİ VE TİCARET LİMİTED ŞİRKETİ";
  await popover.getByTestId("belge-inline-edit-input").fill(value);
  await expect(popover.getByTestId("belge-field-guidance-message")).toContainText("4.06", { timeout: 8_000 });
  await popover.getByTestId("belge-inline-edit-cancel").click();
  await expect(editor).toHaveValue(original);
  const formTab = studio.getByRole("tab", { name: /Form Alanları/i });
  if (await formTab.isVisible()) await formTab.click();
  await editor.fill(value);
  await expect(download).toBeEnabled({ timeout: 8_000 });
  const warning = studio.getByTestId("belge-pdf-layout-warnings").locator('[data-field-key="muteahhit_unvan"]');
  await expect(warning).toContainText("4.06", { timeout: 8_000 });
  await expect(download).toBeEnabled();
});
