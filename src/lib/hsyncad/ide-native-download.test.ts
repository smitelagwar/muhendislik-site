/**
 * S1/S2 — "Dönüştür + indir" ve "farklı kaydet" saf mantık birim testleri.
 *
 * Sözleşme: hiçbir kayıt biçimi kapatılmaz; eksik kaynak/donör diyalog içinde
 * istenir. `nativeIdeDownloadTargets` S1 indirme düğmelerinin koşuludur.
 * `convertNativeSave` matrisi: aynı biçim bayt kopyası, v11 → v10 donörlü,
 * v10 → v11 ters yükseltme, `.cde` dürüst red. Geçersiz girdide hata fırlar;
 * yanlış dosya üretilmez ve kaynak arabellek değişmez.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import type { IdeProject } from "./ide-import";
import type { NativeIdeFormat } from "./ide-import/ide-binary-codec";
import { convertIdeSourceToNative, convertNativeSave, ideSourceFormatOf, nativeIdeDownloadTargets, nativeSaveOptions } from "./ide-native-download";

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

test("ideSourceFormatOf: uzantıdan kaynak biçimi", () => {
  assert.equal(ideSourceFormatOf("Proje.ide11trial"), "ide11trial");
  assert.equal(ideSourceFormatOf("Proje.IDE11"), "ide11");
  assert.equal(ideSourceFormatOf("Proje.ide10"), "ide10");
  assert.equal(ideSourceFormatOf("Proje.cde"), "cde");
  assert.equal(ideSourceFormatOf("Proje.hsyncad"), null);
});

test("nativeSaveOptions: hiçbir biçim kapatılmaz; kaynak yoksa istenir", () => {
  for (const [project, source] of [[null, undefined], [projectOf("ide11trial"), undefined], [null, file()]] as const) {
    const options = nativeSaveOptions(project, source, 0);
    assert.equal(options.ide11.enabled, true, ".ide11 her zaman seçilebilir");
    assert.equal(options.ide10.enabled, true, ".ide10 her zaman seçilebilir");
  }
  const missing = nativeSaveOptions(null, undefined, 0);
  assert.equal(missing.ide11.needsSource, true);
  assert.equal(missing.ide10.needsSource, true);
  assert.match(missing.ide11.reason, /Kaynak ideCAD dosyası seçilmedi/);
});

test("nativeSaveOptions: .ide10 hedefi yalnız v11 kaynakta donör ister", () => {
  for (const format of ["ide11trial", "ide11"] as const) {
    const options = nativeSaveOptions(projectOf(format), file(), 0);
    assert.equal(options.ide11.enabled, true, `${format}: .ide11 açık`);
    assert.equal(options.ide11.donorRequired, false);
    assert.equal(options.ide11.needsSource, false);
    assert.equal(options.ide10.enabled, true, `${format}: .ide10 açık`);
    assert.equal(options.ide10.donorRequired, true);
  }
  const ide10 = nativeSaveOptions(projectOf("ide10"), new File([new Uint8Array([1])], "proje.ide10"), 0);
  assert.equal(ide10.ide10.enabled, true);
  assert.equal(ide10.ide10.donorRequired, false, ".ide10 → .ide10 donör istemez");
  assert.equal(ide10.ide11.enabled, true, ".ide10 → .ide11 seçilebilir");
  assert.equal(ide10.ide11.donorRequired, true, "ters yükseltme .ide11 donörü ister");
  assert.equal(ide10.ide11.donorFormat, "ide11");
});

test("nativeSaveOptions: .cde seçilebilir ama kayıt dürüstçe reddedilir", () => {
  const options = nativeSaveOptions(projectOf("cde"), new File([new Uint8Array([1])], "proje.cde"), 3);
  assert.equal(options.ide11.enabled, true);
  assert.equal(options.ide10.enabled, true);
  assert.match(options.ide11.reason, /\.cde/);
  assert.throws(() => convertNativeSave(new Uint8Array([1, 2, 3]), "cde", "ide11"), /\.cde/);
});

test("convertNativeSave: aynı biçim bayt kopyası, kaynak değişmez", () => {
  const source = new Uint8Array([7, 8, 9, 10]);
  const before = digest(source);
  const out11 = convertNativeSave(source, "ide11", "ide11");
  const out10 = convertNativeSave(source, "ide10", "ide10");
  assert.deepEqual([...out11], [...source]);
  assert.deepEqual([...out10], [...source]);
  assert.equal(digest(source), before, "kaynak arabellek değişmemeli");
  assert.notEqual(out11, source, "çıktı yeni tampon olmalı");
});

test("convertNativeSave: .ide10 hedefi donörsüz reddedilir", () => {
  assert.throws(() => convertNativeSave(new Uint8Array([1, 2, 3]), "ide11trial", "ide10"), /donör/);
  // Donör verilince hata donör eksikliği değil taşıyıcı doğrulamasıdır.
  assert.throws(
    () => convertNativeSave(new Uint8Array([1, 2, 3]), "ide11", "ide10", new Uint8Array(128)),
    (error: Error) => !/donör/.test(error.message),
  );
});

test("convertNativeSave: dönüşüm yolları transcoder doğrulamasına gider", () => {
  // Geçersiz taşıyıcı: yanlış dosya üretilmez, açık hata fırlar.
  assert.throws(() => convertNativeSave(new Uint8Array(64), "ide11trial", "ide11"), Error);
  // .ide10 → .ide11 donörsüz reddedilir; donör verilince taşıyıcı doğrulamasına geçer.
  assert.throws(() => convertNativeSave(new Uint8Array(64), "ide10", "ide11"), /donör/);
  assert.throws(
    () => convertNativeSave(new Uint8Array(64), "ide10", "ide11", new Uint8Array(64)),
    (error: Error) => !/donör seçilmeden/.test(error.message),
  );
});
