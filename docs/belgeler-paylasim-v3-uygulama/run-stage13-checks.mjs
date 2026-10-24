import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const evidence = dirname(fileURLToPath(import.meta.url));
const root = resolve(evidence, "../..");
const mode = process.argv[2];
const buildDistDir = ".next-stage13-isolated";
const shellDataDir = `.test-data/stage13-shell-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const shareSpec = "tests/site-audit/belgeler-share-e2e.spec.ts";
const playwright = "node node_modules/@playwright/test/cli.js test --config=playwright.site.config.ts";
const changed = new Set([
  ...spawnSync("git", ["diff", "--name-only", "HEAD"], { cwd: root, encoding: "utf8" }).stdout.split(/\r?\n/),
  ...spawnSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" }).stdout.split(/\r?\n/),
]);
const lintFiles = [...changed].filter((file) => /\.(?:ts|tsx|js|mjs)$/.test(file) && file && !file.startsWith(".next") && existsSync(resolve(root, file)));
const stage13Config = "docs/belgeler-paylasim-v3-uygulama/playwright.stage13-production.config.ts";
const stage13Manifest = "docs/belgeler-paylasim-v3-uygulama/run-stage13-manifest.mjs";
for (const file of [stage13Config, stage13Manifest]) {
  if (existsSync(resolve(root, file)) && !lintFiles.includes(file)) lintFiles.push(file);
}
const digestFiles = [...changed].filter((file) => file && existsSync(resolve(root, file)) &&
  !file.startsWith("PLAN/") &&
  !file.startsWith("docs/belgeler-paylasim-v3-uygulama/") &&
  !file.startsWith("docs/belgeler-paylasim-bagimsiz-denetim-2026-10-23/"));
const sourceHashes = digestFiles.sort().map((file) => ({ file: file.replaceAll("\\", "/"), sha256: createHash("sha256").update(readFileSync(resolve(root, file))).digest("hex") }));
const worktreeDigest = createHash("sha256").update(JSON.stringify(sourceHashes)).digest("hex");
const head = spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).stdout.trim();
const playwrightEnv = { CI: "1", PLAYWRIGHT_PRODUCTION_SERVER: "1", NEXT_DIST_DIR: buildDistDir, PLAYWRIGHT_PORT: "3005" };
const commands = {
  pdf: { command: "npm.cmd run check:belgeler-pdf", timeoutMs: 600_000, env: { NODE_ENV: "test" } },
  tsc: { command: "node node_modules/typescript/bin/tsc -p tsconfig.next.json --noEmit --incremental false", timeoutMs: 300_000 },
  lint: { command: `node node_modules/eslint/bin/eslint.js ${lintFiles.join(" ")}`, timeoutMs: 300_000 },
  tools: { command: "npm.cmd run check:tools", timeoutMs: 1_200_000, env: { NODE_ENV: "test" } },
  build: { command: "npm.cmd run build", timeoutMs: 900_000, env: { NEXT_DIST_DIR: buildDistDir } },
  share1366: { command: `${playwright} ${shareSpec} --project=chromium-desktop-1366 --timeout=30000`, timeoutMs: 600_000, env: playwrightEnv },
  share320: { command: `${playwright} ${shareSpec} --project=chromium-mobile-320 --timeout=30000`, timeoutMs: 600_000, env: playwrightEnv },
  share390: { command: `${playwright} ${shareSpec} --project=chromium-mobile-390 --timeout=30000`, timeoutMs: 600_000, env: playwrightEnv },
  regressions: { command: `${playwright} tests/site-audit/belgeler-draft-final-regressions.spec.ts tests/site-audit/belgeler-field-focus-regressions.spec.ts tests/site-audit/belgeler-form-view.spec.ts --project=chromium-desktop-1366 --timeout=45000`, timeoutMs: 900_000, env: playwrightEnv },
  shell: { command: `${playwright} tests/site-audit/belgeler-stage13-shell-smoke.spec.ts --project=chromium-desktop-1366 --timeout=45000`, timeoutMs: 300_000, env: { ...playwrightEnv, CI: "true", DOK_ALLOW_LOCAL_STORAGE: "true", DOK_PRODUCTION_RUNTIME_TEST: "true", DOK_LOCAL_DATA_DIR: shellDataDir } },
  mobileShell: { command: `${playwright} tests/site-audit/belgeler-mobile-studio.spec.ts --project=chromium-mobile-390 --grep=scroll-lock --timeout=45000`, timeoutMs: 300_000, env: playwrightEnv },
  pdfViewer: { command: `node node_modules/@playwright/test/cli.js test --config=${stage13Config} tests/document-studio/pdf-viewer-v2.spec.ts --project=chromium --timeout=45000`, timeoutMs: 900_000, env: { CI: "1", PLAYWRIGHT_PRODUCTION_SERVER: "1", NEXT_DIST_DIR: buildDistDir, PLAYWRIGHT_PORT: "3006" } },
};

if (mode === "list") {
  console.log(JSON.stringify({ modes: Object.keys(commands), changedLintFileCount: lintFiles.length, lintFiles }, null, 2));
  process.exit(0);
}
const selected = commands[mode];
if (!selected) throw new Error(`Unknown mode: ${mode}`);
mkdirSync(evidence, { recursive: true });
const logPath = resolve(evidence, `ASAMA_13_${mode}.log`);
const reportPath = resolve(evidence, `ASAMA_13_${mode}.json`);
const env = { ...process.env, ...selected.env };
for (const name of Object.keys(env)) {
  if (/^(?:DATABASE|POSTGRES|NEON|BLOB|VERCEL|BELGE_SHARE_SECRET|CRON_SECRET|SHARE_TOKEN|NODE_OPTIONS|NODE_PATH)/i.test(name)) delete env[name];
}
for (const name of [
  "DATABASE_URL", "POSTGRES_URL", "POSTGRES_URL_NON_POOLING", "BLOB_STORE_ID", "BLOB_READ_WRITE_TOKEN",
  "BLOB_WEBHOOK_PUBLIC_KEY", "BELGE_SHARE_SECRET", "BELGE_SHARE_TOKEN_KEY_VERSION", "BELGE_SHARE_GLOBAL_DAILY_LIMIT",
  "BELGE_SHARE_GLOBAL_MAX_STORAGE_BYTES", "CRON_SECRET", "VERCEL", "VERCEL_ENV", "VERCEL_URL", "VERCEL_OIDC_TOKEN",
]) env[name] = "";
const started = Date.now();
const log = createWriteStream(logPath);
const child = spawn(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", selected.command], {
  cwd: root,
  env,
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});
child.stdout.pipe(log, { end: false });
child.stderr.pipe(log, { end: false });
let timedOut = false;
const timer = setTimeout(() => {
  timedOut = true;
  if (child.pid) spawn("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true }).unref();
}, selected.timeoutMs);
child.on("error", (error) => log.write(`Process start error: ${error.message}\n`));
child.on("close", (exitCode) => {
  clearTimeout(timer);
  log.end(() => {
    const output = readFileSync(logPath, "utf8");
    const hasPlaywrightSummary = /Running \d+ tests? using \d+ worker/.test(output);
    const count = (label) => Number(output.match(new RegExp(`^\\s*(\\d+)\\s+${label}\\b`, "mi"))?.[1] ?? 0);
    const report = {
      mode,
      command: selected.command,
      environment: mode === "shell"
        ? "fresh production build; separate .test-data local docs store enabled; share DB/Blob/Vercel runtime keys empty"
        : "process credential env scrubbed and share DB/Blob/Vercel runtime keys set empty; .env.local has no share DB/Blob settings; Next may still report .env.local loaded",
      head,
      worktreeDigest,
      digestFileCount: sourceHashes.length,
      exitCode: timedOut ? 124 : (exitCode ?? 1),
      timedOut,
      timeoutMs: selected.timeoutMs,
      durationMs: Date.now() - started,
      playwrightSummary: hasPlaywrightSummary ? { passed: count("passed"), failed: count("failed"), skipped: count("skipped") } : null,
      changedLintFileCount: mode === "lint" ? lintFiles.length : undefined,
      buildDistDir: mode === "build" ? buildDistDir : undefined,
      buildId: mode === "build" && existsSync(resolve(root, `${buildDistDir}/BUILD_ID`)) ? readFileSync(resolve(root, `${buildDistDir}/BUILD_ID`), "utf8").trim() : undefined,
      logPath,
    };
    writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.exitCode;
  });
});
