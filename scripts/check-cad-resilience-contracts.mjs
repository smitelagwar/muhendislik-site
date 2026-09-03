#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

console.log("[check-cad-resilience-contracts] Testing CAD engine resilience, version locks, and sequential open safety...");

// 1. MLightCAD ve CAD kütüphane sürüm kilitlerinin doğrulanması
{
  const pkgRaw = await readFile(join(root, "package.json"), "utf8");
  const pkg = JSON.parse(pkgRaw);

  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  assert.equal(
    deps["@mlightcad/cad-simple-viewer"],
    "1.6.2",
    "@mlightcad/cad-simple-viewer sürümü 1.6.2 olarak kilitli kalmalıdır"
  );
  assert.equal(
    deps["@mlightcad/data-model"],
    "1.14.2",
    "@mlightcad/data-model sürümü 1.14.2 olarak kilitli kalmalıdır"
  );
  assert.equal(
    deps["@mlightcad/libredwg-converter"],
    "3.14.2",
    "@mlightcad/libredwg-converter sürümü 3.14.2 olarak kilitli kalmalıdır"
  );
  assert.equal(
    deps["dxf-viewer"],
    "^1.0.48",
    "dxf-viewer sürümü ^1.0.48 olarak kilitli kalmalıdır"
  );
}
console.log("  [1/3] MLightCAD ve CAD bağımlılık sürüm kilitleri doğrulandı.");

// 2. adapter.ts içindeki hata ve ardışık açılış güvenliği kontratı
{
  const adapterSource = await readFile(
    join(root, "src", "lib", "dokumantasyon", "cad-upstream", "adapter.ts"),
    "utf8"
  );

  // < 64 byte bozuk/kesik dosya koruması
  assert.ok(
    adapterSource.includes("corrupt-truncated"),
    "adapter.ts içinde corrupt-truncated koruması mevcut olmalıdır"
  );
  assert.ok(
    adapterSource.includes("bytes.byteLength < 64"),
    "64 byte altı kesik dosya denetimi bulunmalıdır"
  );

  // Temiz teardown mekanizması
  assert.ok(
    adapterSource.includes("async destroy(): Promise<void>"),
    "destroy() metodu mevcut olmalıdır"
  );
  assert.ok(
    adapterSource.includes("this.initialLayerSnapshot.clear()"),
    "destroy() katman snapshot'ını temizlemelidir"
  );
  assert.ok(
    adapterSource.includes("this.snapEngine.clear()"),
    "destroy() snap engine durumunu sıfırlamalıdır"
  );
}
console.log("  [2/3] Bozuk dosya ve ardışık açılış teardown kontratı doğrulandı.");

// 3. Korunan Alanların Denetimi (Section 4.3)
{
  const adapterSource = await readFile(
    join(root, "src", "lib", "dokumantasyon", "cad-upstream", "adapter.ts"),
    "utf8"
  );

  // Pan / Zoom kamera kontrolleri
  assert.ok(
    adapterSource.includes("CAD_MOBILE_PINCH_ZOOM_SPEED = 1"),
    "Pinch zoom hızı korunmalıdır"
  );
  // Ölçüm kontrolcüleri
  assert.ok(
    adapterSource.includes("CadPressHoldDistanceController"),
    "Mesafe ölçümü korunmalıdır"
  );
  assert.ok(
    adapterSource.includes("CadChainDistanceController"),
    "Zincir mesafe ölçümü korunmalıdır"
  );
  assert.ok(
    adapterSource.includes("CadAreaMeasurementController"),
    "Alan ölçümü korunmalıdır"
  );
  // Katman görünürlüğü
  assert.ok(
    adapterSource.includes("setLayerVisible"),
    "Katman görünürlük kontrolü korunmalıdır"
  );
}
console.log("  [3/3] Korunan kritik CAD motor alanları doğrulandı.");

console.log("[check-cad-resilience-contracts] OK: Tüm dayanıklılık ve sürüm kilidi kontratları başarıyla geçti.");
