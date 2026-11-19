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
import { convertIdeSourceToNative, nativeIdeDownloadTargets } from "./ide-native-download";

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
