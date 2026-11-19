/**
 * K2/KARAR-001 ONARIM TURU — proje-özel ORACLE profil üreticisi.
 *
 * Hüküm (DECISIONS-K2.md → KARAR-001 (B)): MS1'e donuk ORACLE sabitleri 11-KABUL
 * §6'nın kendi genişleme kuralını ("sabit sayılar proje özine göre yeniden
 * okunur") uygulamıyordu. Bu araç, K2'nin üç projesi (C1/C2/C3) için profili
 * EŞLİ TİCARİ DONÖR .ide10'dan ÜRETİR — YFS-1: her değer donörden ÖLÇÜLÜR,
 * elle sayı uydurma YASAK.
 *
 * Ölçüm zinciri (kapının kendi araçları; birebir komutlar kanıt klasörüne yazılır):
 *   1. ide-fidelity-audit fingerprint <donör .ide10>  → sayımlar + ilk kiriş hedefi
 *   2. probe-attribute-streams <donör .ide10>          → alt-akış census'i (B1–B3)
 *
 * Türetim haritası (donör parmak izi/census → profil anahtarı):
 *   attributeStreams/streamCompressedBytes/streamRawBytes ← census
 *   rebarBlocks      ← rebar taşıyan eleman sayısı
 *   materials        ← materials dizisi uzunluğu
 *   f9ModalTables    ← f9Results.modalTables uzunluğu
 *   elementsCore     ← elements − byType.stair (11-KABUL §2 çekirdek sayım deseni)
 *   elementsStairs   ← byType.stair
 *   elements         ← elements.length
 *   floors, desktopFloors ← floors.length
 *   labels           ← elements.length (donör-kaynaklı kesit etiketi birebirliği)
 *   slabLoads        ← slabLoads taşıyan eleman sayısı
 *   desktopProjectTitle ← fingerprint carrier.projectName (yoksa girdi dosya adı;
 *                          kaynak derivedFrom alanında belgelenir)
 *   patchBeamName/patchFromHeight ← fingerprint'te ilk type=beam elemanının
 *                          adı ve GERÇEK kesit yüksekliği
 *   patchToHeight    ← senaryo değeri: patchFromHeight + 0.05 (T-F6.1 deseni)
 *
 * Kullanım:
 *   npx tsx scripts/hsyncad/ide-oracle-profile.ts \
 *     --project-id C1-SK \
 *     --donor "D:\...\218 ada 50 parsel STATİK.ide10" \
 *     [--input "C:\...\idee\218 ada 50 parsel STATİK.ide11trial"] \
 *     (--x11 "C:\...\X11_downloads.ide11" | --x11-null) \
 *     [--campaign-dir <kök>] [--out <profil.json>] [--evidence-dir <klasör>]
 *
 * Kanıt sözleşmesi: ham parmak izi + census + birebir komutlar evidence-dir'e
 * yazılır (türetim komutları kanıt klasörüne — KARAR-001). Kaynak donöre ve
 * girdiye tek bayt YAZILMAZ.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildOracleContextFromRaw } from "./ide-acceptance-gate";

const DEFAULT_CAMPAIGN_DIR = "C:\\Users\\hsyn\\Desktop\\hsyncad_idecad_uzanti_optimizasyon";

interface ToolOptions {
  projectId: string;
  donorPath: string;
  inputPath?: string;
  x11: string | null;
  campaignDir: string;
  outPath: string;
  evidenceDir: string;
}

function parseCliArgs(argv: string[]): ToolOptions {
  const options: ToolOptions = {
    projectId: "",
    donorPath: "",
    x11: undefined as unknown as string | null,
    campaignDir: DEFAULT_CAMPAIGN_DIR,
    outPath: "",
    evidenceDir: "",
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const needValue = (flag: string): string => {
      const value = argv[i + 1];
      if (value === undefined || value.trim() === "" || value.startsWith("--")) {
        throw new Error(`${flag} için değer gerekli.`);
      }
      i += 1;
      return value;
    };
    if (arg === "--project-id") { options.projectId = needValue(arg); continue; }
    if (arg === "--donor") { options.donorPath = path.resolve(needValue(arg)); continue; }
    if (arg === "--input") { options.inputPath = path.resolve(needValue(arg)); continue; }
    if (arg === "--x11-null") { options.x11 = null; continue; }
    if (arg === "--x11") { options.x11 = path.resolve(needValue(arg)); continue; }
    if (arg === "--campaign-dir") { options.campaignDir = path.resolve(needValue(arg)); continue; }
    if (arg === "--out") { options.outPath = path.resolve(needValue(arg)); continue; }
    if (arg === "--evidence-dir") { options.evidenceDir = path.resolve(needValue(arg)); continue; }
    throw new Error(`Bilinmeyen bayrak: ${arg}`);
  }
  if (!options.projectId.trim()) throw new Error("--project-id zorunlu (örn. C1-SK).");
  if (!options.donorPath) throw new Error("--donor zorunlu (eşli ticari donör .ide10).");
  if (options.x11 === undefined as unknown) throw new Error("--x11 <yol> ya da --x11-null verilmeli (X11 varlığı dürüstçe beyan edilir).");
  if (!options.outPath) {
    options.outPath = path.join(
      options.campaignDir, "idee", "kanit", "p1", "oracle-profilleri",
      `${options.projectId}-oracle.json`,
    );
  }
  if (!options.evidenceDir) {
    options.evidenceDir = path.join(
      options.campaignDir, "idee", "kanit", "p1", "oracle-profilleri",
      `${options.projectId}-olcum`,
    );
  }
  return options;
}

function sha256(filePath: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

interface RunOutcome { ok: boolean; status: number | null; stdout: string; stderr: string; }

function main(): void {
  const options = parseCliArgs(process.argv.slice(2));
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  const toolsDir = path.join(options.campaignDir, "tools");
  const fingerprintTool = path.join(toolsDir, "ide-fidelity-audit.ts");
  const probeTool = path.join(toolsDir, "probe-attribute-streams.ts");

  if (!fs.existsSync(options.donorPath)) {
    throw new Error(`donör yolu yok: ${options.donorPath}`);
  }
  for (const [label, p] of [["tools", toolsDir], ["fingerprint aracı", fingerprintTool], ["probe aracı", probeTool]] as const) {
    if (!fs.existsSync(p)) throw new Error(`${label} yolu yok: ${p}`);
  }
  if (options.inputPath && !fs.existsSync(options.inputPath)) {
    throw new Error(`--input yolu yok: ${options.inputPath}`);
  }
  fs.mkdirSync(options.evidenceDir, { recursive: true });
  fs.mkdirSync(path.dirname(options.outPath), { recursive: true });
  const commandsLog = path.join(options.evidenceDir, "komutlar.log");

  const runLogged = (args: string[]): RunOutcome => {
    const line = `node ${args.map(a => `"${a}"`).join(" ")}\n`;
    fs.appendFileSync(commandsLog, `\n=== ${new Date().toISOString()} ===\n${line}`);
    const res = spawnSync(process.execPath, args, {
      timeout: 900_000, encoding: "utf8", maxBuffer: 512 * 1024 * 1024, cwd: repoRoot,
    });
    const stdout = res.stdout ?? "";
    const stderr = res.stderr ?? "";
    fs.appendFileSync(commandsLog, stdout + (stderr ? `\n[stderr]\n${stderr}` : "") + `\n[exit=${res.status ?? "null"}]\n`);
    return { ok: res.status === 0, status: res.status, stdout, stderr };
  };

  // ── 1) donör parmak izi (ide-fidelity-audit) ───────────────────────────────
  console.log(`[OLC] ide-fidelity-audit fingerprint → ${options.donorPath}`);
  const fpArgs = ["--import", "tsx", fingerprintTool, "fingerprint", options.evidenceDir, options.donorPath];
  const fpRun = runLogged(fpArgs);
  const donorLabel = path.basename(options.donorPath).replace(/\.[^.]+$/, "") + "__" + path.extname(options.donorPath).replace(/^\./, "");
  const fingerprintPath = path.join(options.evidenceDir, `${donorLabel}.fingerprint.json`);
  if (!fpRun.ok || !fs.existsSync(fingerprintPath)) {
    throw new Error(`donör parmak izi alınamadı (exit ${fpRun.status}) — bkz. ${commandsLog}`);
  }
  const fp = JSON.parse(fs.readFileSync(fingerprintPath, "utf8")) as {
    carrier: { projectName?: unknown };
    floors: unknown[];
    materials: { length: number } | null;
    f9Results: { modalTables: unknown[] } | null;
    counts: { byType: Record<string, number> };
    elements: Array<{ type: string; name?: unknown; height?: unknown; rebar?: unknown; slabLoads?: unknown }>;
  };

  // ── 2) donör census'i (probe-attribute-streams) ───────────────────────────
  console.log(`[OLC] probe-attribute-streams census → ${options.donorPath}`);
  const probeArgs = ["--import", "tsx", probeTool, options.evidenceDir, options.donorPath];
  const probeRun = runLogged(probeArgs);
  const censusPath = path.join(options.evidenceDir, "attribute-stream-census.json");
  if (!probeRun.ok || !fs.existsSync(censusPath)) {
    throw new Error(`donör census'i alınamadı (exit ${probeRun.status}) — bkz. ${commandsLog}`);
  }
  const censusRows = JSON.parse(fs.readFileSync(censusPath, "utf8")) as Array<{
    file: string; attributeStreams: number; compressedBytes: number; rawBytes: number;
  }>;
  const census = censusRows.find(r => r.file === path.basename(options.donorPath));
  if (!census) throw new Error("census satırı donörle eşleşmedi (probe çıktısı bozuk).");

  // ── 3) ölçümlerden profil değerleri (YFS-1: hepsi donörden) ────────────────
  const elements: number = fp.elements.length;
  const stairs: number = fp.counts.byType.stair ?? 0;
  const elementsCore = elements - stairs;
  const floors: number = fp.floors.length;
  const materials = fp.materials === null ? null : fp.materials.length;
  if (materials === null) throw new Error("donör parmak izinde materials okunamadı — profil dürüstçe üretilemez.");
  const f9ModalTables = fp.f9Results === null ? 0 : fp.f9Results.modalTables.length;
  const rebarBlocks = fp.elements.filter(e => e.rebar != null).length;
  const slabLoads = fp.elements.filter(e => e.slabLoads != null).length;

  // desktopProjectTitle: donör fingerprint'te proje adı varsa oradan, yoksa
  // girdi dosya adından (kaynak derivedFrom içinde belgelenir).
  const carrierProjectName = typeof fp.carrier.projectName === "string" ? fp.carrier.projectName.trim() : "";
  let desktopProjectTitle: string;
  let titleSource: string;
  if (carrierProjectName !== "") {
    desktopProjectTitle = carrierProjectName;
    titleSource = "donorFingerprint.carrier.projectName";
  } else if (options.inputPath) {
    desktopProjectTitle = path.basename(options.inputPath).replace(/\.[^.]+$/, "");
    titleSource = `girdi dosya adı (fingerprint'te proje adı yok): ${path.basename(options.inputPath)}`;
  } else {
    throw new Error("donör fingerprint'te proje adı yok ve --input verilmedi — desktopProjectTitle dürüstçe türetilemez.");
  }

  // F6 yama hedefi: fingerprint'ten İLK kirişin adı ve GERÇEK kesit yüksekliği.
  const firstBeam = fp.elements.find(e => e.type === "beam");
  if (!firstBeam || typeof firstBeam.name !== "string" || !firstBeam.name.trim()) {
    throw new Error("donörde type=beam elemanı (yama hedefi kirişi) bulunamadı.");
  }
  if (typeof firstBeam.height !== "number" || !Number.isFinite(firstBeam.height) || firstBeam.height <= 0) {
    throw new Error(`ilk kirişin (${firstBeam.name}) kesit yüksekliği okunamadı — yama hedefi dürüstçe türetilemez.`);
  }
  const patchBeamName = firstBeam.name;
  const patchFromHeight = firstBeam.height;
  const patchToHeight = Math.round((patchFromHeight + 0.05) * 100) / 100;

  // ── 4) profil nesnesi + kapının kendi doğrulayıcısıyla öz-denetim ─────────
  const donorBytes = fs.statSync(options.donorPath).size;
  const donorSha = sha256(options.donorPath);
  const measuredAt = new Date().toISOString();
  const profile = {
    profileVersion: 1,
    projectId: options.projectId,
    x11: options.x11,
    derivedFrom: {
      donorIde10: options.donorPath,
      donorBytes,
      donorSha256: donorSha,
      donorLastWrite: fs.statSync(options.donorPath).mtime.toISOString(),
      fingerprintTool: "ide-fidelity-audit.ts fingerprint (kampanya tools)",
      censusTool: "probe-attribute-streams.ts (kampanya tools)",
      evidenceDir: options.evidenceDir,
      measurementCommands: [
        `node ${fpArgs.map(a => `"${a}"`).join(" ")}`,
        `node ${probeArgs.map(a => `"${a}"`).join(" ")}`,
      ],
      attributeStreams: "donör census (probe-attribute-streams)",
      streamCompressedBytes: "donör census (probe-attribute-streams)",
      streamRawBytes: "donör census (probe-attribute-streams)",
      rebarBlocks: "donör fingerprint: rebar taşıyan eleman sayısı",
      materials: "donör fingerprint: materials dizisi uzunluğu",
      f9ModalTables: "donör fingerprint: f9Results.modalTables uzunluğu",
      elementsCore: "donör fingerprint: elements − byType.stair (11-KABUL §2 çekirdek deseni)",
      elementsStairs: "donör fingerprint: byType.stair",
      elements: "donör fingerprint: elements.length",
      floors: "donör fingerprint: floors.length",
      labels: "donör fingerprint: elements.length (donör-kaynaklı kesit etiketi birebirliği)",
      slabLoads: "donör fingerprint: slabLoads taşıyan eleman sayısı",
      desktopFloors: "donör fingerprint: floors.length",
      desktopProjectTitle: titleSource,
      patchBeamName: "donör fingerprint: ilk type=beam elemanının adı",
      patchFromHeight: "donör fingerprint: ilk kirişin gerçek kesit yüksekliği",
      patchToHeight: "senaryo değeri: patchFromHeight + 0.05 (T-F6.1 deseni)",
      x11: options.x11 === null
        ? "yok — SAPMA-A: ticari .ide11 eşi diskte yok (KARAR-001: B14–B16 ölçülemez sınıfı)"
        : `var: ${options.x11}`,
      inputFile: options.inputPath ?? "(--input verilmedi)",
      measuredAt,
    },
    oracle: {
      attributeStreams: census.attributeStreams,
      streamCompressedBytes: census.compressedBytes,
      streamRawBytes: census.rawBytes,
      rebarBlocks,
      materials,
      f9ModalTables,
      elementsCore,
      elementsStairs: stairs,
      elements,
      floors,
      labels: elements,
      slabLoads,
      desktopProjectTitle,
      desktopFloors: floors,
      patchBeamName,
      patchFromHeight,
      patchToHeight,
    },
  };

  // Öz-denetim: kapı bu profili --oracle-json ile aynen okuyacak; burada
  // tutarsızsa (bilinmeyen/eksik anahtar, tip hatası) şimdiden sert hata.
  buildOracleContextFromRaw(profile, options.outPath);

  fs.writeFileSync(options.outPath, JSON.stringify(profile, null, 2) + "\n", "utf8");
  console.log(`\n[PROFİL] ${options.projectId} → ${options.outPath}`);
  console.log(`  donör: ${path.basename(options.donorPath)} (${donorBytes.toLocaleString("tr-TR")} B, SHA ${donorSha.slice(0, 16)}…)`);
  console.log(`  x11: ${options.x11 === null ? "null (X11-YOK; SAPMA-A)" : options.x11}`);
  console.log(`  attributeStreams=${census.attributeStreams}, sıkışmış=${(census.compressedBytes / 1e6).toFixed(1)} MB, açılmış=${(census.rawBytes / 1e6).toFixed(1)} MB`);
  console.log(`  rebar=${rebarBlocks}, malzeme=${materials}, F9 tablo=${f9ModalTables}`);
  console.log(`  eleman=${elements} (çekirdek ${elementsCore} + merdiven ${stairs}), kat=${floors}, etiket=${elements}, döşeme yükü=${slabLoads}`);
  console.log(`  başlık="${desktopProjectTitle}" (${titleSource})`);
  console.log(`  yama hedefi: ilk ${patchBeamName} kesit ${patchFromHeight} → ${patchToHeight}`);
  console.log(`  ham ölçüm + komutlar: ${options.evidenceDir}`);
}

const invokedDirectly = (() => {
  try {
    return Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
})();

if (invokedDirectly) {
  try {
    main();
  } catch (err) {
    console.error("FATAL:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
