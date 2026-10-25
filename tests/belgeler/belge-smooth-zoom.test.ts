import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_BELGE_WHEEL_SENSITIVITY,
  DEFAULT_BELGE_ZOOM_TAU_MS,
  BELGE_ZOOM_SETTLE_THRESHOLD,
  normalizeWheelDelta,
  calculateNextTargetZoom,
  calculateZoomFollowAlpha,
  clampBelgeZoom,
} from "../../src/lib/belge-studio-zoom";

describe("ASAMA_01: Belge Ultra Smooth Zoom — Normalizasyon, Duyarlılık ve Hedef Takip Matematiği", () => {
  it("1. normalizeWheelDelta: deltaMode=0 (PIXEL), deltaMode=1 (LINE), deltaMode=2 (PAGE) ve sınırlandırma", () => {
    // PIXEL: unit = 1
    assert.equal(normalizeWheelDelta({ deltaY: 100, deltaMode: 0 }), 100);
    assert.equal(normalizeWheelDelta({ deltaY: -50, deltaMode: 0 }), -50);

    // LINE: unit = 16
    assert.equal(normalizeWheelDelta({ deltaY: 3, deltaMode: 1 }), 48);
    assert.equal(normalizeWheelDelta({ deltaY: -2, deltaMode: 1 }), -32);

    // PAGE: unit = containerHeight (örn. 600), max 300 ile sınırlandırılır
    assert.equal(normalizeWheelDelta({ deltaY: 1, deltaMode: 2 }, 600), 300);
    assert.equal(normalizeWheelDelta({ deltaY: -1, deltaMode: 2 }, 600), -300);

    // Aşırı sıçrama sınırlandırması [-300, 300]
    assert.equal(normalizeWheelDelta({ deltaY: 1200, deltaMode: 0 }), 300);
    assert.equal(normalizeWheelDelta({ deltaY: -999, deltaMode: 0 }), -300);

    // Geçersiz değer güvenliği
    assert.equal(normalizeWheelDelta({ deltaY: Number.NaN, deltaMode: 0 }), 0);
  });

  it("2. calculateNextTargetZoom: Tek wheel darbesinde (%7-8 hassasiyet) eski %27 sıçramasını önleme", () => {
    // Standart 1 fare tekeri çentiği (deltaY = -120, büyütme)
    const zoomIn = calculateNextTargetZoom(100, -120);
    // 100 * exp(120 * 0.0006) = 100 * exp(0.072) = 107.4655...
    assert.ok(zoomIn >= 107 && zoomIn <= 108.5, `Tek çentik büyütme ~%107.5 olmalı: ${zoomIn}`);

    // Standart 1 fare tekeri çentiği (deltaY = 120, küçültme)
    const zoomOut = calculateNextTargetZoom(100, 120);
    // 100 * exp(-120 * 0.0006) = 100 * exp(-0.072) = 93.0527...
    assert.ok(zoomOut >= 92.5 && zoomOut <= 93.5, `Tek çentik küçültme ~%93 olmalı: ${zoomOut}`);

    // Eski kod tek çentikte %127.1 veya %78.6 yapıyordu; bu aşırı sıçramanın kesinlikle engellendiğini doğrula
    assert.ok(zoomIn < 120, `Eski koddaki %127 sıçraması olmamalı: ${zoomIn}`);
    assert.ok(zoomOut > 85, `Eski koddaki %78.6 düşüşü olmamalı: ${zoomOut}`);
  });

  it("3. calculateNextTargetZoom: %50-%400 sınırları ve ardışık birikim tutarlılığı", () => {
    // Üst sınır clamp testi: %400'ü geçemez
    let z = 390;
    for (let i = 0; i < 10; i++) {
      z = calculateNextTargetZoom(z, -120);
    }
    assert.equal(z, 400);

    // Alt sınır clamp testi: %50'nin altına inemez
    z = 60;
    for (let i = 0; i < 10; i++) {
      z = calculateNextTargetZoom(z, 120);
    }
    assert.equal(z, 50);

    // Hızlı ardışık 3 çentik birikimi
    let accum = 100;
    for (let i = 0; i < 3; i++) {
      accum = calculateNextTargetZoom(accum, -120);
    }
    // 100 * exp(3 * 0.072) = 100 * exp(0.216) = 124.11...
    assert.ok(accum >= 123.5 && accum <= 125, `3 çentik birikimi ~%124.1 olmalı: ${accum}`);
  });

  it("4. calculateZoomFollowAlpha: Zaman bazlı (dt) takip, yenileme hızı bağımsızlığı ve monotonluk", () => {
    // 60Hz (~16.6ms) için alpha
    const alpha60 = calculateZoomFollowAlpha(16.6, DEFAULT_BELGE_ZOOM_TAU_MS);
    assert.ok(alpha60 >= 0.20 && alpha60 <= 0.25, `60Hz alpha ~%22.5 olmalı: ${alpha60}`);

    // 120Hz (~8.3ms) için alpha
    const alpha120 = calculateZoomFollowAlpha(8.3, DEFAULT_BELGE_ZOOM_TAU_MS);
    assert.ok(alpha120 >= 0.11 && alpha120 <= 0.13, `120Hz alpha ~%12 olmalı: ${alpha120}`);

    // 2 x 120Hz adımı (8.3ms * 2 = 16.6ms) kümülatif olarak 1 x 60Hz adımına eşdeğer olmalı:
    // (1 - a1) * (1 - a2) = 1 - a_combined
    const combinedRemain = (1 - alpha120) * (1 - alpha120);
    const singleRemain = 1 - alpha60;
    assert.ok(Math.abs(combinedRemain - singleRemain) < 0.02, "60Hz ve 120Hz kare takibi fiziksel zamanda eşdeğer olmalı");

    // Monotonluk testi (dt arttıkça alpha artmalı)
    let prev = 0;
    for (let dt = 1; dt <= 64; dt += 4) {
      const a = calculateZoomFollowAlpha(dt);
      assert.ok(a > prev, `Alpha monoton artmalı: dt=${dt}, a=${a}, prev=${prev}`);
      assert.ok(a > 0 && a <= 1, `Alpha [0, 1] aralığında kalmalı: ${a}`);
      prev = a;
    }
  });

  it("5. Takip döngüsü simülasyonu: 180-260ms içinde hedefe pürüzsüz varış ve <0.15 eşiğinde settle", () => {
    let visual = 100;
    const target = 107.5;
    const dt = 16.6; // 60fps
    let frames = 0;
    let settled = false;

    while (frames < 30) {
      frames++;
      const alpha = calculateZoomFollowAlpha(dt, DEFAULT_BELGE_ZOOM_TAU_MS);
      visual += (target - visual) * alpha;

      if (Math.abs(target - visual) < BELGE_ZOOM_SETTLE_THRESHOLD) {
        visual = target;
        settled = true;
        break;
      }
    }

    assert.ok(settled, "Hedefe 30 kareden (<500ms) önce oturmalı");
    assert.ok(frames >= 8 && frames <= 16, `Settle 8-16 kare (130-265ms) arasında gerçekleşmeli: ${frames} kare (~${Math.round(frames * dt)}ms)`);
    assert.equal(visual, target, "Son değer tam hedef olmalı");
  });
});
