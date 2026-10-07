import assert from "node:assert/strict";
import { maxScaleForHeight } from "../../../src/lib/dokumantasyon/studio/pdf/engine/engine";
import { Governor, getDefaultGovernorConfig } from "../../../src/lib/dokumantasyon/studio/pdf/engine/governor";

// 1. maxScaleForHeight testleri
const a4Sizes = Array.from({ length: 1000 }, () => ({ w: 595.28, h: 841.89 }));
const scaleFor1000 = maxScaleForHeight(a4Sizes, 16, 16, 15_000_000);
// 1000 sayfa A4 için 15M cap altında güvenli ölçek hesaplanmalı (yaklaşık 17.8)
assert(scaleFor1000 > 10, `scaleFor1000 beklenenden küçük: ${scaleFor1000}`);
assert(scaleFor1000 <= 20, `scaleFor1000 20'yi aşamaz: ${scaleFor1000}`);

const a0Sizes = Array.from({ length: 5000 }, () => ({ w: 2383.94, h: 3370.39 }));
const scaleFor5000A0 = maxScaleForHeight(a0Sizes, 16, 16, 15_000_000);
// 5000 sayfa A0 için 15M cap altında ölçek ~0.88 civarında kısıtlanmalı
assert(scaleFor5000A0 < 1.0, `5000 A0 için ölçek kısıtlanmalı: ${scaleFor5000A0}`);
assert(scaleFor5000A0 > 0.5, `5000 A0 için ölçek çok düşük olmamalı: ${scaleFor5000A0}`);

// 2. Governor testleri
const cfg = getDefaultGovernorConfig(false);
const gov = new Governor(cfg);
assert(gov.sharpBytes === 0);
assert(gov.backdropBytes === 0);

// Mock canvas
const makeCanvas = (w: number, h: number) => ({ width: w, height: h } as HTMLCanvasElement);
const c1 = makeCanvas(100, 100);
gov.addSharp("s:1", c1);
assert.equal(gov.sharpBytes, 100 * 100 * 4);

gov.setVisible(["s:1"]);
gov.trimTo(0);
// s:1 görünür olduğu için korunur
assert.equal(gov.sharp.has("s:1"), true);

gov.setVisible([]);
gov.trimTo(0);
// s:1 artık görünür olmadığı için 0 bütçede tahliye edilir
assert.equal(gov.sharp.has("s:1"), false);
assert.equal(gov.sharpBytes, 0);

console.log("engine/governor: birim testleri (maxScaleForHeight, governor bütçe/koruma) başarıyla geçti");
