/**
 * T-F6.1 — Yamalayıcı (patch) editörü birim testleri.
 *
 * Sözleşme: `saveNativeIdeOutput` yalnız `IdeElement.sourceOffset` tabanlı,
 * kayıt grameriyle doğrulanmış alan yamalarını kabul eder. Yamalı alan değişir;
 * dosyanın geri kalanı bayt özdeş kalır (çözülmemiş baytlar yapı gereği
 * korunur); CRC + uzunluk mührü yeniden atılır. Kapsam dışı/muğlak değişiklik
 * açık hata ile reddedilir ve `saveNativeIdeSource`'un değişiklik dışı kaydetme
 * reddi (ürün ilkesi) KORUNUR — daraltılır, kaldırılmaz.
 *
 * Gerçek korpus (SADECE OKU, asla ezilmez; çalışma kopyası kanıt klasöründe
 * YENİ adla yazılır):
 * - X11_downloads.ide11 (146.686.301 B, 211220/encoded=1, tipli kiriş kesiti
 *   f64 @ p+266 — 357/357 kiriş doğrulanır).
 * - A0_orijinal.ide10 (201094, tipli kesit alanı YOK; yama reddi negatif senaryosu).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseIde10, type IdeElement, type IdeProject } from "./ide-import";
import { saveNativeIdeOutput, saveNativeIdeSource, type IdeNativeElementPatch } from "./ide-native-save";
import { verifyIdeHeaderChecksum } from "./ide-import/ide-binary-codec";
import { createIdeDataView } from "./ide-import/numeric-codec";
import { readNativeBeamSection } from "./ide-import/native-plan-labels";

const X11_PATH = "C:\\Users\\hsyn\\Desktop\\hsyncad\\incelemeler\\donusum-esdegerlik-2026-11-15\\00-kaynak\\X11_downloads.ide11";
const A0_PATH = "C:\\Users\\hsyn\\Desktop\\hsyncad\\incelemeler\\donusum-esdegerlik-2026-11-15\\00-kaynak\\A0_orijinal.ide10";
const EVIDENCE_OUT = "C:\\Users\\hsyn\\Desktop\\hsyncad_idecad_uzanti_optimizasyon\\evidence\\orkestrasyon\\2026-11-19-F6-T6.1\\test-cikti";
const WORKING_COPY = join(EVIDENCE_OUT, "HS_X11_downloads_T61-yamali.ide11");
const X11_SHA = "eb2afeab9f0a689fcb8666abea6b3ba4b0a2bac8f340660f8c8be0f38de89268";

const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const centimetres = (value: number) => String(Number((value * 100).toFixed(5)));

function loadCarrier(path: string): { bytes: Uint8Array; buffer: ArrayBuffer } {
  const raw = readFileSync(path);
  const buffer = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);
  return { bytes: new Uint8Array(buffer), buffer };
}

/** Tipli v11 kiriş kesit alanı (etiket u32=1, aile tuple'ları, birim ölçekler)
 * kaynakta birebir doğrulanmış ilk kirişi seçer; okuyucu değeriyle çapraz kontrol. */
type TypedBeamElement = IdeElement & { type: "beam"; height: number; width: number };
function findTypedBeam(project: IdeProject, view: DataView): TypedBeamElement | undefined {
  for (const element of project.elements) {
    const { type, height, width } = element;
    if (type !== "beam" || height === undefined || width === undefined) continue;
    const section = readNativeBeamSection(view, element.sourceOffset, element.name, view.byteLength, width);
    if (section && section.height === height && section.sectionLabel === element.sectionLabel) {
      return { ...element, type, height, width };
    }
  }
  return undefined;
}

