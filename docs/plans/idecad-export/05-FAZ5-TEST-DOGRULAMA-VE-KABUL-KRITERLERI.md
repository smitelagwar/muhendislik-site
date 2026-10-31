# Faz 5 — Birim Testleri, Round-Trip Doğrulaması ve Kabul Kapıları

> **ÖN KOŞUL:** [`04-FAZ4-ARAYUZ-VE-EXPORT-ENTEGRASYONU.md`](./04-FAZ4-ARAYUZ-VE-EXPORT-ENTEGRASYONU.md) tamamlanmış ve `npx tsc --noEmit` sıfır hata ile geçmiş olmalıdır.
> **HEDEF:** `src/lib/hsyncad/ide-binary-export.test.ts` birim test dosyasını oluşturmak, `tests/hsyncad/ide-exports.spec.ts` E2E testini `.ide11` ve `.ide10` indirme/yeniden-açma adımlarıyla güncellemek ve tüm kabul kapılarını çalıştırmak.

---

## 1. Oluşturulacak Birim Test Dosyası: `src/lib/hsyncad/ide-binary-export.test.ts`

Aşağıdaki kodu **birebir** `src/lib/hsyncad/ide-binary-export.test.ts` olarak oluştur:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { parseIde10 } from "./ide-import";
import { decodeIdeNumericBlock, encodeIdeFloat64 } from "./ide-import/numeric-codec";
import {
  computeIdePayloadChecksum,
  encodeCp1254NulString,
  IDE10_VERSION,
  IDE11_VERSION,
  sealIdeCarrierHeader,
  verifyIdeHeaderChecksum,
} from "./ide-import/ide-binary-codec";
import { exportIde10Binary, exportIde11Binary } from "./ide-export";

const trialSamplePath = "C:/Users/hsyn/Desktop/MUSTAFA SELVİ 1.KISIM.ide11trial";
const nativeIde10Path = "D:/IDM_DOWNLOAD/MUSTAFA SELVİ TÜM PROJELER/STATİK/1.kısım/MUSTAFA SELVİ 1.KISIM.ide10";

test("Blowfish numeric codec round-trips IEEE-754 float64 values deterministically", () => {
  for (const value of [0, -0.5, 0.25, 0.545, 1, 3.0, 29.55, -142.875, 145671.125]) {
    const encoded = encodeIdeFloat64(value);
    const decoded = new DataView(decodeIdeNumericBlock(new DataView(encoded.buffer), 0).buffer).getFloat64(0, true);
    assert.equal(decoded, value);
  }
});

test("sealIdeCarrierHeader writes exact version, encodedFlag, byteLength and inverted CRC32", () => {
  const sample = new Uint8Array(128);
  for (let i = 88; i < sample.length; i++) sample[i] = (i * 31) & 0xff;
  sealIdeCarrierHeader(sample, { formatVersion: IDE11_VERSION, encodedFlag: 0 });
  const view = new DataView(sample.buffer);
  assert.equal(view.getUint32(74, true), IDE11_VERSION);
  assert.equal(sample[78], 0);
  assert.equal(view.getUint32(79, true), 128);
  assert.equal(view.getUint32(83, true), computeIdePayloadChecksum(sample, 88));
  assert.equal(verifyIdeHeaderChecksum(sample).valid, true);
});

test("encodeCp1254NulString encodes Turkish characters and length prefix with NUL terminator", () => {
  const bytes = encodeCp1254NulString("ZEMİN KAT ğüşiöç");
  const view = new DataView(bytes.buffer);
  const len = view.getUint32(0, true);
  assert.equal(len, "ZEMİN KAT ğüşiöç".length + 1);
  assert.equal(bytes[bytes.length - 1], 0);
  const decoded = new TextDecoder("windows-1254").decode(bytes.subarray(4, 3 + len));
  assert.equal(decoded, "ZEMİN KAT ğüşiöç");
});

