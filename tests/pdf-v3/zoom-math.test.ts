import assert from "node:assert/strict";
import {
  CSS_UNITS,
  computePdfFitScale,
  getMaxPdfScale,
  getNextPdfScale,
  pdfScaleToZoom,
  rotatePdfPageSize,
  zoomToPdfScale,
} from "../../src/lib/dokumantasyon/studio/pdf/pdf-zoom-math";

assert.equal(zoomToPdfScale(1), 96 / 72, "%100 gerçek boyut CSS unit dönüşümünü kullanır");
assert.equal(pdfScaleToZoom(CSS_UNITS), 1, "Gerçek boyut araç çubuğunda %100 görünür");
assert.equal(getNextPdfScale(CSS_UNITS, 1), zoomToPdfScale(1.25));
assert.equal(getNextPdfScale(CSS_UNITS, -1), zoomToPdfScale(0.75));
assert.equal(getMaxPdfScale(true), zoomToPdfScale(3), "Dokunmatik ekranda üst sınır %300 olur");
assert.deepEqual(rotatePdfPageSize({ width: 600, height: 840 }, 90), { width: 840, height: 600 });
assert.deepEqual(rotatePdfPageSize({ width: 600, height: 840 }, 180), { width: 600, height: 840 });

const fitWidth = computePdfFitScale({
  mode: "fit-width",
  containerWidth: 1200,
  containerHeight: 900,
  pageWidth: 600,
  pageHeight: 840,
});
assert.ok(fitWidth * 600 <= 1200 - 24, "Genişliğe sığdır yatay taşma üretmez");
assert.ok((1200 - 24) / 600 - fitWidth < 0.0001, "Sığdırma dört basamak hassasiyet taşır");

const fitPage = computePdfFitScale({
  mode: "fit-page",
  containerWidth: 1200,
  containerHeight: 900,
  pageWidth: 600,
  pageHeight: 840,
});
assert.ok(fitPage <= fitWidth);
assert.ok(fitPage * 840 <= 900 - 24, "Sayfaya sığdır yükseklik taşması üretmez");

console.log("PDF zoom matematiği doğrulandı.");
