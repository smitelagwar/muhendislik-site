import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { parseIde10 } from "./index";
import {
  transcodeIde11TrialToIde10,
  assertIde10GrammarForProduction,
  type Ide10TranscodeDiagnostics,
} from "./ide11-transcoder";
import { scanIde201094Streams } from "./ide-zlib";
import { encodeIdeFloat64 } from "./numeric-codec";
import { validateIdeCarrier } from "./ide-binary-codec";
import ide10GrammarSchema from "./ide10-grammar.json";

/**
 * T-F3.3 — v11→v10 GERÇEK gövde dönüşümü kabul testi.
 *
 * Girdi: korpus B0_orijinal.ide11trial (146.670.887 B, 211280/encoded=1).
 * Donör: A0_orijinal.ide10 (145.671.130 B, 201094) — ideCAD'in AYNI proje için
 * yazdığı native v10 dosyası; yalnız v11 yerleşimi kanıtsız bölgeler için kullanılır.
 * Oracle: 11-KABUL §2 G3 tablosu (30.260 alt-akış; 468 donatı; 2 malzeme;
 * 10 modal; 10/10 deprem; 1.266 geometri; 6/6 kat; XX uydurma=0).
 */
const B0 = "C:/Users/hsyn/Desktop/hsyncad/incelemeler/donusum-esdegerlik-2026-11-15/00-kaynak/B0_orijinal.ide11trial";
const A0 = "C:/Users/hsyn/Desktop/hsyncad/incelemeler/donusum-esdegerlik-2026-11-15/00-kaynak/A0_orijinal.ide10";

const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const buffer = (bytes: Uint8Array): ArrayBuffer => Uint8Array.from(bytes).buffer;
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test("ide10-grammar v1.0.2 production contract: required rules are all KANIT; VARSAYIM injection hard-fails", () => {
  const report = assertIde10GrammarForProduction();
  assert.equal(report.semaSurumu, "1.0.2");
  assert.equal(report.rejectedLines.length, 0, `üretim kuralında VARSAYIM olmamalı: ${report.rejectedLines.join(", ")}`);
  assert.ok(report.requiredRules.length >= 20);
  assert.ok(report.assumptionLines.length > 0, "şema VARSAYIM envanterini taşır (yalnız log; üretimde kullanılmaz)");

  // HARD-FAIL gerçekliği: gerekli bir kural satırını VARSAYIM'a çevir → üretim reddi.
  const mutated = JSON.parse(JSON.stringify(ide10GrammarSchema)) as Record<string, unknown>;
  const types = mutated["kayitTipleri"] as Array<Record<string, unknown>>;
  const doseme = types.find(t => t["id"] === "DOSEME-KAYDI")!;
  for (const field of doseme["alanlar"] as Array<Record<string, unknown>>) {
    if (field["sira"] === 2) field["kaynak"] = "VARSAYIM";
  }
  assert.throws(
    () => assertIde10GrammarForProduction(mutated as never),
    /tuketiciSozlesme: üretim yolunda VARSAYIM kural kullanılamaz[\s\S]*DOSEME-KAYDI:sira-2/,
  );
});

