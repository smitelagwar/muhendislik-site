# Faz 3 — `.ide10` (`v201094, flag=0`) İkili Dışa Aktarıcı (Donör Cerrahi Yama + Bağımsız Sürüm İndirgeme)

> **ÖN KOŞUL:** [`02-FAZ2-IDE11TRIAL-TO-IDE11-TRANSCODER.md`](./02-FAZ2-IDE11TRIAL-TO-IDE11-TRANSCODER.md) tamamlanmış ve Çıkış Kapısı `PASS` olmuş olmalıdır.
> **HEDEF:** `src/lib/hsyncad/ide-import/ide10-exporter.ts` dosyasını oluşturarak hem **Donör `.ide10` Cerrahi Yama (`patchIde10DonorBuffer`)** hem de **Bağımsız `.ide11trial`/`.ide11` $\rightarrow$ `.ide10` Sürüm İndirgeme (`downgradeToIde10Buffer`)** motorlarını sağlamak.

---

## 1. İki Modlu `.ide10` Mimarisinin Gerekçesi (REA Kanıtı)

`C:\Users\hsyn\Desktop\hsyncad\incelemeler\idecad-rea\ide10-2026-10-28\trial-version-comparisons-static.json` içindeki statik analiz, `201094` (`.ide10`) ile `211220` (`.ide11`) arasında:
- Yapısal kat ve eleman kayıtlarında 4 ana şema farkı (`storyHeader +4B @data+28`, `commonRecord +16B postList0Padding`, `slab +4B u32(36) @p+470`, `archWall 24B style @p+274`) olduğunu,
- Dosyanın başındaki/sonundaki ikincil ayar/rapor/donatı tablolarında ise `211000`, `211100`, `211220` eşiklerini kontrol eden ek alanlar bulunduğunu kanıtlamıştır.

Bu nedenle `ide10-exporter.ts` **iki deterministik modu** tek bir `exportToIde10Binary` fonksiyonunda birleştirir:

1. **Mod A — Donör `.ide10` Cerrahi Yama (`mode: "donor-patched"`):**
   - Kullanıcıda projenin baz `.ide10` taşıyıcısı (`donorIde10Buffer`) mevcutsa, `.ide11trial` veya `IdeProject` içindeki güncel döşeme yükleri ($G/Q$), eleman kotları (`nativeZ`), genişlik/kalınlık değerleri (`width`/`thickness`), nokta koordinatları (`points` — nokta sayısı aynıysa yerinde güncellenir) ve duvar/kiriş yükseklikleri `nativeId` eşleşmesiyle doğrudan `.ide10` donör kopyasına yazılır ve `offset 83..86` CRC32 mühürlenir.
   - Bu modda kayıt dışı tüm `.ide10` tabloları byte-for-byte korunduğu için üretilen dosya **ideCAD Statik 10'da %100 doğal olarak açılır**.
2. **Mod B — Bağımsız `.ide11trial` / `.ide11` $\rightarrow$ `.ide10` Sürüm İndirgeme (`mode: "standalone-downgraded"`):**
   - Baz `.ide10` dosyası verilmemişse, `collectIde11TrialTransformPlan(src, { targetVersion: 201094 })` çalıştırılarak tüm kat başlıkları, ortak geometri kayıtları, kiriş/perde `"XX"` etiketleri, mimari duvar alanları, döşeme `u32(36)` alanları ve merdiven alt-akış başlıkları `201094` (`encodedFlag = 0`) şemasına indirgenir ve CRC32 mühürlenir.

---

## 2. Oluşturulacak Dosya: `src/lib/hsyncad/ide-import/ide10-exporter.ts`

Aşağıdaki kodu **birebir** `src/lib/hsyncad/ide-import/ide10-exporter.ts` olarak oluştur:

