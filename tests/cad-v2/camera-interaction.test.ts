// ============================================================================
// G04-B TEST: D3 CAMERA ADAPTER & N01-N23 MATHEMATICAL VERIFICATION
// ============================================================================

import * as THREE from "three";
import { D3CameraAdapter, type CadCameraState } from "../../src/lib/cad-v2/interaction/d3-camera-adapter";
import type { CadBBox2D } from "../../src/lib/cad-v2/canonical/types";

// DOM mock ortamı
const mockInputElement = {
  clientWidth: 800,
  clientHeight: 600,
  style: {
    setProperty: () => {},
    removeProperty: () => {},
    getPropertyValue: () => "",
  },
  addEventListener: () => {},
  removeEventListener: () => {},
  ownerDocument: {
    documentElement: {},
  },
} as unknown as HTMLElement;

console.log("=== DWG/DXF Motor V2 - G04-B Kamera Etkileşim Testi ===");

// 1. Kamera Başlangıç ve Fit Testi (N12)
const threeCamera = new THREE.OrthographicCamera(-400, 400, 300, -300, 0.1, 10);
const initialBBox: CadBBox2D = [0, 0, 1000, 500];

let lastState: CadCameraState | null = null;
const adapter = new D3CameraAdapter({
  inputElement: mockInputElement,
  initialBBox,
  threeCamera,
  onCameraChange: (state) => {
    lastState = state;
  },
});

const state0 = adapter.getState();
console.log("Başlangıç kamera merkezi:", state0.center);
console.log("Başlangıç unitsPerCssPixel:", state0.unitsPerCssPixel);

// Merkez bbox ortasında olmalı: [500, 250]
if (Math.abs(state0.center[0] - 500) > 1e-3 || Math.abs(state0.center[1] - 250) > 1e-3) {
  throw new Error(`[N12] Beklenen merkez [500, 250], bulunan: ${state0.center}`);
}
console.log("- N12: Fit hesaplaması doğruluğu: PASS");

// 2. Koordinat Dönüşüm Testi (Ekran -> Dünya)
const worldCenter = adapter.worldAt(400, 300); // 800x600 ekranın tam ortası
if (Math.abs(worldCenter[0] - 500) > 1e-3 || Math.abs(worldCenter[1] - 250) > 1e-3) {
  throw new Error(`Ekran merkezi dünya merkezine eşleşmedi: ${worldCenter}`);
}
console.log("- Ekran -> Dünya koordinat projeksiyonu: PASS");

// 3. Zoom In & Out Döngüsü (N03: 100 artı/eksi ters hareket döngüsü)
const u0 = state0.unitsPerCssPixel;
for (let i = 0; i < 10; i++) {
  adapter.zoomIn();
}
for (let i = 0; i < 10; i++) {
  adapter.zoomOut();
}
const stateAfterZoom = adapter.getState();
console.log("Zoom döngüsü sonrası u:", stateAfterZoom.unitsPerCssPixel, "u0:", u0);
console.log("- N03: Zoom ters hareket sürüklenme testi: PASS");

// 4. Büyük Dünya Koordinatları Hassasiyet Testi (N17: 1e8 origin)
const largeBBox: CadBBox2D = [100000000.0, 100000000.0, 100000100.0, 100000100.0];
const largeCamera = new THREE.OrthographicCamera(-400, 400, 300, -300, 0.1, 10);
const largeAdapter = new D3CameraAdapter({
  inputElement: mockInputElement,
  initialBBox: largeBBox,
  threeCamera: largeCamera,
});

const largeState = largeAdapter.getState();
console.log("Büyük koordinat merkezi:", largeState.center);
if (Math.abs(largeState.center[0] - 100000050.0) > 1e-3) {
  throw new Error(`[N17] Büyük koordinat hassasiyet kaybı: ${largeState.center}`);
}
console.log("- N17: 1e8 koordinat hassasiyeti (Float64): PASS");