test("B0 .ide11trial -> real .ide10 body conversion matches the A0 oracle", { skip: !existsSync(B0) || !existsSync(A0), timeout: 600_000 }, () => {
  const source = readFileSync(B0);
  const sourceDigest = digest(source);
  const donor = readFileSync(A0);
  const diagnostics = {} as Ide10TranscodeDiagnostics;
  const converted = transcodeIde11TrialToIde10(source, { ide10Donor: donor, diagnostics });

  // --- Taşıyıcı sözleşmesi: v10 mührü (201094, encoded=0, geçerli CRC). ---
  const outView = new DataView(converted.buffer, converted.byteOffset, converted.byteLength);
  assert.equal(outView.getUint32(74, true), 201094);
  assert.equal(converted[78], 0);
  assert.equal(outView.getUint32(79, true), converted.length);
  const sealed = validateIdeCarrier(converted);
  assert.equal(sealed.formatVersion, 201094);
  assert.equal(sealed.encodedFlag, 0);

  // --- Alt-akış oracle: 30.260 çerçeve; raw toplam A0 ile birebir; comp ±%1 bandı. ---
  const streams = scanIde201094Streams(converted, 0, converted.length, 500_000);
  assert.equal(streams.length, 30_260);
  const totalRaw = streams.reduce((sum, s) => sum + s.rawLength, 0);
  const totalComp = streams.reduce((sum, s) => sum + s.compressedLength, 0);
  assert.equal(totalRaw, 412_781_980, "raw toplam A0 ile birebir olmalı (412.781.980).");
  assert.ok(
    Math.abs(totalComp - 116_600_559) / 116_600_559 <= 0.01,
    `comp toplam A0 (116.600.559) ±%1 bandında olmalı; ölçülen ${totalComp}.`,
  );

  // --- Parse oracles: kat 6/6; eleman 1.273; tip dağılımı A0 ile eşit. ---
  const parsed = parseIde10(buffer(converted), "HS_B0_F3.ide10");
  const prior = parseIde10(buffer(donor), "A0_orijinal.ide10");
  assert.equal(parsed.format, "ide10");
  assert.equal(parsed.floors.length, 6);
  assert.deepEqual(
    parsed.floors.map(f => [f.name, f.elevation, f.height]),
    prior.floors.map(f => [f.name, f.elevation, f.height]),
  );
  assert.equal(parsed.elements.length, 1_273);
  assert.deepEqual(parsed.coverage.byType, prior.coverage.byType);

  // --- Geometri 1.266/1.266 (merdiven-dışı elemanlar) + 7 merdiven ağı. ---
  const key = (e: typeof parsed.elements[number]) => `${e.floorId}:${e.nativeId}`;
  const priorByKey = new Map(prior.elements.map(e => [key(e), e]));
  let geometryMatched = 0;
  let stairMeshMatched = 0;
  for (const e of parsed.elements) {
    const p = priorByKey.get(key(e));
    assert.ok(p, `${key(e)} donörde yok.`);
    assert.equal(e.points.length, p.points.length);
    for (const field of ["nativeZ", "lateralOffset", "rotation"] as const) {
      if (p[field] !== undefined) close(e[field]!, p[field]);
    }
    for (const field of ["width", "thickness"] as const) {
      if (p[field] !== undefined) close(e[field]!, p[field]);
    }
    e.points.forEach((point, i) => { close(point.x, p.points[i].x); close(point.y, p.points[i].y); });
    if (e.type === "stair") {
      assert.deepEqual(e.mesh?.quads, p.mesh?.quads);
      stairMeshMatched++;
    } else {
      geometryMatched++;
    }
  }
  assert.equal(geometryMatched, 1_266, "merdiven-dışı geometri oracle'ı 1.266.");
  assert.equal(stairMeshMatched, 7);

  // --- R1 malzeme: 2/2; anlamsal alanlar A0 ile eşit. ---
  assert.equal(parsed.materials?.length, 2);
  assert.deepEqual(
    parsed.materials?.map(m => [m.name, m.kind, m.fckMpa, m.fykMpa, m.fctkMpa, m.gammaS, m.gammaC, m.elasticModulusMpa, m.poisson, m.unitWeightTfM3]),
    prior.materials?.map(m => [m.name, m.kind, m.fckMpa, m.fykMpa, m.fctkMpa, m.gammaS, m.gammaC, m.elasticModulusMpa, m.poisson, m.unitWeightTfM3]),
  );

  // --- R3 deprem/zemin: 10/10 alan A0 ile birebir (+ tayf kimliği/koordinatlar). ---
  assert.ok(parsed.seismicSoil && prior.seismicSoil);
  for (const field of [
    "exposureClass", "rEntered", "rSelectedRatio", "liveLoadFactorN", "subgradeKoTfM3",
    "bearingCapacityQtTfM2", "importanceI", "spectrumId", "ss", "s1", "sds", "sd1",
    "latitude", "longitude",
  ] as const) {
    assert.deepEqual(
      (parsed.seismicSoil as unknown as Record<string, unknown>)[field],
      (prior.seismicSoil as unknown as Record<string, unknown>)[field],
      `R3 alan ${field} A0 ile eşit olmalı.`,
    );
  }

  // --- R4 donatı: 468/468 = 178 perde + 289 kiriş + 1 radye; değerler A0 ile birebir. ---
  const rebarParsed = parsed.elements.filter(e => e.rebarLayout);
  assert.equal(rebarParsed.length, 468);
  const kinds = { wall: 0, beam: 0, raft: 0 } as Record<string, number>;
  for (const e of rebarParsed) kinds[e.rebarLayout!.kind]++;
  assert.deepEqual(kinds, { wall: 178, beam: 289, raft: 1 });
  const priorRebar = new Map(prior.elements.filter(e => e.rebarLayout).map(e => [key(e), e.rebarLayout]));
  for (const e of rebarParsed) {
    const p = priorRebar.get(key(e));
    assert.ok(p, `${key(e)} donörde donatı yok.`);
    assert.deepEqual(e.rebarLayout, p, `${key(e)} donatı düzeni A0 ile birebir olmalı.`);
  }

  // --- R5 modal: 10 tablo; frekans/kayıt A0 ile bit-özdeş; F9 akım sayıları. ---
  assert.equal(parsed.f9Results?.modalTables.length, 10);
  assert.deepEqual(
    parsed.f9Results?.modalTables.map(t => [t.name, t.modeCount, t.frequenciesHz, t.gamma, t.effectiveMassT]),
    prior.f9Results?.modalTables.map(t => [t.name, t.modeCount, t.frequenciesHz, t.gamma, t.effectiveMassT]),
  );
  assert.deepEqual(
    [parsed.f9Results?.barForceStreamsCount, parsed.f9Results?.nodalDisplacementStreamsCount, parsed.f9Results?.shellResultStreamsCount],
    [1057, 28001, 373],
  );

  // --- XX etiket kuralı: uydurma 0 — kiriş/perde etiketleri donörle birebir. ---
  assert.equal(parsed.elements.filter(e => e.type === "beam" && e.sectionLabel).length, 357);
  for (const e of parsed.elements.filter(el => el.type === "beam")) {
    const p = priorByKey.get(key(e));
    assert.equal(e.sectionLabel, p?.sectionLabel, `${key(e)} kiriş etiketi A0 ile eşit olmalı.`);
  }
  assert.equal(parsed.elements.filter(e => e.type === "wall" && e.structural && e.planAnnotation?.section).length, 196);
  for (const e of parsed.elements.filter(el => el.type === "wall" && el.structural)) {
    const p = priorByKey.get(key(e));
    assert.equal(e.planAnnotation?.section, p?.planAnnotation?.section, `${key(e)} perde kesiti donör değeriyle eşit olmalı.`);
  }

  // --- Dönüşüm tanıklaması (diagnostics): çerçeveler, donör bölgeleri, çapraz doğrulamalar. ---
  // Planın merdiven dalı 7 merdiven ağının sihrini önceden 201094'e yazar; kalan
  // 30.252 kaynak-sürüm çerçevesi çerçeve geçişinde yeniden yazılır (30.252+7+1=30.260).
  assert.equal(diagnostics.frames.rewritten, 30_252, "211280 sihirli kalan 30.252 çerçeve 201094'e yazılmalı.");
  assert.equal(diagnostics.frames.native201094, 8, "#1885 ikizi + 7 merdiven çerçevesi 201094 sihriyle durmalı.");
  assert.ok(diagnostics.frames.preludeFlagsCleared > 0, "v11 [1][1][1] önyazı bayrakları temizlenmeli.");
  assert.ok(diagnostics.donor);
  // G3 critic BULGU-3: eski iddia `recordsMatched === recordsMatched` öz-ontolojisiydi.
  // Gerçek tek taraflı iddia: donör kayıt eşleşmesi (tüm kayıt listesi) R4 donatı
  // bloklarının kayıt evrenini (perde+kiriş+radye; 468-blok sayımıyla aynı kök) kapsar.
  const donorR4Records = diagnostics.donor!.r4.wall + diagnostics.donor!.r4.beam + diagnostics.donor!.r4.raft;
  assert.ok(
    diagnostics.donor!.recordsMatched >= donorR4Records && donorR4Records > 0,
    `donör kayıt eşleşmesi (${diagnostics.donor!.recordsMatched}) tüm R4 donatı kayıtlarını (${donorR4Records}) kapsamalı — kayıt eşleşmesi atlanmadı.`,
  );
  assert.ok(diagnostics.donor!.r1.records === 2);
  assert.ok(diagnostics.donor!.r1.slotsDonorFallback <= 2, "en fazla FP ters dönüş yuvası donörle tamamlanmalı.");
  assert.equal(diagnostics.donor!.r3.fieldsBitExact, true, "R3 kaynak değerleri donör bloğuyla bit-özdeş olmalı.");
  assert.equal(diagnostics.donor!.r3.patches, 7, "R3 ko-yuvası bazlı yamalar (çapa + 6 alan).");
  assert.equal(
    diagnostics.donor!.r4.blocksVerified + diagnostics.donor!.r4.blockMismatches + diagnostics.donor!.r4.tupleUnresolved,
    468,
    "R4 468 bloğun tamamı çapraz doğrulanmalı.",
  );
  assert.equal(diagnostics.donor!.r5.regionBytesEqual, true, "R5 bölgesi donörle bayt-özdeş üretilmeli.");
  assert.equal(diagnostics.donor!.spectrum.fieldsBitExact, true, "tayf alanları donörle bit-özdeş.");

  // --- T-F3.3d (H2): gap-düzeyi A0 nakli — akış-çapa + beş bölge Δlen=0 +
  // B0-wins geri-enjeksiyon bayt-özdeşliği + işaretli A0-kalıntı envanteri. ---
  const transplant = diagnostics.gapTransplant!;
  assert.ok(transplant, "T-F3.3d gap-düzeyi nakli diagnostics rapor vermelidir.");
  assert.equal(transplant.applied, true, "B0/A0 akış-çapası eşit olmalı (30.260 çerçeve + rawLen dizisi).");
  assert.equal(transplant.framesMatched, 30_260);
  assert.equal(transplant.rawLenMismatch, 0);
  assert.equal(transplant.gapSegments, 30_261, "çerçeve-dışı koşu sayısı = çerçeve sayısı + 1.");
  assert.deepEqual(
    transplant.regionBoundaries,
    { araGapIndex: 1886, kuyrukGapIndex: 30_260 },
    "bölge sınırları t33c fark haritası KANIT sınırlarıyla çakışmalı.",
  );
  for (const region of ["BASLIK-ONKAT", "ELEMAN-KAYITLARI", "ARA-BOLGE", "F9-KABUK", "KUYRUK"]) {
    assert.equal(transplant.regionLenDelta[region], 0, `nakil kuralı 3: bölge ${region} Δlen=0 olmalı.`);
  }
  assert.equal(transplant.preludeMismatch, 0, "v3 önyazı baytları A0'nın önyazılarıyla birebir olmalı (t33c ölçümü 0).");
  assert.equal(
    transplant.headBytesWork + transplant.frameBytesWork + transplant.gapBytesDonor,
    converted.length,
    "v3 boyut muhasebesi: v2 kafası + v2 çerçeveleri + A0 gap'leri.",
  );
  const b0Wins = transplant.b0Wins;
  assert.deepEqual(
    [b0Wins.beamLabels, b0Wins.wallLabels, b0Wins.slabLines, b0Wins.wallRebar, b0Wins.beamRebar, b0Wins.raftRebar, b0Wins.stairMarkers],
    [357, 196, 159, 178, 289, 1, 7],
    "KANIT'lı B0 alanlarının tamamı nakil şablonunda bulunup geri yazılmalı/ doğrulanmalı.",
  );
  assert.equal(b0Wins.slotBytesWritten, 0, "B0-wins geri-enjeksiyonu bu korpus çiftinde bayt-özdeş dönmeli (fikir-t33d önermesi).");
  assert.equal(b0Wins.slotNotFound, 0, "bulunamayan B0-wins yuvası olmamalı (HARD-FAIL sözleşmesi).");
  assert.equal(b0Wins.slotLengthMismatches, 0, "yuva uzunluk kırığı olmamalı (yerleşim korunmalı).");
  // Perde etiketi kanonik sapması: t33 hasadının kanoniği ↔ A0'nın depolanmış
  // etiketi — değer A0 hasadından geldiği için A0'nın baytları kalır, 392 yuva
  // işaretli envantere girer (sessiz değil; şema alan-haritası takibine devir).
  assert.equal(b0Wins.wallLabelCanonicalDivergences, 392, "196 perde × (kesit + ad-kesit) kanonik sapma işaretlenmeli.");
  const remnants = transplant.a0Remnants;
  assert.ok(remnants.geometryCompared > 300_000, `geometri f64 karşılaştırması kapsamlı olmalı; ölçülen ${remnants.geometryCompared}.`);
  assert.equal(
    remnants.geometryBitExact + remnants.ulpItems.length + remnants.conflicts.length,
    remnants.geometryCompared,
    "geometri envanteri muhasebesi tutmalı (bit-özdeş + yeniden hesap + çatışma).",
  );
  assert.equal(remnants.conflicts.length, 0, "gerçek değer çatışması (10,67↔11,15 sınıfı) bu korpus çiftinde kalmamalı.");
  assert.ok(remnants.ulpItems.length > 0, "v11 yeniden hesap sınıfı işaretli envanterde görünmeli.");

  // --- Kaynak değişmezliği: B0 hem bellekte hem diskte dokunulmamış. ---
  assert.equal(digest(source), sourceDigest);
  assert.equal(digest(readFileSync(B0)), sourceDigest);
});

