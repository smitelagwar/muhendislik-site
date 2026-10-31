# Faz 1 — REA İkili Format Sözleşmesi, CRC32 Mühürleme ve `parseIde10` `.ide11` Desteği

> **ÖN KOŞUL:** [`00-MASTER-YOL-HARITASI.md`](./00-MASTER-YOL-HARITASI.md) okunmuş olmalıdır.
> **HEDEF:** Header CRC32 (`offset 83..86`), CP1254 metin kodlayıcı, Blowfish ters-kodlayıcı (`encodeIdeNumericBlock`) ve `src/lib/hsyncad/ide-import/` içindeki okuyucuların `schemaVersion` (`201094` vs `211220`) ile `encodedFlag` (`0` vs `1`) ayrımını tam desteklemesi.

---

## 1. REA Kanıt Özeti (Statik Disassembly Doğrulaması)

1. **Dosya Başlığı (`0x951be0` okuyucu / `0x706c70` yazıcı finalize):**
   - `bytes[0..73]` (74 byte): `"IDE BUILDING DESIGNER PROJECT FILE\r\nVer 4 SubVer 00\r\nCopyright IDE YAPI\r\n\0"`
   - `bytes[74..77]` (`u32` LE): Format sürümü (`201094` = `.ide10`, `211220` = `.ide11` ve `.ide11trial`).
   - `bytes[78]` (`u8`): `encodedFlag` (`0` = `.ide10` ve `.ide11`, `1` = `.ide11trial`).
   - `bytes[79..82]` (`u32` LE): Toplam dosya byte uzunluğu (`bytes.byteLength`).
   - `bytes[83..86]` (`u32` LE): `0x706ff0` fonksiyonu tarafından `bytes[88..EOF]` aralığı üzerinden hesaplanan **bit düzeyinde ters çevrilmiş (bitwise NOT) IEEE 802.3 CRC32** değeri:
     $$\text{checksum} = (\sim \operatorname{CRC32}(\text{bytes}[88\dots\text{EOF}])) \ggg 0$$
     *(4 örnek dosyada %100 doğrulandı: `mustafa-selvi-1.ide10` = `2288986332`, `mustafa-selvi-1.ide11trial` = `1290201066`, `mustafa-selvi-2.ide10` = `3893038269`, `suheyla-kara.ide10` = `1626407899`).*
   - `bytes[87]` (`u8`): `0x00`.
2. **Şema Sürümü (`v11Schema: version >= 211150`) vs Sayısal Kodlama (`encoded: flag === 1`):**
   - `.ide11` (`version = 211220, encodedFlag = 0`) dosyasında:
     - **Şema (`v11Schema = true`)**: Kat başlığında `data + 28` önünde `+4` byte (`211150`), döşemede `p + 470` offsetinde `u32(36)` (`shift = 4`), kirişte `p + 274` offsetinde `[21, 61, 25004, 10049, 1, 1]`, mimari duvarda `p + 274` offsetinde `[98, 70, 25035, 10062, 1, 1]` bulunur.
     - **Sayısal Kodlama (`encoded = false`)**: Tüm `float64` alanlar standart IEEE-754 LE'dir; `readNativeGeometry` içinde `nativeZ` çarpanı `1.0`, `width` çarpanı `1.0` ve `list === 0` sonrasındaki `16` byte rastgele dolgu `0` byte'tır (`cursor += 0`).

---

## 2. Yapılacak Değişiklikler (Sıfır Seçenek)

### Adım 1.1: `src/lib/hsyncad/ide-import/numeric-codec.ts` Güncellemesi

`src/lib/hsyncad/ide-import/numeric-codec.ts` dosyasının sonuna (`createIdeDataView` fonksiyonunun altına) aşağıdaki 3 fonksiyonu birebir ekle:

