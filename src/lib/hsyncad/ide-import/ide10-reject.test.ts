import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateIdeCarrier, verifyIdeHeaderChecksum } from "./ide-binary-codec";
import { parseIde10 } from "./index";
import {
  assertIde10GrammarForProduction,
  transcodeIde11TrialToIde10,
  type Ide10TranscodeDiagnostics,
} from "./ide11-transcoder";
import { transcodeIde11TrialToIde10 as transcodeIde10ViaExport } from "../ide-export";
import ide10GrammarSchema from "./ide10-grammar.json";

// Geçmiş: T-F1.1'in ".ide10 üretimi sert hatayla reddedilir" sözleşmesi T-F3.3 ile kalktı; bu dosya artık gerçek v11→v10 dönüşüm sözleşmesini korur (T-F3.3b).
/**
 * T-F3.3b — ide10-reject'in bayat reddetme sözleşmesi yerine GERÇEK dönüşüm
 * sözleşmesinin kabul testi. Transcoder artık `.ide10` ÜRETİYOR
 * (201094/encoded=0, CRC32 mühürlü); donörsüz koşu UYARIYLA çalışır ve
 * dönüşüm yine tam olur; şema üretim yolunda VARSAYIM HARD-FAIL eder.
 *
 * Girdi: korpus M-base.ide11trial (464.850 B, 211280/encoded=1) — repo içinde
 * gerçek fixture yok; kanıt klasöründen YOL OLARAK okunur (salt okunur).
 */
const M_BASE = "C:/Users/hsyn/Desktop/hsyncad_idecad_uzanti_optimizasyon/evidence/orkestrasyon/2026-11-18-F2-T2.3/rea/M-base.ide11trial";

const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);
const cliScript = path.join(repoRoot, "scripts", "hsyncad", "convert_trial_to_native.ts");

interface CliRunResult {
  status: number;
  stdout: string;
  stderr: string;
}

/** CLI'yi alt süreçte çalıştırır; hatalı çıkışta fırlatmak yerine sonucu döndürür. */
function runCli(args: string[], cwd: string): CliRunResult {
  try {
    const stdout = execFileSync(process.execPath, ["--import", "tsx", cliScript, ...args], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
      timeout: 120_000,
    });
    return { status: 0, stdout, stderr: "" };
  } catch (err) {
    const failure = err as { status?: number; stdout?: string; stderr?: string };
    return {
      status: failure.status ?? 1,
      stdout: failure.stdout ?? "",
      stderr: failure.stderr ?? "",
    };
  }
}

/** v10 taşıyıcı sözleşmesi: 201094 mührü, düz gövde, geçerli CRC32. */
function assertIde10CarrierContract(bytes: Uint8Array): void {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  assert.equal(view.getUint32(74, true), 201094);
  assert.equal(bytes[78], 0);
  assert.equal(view.getUint32(79, true), bytes.byteLength);
  const sealed = validateIdeCarrier(bytes); // CRC32 uyuşmazsa fırlatır
  assert.equal(sealed.formatVersion, 201094);
  assert.equal(sealed.encodedFlag, 0);
  assert.equal(verifyIdeHeaderChecksum(bytes).valid, true, "çıktı CRC32'si geçerli olmalı.");
}