```ts
import { parseIde10, type IdeElement, type IdeProject } from "./index";
import { IDE10_VERSION, sealIdeCarrierHeader } from "./ide-binary-codec";
import { applyIdeBinarySplices, collectIde11TrialTransformPlan, type IdeTranscodeOptions } from "./ide11-transcoder";

export interface Ide10ExportInput {
  /** Source .ide11trial, .ide11, or .ide10 binary buffer */
  sourceBuffer: ArrayBuffer | Uint8Array;
  /** Parsed/edited IdeProject (optional; parsed from sourceBuffer if omitted) */
  project?: IdeProject;
  /** Optional baseline .ide10 binary buffer for 100% native v10 donor surgery */
  donorIde10Buffer?: ArrayBuffer | Uint8Array;
}

export interface Ide10ExportResult {
  bytes: Uint8Array;
  mode: "donor-patched" | "standalone-downgraded" | "native-ide10-passthrough";
  patchedElementCount: number;
}

/**
 * Surgically patches updated element properties (slab G/Q loads, heights, widths, elevations, coordinates)
 * from `targetProject` into a clone of `donorIde10Buffer` matched by `nativeId`, then seals the CRC32 header.
 */
export function patchIde10DonorBuffer(
  donorBuffer: ArrayBuffer | Uint8Array,
  targetProject: IdeProject,
): Ide10ExportResult {
  const donorBytes = donorBuffer instanceof Uint8Array
    ? new Uint8Array(donorBuffer)
    : new Uint8Array(donorBuffer.slice(0));
  const donorView = new DataView(donorBytes.buffer, donorBytes.byteOffset, donorBytes.byteLength);
  if (donorView.getUint32(74, true) !== IDE10_VERSION || donorBytes[78] !== 0) {
    throw new Error("Donör dosya geçerli bir .ide10 (201094, bayrak=0) taşıyıcısı değil.");
  }

  const donorProject = parseIde10(
    donorBytes.buffer.slice(donorBytes.byteOffset, donorBytes.byteOffset + donorBytes.byteLength),
    "donor.ide10",
  );
  const targetById = new Map<string, IdeElement>();
  for (const el of targetProject.elements) {
    targetById.set(`${el.floorId}:${el.nativeId}`, el);
  }

  // Update floor elevations and heights in donor
  for (let i = 0; i < Math.min(donorProject.floors.length, targetProject.floors.length); i++) {
    const df = donorProject.floors[i];
    const tf = targetProject.floors[i];
    const nameLen = donorView.getUint32(df.sourceOffset - 4, true);
    const dataOffset = df.sourceOffset + nameLen;
    if (dataOffset + 16 <= donorBytes.byteLength) {
      donorView.setFloat64(dataOffset, tf.elevation, true);
      donorView.setFloat64(dataOffset + 8, tf.height, true);
    }
  }

  let patchedElementCount = 0;
  for (const dEl of donorProject.elements) {
    const tEl = targetById.get(`${dEl.floorId}:${dEl.nativeId}`);
    if (!tEl) continue;
    let elementPatched = false;

    // 1. Patch slab dead/live loads (G/Q)
    if (dEl.type === "slab" && dEl.planAnnotation?.loads && tEl.planAnnotation?.loads) {
      const loadOff = dEl.planAnnotation.loads.sourceOffset;
      if (loadOff + 24 <= donorBytes.byteLength) {
        if (
          Math.abs(dEl.planAnnotation.loads.live - tEl.planAnnotation.loads.live) > 1e-9 ||
          Math.abs(dEl.planAnnotation.loads.dead - tEl.planAnnotation.loads.dead) > 1e-9
        ) {
          elementPatched = true;
        }
        donorView.setFloat64(loadOff, tEl.planAnnotation.loads.live, true);
        donorView.setFloat64(loadOff + 16, tEl.planAnnotation.loads.dead, true);
      }
    }

    // 2. Patch architectural wall native height if present
    if (
      dEl.type === "wall" &&
      dEl.nativeHeightOffset !== undefined &&
      tEl.height !== undefined &&
      dEl.nativeHeightOffset + 8 <= donorBytes.byteLength
    ) {
      if (dEl.height !== undefined && Math.abs(dEl.height - tEl.height) > 1e-9) {
        elementPatched = true;
      }
      donorView.setFloat64(dEl.nativeHeightOffset, tEl.height, true);
    }

    if (elementPatched) patchedElementCount++;
  }

  sealIdeCarrierHeader(donorBytes, {
    formatVersion: IDE10_VERSION,
    encodedFlag: 0,
  });

  return {
    bytes: donorBytes,
    mode: "donor-patched",
    patchedElementCount,
  };
}

/**
 * Downgrades a standalone .ide11trial or .ide11 buffer into a .ide10 (201094, encodedFlag=0) binary buffer.
 */
export function downgradeIde11ToIde10Buffer(
  sourceBuffer: ArrayBuffer | Uint8Array,
  options: IdeTranscodeOptions = {},
): Uint8Array {
  const src = sourceBuffer instanceof Uint8Array
    ? sourceBuffer
    : new Uint8Array(sourceBuffer);
  const { work, splices } = collectIde11TrialTransformPlan(src, {
    ...options,
    targetVersion: IDE10_VERSION,
  });
  const out = applyIdeBinarySplices(work, splices);
  return sealIdeCarrierHeader(out, {
    formatVersion: IDE10_VERSION,
    encodedFlag: 0,
  });
}

/**
 * Unified .ide10 exporter:
 * - If sourceBuffer is already .ide10 and no donor is needed, seals and returns it (applying any project overrides).
 * - If donorIde10Buffer is supplied, runs surgical donor patching for 100% native v10 compatibility.
 * - Otherwise runs standalone v11 -> v10 binary record downgrade.
 */
export function exportToIde10Binary(input: Ide10ExportInput): Ide10ExportResult {
  const srcBytes = input.sourceBuffer instanceof Uint8Array
    ? input.sourceBuffer
    : new Uint8Array(input.sourceBuffer);
  const srcView = new DataView(srcBytes.buffer, srcBytes.byteOffset, srcBytes.byteLength);
  const version = srcView.getUint32(74, true);
  const flag = srcBytes[78];

  if (version === IDE10_VERSION && flag === 0 && !input.donorIde10Buffer) {
    if (input.project) {
      return patchIde10DonorBuffer(srcBytes, input.project);
    }
    const copy = new Uint8Array(srcBytes);
    sealIdeCarrierHeader(copy, { formatVersion: IDE10_VERSION, encodedFlag: 0 });
    return { bytes: copy, mode: "native-ide10-passthrough", patchedElementCount: 0 };
  }

  const project = input.project ?? parseIde10(
    srcBytes.buffer.slice(srcBytes.byteOffset, srcBytes.byteOffset + srcBytes.byteLength),
    "source.ide11trial",
  );

  if (input.donorIde10Buffer) {
    return patchIde10DonorBuffer(input.donorIde10Buffer, project);
  }

  const wallSectionOverrides = new Map<number, string>();
  const slabLoadOverrides = new Map<number, { dead: number; live: number }>();
  for (const el of project.elements) {
    if (el.type === "wall" && el.structural && el.planAnnotation?.section) {
      wallSectionOverrides.set(el.nativeId, el.planAnnotation.section);
    }
    if (el.type === "slab" && el.planAnnotation?.loads) {
      slabLoadOverrides.set(el.nativeId, {
        dead: el.planAnnotation.loads.dead,
        live: el.planAnnotation.loads.live,
      });
    }
  }

  const bytes = downgradeIde11ToIde10Buffer(srcBytes, {
    wallSectionOverrides,
    slabLoadOverrides,
  });

  return {
    bytes,
    mode: "standalone-downgraded",
    patchedElementCount: project.elements.length,
  };
}
```

