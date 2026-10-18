import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import {
  generateBelgeDocument, BETON_DOKUM_DEFAULT_DATA, ISTIFA_DILEKCESI_DEFAULT_DATA,
  INSAAT_RUHSATI_DEFAULT_DATA, SOZLESME_DEFAULT_DATA, TAAHHUTNAME_DEFAULT_DATA,
} from "../src/lib/pdf-engine";
import type { BelgeDocumentId } from "../src/lib/belgeler-pdf-profiles";

const output = "test-output/belgeler-visual-acceptance";
const cases: Array<[string, BelgeDocumentId, object, number]> = [
  ["beton", "beton-dokum-tutanagi", BETON_DOKUM_DEFAULT_DATA, 1],
  ["istifa", "santiye-sefi-istifa-dilekcesi", ISTIFA_DILEKCESI_DEFAULT_DATA, 1],
  ["ruhsat", "insaat-ruhsati-dilekcesi", INSAAT_RUHSATI_DEFAULT_DATA, 1],
  ["sozlesme", "santiye-sefi-sozlesmesi", SOZLESME_DEFAULT_DATA, 2],
  ["taahhutname", "santiye-sefi-taahhutnamesi", TAAHHUTNAME_DEFAULT_DATA, 1],
];
// Yalnız düzeltilen adres ile T.C./telefon kutularının eski ve yeni sınırları.
const contactMasks = [
  { x: 143, y: 328.65, width: 225, height: 54.35 },
  { x: 68, y: 310, width: 208, height: 38 },
  { x: 68, y: 293, width: 214, height: 38 },
];
async function pixels(path: string) {
  const image = await loadImage(path);
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, image.width, image.height);
}
async function main() {
  try {
    mkdirSync(output, { recursive: true });
    const report = [];
    for (const [name, id, data, pages] of cases) {
      const result = await generateBelgeDocument(id, data);
      writeFileSync(`${output}/${name}.pdf`, result.bytes);
      writeFileSync(`${output}/${name}-layouts.json`, JSON.stringify(result.layouts, null, 2));
      execFileSync("pdftoppm", ["-r", "144", "-png", `${output}/${name}.pdf`, `${output}/${name}`], { timeout: 15_000, stdio: "pipe" });
      for (let page = 1; page <= pages; page++) {
        const before = await pixels(`tests/fixtures/belgeler-approved/${name}-${page}.png`);
        const after = await pixels(`${output}/${name}-${page}.png`);
        assert.equal(after.width, before.width);
        assert.equal(after.height, before.height);
        let changed = 0;
        let allowed = 0;
        for (let y = 0; y < after.height; y++) for (let x = 0; x < after.width; x++) {
          const index = (y * after.width + x) * 4;
          if (![0, 1, 2].some((channel) => Math.abs(before.data[index + channel] - after.data[index + channel]) > 12)) continue;
          const masked = name === "istifa" && contactMasks.some((rect) => x >= rect.x * 2 - 2 && x <= (rect.x + rect.width) * 2 + 2 &&
            y >= after.height - (rect.y + rect.height) * 2 - 2 && y <= after.height - rect.y * 2 + 2);
          if (masked) allowed++; else changed++;
        }
        report.push({ name, page, unexpectedChangedPixels: changed, allowedChangedPixels: allowed });
        assert.equal(changed, 0, `${name}/${page}: düzeltme bölgesi dışında görünüm değişti`);
      }
    }
    writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
    console.log("Altı sayfanın görsel koruma denetimi geçti; değişiklikler yalnız istifa iletişim bloğunda.");
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    process.exit(process.exitCode ?? 0);
  }
}
void main();