test(
  ".ide11trial exports to decoded .ide11 and round-trips through parseIde10 with 100% fidelity",
  { skip: !existsSync(trialSamplePath), timeout: 45_000 },
  () => {
    const trialBytes = new Uint8Array(readFileSync(trialSamplePath));
    assert.equal(verifyIdeHeaderChecksum(trialBytes).valid, true);
    const trialProject = parseIde10(
      trialBytes.buffer.slice(trialBytes.byteOffset, trialBytes.byteOffset + trialBytes.byteLength),
      "MUSTAFA SELVİ 1.KISIM.ide11trial",
    );

    const ide11Bytes = exportIde11Binary(trialBytes, trialProject);
    assert.equal(verifyIdeHeaderChecksum(ide11Bytes).valid, true);
    const header = new DataView(ide11Bytes.buffer, ide11Bytes.byteOffset, ide11Bytes.byteLength);
    assert.equal(header.getUint32(74, true), IDE11_VERSION);
    assert.equal(ide11Bytes[78], 0);

    const parsedIde11 = parseIde10(
      ide11Bytes.buffer.slice(ide11Bytes.byteOffset, ide11Bytes.byteOffset + ide11Bytes.byteLength),
      "MUSTAFA SELVİ 1.KISIM.ide11",
    );
    assert.equal(parsedIde11.format, "ide11");
    assert.equal(parsedIde11.floors.length, 6);
    assert.equal(parsedIde11.elements.length, 1273);
    assert.equal(parsedIde11.coverage.unsupportedRecords, 0);
    assert.equal(parsedIde11.coverage.holeRecords, 76);
    assert.equal(parsedIde11.elements.filter(e => e.planAnnotation?.loads).length, 159);
    assert.equal(parsedIde11.elements.filter(e => e.type === "beam" && e.sectionLabel).length, 357);
    assert.equal(parsedIde11.elements.filter(e => e.type === "wall" && e.structural && e.planAnnotation?.section).length, 196);
    assert.equal(parsedIde11.elements.filter(e => e.type === "stair" && e.mesh).length, 7);
  },
);