test("X11 kiriş kesit yüksekliği yerinde yaması: alan değişir, geri kalan bayt özdeş, CRC mührü geçerli (T-F6.1)", { skip: !existsSync(X11_PATH), timeout: 300_000 }, () => {
  const { bytes: source, buffer } = loadCarrier(X11_PATH);
  assert.equal(digest(source), X11_SHA, "korpus dosyası beklenen SHA-256 ile eşleşmeli");
  const project = parseIde10(buffer, "X11_downloads.ide11");
  const view = createIdeDataView(buffer);
  const target = findTypedBeam(project, view);
  assert.ok(target, "X11 içinde tipli kesit alanı doğrulanmış kiriş bulunamadı");
  assert.equal(target.type, "beam");

  const fieldOffset = target.sourceOffset + target.name.length + 1 + 266;
  assert.equal(view.getFloat64(fieldOffset, true), target.height, "tipli kesit alanı okuyucu yüksekliğiyle eşleşmeli");
  const newHeight = Number((target.height + 0.05).toFixed(5));
  const expectedLabel = `${centimetres(target.width)}/${centimetres(newHeight)}`;

  const outcome = saveNativeIdeOutput(source, [{ id: target.id, sourceOffset: target.sourceOffset, field: "beamSectionHeight", value: newHeight }]);

  // (a) Yamalı alan çözümlendiğinde yeni değeri verir; yama kapsamı raporlanır.
  assert.equal(outcome.format, "ide11");
  assert.deepEqual(outcome.patchedRanges, [{ offset: fieldOffset, length: 8 }]);
  assert.equal(createIdeDataView(outcome.bytes.buffer as ArrayBuffer).getFloat64(fieldOffset, true), newHeight);

  // (b) Dosyanın geri kalanı bayt özdeş: fark yalnız yama alanı + CRC mühründe.
  assert.equal(outcome.bytes.byteLength, source.byteLength);
  const fieldDiffs: number[] = [], crcDiffs: number[] = [], strayDiffs: number[] = [];
  for (let i = 0; i < source.byteLength; i++) {
    if (source[i] === outcome.bytes[i]) continue;
    if (i >= fieldOffset && i < fieldOffset + 8) fieldDiffs.push(i);
    else if (i >= 83 && i < 87) crcDiffs.push(i);
    else strayDiffs.push(i);
  }
  assert.equal(fieldDiffs.length, 8, `yama alanında tam 8 bayt değişmeli, ${fieldDiffs.length} değişti`);
  assert.ok(crcDiffs.length >= 1 && crcDiffs.length <= 4, "CRC mührü yeniden hesaplanmış olmalı");
  assert.equal(strayDiffs.length, 0, `yama kapsamı dışı bayt değişti: ${strayDiffs.slice(0, 8).join(", ")}`);
  assert.equal(outcome.changedByteCount, fieldDiffs.length + crcDiffs.length);

  // (c) CRC + uzunluk mührü yeniden atılmış ve geçerli.
  const seal = verifyIdeHeaderChecksum(outcome.bytes);
  assert.ok(seal.valid, `çıktı CRC geçersiz: stored=${seal.stored} computed=${seal.computed}`);
  assert.equal(new DataView(outcome.bytes.buffer as ArrayBuffer).getUint32(79, true), outcome.bytes.byteLength, "uzunluk mührü @79 geçerli olmalı");

  // (d) Yeniden açılışta düzenleme görünür; çözülmemiş/çözümlenmiş diğer her kayıt özdeş.
  const reopened = parseIde10(outcome.bytes.buffer as ArrayBuffer, "HS_X11_downloads_T61-yamali.ide11");
  assert.equal(reopened.elements.length, project.elements.length);
  const before = new Map(project.elements.map(e => [`${e.id}@${e.sourceOffset}`, e] as const));
  const expectedTarget = structuredClone(target);
  expectedTarget.height = newHeight;
  expectedTarget.sectionLabel = expectedLabel;
  expectedTarget.bottom = target.bottom !== undefined ? target.bottom - (newHeight - target.height) : undefined;
  if (expectedTarget.planAnnotation?.section !== undefined) expectedTarget.planAnnotation.section = expectedLabel;
  for (const element of reopened.elements) {
    const original = before.get(`${element.id}@${element.sourceOffset}`);
    assert.ok(original, `yeniden açılışta beklenmeyen eleman: ${element.id}`);
    if (element.id === target.id) {
      assert.equal(JSON.stringify(element), JSON.stringify(expectedTarget), "hedef kiriş yalnız kesit yüksekliği/etiket türevleriyle değişmeli");
    } else {
      assert.equal(JSON.stringify(element), JSON.stringify(original), `yama dışı eleman değişti: ${element.id}`);
    }
  }
  assert.deepEqual(reopened.coverage, project.coverage, "kapsam sayıkları değişmemeli");
  assert.equal(JSON.stringify(reopened.floors), JSON.stringify(project.floors), "kat kayıtları değişmemeli");

  // Kaynak korpus asla ezilmez; çalışma kopyası kanıt klasöründe YENİ adla yazılır.
  assert.equal(digest(source), X11_SHA, "kaynak dosya baytları değişmemeli");
  mkdirSync(EVIDENCE_OUT, { recursive: true });
  writeFileSync(WORKING_COPY, outcome.bytes);
  console.log(`T61 yama kanıtı: hedef=${target.name} (${target.id}) alan=beamSectionHeight konum=${fieldOffset} eski=${target.height} yeni=${newHeight} etiket=${expectedLabel} değişenBayt=${outcome.changedByteCount} (alan=${fieldDiffs.length} + crc=${crcDiffs.length}) çıktı=${WORKING_COPY}`);
});