```ts
export function isIde11SchemaVersion(buffer: ArrayBuffer): boolean {
  const header = new DataView(buffer);
  return header.byteLength >= 83 && header.getUint32(74, true) >= 211150;
}

/** Encode one 8-byte IEEE-754 float64 block using the inverse of decodeIdeNumericBlock. */
export function encodeIdeNumericBlock(source: DataView, byteOffset = 0): Uint8Array<ArrayBuffer> {
  DataView.prototype.getFloat64.call(source, byteOffset, true);
  const offset = Math.trunc(Number(byteOffset)) || 0;
  let left = source.getUint32(offset, false), right = source.getUint32(offset + 4, false);
  for (let i = 0; i < 16; i++) {
    left = (left ^ P[i]) >>> 0;
    right = (right ^ f(left)) >>> 0;
    [left, right] = [right, left];
  }
  [left, right] = [right, left];
  right = (right ^ P[16]) >>> 0;
  left = (left ^ P[17]) >>> 0;
  const bytes = new Uint8Array(8), encoded = new DataView(bytes.buffer);
  encoded.setUint32(0, left, false);
  encoded.setUint32(4, right, false);
  return bytes;
}

export function encodeIdeFloat64(value: number): Uint8Array<ArrayBuffer> {
  const raw = new Uint8Array(8);
  new DataView(raw.buffer).setFloat64(0, value, true);
  return encodeIdeNumericBlock(new DataView(raw.buffer), 0);
}
```

---

### Adım 1.2: Yeni Dosya `src/lib/hsyncad/ide-import/ide-binary-codec.ts` Oluşturulması

Aşağıdaki içeriği **birebir** `src/lib/hsyncad/ide-import/ide-binary-codec.ts` olarak oluştur:

```ts
export const IDE_HEADER_SIGNATURE = "IDE BUILDING DESIGNER PROJECT FILE\r\nVer 4 SubVer 00\r\nCopyright IDE YAPI\r\n\0";
export const IDE10_VERSION = 201094;
export const IDE11_VERSION = 211220;
export const IDE_HEADER_CRC_START_OFFSET = 88;

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c >>> 0;
  }
  return table;
})();

/**
 * Computes the exact ideCAD header checksum stored at offset 83..86 (RVA 0x706c70 / 0x706ff0).
 * Equal to (~crc32_ieee(bytes.subarray(88))) >>> 0.
 */
export function computeIdePayloadChecksum(bytes: Uint8Array, startOffset = IDE_HEADER_CRC_START_OFFSET): number {
  let crc = 0xffffffff;
  for (let i = startOffset; i < bytes.byteLength; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc >>> 0;
}

export function verifyIdeHeaderChecksum(bytes: Uint8Array): { stored: number; computed: number; valid: boolean } {
  if (bytes.byteLength < IDE_HEADER_CRC_START_OFFSET) return { stored: 0, computed: 0, valid: false };
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const stored = view.getUint32(83, true);
  const computed = computeIdePayloadChecksum(bytes, IDE_HEADER_CRC_START_OFFSET);
  return { stored, computed, valid: stored === computed };
}

/** Updates version (74..77), encodedFlag (78), byteLength (79..82) and payload checksum (83..86) in place. */
export function sealIdeCarrierHeader(
  bytes: Uint8Array,
  options: { formatVersion: number; encodedFlag: 0 | 1 },
): Uint8Array {
  if (bytes.byteLength < IDE_HEADER_CRC_START_OFFSET) {
    throw new Error("IDE taşıyıcı başlığı mühürlenemedi: dosya 88 byte'tan küçük.");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  view.setUint32(74, options.formatVersion, true);
  bytes[78] = options.encodedFlag;
  view.setUint32(79, bytes.byteLength, true);
  view.setUint32(83, computeIdePayloadChecksum(bytes, IDE_HEADER_CRC_START_OFFSET), true);
  return bytes;
}

const CP1254_SPECIAL_ENCODE: Record<string, number> = {
  "€": 0x80, "‚": 0x82, "ƒ": 0x83, "„": 0x84, "…": 0x85, "†": 0x86, "‡": 0x87, "ˆ": 0x88,
  "‰": 0x89, "Š": 0x8a, "‹": 0x8b, "Œ": 0x8c, "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94,
  "•": 0x95, "–": 0x96, "—": 0x97, "˜": 0x98, "™": 0x99, "š": 0x9a, "›": 0x9b, "œ": 0x9c,
  "Ÿ": 0x9f, "Ğ": 0xd0, "İ": 0xdd, "Ş": 0xde, "ğ": 0xf0, "ı": 0xfd, "ş": 0xfe,
};

/** Encodes a JavaScript string into Windows-1254 (Turkish) bytes with a 4-byte LE length prefix (including NUL). */
export function encodeCp1254NulString(text: string): Uint8Array {
  const byteLen = text.length + 1;
  const out = new Uint8Array(4 + byteLen);
  new DataView(out.buffer).setUint32(0, byteLen, true);
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const mapped = CP1254_SPECIAL_ENCODE[ch];
    out[4 + i] = mapped !== undefined ? mapped : (ch.charCodeAt(i) <= 0xff ? ch.charCodeAt(i) : 0x3f);
  }
  out[4 + text.length] = 0;
  return out;
}
```

