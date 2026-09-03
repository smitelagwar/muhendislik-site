#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

console.log("[check-cad-hatch-shader-contract] Validating hatch shader patch contract...");

// 1. Upstream @mlightcad/three-renderer içindeki ham shader imzasını kontrol et
const upstreamShaderPath = join(
  root,
  "node_modules",
  "@mlightcad",
  "three-renderer",
  "lib",
  "style",
  "AcTrHatchPatternShaders.js"
);

const upstreamSource = await readFile(upstreamShaderPath, "utf8");
const TARGET_SHADER_SIGNATURE = "gl_FragColor = vec4(u_color * total, 1.0);";

assert.ok(
  upstreamSource.includes(TARGET_SHADER_SIGNATURE),
  `Upstream shader imzası değişmiş veya bulunamadı! Aranan: '${TARGET_SHADER_SIGNATURE}' in ${upstreamShaderPath}`
);
console.log("  [1/3] Upstream AcTrHatchPatternShaders.js içinde beklenen shader imzası doğrulandı.");

// 2. adapter.ts içindeki monkey patch yapısını doğrula
const adapterPath = join(root, "src", "lib", "dokumantasyon", "cad-upstream", "adapter.ts");
const adapterSource = await readFile(adapterPath, "utf8");

assert.ok(
  adapterSource.includes("threeRenderer.AcTrStyleManager?.prototype?.getFillMaterial"),
  "adapter.ts içinde AcTrStyleManager.prototype.getFillMaterial patch noktası bulunmalıdır"
);

assert.ok(
  adapterSource.includes(TARGET_SHADER_SIGNATURE),
  `adapter.ts hedef shader imzasını ('${TARGET_SHADER_SIGNATURE}') içermelidir`
);

const REPLACEMENT_SHADER_SIGNATURE = "gl_FragColor = vec4(u_color, total * 0.70);";
assert.ok(
  adapterSource.includes(REPLACEMENT_SHADER_SIGNATURE),
  `adapter.ts değiştirilecek shader imzasını ('${REPLACEMENT_SHADER_SIGNATURE}') içermelidir`
);

assert.ok(
  adapterSource.includes("mat.transparent = true"),
  "adapter.ts mat.transparent = true atamasını içermelidir"
);
console.log("  [2/3] adapter.ts monkey-patch kuralı ve imza hedefi doğrulandı.");

// 3. Patch mantığının simülasyonu ve doğrulaması
{
  const mockShaderMaterial = {
    transparent: false,
    fragmentShader: `
      void main() {
        float total = 1.0;
        gl_FragColor = vec4(u_color * total, 1.0);
        #include <colorspace_fragment>
      }
    `,
  };

  if (mockShaderMaterial.fragmentShader.includes(TARGET_SHADER_SIGNATURE)) {
    mockShaderMaterial.transparent = true;
    mockShaderMaterial.fragmentShader = mockShaderMaterial.fragmentShader.replace(
      TARGET_SHADER_SIGNATURE,
      REPLACEMENT_SHADER_SIGNATURE
    );
  }

  assert.equal(mockShaderMaterial.transparent, true, "Patch sonrasında material transparent olmalıdır");
  assert.ok(
    mockShaderMaterial.fragmentShader.includes(REPLACEMENT_SHADER_SIGNATURE),
    "Patch sonrasında 0.70 alpha shader'a enjekte edilmiş olmalıdır"
  );
  assert.ok(
    !mockShaderMaterial.fragmentShader.includes(TARGET_SHADER_SIGNATURE),
    "Eski 1.0 alpha shader kodu kalmamalıdır"
  );
}
console.log("  [3/3] Hatch shader replacement simülasyonu başarıyla doğrulandı.");

console.log("[check-cad-hatch-shader-contract] OK: Hatch shader patch kontratı tam ve sağlam.");
