import { test, expect } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { readFile } from 'node:fs/promises';
import { DOCUMENT_EDITABLE_FIELDS } from '../../src/lib/document-field-contracts';

test.use({ viewport: { width: 1366, height: 900 } });
for (const [documentId, fields] of Object.entries(DOCUMENT_EDITABLE_FIELDS)) {
  test(`${documentId}: tüm alanlar storage → restore → preview → indirilen PDF`, async ({ page }) => {
    test.setTimeout(60000);
    page.on('pageerror', error => { throw error; });
    await page.goto(`/belgeler/${documentId}`);
    for (const field of fields) {
      const input = page.locator(`[data-belge-form-content] input[id$="-${field}"], [data-belge-form-content] textarea[id$="-${field}"]`);
      await expect(input).toHaveCount(1);
      await input.fill(`Örnek şantiye ${field}`);
    }
    const expected: Record<string, string> = {};
    for (const field of fields) expected[field] = await page.locator(`[data-belge-form-content] [id$="-${field}"]`).inputValue();
    await page.getByTestId('belge-draft-consent-device').click();
    await expect.poll(async () => page.evaluate(id => {
      const raw=localStorage.getItem(`belgeler:ux:draft:device:v1:${id}`);
      return raw ? JSON.parse(raw).values : null;
    },documentId)).toEqual(expected);
    await page.reload(); await page.getByTestId('belge-draft-restore-confirm').click();
    for (const field of fields) await expect(page.locator(`[data-belge-form-content] [id$="-${field}"]`)).toHaveValue(expected[field]);
    // Başlık sürümleri yerine gerçek toolbar dış bağlantısını kaynakla eşleştir.
    const pdfLink=page.locator('a[target="_blank"][href^="blob:"]').first();
    await expect(pdfLink).toHaveAttribute('href',/^blob:/);
    await expect(page.getByRole('button',{name:'PDF İndir',exact:true}).filter({visible:true})).toBeEnabled();
    const bytes=await page.evaluate(async url=>Array.from(new Uint8Array(await (await fetch(url!)).arrayBuffer())),await pdfLink.getAttribute('href'));
    const preview=await PDFDocument.load(new Uint8Array(bytes));
    for(const field of fields) expect(preview.getForm().getTextField(field).getText()).toBe(expected[field]);
    const downloadPromise=page.waitForEvent('download');
    await page.getByRole('button',{name:'PDF İndir',exact:true}).filter({visible:true}).click();
    const download=await downloadPromise;
    const downloaded=await PDFDocument.load(await readFile((await download.path())!));
    for(const field of fields) expect(downloaded.getForm().getTextField(field).getText()).toBe(expected[field]);
  });
}