test(
  ".ide11trial exports to .ide10 in both standalone-downgraded and donor-patched modes",
  { skip: !existsSync(trialSamplePath), timeout: 60_000 },
  () => {
    const trialBytes = new Uint8Array(readFileSync(trialSamplePath));
    const trialProject = parseIde10(
      trialBytes.buffer.slice(trialBytes.byteOffset, trialBytes.byteOffset + trialBytes.byteLength),
      "MUSTAFA SELVİ 1.KISIM.ide11trial",
    );

    // 1. Standalone .ide10 downgrade
    const standalone = exportIde10Binary(trialBytes, trialProject);
    assert.equal(standalone.mode, "standalone-downgraded");
    assert.equal(verifyIdeHeaderChecksum(standalone.bytes).valid, true);
    const header = new DataView(standalone.bytes.buffer, standalone.bytes.byteOffset, standalone.bytes.byteLength);
    assert.equal(header.getUint32(74, true), IDE10_VERSION);
    assert.equal(standalone.bytes[78], 0);

    const parsedIde10 = parseIde10(
      standalone.bytes.buffer.slice(standalone.bytes.byteOffset, standalone.bytes.byteOffset + standalone.bytes.byteLength),
      "MUSTAFA SELVİ 1.KISIM.ide10",
    );
    assert.equal(parsedIde10.format, "ide10");
    assert.equal(parsedIde10.floors.length, 6);
    assert.equal(parsedIde10.elements.length, 1273);
    assert.equal(parsedIde10.coverage.unsupportedRecords, 0);
    assert.equal(parsedIde10.coverage.holeRecords, 76);
    assert.equal(parsedIde10.elements.filter(e => e.planAnnotation?.loads).length, 159);
    assert.equal(parsedIde10.elements.filter(e => e.type === "beam" && e.sectionLabel).length, 357);
    assert.equal(parsedIde10.elements.filter(e => e.type === "wall" && e.structural && e.planAnnotation?.section).length, 196);
    assert.equal(parsedIde10.elements.filter(e => e.type === "stair" && e.mesh).length, 7);

    // 2. Donor-assisted .ide10 surgical patch (when native .ide10 sample is present)
    if (existsSync(nativeIde10Path)) {
      const donorBytes = new Uint8Array(readFileSync(nativeIde10Path));
      const modified = structuredClone(trialProject);
      const slab = modified.elements.find(e => e.type === "slab" && e.planAnnotation?.loads)!;
      slab.planAnnotation!.loads!.dead = 0.654;
      slab.planAnnotation!.loads!.live = 0.432;

      const patched = exportIde10Binary(trialBytes, modified, donorBytes);
      assert.equal(patched.mode, "donor-patched");
      assert.equal(patched.patchedElementCount, 1);
      assert.equal(verifyIdeHeaderChecksum(patched.bytes).valid, true);

      const reparsedDonor = parseIde10(
        patched.bytes.buffer.slice(patched.bytes.byteOffset, patched.bytes.byteOffset + patched.bytes.byteLength),
        "MUSTAFA SELVİ 1.KISIM.ide10",
      );
      const updatedSlab = reparsedDonor.elements.find(e => e.nativeId === slab.nativeId)!;
      assert.equal(updatedSlab.planAnnotation?.loads?.dead, 0.654);
      assert.equal(updatedSlab.planAnnotation?.loads?.live, 0.432);
    }
  },
);
```

---

## 2. `tests/hsyncad/ide-exports.spec.ts` E2E Test Güncellemesi

`tests/hsyncad/ide-exports.spec.ts` dosyasındaki 3. testte (`"saved trial sample opens directly and exports a reusable project while preserving the native source"`, satır 74-115) `snapshotFile` indirildikten hemen sonra `.ide11` ve `.ide10` dışa aktarımlarını da test edecek şekilde şu adımları ekle:

```ts
  await page.getByTestId("ide-file-menu").click();
  const ide11Event = page.waitForEvent("download");
  await page.getByTestId("ide-export-ide11").click();
  const ide11Download = await ide11Event;
  expect(ide11Download.suggestedFilename()).toBe("MUSTAFA SELVİ 1.KISIM.ide11");
  const ide11File = path.join(artifacts, "mustafa-1-from-trial.ide11");
  await ide11Download.saveAs(ide11File);

  await page.getByTestId("ide-file-menu").click();
  const ide10Event = page.waitForEvent("download");
  await page.getByTestId("ide-export-ide10").click();
  const ide10Download = await ide10Event;
  expect(ide10Download.suggestedFilename()).toBe("MUSTAFA SELVİ 1.KISIM.ide10");
  const ide10File = path.join(artifacts, "mustafa-1-from-trial.ide10");
  await ide10Download.saveAs(ide10File);

  // Reopen exported .ide11 and .ide10 in the viewer to verify end-to-end roundtrip
  await page.getByTestId("ide-file-input").setInputFiles(ide11File);
  await expect(page.getByTestId("ide-loading")).toBeHidden({ timeout: 60_000 });
  await expect(page.getByTestId("ide-viewer")).toHaveAttribute("data-element-count", "1273");

  await page.getByTestId("ide-file-input").setInputFiles(ide10File);
  await expect(page.getByTestId("ide-loading")).toBeHidden({ timeout: 60_000 });
  await expect(page.getByTestId("ide-viewer")).toHaveAttribute("data-element-count", "1273");
```

---

## 3. Final Doğrulama ve Kabul Kapıları (Anti-Hang Kurallarına Uygun)

Aşağıdaki 3 komutu sırayla çalıştır. Hepsi `PASS` (`exit code 0`) verdiğinde uygulama eksiksiz tamamlanmıştır:

```powershell
# 1. Mevcut ve yeni hsynCAD birim testleri (~5 saniye)
npx tsx --test src/lib/hsyncad/ide-export.test.ts src/lib/hsyncad/ide-binary-export.test.ts

# 2. TypeScript tam tip kontrolü (~5 saniye)
npx tsc --noEmit

# 3. (Opsiyonel / E2E istenirse) Playwright tekil test (takılma önlemeli)
npx playwright test tests/hsyncad/ide-exports.spec.ts --timeout=120000 --reporter=list
```