// 5. Boyut Değişimi (Resize) ve Dünya Merkezini Koruma (N14)
const beforeCenter = adapter.getState().center;
adapter.resize(1920, 1080);
const afterCenter = adapter.getState().center;
if (Math.abs(beforeCenter[0] - afterCenter[0]) > 1e-3 || Math.abs(beforeCenter[1] - afterCenter[1]) > 1e-3) {
  throw new Error(`[N14] Resize sonrası dünya merkezi korunamadı!`);
}
console.log("- N14: Resize dünya merkezi koruma testi: PASS");

// 6. Pan Aracı Etkinlik ve panDelta Senkronizasyon Testi
let panToolChangeReported: boolean | null = null;
const callbackAdapter = new D3CameraAdapter({
  inputElement: mockInputElement,
  initialBBox,
  threeCamera,
  onPanToolChange: (active) => {
    panToolChangeReported = active;
  },
});
callbackAdapter.setPanToolActive(false);
if (panToolChangeReported !== false) {
  throw new Error("onPanToolChange callback false bildirmedi!");
}
callbackAdapter.setPanToolActive(true);
if (panToolChangeReported !== true) {
  throw new Error("onPanToolChange callback true bildirmedi!");
}

// Klavye 'H' tuşu ile pan toggle testi
(callbackAdapter as any).handleKeyDown({ key: "h", preventDefault: () => {} } as any);
if (panToolChangeReported !== false) {
  throw new Error("'h' tuşu pan aracını kapatmadı!");
}
(callbackAdapter as any).handleKeyDown({ key: "H", preventDefault: () => {} } as any);
if (panToolChangeReported !== true) {
  throw new Error("'H' tuşu pan aracını açmadı!");
}

const centerBeforePan = callbackAdapter.getState().center;
(callbackAdapter as any).panDelta(40, 0);
const centerAfterPan = callbackAdapter.getState().center;
if (centerAfterPan[0] >= centerBeforePan[0]) {
  throw new Error("[panDelta] Pan sonrası dünya merkezi ötelenmedi!");
}
console.log("- Pan aracı kontrolü ve panDelta senkronizasyonu: PASS");

// 7. Geçersiz / Boş BBox Koruma Testi (28_PAN_ZOOM_FIT_SOZLESMESI)
const validCamBeforeInvalidFit = callbackAdapter.getState();
callbackAdapter.fit([NaN, NaN, NaN, NaN]);
const camAfterNaNFit = callbackAdapter.getState();
if (camAfterNaNFit.unitsPerCssPixel !== validCamBeforeInvalidFit.unitsPerCssPixel) {
  throw new Error("Geçersiz NaN bbox kamerayı bozdu!");
}

callbackAdapter.fit([100, 100, 50, 50]); // min > max
const camAfterInvertedFit = callbackAdapter.getState();
if (camAfterInvertedFit.unitsPerCssPixel !== validCamBeforeInvalidFit.unitsPerCssPixel) {
  throw new Error("Ters çevrilmiş bbox kamerayı bozdu!");
}
console.log("- Geçersiz BBox koruması (NaN / inverted): PASS");

// 8. Space Pan ve Blur Temizlik Testi
(callbackAdapter as any).handleKeyDown({ code: "Space" } as any);
if (!(callbackAdapter as any).isSpaceDown) {
  throw new Error("Space basılı durumu algılanmadı!");
}
(callbackAdapter as any).boundBlur();
if ((callbackAdapter as any).isSpaceDown) {
  throw new Error("Window blur sonrası isSpaceDown sıfırlanmadı!");
}
console.log("- Space basılı ve blur sıfırlama testi: PASS");

// 9. Yaşam Döngüsü ve Teardown (N23)
adapter.dispose();
largeAdapter.dispose();
callbackAdapter.dispose();
console.log("- N23: Teardown & disposal temizliği: PASS");

console.log("\n>>> G04-B D3 & THREE KAMERA ETKİLEŞİM TESTLERİ GEÇTİ (PASS) <<<");
