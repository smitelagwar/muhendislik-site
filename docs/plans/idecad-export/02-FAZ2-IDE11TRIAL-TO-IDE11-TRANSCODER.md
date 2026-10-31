# Faz 2 — `.ide11trial` $\rightarrow$ Native `.ide11` (`v211220, flag=0`) Binary Transcoder

> **ÖN KOŞUL:** [`01-FAZ1-REA-FORMAT-VE-CRC32-SOZLESMESI.md`](./01-FAZ1-REA-FORMAT-VE-CRC32-SOZLESMESI.md) tamamlanmış ve Çıkış Kapısı `PASS` olmuş olmalıdır.
> **HEDEF:** `src/lib/hsyncad/ide-import/ide11-transcoder.ts` dosyasını oluşturarak `.ide11trial` (`version=211220, encodedFlag=1`) ikili taşıyıcısını ham IEEE-754 `float64` kodlamalı, rastgele dolguları (`16B`) temizlenmiş, `"XX"` kesit etiketleri geri kazanılmış ve CRC32 mühürlü `.ide11` (`version=211220, encodedFlag=0`) formatına dönüştürmek.

---

## 1. REA Dönüşüm Kuralları (`.ide11trial` $\rightarrow$ `.ide11`)

`MUSTAFA SELVİ 1.KISIM.ide11trial` (146,683,236 byte) üzerinde doğrulanmış 6 deterministik dönüşüm adımı:

1. **Kat Başlıkları (`floors` — 6 kat):**
   - `at + length` (`elevation`) ve `at + length + 8` (`height`) offsetlerindeki Blowfish `float64` değerleri IEEE-754 LE `float64`'e çözülür.
   - İlk katın (`hasNativeFloorHeader`) `viewport = at + length + 4` bloğundaki `viewport + 28` (`viewScale`) ve `viewport + 36 .. viewport + 100` (8 adet `float64` görünüm koordinatı) IEEE-754 LE `float64`'e çözülür.
2. **Ortak Geometri Kayıtları (`readNativeGeometry` — 1,349 kayıt = 1,273 eleman + 76 döşeme boşluğu):**
   - `p + 8 .. p + 8 + count * 16` aralığındaki `count` adet `(x, y)` nokta çifti IEEE-754 LE `float64`'e çözülür.
   - `tail + 4` (`nativeZ`) çözülür ve `0.5` ile çarpılarak (`2 * Z -> 1 * Z`) IEEE-754 LE `float64` olarak yazılır.
   - `tail + 12` (`width`) çözülür ve `1 / 3` ile çarpılarak (`3 * width -> 1 * width`) IEEE-754 LE `float64` olarak yazılır.
   - `list0` sonrasındaki **16 byte'lık rastgele dolgu (`padStart .. padStart + 16`) akıştan kesilip çıkarılır (`splice`)**.
   - `rotOffset` (`rotation`) ve `latOffset` (`lateralOffset`) IEEE-754 LE `float64`'e çözülür.
3. **Kirişler (`primitiveType === 5` — 357 kiriş):**
   - `p = c.nameOffset + c.name.length + 1` sonrasında `p + 266` (`height`) ve `p + 298, p + 306, p + 314` (`1.0` çarpanları) IEEE-754 LE `float64`'e çözülür.
   - `p + 322 .. p + 1200` aralığındaki ilk `"XX"` (`03 00 00 00 58 58 00`) dizgesi `${widthCm}/${heightCm}` (ör. `"25/50"`) CP1254 dizgesiyle değiştirilir.
4. **Mimari ve Taşıyıcı Duvarlar (`primitiveType === 2` — 221 duvar; `primitiveType === 17` — 196 perde):**
   - Mimari duvarlarda (`primitiveType === 2`) `p + 266` (`height`) ve `p + 298, p + 306, p + 314` IEEE-754 LE `float64`'e çözülür.
   - Taşıyıcı perdelerde (`primitiveType === 17`) `p + 400 .. p + 1800` aralığındaki iki `"XX"` dizgesi sırasıyla `${lenCm}/${thkCm}` (veya donör `.ide10` kesit etiketi) ve `${name} ${section}` ile değiştirilir.
