import test from "node:test";
import assert from "node:assert/strict";

test("BelgeStudioResizer - Genişlik ve Zoom Hesaplama Mantığı", () => {
  const BASE_WIDTH = 420;
  const MIN_WIDTH = 340;

  const calculateZoom = (width: number) => {
    const raw = width / BASE_WIDTH;
    return Math.min(1.65, Math.max(0.85, Number(raw.toFixed(2))));
  };

  // 1. Varsayılan genişlik (420px) 1.00 zoom üretmeli
  assert.equal(calculateZoom(420), 1.0);

  // 2. Minimum genişlikte (340px) zoom tabana (0.85) kenetlenmeli
  assert.equal(calculateZoom(340), 0.85);

  // 3. Panel sağa çekildikçe zoom orantılı büyümeli
  assert.equal(calculateZoom(462), 1.10);
  assert.equal(calculateZoom(504), 1.20);
  assert.equal(calculateZoom(546), 1.30);
  assert.equal(calculateZoom(630), 1.50);

  // 4. Aşırı büyük değerlerde üst tavana (1.65) kenetlenmeli
  assert.equal(calculateZoom(800), 1.65);
});
