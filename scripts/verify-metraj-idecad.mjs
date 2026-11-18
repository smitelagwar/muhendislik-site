#!/usr/bin/env node
/** Kaynağa bağlı kısmi metraj denetimi. Eksik native/donatı verisiyle eşdeğerlik PASS vermez. */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

if (!process.execArgv.some(a => a.includes("tsx"))) {
  const result = spawnSync(process.execPath, ["--import", "tsx", fileURLToPath(import.meta.url), ...process.argv.slice(2)],
    { stdio: "inherit", shell: false, windowsHide: true, timeout: 180_000 });
  process.exit(result.error ? 1 : result.status ?? 1);
}
const args = process.argv.slice(2);
const value = key => { const i = args.indexOf(key); return i >= 0 ? args[i + 1] : undefined; };
const input = value("--input"), output = value("--output"), expectedPath = value("--expected");
if (!input) { process.stderr.write("Kullanım: node scripts/verify-metraj-idecad.mjs --input <proje.hsyncad|native.ide10> [--expected <oracle.json>] [--output <sonuc.json>]\n"); process.exit(2); }
const { validateModel } = await import("../src/lib/hsyncad/model.ts");
const { parseIde10 } = await import("../src/lib/hsyncad/ide-import/index.ts");
const { importIdeWorkspace } = await import("../src/lib/hsyncad/ide-workspace.ts");
const { calculateFullTakeoff } = await import("../src/lib/hsyncad/quantities.ts");
const sha = b => createHash("sha256").update(b).digest("hex");
try {
  const bytes = fs.readFileSync(input), hash = sha(bytes);
  const isNative = /\.(ide10|ide11|ide11trial|cde)$/i.test(input);
  const native = isNative ? parseIde10(Uint8Array.from(bytes).buffer, path.basename(input)) : null;
  const model = native ? importIdeWorkspace(native) : validateModel(JSON.parse(bytes.toString("utf8")));
  const takeoff = calculateFullTakeoff(model);
  const expected = expectedPath ? JSON.parse(fs.readFileSync(expectedPath, "utf8")) : null;
  const observed = { concreteM3: takeoff.concreteVolumeM3.total, formworkGrossM2: takeoff.formworkAreaM2.total, declaredRebarKg: takeoff.rebarTonnage.totalKg };
  const result = { source: { path: path.resolve(input), sha256: hash }, status: "incomplete", comparisonAcceptance: false,
    observed, oracle: expected, missingReinforcementIds: takeoff.rebarTonnage.missingElementIds,
    reason: "Gerçek donatı kesim listesi ve aynı fiziksel model/ölçüm profili kabulü eksik; genel eşdeğerlik onaylanmadı.",
    nativeCoverage: native?.coverage ?? null, warnings: takeoff.warnings,
    inputHashAfter: sha(fs.readFileSync(input)) };
  if (hash !== result.inputHashAfter) throw new Error("Özgün kaynak işlem sırasında değişti.");
  if (output) fs.writeFileSync(output, JSON.stringify(result, null, 2) + "\n", { flag: "wx" });
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  // Beklenen dosyayı okumak veya kaynakta sayının bulunması hesap kabulü değildir.
  process.exitCode = 2;
} catch (error) { process.stderr.write(String(error) + "\n"); process.exitCode = 1; }
