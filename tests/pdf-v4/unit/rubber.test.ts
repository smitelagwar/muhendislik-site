import assert from "node:assert/strict";
import { rubber } from "../../../src/lib/dokumantasyon/studio/pdf/engine/rubber";

const min = 0.5;
const max = 3.0;
const maxOver = 0.2;

// 1. [min, max] aralığında tam özdeşlik
for (const s of [0.5, 0.75, 1.0, 1.5, 2.0, 2.5, 3.0]) {
  assert.equal(rubber(s, min, max, maxOver), s, `s=${s} aralık içindeyken değişmemeli`);
}

// 2. Üst sınır aşımı: logaritmik sönümleme ve tavan
const upperLimit = max * Math.exp(maxOver);
for (const s of [3.1, 4.0, 6.0, 10.0, 100.0]) {
  const r = rubber(s, min, max, maxOver);
  assert.ok(r > max, `s=${s} için r=${r} > max=${max} olmalı`);
  assert.ok(r <= upperLimit + 1e-9, `s=${s} için r=${r} <= ${upperLimit} olmalı`);
}

// 3. Alt sınır aşımı: logaritmik sönümleme ve taban
const lowerLimit = min * Math.exp(-maxOver);
for (const s of [0.49, 0.4, 0.3, 0.1, 0.01]) {
  const r = rubber(s, min, max, maxOver);
  assert.ok(r < min, `s=${s} için r=${r} < min=${min} olmalı`);
  assert.ok(r >= lowerLimit - 1e-9, `s=${s} için r=${r} >= ${lowerLimit} olmalı`);
}

// 4. Monoton artan (tüm reel eksende kesintisiz)
let prev = -1;
for (let s = 0.1; s <= 5.0; s += 0.01) {
  const r = rubber(s, min, max, maxOver);
  if (prev >= 0) {
    assert.ok(r >= prev, `Monotonluk bozuldu: s=${s}, r=${r}, prev=${prev}`);
  }
  prev = r;
}

console.log("rubber: birim testleri (özdeşlik, sönümleme, monoton artış) başarıyla geçti");