---

### Adım 1.3: `src/lib/hsyncad/ide-import/native-plan-labels.ts` Güncellemesi

`src/lib/hsyncad/ide-import/native-plan-labels.ts` dosyasında:

1. Satır 2'deki importu güncelle:
   ```ts
   import { isIde11SchemaVersion } from "./numeric-codec";
   ```
2. Satır 52 (`readNativeWallHeight`) içindeki `if (hasIdeEncodedNumbers(view.buffer as ArrayBuffer))` kontrolünü `if (isIde11SchemaVersion(view.buffer as ArrayBuffer))` olarak değiştir (`[98, 70, 25035, 10062, 1, 1]` dizisi `211220` şemasına aittir, hem `.ide11` hem `.ide11trial` için geçerlidir).
3. Satır 66 (`readNativeBeamSection`) içindeki `if (!hasIdeEncodedNumbers(view.buffer as ArrayBuffer) || ...)` kontrolünü `if (!isIde11SchemaVersion(view.buffer as ArrayBuffer) || ...)` olarak değiştir (`p + 266` kiriş yüksekliği alanı `211220` şemasında hem `.ide11` hem `.ide11trial` içinde bulunur).

---

### Adım 1.4: `src/lib/hsyncad/ide-import/stair-analysis-mesh.ts` Güncellemesi

`src/lib/hsyncad/ide-import/stair-analysis-mesh.ts` satır 52'de yer alan gömülü zlib alt-akış başlığı kontrolünü hem `.ide10` (`201094`), hem `.ide11` (`211220`, `flag=0`), hem `.ide11trial` (`211220`, `flag=1`) ile çalışacak şekilde güncelle:

```ts
    const subFlag = bytes[cursor + 2], subVersion = view.getUint32(cursor + 3, true);
    if (cursor + 15 > end || bytes[cursor] !== 1 || bytes[cursor + 1] !== 1 || (subFlag !== 0 && subFlag !== 1) || (subVersion !== 201094 && subVersion !== 211220)) continue;
```

---

### Adım 1.5: `src/lib/hsyncad/ide-import/index.ts` Güncellemesi

`src/lib/hsyncad/ide-import/index.ts` dosyasında:

1. Satır 14'teki importu güncelle:
   ```ts
   import { createIdeDataView, hasIdeEncodedNumbers, isIde11SchemaVersion } from "./numeric-codec";
   ```
