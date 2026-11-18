import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  IDE11_CURRENT_TRIAL_VERSION,
  IDE_HEADER_SIGNATURE,
  sealIdeCarrierHeader,
} from "./ide-binary-codec";
import { transcodeIde11TrialToIde10 } from "./ide11-transcoder";
import { transcodeIde11TrialToIde10 as transcodeIde10ViaExport } from "../ide-export";

/**
 * T-F1.1 (P1.1) — kullanıcı kararı: SERT HATA.
 * v11→v10 gövde dönüşümü F3'te (T-F3.3) tamamlanana kadar .ide10 üretimi
 * reddedilir; eski yol başlığı yeniden etiketleyip gövdeyi v11 bıraktığı için
 * geçersiz .ide10 üretiyordu.
 */
const IDE10_REJECT_CONTRACT =
  /v11→v10 gövde dönüşümü F3'te tamamlanana kadar desteklenmiyor/;

/**
 * Geçerli (CRC32 mühürlü) 211280/encoded=1 taşıyıcı: validateIdeCarrier'dan
 * geçer ve getIdeCarrierFormat "ide11trial" döner. Gövde içeriği bu test için
 * önemsizdir; üretim talebi reddedilmelidir.
 */
function makeMinimalValidTrialCarrier(): Uint8Array {
  const bytes = new Uint8Array(128);
  for (let i = 0; i < IDE_HEADER_SIGNATURE.length; i++) {
    bytes[i] = IDE_HEADER_SIGNATURE.charCodeAt(i);
  }
  bytes[100] = 0x50; // "P"
  bytes[101] = 0x00; // proje adı NUL sonlandırıcısı
  new DataView(bytes.buffer).setUint32(96, 2, true);
  return sealIdeCarrierHeader(bytes, {
    formatVersion: IDE11_CURRENT_TRIAL_VERSION,
    encodedFlag: 1,
  });
}

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);
const cliScript = path.join(repoRoot, "scripts", "hsyncad", "convert_trial_to_native.ts");

interface CliRunResult {
  status: number;
  stderr: string;
}

/** CLI'yi alt süreçte çalıştırır; hatalı çıkışta fırlatmak yerine sonucu döndürür. */
function runCli(args: string[], cwd: string): CliRunResult {
  try {
    execFileSync(process.execPath, ["--import", "tsx", cliScript, ...args], {
      cwd,
      stdio: ["ignore", "ignore", "pipe"],
      encoding: "utf8",
      timeout: 60_000,
    });
    return { status: 0, stderr: "" };
  } catch (err) {
    const failure = err as { status?: number; stderr?: string };
    return { status: failure.status ?? 1, stderr: failure.stderr ?? "" };
  }
}

test("transcodeIde11TrialToIde10 .ide10 üretimini sert hatayla reddeder", () => {
  const source = makeMinimalValidTrialCarrier();
  assert.throws(() => transcodeIde11TrialToIde10(source), IDE10_REJECT_CONTRACT);
});

test("ide-export yeniden ihracat yolu aynı sözleşmeyle reddeder", () => {
  const source = makeMinimalValidTrialCarrier();
  assert.throws(() => transcodeIde10ViaExport(source), IDE10_REJECT_CONTRACT);
});

test("reddedilen .ide10 üretimi kaynak tamponu değiştirmez", () => {
  const source = makeMinimalValidTrialCarrier();
  const before = createHash("sha256").update(source).digest("hex");
  assert.throws(() => transcodeIde11TrialToIde10(source), IDE10_REJECT_CONTRACT);
  assert.equal(createHash("sha256").update(source).digest("hex"), before);
});

test("CLI --to ide10 aynı tek satır sözleşme hatasıyla reddeder (exit != 0)", () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), "hsyncad-t11-"));
  try {
    const inputPath = path.join(tmpDir, "kirmizi-faz.ide11trial");
    writeFileSync(inputPath, makeMinimalValidTrialCarrier());
    const result = runCli(["--to", "ide10", inputPath], repoRoot);
    assert.notEqual(result.status, 0, "--to ide10 isteği başarısız çıkış vermeli");
    assert.match(result.stderr, IDE10_REJECT_CONTRACT);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("CLI varsayılan 'all' hedefi de .ide10 üretimini reddeder (exit != 0)", () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), "hsyncad-t11-"));
  try {
    const inputPath = path.join(tmpDir, "varsayilan.ide11trial");
    writeFileSync(inputPath, makeMinimalValidTrialCarrier());
    const result = runCli([inputPath], repoRoot);
    assert.notEqual(result.status, 0, "varsayılan hedef başarısız çıkış vermeli");
    assert.match(result.stderr, IDE10_REJECT_CONTRACT);
    // Kırmızı üretim yolu kapalı: .ide10 dosyası yazılmamış olmalı.
    assert.ok(
      !existsSync(path.join(tmpDir, "varsayilan.ide10")),
      ".ide10 dosyası üretilmemiş olmalı",
    );
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});
