import { spawn } from "node:child_process";
import { createWriteStream, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const evidence = dirname(fileURLToPath(import.meta.url));
const root = resolve(evidence, "../..");
const mode = process.argv[2];
const testFiles = ["tests/belgeler/belge-share-stage12.test.ts", "tests/belgeler/belge-filename.test.ts", "tests/belgeler/document-field-contract.test.ts", "tests/belgeler/pdf-generation-regression.test.ts", "tests/belgeler/pdf-output-acceptance.test.ts"];
const lintFiles = ["src/lib/belge-filename.ts", "src/lib/pdf-engine.ts", "src/lib/belge-paylasim/server-pdf.ts", "tests/belgeler/belge-share-stage12.test.ts", "tests/belgeler/fixtures/stage12-cases.ts", "tests/belgeler/fixtures/stage12-rejected-upload.ts", "docs/belgeler-paylasim-v3-uygulama/run-stage12-checks.mjs", "docs/belgeler-paylasim-v3-uygulama/run-stage12-parity.ts", "docs/belgeler-paylasim-v3-uygulama/run-stage12-browser.ts", "docs/belgeler-paylasim-v3-uygulama/run-stage12-manifest.mjs"];
const argumentsByMode = {
  tests: ["--import", "tsx", "--test", "--test-concurrency=1", ...testFiles],
  "runtime-tsc": ["node_modules/typescript/bin/tsc", "-p", "tsconfig.next.json", "--noEmit", "--incremental", "false"],
  lint: ["node_modules/eslint/bin/eslint.js", ...lintFiles],
};
const args = argumentsByMode[mode];
if (!args) throw new Error("Expected tests, runtime-tsc or lint");
const logPath = resolve(evidence, `ASAMA_12_${mode}.${mode === "tests" ? "tap" : "log"}`);
const reportPath = resolve(evidence, `ASAMA_12_${mode}.json`);
const env = { ...process.env, NODE_ENV: "test" };
for (const name of Object.keys(env)) if (/DATABASE|POSTGRES|NEON|BLOB|VERCEL|BELGE_SHARE_SECRET|CRON_SECRET|SHARE_TOKEN|NODE_OPTIONS|NODE_PATH/i.test(name)) delete env[name];
const timeoutMs = 180_000, started = Date.now();
const log = createWriteStream(logPath);
const child = spawn(process.execPath, args, { cwd: root, env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
child.stdout.pipe(log, { end: false }); child.stderr.pipe(log, { end: false });
let timedOut = false;
const timer = setTimeout(() => {
  timedOut = true;
  if (process.platform === "win32" && child.pid) spawn("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true }).unref();
  else child.kill("SIGKILL");
}, timeoutMs);
child.on("error", () => log.write("Process could not start\n"));
child.on("close", (exitCode) => {
  clearTimeout(timer);
  log.end(() => {
    const output = readFileSync(logPath, "utf8");
    const count = (label) => Number(output.match(new RegExp(`^ℹ ${label} (\\d+)$`, "m"))?.[1] ?? 0);
    const report = { command: `node ${args.join(" ")}`, environment: "isolated local; cloud/secret names removed", mode, exitCode: timedOut ? 124 : exitCode ?? 1, timedOut, timeoutMs, durationMs: Date.now() - started, tests: count("tests"), suites: count("suites"), passed: count("pass"), failed: count("fail"), skipped: count("skipped"), logPath };
    writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
    console.log(JSON.stringify(report, null, 2)); process.exitCode = report.exitCode;
  });
});
