/**
 * @file check-cad-monochrome.ts
 * @description Automated regression & contract verification for CAD Monochrome (Siyah-Beyaz) mode.
 * Verifies AutoCAD monochrome.ctb alignment, ink resolution, lossless color restoration,
 * wipeout exclusion, transparency preservation, and absence of destructive canvas CSS filters.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  resolveMonochromeInkColor,
  isMonochromeEligible,
  captureSourceColor,
  applyMonochromeToMaterial,
  restoreSourceMaterialColor,
  applyMonochromeToSceneAndManagers,
  restoreSourceColorsToSceneAndManagers,
} from "../src/lib/dokumantasyon/cad-upstream/monochrome";

console.log("=== CAD Monochrome (Siyah-Beyaz) Doğrulama Testi Başlıyor ===");

// --------------------------------------------------------------------------
// 1. Ink Color Resolution Tests (AutoCAD Eşleşmesi)
// --------------------------------------------------------------------------
console.log("\n[Test 1] Arka plan - mürekkep rengi çözümleme testi...");

assert.equal(
  resolveMonochromeInkColor("white"),
  0x000000,
  "Beyaz arka planda mürekkep rengi saf siyah (0x000000) olmalıdır."
);
assert.equal(
  resolveMonochromeInkColor("black"),
  0xffffff,
  "Siyah arka planda mürekkep rengi saf beyaz (0xffffff) olmalıdır."
);
assert.equal(
  resolveMonochromeInkColor("autocad"),
  0xffffff,
  "AutoCAD arka planında (#212830) mürekkep rengi saf beyaz (0xffffff) olmalıdır."
);
assert.equal(
  resolveMonochromeInkColor("custom", 0xffffff),
  0x000000,
  "Özel beyaz arka planda mürekkep rengi saf siyah olmalıdır."
);
assert.equal(
  resolveMonochromeInkColor("custom", 0x1a1a1a),
  0xffffff,
  "Özel koyu arka planda mürekkep rengi saf beyaz olmalıdır."
);
console.log("  ✓ Ink color resolution testleri geçti.");

// --------------------------------------------------------------------------
// 2. Wipeout / Background Fill Koruma Testi
// --------------------------------------------------------------------------
console.log("\n[Test 2] Wipeout ve arka plan maskeleri koruma testi...");

const wipeoutMaterial = {
  userData: { isBackgroundFill: true },
  color: {
    hex: 0x212830,
    getHex() { return this.hex; },
    set(v: number) { this.hex = v; },
  },
};

assert.equal(
  isMonochromeEligible(wipeoutMaterial),
  false,
  "isBackgroundFill: true olan materyaller monochrome dönüşümüne girmemelidir."
);

const appliedToWipeout = applyMonochromeToMaterial(wipeoutMaterial, 0xffffff);
assert.equal(appliedToWipeout, false, "Wipeout materyaline mürekkep uygulanmamalıdır.");
assert.equal(wipeoutMaterial.color.hex, 0x212830, "Wipeout materyalinin rengi değişmemelidir.");
console.log("  ✓ Wipeout koruma testi geçti.");

// --------------------------------------------------------------------------
// 3. Kayıpsız Renk Geri Yükleme Testi (Lossless Source Restoration)
// --------------------------------------------------------------------------
console.log("\n[Test 3] Kayıpsız renk yedekleme ve geri yükleme testi...");

// Standard Line Material (e.g. ACI 5 Blue 0x0000ff)
const blueLineMaterial = {
  userData: {},
  color: {
    hex: 0x0000ff,
    getHex() { return this.hex; },
    set(v: number) { this.hex = v; },
  },
  needsUpdate: false,
};

// Shader Hatch Material (e.g. Red with 0.70 transparency)
const redHatchShader = {
  userData: {},
  opacity: 0.70,
  transparent: true,
  uniforms: {
    u_color: {
      value: {
        hex: 0xff0000,
        getHex() { return this.hex; },
        set(v: number) { this.hex = v; },
      },
    },
  },
  needsUpdate: false,
};

// Step 3a: Apply monochrome (White background -> Black ink)
applyMonochromeToMaterial(blueLineMaterial, 0x000000);
assert.equal(blueLineMaterial.color.hex, 0x000000, "Çizgi rengi siyah olmalıdır.");
assert.equal(blueLineMaterial.needsUpdate, true, "needsUpdate true olmalıdır.");

applyMonochromeToMaterial(redHatchShader, 0x000000);
assert.equal(redHatchShader.uniforms.u_color.value.hex, 0x000000, "Shader rengi siyah olmalıdır.");
assert.equal(redHatchShader.opacity, 0.70, "Hatch opaklığı 0.70 olarak korunmalıdır.");
assert.equal(redHatchShader.transparent, true, "Hatch şeffaflığı korunmalıdır.");

// Step 3b: Switch background while in monochrome mode (White -> AutoCAD Dark -> White ink)
applyMonochromeToMaterial(blueLineMaterial, 0xffffff);
assert.equal(blueLineMaterial.color.hex, 0xffffff, "Çizgi rengi beyaza güncellenmelidir.");

// Step 3c: Restore source color
restoreSourceMaterialColor(blueLineMaterial);
assert.equal(
  blueLineMaterial.color.hex,
  0x0000ff,
  "Kaynak renge dönüldüğünde mavi renk (0x0000ff) eksiksiz geri gelmelidir."
);
assert.equal(
  blueLineMaterial.userData._cadSourceColor,
  undefined,
  "_cadSourceColor temizlenmiş olmalıdır."
);

restoreSourceMaterialColor(redHatchShader);
assert.equal(
  redHatchShader.uniforms.u_color.value.hex,
  0xff0000,
  "Kaynak renge dönüldüğünde kırmızı renk (0xff0000) eksiksiz geri gelmelidir."
);
assert.equal(redHatchShader.opacity, 0.70, "Hatch opaklığı korunmaya devam etmelidir.");
console.log("  ✓ Kayıpsız geri yükleme testi geçti.");

// --------------------------------------------------------------------------
// 4. Sahne ve StyleManager Taraması Testi
// --------------------------------------------------------------------------
console.log("\n[Test 4] Sahne ve StyleManager toplu tarama testi...");

function createMockMat(initHex: number) {
  return {
    userData: {},
    color: {
      hex: initHex,
      getHex() { return this.hex; },
      set(v: number) { this.hex = v; },
    },
    needsUpdate: false,
  };
}

const pMat1 = createMockMat(0x111111);
const lMat1 = createMockMat(0x00ff00); // Green
const fMat1 = createMockMat(0xffff00); // Yellow
const sMat1 = createMockMat(0xff00ff); // Magenta (scene drawable)

const mockView = {
  renderer: {
    styleManager: {
      pointMgr: { cache: { p1: pMat1 } },
      lineMgr: { cache: { l1: lMat1 } },
      fillMgr: { cache: { f1: fMat1 } },
    },
  },
  internalScene: {
    traverse(callback: (obj: unknown) => void) {
      callback({ material: sMat1 });
    },
  },
  isDirty: false,
};

// Siyah-Beyaz mod uygula (AutoCAD arka planı -> beyaz mürekkep)
const applyRes = applyMonochromeToSceneAndManagers({
  curView: mockView,
  inkColor: 0xffffff,
});

assert.equal(applyRes.processedCount, 4, "4 adet materyal monochrome olarak güncellenmelidir.");
assert.equal(mockView.isDirty, true, "Görüntüleme dirty olarak işaretlenmelidir.");
assert.equal(pMat1.color.hex, 0xffffff);
assert.equal(lMat1.color.hex, 0xffffff);
assert.equal(fMat1.color.hex, 0xffffff);
assert.equal(sMat1.color.hex, 0xffffff);

// Gerçek Renk moduna geri dön
const restoreRes = restoreSourceColorsToSceneAndManagers({
  curView: mockView,
});

assert.equal(restoreRes.restoredCount, 4, "4 adet materyal kaynak rengine geri dönmelidir.");
assert.equal(pMat1.color.hex, 0x111111);
assert.equal(lMat1.color.hex, 0x00ff00);
assert.equal(fMat1.color.hex, 0xffff00);
assert.equal(sMat1.color.hex, 0xff00ff);
console.log("  ✓ Sahne ve StyleManager tarama testi geçti.");

// --------------------------------------------------------------------------
// 5. Destructive CSS Filtresi Olmadığının Denetimi (Contract Test)
// --------------------------------------------------------------------------
console.log("\n[Test 5] adapter.ts içinde yıkıcı CSS filtrelerinin temizlendiğini denetleme...");

const adapterPath = path.resolve(__dirname, "../src/lib/dokumantasyon/cad-upstream/adapter.ts");
const adapterContent = fs.readFileSync(adapterPath, "utf8");

assert.equal(
  adapterContent.includes('grayscale(100%) invert(100%) contrast(150%)'),
  false,
  "adapter.ts içinde eski yıkıcı grayscale/invert/contrast CSS filtresi bulunmamalıdır!"
);
assert.equal(
  adapterContent.includes('grayscale(100%) contrast(150%)'),
  false,
  "adapter.ts içinde eski grayscale/contrast CSS filtresi bulunmamalıdır!"
);
assert.equal(
  adapterContent.includes('applyMonochromeToSceneAndManagers'),
  true,
  "adapter.ts yeni applyMonochromeToSceneAndManagers fonksiyonunu çağırmalıdır."
);
console.log("  ✓ Destructive CSS filtresi sözleşme testi geçti.");

console.log("\n=== TÜM MONOCHROME DOĞRULAMA TESTLERİ BAŞARIYLA GEÇTİ (PASS) ===\n");