5. **Döşemeler (`primitiveType === 7` — 159 yüklü döşeme) ve Merdivenler (`primitiveType === 40` — 7 merdiven):**
   - Döşemelerde `p + 485` (`live` $Q$) ve `p + 501` (`dead` $G$) IEEE-754 LE `float64`'e çözülür (`p + 780` tasarım aksları zaten ham IEEE-754 olduğu için korunur).
   - Merdivenlerde `readIdeStairTemplate` tarafından okunan tüm `float64` alanlar Proxy `DataView` ile yakalanıp IEEE-754 LE `float64`'e çözülür; analiz yüzeyi zlib alt-akış başlığındaki (`01 01 01 14 39 03 00`) 3. byte (`subFlag`) `0` yapılır.
6. **Başlık Mühürleme (`sealIdeCarrierHeader`):**
   - `offset 74..77 = 211220`, `offset 78 = 0`, `offset 79..82 = out.byteLength`, `offset 83..86 = computeIdePayloadChecksum(out, 88)`.

---

## 2. Oluşturulacak Dosya: `src/lib/hsyncad/ide-import/ide11-transcoder.ts`

Aşağıdaki kodu **birebir** `src/lib/hsyncad/ide-import/ide11-transcoder.ts` olarak oluştur:

```ts
import { createIdeDataView, hasIdeEncodedNumbers, isIde11SchemaVersion } from "./numeric-codec";
import { encodeCp1254NulString, IDE11_VERSION, sealIdeCarrierHeader } from "./ide-binary-codec";
import { readIdeStairTemplate } from "./stairs";

export interface IdeTranscodeSplice {
  start: number;
  end: number;
  replacement: Uint8Array;
}

export interface IdeTranscodeOptions {
  /** Optional map of nativeId -> section string (e.g. from a paired .ide10 donor or edited IdeProject) */
  wallSectionOverrides?: ReadonlyMap<number, string>;
  /** Optional map of nativeId -> { dead: number; live: number } slab load overrides */
  slabLoadOverrides?: ReadonlyMap<number, { dead: number; live: number }>;
}

const MAX_POINTS = 2048;
const MAX_REFS = 16384;
const MAX_GEOMETRY_BYTES = MAX_POINTS * 16 + MAX_REFS * 4 + 512;

export function collectIde11TrialTransformPlan(
  src: Uint8Array,
  options: IdeTranscodeOptions & { targetVersion: 201094 | 211220 },
): { work: Uint8Array; splices: IdeTranscodeSplice[] } {
  const baseBuf = src.buffer.slice(src.byteOffset, src.byteOffset + src.byteLength);
  const encoded = hasIdeEncodedNumbers(baseBuf);
  const v11Schema = isIde11SchemaVersion(baseBuf);
  if (!v11Schema) {
    throw new Error("Kaynak dosya IDE11 (211220) şemasında değil.");
  }
  const encView = createIdeDataView(baseBuf);
  const work = new Uint8Array(baseBuf.slice(0));
  const workRawView = new DataView(work.buffer, work.byteOffset, work.byteLength);
  const decoder = new TextDecoder("windows-1254");

  const f64Scales = new Map<number, number>();
  const f64Overrides = new Map<number, number>();
  const splices: IdeTranscodeSplice[] = [];

  const markF64 = (offset: number, scale = 1) => {
    if (encoded) f64Scales.set(offset, scale);
  };

  const readString = (at: number): string | undefined => {
    if (at < 0 || at + 4 > src.length) return;
    const length = encView.getUint32(at, true);
    if (length < 1 || length > 161 || at + 4 + length > src.length || src[at + 3 + length] !== 0) return;
    for (let j = at + 4; j < at + 3 + length; j++) {
      if (src[j] < 32 || src[j] === 127 || src[j] === 255) return;
    }
    return decoder.decode(src.subarray(at + 4, at + 3 + length));
  };

  const followsFloorTemplate = (at: number): boolean => {
    if (src[at - 1] !== 0 || src[at - 2] !== 0) return false;
    for (let length = 3; length <= 8; length++) {
      const start = at - 2 - length;
      if (start < 4 || src[start] !== 84 || encView.getUint32(start - 4, true) !== length + 1) continue;
      let digits = true;
      for (let j = start + 1; j < at - 2; j++) if (src[j] < 48 || src[j] > 57) digits = false;
      if (digits) return true;
    }
    return false;
  };

  const hasNativeFloorHeader = (at: number, name: string): boolean => {
    const length = encView.getUint32(at, true), data = at + 4 + length;
    if (data + 100 >= src.length) return false;
    const ordinal = encView.getInt32(data + 16, true), marker = encView.getUint32(data + 24, true);
    if (Math.abs(ordinal) > 1000 || encView.getUint32(data + 20, true) === 0 || (marker !== 0 && marker !== 0xffffffff)) return false;
    const viewport = data + 4;
    const viewScale = encView.getFloat64(viewport + 28, true);
    if (!Number.isFinite(viewScale) || viewScale <= 0 || viewScale > 1000) return false;
    for (let j = 0; j < 4; j++) {
      const a = encView.getFloat64(viewport + 36 + j * 16, true), b = encView.getFloat64(viewport + 44 + j * 16, true);
      if (!Number.isFinite(a) || Math.abs(a) > 1e6 || a !== b) return false;
    }
    for (let p = data + 100; p < Math.min(src.length - 165, data + 1800); p++) {
      const title = readString(p);
      if (title?.startsWith(`${name} TAVANI, `) && / KOTU$/.test(title)) return true;
    }
    return false;
  };

  const candidates: { nameOffset: number; name: string; bbox: number[] }[] = [];
  const floors: { sourceOffset: number }[] = [];

  for (let i = 24; i < src.length - 24; i++) {
    const length = encView.getUint32(i, true);
    if (length < 1 || length > 161 || i + 4 + length + 20 > src.length || src[i + 3 + length] !== 0) continue;
    const text = readString(i);
    if (text === undefined) continue;
    const at = i + 4;
    const isNativeHdr = text ? hasNativeFloorHeader(i, text) : false;
    if (text && (followsFloorTemplate(i) || isNativeHdr)) {
      const elevation = encView.getFloat64(at + length, true), height = encView.getFloat64(at + length + 8, true);
      if (Number.isFinite(elevation) && Math.abs(elevation) <= 1e6 && Number.isFinite(height) && height >= 0.1 && height <= 100) {
        floors.push({ sourceOffset: at });
        markF64(at + length);
        markF64(at + length + 8);
        if (isNativeHdr) {
          const data = at + length;
          const viewport = data + 4;
          markF64(viewport + 28);
          for (let j = 0; j < 8; j++) markF64(viewport + 36 + j * 8);
          if (options.targetVersion === 201094) {
            splices.push({ start: data + 28, end: data + 32, replacement: new Uint8Array(0) });
          }
        }
      }
    }
    if (at < 21) continue;
    const color = encView.getUint32(at + length, true);
    if (color < 999999000 || color > 1000001000) continue;
    const bbox = [0, 1, 2, 3].map(j => encView.getFloat32(at - 21 + j * 4, true));
    if (bbox.some(v => !Number.isFinite(v) || Math.abs(v) > 1e6) || bbox[2] < bbox[0] - 0.00001 || bbox[3] < bbox[1] - 0.00001 || bbox[2] - bbox[0] + bbox[3] - bbox[1] < 1e-8) continue;
    candidates.push({ nameOffset: at, name: text, bbox });
  }

  if (!floors.length) {
    throw new Error("Dönüştürülecek IDE dosyasında kat kaydı bulunamadı.");
  }

  const inspectGeometry = (c: { nameOffset: number; name: string; bbox: number[] }) => {
    const nameOffset = c.nameOffset, bboxOffset = nameOffset - 21;
    const min = Math.max(0, nameOffset - (c.name ? MAX_GEOMETRY_BYTES : 8192));
    const padLen = encoded ? 16 : 0;
    for (let p = bboxOffset - 36; p >= min; p--) {
      const primitiveType = encView.getUint32(p, true), count = encView.getUint32(p + 4, true);
      if (primitiveType < 1 || (primitiveType > 100 && primitiveType !== 123 && primitiveType !== 128) || count < 1 || count > MAX_POINTS || (count === 1 && primitiveType !== 40) || (primitiveType === 40 && count !== 1)) continue;
      if ((primitiveType === 123 || primitiveType === 128) && count !== 2) continue;
      if (!c.name && primitiveType !== 13) continue;
      const tail = p + 8 + count * 16;
      if (tail + 44 + padLen > nameOffset) continue;
      const nativeId = encView.getUint32(tail, true);
      const nativeZ = encView.getFloat64(tail + 4, true) * (encoded ? 0.5 : 1);
      const width = encView.getFloat64(tail + 12, true) * (encoded ? 1 / 3 : 1);
      const layerId = encView.getUint32(tail + 20, true);
      if (nativeId === 0 || !Number.isFinite(nativeZ) || Math.abs(nativeZ) > 1e6 || !Number.isFinite(width) || width < 0 || width > 1000 || layerId > 100000) continue;
      let cursor = tail + 24, valid = true, rotation = 0, padStart = 0, rotOffset = 0;
      for (let list = 0; list < 3; list++) {
        if (cursor + 4 > bboxOffset) { valid = false; break; }
        const length = encView.getUint32(cursor, true);
        cursor += 4;
        if (length > MAX_REFS || cursor + length * 4 > bboxOffset) { valid = false; break; }
        cursor += length * 4;
        if (list === 0) {
          padStart = cursor;
          cursor += padLen;
          if (cursor + 8 > bboxOffset) { valid = false; break; }
          rotOffset = cursor;
          rotation = encView.getFloat64(cursor, true);
          cursor += 8;
        }
      }
      if (!valid || cursor + 8 !== bboxOffset || !Number.isFinite(rotation)) continue;
      const lateralOffset = encView.getFloat64(cursor, true);
      if (!Number.isFinite(lateralOffset) || Math.abs(lateralOffset) > 1000) continue;
      const tolerance = Math.max(0.00002, ...c.bbox.map(v => Math.abs(v) * 2e-7));
      let spread = 0;
      const pts: { x: number; y: number }[] = [];
      for (let j = 0; j < count; j++) {
        const x = encView.getFloat64(p + 8 + j * 16, true), y = encView.getFloat64(p + 16 + j * 16, true);
        if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 1e6 || Math.abs(y) > 1e6 || x < c.bbox[0] - tolerance || x > c.bbox[2] + tolerance || y < c.bbox[1] - tolerance || y > c.bbox[3] + tolerance) { valid = false; break; }
        pts.push({ x, y });
        spread = Math.max(spread, Math.hypot(x - pts[0].x, y - pts[0].y));
      }
      if (!valid || (spread < 1e-8 && primitiveType !== 40)) continue;
      return { primitiveType, count, nativeId, width, points: pts, geometryOffset: p, tail, padStart, padLen, rotOffset, latOffset: cursor };
    }
  };

  const cm = (v: number) => String(Number((v * 100).toFixed(5)));

  for (let idx = 0; idx < candidates.length; idx++) {
    const c = candidates[idx];
    if (c.nameOffset < floors[0].sourceOffset) continue;
    const g = inspectGeometry(c);
    if (!g) continue;
    for (let j = 0; j < g.count; j++) {
      markF64(g.geometryOffset + 8 + j * 16);
      markF64(g.geometryOffset + 16 + j * 16);
    }
    markF64(g.tail + 4, 0.5);
    markF64(g.tail + 12, 1 / 3);
    if (g.padLen > 0) {
      splices.push({ start: g.padStart, end: g.padStart + g.padLen, replacement: new Uint8Array(0) });
    }
    markF64(g.rotOffset);
    markF64(g.latOffset);

    const p = c.nameOffset + c.name.length + 1;
    if (g.primitiveType === 5) {
      // Beam
      if (p + 322 <= src.length && encView.getUint32(p + 262, true) === 1) {
        const height = encView.getFloat64(p + 266, true);
        markF64(p + 266);
        markF64(p + 298);
        markF64(p + 306);
        markF64(p + 314);
        if (Number.isFinite(height) && height > 0.01 && height <= 100) {
          const label = `${cm(g.width)}/${cm(height)}`;
          for (let s = p + 322; s < Math.min(src.length - 10, p + 1200); s++) {
            if (encView.getUint32(s, true) === 3 && src[s + 4] === 0x58 && src[s + 5] === 0x58 && src[s + 6] === 0) {
              splices.push({ start: s, end: s + 7, replacement: encodeCp1254NulString(label) });
              break;
            }
          }
        }
      }
    } else if (g.primitiveType === 2) {
      // Architectural Wall
      if (p + 322 <= src.length && encView.getUint32(p + 262, true) === 119) {
        markF64(p + 266);
        if (options.targetVersion === 201094) {
          work.fill(0, p + 274, p + 298);
        }
        markF64(p + 298);
        markF64(p + 306);
        markF64(p + 314);
      }
    } else if (g.primitiveType === 17 && g.points.length === 2 && g.width > 0) {
      // Structural Wall: restore the two "XX" strings after p + 400
      const dx = g.points[1].x - g.points[0].x, dy = g.points[1].y - g.points[0].y;
      const horizontal = Math.abs(dy) < 1e-7, vertical = Math.abs(dx) < 1e-7;
      const overrideSection = options.wallSectionOverrides?.get(g.nativeId);
      let section = overrideSection;
      if (!section && (horizontal !== vertical)) {
        const lenCm = Math.round(Math.hypot(dx, dy) * 100);
        const thkCm = Math.round(g.width * 100);
        section = horizontal ? `${lenCm}/${thkCm}` : `${thkCm}/${lenCm}`;
      }
      if (section) {
        const end = Math.min(src.length - 10, p + 1400);
        const xxOffsets: number[] = [];
        for (let s = p + 400; s < end; s++) {
          if (encView.getUint32(s, true) === 3 && src[s + 4] === 0x58 && src[s + 5] === 0x58 && src[s + 6] === 0) {
            xxOffsets.push(s);
            if (xxOffsets.length === 2) break;
          }
        }
        if (xxOffsets.length === 2) {
          splices.push({ start: xxOffsets[0], end: xxOffsets[0] + 7, replacement: encodeCp1254NulString(section) });
          splices.push({ start: xxOffsets[1], end: xxOffsets[1] + 7, replacement: encodeCp1254NulString(`${c.name} ${section}`) });
        }
      }
    } else if (g.primitiveType === 7) {
      // Slab
      if (p + 519 <= src.length && encView.getUint32(p + 470, true) === 36) {
        markF64(p + 485);
        markF64(p + 501);
        const loadOverride = options.slabLoadOverrides?.get(g.nativeId);
        if (loadOverride) {
          f64Overrides.set(p + 485, loadOverride.live);
          f64Overrides.set(p + 501, loadOverride.dead);
        }
        if (options.targetVersion === 201094) {
          splices.push({ start: p + 470, end: p + 474, replacement: new Uint8Array(0) });
        }
      }
    } else if (g.primitiveType === 40) {
      // Stair
      const tempOffsets: number[] = [];
      const proxyView = new Proxy(encView, {
        get(target, prop) {
          if (prop === "getFloat64") {
            return (off: number, le?: boolean) => {
              tempOffsets.push(off);
              return target.getFloat64(off, le);
            };
          }
          const val = Reflect.get(target, prop);
          return typeof val === "function" ? val.bind(target) : val;
        },
      });
      const tpl = readIdeStairTemplate(src, proxyView, c.nameOffset, c.name.length + 1);
      if (tpl) {
        for (const off of tempOffsets) markF64(off);
        const end = Math.min(src.length, tpl.endOffset + 2_000_000);
        for (let at = tpl.endOffset; at + 15 < end; at++) {
          if (work[at] === 1 && work[at + 1] === 1 && (work[at + 2] === 1 || work[at + 2] === 0) && encView.getUint32(at + 3, true) === 211220 && work[at + 15] === 0x78) {
            work[at + 2] = 0;
            workRawView.setUint32(at + 3, options.targetVersion, true);
            break;
          }
        }
      }
    }
  }

  for (const [off, scale] of f64Scales) {
    workRawView.setFloat64(off, encView.getFloat64(off, true) * scale, true);
  }
  for (const [off, val] of f64Overrides) {
    workRawView.setFloat64(off, val, true);
  }

  return { work, splices };
}

export function applyIdeBinarySplices(work: Uint8Array, splices: IdeTranscodeSplice[]): Uint8Array {
  const ordered = [...splices].sort((a, b) => a.start - b.start);
  let totalDelta = 0;
  let prevEnd = 0;
  for (const sp of ordered) {
    if (sp.start < prevEnd) {
      throw new Error(`Çakışan ikili yama aralığı: ${sp.start} < ${prevEnd}`);
    }
    totalDelta += sp.replacement.byteLength - (sp.end - sp.start);
    prevEnd = sp.end;
  }
  const out = new Uint8Array(work.byteLength + totalDelta);
  let r = 0, w = 0;
  for (const sp of ordered) {
    if (sp.start > r) {
      out.set(work.subarray(r, sp.start), w);
      w += sp.start - r;
    }
    if (sp.replacement.byteLength > 0) {
      out.set(sp.replacement, w);
      w += sp.replacement.byteLength;
    }
    r = sp.end;
  }
  if (r < work.byteLength) {
    out.set(work.subarray(r), w);
  }
  return out;
}

/**
 * Converts a .ide11trial (or .ide11) buffer into a clean, unencoded .ide11 (version 211220, encodedFlag=0) binary.
 */
export function transcodeIde11TrialToIde11(
  sourceBuffer: ArrayBuffer | Uint8Array,
  options: IdeTranscodeOptions = {},
): Uint8Array {
  const src = sourceBuffer instanceof Uint8Array
    ? sourceBuffer
    : new Uint8Array(sourceBuffer);
  const { work, splices } = collectIde11TrialTransformPlan(src, {
    ...options,
    targetVersion: IDE11_VERSION,
  });
  const out = applyIdeBinarySplices(work, splices);
  return sealIdeCarrierHeader(out, {
    formatVersion: IDE11_VERSION,
    encodedFlag: 0,
  });
}
```

