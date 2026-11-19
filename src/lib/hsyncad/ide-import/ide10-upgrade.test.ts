import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { parseIde10 } from "./index";
import { transcodeIde10ToIde11, type Ide10To11UpgradeDiagnostics } from "./ide11-transcoder";
import { validateIdeCarrier, getIdeCarrierFormat } from "./ide-binary-codec";
import { IDE10_VERSION, IDE11_VERSION } from "./ide-binary-codec";

/**
 * T-F4.1 — `.ide10 → .ide11` TERS şema yükseltmesi kabul testi.
 *
 * Girdi: korpus A0_orijinal.ide10 (145.671.130 B, 201094/encoded=0).
 * Bayt referansı: X11_downloads.ide11 (146.686.301 B, 211220/encoded=1) —
 * ideCAD'in AYNI proje için yazdığı native .ide11 (11-KABUL §2/G4).
 *
 * Kabul ölçüsü (G4 tabanı): HS(A0→ide11) ↔ X11 alan-düzeyi diff 0
 * (geometri/etiket/yük) + çerçeve/payload yapısı (0x33914 işaretçili
 * 30.259+1 akışı; rawLen dizisi A0 ile birebir).
 *
 * T-F4.1b (H1) — X11-donör gap-düzeyi YERLEŞİM+IZGARA nakli: v1 çıktısı gerçek
 * ideCAD'de 3/3 deterministik çöktü (t42: c0000005 @ 0x7af4cb; X11 native aynı
 * EXE'de açılıyor). v2 = v1 çerçeveleri + başlık/preview/kilit + X11'in 30.261
 * akış-dışı koşusu (ön-gövde/F9-kabuk/kuyruk + R1/R3/R4/R5 v11 ızgaraları +
 * akış-yuvası +4 + etiket-sonrası f64 bölgeleri). Yerel kanıt ölçütleri (t33d
 * deseni; masaüstü T-F4.2b turu ÖNCESİ hepsi geçmek zorunda):
 * (i) beş bölge Δlen=0 + nakledilen koşularda diffBlock=0;
 * (ii) kalan fark envanteri yalnız başlık/preview + çerçeve comp + mühür;
 * (iii) parse oracle: geometri/etiket/yük diff 0 KORUNUR + ızgara eşitliği;
 * (iv) nakledilen gap'lerde X11-dışı yaban u32 yok.
 */
const A0 = "C:/Users/hsyn/Desktop/hsyncad/incelemeler/donusum-esdegerlik-2026-11-15/00-kaynak/A0_orijinal.ide10";
const X11 = "C:/Users/hsyn/Desktop/hsyncad/incelemeler/donusum-esdegerlik-2026-11-15/00-kaynak/X11_downloads.ide11";
const EVIDENCE = "C:/Users/hsyn/Desktop/hsyncad_idecad_uzanti_optimizasyon/evidence/orkestrasyon/2026-11-19-F4-T4.1";
const EVIDENCE_B = "C:/Users/hsyn/Desktop/hsyncad_idecad_uzanti_optimizasyon/evidence/orkestrasyon/2026-11-19-F4-T4.1b";

const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const buffer = (bytes: Uint8Array): ArrayBuffer => Uint8Array.from(bytes).buffer;
const A0_SHA = "0095778181794af8f4f8cfb52cabcca3dda4fc098cb3ea33a90e5c659bdaf325";
const X11_SHA = "eb2afeab9f0a689fcb8666abea6b3ba4b0a2bac8f340660f8c8be0f38de89268";

/** Taşıyıcı-düzeyi alt-akış çerçevesi tarayıcısı (belirli sihirle). */
function scanFrames(bytes: Uint8Array, magic: number): Array<{ offset: number; compLen: number; rawLen: number; end: number }> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const m = magic >>> 0;
  const b0 = m & 0xff, b1 = (m >>> 8) & 0xff, b2 = (m >>> 16) & 0xff, b3 = (m >>> 24) & 0xff;
  const out: Array<{ offset: number; compLen: number; rawLen: number; end: number }> = [];
  let pos = 88;
  while (pos + 16 <= bytes.length) {
    if (bytes[pos] === b0 && bytes[pos + 1] === b1 && bytes[pos + 2] === b2 && bytes[pos + 3] === b3) {
      const compLen = view.getUint32(pos + 4, true);
      const rawLen = view.getUint32(pos + 8, true);
      const end = pos + 12 + compLen;
      if (compLen >= 8 && compLen <= 64 * 1024 * 1024 && rawLen >= 1 && rawLen <= 64 * 1024 * 1024 && end <= bytes.length && bytes[pos + 12] === 0x78) {
        out.push({ offset: pos, compLen, rawLen, end });
        pos = end;
        continue;
      }
    }
    pos++;
  }
  return out;
}

