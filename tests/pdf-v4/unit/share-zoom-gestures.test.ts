import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  computePdfFitScale,
  getMaxPdfScale,
  getNextPdfScale,
  pdfScaleToZoom,
  rotatePdfPageSize,
  zoomToPdfScale,
  isWheelNotch,
  wheelZoomFactor,
  PDF_ZOOM_STEPS,
  MAX_PDF_ZOOM,
} from "../../../src/lib/dokumantasyon/studio/pdf/pdf-zoom-math";

describe("ASAMA_05: Yalnız PDF Zoom, Geometri, Gestures ve Viewport Sözleşmeleri", () => {
  // --------------------------------------------------------------------------
  // 1. Viewport Meta ve WCAG 1.4.4 Erişilebilirlik
  // --------------------------------------------------------------------------
  describe("1. Viewport Meta ve WCAG 1.4.4 Erişilebilirlik", () => {
    it("1.1 Root ve paylaşılan layout'ta maximum-scale=1 veya user-scalable=no kesinlikle bulunmamalıdır (WCAG %200 içerik büyütme)", () => {
      const rootLayoutPath = path.resolve(process.cwd(), "src/app/layout.tsx");
      const rootLayoutSource = fs.readFileSync(rootLayoutPath, "utf8");

      assert.ok(!rootLayoutSource.includes("user-scalable=no"), "user-scalable=no yasaktır");
      assert.ok(!rootLayoutSource.includes("maximum-scale=1"), "maximum-scale=1 yasaktır");
      assert.ok(!rootLayoutSource.includes("maximumScale: 1"), "maximumScale: 1 yasaktır");
      assert.ok(!rootLayoutSource.includes("userScalable: false"), "userScalable: false yasaktır");

      const shareLayoutPath = path.resolve(process.cwd(), "src/app/b/[token]/layout.tsx");
      const shareLayoutSource = fs.readFileSync(shareLayoutPath, "utf8");
      assert.ok(!shareLayoutSource.includes("user-scalable=no"), "share layout user-scalable=no yasaktır");
      assert.ok(!shareLayoutSource.includes("maximum-scale=1"), "share layout maximum-scale=1 yasaktır");
    });
  });

  // --------------------------------------------------------------------------
  // 2. Zoom Ölçeği, Adımlar ve 400% Desteği
  // --------------------------------------------------------------------------
  describe("2. Zoom Ölçeği, Adımlar ve 400% Desteği", () => {
    it("2.1 Masaüstü için maksimum ölçek %500 olmalı ve %400'ü desteklemelidir", () => {
      const desktopMax = getMaxPdfScale(false);
      assert.strictEqual(desktopMax, zoomToPdfScale(MAX_PDF_ZOOM));
      assert.strictEqual(pdfScaleToZoom(desktopMax), 5);

      // PDF_ZOOM_STEPS %400 (4) adımını barındırmalıdır
      assert.ok(
        (PDF_ZOOM_STEPS as readonly number[]).includes(4),
        "Adımlar %400 zoom içermelidir"
      );
    });

    it("2.2 Dokunmatik cihazlarda (coarse pointer) bellek koruması için üst sınır %300 olmalıdır", () => {
      const touchMax = getMaxPdfScale(true);
      assert.strictEqual(touchMax, zoomToPdfScale(3));
      assert.strictEqual(pdfScaleToZoom(touchMax), 3);
    });

    it("2.3 getNextPdfScale adımları ileri ve geri yönlerde monoton ve sınırları aşmayan değerler üretmelidir", () => {
      let scale = zoomToPdfScale(1); // %100
      // 100 -> 125 -> 150 -> 200 -> 300 -> 400 -> 500
      scale = getNextPdfScale(scale, 1);
      assert.strictEqual(pdfScaleToZoom(scale), 1.25);
      scale = getNextPdfScale(scale, 1);
      assert.strictEqual(pdfScaleToZoom(scale), 1.5);
      scale = getNextPdfScale(scale, 1);
      assert.strictEqual(pdfScaleToZoom(scale), 2);
      scale = getNextPdfScale(scale, 1);
      assert.strictEqual(pdfScaleToZoom(scale), 3);
      scale = getNextPdfScale(scale, 1);
      assert.strictEqual(pdfScaleToZoom(scale), 4);
      scale = getNextPdfScale(scale, 1);
      assert.strictEqual(pdfScaleToZoom(scale), 5);
      // Tavanda kalır
      scale = getNextPdfScale(scale, 1);
      assert.strictEqual(pdfScaleToZoom(scale), 5);

      // Geriye iniş
      scale = getNextPdfScale(scale, -1);
      assert.strictEqual(pdfScaleToZoom(scale), 4);
    });
  });

  // --------------------------------------------------------------------------
  // 3. fitWidth ve fitPage Rotasyonlu ve Farklı Ekran Boyutları
  // --------------------------------------------------------------------------
  describe("3. fitWidth ve fitPage Rotasyonlu ve Farklı Ekran Boyutları", () => {
    const viewports = [
      { name: "320px mobil dar", w: 320, h: 568 },
      { name: "390px mobil standart", w: 390, h: 844 },
      { name: "768px tablet", w: 768, h: 1024 },
      { name: "1366px masaüstü", w: 1366, h: 768 },
      { name: "1920px geniş ekran", w: 1920, h: 1080 },
    ];

    for (const vp of viewports) {
      it(`3.1 ${vp.name} ekranında standart A4 (595x842) için fit-width yatay taşma üretmemelidir`, () => {
        const scale = computePdfFitScale({
          mode: "fit-width",
          containerWidth: vp.w,
          containerHeight: vp.h,
          pageWidth: 595.28,
          pageHeight: 841.89,
          padding: 12,
        });
        const renderedWidth = scale * 595.28;
        assert.ok(
          renderedWidth <= vp.w - 24,
          `İçerik genişliği (${renderedWidth}) kapsayıcıdan (${vp.w - 24}) büyük olamaz`
        );
      });

      it(`3.2 ${vp.name} ekranında 90 derece döndürülmüş A4 (842x595) için fit-width ve fit-page doğru ölçeklenmelidir`, () => {
        const rotated = rotatePdfPageSize({ width: 595.28, height: 841.89 }, 90);
        assert.strictEqual(Math.round(rotated.width), 842);
        assert.strictEqual(Math.round(rotated.height), 595);

        const scaleWidth = computePdfFitScale({
          mode: "fit-width",
          containerWidth: vp.w,
          containerHeight: vp.h,
          pageWidth: rotated.width,
          pageHeight: rotated.height,
          padding: 12,
        });
        assert.ok(scaleWidth * rotated.width <= vp.w - 24);

        const scalePage = computePdfFitScale({
          mode: "fit-page",
          containerWidth: vp.w,
          containerHeight: vp.h,
          pageWidth: rotated.width,
          pageHeight: rotated.height,
          padding: 12,
        });
        assert.ok(scalePage <= scaleWidth);
        assert.ok(scalePage * rotated.height <= vp.h - 24);
      });
    }
  });

  // --------------------------------------------------------------------------
  // 4. Tekerlek ve Trackpad Pinch Faktör Sınırları
  // --------------------------------------------------------------------------
  describe("4. Tekerlek ve Trackpad Pinch Faktör Sınırları", () => {
    it("4.1 Fare çentiği (notch) %10 adımlı çarpan üretmelidir", () => {
      const zoomInNotch = { deltaY: -100, deltaMode: 0 };
      const zoomOutNotch = { deltaY: 100, deltaMode: 0 };

      assert.strictEqual(isWheelNotch(zoomInNotch), true);
      assert.strictEqual(isWheelNotch(zoomOutNotch), true);

      const factorIn = wheelZoomFactor(zoomInNotch);
      const factorOut = wheelZoomFactor(zoomOutNotch);

      assert.ok(factorIn > 1.05 && factorIn < 1.15, "Notch zoom-in factor ~1.1 olmalı");
      assert.ok(factorOut > 0.85 && factorOut < 0.95, "Notch zoom-out factor ~0.91 olmalı");
    });

    it("4.2 Trackpad pinch (küçük deltalı) clamp sınırını aşmamalı ve düzgün yumuşatma uygulamalıdır", () => {
      const trackpadPinch = { deltaY: 2.5, deltaMode: 0 };
      assert.strictEqual(isWheelNotch(trackpadPinch), false);

      const factor = wheelZoomFactor(trackpadPinch);
      assert.ok(factor < 1.0 && factor > 0.9, "Küçük delta düzgün çarpan üretmeli");

      // Aşırı büyük delta clamp ile sınırlandırılmalı
      const extremeDelta = { deltaY: 10000.5, deltaMode: 0 };
      const clampedFactor = wheelZoomFactor(extremeDelta);
      assert.ok(clampedFactor > 0.5, "Aşırı delta tek olayda clamp altına inemez");
    });
  });
});