---

## 3. Faz 2 Çıkış Kapısı (Exit Gate)

Aşağıdaki komutu çalıştır; `MUSTAFA SELVİ 1.KISIM.ide11trial` dosyasından üretilen `.ide11` çıktısı `parseIde10` ile okunduğunda **6 kat, 1,273 eleman, 159 döşeme yükü, 357 kiriş kesiti, 196 perde kesiti, 221 mimari duvar yüksekliği, 7 merdiven ağı, 76 boşluk ve geçerli CRC32** vermelidir:

```powershell
@'
import fs from "node:fs";
import assert from "node:assert/strict";
import { transcodeIde11TrialToIde11 } from "./src/lib/hsyncad/ide-import/ide11-transcoder.ts";
import { verifyIdeHeaderChecksum } from "./src/lib/hsyncad/ide-import/ide-binary-codec.ts";
import { parseIde10 } from "./src/lib/hsyncad/ide-import/index.ts";

const cfg = JSON.parse(fs.readFileSync(".data/hsyncad/ide-examples.json", "utf8"));
const trialBytes = new Uint8Array(fs.readFileSync(cfg["mustafa-selvi-1-trial"]));
const ide11Bytes = transcodeIde11TrialToIde11(trialBytes);

assert.equal(verifyIdeHeaderChecksum(ide11Bytes).valid, true, "CRC32 must be valid");
const view = new DataView(ide11Bytes.buffer, ide11Bytes.byteOffset, ide11Bytes.byteLength);
assert.equal(view.getUint32(74, true), 211220);
assert.equal(ide11Bytes[78], 0);
assert.equal(view.getUint32(79, true), ide11Bytes.byteLength);

const parsed = parseIde10(ide11Bytes.buffer.slice(ide11Bytes.byteOffset, ide11Bytes.byteOffset + ide11Bytes.byteLength), "mustafa-selvi-1.ide11");
assert.equal(parsed.format, "ide11");
assert.equal(parsed.floors.length, 6);
assert.equal(parsed.elements.length, 1273);
assert.equal(parsed.coverage.unsupportedRecords, 0);
assert.equal(parsed.coverage.holeRecords, 76);
assert.equal(parsed.elements.filter(e => e.planAnnotation?.loads).length, 159);
assert.equal(parsed.elements.filter(e => e.type === "beam" && e.sectionLabel).length, 357);
assert.equal(parsed.elements.filter(e => e.type === "wall" && e.structural && e.planAnnotation?.section).length, 196);
assert.equal(parsed.elements.filter(e => e.type === "stair" && e.mesh).length, 7);
console.log("FAZ 2 EXIT GATE: PASS");
'@ | npx tsx -
```