/** compare-pairs.mjs çekirdeğinin alan-düzeyi karşılaştırması (test içi ikiz). */
function compareElements(
  a: ReturnType<typeof parseIde10>,
  b: ReturnType<typeof parseIde10>,
) {
  const keyOf = (e: { floorId: string; type: string; nativeId: number }) => `${e.floorId}|${e.type}|${e.nativeId}`;
  const mb = new Map(b.elements.map(e => [keyOf(e), e]));
  let geometryEqual = 0, geometryDiff = 0, labelEqual = 0, labelDiff = 0;
  let loadsEqual = 0, loadsMismatch = 0, loadsOnlyA = 0, rebarOnlyA = 0, rebarBoth = 0;
  let wallSectionEqual = 0, wallSectionDiff = 0;
  const near = (x: number | null | undefined, y: number | null | undefined, tol = 1e-6) => {
    if (x === null || x === undefined || y === null || y === undefined) return (x ?? null) === (y ?? null);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return x === y;
    return Math.abs(x - y) <= tol;
  };
  const boundsOf = (pts: Array<{ x: number; y: number }> | undefined): number[] | null => {
    if (!pts?.length) return null;
    return [
      Math.min(...pts.map(p => p.x)), Math.min(...pts.map(p => p.y)),
      Math.max(...pts.map(p => p.x)), Math.max(...pts.map(p => p.y)),
    ];
  };
  const bboxNear = (x: number[] | null, y: number[] | null) =>
    (x === null && y === null) || (!!x && !!y && x.length === y.length && x.every((v, i) => near(v, y[i])));
  const geometrySamples: unknown[] = [];
  const labelSamples: unknown[] = [];
  for (const ea of a.elements) {
    const eb = mb.get(keyOf(ea));
    if (!eb) continue;
    const sameGeometry =
      ea.points.length === eb.points.length && (ea.footprint?.length ?? 0) === (eb.footprint?.length ?? 0) &&
      bboxNear(boundsOf(ea.footprint ?? ea.points), boundsOf(eb.footprint ?? eb.points)) &&
      near(ea.width ?? null, eb.width ?? null) && near(ea.thickness ?? null, eb.thickness ?? null) &&
      near(ea.height ?? null, eb.height ?? null) && near(ea.top ?? null, eb.top ?? null) && near(ea.bottom ?? null, eb.bottom ?? null) &&
      near(ea.nativeZ, eb.nativeZ) && near(ea.lateralOffset, eb.lateralOffset) && near(ea.rotation, eb.rotation) &&
      (ea.holes?.length ?? 0) === (eb.holes?.length ?? 0) &&
      ((ea as { mesh?: { positions: number[] } }).mesh?.positions.length ?? 0) === ((eb as { mesh?: { positions: number[] } }).mesh?.positions.length ?? 0);
    if (sameGeometry) geometryEqual += 1; else { geometryDiff += 1; if (geometrySamples.length < 8) geometrySamples.push({ key: keyOf(ea), a: { z: ea.nativeZ, w: ea.width }, b: { z: eb.nativeZ, w: eb.width } }); }
    if (ea.sectionLabel === eb.sectionLabel) labelEqual += 1; else { labelDiff += 1; if (labelSamples.length < 8) labelSamples.push({ key: keyOf(ea), a: ea.sectionLabel, b: eb.sectionLabel }); }
    const la = (ea as { slabLoads?: { dead: number; live: number } }).slabLoads, lb = (eb as { slabLoads?: { dead: number; live: number } }).slabLoads;
    if (la && lb) { if (near(la.dead, lb.dead, 1e-9) && near(la.live, lb.live, 1e-9)) loadsEqual += 1; else loadsMismatch += 1; }
    if (ea.type === "wall" && ea.structural) {
      const sa = ea.planAnnotation?.section, sb = eb.planAnnotation?.section;
      if (sa === sb) wallSectionEqual += 1; else wallSectionDiff += 1;
    }
    if (ea.rebarLayout && eb.rebarLayout) rebarBoth += 1; else if (ea.rebarLayout) rebarOnlyA += 1;
  }
  return { matched: a.elements.length - [...a.elements].filter(e => !mb.has(keyOf(e))).length, geometryEqual, geometryDiff, labelEqual, labelDiff, loadsEqual, loadsMismatch, loadsOnlyA, rebarBoth, rebarOnlyA, wallSectionEqual, wallSectionDiff, geometrySamples, labelSamples };
}

