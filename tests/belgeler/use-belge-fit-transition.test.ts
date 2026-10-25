import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { easeInOutCubic } from "../../src/hooks/use-belge-fit-transition";

describe("ASAMA_02: useBelgeFitTransition — Fit/Width Geçiş Animasyonu ve Easing Matematiği", () => {
  it("1. easeInOutCubic sınırları ve monotonluğu: t=0 -> 0, t=0.5 -> 0.5, t=1 -> 1", () => {
    assert.equal(easeInOutCubic(0), 0);
    assert.equal(easeInOutCubic(0.5), 0.5);
    assert.equal(easeInOutCubic(1), 1);

    // Monotonluk testi (artma garantisi, overshoot olmaması)
    let prev = -1;
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const val = easeInOutCubic(t);
      assert.ok(val >= prev, `easeInOutCubic monoton artmalı: t=${t}, val=${val}, prev=${prev}`);
      assert.ok(val >= 0 && val <= 1, `Değer [0, 1] aralığında kalmalı: ${val}`);
      prev = val;
    }
  });

  it("2. Easing eğrisi başlangıçta ve sonda yumuşak (ease-in-out), lineer t'den daha yumuşak eğime sahip olmalıdır", () => {
    // t=0.1 iken değer 0.1'den küçük olmalı (yavaş başlama / ease-in)
    const valEarly = easeInOutCubic(0.1);
    assert.ok(valEarly < 0.1, `Erken değer lineerden yavaş olmalı: ${valEarly} < 0.1`);

    // t=0.9 iken değer 0.9'dan büyük olmalı (yavaş bitiş / ease-out)
    const valLate = easeInOutCubic(0.9);
    assert.ok(valLate > 0.9, `Geç değer lineerden yüksek olmalı: ${valLate} > 0.9`);
  });

  it("3. Simetri testi: f(1 - t) === 1 - f(t)", () => {
    const points = [0.05, 0.15, 0.25, 0.35, 0.45];
    for (const t of points) {
      const left = easeInOutCubic(t);
      const right = 1 - easeInOutCubic(1 - t);
      assert.ok(
        Math.abs(left - right) < 1e-10,
        `Eğri simetrik olmalı: t=${t}, left=${left}, right=${right}`
      );
    }
  });
});