2. `readSlabPlanLoads` (satır 259) fonksiyonunda `encoded: boolean` parametresini `v11Schema: boolean` olarak adlandır (`const shift = v11Schema ? 4 : 0;`).
3. `readSlabDesignAxes` (satır 272) fonksiyonuna `v11Schema = encoded` parametresi ekle:
   ```ts
   function readSlabDesignAxes(bytes: Uint8Array, view: DataView, c: Candidate, recordEnd: number, encoded: boolean, v11Schema = encoded): NonNullable<IdeElement["planAnnotation"]>["designAxes"] {
     const p = c.nameOffset + c.name.length + 1, end = Math.min(recordEnd, bytes.length, p + 12000);
     const floats = encoded ? new DataView(view.buffer, view.byteOffset, view.byteLength) : view;
     const shift = v11Schema ? 4 : 0;
   ```
4. `parseIde10` içinde (satır 305):
   ```ts
   const encoded = hasIdeEncodedNumbers(buffer);
   const v11Schema = isIde11SchemaVersion(buffer);
   if ((encoded || v11Schema) && view.getUint32(79, true) !== bytes.length) throw new Error("IDE dosyasının kayıtlı boyutu uyuşmuyor. Dosya eksik veya bozulmuş olabilir.");
   ```
5. Satır 388'de kiriş kesiti okumasını hem açık metin (`readBeamSection`) hem de v11 alanından (`readNativeBeamSection`) okuyacak şekilde güncelle:
   ```ts
   ...(type === "beam" ? (v11Schema ? (readNativeBeamSection(view, c.nameOffset, c.name, nextGeometryOffset(candidateIndex), g.width) ?? readBeamSection(bytes, view, c, g, decoder)) : readBeamSection(bytes, view, c, g, decoder)) : {}),
   ```
6. Satır 392-393'te `readSlabPlanLoads` ve `readSlabDesignAxes` çağrılarına `v11Schema` geçir:
   ```ts
   const annotation = type === "slab" ? readSlabPlanLoads(bytes, view, c, v11Schema) : undefined;
   if (type === "slab" && annotation?.loads) annotation.designAxes = readSlabDesignAxes(bytes, view, c, nextGeometryOffset(candidateIndex), encoded, v11Schema);
   ```
7. Satır 438'de döndürülen `format` alanını binary header'daki `v11Schema` ve `encoded` bayrağına göre belirle:
   ```ts
   const detectedFormat: IdeProject["format"] = encoded || /\.ide11trial$/i.test(filename) ? "ide11trial" : (v11Schema || /\.ide11$/i.test(filename)) ? "ide11" : "ide10";
   return { format: detectedFormat, filename, name: filename.replace(/^.*[\\/]/, "").replace(/\.(?:ide10|ide11|ide11trial)$/i, ""), byteLength: bytes.length, floors, elements, coverage, warnings };
   ```

---

## 3. Faz 1 Çıkış Kapısı (Exit Gate)

Aşağıdaki komutu çalıştır; tüm örnek dosyaların CRC32 doğrulaması ve Blowfish ters-kodlama testi `PASS` olmalıdır:

```powershell
@'
import fs from "node:fs";
import assert from "node:assert/strict";
import { verifyIdeHeaderChecksum } from "./src/lib/hsyncad/ide-import/ide-binary-codec.ts";
import { encodeIdeFloat64, decodeIdeNumericBlock } from "./src/lib/hsyncad/ide-import/numeric-codec.ts";

const cfg = JSON.parse(fs.readFileSync(".data/hsyncad/ide-examples.json", "utf8"));
for (const [id, filePath] of Object.entries(cfg)) {
  const bytes = new Uint8Array(fs.readFileSync(filePath as string));
  const res = verifyIdeHeaderChecksum(bytes);
  assert.equal(res.valid, true, `${id} CRC32 mismatch: ${res.stored} !== ${res.computed}`);
}
for (const sample of [0, -0.5, 0.25, 3.0, 29.55, 145671.125]) {
  const enc = encodeIdeFloat64(sample);
  const dec = new DataView(decodeIdeNumericBlock(new DataView(enc.buffer), 0).buffer).getFloat64(0, true);
  assert.equal(dec, sample);
}
console.log("FAZ 1 EXIT GATE: PASS");
'@ | npx tsx -
```
