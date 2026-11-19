/**
 * S1 — "Dönüştür + indir" saf mantık birim testleri.
 *
 * Sözleşme: `nativeIdeDownloadTargets` görünürlük koşulu tek kaynaktan türetilir
 * (IDE11 şeması + kaynak dosya); `.ide10`/`.cde` kaynakları için dönüşüm
 * kanıtlanmadığından dürüst red olarak kapalı kalır. `convertIdeSourceToNative`
 * geçersiz girdide transcoder hatası fırlatır; yanlış dosya üretilmez ve
 * kaynak arabellek değişmez. `saveNativeIdeSource` guard'ları bu akışa dahil
 * değildir ("kaydet" değil "indir").
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import type { IdeProject } from "./ide-import";
import type { NativeIdeFormat } from "./ide-import/ide-binary-codec";
import { convertIdeSourceToNative, nativeIdeDownloadTargets, nativeSaveOptions } from "./ide-native-download";

const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

/** Yalnız `format` alanı anlamlı; test tip düzeyinde tam proje üretir. */
function projectOf(format: NativeIdeFormat): IdeProject {
  return {
    format,
    filename: `proje.${format}`,
    name: "Test Projesi",
    byteLength: 1024,
    floors: [],
    elements: [],
    coverage: {
      candidateRecords: 0,
      decodedRecords: 0,
      unsupportedRecords: 0,
      ignoredTemplateRecords: 0,
      holeRecords: 0,
      rejectedCandidates: 0,
      byType: {},
      unsupportedTypes: {},
      limitations: [],
    },
    warnings: [],
  };
}

const file = () => new File([new Uint8Array([1, 2, 3])], "proje.ide11trial");

test("nativeIdeDownloadTargets: ide11trial/ide11 kaynağı iki hedefi de açar", () => {
  for (const format of ["ide11trial", "ide11"] as const) {
    const targets = nativeIdeDownloadTargets(projectOf(format), file());
    assert.deepEqual(targets, { ide11: true, ide10: true }, `${format} kaynağında iki hedef de açık olmalı`);
  }
});

test("nativeIdeDownloadTargets: ide10/cde kaynağı ve koşul eksikleri kapalı kalır", () => {
  // .ide10 kaynağından dönüşüm kanıtlanmadı — dürüst red (false).
  assert.deepEqual(nativeIdeDownloadTargets(projectOf("ide10"), file()), { ide11: false, ide10: false });
  assert.deepEqual(nativeIdeDownloadTargets(projectOf("cde"), file()), { ide11: false, ide10: false });
  // Kaynak dosya yoksa / proje null ise indirme mümkün değil.
  assert.deepEqual(nativeIdeDownloadTargets(projectOf("ide11trial"), undefined), { ide11: false, ide10: false });
  assert.deepEqual(nativeIdeDownloadTargets(null, file()), { ide11: false, ide10: false });
  assert.deepEqual(nativeIdeDownloadTargets(null, undefined), { ide11: false, ide10: false });
});

test("convertIdeSourceToNative: .ide10 donörsüz reddedilir, donör verilince transcoder'a geçer", () => {
  // S1 kanıtı: donörsüz .ide10 üretimi ideCAD'de çökme verdi → ürün kuralı reddeder.
  assert.throws(() => convertIdeSourceToNative(new Uint8Array([1, 2, 3]), "ide10"), /donör/);
  // Donör verildiğinde hata mesajı donör eksikliği değil taşıyıcı doğrulamasıdır.
  assert.throws(() => convertIdeSourceToNative(new Uint8Array([1, 2, 3]), "ide10", new Uint8Array(128)), (error: Error) => !/donör/.test(error.message));
});

test("convertIdeSourceToNative: geçersiz/boş girdi transcoder hatası fırlatır, kaynak değişmez", () => {
  for (const input of [new Uint8Array(0), new Uint8Array(128), new ArrayBuffer(64)]) {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    const before = digest(bytes);
    for (const target of ["ide11", "ide10"] as const) {
      // Taşıyıcı doğrulaması geçilemediği için transcoder açık hata verir;
      // yanlış dosya üretilmez, hata UI katmanına dürüstçe iletilir.
      assert.throws(() => convertIdeSourceToNative(input, target), Error);
    }
    assert.equal(digest(bytes), before, "kaynak arabellek dönüşüm denemesinde değişmemeli");
  }
});

test("nativeSaveOptions: açık kaynak yokken iki native hedef de dürüst reddedilir", () => {
  for (const [project, source] of [[null, undefined], [projectOf("ide11trial"), undefined], [null, file()]] as const) {
    const options = nativeSaveOptions(project, source, 0);
    assert.equal(options.ide11.enabled, false);
    assert.equal(options.ide10.enabled, false);
    assert.match(options.ide11.reason, /Özgün ideCAD dosyası açık değil/);
  }
});

test("nativeSaveOptions: ide11trial/ide11 iki hedefi açar; .ide10 donör ister", () => {
  for (const format of ["ide11trial", "ide11"] as const) {
    const options = nativeSaveOptions(projectOf(format), file(), 0);
    assert.equal(options.ide11.enabled, true, `${format}: .ide11 açık`);
    assert.equal(options.ide11.donorRequired, false);
    assert.equal(options.ide10.enabled, true, `${format}: .ide10 açık`);
    assert.equal(options.ide10.donorRequired, true);
  }
});

test("nativeSaveOptions: .ide10 kaynağı yalnız yamalı aynı-biçim kaydına açılır", () => {
  const empty = nativeSaveOptions(projectOf("ide10"), file(), 0);
  assert.equal(empty.ide10.enabled, false, "yama yokken aynı-biçim kayıt reddedilir");
  assert.equal(empty.ide11.enabled, false, ".ide10 → .ide11 kanıtlanmadı");
  const patched = nativeSaveOptions(projectOf("ide10"), file(), 2);
  assert.equal(patched.ide10.enabled, true);
  assert.equal(patched.ide10.donorRequired, false);
  assert.equal(patched.ide11.enabled, false);
});

test("nativeSaveOptions: .cde kaynağı native kayda kapalıdır", () => {
  const options = nativeSaveOptions(projectOf("cde"), file(), 3);
  assert.equal(options.ide11.enabled, false);
  assert.equal(options.ide10.enabled, false);
  assert.match(options.ide11.reason, /\.cde/);
});
