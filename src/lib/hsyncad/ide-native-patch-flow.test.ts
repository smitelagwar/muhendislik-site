/**
 * T-F6.2 — UI yama kaydetme akışı birim testleri (mount'suz, saf fonksiyon zinciri).
 *
 * Zincir: workbench model durumu (CadElement[]) → collectIdeNativePatches
 * (yama state türetimi) → saveNativeIdeOutput (T-F6.1) → yeniden açılışta
 * düzenleme görünür, kapsam dışı bayt değişimi 0.
 *
 * Ürün ilkesi KORUNUR: düzenleme yokken türetilen yama listesi boşur ve
 * saveNativeIdeOutput boş listeyle açık hata verir (değişiklik dışı native
 * kaydetme REDDİ edilir).
 *
 * Gerçek korpus (SADECE OKU, asla ezilmez; çalışma kopyası kanıt klasöründe
 * YENİ adla yazılır): X11_downloads.ide11 (146.686.301 B, 211220/encoded=1).
 * Hedef kiriş: K34 (ide-floor-1:6129433), alan @1377843, 0.50 → 0.55 m.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseIde10, type IdeCoverage, type IdeElement, type IdeProject } from "./ide-import";
import { collectIdeNativePatches, importIdeWorkspace } from "./ide-workspace";
import { saveNativeIdeOutput } from "./ide-native-save";
import type { BeamElement, CadElement } from "./model";

const X11_PATH = "C:\\Users\\hsyn\\Desktop\\hsyncad\\incelemeler\\donusum-esdegerlik-2026-11-15\\00-kaynak\\X11_downloads.ide11";
const EVIDENCE_OUT = "C:\\Users\\hsyn\\Desktop\\hsyncad_idecad_uzanti_optimizasyon\\evidence\\orkestrasyon\\2026-11-19-F6-T6.2\\test-cikti";
const WORKING_COPY = join(EVIDENCE_OUT, "HS_X11_downloads_T62-birim-zinciri.ide11");
const X11_SHA = "eb2afeab9f0a689fcb8666abea6b3ba4b0a2bac8f340660f8c8be0f38de89268";
const K34_ID = "ide-floor-1:6129433";

const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

const coverage: IdeCoverage = {
  candidateRecords: 0, decodedRecords: 0, unsupportedRecords: 0, ignoredTemplateRecords: 0,
  holeRecords: 0, rejectedCandidates: 0, byType: {}, unsupportedTypes: {}, limitations: [],
};

const nativeBeam = (over: Partial<IdeElement>): IdeElement => ({
  id: "ide-floor-0:1", nativeId: 1, name: "K1", type: "beam", floorId: "ide-floor-0",
  points: [{ x: 0, y: 0 }, { x: 1, y: 0 }], sourceOffset: 100, primitiveType: 0,
  layerId: 0, nativeZ: 0, lateralOffset: 0, rotation: 0, width: 0.25, height: 0.5,
  ...over,
});

const editorBeam = (over: { id?: string; height?: number }): CadElement => ({
  // collectIdeNativePatches yalnız type/id/height okur; minimal kayıt yeterli.
  id: "ide-floor-0:1", name: "K1", floorId: "ide-floor-0", materialId: "m",
  layer: "Kirişler", type: "beam", start: { x: 0, y: 0 }, end: { x: 1, y: 0 },
  width: 0.25, height: 0.5, ...over,
} as unknown as BeamElement);

const syntheticProject = (elements: IdeElement[]): IdeProject => ({
  format: "ide11", filename: "sentetik.ide11", name: "s", byteLength: 4096,
  floors: [{ id: "ide-floor-0", name: "Zemin", elevation: 0, height: 3, sourceOffset: 0, endOffset: 4096 }],
  elements, coverage, warnings: [],
});

test("düzenlenmemiş model → yama listesi boş; boş listeyle native kaydetme RED (T-F6.2 ilkesi)", () => {
  const source = syntheticProject([nativeBeam({})]);
  assert.deepEqual(collectIdeNativePatches(source, [editorBeam({})]), [], "aynı yükseklik yama üretmemeli");
  assert.deepEqual(collectIdeNativePatches(null, [editorBeam({})]), [], "kaynak yoksa yama üretmemeli");
  assert.deepEqual(collectIdeNativePatches(undefined, [editorBeam({ height: 9 })]), [], "kaynak yoksa yama üretmemeli");
  // Türetim boş kaldığında kaydetme açık hatayla reddedilir (ürün ilkesi).
  assert.throws(() => saveNativeIdeOutput(new ArrayBuffer(0), collectIdeNativePatches(source, [editorBeam({})])), /Yama listesi boş.*reddedilir/);
});

test("kiriş kesit yüksekliği düzenlemesi → tek beamSectionHeight yaması; geri alınca yama kalkar", () => {
  const source = syntheticProject([nativeBeam({})]);
  const edited = collectIdeNativePatches(source, [editorBeam({ height: 0.55 })]);
  assert.deepEqual(edited, [{ id: "ide-floor-0:1", sourceOffset: 100, field: "beamSectionHeight", value: 0.55 }]);
  // Geri alma: yükseklik kaynak değerine döner → türetilmiş yama kaybolur.
  assert.deepEqual(collectIdeNativePatches(source, [editorBeam({})]), []);
  // Kayar nokta gürültüsü yama sayılmaz.
  assert.deepEqual(collectIdeNativePatches(source, [editorBeam({ height: 0.5 + 1e-12 })]), []);
});

test("kiriş dışı tür, editörde çizilmiş yeni eleman ve çözülmemiş kaynak kaydı yama üretmez", () => {
  const source = syntheticProject([
    nativeBeam({ id: "ide-floor-0:9", nativeId: 9, name: "K9", height: 0.5, sourceOffset: 900 }),
    nativeBeam({ id: "ide-floor-0:10", nativeId: 10, name: "K10", height: undefined, sourceOffset: 1000 }),
    { ...nativeBeam({ id: "ide-floor-0:11", nativeId: 11, name: "S1", type: "slab", height: 0.15, sourceOffset: 1100 }) },
  ]);
  const patches = collectIdeNativePatches(source, [
    editorBeam({ id: "yeni-kiris", height: 0.9 }),                    // kaynakta yok: editör çizimi
    editorBeam({ id: "ide-floor-0:10", height: 0.9 }),               // kaynak yüksekliği çözülmemiş
    editorBeam({ id: "ide-floor-0:11", height: 0.9 }),                // kaynak kiriş değil
  ]);
  assert.deepEqual(patches, [], "eşlenemeyen/çözülmemiş/kiriş dışı kayıtlar yama üretmemeli");
});

test("zincir: X11 workspace modelinde K34 0.55 → yama → kaydet → yeniden açılışta K34=0.55, kapsam dışı 0", { skip: !existsSync(X11_PATH), timeout: 300_000 }, () => {
  const raw = readFileSync(X11_PATH);
  const buffer = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer;
  const source = new Uint8Array(buffer);
  assert.equal(digest(source), X11_SHA, "korpus dosyası beklenen SHA-256 ile eşleşmeli");
  const project = parseIde10(buffer, "X11_downloads.ide11");

  // (a) Aktarım sonrası düzenleme yokken yama listesi boş (red ilkesi UI'da bu sıfıra dayanır).
  const model = importIdeWorkspace(project);
  assert.deepEqual(collectIdeNativePatches(model.ideImport!.source, model.elements), [], "importsuz durumda yama üretilmemeli");

  // (b) K34 (ide-floor-1:6129433) kesit yüksekliği 0.55 yapılır (UI değer girişinin model karşılığı).
  const k34 = model.elements.find((e): e is BeamElement => e.id === K34_ID);
  assert.ok(k34, "K34 (ide-floor-1) workspace modelinde düzenlenebilir olmalı");
  assert.equal(k34.type, "beam");
  assert.equal(k34.height, 0.5);
  const edited = { ...model, elements: model.elements.map(e => e.id === K34_ID ? { ...e, height: 0.55 } : e) };

  // (c) Türetim → tek yama, kaynağın kendi konum sözleşmesiyle.
  const patches = collectIdeNativePatches(edited.ideImport!.source, edited.elements);
  assert.deepEqual(patches, [{ id: K34_ID, sourceOffset: 1377573, field: "beamSectionHeight", value: 0.55 }]);

  // (d) Kaydet → yamalı alan + CRC mührü; kapsam dışı bayt değişimi 0.
  const outcome = saveNativeIdeOutput(source, patches);
  assert.equal(outcome.format, "ide11");
  const fieldOffset = 1377573 + "K34".length + 1 + 266;
  assert.equal(fieldOffset, 1377843, "t61 ile aynı alan konumu");
  assert.deepEqual(outcome.patchedRanges, [{ offset: fieldOffset, length: 8 }]);
  const stray: number[] = [];
  for (let i = 0; i < source.byteLength; i++) {
    if (source[i] === outcome.bytes[i]) continue;
    if (!(i >= fieldOffset && i < fieldOffset + 8) && !(i >= 83 && i < 87)) stray.push(i);
  }
  assert.equal(stray.length, 0, `yama kapsamı dışı bayt değişti: ${stray.slice(0, 8).join(", ")}`);
  assert.equal(outcome.changedByteCount, 12, "8 bayt alan + 4 bayt CRC mührü değişmeli");

  // (e) Yeniden açılışta yalnız K34 değişmiştir; diğer katlardaki K34'ler 0.50 kalır.
  const reopened = parseIde10(outcome.bytes.buffer as ArrayBuffer, "HS_X11_downloads_T62-birim-zinciri.ide11");
  const beams = reopened.elements.filter(e => e.name === "K34");
  assert.equal(beams.length, 4, "X11'de dört katta K34 olmalı");
  const patchedK34 = beams.find(e => e.id === K34_ID);
  assert.ok(patchedK34, "yamalı K34 yeniden çözümlenmeli");
  assert.equal(patchedK34.height, 0.55);
  for (const other of beams.filter(e => e.id !== K34_ID)) assert.equal(other.height, 0.5, `${other.id} değişmemeli`);

  // Kaynak korpus asla ezilmez; çalışma kopyası kanıt klasöründe YENİ adla yazılır.
  assert.equal(digest(source), X11_SHA, "kaynak dosya baytları değişmemeli");
  mkdirSync(EVIDENCE_OUT, { recursive: true });
  writeFileSync(WORKING_COPY, outcome.bytes);
  console.log(`T62 birim zinciri: K34=${K34_ID} 0.50→0.55 alan=@${fieldOffset} değişenBayt=${outcome.changedByteCount} çıktı=${WORKING_COPY}`);
});
