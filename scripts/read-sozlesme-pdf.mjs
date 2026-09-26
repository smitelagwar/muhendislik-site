import { readFileSync } from 'node:fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function extractText() {
  const pdfPath = './eklediklerim/pdfler/ŞANTİYE ŞEFİ SÖZLEŞMESİ.pdf';
  const data = new Uint8Array(readFileSync(pdfPath));

  const doc = await pdfjsLib.getDocument({
    data,
    useSystemFonts: true,
    isEvalSupported: false,
    enableScripting: false,
  }).promise;
  console.log('Total pages:', doc.numPages);

  for (let p = 1; p <= doc.numPages; p++) {
    console.log(`\n=== PAGE ${p} ===`);
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const lines = [];
    let lastY = null;
    for (const item of content.items) {
      if ('str' in item) {
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
          lines.push('\n');
        }
        lines.push(item.str);
        lastY = item.transform[5];
      }
    }
    console.log(lines.join(' '));
  }
}

extractText().catch(console.error);