test("kapsam dışı/muğlak yamalar açık hata ile reddedilir (T-F6.1 ürün ilkesi)", { skip: !existsSync(X11_PATH), timeout: 300_000 }, () => {
  const { bytes: source, buffer } = loadCarrier(X11_PATH);
  const project = parseIde10(buffer, "X11_downloads.ide11");
  const view = createIdeDataView(buffer);
  const beam = findTypedBeam(project, view);
  assert.ok(beam);
  const nonBeam = project.elements.find(e => e.type !== "beam" && e.height !== undefined && e.sourceOffset !== beam.sourceOffset);
  assert.ok(nonBeam, "kiriş dışı, yüksekliği türetilmiş bir eleman bulunamadı");
  const beamPatch = { id: beam.id, sourceOffset: beam.sourceOffset, field: "beamSectionHeight", value: 0.6 } as const;

  assert.throws(() => saveNativeIdeOutput(source, []), /Yama listesi boş/, "boş yama listesi reddedilmeli");
  assert.throws(() => saveNativeIdeOutput(source, [{ ...beamPatch, field: "elementName" as never }]), /Bilinmeyen yama alanı/, "tanınmayan alan reddedilmeli");
  assert.throws(() => saveNativeIdeOutput(source, [{ ...beamPatch, id: `${beam.id}-yanlis` }]), /Yama hedefi doğrulanamadı/, "id/konum uyuşmazlığı reddedilmeli");
  assert.throws(() => saveNativeIdeOutput(source, [{ ...beamPatch, sourceOffset: beam.sourceOffset + 400 }]), /Yama hedefi doğrulanamadı/, "çözülmemiş konuma yama reddedilmeli");
  assert.throws(() => saveNativeIdeOutput(source, [{ id: nonBeam.id, sourceOffset: nonBeam.sourceOffset, field: "beamSectionHeight", value: 0.6 }]), /Yama reddedildi.*kiriş/, "kiriş dışı kayıt türüne kiriş alanı reddedilmeli");
  assert.throws(() => saveNativeIdeOutput(source, [{ ...beamPatch, value: 0 }]), /aralık dışı/, "aralık dışı değer (0) reddedilmeli");
  assert.throws(() => saveNativeIdeOutput(source, [{ ...beamPatch, value: -0.5 }]), /aralık dışı/, "negatif değer reddedilmeli");
  assert.throws(() => saveNativeIdeOutput(source, [{ ...beamPatch, value: 100.5 }]), /aralık dışı/, "üst sınır aşımı reddedilmeli");
  assert.throws(() => saveNativeIdeOutput(source, [{ ...beamPatch, value: NaN }]), /aralık dışı/, "NaN reddedilmeli");
  assert.throws(() => saveNativeIdeOutput(source, [beamPatch, { ...beamPatch, value: 0.7 }]), /Muğlak yama/, "aynı alana çift yama reddedilmeli");
  assert.equal(digest(source), X11_SHA, "reddedilen yamalar kaynak baytlarını değiştirmemeli");
});

test("v10 (201094) kaynağında tipli kiriş kesit alanı yoktur; yama açık hata kalır", { skip: !existsSync(A0_PATH), timeout: 300_000 }, () => {
  const { bytes: source, buffer } = loadCarrier(A0_PATH);
  const project = parseIde10(buffer, "A0_orijinal.ide10");
  const beam = project.elements.find(e => e.type === "beam" && e.height !== undefined && e.width !== undefined);
  assert.ok(beam, "A0 içinde etiket kaynaklı kesitli kiriş bulunamadı");
  assert.throws(
    () => saveNativeIdeOutput(source, [{ id: beam.id, sourceOffset: beam.sourceOffset, field: "beamSectionHeight", value: 0.6 }]),
    /grameri doğrulanamadı|tipli kesit alanı çözülmemiş/,
    "v10 etiket türevli kesite yerinde yama reddedilmeli",
  );
});

test("bozuk CRC'li kaynak üzerine yama yapılmaz; hata otomatik onarılmaz", { skip: !existsSync(X11_PATH), timeout: 120_000 }, () => {
  const { bytes: source } = loadCarrier(X11_PATH);
  const damaged = Uint8Array.from(source);
  damaged[damaged.length - 1] ^= 1;
  const before = digest(damaged);
  assert.throws(() => saveNativeIdeOutput(damaged, [{ id: "x", sourceOffset: 1000, field: "beamSectionHeight", value: 0.5 }]), /CRC32/);
  assert.throws(() => saveNativeIdeSource(damaged), /CRC32/);
  assert.equal(digest(damaged), before, "bozuk kaynak sessizce mühürlenmemeli");
});

test("saveNativeIdeSource değişiklik dışı kaydetmeyi hâlâ reddediyor (ürün ilkesi korunur)", { skip: !existsSync(X11_PATH), timeout: 300_000 }, () => {
  const { bytes: source, buffer } = loadCarrier(X11_PATH);
  const project = parseIde10(buffer, "X11_downloads.ide11");
  const edited = structuredClone(project);
  const beam = edited.elements.find((e): e is IdeElement & { height: number } => e.type === "beam" && e.height !== undefined);
  assert.ok(beam);
  beam.height += 0.05;
  assert.throws(() => saveNativeIdeSource(source, edited, "ide11"), /Modelde değişiklik var/, "eski yol tüm model değişikliklerini reddetmeli");
  assert.equal(digest(source), X11_SHA, "kaynak ezilmemeli");
});