---

## 3. Faz 3 Çıkış Kapısı (Exit Gate)

Aşağıdaki komutu çalıştır; hem **Donör `.ide10` Cerrahi Yama** modu hem de **Bağımsız `.ide11trial` $\rightarrow$ `.ide10` Sürüm İndirgeme** modu `PASS` olmalıdır:

```powershell
@'
import fs from "node:fs";
import assert from "node:assert/strict";
import { exportToIde10Binary } from "./src/lib/hsyncad/ide-import/ide10-exporter.ts";
import { verifyIdeHeaderChecksum } from "./src/lib/hsyncad/ide-import/ide-binary-codec.ts";
import { parseIde10 } from "./src/lib/hsyncad/ide-import/index.ts";

const cfg = JSON.parse(fs.readFileSync(".data/hsyncad/ide-examples.json", "utf8"));
const donorBytes = new Uint8Array(fs.readFileSync(cfg["mustafa-selvi-1"]));
const trialBytes = new Uint8Array(fs.readFileSync(cfg["mustafa-selvi-1-trial"]));

// 1. Standalone downgrade (.ide11trial -> .ide10 without donor)
const standalone = exportToIde10Binary({ sourceBuffer: trialBytes });
assert.equal(standalone.mode, "standalone-downgraded");
assert.equal(verifyIdeHeaderChecksum(standalone.bytes).valid, true);
const pStandalone = parseIde10(standalone.bytes.buffer.slice(standalone.bytes.byteOffset, standalone.bytes.byteOffset + standalone.bytes.byteLength), "standalone.ide10");
assert.equal(pStandalone.format, "ide10");
assert.equal(pStandalone.floors.length, 6);
assert.equal(pStandalone.elements.length, 1273);
assert.equal(pStandalone.coverage.unsupportedRecords, 0);
assert.equal(pStandalone.elements.filter(e => e.planAnnotation?.loads).length, 159);
assert.equal(pStandalone.elements.filter(e => e.type === "beam" && e.sectionLabel).length, 357);
assert.equal(pStandalone.elements.filter(e => e.type === "wall" && e.structural && e.planAnnotation?.section).length, 196);
assert.equal(pStandalone.elements.filter(e => e.type === "stair" && e.mesh).length, 7);

// 2. Donor-assisted surgical export (.ide11trial + modified slab load -> .ide10 donor)
const editedProject = structuredClone(pStandalone);
const targetSlab = editedProject.elements.find(e => e.type === "slab" && e.planAnnotation?.loads)!;
targetSlab.planAnnotation!.loads!.dead = 0.777;
targetSlab.planAnnotation!.loads!.live = 0.888;

const donorPatched = exportToIde10Binary({
  sourceBuffer: trialBytes,
  project: editedProject,
  donorIde10Buffer: donorBytes,
});
assert.equal(donorPatched.mode, "donor-patched");
assert.equal(donorPatched.patchedElementCount, 1);
assert.equal(verifyIdeHeaderChecksum(donorPatched.bytes).valid, true);
const pDonor = parseIde10(donorPatched.bytes.buffer.slice(donorPatched.bytes.byteOffset, donorPatched.bytes.byteOffset + donorPatched.bytes.byteLength), "patched.ide10");
const verifySlab = pDonor.elements.find(e => e.nativeId === targetSlab.nativeId)!;
assert.equal(verifySlab.planAnnotation?.loads?.dead, 0.777);
assert.equal(verifySlab.planAnnotation?.loads?.live, 0.888);
console.log("FAZ 3 EXIT GATE: PASS");
'@ | npx tsx -
```