test("transcodeIde11TrialToIde10 gerçek trial girdiyle başarılı v10 dönüşümü döndürür (201094/encoded=0, CRC geçerli)", { skip: !existsSync(M_BASE), timeout: 600_000 }, () => {
  const source = readFileSync(M_BASE);
  const sourceDigest = digest(source);
  const diagnostics = {} as Ide10TranscodeDiagnostics;
  const converted = transcodeIde11TrialToIde10(source, { diagnostics });

  // --- Taşıyıcı sözleşmesi: v10 mührü (201094, encoded=0, geçerli CRC). ---
  assertIde10CarrierContract(converted);

  // --- Dönüşüm tanıklama: ölçülen gerçek değerler (M-base duman koşusu). ---
  assert.equal(diagnostics.frames.rewritten, 137, "137 kaynak-sürüm çerçevesi 201094'e yazılmalı.");
  assert.equal(diagnostics.frames.native201094, 0);
  assert.equal(diagnostics.frames.preludeFlagsCleared, 137);
  assert.equal(diagnostics.outputBytes, 464_685, "çıktı boyutu ölçülen 464.685 B olmalı.");
  assert.equal(diagnostics.donor, undefined, "donör verilmedi; kanıtsız bölgeler v11 düzeninde kalır.");

  // --- Dönüşüm tamam: parse 1 kat / 11 eleman (kaynak dağılımı korunur). ---
  const parsed = parseIde10(Uint8Array.from(converted).buffer, "M-base-donusum.ide10");
  assert.equal(parsed.format, "ide10");
  assert.equal(parsed.floors.length, 1);
  assert.equal(parsed.elements.length, 11);
  assert.deepEqual(parsed.coverage.byType, { beam: 4, column: 4, wall: 1, slab: 2 });

  // --- Kaynak değişmezliği: diskteki ve bellekteki tampon dokunulmamış. ---
  assert.equal(digest(source), sourceDigest);
  assert.equal(digest(readFileSync(M_BASE)), sourceDigest);
});

test("ide-export yeniden ihracat yolu aynı gerçek v10 dönüşümünü üretir", { skip: !existsSync(M_BASE), timeout: 600_000 }, () => {
  const source = readFileSync(M_BASE);
  const converted = transcodeIde10ViaExport(source);
  assertIde10CarrierContract(converted);
});

test("şema HARD-FAIL: üretime VARSAYIM enjekte edilirse reddedilir; saf şema temiz", () => {
  const report = assertIde10GrammarForProduction();
  assert.equal(report.semaSurumu, "1.0.1");
  assert.equal(report.rejectedLines.length, 0, `üretim kuralında VARSAYIM olmamalı: ${report.rejectedLines.join(", ")}`);
  assert.ok(report.requiredRules.length >= 20);
  assert.ok(report.assumptionLines.length > 0, "şema VARSAYIM envanterini taşır (yalnız log; üretimde kullanılmaz)");

  // HARD-FAIL gerçekliği (t33'ten bağımsız satır): gerekli bir KANIT kuralını
  // VARSAYIM'a çevir → üretim sözleşmesi reddi (ELEMAN-GEOMETRI).
  const mutated = JSON.parse(JSON.stringify(ide10GrammarSchema)) as Record<string, unknown>;
  const types = mutated["kayitTipleri"] as Array<Record<string, unknown>>;
  const geometri = types.find(t => t["id"] === "ELEMAN-GEOMETRI")!;
  geometri["kaynak"] = "VARSAYIM";
  assert.throws(
    () => assertIde10GrammarForProduction(mutated as never),
    /tuketiciSozlesme: üretim yolunda VARSAYIM kural kullanılamaz[\s\S]*kayitTipleri:ELEMAN-GEOMETRI/,
  );
});

test("donörsüz koşu uyarıyla çalışır ve dönüşüm yine tam olur (CLI --to ide10)", { skip: !existsSync(M_BASE), timeout: 600_000 }, () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), "hsyncad-t33b-"));
  try {
    const inputPath = path.join(tmpDir, "donorsuz.ide11trial");
    copyFileSync(M_BASE, inputPath);
    const result = runCli(["--to", "ide10", inputPath], repoRoot);
    assert.equal(result.status, 0, `donörsüz koşu başarılı çıkış vermeli (stderr: ${result.stderr})`);
    assert.match(
      result.stdout,
      /Donor: none — unestablished-layout regions keep their v11 layout/,
      "donörsüz koşu uyarı yazmalı.",
    );

    // Dönüşüm yine tam: .ide10 üretilmiş ve v10 taşıyıcı sözleşmesini taşımalı.
    const outputPath = path.join(tmpDir, "donorsuz.ide10");
    assert.ok(existsSync(outputPath), ".ide10 çıktısı yazılmış olmalı.");
    assertIde10CarrierContract(new Uint8Array(readFileSync(outputPath)));
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});
