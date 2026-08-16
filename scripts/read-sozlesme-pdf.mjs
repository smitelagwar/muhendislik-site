import { readFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

async function extractText() {
  const pdfjsLib = require('pdfjs-dist');
  // Disable worker for node.js usage
  pdfjsLib.GlobalWorkerOptions.workerSrc = false;
  const pdfPath = './eklediklerim/pdfler/ŞANTİYE ŞEFİ SÖZLEŞMESİ.pdf';
  const data = new Uint8Array(readFileSync(pdfPath));

  const doc = await pdfjsLib.getDocument({ data, useSystemFonts: true }).promise;
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
