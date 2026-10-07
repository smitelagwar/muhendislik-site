import assert from "node:assert/strict";
import {
  chooseMode,
  outputScaleFor,
  gridSize,
  tileRect,
  tilesForRect,
  OUT_CAP,
  TILE_PX,
  WHOLE_MAX_PX,
} from "../../../src/lib/dokumantasyon/studio/pdf/engine/tiles";

// 1. outputScaleFor ve chooseMode eşikleri
assert.equal(outputScaleFor(1), 1);
assert.equal(outputScaleFor(2), 2);
assert.equal(outputScaleFor(3.5), OUT_CAP);

assert.equal(chooseMode(800, 1000, 1, 1_000_000), "whole");
assert.equal(chooseMode(800, 1000, 2, 1_000_000), "tiles"); // 800*2 * 1000*2 = 3.2M > 1M

// 2. Parçaların birleşimi sayfa bitmap'ini boşluksuz ve çakışmasız kaplar (3 farklı boyut)
const testDims = [
  { cssW: 595, cssH: 842, o: 1.5, tile: 512 },
  { cssW: 1200, cssH: 1800, o: 2.0, tile: 768 },
  { cssW: 2384, cssH: 3370, o: 1.0, tile: 512 },
];

for (const { cssW, cssH, o, tile } of testDims) {
  const bw = Math.ceil(cssW * o);
  const bh = Math.ceil(cssH * o);
  const { cols, rows } = gridSize(cssW, cssH, o, tile);

  let totalArea = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = tileRect(c, r, cssW, cssH, o, tile);
      totalArea += t.w * t.h;

      // Sınır kontrolleri
      assert.ok(t.x >= 0 && t.x + t.w <= bw);
      assert.ok(t.y >= 0 && t.y + t.h <= bh);
      assert.ok(t.w > 0 && t.h > 0);
      assert.ok(t.w <= tile && t.h <= tile);
    }
  }

  assert.equal(
    totalArea,
    bw * bh,
    `Parçaların toplam alanı (${totalArea}) bitmap alanına (${bw * bh}) tam eşit olmalı`
  );
}

// 3. tilesForRect görünür dikdörtgen kenarında doğru parçaları döndürür ve merkeze göre sıralar
const cssW = 1000;
const cssH = 1500;
const o = 1;
const tile = 500; // 2x3 ızgara
const visibleRect = { x: 100, y: 100, w: 300, h: 300 }; // (0,0) bölgesine yakın

const tiles = tilesForRect(cssW, cssH, o, tile, visibleRect, 0);
assert.ok(tiles.length > 0);
assert.equal(tiles[0].key, "0:0", "Merkeze en yakın parça 0:0 olmalı");

// Genişletilmiş dikdörtgen testi (tüm ızgara)
const allTiles = tilesForRect(cssW, cssH, o, tile, { x: 0, y: 0, w: cssW, h: cssH }, 0);
assert.equal(allTiles.length, 6, "2x3 = 6 parça dönmeli");

console.log("tiles: birim testleri (chooseMode, gridSize, kapsama alanı, tilesForRect) başarıyla geçti");