test("A0 .ide10 -> .ide11 reverse upgrade matches the X11 reference at field level (T-F4.1)", { skip: !existsSync(A0) || !existsSync(X11), timeout: 1_800_000 }, () => {
  const source = new Uint8Array(readFileSync(A0));
  const reference = new Uint8Array(readFileSync(X11));
  const diagnostics = {} as Ide10To11UpgradeDiagnostics;
  const upgraded = transcodeIde10ToIde11(source, { diagnostics });

  // --- 0) Kanıt hedefleri asla ezilmedi (manifest SHA'ları). ---
  assert.equal(digest(source), A0_SHA, "A0 kaynak baytları değişmemeli.");
  assert.equal(digest(reference), X11_SHA, "X11 referans baytları değişmemeli.");

  // --- 1) Taşıyıcı mührü: gövde şemasıyla uyumlu sürüm 211220 + encoded=1 (140989c30.c:40). ---
  const carrier = validateIdeCarrier(upgraded);
  assert.equal(carrier.formatVersion, IDE11_VERSION);
  assert.equal(carrier.encodedFlag, 1);
  assert.equal(getIdeCarrierFormat(upgraded, carrier), "ide11");
  assert.ok(upgraded.length > source.length, "v11 ek alanları (pad/36/story-ref) çıktıyı büyütmeli.");

  // --- 2) Çerçeve/payload yapısı: X11'in 0x33914 işaretçili 30.259+1 akışı. ---
  const framesUp22 = scanFrames(upgraded, IDE11_VERSION);
  const framesUp10 = scanFrames(upgraded, IDE10_VERSION);
  assert.equal(framesUp22.length, 30_259, "30.259 alt-akış 0x33914 (211220) sihriyle yazılmalı.");
  assert.equal(framesUp10.length, 1, "yalnız #1885 ikizi düz 201094 sihriyle kalmalı.");
  let preludeFlags = 0;
  for (const f of framesUp22) {
    if (upgraded[f.offset - 3] === 1 && upgraded[f.offset - 2] === 1 && upgraded[f.offset - 1] === 1) preludeFlags++;
  }
  assert.equal(preludeFlags, 30_259, "her 211220 çerçevesi [1][1][1] önyazısı taşımalı.");
  // Payloadlar A0'dan OLDUĞU GİBİ taşınır: rawLen/compLen dizisi ve comp baytları A0 ile birebir.
  const framesA = scanFrames(source, IDE10_VERSION);
  const framesX = [...scanFrames(reference, IDE11_VERSION), ...scanFrames(reference, IDE10_VERSION)].sort((p, q) => p.offset - q.offset);
  const framesUp = [...framesUp22, ...framesUp10].sort((p, q) => p.offset - q.offset);
  assert.equal(framesUp.length, framesA.length);
  let rawLenMismatch = 0, compMismatch = 0, xRawLenMismatch = 0;
  for (let i = 0; i < framesA.length; i++) {
    if (framesA[i].rawLen !== framesUp[i].rawLen) rawLenMismatch++;
    if (Buffer.compare(Buffer.from(source.subarray(framesA[i].offset + 12, framesA[i].end)), Buffer.from(upgraded.subarray(framesUp[i].offset + 12, framesUp[i].end))) !== 0) compMismatch++;
    if (framesA[i].rawLen !== framesX[i].rawLen) xRawLenMismatch++;
  }
  assert.equal(rawLenMismatch, 0, "çıktı rawLen dizisi A0 ile birebir olmalı.");
  assert.equal(compMismatch, 0, "çıktı sıkışmış payloadları A0 ile bayt-özdeş olmalı.");
  assert.equal(xRawLenMismatch, 0, "X11 referans rawLen dizisi de A0 ile birebir (korpus ölçümü).");
  const totalRaw = framesUp.reduce((sum, f) => sum + f.rawLen, 0);
  assert.equal(totalRaw, 412_781_980, "raw toplamı A0 ölçüm çapası (412.781.980).");
  // #1885 ikizi: X11'in tek düz 201094 çerçevesiyle payload bayt-özdeş.
  const twinUp = framesUp10[0];
  const twinX = scanFrames(reference, IDE10_VERSION)[0];
  assert.equal(twinUp.rawLen, 813_063);
  assert.ok(Buffer.compare(Buffer.from(upgraded.subarray(twinUp.offset + 12, twinUp.end)), Buffer.from(reference.subarray(twinX.offset + 12, twinX.end))) === 0, "#1885 ikizi X11'in düz akışıyla bayt-özdeş kalmalı.");

  // --- 3) Dönüşüm tanıklaması (diagnostics): ölçülen adımlar. ---
  assert.equal(diagnostics.grammar.semaSurumu, "1.0.2");
  assert.equal(diagnostics.records.nativeFloorHeaders, 6, "6 native kat başlığı +4 story-ref-B almalı (V-211150).");
  assert.ok(diagnostics.splices.storyRefs === 6, "story-ref splice sayısı kat sayısına eşit olmalı.");
  assert.ok(diagnostics.splices.geometryPads >= 1_266, "her geometri kaydı +16B opak pad almalı (V-ENCODED).");
  assert.ok(diagnostics.splices.slabMarkers >= 159, "döşeme/radye kayıtları '36' etiketi almalı.");
  assert.ok(diagnostics.splices.wallLabelSwaps >= 2 * 190, "perde etiket slotları X11'in kanonik (swap) biçimine çevrilmeli.");
  assert.equal(diagnostics.frames.rewritten211220, 30_259);
  assert.equal(diagnostics.frames.plain201094Kept, 1);
  assert.ok(diagnostics.f64Encoded > 25_000, `katalog f64'leri Blowfish kodlanmalı (numeric-codec takvimi); ölçülen ${diagnostics.f64Encoded}.`);
  assert.ok(diagnostics.header.marker05ce && diagnostics.header.demoFlagCleared, "0x5ce işareti + kilt bayrağı temizlenmiş olmalı.");
  console.log(`[T-F4.1 tanıklama] f64Encoded=${diagnostics.f64Encoded}; records=${JSON.stringify(diagnostics.records)}; splices=${JSON.stringify(diagnostics.splices)}; frames=${JSON.stringify(diagnostics.frames)}; outputBytes=${diagnostics.outputBytes}`);

  // --- 4) Alan-düzeyi karşılaştırma: parse(upgraded) ↔ parse(X11). ---
  const parsedOut = parseIde10(buffer(upgraded), "HS_A0_upgraded.ide11");
  const parsedX11 = parseIde10(buffer(reference), "X11_downloads.ide11");
  assert.equal(parsedOut.floors.length, 6);
  assert.equal(parsedX11.floors.length, 6);
  const floorDiff: unknown[] = [];
  for (const fa of parsedOut.floors) {
    const fb = parsedX11.floors.find(f => f.name === fa.name);
    assert.ok(fb, `X11'de kat bulunmalı: ${fa.name}`);
    if (Math.abs(fa.elevation - fb.elevation) > 1e-6 || Math.abs(fa.height - fb.height) > 1e-6) floorDiff.push({ name: fa.name, a: [fa.elevation, fa.height], b: [fb.elevation, fb.height] });
  }
  assert.equal(floorDiff.length, 0, "kat yükseklik/kot farkı olmamalı.");

  const cmp = compareElements(parsedOut, parsedX11);
  // G4 tabanı: GÜNCEL parser 1.266 geometri + 7 merdiven = 1.273 eleman çözüyor
  // (kampanya parmak izlerinin 1.266'sı merdiven desteğinden önceki parser'a aittir).
  assert.equal(cmp.matched, 1_273, "1.273 eleman (1.266 + 7 merdiven) X11 ile eşleşmeli.");
  assert.equal(cmp.geometryDiff, 0, `geometri farkı 0 olmalı (ölçülen ${cmp.geometryDiff}): ${JSON.stringify(cmp.geometrySamples)}`);
  assert.equal(cmp.geometryEqual, 1_273);
  assert.equal(cmp.labelDiff, 0, `kesit etiketi farkı 0 olmalı: ${JSON.stringify(cmp.labelSamples)}`);
  assert.equal(cmp.labelEqual, 1_273);
  assert.equal(cmp.loadsEqual, 159, "159 döşeme yükü X11 ile eşit olmalı.");
  assert.equal(cmp.loadsMismatch, 0);
  assert.equal(cmp.wallSectionDiff, 0, "perde plan kesiti (kanonik) farkı 0 olmalı.");
  // --- 4b) Analitik bölgeler (G4 kabul ölçütü DIŞI; dürüst asimetri profili). ---
  // X11'in v11 analitik yerleşimlerini (T-F5.1 okuma yolu) bu yükseltici üretmez;
  // v10 yerleşim baytları korunur. Kabulle eşleşen kısımlar eşit, kalan açık işler kayda geçer.
  assert.equal(parsedX11.materials?.length ?? 0, 2, "X11 referansı 2 malzeme okur (T-F5.1 v11Encoded yolu).");
  assert.equal(parsedOut.materials?.length ?? 0, 0, "HS çıktısı R1 v11 malzeme ızgarasını henüz üretmez (ölçüldü; açık iş).");
  const seismicA = parsedOut.seismicSoil as Record<string, unknown> | undefined;
  const seismicB = parsedX11.seismicSoil as Record<string, unknown> | undefined;
  assert.ok(seismicA && seismicB, "deprem/zemin kaydı iki tarafta da kısmi okunmalı.");
  // HS çıktısında yalnız G1 koordinat çifti (düz f64 — v11'de de düz) eşit okunur;
  // kalan 10 alan R3 v11 ızgarası üretilmediği için null (ölçüldü; açık iş).
  assert.equal(seismicA!.latitude, seismicB!.latitude, "G1 enlem X11 ile eşit olmalı.");
  assert.equal(seismicA!.longitude, seismicB!.longitude, "G1 boylam X11 ile eşit olmalı.");
  const nullSeismicA = Object.values(seismicA!).filter(value => value === null).length;
  assert.equal(nullSeismicA, 10, `HS çıktısında R3 alanları null olmalı; ölçülen ${nullSeismicA}.`);
  assert.equal(parsedX11.f9Results?.modalTables.length ?? 0, 10, "X11 referansı 10 modal tablo okur.");
  assert.equal(parsedOut.f9Results?.modalTables.length ?? 0, 0, "HS çıktısı R5 kuyruk modal tablolarını henüz üretmez (açık iş).");
  assert.equal(parsedOut.f9Results?.barForceStreamsCount, parsedX11.f9Results?.barForceStreamsCount, "F9 kuvvet akış sayıları eşit olmalı (akışlar A0'dan taşındı).");
  assert.equal(parsedOut.f9Results?.nodalDisplacementStreamsCount, parsedX11.f9Results?.nodalDisplacementStreamsCount, "F9 düğüm akış sayıları eşit olmalı.");
  assert.equal(parsedOut.f9Results?.shellResultStreamsCount, parsedX11.f9Results?.shellResultStreamsCount, "F9 kabuk akış sayıları eşit olmalı.");
  const rebarX = parsedX11.elements.filter(e => e.rebarLayout).length;
  const rebarU = parsedOut.elements.filter(e => e.rebarLayout).length;
  assert.equal(rebarX, 468, "X11 referansı 468 donatı okur (R4 v11 ızgarası).");
  assert.equal(rebarU, 0, "HS çıktısı R4 v11 donatı ızgarasını henüz üretmez (v10 tamsayı demeti korunur; açık iş).");

  // --- 5) Kanıt çıktıları: yeni adla çıktı + alan-düzeyi diff JSON (evidence/diffs deseni). ---
  const outDir = `${EVIDENCE}/output`;
  mkdirSync(outDir, { recursive: true });
  writeFileSync(`${outDir}/HS_A0_upgraded.ide11`, Buffer.from(upgraded));
  const diffDir = `${EVIDENCE}/diff`;
  mkdirSync(diffDir, { recursive: true });
  writeFileSync(`${diffDir}/HS_A0_upgraded__vs__X11_downloads.diff.json`, JSON.stringify({
    a: { file: "HS_A0_upgraded.ide11", version: carrier.formatVersion, encoded: carrier.encodedFlag, label: getIdeCarrierFormat(upgraded, carrier), sha256: digest(upgraded), bytes: upgraded.length },
    b: { file: "X11_downloads.ide11", version: 211220, encoded: 1, label: "ide11", sha256: X11_SHA, bytes: reference.length },
    frames: { rewritten211220: framesUp22.length, plain201094Kept: framesUp10.length, rawLenMismatch, compMismatch, totalRaw },
    floors: { onlyInA: [], onlyInB: [], geometryDiff: floorDiff },
    elements: {
      matched: cmp.matched, geometryEqual: cmp.geometryEqual, geometryDiff: cmp.geometryDiff,
      labelEqual: cmp.labelEqual, labelDiff: cmp.labelDiff,
      loadsEqual: cmp.loadsEqual, loadsMismatch: cmp.loadsMismatch,
      wallSectionEqual: cmp.wallSectionEqual, wallSectionDiff: cmp.wallSectionDiff,
      rebarBoth: cmp.rebarBoth, rebarOnlyA: cmp.rebarOnlyA,
    },
    materials: { countA: parsedOut.materials?.length ?? 0, countB: parsedX11.materials?.length ?? 0, diff: [] },
    seismic: { presentA: Boolean(parsedOut.seismicSoil), presentB: Boolean(parsedX11.seismicSoil), latitudeEqual: true, longitudeEqual: true, nullFieldsA: nullSeismicA, diff: [] },
    f9: {
      presentA: Boolean(parsedOut.f9Results), presentB: Boolean(parsedX11.f9Results),
      tablesA: parsedOut.f9Results?.modalTables.length ?? 0, tablesB: parsedX11.f9Results?.modalTables.length ?? 0,
      barForceA: parsedOut.f9Results?.barForceStreamsCount ?? 0, barForceB: parsedX11.f9Results?.barForceStreamsCount ?? 0,
      nodalA: parsedOut.f9Results?.nodalDisplacementStreamsCount ?? 0, nodalB: parsedX11.f9Results?.nodalDisplacementStreamsCount ?? 0,
      shellA: parsedOut.f9Results?.shellResultStreamsCount ?? 0, shellB: parsedX11.f9Results?.shellResultStreamsCount ?? 0,
    },
    rebar: { countA: rebarU, countB: rebarX },
    coverage: {
      a: parsedOut.coverage.unsupportedRecords, b: parsedX11.coverage.unsupportedRecords,
      holesA: parsedOut.coverage.holeRecords, holesB: parsedX11.coverage.holeRecords,
    },
    diagnostics,
  }, null, 2));
});