/**
 * T-F3.3c — V-ENCODED gövde sözleşmesi: çıktıda kodlu f64 artığı YOK.
 *
 * Kök neden (T-F3.4 3/3 APPCRASH): plan yalnız kataloglanmış ofsetleri
 * düzleştiriyordu; katalog dışı kodlu bloklar encoded=0 mühürlü gövdede kalıp
 * ideCAD v10 yükleyicisinde çöp f64 olarak okunuyordu. Süpürme kuralı bunları
 * yerinde çözer. Oracle: HS_B0_F3.ide10'da ölçülen kodlu artıklar
 * (encode(0) 320.318, encode(1) 10.290, encode(0.1) 1.617, encode(0.5) 896
 * geçiş) çıktının akış-dışı bölgelerinde SIFIR olmalı.
 */
test("ide10 output body carries no vocabulary-encoded f64 leftovers (T-F3.3c sweep)", { skip: !existsSync(B0) || !existsSync(A0), timeout: 900_000 }, () => {
  const source = readFileSync(B0);
  const donor = readFileSync(A0);
  const donorDigest = digest(donor);
  const diagnostics = {} as Ide10TranscodeDiagnostics;
  const converted = transcodeIde11TrialToIde10(source, { ide10Donor: donor, diagnostics });

  // Süpürme tanıklaması: sözlük kurulmuş ve katalog-dışı bloklar çözülmüş olmalı.
  assert.ok(diagnostics.donor, "donör hattı çalışmalı.");
  const sweep = diagnostics.donor!.encodedSweep;
  assert.ok(sweep, "T-F3.3c kodlu blok süpürmesi diagnostics'e rapor vermelidir.");
  assert.ok(sweep!.vocabularyValues > 100_000, `sözlük anlamlı boyutta olmalı; ölçülen ${sweep!.vocabularyValues}.`);
  assert.ok(sweep!.blocksDecoded > 100_000, `katalog-dışı kodlu blok sayısı beklenen büyüklükte olmalı; ölçülen ${sweep!.blocksDecoded}.`);

  // Kesin oracle: bilinen kodlu örüntülerin akış-dışı geçiş sayısı SIFIR olmalı.
  const view = new DataView(converted.buffer, converted.byteOffset, converted.byteLength);
  const nameLen = view.getUint32(96, true);
  const previewEnd = 116 + nameLen + view.getUint32(112 + nameLen, true);
  const frames = scanIde201094Streams(converted, 0, converted.length, 500_000)
    .map((f) => [f.payloadOffset, f.endOffset] as const);
  const occurrences = (needle: Uint8Array): number => {
    let count = 0, p = previewEnd, fi = 0;
    while (p + 8 <= converted.length) {
      while (fi < frames.length && frames[fi][1] <= p) fi++;
      if (fi < frames.length && p >= frames[fi][0]) { p = frames[fi][1]; continue; }
      let equal = true;
      for (let j = 0; j < 8; j++) if (converted[p + j] !== needle[j]) { equal = false; break; }
      if (equal) count++;
      p++;
    }
    return count;
  };
  for (const value of [0, 1, 0.1, 0.5, 0.2, 0.3, 0.4, 0.8]) {
    assert.equal(
      occurrences(encodeIdeFloat64(value)),
      0,
      `encode(${value}) örüntüsü akış-dışı gövdede kalmamalı (süpürme sözleşmesi).`,
    );
  }

  // Donör değişmezliği: süpürme yalnız çalışma tamponunda okur/yazar.
  assert.equal(digest(donor), donorDigest);
  assert.equal(digest(readFileSync(A0)), donorDigest);
});
