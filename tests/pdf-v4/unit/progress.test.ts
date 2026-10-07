import assert from "node:assert/strict";
import {
  computeMonotonicProgress,
  getProgressPercentage,
  type PdfProgressState,
} from "../../../src/lib/dokumantasyon/studio/pdf/pdf-progress";

// Plan 05 W1 Ölçüt: yükleme ekranında yüzde hiç geri gitmez (birim test: onProgress monoton)

let state: PdfProgressState | null = null;

// Başlangıç: 100 / 1000 (%10)
state = computeMonotonicProgress(state, { loaded: 100, total: 1000 });
assert.equal(state.loaded, 100);
assert.equal(getProgressPercentage(state), 10);

// Ağ dalgalanması: 80 / 1000 (geriye gitmeye çalışıyor) -> 100 kalmalı
state = computeMonotonicProgress(state, { loaded: 80, total: 1000 });
assert.equal(state.loaded, 100);
assert.equal(getProgressPercentage(state), 10);

// İlerleme: 350 / 1000 (%35)
state = computeMonotonicProgress(state, { loaded: 350, total: 1000 });
assert.equal(state.loaded, 350);
assert.equal(getProgressPercentage(state), 35);

// Toplam bilinmeyen chunk: total 0 gelirse eski total (1000) korunmalı
state = computeMonotonicProgress(state, { loaded: 400, total: 0 });
assert.equal(state.loaded, 400);
assert.equal(state.total, 1000);
assert.equal(getProgressPercentage(state), 40);

// Negatif loaded gelirse 0'dan aşağı düşmemeli
state = computeMonotonicProgress(state, { loaded: -50, total: 1000 });
assert.equal(state.loaded, 400);
assert.equal(getProgressPercentage(state), 40);

// Tamamlama: 1000 / 1000 (%100)
state = computeMonotonicProgress(state, { loaded: 1000, total: 1000 });
assert.equal(state.loaded, 1000);
assert.equal(getProgressPercentage(state), 100);

// Taşma: 1050 / 1000 -> yüzde %100'ü aşmamalı
state = computeMonotonicProgress(state, { loaded: 1050, total: 1000 });
assert.equal(state.loaded, 1050);
assert.equal(getProgressPercentage(state), 100);

console.log("progress: birim testleri (W1 monoton onProgress) başarıyla geçti");