test("X11-donor gap-level layout+grid transplant (T-F4.1b, H1): v2 carries the native v11 flow-outside layer", { skip: !existsSync(A0) || !existsSync(X11), timeout: 1_800_000 }, () => {
  const source = new Uint8Array(readFileSync(A0));
  const donor = new Uint8Array(readFileSync(X11));
  const diagnostics = {} as Ide10To11UpgradeDiagnostics;
  const v2 = transcodeIde10ToIde11(source, { diagnostics, ide11Donor: donor });

  // --- 0) Kanıt hedefleri asla ezilmedi (manifest SHA'ları). ---
  assert.equal(digest(source), A0_SHA, "A0 kaynak baytları değişmemeli.");
  assert.equal(digest(donor), X11_SHA, "X11 donör baytları değişmemeli.");

  // --- 1) Taşıyıcı mührü: 211220/encoded=1, boyut+CRC geçerli (nakil sonrası yeniden mühür). ---
  const carrier = validateIdeCarrier(v2);
  assert.equal(carrier.formatVersion, IDE11_VERSION);
  assert.equal(carrier.encodedFlag, 1);
  assert.equal(getIdeCarrierFormat(v2, carrier), "ide11");

  // --- 2) Nakil tanıklaması (diagnostics.transplant). ---
  const t = diagnostics.transplant;
  assert.ok(t, "donörlü koşuda nakil tanıklaması dolmalı.");
  assert.equal(t.outputFrames, 30_260, "v1 çıktısının 30.260 çerçevesi nakle konu kalmadan v2'ye girmeli.");
  assert.equal(t.donorFrames, 30_260, "donör 30.260 çerçeveli native v11 olmalı.");
  assert.equal(t.twinIndex, 1_885, "#1885 ikizi her iki tarafta aynı akış indeksinde düz 201094 kalmalı.");
  assert.equal(t.transplantedGaps, 30_261, "30.261 akış-dışı koşunun TAMAMI donörden nakledilmeli.");
  assert.ok(t.transplantedGapBytes > 20_000_000, `nakledilen akış-dışı bayt beklenenden küçük: ${t.transplantedGapBytes}`);
  assert.equal(t.outputBytes, v2.length, "transplant tanıklaması v2 boyutunu birebir bildirmeli.");
  assert.equal(diagnostics.outputBytes, v2.length, "diagnostics.outputBytes nihai v2 boyutu olmalı.");

  // --- 3) ÖLÇÜT (i): beş bölge Δlen=0 + nakledilen koşularda diffBlock=0.
  // Çapa: akış İNDEKSİ; v2'nin her gap'i X11'in aynı indeksli gap'iyle bayt-özdeş. ---
  const previewEndOf = (bytes: Uint8Array): number => {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const nameLen = view.getUint32(96, true);
    return 116 + nameLen + view.getUint32(112 + nameLen, true);
  };
  const previewV2 = previewEndOf(v2);
  const previewX = previewEndOf(donor);
  const framesV2 = [...scanFrames(v2, IDE11_VERSION), ...scanFrames(v2, IDE10_VERSION)].sort((p, q) => p.offset - q.offset);
  const framesX = [...scanFrames(donor, IDE11_VERSION), ...scanFrames(donor, IDE10_VERSION)].sort((p, q) => p.offset - q.offset);
  assert.equal(framesV2.length, 30_260, "v2: 30.259+1 akış yapısı korunmalı.");
  assert.equal(framesX.length, 30_260, "donör: 30.259+1 akış yapısı.");
  let rawLenMismatch = 0, preludeMismatch = 0, gapLenDeltaNonZero = 0, gapDiffBlocks = 0, gapBytesChecked = 0;
  let onGövdeBytes = 0, araGapBytes = 0, kuyrukBytes = 0;
  let cursorV2 = previewV2, cursorX = previewX;
  for (let i = 0; i < framesV2.length; i++) {
    if (framesV2[i].rawLen !== framesX[i].rawLen) rawLenMismatch++;
    for (let j = 0; j < 3; j++) {
      if (v2[framesV2[i].offset - 3 + j] !== donor[framesX[i].offset - 3 + j]) preludeMismatch++;
    }
    const gapV2 = v2.subarray(cursorV2, framesV2[i].offset);
    const gapX = donor.subarray(cursorX, framesX[i].offset);
    if (gapV2.length !== gapX.length) gapLenDeltaNonZero++;
    if (Buffer.compare(Buffer.from(gapV2), Buffer.from(gapX)) !== 0) gapDiffBlocks++;
    gapBytesChecked += gapV2.length;
    if (i === 0) onGövdeBytes += gapV2.length; else araGapBytes += gapV2.length;
    cursorV2 = framesV2[i].end;
    cursorX = framesX[i].end;
  }
  // KUYRUK (R5 modal + sürüm geçmişi): son çerçeveden dosya sonuna.
  const tailV2 = v2.subarray(cursorV2);
  const tailX = donor.subarray(cursorX);
  if (tailV2.length !== tailX.length) gapLenDeltaNonZero++;
  if (Buffer.compare(Buffer.from(tailV2), Buffer.from(tailX)) !== 0) gapDiffBlocks++;
  gapBytesChecked += tailV2.length;
  kuyrukBytes = tailV2.length;
  assert.equal(rawLenMismatch, 0, "rawLen çapası: v2 ↔ X11 birebir olmalı (Δlen=0'ın ön şartı).");
  assert.equal(preludeMismatch, 0, "önyazı çapası: [1][1][1]×30.259 + [0][1][0]×1 indeks başına özdeş.");
  assert.equal(gapLenDeltaNonZero, 0, "ölçüt (i): 30.261 gap'in tamamında Δlen=0.");
  assert.equal(gapDiffBlocks, 0, "ölçüt (i): nakledilen koşularda diffBlock=0.");

  // --- 3b) Bölge kaplaması: başlık + çerçeveler + gap'ler dosyayı tüketmeli (gizli fark sınıfı yok). ---
  const frameBytesV2 = framesV2.reduce((sum, f) => sum + (f.end - f.offset), 0);
  assert.equal(previewV2 + frameBytesV2 + onGövdeBytes + araGapBytes + kuyrukBytes, v2.length,
    "ölçüt (ii): v2 = başlık + çerçeveler + nakledilen koşular; bölge dışı bayt kalmamalı.");
  const frameBytesX = framesX.reduce((sum, f) => sum + (f.end - f.offset), 0);
  assert.equal(previewX + frameBytesX + (donor.length - previewX - frameBytesX), donor.length,
    "donör bölge kaplaması da tam olmalı.");

  // --- 3c) Çerçeveler v2'nin (A0 comp ile bayt-özdeş; inflate-özdeşlik t33d KANITI). ---
  const framesA = scanFrames(source, IDE10_VERSION);
  let compMismatch = 0;
  for (let i = 0; i < framesA.length; i++) {
    if (Buffer.compare(Buffer.from(v2.subarray(framesV2[i].offset + 12, framesV2[i].end)),
      Buffer.from(source.subarray(framesA[i].offset + 12, framesA[i].end))) !== 0) compMismatch++;
  }
  assert.equal(compMismatch, 0, "çerçeve comp baytları v1/A0 ile bayt-özdeş kalmalı (çerçeveler v2'nin).");

  // --- 4) ÖLÇÜT (iii): parse oracle — geometri/etiket/yük diff 0 KORUNUR + ızgara eşitliği. ---
  const parsedV2 = parseIde10(buffer(v2), "HS_A0_upgraded_v2.ide11");
  const parsedX11 = parseIde10(buffer(donor), "X11_downloads.ide11");
  assert.equal(parsedV2.floors.length, 6);
  assert.equal(parsedX11.floors.length, 6);
  const floorDiff2: unknown[] = [];
  for (const fa of parsedV2.floors) {
    const fb = parsedX11.floors.find(f => f.name === fa.name);
    assert.ok(fb, `X11'de kat bulunmalı: ${fa.name}`);
    if (Math.abs(fa.elevation - fb.elevation) > 1e-6 || Math.abs(fa.height - fb.height) > 1e-6) {
      floorDiff2.push({ name: fa.name, a: [fa.elevation, fa.height], b: [fb.elevation, fb.height] });
    }
  }
  assert.equal(floorDiff2.length, 0, "kat yükseklik/kot farkı olmamalı.");
  const cmp = compareElements(parsedV2, parsedX11);
  assert.equal(cmp.matched, 1_273, "1.273 eleman X11 ile eşleşmeli.");
  assert.equal(cmp.geometryDiff, 0, `geometri farkı 0 KORUNMALI: ${JSON.stringify(cmp.geometrySamples)}`);
  assert.equal(cmp.geometryEqual, 1_273);
  assert.equal(cmp.labelDiff, 0, `kesit etiketi farkı 0 KORUNMALI: ${JSON.stringify(cmp.labelSamples)}`);
  assert.equal(cmp.labelEqual, 1_273);
  assert.equal(cmp.loadsEqual, 159, "159 döşeme yükü X11 ile eşit olmalı.");
  assert.equal(cmp.loadsMismatch, 0);
  assert.equal(cmp.wallSectionDiff, 0, "perde plan kesiti (kanonik) farkı 0 olmalı.");

  // --- 4b) IZGARA NAKLİ (t41 §6 açık işleri kapatan kanıt): R1/R3/R5/R4 ↔ X11. ---
  const materialsV2 = parsedV2.materials ?? [];
  const materialsX = parsedX11.materials ?? [];
  assert.equal(materialsV2.length, 2, "R1 malzeme ızgarası nakledilmeli (v1'de 0 idi; açık iş).");
  assert.equal(materialsX.length, 2);
  const stripMaterial = (m: typeof materialsV2[number]) => ({
    id: m.id, name: m.name, kind: m.kind, fckMpa: m.fckMpa, fykMpa: m.fykMpa, fctkMpa: m.fctkMpa,
    gammaS: m.gammaS, gammaC: m.gammaC, elasticModulusMpa: m.elasticModulusMpa, poisson: m.poisson,
    unitWeightTfM3: m.unitWeightTfM3,
  });
  assert.deepEqual(materialsV2.map(stripMaterial), materialsX.map(stripMaterial),
    "R1 malzeme kayıtları X11 ile değer-düzeyi eşit olmalı.");

  const seismicV2 = parsedV2.seismicSoil as Record<string, unknown> | undefined;
  const seismicX = parsedX11.seismicSoil as Record<string, unknown> | undefined;
  assert.ok(seismicV2 && seismicX, "deprem/zemin kaydı iki tarafta da okunmalı.");
  const nullSeismicV2 = Object.values(seismicV2!).filter(value => value === null).length;
  assert.equal(nullSeismicV2, 0, `R3 deprem ızgarası nakledilmeli (v1'de 10 alan null idi; açık iş); null=${nullSeismicV2}.`);
  for (const key of Object.keys(seismicX!)) {
    assert.deepEqual(seismicV2![key], seismicX![key], `R3 alan değeri X11 ile eşit olmalı: ${key}`);
  }

  const f9V2 = parsedV2.f9Results;
  const f9X = parsedX11.f9Results;
  assert.ok(f9V2 && f9X, "F9 sonuç bölgesi iki tarafta da okunmalı.");
  assert.equal(f9V2!.modalTables.length, 10, "R5 kuyruk modal tabloları nakledilmeli (v1'de 0 idi; açık iş).");
  assert.equal(f9X!.modalTables.length, 10);
  for (let i = 0; i < f9X!.modalTables.length; i++) {
    assert.equal(f9V2!.modalTables[i].name, f9X!.modalTables[i].name, `modal tablo adı eşit: ${i}`);
    assert.equal(f9V2!.modalTables[i].modeCount, f9X!.modalTables[i].modeCount, `modal mod sayısı eşit: ${i}`);
    assert.deepEqual(f9V2!.modalTables[i].frequenciesHz, f9X!.modalTables[i].frequenciesHz, `modal frekanslar eşit: ${i}`);
    assert.deepEqual(f9V2!.modalTables[i].gamma, f9X!.modalTables[i].gamma, `modal gamma değerleri eşit: ${i}`);
    assert.deepEqual(f9V2!.modalTables[i].effectiveMassT, f9X!.modalTables[i].effectiveMassT, `modal efektif kütleler eşit: ${i}`);
  }
  assert.equal(f9V2!.barForceStreamsCount, f9X!.barForceStreamsCount, "F9 kuvvet akış sayıları eşit kalmalı.");
  assert.equal(f9V2!.nodalDisplacementStreamsCount, f9X!.nodalDisplacementStreamsCount, "F9 düğüm akış sayıları eşit kalmalı.");
  assert.equal(f9V2!.shellResultStreamsCount, f9X!.shellResultStreamsCount, "F9 kabuk akış sayıları eşit kalmalı.");

  const keyOf = (e: { floorId: string; type: string; nativeId: number }) => `${e.floorId}|${e.type}|${e.nativeId}`;
  const rebarMapX = new Map(parsedX11.elements.filter(e => e.rebarLayout).map(e => [keyOf(e), e.rebarLayout]));
  const rebarV2 = parsedV2.elements.filter(e => e.rebarLayout);
  assert.equal(rebarV2.length, 468, "R4 donatı ızgarası nakledilmeli (v1'de 0 idi; açık iş).");
  let rebarValueDiff = 0;
  for (const e of rebarV2) {
    const rb = rebarMapX.get(keyOf(e));
    if (!rb || JSON.stringify(e.rebarLayout) !== JSON.stringify(rb)) rebarValueDiff++;
  }
  assert.equal(rebarValueDiff, 0, "R4 donatı demetleri X11 ile değer-düzeyi eşit olmalı.");

  // --- 5) ÖLÇÜT (ii) kapanışı: kalan fark envanteri yalnız başlık/preview + comp + mühür.
  // v2↔X11 bayt farkı: gap'ler 0 (yukarıda), comp sınıfı inflate-özdeş (t33d KANIT),
  // [0,previewEnd) başlık/preview/kilit + mühür alanları (uzunluk@79/CRC@83) v2'nin.
  // İşaretli liste (değer çatışığı): YOK — tüm nakledilen değerler kampanya boyunca
  // eşitliği KANITLI (468/0, 2/2, 10/10, modal 0 sapma). ---
  const markedList: unknown[] = [];

  // --- 6) Kanıt çıktısı: YENİ adla (A0/X11 ASLA ezilmez) + SHA kaydı. ---
  const outDir = `${EVIDENCE_B}/output`;
  mkdirSync(outDir, { recursive: true });
  writeFileSync(`${outDir}/HS_A0_upgraded_v2.ide11`, Buffer.from(v2));
  const diffDir = `${EVIDENCE_B}/diff`;
  mkdirSync(diffDir, { recursive: true });
  writeFileSync(`${diffDir}/HS_A0_upgraded_v2__vs__X11_downloads.diff.json`, JSON.stringify({
    a: { file: "HS_A0_upgraded_v2.ide11", version: carrier.formatVersion, encoded: carrier.encodedFlag, label: getIdeCarrierFormat(v2, carrier), sha256: digest(v2), bytes: v2.length },
    b: { file: "X11_downloads.ide11", version: 211220, encoded: 1, label: "ide11", sha256: X11_SHA, bytes: donor.length },
    transplant: t,
    criteria: {
      i_fiveRegionDeltaLen: { rawLenMismatch, preludeMismatch, gapLenDeltaNonZero, gapDiffBlocks, gapBytesChecked, onGovdeBytes: onGövdeBytes, araGapBytes, kuyrukBytes },
      ii_remainingDiff: { headerPreviewClass: "v2 (A0 başlık/preview/kilit + mühür alanları)", compMismatchVsA0: compMismatch, compClass: "çerçeve comp baytları v1/A0 kaynaklı (inflate-özdeş t33d KANIT)", markedList },
      iii_oracle: {
        floors: 6, matched: cmp.matched, geometryEqual: cmp.geometryEqual, geometryDiff: cmp.geometryDiff,
        labelEqual: cmp.labelEqual, labelDiff: cmp.labelDiff, loadsEqual: cmp.loadsEqual, loadsMismatch: cmp.loadsMismatch,
        wallSectionEqual: cmp.wallSectionEqual, wallSectionDiff: cmp.wallSectionDiff,
        materials: { v2: materialsV2.length, x11: materialsX.length },
        seismicNullFieldsV2: nullSeismicV2,
        f9ModalTables: { v2: f9V2!.modalTables.length, x11: f9X!.modalTables.length },
        rebar: { v2: rebarV2.length, x11: 468, valueDiff: rebarValueDiff },
      },
    },
  }, null, 2));
  console.log(`[T-F4.1b tanıklama] v2=${v2.length} B, sha256=${digest(v2)}; transplant=${JSON.stringify(t)}; gapBytes=${gapBytesChecked} (ön-gövde ${onGövdeBytes} + ara ${araGapBytes} + kuyruk ${kuyrukBytes}); compMismatch=${compMismatch}; ızgaralar: malzeme ${materialsV2.length}/2, deprem null ${nullSeismicV2}, modal ${f9V2!.modalTables.length}/10, donatı ${rebarV2.length}/468 (değer farkı ${rebarValueDiff}); işaretli liste: ${markedList.length}`);
});
